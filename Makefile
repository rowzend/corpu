.PHONY: help up down restart logs build clean status shell-backend shell-frontend

help: ## Show this help message
	@echo "ASNCORPU - Fullstack Application Management"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

up: ## Start all services
	docker-compose up -d
	@echo "✅ ASNCORPU started!"
	@echo "🌐 Access: http://localhost:3000"
	@echo "📡 API: http://localhost:3000/apicorpu"

down: ## Stop all services
	docker-compose down
	@echo "✅ ASNCORPU stopped!"

restart: ## Restart all services
	docker-compose restart
	@echo "✅ ASNCORPU restarted!"

logs: ## Show logs (all services)
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f asncorpu_backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f asncorpu-frontend

logs-nginx: ## Show nginx logs
	docker-compose logs -f asncorpu-nginx

build: ## Rebuild all services
	docker-compose up -d --build
	@echo "✅ ASNCORPU rebuilt!"

build-backend: ## Rebuild backend only
	docker-compose up -d --build asncorpu_backend
	@echo "✅ Backend rebuilt!"

build-frontend: ## Rebuild frontend only
	docker-compose up -d --build asncorpu-frontend
	@echo "✅ Frontend rebuilt!"

clean: ## Stop and remove all containers, volumes
	docker-compose down -v
	@echo "✅ ASNCORPU cleaned!"

status: ## Show status of all services
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec asncorpu_backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec asncorpu-frontend sh

shell-nginx: ## Open shell in nginx container
	docker-compose exec asncorpu-nginx sh

test-nginx: ## Test nginx configuration
	docker-compose exec asncorpu-nginx nginx -t

reload-nginx: ## Reload nginx configuration
	docker-compose exec asncorpu-nginx nginx -s reload
	@echo "✅ Nginx reloaded!"

migrate: ## Run Django migrations
	docker-compose exec asncorpu_backend python manage.py migrate
	@echo "✅ Migrations completed!"

collectstatic: ## Collect Django static files
	docker-compose exec asncorpu_backend python manage.py collectstatic --noinput
	@echo "✅ Static files collected!"

createsuperuser: ## Create Django superuser
	docker-compose exec asncorpu_backend python manage.py createsuperuser

health: ## Check health of all services
	@echo "Checking health..."
	@curl -s http://localhost:3000/health || echo "❌ Nginx not responding"
	@echo ""
