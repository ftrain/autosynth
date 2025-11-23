#!/usr/bin/env bash
# AutoSynth Docker Development Environment
# Run with X11 display and audio support

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="macos";;
    *)          PLATFORM="unknown";;
esac

info "Detected platform: $PLATFORM"

# Note: Claude Code supports OAuth login for Pro/Max subscribers
# No API key needed - just run 'claude' and login interactively

setup_linux() {
    info "Setting up Linux X11 and audio..."

    # Allow local X11 connections
    xhost +local:docker 2>/dev/null || warn "xhost not available, X11 may not work"

    # Ensure PulseAudio is running
    if ! pulseaudio --check 2>/dev/null; then
        warn "PulseAudio not running, starting..."
        pulseaudio --start 2>/dev/null || warn "Failed to start PulseAudio"
    fi

    # Export required variables
    export DISPLAY="${DISPLAY:-:0}"
    export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
}

setup_macos() {
    info "Setting up macOS environment..."

    # Check for XQuartz (optional - only needed for X11 GUI testing)
    if [ -d "/Applications/Utilities/XQuartz.app" ]; then
        # Start XQuartz if not running
        if ! pgrep -x "XQuartz" > /dev/null; then
            info "Starting XQuartz..."
            open -a XQuartz
            sleep 3
        fi
        export DISPLAY="${DISPLAY:-:0}"
        xhost +localhost 2>/dev/null || true
        defaults write org.xquartz.X11 nolisten_tcp -bool false 2>/dev/null || true
    else
        warn "XQuartz not installed. X11 GUI testing won't work."
        warn "Install with: brew install --cask xquartz (optional)"
    fi
}

build_image() {
    info "Building Docker image..."
    cd "$PROJECT_DIR"
    docker build -t autosynth-dev:latest .
}

run_container() {
    info "Starting container..."
    cd "$PROJECT_DIR"

    # Create persistent directory for Claude auth (entire .claude dir)
    mkdir -p "$PROJECT_DIR/.docker-state/claude"

    # Copy default settings if not present
    if [ ! -f "$PROJECT_DIR/.docker-state/claude/settings.json" ]; then
        cp "$PROJECT_DIR/docker/claude-settings.json" "$PROJECT_DIR/.docker-state/claude/settings.json" 2>/dev/null || true
    fi

    if [ "$PLATFORM" = "linux" ]; then
        # Linux: Use docker-compose which has all the right settings
        docker-compose run --rm autosynth bash
    else
        # macOS: Custom docker run with appropriate settings
        # Note: Audio and some X11 features may be limited on macOS
        docker run -it --rm \
            --name autosynth-dev \
            -v "$PROJECT_DIR:/workspace" \
            -v "$PROJECT_DIR/.docker-state/claude:/home/ubuntu/.claude" \
            -e DISPLAY=host.docker.internal:0 \
            --security-opt seccomp=unconfined \
            -w /workspace \
            autosynth-dev:latest \
            bash
    fi
}

run_claude() {
    info "Starting container with Claude Code..."
    cd "$PROJECT_DIR"

    # Create persistent directory for Claude auth (entire .claude dir)
    mkdir -p "$PROJECT_DIR/.docker-state/claude"

    # Copy default settings if not present
    if [ ! -f "$PROJECT_DIR/.docker-state/claude/settings.json" ]; then
        cp "$PROJECT_DIR/docker/claude-settings.json" "$PROJECT_DIR/.docker-state/claude/settings.json" 2>/dev/null || true
    fi

    if [ "$PLATFORM" = "linux" ]; then
        docker-compose run --rm autosynth claude
    else
        docker run -it --rm \
            --name autosynth-dev \
            -v "$PROJECT_DIR:/workspace" \
            -v "$PROJECT_DIR/.docker-state/claude:/home/ubuntu/.claude" \
            -e DISPLAY=host.docker.internal:0 \
            --security-opt seccomp=unconfined \
            -w /workspace \
            autosynth-dev:latest \
            claude
    fi
}

