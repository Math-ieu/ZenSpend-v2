# Mot de passe RDS et clé secrète Django générés et stockés dans Secrets Manager.
# Les tâches ECS les injectent comme variables d'environnement via `secrets`.

resource "random_password" "db" {
  length  = 32
  special = false # évite les caractères problématiques dans les URL de connexion
}

resource "random_password" "django_secret" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.name}/db-password"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db.result
}

resource "aws_secretsmanager_secret" "django_secret_key" {
  name                    = "${local.name}/django-secret-key"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "django_secret_key" {
  secret_id     = aws_secretsmanager_secret.django_secret_key.id
  secret_string = random_password.django_secret.result
}
