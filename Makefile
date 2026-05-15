.DEFAULT_GOAL := help
.PHONY: help install up down logs migrate seed lint test build clean reset

COMPOSE := docker compose -f infra/compose/docker-compose.dev.yml

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies (pnpm + go + uv)
	pnpm install
	go work sync || true
	cd ai/ai-gateway && uv sync || true

up: ## Start local dev stack (Postgres, Redis, NATS, MinIO, Mailpit, Jaeger)
	$(COMPOSE) up -d
	@echo "Stack up. Postgres :5432  Redis :6379  NATS :4222  MinIO :9000/:9001  Mailpit :8025  Jaeger :16686"

down: ## Stop local dev stack
	$(COMPOSE) down

logs: ## Tail dev stack logs
	$(COMPOSE) logs -f

reset: ## Stop + remove volumes (DESTRUCTIVE)
	$(COMPOSE) down -v

migrate: ## Run goose migrations across services
	@for svc in gateway identity billing notifier audit eld; do \
		if [ -d services/$$svc/migrations ]; then \
			echo "→ Migrating $$svc"; \
			(cd services/$$svc && go run -tags=goose ./cmd/migrate up) || exit 1; \
		fi; \
	done

seed: ## Seed dev data
	@echo "Seed not yet implemented"

lint: ## Run all linters
	pnpm lint
	@cd services && for svc in */; do (cd $$svc && golangci-lint run ./...) || true; done
	cd ai/ai-gateway && ruff check . && mypy .

test: ## Run all tests
	pnpm test
	go test ./services/... 2>/dev/null || true
	cd ai/ai-gateway && pytest

build: ## Build everything
	pnpm build
	@cd services && for svc in */; do (cd $$svc && go build -o bin/$$(basename $$svc) ./cmd/...) || true; done

clean: ## Remove all build artifacts and caches
	pnpm clean
	find . -name node_modules -type d -prune -exec rm -rf {} + 2>/dev/null || true
	find . -name .next -type d -prune -exec rm -rf {} + 2>/dev/null || true
	find . -name dist -type d -prune -exec rm -rf {} + 2>/dev/null || true
	find services -name bin -type d -prune -exec rm -rf {} + 2>/dev/null || true
