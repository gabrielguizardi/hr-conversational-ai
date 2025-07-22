data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_name]
  }
}

# 🔒 Security Group para o Load Balancer
resource "aws_security_group" "alb_sg" {
  name        = "${var.lb_name}-alb-sg"
  description = "Allow HTTP inbound traffic"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    description      = "HTTP from anywhere"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}

data "aws_subnet" "vpc-public-a" {
  filter {
    name   = "tag:Name"
    values = ["${var.vpc_name}-public-a"]
  }
}

data "aws_subnet" "vpc-public-b" {
  filter {
    name   = "tag:Name"
    values = ["${var.vpc_name}-public-b"]
  }
}

# ⚖️ Load Balancer
resource "aws_lb" "frontend_alb" {
  name               = "${var.lb_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [data.aws_subnet.vpc-public-a.id, data.aws_subnet.vpc-public-b.id]

  enable_deletion_protection = false
}

# 🎯 Target Group
resource "aws_lb_target_group" "frontend_tg" {
  name        = "${var.lb_name}-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.main.id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# 🧭 Listener na porta 80
resource "aws_lb_listener" "frontend_listener" {
  load_balancer_arn = aws_lb.frontend_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

resource "aws_security_group" "backend_lb" {
  name   = "backend-lb-sg"
  vpc_id = data.aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "backend" {
  name               = "backend-lb"
  internal           = false              # Externo (público)
  load_balancer_type = "application"
  subnets            = [data.aws_subnet.vpc-public-a.id, data.aws_subnet.vpc-public-b.id]
  security_groups    = [aws_security_group.backend_lb.id]
}

resource "aws_lb_target_group" "backend_tg" {
  name     = "backend-tg"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.main.id
  target_type = "ip"                     # Fargate usa "ip", não "instance"
}

resource "aws_lb_listener" "backend_listener" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }
}

