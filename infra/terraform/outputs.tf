output "api_url" {
  description = "URL HTTPS de l'API (à utiliser dans EXPO_PUBLIC_API_URL et VITE_API_URL)."
  value       = "https://${aws_cloudfront_distribution.api.domain_name}/api"
}

output "frontend_url" {
  description = "URL HTTPS du frontend web."
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "alb_dns_name" {
  description = "DNS interne de l'ALB (origine de CloudFront, debug)."
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "URL du dépôt ECR où pousser l'image backend."
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_bucket" {
  description = "Bucket S3 où synchroniser le build du frontend."
  value       = aws_s3_bucket.frontend.id
}

output "frontend_cloudfront_id" {
  description = "ID de distribution CloudFront du frontend (pour l'invalidation cache au déploiement)."
  value       = aws_cloudfront_distribution.frontend.id
}

output "ecs_cluster" {
  description = "Nom du cluster ECS."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service" {
  description = "Nom du service ECS backend (pour --force-new-deployment)."
  value       = aws_ecs_service.backend.name
}

output "rds_endpoint" {
  description = "Endpoint de la base RDS."
  value       = aws_db_instance.main.address
}

output "github_deploy_role_arn" {
  description = "ARN du rôle assumé par GitHub Actions (secret AWS_DEPLOY_ROLE_ARN)."
  value       = aws_iam_role.github_deploy.arn
}

output "aws_region" {
  description = "Région AWS de déploiement."
  value       = var.aws_region
}
