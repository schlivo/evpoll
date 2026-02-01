# Déploiement Multi-Tenant

Guide pour héberger plusieurs instances d'EV Poll sur un même serveur VPS, chacune avec son propre sous-domaine.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │              Nginx                   │
                    │         (Reverse Proxy)              │
                    └─────────────────────────────────────┘
                              │           │
              ┌───────────────┘           └───────────────┐
              ▼                                           ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│  demo.evpoll.app        │               │  cedeg.evpoll.app       │
│  Port 3000              │               │  Port 3001              │
│  /var/www/evpoll        │               │  /var/www/evpoll-cedeg  │
└─────────────────────────┘               └─────────────────────────┘
              │                                           │
              ▼                                           ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│  data/survey.db         │               │  data/survey.db         │
│  (Base de données)      │               │  (Base de données)      │
└─────────────────────────┘               └─────────────────────────┘
```

Chaque instance :
- Tourne sur un port différent (3000, 3001, 3002...)
- A sa propre base de données SQLite
- A sa propre configuration (nom de copro, bâtiments, etc.)
- Est accessible via un sous-domaine distinct

---

## Prérequis

- Un VPS avec EV Poll déjà déployé (voir [DEPLOYMENT_OVH.md](DEPLOYMENT_OVH.md))
- Un nom de domaine avec accès à la zone DNS
- Nginx et Certbot installés

---

## Étape 1 : Configurer le DNS

Ajoutez un enregistrement A pour le nouveau sous-domaine :

| Type | Nom | Cible |
|------|-----|-------|
| A | `nouveau-client` | `IP_DU_VPS` |

> ⏳ Attendez 5-15 minutes pour la propagation DNS.

Vérifiez avec :
```bash
dig nouveau-client.votre-domaine.fr +short
# Doit retourner l'IP du VPS
```

---

## Étape 2 : Créer une nouvelle instance

### Copier l'application

```bash
# Se connecter au VPS
ssh ubuntu@IP_DU_VPS

# Copier l'instance existante
cd /var/www
sudo cp -r evpoll evpoll-nouveau-client
sudo chown -R ubuntu:ubuntu evpoll-nouveau-client

