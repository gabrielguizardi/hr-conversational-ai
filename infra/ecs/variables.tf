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

variable "ecs_task_exec_role" {
  description = "Role para execução de tarefas do ECS"
  type        = string
}

variable "gemini_api_key" {
  description = "Chave da API Gemini"
}