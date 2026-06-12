terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Remote state — décommenter et créer le bucket + table avant `terraform init`.
  # backend "s3" {
  #   bucket         = "zenspend-tfstate"
  #   key            = "prod/terraform.tfstate"
  #   region         = "eu-west-3"
  #   dynamodb_table = "zenspend-tflock"
  #   encrypt        = true
  # }
}
