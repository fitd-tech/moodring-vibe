# Moodring Development Workflow Automation
# Multi-project quality control and development commands

.PHONY: check-all dev-start dev-stop clean install setup test-all lint-all format-all

# Project paths
BACKEND_DIR = moodring_backend
FRONTEND_DIR = moodring_frontend

# Default target
help:
	@echo "Moodring Development Workflow Commands"
	@echo "=====================================."
	@echo ""
	@echo "Quality Control:"
	@echo "  check-all     - Run all quality checks (linting, tests, formatting)"
	@echo "  test-all      - Run all test suites"
	@echo "  lint-all      - Run all linters"
	@echo "  format-all    - Format all code"
	@echo ""
	@echo "Development:"
	@echo "  dev-start     - Start both backend and frontend dev servers"
	@echo "  dev-stop      - Stop all development processes"
	@echo "  setup         - Initialize development environment"
	@echo "  install       - Install all dependencies"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean         - Clean build artifacts and temp files"
	@echo "  health-check  - Verify project health and configuration"

# Quality Control Commands
check-all: lint-all test-all
	@echo "✅ All quality checks completed successfully"

test-all:
	@echo "🧪 Running backend tests..."
	@cd $(BACKEND_DIR) && cargo test
	@echo "🧪 Running frontend tests..."
	@cd $(FRONTEND_DIR) && npm run test
	@echo "✅ All tests passed"

lint-all:
	@echo "🔍 Running backend linting..."
	@cd $(BACKEND_DIR) && cargo clippy -- -D warnings
	@cd $(BACKEND_DIR) && cargo fmt --check
	@echo "🔍 Running frontend linting..."
	@cd $(FRONTEND_DIR) && npm run lint
	@cd $(FRONTEND_DIR) && npm run typecheck
	@echo "✅ All linting checks passed"

format-all:
	@echo "🎨 Formatting backend code..."
	@cd $(BACKEND_DIR) && cargo fmt
	@echo "🎨 Formatting frontend code..."
	@cd $(FRONTEND_DIR) && npm run format
	@echo "✅ All code formatted"

# Development Environment Commands
dev-start:
	@echo "🚀 Starting development environment..."
	@echo "Starting backend server..."
	@cd $(BACKEND_DIR) && cargo run &
	@sleep 3
	@echo "Starting frontend development server..."
	@cd $(FRONTEND_DIR) && npm start &
	@echo "✅ Development servers started"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: Expo Dev Tools will open automatically"

dev-stop:
	@echo "🛑 Stopping development servers..."
	@pkill -f "cargo run" || true
	@pkill -f "expo start" || true
	@pkill -f "node.*expo" || true
	@echo "✅ Development servers stopped"

setup: install
	@echo "🔧 Setting up development environment..."
	@echo "Checking backend setup..."
	@cd $(BACKEND_DIR) && cargo check
	@echo "Checking frontend setup..."
	@cd $(FRONTEND_DIR) && npm run typecheck
	@echo "Running initial quality checks..."
	@$(MAKE) check-all
	@echo "✅ Development environment setup complete"

install:
	@echo "📦 Installing dependencies..."
	@echo "Installing backend dependencies..."
	@cd $(BACKEND_DIR) && cargo fetch
	@echo "Installing frontend dependencies..."
	@cd $(FRONTEND_DIR) && npm install
	@echo "✅ All dependencies installed"

# Maintenance Commands
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd $(BACKEND_DIR) && cargo clean
	@cd $(FRONTEND_DIR) && rm -rf node_modules/.cache
	@cd $(FRONTEND_DIR) && rm -rf .expo
	@rm -rf $(FRONTEND_DIR)/coverage
	@echo "✅ Cleanup complete"

health-check:
	@echo "🏥 Running project health check..."
	@echo ""
	@echo "Backend Health:"
	@echo "  Cargo.toml exists: $$(test -f $(BACKEND_DIR)/Cargo.toml && echo '✅' || echo '❌')"
	@echo "  Source directory: $$(test -d $(BACKEND_DIR)/src && echo '✅' || echo '❌')"
	@echo "  Database migrations: $$(test -d $(BACKEND_DIR)/migrations && echo '✅' || echo '❌')"
	@echo ""
	@echo "Frontend Health:"
	@echo "  package.json exists: $$(test -f $(FRONTEND_DIR)/package.json && echo '✅' || echo '❌')"
	@echo "  App.tsx exists: $$(test -f $(FRONTEND_DIR)/App.tsx && echo '✅' || echo '❌')"
	@echo "  Environment config: $$(test -f $(FRONTEND_DIR)/.env.example && echo '✅' || echo '❌')"
	@echo "  Node modules: $$(test -d $(FRONTEND_DIR)/node_modules && echo '✅' || echo '❌')"
	@echo ""
	@echo "Environment Variables:"
	@echo "  .env.example exists: $$(test -f $(FRONTEND_DIR)/.env.example && echo '✅' || echo '❌')"
	@echo "  .env file status: $$(test -f $(FRONTEND_DIR)/.env && echo '✅ (exists)' || echo '⚠️  (missing - copy from .env.example)')"
	@echo ""
	@echo "Git Status:"
	@git status --porcelain | wc -l | xargs -I {} echo "  Uncommitted changes: {} files"
	@echo "  Current branch: $$(git branch --show-current)"

# Pre-commit quality enforcement
pre-commit-check:
	@echo "🔒 Running pre-commit quality checks..."
	@$(MAKE) lint-all
	@$(MAKE) test-all
	@echo "✅ Pre-commit checks passed - ready to commit"

# Temporary code management
temp-code-scan:
	@echo "🔍 Scanning for temporary code..."
	@echo "TODO: TEMP items found:"
	@grep -r "TODO: TEMP" $(BACKEND_DIR) $(FRONTEND_DIR) --include="*.rs" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -n || echo "  No temporary code found ✅"
	@echo ""
	@echo "TEMP: commit messages in git log:"
	@git log --oneline --grep="TEMP:" -n 10 || echo "  No temporary commits found ✅"