run_synth() {
    local unsafe=""
    local prompt=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --unsafe)
                unsafe="--dangerously-skip-permissions"
                shift
                ;;
            *)
                prompt="$1"
                shift
                ;;
        esac
    done

    if [ -z "$prompt" ]; then
        error "Usage: $0 synth [--unsafe] \"Your synth description\""
        error "Example: $0 synth --unsafe \"A clone of a Subharmonicon from Moog\""
        exit 1
    fi

    info "Creating synth: $prompt"
    cd "$PROJECT_DIR"

    # Create persistent directory for Claude auth (entire .claude dir)
    mkdir -p "$PROJECT_DIR/.docker-state/claude"

    # Copy default settings if not present
    if [ ! -f "$PROJECT_DIR/.docker-state/claude/settings.json" ]; then
        cp "$PROJECT_DIR/docker/claude-settings.json" "$PROJECT_DIR/.docker-state/claude/settings.json" 2>/dev/null || true
    fi

    # Build the full prompt for the project-coordinator
    local full_prompt="@project-coordinator Build me a synthesizer: $prompt"

    # jq filter to format stream-json output nicely
    local jq_filter='
        if .type == "assistant" then
            .message.content[]? |
            if .type == "text" then "\(.text)"
            elif .type == "tool_use" then "\n\u001b[36m▶ \(.name)\u001b[0m"
            else empty end
        elif .type == "result" then
            if .result then "\n\u001b[32m✓ Done\u001b[0m"
            else empty end
        else empty end
    '

    if [ "$PLATFORM" = "linux" ]; then
        docker-compose run --rm -T autosynth claude $unsafe --verbose --output-format stream-json -p "$full_prompt" | jq -rj "$jq_filter"
    else
        # Use -i without -t since we're piping output (not interactive TTY)
        docker run -i --rm \
            --name autosynth-dev \
            -v "$PROJECT_DIR:/workspace" \
            -v "$PROJECT_DIR/.docker-state/claude:/home/ubuntu/.claude" \
            -e DISPLAY=host.docker.internal:0 \
            --security-opt seccomp=unconfined \
            -w /workspace \
            autosynth-dev:latest \
            claude $unsafe --verbose --output-format stream-json -p "$full_prompt" | jq -rj "$jq_filter"
    fi
    echo  # Final newline
}

show_help() {
    echo "AutoSynth Docker Development Environment"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build                Build the Docker image"
    echo "  run                  Start a bash shell in the container"
    echo "  claude               Start the container and run Claude Code"
    echo "  synth [--unsafe] \"prompt\"  Create a synth from a description"
    echo "  test-x11             Test X11 display"
    echo "  test-audio           Test audio output"
    echo "  help                 Show this help message"
    echo ""
    echo "Claude Code will prompt for OAuth login on first run (Pro/Max)."
    echo "Login persists in .docker-state/claude/"
    echo ""
    echo "Examples:"
    echo "  $0 build                                    # Build the image first"
    echo "  $0 run                                      # Start interactive shell"
    echo "  $0 claude                                   # Start Claude Code directly"
    echo "  $0 synth \"A Minimoog Model D clone\"        # Create a synth"
    echo "  $0 synth --unsafe \"A Moog Subharmonicon\"   # Create without prompts"
}

test_x11() {
    info "Testing X11 display..."
    cd "$PROJECT_DIR"

    if [ "$PLATFORM" = "linux" ]; then
        docker-compose run --rm autosynth xeyes
    else
        docker run -it --rm \
            -e DISPLAY=host.docker.internal:0 \
            autosynth-dev:latest \
            xeyes
    fi
}

test_audio() {
    info "Testing audio output..."
    cd "$PROJECT_DIR"

    if [ "$PLATFORM" = "linux" ]; then
        docker-compose run --rm autosynth speaker-test -t sine -f 440 -l 1
    else
        warn "Audio testing on macOS requires additional setup"
        warn "Consider using PulseAudio TCP server on host"
    fi
}

# Main
case "${1:-help}" in
    build)
        build_image
        ;;
    run)
        [ "$PLATFORM" = "linux" ] && setup_linux
        [ "$PLATFORM" = "macos" ] && setup_macos
        run_container
        ;;
    claude)
        [ "$PLATFORM" = "linux" ] && setup_linux
        [ "$PLATFORM" = "macos" ] && setup_macos
        run_claude
        ;;
    synth)
        [ "$PLATFORM" = "linux" ] && setup_linux
        [ "$PLATFORM" = "macos" ] && setup_macos
        shift  # Remove 'synth' from args
        run_synth "$@"
        ;;
    test-x11)
        [ "$PLATFORM" = "linux" ] && setup_linux
        [ "$PLATFORM" = "macos" ] && setup_macos
        test_x11
        ;;
    test-audio)
        [ "$PLATFORM" = "linux" ] && setup_linux
        test_audio
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
