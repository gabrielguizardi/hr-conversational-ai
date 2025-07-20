resource "aws_s3_bucket" "frontend" {
  bucket = var.bucket_name

  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "error.html"
  }

  tags = {
    Name        = "Frontend bucket"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "null_resource" "frontend_build_deploy" {
  provisioner "local-exec" {
    command = <<EOT
      cd ./web
      npm ci
      npm run build
      aws s3 sync ./dist s3://${var.bucket_name} --acl public-read --delete
    EOT
  }

  triggers = {
    always_run = "${timestamp()}"
  }
}