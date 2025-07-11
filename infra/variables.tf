variable "aws_region" {
  default = "us-east-1"
}

variable "ecr_repo_name" {
  default = "hr-conversational-ai-backend"
}

variable "s3_bucket_name" {
  default = "hr-conversational-ai-frontend"
}

variable "ecs_cluster_name" {
  default = "hr-conversational-ai-cluster"
}

variable "gemini_api_key" {
  description = "Chave da API Gemini"
}