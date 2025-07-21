resource "aws_ecr_repository" "backend" {
  name = var.ecr_repo_name
}

# Cria ECR para armazenar imagem
resource "aws_ecr_repository" "frontend_repo" {
  name = "${var.frontend_app_name}-repo"
}