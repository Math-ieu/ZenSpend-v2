variable "aws_region" {
  description = "Région AWS principale (ressources régionales)."
  type        = string
  default     = "eu-west-3" # Paris
}

variable "project" {
  description = "Préfixe de nommage des ressources."
  type        = string
  default     = "zenspend"
}

variable "environment" {
  description = "Nom de l'environnement (prod, staging...)."
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR du VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Nombre de zones de disponibilité (2 minimum pour l'ALB et RDS)."
  type        = number
  default     = 2
}

# ---- Backend (ECS Fargate) -------------------------------------------------

variable "backend_image_tag" {
  description = "Tag de l'image backend dans ECR à déployer."
  type        = string
  default     = "latest"
}

variable "backend_cpu" {
  description = "CPU de la tâche Fargate (256 = 0.25 vCPU)."
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Mémoire de la tâche Fargate (Mo)."
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Nombre de tâches backend souhaitées."
  type        = number
  default     = 2
}

variable "django_debug" {
  description = "Valeur de DEBUG côté Django (doit rester false en prod)."
  type        = string
  default     = "false"
}

variable "allowed_hosts" {
  description = "ALLOWED_HOSTS Django. '*' est acceptable derrière ALB + CloudFront ; restreindre si un domaine est ajouté."
  type        = string
  default     = "*"
}

# ---- Base de données (RDS PostgreSQL) --------------------------------------

variable "db_instance_class" {
  description = "Classe d'instance RDS."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Stockage RDS alloué (Go)."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Nom de la base PostgreSQL."
  type        = string
  default     = "zenspend_db"
}

variable "db_username" {
  description = "Utilisateur maître PostgreSQL."
  type        = string
  default     = "zenspend"
}

variable "db_multi_az" {
  description = "Activer le Multi-AZ RDS (haute dispo, coût ~x2)."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags additionnels appliqués à toutes les ressources."
  type        = map(string)
  default     = {}
}

# ---- CI/CD (GitHub Actions OIDC) -------------------------------------------

variable "github_repo" {
  description = "Dépôt GitHub autorisé à déployer, au format owner/repo."
  type        = string
  default     = "Math-ieu/ZenSpend-v2"
}

variable "create_github_oidc_provider" {
  description = "Créer le provider OIDC GitHub. Mettre false s'il existe déjà dans le compte."
  type        = bool
  default     = true
}
