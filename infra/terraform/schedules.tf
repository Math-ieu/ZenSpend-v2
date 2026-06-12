# Tâches planifiées : EventBridge Scheduler lance la task ECS backend avec une
# commande surchargée pour chaque job. Équivalent AWS du service Ofelia local.
# Heures en UTC. cron(minute heure jour-du-mois mois jour-semaine année).

locals {
  scheduled_jobs = {
    recurring-transactions = {
      schedule = "cron(30 0 * * ? *)" # 00:30
      command  = ["python", "manage.py", "generate_recurring_transactions"]
    }
    purge-accounts = {
      schedule = "cron(0 3 * * ? *)" # 03:00 — purge RGPD / Play Store
      command  = ["python", "manage.py", "purge_deleted_accounts"]
    }
    notifications = {
      schedule = "cron(0 7 * * ? *)" # 07:00
      command  = ["python", "manage.py", "generate_notifications"]
    }
  }
}

resource "aws_scheduler_schedule" "jobs" {
  for_each = local.scheduled_jobs

  name                         = "${local.name}-${each.key}"
  schedule_expression          = each.value.schedule
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.main.arn
    role_arn = aws_iam_role.scheduler.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.backend.arn
      launch_type         = "FARGATE"
      task_count          = 1

      network_configuration {
        subnets          = aws_subnet.private[*].id
        security_groups  = [aws_security_group.ecs.id]
        assign_public_ip = false
      }
    }

    input = jsonencode({
      containerOverrides = [{
        name    = "backend"
        command = each.value.command
      }]
    })

    retry_policy {
      maximum_retry_attempts = 1
    }
  }
}
