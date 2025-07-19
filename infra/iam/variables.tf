variable "bucket_name" {
  default = "hr-conversational-ai-frontend"
}

variable "terraform_backend_region" {
    default     = "us-east-1"
}

variable "terraform_backend_role_arn" {
    default     = "us-east-1"
}

variable "terraform_backend_bucket" {
    default     = "terraform-backend-s3-ipea-eia366-pbrent366"
}

variable "terraform_backend_key" {
    default     = "terraform.tfstate"
}

variable "terraform_backend_dynamodb_table" {
    default     = "terraform-backend-lock-table-s3-ipea-eia366-pbrent366"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}