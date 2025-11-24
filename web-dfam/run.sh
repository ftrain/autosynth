#!/bin/bash
#
# DFAM Web Synth - Build and Run
#
# Usage:
#   ./run.sh wasm      # Build WASM only
#   ./run.sh dev       # Build WASM + run dev server
#   ./run.sh build     # Full production build
#   ./run.sh serve     # Build and serve production
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[dfam]${NC} $1"; }
warn() { echo -e "${YELLOW}[dfam]${NC} $1"; }
info() { echo -e "${CYAN}[dfam]${NC} $1"; }

build_wasm() {
    log "Building WASM with Emscripten..."
    docker compose run --rm wasm-builder
    log "WASM build complete: public/dfam.js, public/dfam.wasm"
}

install_deps() {
    if [ ! -d "node_modules" ]; then
        log "Installing npm dependencies..."
        npm install
    fi
}

dev() {
    build_wasm
    install_deps
    log "Starting development server..."
    info "Open http://localhost:5173 in your browser"
    npm run dev
}

build() {
    log "Building production image..."
    docker compose build dfam-web
    log "Build complete!"
}

serve() {
    log "Starting production server..."
    docker compose up dfam-web
}

case "${1:-dev}" in
    wasm)
        build_wasm
        ;;
    dev)
        dev
        ;;
    build)
        build
        ;;
    serve)
        serve
        ;;
    *)
        echo "Usage: $0 {wasm|dev|build|serve}"
        echo ""
        echo "Commands:"
        echo "  wasm   - Build WASM only"
        echo "  dev    - Build WASM + run dev server"
        echo "  build  - Build production Docker image"
        echo "  serve  - Run production server"
        exit 1
        ;;
esac
