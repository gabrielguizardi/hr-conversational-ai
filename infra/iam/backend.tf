terraform {
  backend "s3" {
    region         = var.terraform_backend_region
    role_arn       = var.terraform_backend_role_arn
    bucket         = var.terraform_backend_bucket
    key            = var.terraform_backend_key
    dynamodb_table = var.terraform_backend_dynamodb_table
    encrypt        = true
  }
}