# Créer un dossier data vide (nouvelle base de données)
cd evpoll-nouveau-client/backend
rm -rf data
mkdir -p data
```

### Créer le fichier de configuration PM2

> **Pourquoi `ecosystem.config.cjs` et pas `.env` ?**
>
> Node.js ne charge **pas** automatiquement les fichiers `.env`. Il faudrait ajouter
> le package `dotenv` comme dépendance. On utilise plutôt `ecosystem.config.cjs` car :
>
> - ✅ Pas de dépendance npm supplémentaire
> - ✅ PM2 gère nativement les variables d'environnement
> - ✅ Configuration explicite par instance
> - ✅ Fichier `.cjs` (CommonJS) requis car PM2 ne supporte pas ESM pour les configs
>
> ⚠️ **Sécurité** : Ne commitez jamais ce fichier dans git (contient le mot de passe admin).
> Ajoutez `ecosystem.config.cjs` à votre `.gitignore`.

Créez `/var/www/evpoll-nouveau-client/backend/ecosystem.config.cjs` :

```javascript
module.exports = {
  apps: [{
    name: 'evpoll-nouveau-client',
    script: 'src/index.js',
    cwd: '/var/www/evpoll-nouveau-client/backend',
    env: {
      PORT: 3001,                    // Port unique (3001, 3002, etc.)
      NODE_ENV: 'production',
      ADMIN_PASSWORD: 'MotDePasseSecurise123!',
      COPRO_NAME: 'Résidence Nouveau Client',
      BUILDINGS: 'A,B,C',            // Bâtiments de la copro
      TOTAL_LOTS: 50,                // Nombre de lots
      CONTACT_EMAIL: 'conseil@nouveau-client.fr'
    }
  }]
};
```

> ⚠️ **Important** : Chaque instance doit avoir un `PORT` différent et un `name` unique.

### Lancer l'instance

```bash
cd /var/www/evpoll-nouveau-client/backend
pm2 start ecosystem.config.cjs
pm2 save
```

Vérifiez que l'instance tourne :
```bash
pm2 list
curl http://localhost:3001/api/config
```

---

## Étape 3 : Configurer Nginx

Créez `/etc/nginx/sites-available/evpoll-nouveau-client` :

```nginx
server {
    listen 80;
    server_name nouveau-client.votre-domaine.fr;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site :

```bash
sudo ln -sf /etc/nginx/sites-available/evpoll-nouveau-client /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Étape 4 : Activer HTTPS

```bash
sudo certbot --nginx -d nouveau-client.votre-domaine.fr
```

Certbot va :
1. Obtenir un certificat Let's Encrypt
2. Configurer automatiquement Nginx pour HTTPS
3. Mettre en place le renouvellement automatique

---

## Gestion des instances

### Voir toutes les instances

```bash
pm2 list
```

### Redémarrer une instance

```bash
pm2 restart evpoll-nouveau-client
```

### Voir les logs

```bash
pm2 logs evpoll-nouveau-client
```

### Arrêter une instance

```bash
pm2 stop evpoll-nouveau-client
```

### Supprimer une instance

```bash
pm2 delete evpoll-nouveau-client
pm2 save
sudo rm /etc/nginx/sites-enabled/evpoll-nouveau-client
sudo rm /etc/nginx/sites-available/evpoll-nouveau-client
sudo systemctl reload nginx
sudo rm -rf /var/www/evpoll-nouveau-client
```

---

## Mise à jour de toutes les instances

Script pour mettre à jour toutes les instances :

```bash
#!/bin/bash
# update-all-instances.sh

# Mettre à jour le code source
cd /var/www/evpoll
git pull
cd frontend && npm install && npm run build

# Copier le nouveau build vers toutes les instances
for instance in /var/www/evpoll*/; do
    if [ -d "$instance/backend" ]; then
        echo "Mise à jour de $instance..."
        cp -r /var/www/evpoll/frontend/dist/* "$instance/backend/public/"
    fi
done

# Redémarrer toutes les instances evpoll
pm2 restart all --only evpoll evpoll-cedeg evpoll-nouveau-client
```

---

## Ressources serveur

### Estimation mémoire

| Instances | RAM utilisée | VPS recommandé |
|-----------|--------------|----------------|
| 1-3       | ~200 Mo      | Starter (2 Go) |
| 4-10      | ~500 Mo      | Essential (4 Go) |
| 10+       | ~1 Go+       | Comfort (8 Go) |

### Monitoring

```bash
# Utilisation mémoire par instance
pm2 monit

# Statistiques globales
pm2 status
```

---

## Sauvegardes

### Sauvegarder toutes les bases de données

```bash
#!/bin/bash
# backup-all.sh

BACKUP_DIR=~/backups/$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

for instance in /var/www/evpoll*/; do
    name=$(basename $instance)
    if [ -f "$instance/backend/data/survey.db" ]; then
        cp "$instance/backend/data/survey.db" "$BACKUP_DIR/$name.db"
        echo "Sauvegardé: $name"
    fi
done

echo "Sauvegardes dans: $BACKUP_DIR"
```

### Restaurer une base de données

```bash
cp ~/backups/20260201/evpoll-cedeg.db /var/www/evpoll-cedeg/backend/data/survey.db
pm2 restart evpoll-cedeg
```

---

## Dépannage

### L'instance ne démarre pas (EADDRINUSE)

Le port est déjà utilisé. Vérifiez :
```bash
lsof -i :3001
```

Solution : Utilisez un port différent dans `ecosystem.config.cjs`.

### 502 Bad Gateway

L'instance PM2 ne tourne pas ou est sur le mauvais port.

```bash
# Vérifier l'état
pm2 list

# Voir les logs d'erreur
pm2 logs evpoll-nouveau-client --err

# Redémarrer
pm2 restart evpoll-nouveau-client
```

### Certificat SSL non valide

```bash
# Renouveler manuellement
sudo certbot renew

# Ou regénérer pour un domaine spécifique
sudo certbot --nginx -d nouveau-client.votre-domaine.fr --force-renewal
```

---

## Exemple complet

Créer une instance pour "Résidence Les Lilas" sur `lilas.evpoll.app` :

```bash
# 1. DNS : Ajouter A record lilas -> IP_VPS

# 2. Copier l'application
cd /var/www
sudo cp -r evpoll evpoll-lilas
sudo chown -R ubuntu:ubuntu evpoll-lilas
rm -rf evpoll-lilas/backend/data && mkdir evpoll-lilas/backend/data

# 3. Configuration PM2
cat > /var/www/evpoll-lilas/backend/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'evpoll-lilas',
    script: 'src/index.js',
    cwd: '/var/www/evpoll-lilas/backend',
    env: {
      PORT: 3002,
      NODE_ENV: 'production',
      ADMIN_PASSWORD: 'LilasSecure2026!',
      COPRO_NAME: 'Résidence Les Lilas',
      BUILDINGS: '1,2,3,4,5',
      TOTAL_LOTS: 120,
      CONTACT_EMAIL: 'cs@residence-lilas.fr'
    }
  }]
};
EOF

# 4. Lancer PM2
cd /var/www/evpoll-lilas/backend
pm2 start ecosystem.config.cjs
pm2 save

# 5. Nginx
sudo tee /etc/nginx/sites-available/evpoll-lilas > /dev/null << 'EOF'
server {
    listen 80;
    server_name lilas.evpoll.app;
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/evpoll-lilas /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. SSL
sudo certbot --nginx -d lilas.evpoll.app --non-interactive --agree-tos -m admin@evpoll.app

# 7. Vérifier
curl https://lilas.evpoll.app/api/health
```

---

## Voir aussi

- [DEPLOYMENT_OVH.md](DEPLOYMENT_OVH.md) - Guide de déploiement initial
- [README.md](../README.md) - Documentation principale
