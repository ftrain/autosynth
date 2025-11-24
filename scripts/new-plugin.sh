#!/bin/bash
#
# new-plugin.sh - Create a new plugin from the template
#
# Usage:
#   ./scripts/new-plugin.sh [type] "Plugin Name" "PluginCode" "PlCd"
#
# Arguments:
#   type (optional) - Plugin type: synth, effect, or midi (default: synth)
#   $1 - Plugin display name (e.g., "My Awesome Synth")
#   $2 - Plugin class name (e.g., "MyAwesomeSynth", no spaces)
#   $3 - 4-character plugin code (e.g., "MASy")
#
# Examples:
#   ./scripts/new-plugin.sh "Warm Bass" "WarmBass" "WmBs"          # Creates synth
#   ./scripts/new-plugin.sh synth "Warm Bass" "WarmBass" "WmBs"    # Creates synth
#   ./scripts/new-plugin.sh effect "Tape Delay" "TapeDelay" "TpDl" # Creates effect
#   ./scripts/new-plugin.sh midi "Arp Generator" "ArpGen" "ArpG"   # Creates MIDI util
#

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Determine plugin type from first argument
PLUGIN_TYPE="synth"
if [ "$1" = "synth" ] || [ "$1" = "effect" ] || [ "$1" = "midi" ]; then
    PLUGIN_TYPE="$1"
    shift
fi

# Validate arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 [type] \"Plugin Name\" \"PluginClassName\" \"PlCd\""
    echo ""
    echo "Arguments:"
    echo "  type (optional) - Plugin type: synth, effect, or midi (default: synth)"
    echo "  Plugin Name     - Display name (e.g., \"My Synth\")"
    echo "  PluginClassName - Class name, no spaces (e.g., \"MySynth\")"
    echo "  PlCd            - 4-character plugin code (e.g., \"MySy\")"
    echo ""
    echo "Examples:"
    echo "  $0 \"Warm Bass\" \"WarmBass\" \"WmBs\"          # Creates synth"
    echo "  $0 synth \"Warm Bass\" \"WarmBass\" \"WmBs\"    # Creates synth"
    echo "  $0 effect \"Tape Delay\" \"TapeDelay\" \"TpDl\" # Creates effect"
    echo "  $0 midi \"Arp Generator\" \"ArpGen\" \"ArpG\"   # Creates MIDI util"
    echo ""
    echo "Plugin locations:"
    echo "  synth  -> plugins/synths/<PluginClassName>"
    echo "  effect -> plugins/effects/<PluginClassName>"
    echo "  midi   -> plugins/midi/<PluginClassName>"
    exit 1
fi

PLUGIN_NAME="$1"
PLUGIN_CLASS="$2"
PLUGIN_CODE="$3"

# Validate plugin code length
if [ ${#PLUGIN_CODE} -ne 4 ]; then
    log_error "Plugin code must be exactly 4 characters"
    exit 1
fi

# Validate class name (no spaces, alphanumeric)
if [[ ! "$PLUGIN_CLASS" =~ ^[a-zA-Z][a-zA-Z0-9]*$ ]]; then
    log_error "Plugin class name must start with a letter and contain only alphanumeric characters"
    exit 1
fi

# Determine paths based on type
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/templates/plugin-template"

case "$PLUGIN_TYPE" in
    synth)
        TARGET_DIR="$REPO_ROOT/plugins/synths/$PLUGIN_CLASS"
        TYPE_LABEL="Synthesizer"
        ;;
    effect)
        TARGET_DIR="$REPO_ROOT/plugins/effects/$PLUGIN_CLASS"
        TYPE_LABEL="Effect"
        ;;
    midi)
        TARGET_DIR="$REPO_ROOT/plugins/midi/$PLUGIN_CLASS"
        TYPE_LABEL="MIDI Utility"
        ;;
    *)
        log_error "Unknown plugin type: $PLUGIN_TYPE"
        exit 1
        ;;
esac

# Check template exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    log_error "Template not found at $TEMPLATE_DIR"
    exit 1
fi

# Check target doesn't exist
if [ -d "$TARGET_DIR" ]; then
    log_error "Target directory already exists: $TARGET_DIR"
    exit 1
fi

echo ""
log_info "Creating new $TYPE_LABEL: $PLUGIN_NAME"
log_info "  Type: $PLUGIN_TYPE"
log_info "  Class: $PLUGIN_CLASS"
log_info "  Code: $PLUGIN_CODE"
log_info "  Path: $TARGET_DIR"
echo ""

# Create branch name from plugin class (lowercase with hyphens)
BRANCH_NAME="plugin/$(echo "$PLUGIN_CLASS" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')"

# Create and switch to new branch
log_step "Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" 2>/dev/null || {
    log_warn "Branch already exists or error creating branch"
    log_info "Continuing on current branch..."
}

# Create target directory
mkdir -p "$(dirname "$TARGET_DIR")"

# Copy template
log_step "Copying template..."
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

# Remove .git if it exists (from template development)
rm -rf "$TARGET_DIR/.git"

# Function to replace in files
replace_in_file() {
    local file="$1"
    local search="$2"
    local replace="$3"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/$search/$replace/g" "$file"
    else
        # Linux
        sed -i "s/$search/$replace/g" "$file"
    fi
}

# Replace placeholders in all files
log_step "Replacing placeholders..."

