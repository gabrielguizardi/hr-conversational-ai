variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "frontend_app_name" {
  description = "Name of the frontend application"
  type        = string
  default     = "hr-conversational-ai-frontend"
}