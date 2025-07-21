variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "lb_name" {
  description = "Name of the frontend application"
  type        = string
  default     = "hr-conversational-ai-frontend"
}

variable "vpc_name" {
  default = "hr-conversational-ai-backend"
}