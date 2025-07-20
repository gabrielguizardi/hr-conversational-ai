variable "ecs_cluster_name" {
  default = "hr-conversational-ai-backend"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "gemini_api_key" {
  description = "Chave da API Gemini"
}