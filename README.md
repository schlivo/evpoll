# Enquête IRVE Copropriété

Site web d'enquête pour évaluer l'intérêt des résidents d'une copropriété pour l'installation de bornes de recharge pour véhicules électriques (IRVE).

## Fonctionnalités

- **Pages informatives** : Accueil, Comprendre les IRVE, Options disponibles, Aides financières, FAQ
- **Formulaire d'enquête** : Multi-étapes avec validation
- **Statistiques temps réel** : Affichage du taux de participation
- **Conformité RGPD** : Données anonymes, hébergement local, consentement explicite

## Stack technique

- **Frontend** : Vue 3 (Composition API) + Vite
- **Backend** : Node.js + Express
- **Base de données** : SQLite (better-sqlite3)
- **Déploiement** : Docker + Traefik

## Structure du projet

```
enquete-irve/
├── .devcontainer/      # Configuration Dev Container
├── frontend/           # Application Vue 3
│   ├── src/
│   │   ├── components/ # Composants réutilisables
│   │   ├── views/      # Pages de l'application
│   │   ├── router/     # Configuration Vue Router
│   │   └── style.css   # Styles globaux
│   └── ...
├── backend/            # API Express
│   ├── src/
│   │   ├── routes/     # Endpoints API
│   │   ├── db.js       # Connexion SQLite
│   │   └── index.js    # Point d'entrée
│   └── data/           # Base de données SQLite
├── Dockerfile          # Build multi-stage
├── docker-compose.yml  # Déploiement avec Traefik
└── README.md
```

## Développement local

### Option 1 : Dev Container (recommandé)

Le projet inclut une configuration Dev Container pour VS Code / GitHub Codespaces.

1. Ouvrir le projet dans VS Code
2. Installer l'extension "Dev Containers"
3. Cmd/Ctrl + Shift + P → "Dev Containers: Reopen in Container"
4. Une fois dans le container, lancer les services :
   - **Cmd/Ctrl + Shift + B** → Lance frontend + backend
   - Ou manuellement dans 2 terminaux :
     ```bash
     cd backend && npm run dev
     cd frontend && npm run dev
     ```
5. Accéder à l'application :
   - Frontend : http://localhost:5173
   - Backend API : http://localhost:3000

### Option 2 : Installation manuelle

#### Prérequis

- Node.js 20+
- npm

#### Installation

```bash
# Installer les dépendances frontend
cd frontend
npm install

# Installer les dépendances backend
cd ../backend
npm install
```

### Lancer en développement

Terminal 1 - Backend :
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend :
```bash
cd frontend
npm run dev
```

L'application est accessible sur http://localhost:5173

## API

### Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | /api/survey | Soumettre une réponse |
| GET | /api/stats | Statistiques agrégées |
| GET | /api/health | Health check |

### Format des données (POST /api/survey)

```json
{
  "building": "A",
  "floor": "2ème",
  "status": "proprietaire",
  "has_ev": "projet",
  "parking_type": "box",
  "interested": "oui",
  "preferred_solution": "enedis",
  "timeline": "1an",
  "comments": "...",
  "email": "email@exemple.fr",
  "consent_contact": true
}
```

## Déploiement

### Build Docker

```bash
docker build -t enquete-irve:latest .
```

### Test local du container

```bash
docker run -p 3000:3000 -v $(pwd)/data:/app/data enquete-irve:latest
```

### Déploiement Docker Compose

1. Modifier le domaine dans `docker-compose.yml`
2. S'assurer que le réseau `traefik-public` existe
3. Déployer :

```bash
docker-compose up -d
```

### Déploiement Docker Swarm

```bash
docker stack deploy -c docker-compose.yml irve
```

## Configuration

Variables d'environnement disponibles :

| Variable | Défaut | Description |
|----------|--------|-------------|
| PORT | 3000 | Port du serveur |
| NODE_ENV | production | Environnement |
| DB_PATH | ./data/survey.db | Chemin de la base SQLite |
| CORS_ORIGIN | http://localhost:5173 | Origine CORS (dev) |

## RGPD

- **Données collectées** : Bâtiment, statut, intérêt pour IRVE, email (optionnel)
- **Finalité** : Enquête interne copropriété
- **Base légale** : Intérêt légitime
- **Conservation** : Fin du projet + 1 an
- **Hébergement** : Serveur privé en France
- **Transfert** : Aucun transfert hors UE, aucun tiers

## Licence

Usage privé - Copropriété
