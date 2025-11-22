#!/bin/bash
#
# dev.sh - Studio development environment helper
#
# Usage:
#   ./scripts/dev.sh              # Start interactive shell
#   ./scripts/dev.sh build        # Build the dev image
#   ./scripts/dev.sh new "Name"   # Create new plugin (inside container)
#   ./scripts/dev.sh claude       # Start Claude Code in container
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$REPO_ROOT/docker"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[studio]${NC} $1"; }
warn() { echo -e "${YELLOW}[studio]${NC} $1"; }
info() { echo -e "${CYAN}[studio]${NC} $1"; }

# Check if image exists
image_exists() {
    docker image inspect studio-dev:latest &>/dev/null
}

# Build the development image
build_image() {
    log "Building studio-dev image (this may take a few minutes the first time)..."
    docker build -f "$DOCKER_DIR/Dockerfile.dev" -t studio-dev:latest "$REPO_ROOT"
    log "Image built successfully!"
}

# Start the container
start_container() {
    # Build if needed
    if ! image_exists; then
        warn "Image not found, building..."
        build_image
    fi

    # Check if already running
    if docker ps -q -f name=studio-dev | grep -q .; then
        log "Container already running"
        return 0
    fi

    # Start with docker-compose
    log "Starting development container..."
    cd "$DOCKER_DIR"
    docker compose up -d
    log "Container started"
}

# Get a shell in the container
shell() {
    start_container
    log "Entering container..."
    docker exec -it studio-dev bash
}

# Run a command in the container
run_cmd() {
    start_container
    docker exec -it studio-dev "$@"
}

# Create a new plugin
new_plugin() {
    if [ -z "$1" ]; then
        echo "Usage: $0 new \"Plugin Name\" [ClassName] [Code]"
        exit 1
    fi

    local name="$1"
    local class="${2:-$(echo "$name" | tr -d ' ')}"
    local code="${3:-$(echo "$class" | head -c4)}"

    start_container
    log "Creating plugin: $name"
    docker exec -it studio-dev ./scripts/new-plugin.sh "$name" "$class" "$code"
}

# Start Claude Code
claude() {
    start_container
    log "Starting Claude Code..."
    docker exec -it studio-dev claude
}

# Build a plugin
build_plugin() {
    local plugin_dir="$1"
    if [ -z "$plugin_dir" ]; then
        echo "Usage: $0 build-plugin <plugin-dir>"
        exit 1
    fi

    start_container
    log "Building plugin in $plugin_dir..."
    docker exec -it studio-dev bash -c "cd $plugin_dir && cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release && cmake --build build"
}

# Stop the container
stop() {
    log "Stopping container..."
    cd "$DOCKER_DIR"
    docker compose down
}

# Clean up everything
clean() {
    stop
    log "Removing image..."
    docker rmi studio-dev:latest 2>/dev/null || true
    log "Cleaned up"
}

# Show help
usage() {
    cat << EOF
Studio Development Environment

Usage: ./scripts/dev.sh [command]

Commands:
  (none)          Start interactive shell in container
  build           Build the development Docker image
  new "Name"      Create a new plugin (runs inside container)
  claude          Start Claude Code in the container
  build-plugin    Build a plugin: dev.sh build-plugin plugins/MyPlugin
  stop            Stop the development container
  clean           Remove container and image

Examples:
  ./scripts/dev.sh                          # Get a shell
  ./scripts/dev.sh new "Warm Bass" WarmBass WmBs
  ./scripts/dev.sh build-plugin plugins/ModelD
  ./scripts/dev.sh claude

The first run will build the Docker image (~5-10 minutes).
Subsequent runs start instantly with all dependencies ready.
EOF
}

# Main
case "${1:-}" in
    build)
        build_image
        ;;
    new)
        shift
        new_plugin "$@"
        ;;
    claude)
        claude
        ;;
    build-plugin)
        shift
        build_plugin "$@"
        ;;
    stop)
        stop
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        usage
        ;;
    "")
        shell
        ;;
    *)
        run_cmd "$@"
        ;;
esac
