resource "aws_ecr_repository" "backend" {
  name = var.ecr_repo_name
}