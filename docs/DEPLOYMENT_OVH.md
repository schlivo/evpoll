# Déploiement sur VPS OVH

Guide complet pour déployer EV Poll sur un VPS OVH avec nom de domaine et HTTPS.

## Prérequis

- Un compte OVH
- Un nom de domaine (enregistré chez OVH ou ailleurs)
- ~30 minutes

## Coût estimé

| Service | Prix |
|---------|------|
| VPS Starter OVH | ~4€/mois |
| Nom de domaine .fr | ~7€/an |
| Certificat SSL | Gratuit (Let's Encrypt) |

---

## Étape 1 : Commander le VPS

1. Aller sur [OVH VPS](https://www.ovhcloud.com/fr/vps/)
2. Choisir **VPS Starter** (suffisant pour EV Poll)
   - 1 vCPU
   - 2 Go RAM
   - 20 Go SSD
3. Sélectionner **Ubuntu 24.04 LTS**
4. Zone : France (ou la plus proche de vos utilisateurs)
5. Valider la commande

Vous recevrez un email avec :
- Adresse IP du VPS
- Nom d'utilisateur (`ubuntu`)
- Mot de passe temporaire

---

## Étape 2 : Configurer le DNS

### Si le domaine est chez OVH

1. **OVH Manager** → **Noms de domaine** → votre domaine
2. **Zone DNS** → **Ajouter une entrée**

| Type | Sous-domaine | Cible |
|------|--------------|-------|
| A | *(vide)* | `IP_DU_VPS` |
| A | www | `IP_DU_VPS` |

### Si le domaine est ailleurs

Ajoutez les mêmes enregistrements A dans l'interface de votre registrar.

> ⏳ La propagation DNS peut prendre 5-30 minutes.

---

## Étape 3 : Générer une clé SSH (sur votre machine locale)

```bash
# Générer une clé Ed25519 (recommandé)
ssh-keygen -t ed25519 -C "evpoll-vps" -f ~/.ssh/evpoll_vps

# Afficher la clé publique
cat ~/.ssh/evpoll_vps.pub
```

Copiez la clé publique (commence par `ssh-ed25519...`).

---

## Étape 4 : Première connexion au VPS

```bash
# Connexion avec mot de passe (première fois)
ssh ubuntu@IP_DU_VPS
```

À la première connexion, vous devrez changer le mot de passe.

### Ajouter votre clé SSH

```bash
# Sur le VPS
mkdir -p ~/.ssh
echo "VOTRE_CLE_PUBLIQUE_ICI" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Testez la connexion par clé :

```bash
# Depuis votre machine locale
ssh -i ~/.ssh/evpoll_vps ubuntu@IP_DU_VPS
```

---

## Étape 5 : Sécuriser le VPS

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installer les outils de sécurité
sudo apt install -y fail2ban ufw curl git

# Configurer le firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# Configurer Fail2ban (protection brute-force)
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Désactiver l'authentification par mot de passe SSH
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> ⚠️ **Important** : Assurez-vous que la connexion par clé SSH fonctionne AVANT de désactiver les mots de passe !

---

## Étape 6 : Installer Node.js et les dépendances

```bash
# Installer Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # v20.x.x
npm --version   # 10.x.x

# Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Installer Nginx
sudo apt install -y nginx

# Installer Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

---

## Étape 7 : Déployer l'application

```bash
# Cloner le projet
cd /var/www
sudo git clone https://github.com/schlivo/evpoll.git
sudo chown -R ubuntu:ubuntu evpoll
cd evpoll

# Installer les dépendances backend
cd backend
npm install --production

# Créer le dossier de données
mkdir -p data

# Configurer l'environnement
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
ADMIN_PASSWORD=VotreMotDePasseSecurise123!
COPRO_NAME=Ma Copropriété
BUILDINGS=A,B,C,D
TOTAL_LOTS=75
CONTACT_EMAIL=conseil-syndical@exemple.fr
EOF

# Compiler le frontend
cd ../frontend
npm install
npm run build
cp -r dist ../backend/public

# Lancer avec PM2
cd ../backend
pm2 start src/index.js --name evpoll
pm2 save

# Configurer le démarrage automatique
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Exécutez la commande affichée par PM2
```

---

## Étape 8 : Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/evpoll
```

Collez cette configuration (remplacez `votre-domaine.fr`) :

```nginx
server {
    listen 80;
    server_name votre-domaine.fr www.votre-domaine.fr;

    location / {
        proxy_pass http://127.0.0.1:3000;
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
sudo ln -sf /etc/nginx/sites-available/evpoll /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Étape 9 : Activer HTTPS avec Let's Encrypt

```bash
# Obtenir le certificat SSL (remplacez votre-domaine.fr)
sudo certbot --nginx -d votre-domaine.fr -d www.votre-domaine.fr

# Répondez aux questions :
# - Email : votre email (pour les alertes d'expiration)
# - Agree : Y
# - Share email : N (optionnel)
# - Redirect HTTP to HTTPS : 2 (Yes)
```

Le certificat se renouvelle automatiquement. Testez :

```bash
sudo certbot renew --dry-run
```

---

## Étape 10 : Vérifier le déploiement

```bash
# Tester l'API
curl https://votre-domaine.fr/api/health

# Vérifier PM2
pm2 status

# Vérifier les logs
pm2 logs evpoll
```

Ouvrez `https://votre-domaine.fr` dans votre navigateur.

---

## Commandes utiles

### Gestion de l'application

```bash
# Voir les logs
pm2 logs evpoll

# Redémarrer l'app
pm2 restart evpoll

# Arrêter l'app
pm2 stop evpoll

# Statut
pm2 status
```

### Mise à jour de l'application

```bash
cd /var/www/evpoll
git pull
cd frontend && npm install && npm run build
cp -r dist ../backend/public
cd ../backend && npm install --production
pm2 restart evpoll
```

### Sauvegarde de la base de données

```bash
# Créer une sauvegarde
cp /var/www/evpoll/backend/data/survey.db ~/backup-$(date +%Y%m%d).db

# Restaurer une sauvegarde
cp ~/backup-YYYYMMDD.db /var/www/evpoll/backend/data/survey.db
pm2 restart evpoll
```

### Renouveler le certificat SSL (automatique, mais si besoin)

```bash
sudo certbot renew
```

---

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs evpoll --lines 50

# Vérifier que le port n'est pas utilisé
sudo lsof -i :3000

# Reconstruire les modules natifs (si erreur SQLite)
cd /var/www/evpoll/backend
npm rebuild
pm2 restart evpoll
```

### Certificat SSL expiré

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que l'app tourne
pm2 status

# Redémarrer si besoin
pm2 restart evpoll

# Vérifier Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Problème de permissions

```bash
sudo chown -R ubuntu:ubuntu /var/www/evpoll
chmod -R 755 /var/www/evpoll
chmod 700 /var/www/evpoll/backend/data
```

---

## Sécurité supplémentaire (optionnel)

### Changer le port SSH

```bash
sudo nano /etc/ssh/sshd_config
# Modifier : Port 2222

sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
sudo systemctl restart ssh
```

Connexion : `ssh -p 2222 -i ~/.ssh/evpoll_vps ubuntu@IP_DU_VPS`

### Mises à jour automatiques

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
# Répondre "Yes"
```

---

## Ressources

- [Documentation OVH VPS](https://docs.ovh.com/fr/vps/)
- [Let's Encrypt](https://letsencrypt.org/fr/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
