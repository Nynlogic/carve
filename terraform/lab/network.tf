# 3-tier network: public (proxy/app host) / private-db (RDS). No NAT gateway (cost) -> S3 gateway endpoint instead.
locals {
  azs = slice(data.aws_availability_zones.az.names, 0, 2)
}

resource "aws_vpc" "main" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${var.name}-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name}-igw" }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false
  tags                    = { Name = "${var.name}-public-${local.azs[count.index]}", Tier = "public" }
}

resource "aws_subnet" "db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 20 + count.index)
  availability_zone = local.azs[count.index]
  tags              = { Name = "${var.name}-private-db-${local.azs[count.index]}", Tier = "private-db" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${var.name}-rt-public" }
}

# DB route table has NO route to the internet at all.
resource "aws_route_table" "db" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name}-rt-private-db" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "db" {
  count          = 2
  subnet_id      = aws_subnet.db[count.index].id
  route_table_id = aws_route_table.db.id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.public.id, aws_route_table.db.id]
  tags              = { Name = "${var.name}-s3-endpoint" }
}

# --- Security groups: internet -> web only; DB accepts ONLY from the web/app SG ---
resource "aws_security_group" "web" {
  name        = "${var.name}-web-sg"
  description = "HTTPS/HTTP from internet to reverse proxy. No SSH (use SSM Session Manager)."
  vpc_id      = aws_vpc.main.id
  ingress {
    description = "HTTP (redirect + ACME)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.name}-web-sg" }
}

resource "aws_security_group" "db" {
  name        = "${var.name}-db-sg"
  description = "PostgreSQL only from the application security group"
  vpc_id      = aws_vpc.main.id
  ingress {
    description     = "Postgres from app tier only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
  tags = { Name = "${var.name}-db-sg" }
}
