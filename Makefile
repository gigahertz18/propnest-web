ENV ?= dev

COMPOSE_FILE = docker-compose.yml
COMPOSE      = ENV=$(ENV) docker compose -f $(COMPOSE_FILE)

# Test commands always inject ENV=unittest into the exec'd process
# so UnittestConfig is used regardless of what ENV the container was started with
TEST_EXEC = $(COMPOSE) run --rm -e ENV=unittest

# ─── Main Commands ────────────────────────────────────────
up:
	$(COMPOSE) up --build

up-detached:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) down && $(COMPOSE) up --build

restart-detached:
	$(COMPOSE) down && $(COMPOSE) up -d --build

logs:
	$(COMPOSE) logs -f

logs-frontend:
	$(COMPOSE) logs -f frontend

# ─── Shells ───────────────────────────────────────────────

fe-shell:
	$(COMPOSE) exec -it frontend sh

# ─── Frontend Tests ───────────────────────────────────────
test-fe:
	$(TEST_EXEC) frontend npx jest --passWithNoTests

test-fe-watch:
	$(TEST_EXEC) frontend npx jest --watch

test-fe-cov:
	$(TEST_EXEC) frontend npx jest --coverage

test-fe-file:
	$(TEST_EXEC) frontend npx jest $(file)

# ─── Frontend Lint & Format ───────────────────────────────
lint-fe:
	$(TEST_EXEC) frontend npx eslint src
	@echo "✅ Frontend lint passed"

lint-fe-fix:
	$(TEST_EXEC) frontend npx eslint src --fix
	@echo "✅ Frontend lint fix completed"

format-fe:
	$(TEST_EXEC) frontend npx prettier --check src

format-fe-fix:
	$(TEST_EXEC) frontend npx prettier --write src

# ─── Run All Tests ────────────────────────────────────────
test-all: test-be test-fe

# ─── Helpers ──────────────────────────────────────────────
ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans

.PHONY: up up-detached down restart restart-detached logs \
        logs-backend logs-db logs-minio logs-frontend \
        db-shell be-shell fe-shell seed \
        migrate-new migrate-up migrate-down migrate-history \
        test-fe test-fe-watch test-fe-cov test-fe-file \
        lint-fe lint-fe-fix format-fe format-fe-fix \
        test-all ps clean
