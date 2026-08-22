# Makefile for Docker operations

# Variables
IMAGE_NAME = vkhangstack/shadcn-admin
TAG = latest
CONTAINER_NAME_PROD = $(IMAGE_NAME)-prod
CONTAINER_NAME_DEV = $(IMAGE_NAME)-dev

# Help
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  build-prod     Build production Docker image"
	@echo "  build-dev      Build development Docker image"
	@echo "  run-prod       Run production container"
	@echo "  run-dev        Run development container"
	@echo "  stop           Stop all containers"
	@echo "  clean          Remove containers and images"
	@echo "  logs-prod      Show production container logs"
	@echo "  logs-dev       Show development container logs"
	@echo "  shell-prod     Open shell in production container"
	@echo "  shell-dev      Open shell in development container"
	@echo "  compose-up     Start with docker-compose"
	@echo "  compose-down   Stop docker-compose services"

# Build commands
.PHONY: build-prod
build-prod:
	docker build --target production -t $(IMAGE_NAME):$(TAG) .

.PHONY: build-dev
build-dev:
	docker build --target development -t $(IMAGE_NAME):dev .

# Run commands
.PHONY: run-prod
run-prod:
	docker run -d --name $(CONTAINER_NAME_PROD) -p 80:80 $(IMAGE_NAME):$(TAG)

.PHONY: run-dev
run-dev:
	docker run -d --name $(CONTAINER_NAME_DEV) -p 5173:5173 -v $(PWD):/app -v /app/node_modules $(IMAGE_NAME):dev

# Control commands
.PHONY: stop
stop:
	docker stop $(CONTAINER_NAME_PROD) $(CONTAINER_NAME_DEV) 2>/dev/null || true
	docker rm $(CONTAINER_NAME_PROD) $(CONTAINER_NAME_DEV) 2>/dev/null || true

.PHONY: clean
clean: stop
	docker rmi $(IMAGE_NAME):$(TAG) $(IMAGE_NAME):dev 2>/dev/null || true
	docker system prune -f

# Logs
.PHONY: logs-prod
logs-prod:
	docker logs -f $(CONTAINER_NAME_PROD)

.PHONY: logs-dev
logs-dev:
	docker logs -f $(CONTAINER_NAME_DEV)

# Shell access
.PHONY: shell-prod
shell-prod:
	docker exec -it $(CONTAINER_NAME_PROD) sh

.PHONY: shell-dev
shell-dev:
	docker exec -it $(CONTAINER_NAME_DEV) sh

# Docker Compose commands
.PHONY: compose-up
compose-up:
	docker-compose up -d

.PHONY: compose-down
compose-down:
	docker-compose down

.PHONY: compose-logs
compose-logs:
	docker-compose logs -f

# Development workflow
.PHONY: dev
dev: build-dev run-dev logs-dev

.PHONY: prod
prod: build-prod run-prod logs-prod
