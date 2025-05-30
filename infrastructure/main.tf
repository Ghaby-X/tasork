terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  # Configuration options
  region = "us-west-1"
  profile = "sandbox"
}

module "cognito" {
  source         = "./modules/cognito"
  user_pool_name = "tasork_user_pool"
  callback_urls  = ["http://localhost:3000/auth/resolve"]
}

module "dynamodb" {
  source = "./modules/dynamodb"
}