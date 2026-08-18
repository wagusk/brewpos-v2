#!/usr/bin/env bash
# ==============================================================================
# Brew-POS v2 — One-Command Installer and Runner
# ==============================================================================
# Usage:
#   ./run.sh            # Install dependencies, build, seed, and start server on port 8000
#   ./run.sh start      # Same as above
#   ./run.sh install    # Install dependencies, build frontend, and seed DB (no server)
#   ./run.sh build      # Force rebuild frontend
#   ./run.sh seed       # Seed/reset database
#   ./run.sh clean      # Clean all build artifacts, venv, node_modules, and db
#   ./run.sh help       # Show help message
# ==============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_banner() {
  echo -e "${CYAN}"
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║                  BREW-POS v2 INSTALLER & RUNNER           ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

check_prerequisites() {
  echo -e "${GREEN}==> Checking system prerequisites...${NC}"
  
  if ! command -v python3 &>/dev/null; then
    echo -e "${RED}Error: python3 is required but not installed.${NC}" >&2
    exit 1
  fi

  PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
  echo -e "    Python version: $PYTHON_VERSION (OK)"

  if ! command -v npm &>/dev/null || ! command -v node &>/dev/null; then
    echo -e "${RED}Error: node and npm are required but not found in PATH.${NC}" >&2
    exit 1
  fi
  NODE_VERSION=$(node -v)
  echo -e "    Node version: $NODE_VERSION (OK)"
}

install_backend() {
  echo -e "${GREEN}==> Setting up Python backend environment...${NC}"
  VENV="$ROOT/.venv"
  if [[ ! -d "$VENV" ]]; then
    echo "    Creating virtual environment at .venv..."
    python3 -m venv "$VENV"
  fi

  source "$VENV/bin/activate"

  if [[ ! -f "$VENV/.deps_installed" ]] || [[ "$ROOT/requirements.txt" -nt "$VENV/.deps_installed" ]]; then
    echo "    Installing/upgrading backend dependencies..."
    pip install --upgrade pip >/dev/null 2>&1 || pip install --upgrade pip
    pip install -r "$ROOT/requirements.txt"
    touch "$VENV/.deps_installed"
  else
    echo "    Backend dependencies are up to date."
  fi
}

build_frontend() {
  echo -e "${GREEN}==> Building frontend application...${NC}"
  DIST="$ROOT/frontend/dist"
  INDEX="$DIST/index.html"
  PKG_HASH="$ROOT/.frontend-hash"
  
  cd "$ROOT/frontend"
  if [[ ! -d node_modules ]]; then
    echo "    Installing npm dependencies..."
    npm install
  fi

  # Calculate source hash to check if rebuild is needed
  CUR_HASH=$(find "$ROOT/frontend/src" -type f -print0 2>/dev/null | sort -z | xargs -0 sha1sum 2>/dev/null | sha1sum | cut -d' ' -f1,2)
  
  if [[ ! -f "$INDEX" ]] || [[ ! -f "$PKG_HASH" ]] || [[ "$CUR_HASH" != "$(cat "$PKG_HASH" 2>/dev/null)" ]]; then
    echo "    Compiling frontend bundle..."
    npm run build
    echo "$CUR_HASH" > "$PKG_HASH"
    echo -e "${GREEN}    Frontend build complete.${NC}"
  else
    echo -e "${GREEN}    Frontend already built and up to date.${NC}"
  fi
  cd "$ROOT"
}

seed_database() {
  echo -e "${GREEN}==> Checking database status...${NC}"
  DB_PATH="$ROOT/backend/brewpos.db"
  if [[ ! -f "$DB_PATH" ]]; then
    echo "    Initializing and seeding database..."
    cd "$ROOT/backend"
    python -m app.db.seed
    cd "$ROOT"
    echo -e "${GREEN}    Database seeded successfully.${NC}"
  else
    echo "    Database already exists at backend/brewpos.db."
  fi
}

clean_all() {
  echo -e "${YELLOW}==> Cleaning up build artifacts, venv, and database...${NC}"
  rm -rf "$ROOT/.venv"
  rm -rf "$ROOT/frontend/node_modules"
  rm -rf "$ROOT/frontend/dist"
  rm -f "$ROOT/.frontend-hash"
  rm -f "$ROOT/backend/brewpos.db"
  rm -f "$ROOT/uvicorn.log"
  echo -e "${GREEN}==> Cleanup complete.${NC}"
}

run_server() {
  source "$ROOT/.venv/bin/activate"
  HOST="${BREWPOS_HOST:-0.0.0.0}"
  PORT="${BREWPOS_PORT:-8000}"

  print_banner
  echo -e "${GREEN}==> Starting Brew-POS v2 Server on port $PORT...${NC}"
  echo -e "    URL: ${CYAN}http://localhost:$PORT${NC}"
  echo -e "    API Docs: ${CYAN}http://localhost:$PORT/docs${NC}"
  echo -e "    Default logins: Admin (9999), Cashier (1111), Waiter (2222), Kitchen/Bar (3333)"
  echo -e "${YELLOW}    Press Ctrl+C to stop the server.${NC}\n"

  exec uvicorn app.main:app --app-dir "$ROOT/backend" --host "$HOST" --port "$PORT"
}

show_help() {
  print_banner
  echo "Usage: ./run.sh [command]"
  echo ""
  echo "Commands:"
  echo "  (none) / start   Install dependencies, build frontend, seed DB, and run server on port 8000"
  echo "  install          Run installer steps only (venv, npm packages, build, seed)"
  echo "  build            Force rebuild the frontend application"
  echo "  seed             Run database seeding"
  echo "  clean            Remove virtualenv, node_modules, frontend dist, and database"
  echo "  help             Show this help message"
  echo ""
}

COMMAND="${1:-start}"

case "$COMMAND" in
  start)
    print_banner
    check_prerequisites
    install_backend
    build_frontend
    seed_database
    run_server
    ;;
  install)
    print_banner
    check_prerequisites
    install_backend
    build_frontend
    seed_database
    echo -e "\n${GREEN}==> Installation completed successfully! Run './run.sh start' to launch.${NC}"
    ;;
  build)
    print_banner
    check_prerequisites
    build_frontend
    ;;
  seed)
    print_banner
    install_backend
    cd "$ROOT/backend"
    python -m app.db.seed
    cd "$ROOT"
    echo -e "${GREEN}==> Database seeded successfully.${NC}"
    ;;
  clean)
    clean_all
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Unknown command: $COMMAND${NC}" >&2
    echo "Run './run.sh help' for usage instructions." >&2
    exit 1
    ;;
esac