# Find all text files and replace
find "$TARGET_DIR" -type f \( \
    -name "*.h" -o \
    -name "*.cpp" -o \
    -name "*.txt" -o \
    -name "*.cmake" -o \
    -name "*.json" -o \
    -name "*.ts" -o \
    -name "*.tsx" -o \
    -name "*.md" -o \
    -name "*.yml" -o \
    -name "*.yaml" -o \
    -name "*.css" -o \
    -name "*.html" \
\) | while read -r file; do
    # Replace project name in CMake
    replace_in_file "$file" "MyPlugin" "$PLUGIN_CLASS"
    replace_in_file "$file" "My Plugin" "$PLUGIN_NAME"
    replace_in_file "$file" "My Synth" "$PLUGIN_NAME"
    replace_in_file "$file" "MySynth" "$PLUGIN_CLASS"

    # Replace template placeholder
    replace_in_file "$file" "{{SYNTH_NAME}}" "$PLUGIN_NAME"

    # Replace plugin code
    replace_in_file "$file" "MyPl" "$PLUGIN_CODE"
    replace_in_file "$file" "MySy" "$PLUGIN_CODE"

    # Replace in package.json
    replace_in_file "$file" "plugin-ui" "${PLUGIN_CLASS,,}-ui"
done

# Update CMakeLists.txt specifically
CMAKE_FILE="$TARGET_DIR/CMakeLists.txt"
if [ -f "$CMAKE_FILE" ]; then
    replace_in_file "$CMAKE_FILE" 'set(PLUGIN_NAME "MyPlugin")' "set(PLUGIN_NAME \"$PLUGIN_NAME\")"
    replace_in_file "$CMAKE_FILE" 'set(PLUGIN_CODE "MyPl")' "set(PLUGIN_CODE \"$PLUGIN_CODE\")"
fi

# ============================================================================
# MONOREPO SETUP: Link to shared libraries
# ============================================================================

# For monorepo builds, we use the root-level libs/
# Individual plugin CMakeLists.txt will be updated to find libs relative to repo root

log_step "Setting up monorepo library paths..."

# Create symlinks to root-level JUCE and SST
LIBS_DIR="$TARGET_DIR/libs"
mkdir -p "$LIBS_DIR/sst"

# Check for Docker environment first
if [ -d "/opt/JUCE" ] && [ -d "/opt/sst" ]; then
    log_info "Docker environment detected - linking cached libraries..."
    ln -sf /opt/JUCE "$TARGET_DIR/JUCE"
    ln -sf /opt/sst/sst-basic-blocks "$LIBS_DIR/sst/sst-basic-blocks"
    ln -sf /opt/sst/sst-filters "$LIBS_DIR/sst/sst-filters"
    ln -sf /opt/sst/sst-effects "$LIBS_DIR/sst/sst-effects"
    ln -sf /opt/sst/sst-waveshapers "$LIBS_DIR/sst/sst-waveshapers"
else
    # Link to repo-level libraries
    if [ -d "$REPO_ROOT/libs/JUCE" ]; then
        ln -sf "$REPO_ROOT/libs/JUCE" "$TARGET_DIR/JUCE"
    fi
    if [ -d "$REPO_ROOT/libs/sst-basic-blocks" ]; then
        ln -sf "$REPO_ROOT/libs/sst-basic-blocks" "$LIBS_DIR/sst/sst-basic-blocks"
    fi
    if [ -d "$REPO_ROOT/libs/sst-filters" ]; then
        ln -sf "$REPO_ROOT/libs/sst-filters" "$LIBS_DIR/sst/sst-filters"
    fi
    if [ -d "$REPO_ROOT/libs/sst-effects" ]; then
        ln -sf "$REPO_ROOT/libs/sst-effects" "$LIBS_DIR/sst/sst-effects"
    fi
    if [ -d "$REPO_ROOT/libs/sst-waveshapers" ]; then
        ln -sf "$REPO_ROOT/libs/sst-waveshapers" "$LIBS_DIR/sst/sst-waveshapers"
    fi
fi

# ============================================================================
# Build UI
# ============================================================================

if [ -d "$TARGET_DIR/ui" ]; then
    if command -v npm &> /dev/null; then
        log_step "Installing UI dependencies..."
        cd "$TARGET_DIR/ui"
        npm install --silent 2>/dev/null || npm install
        npm run build --silent 2>/dev/null || npm run build
        cd "$REPO_ROOT"
    else
        log_warn "npm not found - skip UI build. Run 'npm install && npm run build' in ui/ later."
    fi
fi

# ============================================================================
# Done!
# ============================================================================

echo ""
log_info "Plugin created successfully!"
echo ""
echo "Location: $TARGET_DIR"
echo ""
echo "Build options:"
echo ""
echo "  Option 1 - Single plugin build:"
echo "    cd $TARGET_DIR"
echo "    cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release"
echo "    cmake --build build"
echo ""
echo "  Option 2 - Monorepo build (from repo root):"
echo "    cmake -B build -DPLUGINS=\"$PLUGIN_CLASS\""
echo "    cmake --build build"
echo ""
echo "  Option 3 - Build all ${PLUGIN_TYPE}s:"
echo "    cmake -B build -DBUILD_$(echo $PLUGIN_TYPE | tr '[:lower:]' '[:upper:]')S=ON"
echo "    cmake --build build"
echo ""
echo "Development:"
echo "  - Edit source/dsp/Voice.h for DSP"
echo "  - Edit ui/src/App.tsx for UI"
echo "  - Run 'npm run dev' in ui/ for live reload"
echo ""
