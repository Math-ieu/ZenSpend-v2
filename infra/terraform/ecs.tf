resource "aws_ecs_cluster" "main" {
  name = "${local.name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name}-backend"
  retention_in_days = 30
}

locals {
  backend_image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

  # Variables d'environnement non sensibles passées au conteneur Django.
  backend_environment = [
    { name = "DEBUG", value = var.django_debug },
    { name = "DJANGO_SETTINGS_MODULE", value = "zenspendproject.settings" },
    # TLS terminé par CloudFront (redirect-to-https au edge) ; le hop CloudFront→ALB
    # est en HTTP, donc la redirection HTTPS de Django serait redondante et boucle.
    { name = "SECURE_SSL_REDIRECT", value = "false" },
    { name = "ALLOWED_HOSTS", value = var.allowed_hosts },
    { name = "CORS_ALLOWED_ORIGINS", value = "https://${aws_cloudfront_distribution.frontend.domain_name}" },
    { name = "DATABASE_ENGINE", value = "postgres" },
    { name = "DATABASE_NAME", value = var.db_name },
    { name = "DATABASE_USER", value = var.db_username },
    { name = "DATABASE_HOST", value = aws_db_instance.main.address },
    { name = "DATABASE_PORT", value = "5432" },
  ]

  # Secrets injectés depuis Secrets Manager (jamais en clair dans la task def).
  backend_secrets = [
    { name = "SECRET_KEY", valueFrom = aws_secretsmanager_secret.django_secret_key.arn },
    { name = "DATABASE_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn },
  ]
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name        = "backend"
      image       = local.backend_image
      essential   = true
      environment = local.backend_environment
      secrets     = local.backend_secrets

      portMappings = [
        { containerPort = 8000, protocol = "tcp" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "${local.name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  # Laisse le déploiement remplacer les tâches sans interruption.
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.http]
}
