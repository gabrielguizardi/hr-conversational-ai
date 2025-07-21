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

variable "vpc_name" {
  default = "hr-conversational-ai-backend"
}

variable "ecs_task_exec_role" {
  description = "Role para execução de tarefas do ECS"
  type        = string
}

variable "gemini_api_key" {
  description = "Chave da API Gemini"
}

variable "lb_name" {
  description = "Name of the frontend application"
  type        = string
  default     = "hr-conversational-ai-frontend"
}

variable "frontend_app_name" {
  description = "Name of the frontend application"
  type        = string
  default     = "hr-conversational-ai-frontend"
}

variable "ecs_task_exec_role_frontend" {
  description = "Role for ECS task execution for frontend"
  type        = string
  default     = "" # Update with actual role ARN
}