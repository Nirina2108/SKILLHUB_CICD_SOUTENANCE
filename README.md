# SkillHub — Plateforme de formations en ligne

[![CI/CD](https://github.com/Nirina2108/SKILLHUB_CICD_SOUTENANCE/actions/workflows/cicd.yml/badge.svg)](https://github.com/Nirina2108/SKILLHUB_CICD_SOUTENANCE/actions)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=Nirina2108_SKILLHUB_CICD_SOUTENANCE&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Nirina2108_SKILLHUB_CICD_SOUTENANCE)

Projet Bachelor Concepteur Développeur Web Full Stack — Bloc 03 : Cloud, DevOps et Architecture.

## Description

SkillHub est une plateforme web collaborative qui met en relation des **formateurs** et des **apprenants** autour de formations en ligne. La plateforme permet :

- L'inscription / connexion via JWT (apprenant ou formateur)
- La création / modification de formations avec upload de PDF de cours
- La gestion de modules (leçons) au sein d'une formation
- L'inscription des apprenants aux formations
- Le suivi de progression module par module
- La messagerie 1:1 entre formateurs et apprenants
- Le journal d'activité dans MongoDB

## Architecture

Microservices conteneurisés :

| Service | Stack | Port hôte |
|---|---|---|
| **skillhub-front** | React 19 + Vite | 5173 |
| **skillhub-back** | Laravel 11 + PHP 8.2 + JWT | 8001 |
| **springboot** | Spring Boot 3.5 + Java 17 (auth HMAC alternatif) | 8000 |
| **mysql** | MySQL 8.0 | 3307 |
| **mongodb** | MongoDB 7.0 | 27017 |

Le frontend appelle l'API Laravel pour la logique métier. Le service Spring Boot est un POC d'authentification HMAC challenge-response (preuve de mot de passe sans transmission en clair).

## Prérequis

- **Docker Desktop** + Docker Compose v2
- **Git**
- (Pour développement local hors Docker : Node.js 20+, PHP 8.2 + Composer, Java 17 + Maven)

## Lancement rapide

```bash
# Cloner le dépôt
git clone https://github.com/Nirina2108/SKILLHUB_CICD_SOUTENANCE.git
cd SKILLHUB_CICD_SOUTENANCE

# Copier les variables d'environnement
cp .env.example .env

# Démarrer la stack complète
docker compose up --build -d

# Lancer les migrations Laravel (1ère fois)
docker compose exec skillhub-back php artisan migrate --force
docker compose exec skillhub-back php artisan storage:link
```

L'application est disponible sur :

- Frontend : http://localhost:5173
- Backend API : http://localhost:8001/api
- Auth Spring Boot : http://localhost:8000

## Lancer les tests

```bash
# Frontend (Vitest)
docker compose exec frontend npm test

# Backend Laravel (PHPUnit + Xdebug coverage)
docker compose exec skillhub-back php artisan test

# Spring Boot (Maven + JaCoCo)
cd springboot && ./mvnw verify
```

## Structure du dépôt

```
SKILLHUB_CICD_SOUTENANCE/
├── skillhub-front/         # Frontend React 19 + Vite
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── skillhub-back/          # Backend Laravel 11
│   ├── Dockerfile
│   ├── app/
│   ├── routes/
│   └── composer.json
├── springboot/             # Auth Service Spring Boot 3.5
│   ├── Dockerfile
│   ├── src/main/java/
│   └── pom.xml
├── .github/
│   └── workflows/
│       └── cicd.yml        # Pipeline CI/CD GitHub Actions
├── docker-compose.yml      # Orchestration de la stack
├── .env.example            # Variables d'environnement (template)
├── .dockerignore
├── .gitignore
├── .gitattributes
├── CONTRIBUTING.md         # Stratégie Git, rôles, conventions
└── README.md
```

## Variables d'environnement

Voir [`.env.example`](./.env.example) pour la liste complète. Variables sensibles à régénérer en production :

- `APP_KEY` (Laravel) — `php artisan key:generate`
- `JWT_SECRET` — chaîne ≥ 32 caractères
- `MYSQL_ROOT_PASSWORD` — mot de passe MySQL
- `APP_SECURITY_SMK` (Spring Boot) — clé AES de chiffrement des mots de passe

## Stratégie de branches

Voir [`CONTRIBUTING.md`](./CONTRIBUTING.md) pour le détail.

- `main` : production, code stable
- `dev` : intégration, accumulation des features
- `feature/<nom>` : développement par fonctionnalité
- `hotfix/<nom>` : correctifs urgents

## CI/CD

Le pipeline [`.github/workflows/cicd.yml`](./.github/workflows/cicd.yml) s'exécute automatiquement sur push de toute branche :

1. **Spring Boot** : build Maven + tests JUnit + JaCoCo coverage + Sonar
2. **Laravel** : install Composer + tests PHPUnit + clover coverage + Sonar
3. **React** : npm ci + Vitest run
4. **Docker** (uniquement sur `main`) : build et push 3 images vers Docker Hub avec tag git SHA

Secrets requis dans GitHub Settings → Secrets :

- `DOCKER_USERNAME` / `DOCKER_PASSWORD`
- `SONAR_TOKEN`

## Documentation

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — stratégie Git, conventions de commit, rôles
- Rapport d'audit cloud (PDF) — voir dossier `docs/` (à venir)
- Diagrammes C4 (Context + Container) — voir dossier `docs/` (à venir)

## Licence

Projet pédagogique — Bachelor CDWFS, promotion 2025/2026.
