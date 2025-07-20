terraform {
  required_providers {
    aws = {
      region  = var.region
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.0.0"
}

provider "aws" {
  region  = var.region
}
