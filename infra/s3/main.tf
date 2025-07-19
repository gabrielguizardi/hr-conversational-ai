resource "aws_s3_bucket" "frontend" {
  bucket = var.bucket_name
  force_destroy = true
}