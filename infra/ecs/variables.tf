variable "ecs_cluster_name" {
  default = "hr-conversational-ai-backend"
}

variable "ecs_image_name" {
  description = "Nome da imagem do ECS"  
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "gemini_api_key" {
  description = "Chave da API Gemini"
}