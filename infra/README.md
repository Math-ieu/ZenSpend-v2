# Infrastructure AWS (Terraform)

Déploiement de ZenSpend sur AWS : backend Django sur **ECS Fargate** derrière un
**ALB**, base **RDS PostgreSQL**, frontend **S3 + CloudFront**, et tâches cron via
**EventBridge Scheduler**.

## Architecture

```
                 ┌─────────────┐        ┌──────────────────────────┐
   App mobile ──▶│ CloudFront  │──HTTP─▶│ ALB ─▶ ECS Fargate (Django) │
   (HTTPS)       │   (API)     │        │            │                │
                 └─────────────┘        │            ▼                │
                                        │      RDS PostgreSQL         │
   Web ─────────▶┌─────────────┐        └──────────────────────────┘
   (HTTPS)       │ CloudFront  │──▶ S3 (build SPA)
                 │ (frontend)  │
                 └─────────────┘

   EventBridge Scheduler ──▶ ECS RunTask (purge_deleted_accounts, …)
```

Sans domaine custom, **CloudFront fournit le HTTPS** (`*.cloudfront.net`) requis
par le Play Store, devant l'ALB (HTTP interne). Quand un domaine sera disponible :
créer un certificat ACM (us-east-1 pour CloudFront) et ajouter les `aliases`.

## Prérequis

- Terraform ≥ 1.5, AWS CLI configuré (`aws configure`), Docker.
- (Recommandé) Backend de state distant : créer un bucket S3 + table DynamoDB,
  puis décommenter le bloc `backend "s3"` dans `versions.tf`.

## 1. Provisionner l'infra

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # ajuster si besoin
terraform init
terraform apply
```

Au premier `apply`, le service ECS ne démarrera pas tant qu'aucune image n'est
poussée (étape 2) — c'est normal.

## 2. Construire et pousser l'image backend

```bash
cd ../..                       # racine du repo
AWS_REGION=$(terraform -chdir=infra/terraform output -raw 2>/dev/null; echo eu-west-3)
ECR=$(terraform -chdir=infra/terraform output -raw ecr_repository_url)
ACCOUNT=${ECR%%.*}

aws ecr get-login-password --region eu-west-3 \
  | docker login --username AWS --password-stdin "${ECR%/*}"

docker build -f zenspendproject/Dockerfile.prod -t "$ECR:latest" .
docker push "$ECR:latest"

# Forcer le déploiement du nouveau code
aws ecs update-service \
  --cluster  $(terraform -chdir=infra/terraform output -raw ecs_cluster) \
  --service  $(terraform -chdir=infra/terraform output -raw ecs_service) \
  --force-new-deployment --region eu-west-3
```

Le conteneur applique les migrations et `collectstatic` au démarrage (web only).

## 3. Déployer le frontend

```bash
API_URL=$(terraform -chdir=infra/terraform output -raw api_url)

cd zenspendfrontend
VITE_API_URL="$API_URL" npm run build

BUCKET=$(terraform -chdir=../infra/terraform output -raw frontend_bucket)
CF_ID=$(terraform -chdir=../infra/terraform output -raw frontend_cloudfront_id)

aws s3 sync dist/ "s3://$BUCKET/" --delete
aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*"
```

## 4. Mobile

Mettre l'URL de l'API dans `zenspendmobile/.env` avant le build EAS :

```
EXPO_PUBLIC_API_URL=<sortie `terraform output api_url`>
```

## Tâches planifiées (cron)

Gérées par EventBridge Scheduler (voir `schedules.tf`) — aucune action requise :

| Job | Heure (UTC) |
| --- | --- |
| `generate_recurring_transactions` | 00:30 |
| `purge_deleted_accounts` | 03:00 |
| `generate_notifications` | 07:00 |

Lancer un job à la demande :

```bash
aws ecs run-task --cluster <cluster> --launch-type FARGATE \
  --task-definition zenspend-prod-backend \
  --network-configuration '{"awsvpcConfiguration":{"subnets":[...],"securityGroups":[...]}}' \
  --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","purge_deleted_accounts"]}]}'
```

## CI/CD (GitHub Actions)

Trois workflows dans `.github/workflows/` :

| Workflow | Déclencheur | Action |
| --- | --- | --- |
| `ci.yml` | PR + push main | Tests backend, type-check/build frontend |
| `deploy-backend.yml` | push main sur `zenspendproject/**` | Build image → ECR → redéploiement ECS |
| `deploy-frontend.yml` | push main sur `zenspendfrontend/**` | Build SPA → S3 → invalidation CloudFront |

L'authentification AWS se fait par **OIDC** (rôle `…-github-deploy` créé par
Terraform), donc **aucune clé d'accès AWS** n'est stockée dans GitHub.

### Configurer le dépôt (une seule fois)

Récupérer les valeurs :

```bash
cd infra/terraform
terraform output -raw github_deploy_role_arn   # → secret AWS_DEPLOY_ROLE_ARN
terraform output -raw aws_region               # → variable AWS_REGION
terraform output -raw frontend_cloudfront_id   # → variable FRONTEND_CF_ID
terraform output -raw api_url                  # → variable VITE_API_URL
```

Puis, via l'UI GitHub (*Settings → Secrets and variables → Actions*) ou la CLI `gh` :

```bash
gh secret  set AWS_DEPLOY_ROLE_ARN --body "$(terraform -chdir=infra/terraform output -raw github_deploy_role_arn)"
gh variable set AWS_REGION        --body "$(terraform -chdir=infra/terraform output -raw aws_region)"
gh variable set FRONTEND_CF_ID    --body "$(terraform -chdir=infra/terraform output -raw frontend_cloudfront_id)"
gh variable set VITE_API_URL      --body "$(terraform -chdir=infra/terraform output -raw api_url)"
```

Ensuite chaque push sur `main` déploie automatiquement. Premier déploiement :
lancer manuellement les deux workflows (*Actions → Run workflow*) pour amorcer
l'image backend et le frontend.

## Notes & coûts

- **NAT gateway** (~32 USD/mois) + **ALB** (~18 USD/mois) + **RDS t4g.micro** +
  **Fargate** (2 tâches). Pour réduire : `db_multi_az=false` (défaut),
  `backend_desired_count=1`.
- `ALLOWED_HOSTS="*"` est acceptable derrière ALB + CloudFront ; restreindre dès
  qu'un domaine custom est branché.
- `deletion_protection=true` sur RDS : pour détruire, passer la variable à false
  d'abord. `terraform destroy` échouera sinon (volontaire).
- Secrets (`SECRET_KEY`, mot de passe DB) générés par Terraform et stockés dans
  Secrets Manager ; jamais en clair dans le state lisible côté conteneur.
