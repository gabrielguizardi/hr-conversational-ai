resource "aws_ecs_cluster" "main" {
  name = var.ecs_cluster_name
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.ecs_task_exec_role
  container_definitions    = jsonencode([
    {
      name      = "backend"
      image     = "${var.ecs_image_name}"
      essential = true
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
        }
      ]
      environment = [
        {
          name  = "GEMINI_API_KEY"
          value = var.gemini_api_key
        }
      ]
    }
  ])
}

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["${var.vpc_name}"]
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

data "aws_security_group" "backend" {
  filter {
    name   = "tag:Name"
    values = ["${var.vpc_name}-backend-sg"]
  }
  vpc_id = data.aws_vpc.main.id
}


resource "aws_ecs_service" "backend" {
  name            = "backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = [data.aws_subnet.vpc-public-a.id, data.aws_subnet.vpc-public-b.id]
    assign_public_ip = true
    security_groups  = [data.aws_security_group.backend.id]
  }
}

