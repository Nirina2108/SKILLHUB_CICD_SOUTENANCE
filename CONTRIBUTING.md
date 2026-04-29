# Guide de contribution — SkillHub

Ce document décrit les conventions, la stratégie Git et le processus de développement adoptés sur le projet SkillHub. Toute contribution doit respecter ces règles.

## Répartition des rôles

Le projet Bloc 03 est réalisé en groupe de 3 étudiants. Chaque membre est responsable d'un rôle principal.

| Rôle | Responsabilités principales | Livrables pilotés |
|---|---|---|
| **Cloud Architect** | Rapport d'audit cloud, comparaison fournisseurs, schéma d'architecture, plan budgétaire | Rapport d'audit, schéma C4, tableau comparatif AWS/GCP/OVH |
| **DevOps Engineer** | Dockerfiles, docker-compose.yml, pipeline CI/CD GitHub Actions | `Dockerfile` × 3, `docker-compose.yml`, `.github/workflows/cicd.yml` |
| **Tech Lead** | Versionning Git, CONTRIBUTING.md, orchestration, sécurité, coordination générale | `CONTRIBUTING.md`, `README.md`, scan vulnérabilités, code reviews |

## Stratégie de branches

| Branche | Rôle | Règles |
|---|---|---|
| `main` | Production — code stable uniquement | Aucun commit direct. Merge via PR depuis `dev` uniquement. |
| `dev` | Intégration — accumule les fonctionnalités validées | Cible de merge des `feature/*`. |
| `feature/<nom>` | Une branche par fonctionnalité ou tâche | Branchée depuis `dev`. Mergée dans `dev` via PR. |
| `hotfix/<nom>` | Correctifs urgents | Branchée depuis `main`. Mergée dans `main` ET `dev`. |

### Cycle type d'une feature

```bash
git checkout dev
git pull
git checkout -b feature/upload-pdf
# ... développement + commits ...
git push -u origin feature/upload-pdf
# Ouvrir une Pull Request feature/upload-pdf → dev sur GitHub
# Après approbation et merge :
git checkout dev
git pull
```

## Convention de commit (Conventional Commits)

Format : `<type>(<scope>): <message court>`

### Types acceptés

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation (README, CONTRIBUTING, commentaires) |
| `docker` | Ajout ou modification des fichiers de conteneurisation |
| `ci` | Modification du pipeline CI/CD |
| `chore` | Maintenance, dépendances |
| `refactor` | Refactorisation sans changement fonctionnel |
| `test` | Ajout ou modification de tests |
| `style` | Formatage, espaces (sans changement de code) |
| `perf` | Amélioration de performance |

### Exemples

```
feat(api): add JWT authentication middleware
fix(front): resolve port conflict in vite.config.js
docker: add multi-stage Dockerfile for React front-end
ci: configure GitHub Actions pipeline with lint and test stages
docs: update README with docker compose up instructions
test(back): add unit tests for FormationController
refactor(front): extract scroll animation logic into custom hook
```

### Scope

Le scope (entre parenthèses) précise la zone touchée. Exemples : `api`, `front`, `back`, `springboot`, `ci`, `docker`.

## Procédure de Pull Request

1. **Branche** : Créer une branche `feature/<description-courte>` depuis `dev`.
2. **Développement** : Commits atomiques, messages clairs, format Conventional Commits.
3. **Tests** : S'assurer que les tests passent localement (`npm test`, `php artisan test`, `./mvnw verify`).
4. **Push** : `git push -u origin feature/<nom>`.
5. **Pull Request** : Ouvrir une PR vers `dev` avec :
   - Titre au format Conventional Commits
   - Description : contexte, ce qui a changé, comment tester
   - Lien vers l'issue/ticket si applicable
   - Au moins 1 reviewer assigné
6. **Review** : Répondre aux commentaires, ajuster le code, re-pousser.
7. **Merge** : Une fois approuvé et CI verte, merge via "Squash and merge" ou "Merge commit" selon le cas.
8. **Suppression** : Supprimer la branche `feature/*` après merge.

## Procédure de résolution de conflits

```bash
# Sur ta branche feature
git checkout feature/<nom>
git fetch origin
git rebase origin/dev

# Si conflits :
# - Éditer les fichiers en conflit (chercher les <<<<<<<)
# - git add <fichier-résolu>
# - git rebase --continue

# Quand le rebase est terminé :
git push --force-with-lease
```

⚠️ **Ne jamais utiliser `--force` simple** — toujours `--force-with-lease` qui empêche d'écraser les commits d'un collègue.

## Tests obligatoires avant Pull Request

| Composant | Commande | Critère |
|---|---|---|
| Frontend | `cd skillhub-front && npm test` | 100 % verts |
| Backend Laravel | `docker compose exec skillhub-back php artisan test` | 100 % verts |
| Spring Boot | `cd springboot && ./mvnw verify` | 100 % verts + JaCoCo ≥ 96 % |

## Stack et conventions techniques

### Frontend (skillhub-front)

- React 19 + Vite + React Router 7
- Pas de TypeScript (JSX pur)
- Pas de framework UI (CSS pur, glassmorphism, animations CSS)
- Tests : Vitest + jsdom

### Backend Laravel (skillhub-back)

- PHP 8.2 + Laravel 11
- JWT via tymon/jwt-auth
- MySQL pour les données métier
- MongoDB pour les logs d'activité
- Tests : PHPUnit + Xdebug coverage

### Auth Spring Boot (springboot)

- Java 17 + Spring Boot 3.5
- HMAC challenge-response (POC)
- MySQL pour la persistence (port 3307 en dev local)
- Tests : JUnit 5 + JaCoCo (seuil 96 %)

## Sécurité

- **Aucune credential** dans le dépôt (`.env`, `auth.json`, clés privées sont gitignored)
- **`.env.example`** versionné avec valeurs factices
- **Secrets CI/CD** dans GitHub Secrets : `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SONAR_TOKEN`
- **Images Docker** : sources officielles uniquement, tags précis (pas `latest`)
- **Code review** obligatoire avant merge sur `dev`

## Liens utiles

- Repo : https://github.com/Nirina2108/SKILLHUB_CICD_SOUTENANCE
- Pipeline CI/CD : https://github.com/Nirina2108/SKILLHUB_CICD_SOUTENANCE/actions
- SonarCloud : https://sonarcloud.io/project/overview?id=Nirina2108_SKILLHUB_CICD_SOUTENANCE
- Conventional Commits : https://www.conventionalcommits.org/
