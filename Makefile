.PHONY: help install dev test seed docker-up docker-down tf-init tf-plan clean

help:
	@echo "CareFlow Development & Operations Commands:"
	@echo "  make install     - Install local backend & frontend dependencies"
	@echo "  make dev-backend - Run local FastAPI backend on http://localhost:8000"
	@echo "  make dev-frontend- Run local Next.js frontend on http://localhost:3000"
	@echo "  make test        - Run backend pytest test suite"
	@echo "  make seed        - Populate local database with demo patients, doctors, records"
	@echo "  make docker-up   - Start full-stack local Docker Compose environment"
	@echo "  make docker-down - Stop and remove local Docker Compose environment"
	@echo "  make tf-init     - Initialize Terraform working directory"
	@echo "  make tf-plan     - Generate and validate Terraform deployment plan"

install:
	cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && source .venv/bin/activate && pytest -v

seed:
	cd backend && source .venv/bin/activate && python -m app.seed

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down -v

tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan -var-file=terraform.tfvars.example

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf backend/careflow.db backend/.pytest_cache frontend/.next
