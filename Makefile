# =============================================================================
# Technical Labs Website — Makefile
# =============================================================================
# Entrypoints for building, serving, and managing Nginx/Docker environments.
#
# Usage:
#   * `make up`      -> Production container serving built source on port 8080
#   * `make dev`     -> Development container bind-mounting workspace on port 3000
#   * `make build`   -> Build the local Docker image
#   * `make rebuild` -> Force Docker image rebuild from scratch
# =============================================================================

IMAGE_NAME    ?= technical-labs/website
IMAGE_TAG     ?= latest
PORT          ?= 8080
CONTAINER_NAME ?= technical-labs-website
DEV_PORT      ?= 3000
COMPOSE_FILE  ?= docker-compose.yml

COMPOSE ?= $(shell \
    if command -v docker >/dev/null 2>&1; then \
        echo 'docker compose'; \
    elif command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then \
        echo 'podman compose'; \
    elif command -v podman-compose >/dev/null 2>&1; then \
        echo 'podman-compose'; \
    fi)

BOLD  := \033[1m
GREEN := \033[32m
CYAN  := \033[36m
RESET := \033[0m

.DEFAULT_GOAL := help

.PHONY: _require-runtime help up down stop restart build rebuild logs ps shell dev dev-up dev-down

_require-runtime:
	@if [ -z "$(COMPOSE)" ]; then \
		echo "$(BOLD)ERROR:$(RESET) No container runtime detected. Install Docker/Podman." 1>&2; \
		exit 1; \
	fi

help: ## Show this help message
	@echo "$(BOLD)Technical Labs Website$(RESET) — available targets:"
	@echo ""
	@grep -E '^[-a-zA-Z0-9_]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "Variables (override on command line):"
	@echo "  PORT=$(PORT)  DEV_PORT=$(DEV_PORT)"

up: _require-runtime ## Start the production Nginx container (detached) on port $(PORT)
	@echo "$(GREEN)▶ Starting production stack on http://localhost:$(PORT)$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

down: _require-runtime ## Stop and remove production containers
	@echo "$(GREEN)▶ Stopping production stack$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) down

stop: _require-runtime ## Stop production containers
	$(COMPOSE) -f $(COMPOSE_FILE) stop

restart: down up ## Restart production containers

build: _require-runtime ## Build the Docker Nginx image
	@echo "$(GREEN)▶ Building image $(IMAGE_NAME):$(IMAGE_TAG)$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) build

rebuild: _require-runtime ## Rebuild the Docker image from scratch (no cache)
	@echo "$(GREEN)▶ Rebuilding image from scratch$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache --pull

logs: _require-runtime ## Tail logs from the production container
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f --tail=200

ps: _require-runtime ## Show active containers for this project
	$(COMPOSE) -f $(COMPOSE_FILE) ps

dev: dev-up ## Start local development container (live edits, port $(DEV_PORT))

dev-up: _require-runtime ## Run local development container (bind-mounted)
	@echo "$(GREEN)▶ Starting dev stack on http://localhost:$(DEV_PORT)$(RESET)"
	$(COMPOSE) -f $(COMPOSE_FILE) --profile dev up

dev-down: _require-runtime ## Stop and remove development containers
	$(COMPOSE) -f $(COMPOSE_FILE) --profile dev down
