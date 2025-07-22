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
          value = "${var.gemini_api_key}"
        },
        {
          name  = "PORT"
          value = "3001"
        },
        {
          name  = "MONGODB_URI"
          value = "mongodb+srv://matheus:CouwafNnb02MObBg@cluster0.eectqa9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        }
      ]
    }
  ])
}

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_name]
  }
}

resource "aws_service_discovery_private_dns_namespace" "namespace" {
  name        = "internal.local"
  description = "Namespace privado para comunicação interna entre ECS services"
  vpc         = data.aws_vpc.main.id
}

resource "aws_service_discovery_service" "backend_sd" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.namespace.id

    dns_records {
      type = "A"
      ttl  = 60
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "frontend_sd" {
  name = "frontend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.namespace.id
    dns_records {
      type = "A"
      ttl  = 60
    }
    routing_policy = "MULTIVALUE"
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
    name   = "group-name"
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

  service_registries {
  registry_arn = aws_service_discovery_service.backend_sd.arn
  }

}

# Define task
resource "aws_ecs_task_definition" "frontend_task" {
  family                   = "${var.frontend_app_name}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = "256"
  memory                  = "512"
  execution_role_arn      = var.ecs_task_exec_role_frontend

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${var.frontend_image}"
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ],
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "VITE_API_URL", value = "http://backend.internal.local:3001" },
        { name = "VITE_WS_URL",  value = "ws://backend.internal.local:3001" },
        { name = "VITE_PROJECT_URL", value = "http://frontend.internal.local:5173" }

      ]
    }
  ])
}

# Cria ECS Cluster
resource "aws_ecs_cluster" "frontend_cluster" {
  name = "${var.frontend_app_name}-cluster"
}

data "aws_lb_target_group" "frontend_tg" {
  name = "${var.lb_name}-tg"
}

data "aws_security_group" "frontend" {
  filter {
    name   = "group-name"
    values = ["${var.vpc_name}-frontend-sg"]
  }
  vpc_id = data.aws_vpc.main.id
}

# Cria serviço ECS
resource "aws_ecs_service" "frontend_service" {
  name            = "${var.frontend_app_name}-service"
  cluster         = aws_ecs_cluster.frontend_cluster.id
  task_definition = aws_ecs_task_definition.frontend_task.arn
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = [data.aws_subnet.vpc-public-a.id, data.aws_subnet.vpc-public-b.id]
    security_groups = [data.aws_security_group.frontend.id]
    assign_public_ip = true
  }
  
  load_balancer {
  target_group_arn = data.aws_lb_target_group.frontend_tg.arn
  container_name   = "frontend"
  container_port   = 80
}

  desired_count = 1

}

data "aws_lb" "frontend_alb" {
  name               = "${var.lb_name}-alb"
}

resource "aws_lb_listener" "frontend_listener" {
  load_balancer_arn = data.aws_lb.frontend_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = data.aws_lb_target_group.frontend_tg.arn
  }
}
