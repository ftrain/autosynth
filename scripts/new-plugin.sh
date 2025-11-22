#!/bin/bash
#
# new-plugin.sh - Create a new plugin from the template
#
# Usage: ./scripts/new-plugin.sh "Plugin Name" "PluginCode" "PlCd"
#
# Arguments:
#   $1 - Plugin display name (e.g., "My Awesome Synth")
#   $2 - Plugin class name (e.g., "MyAwesomeSynth", no spaces)
#   $3 - 4-character plugin code (e.g., "MASy")
#
# Example:
#   ./scripts/new-plugin.sh "Warm Bass" "WarmBass" "WmBs"
#

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Validate arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 \"Plugin Name\" \"PluginClassName\" \"PlCd\""
    echo ""
    echo "Arguments:"
    echo "  Plugin Name     - Display name (e.g., \"My Synth\")"
    echo "  PluginClassName - Class name, no spaces (e.g., \"MySynth\")"
    echo "  PlCd            - 4-character plugin code (e.g., \"MySy\")"
    echo ""
    echo "Example:"
    echo "  $0 \"Warm Bass\" \"WarmBass\" \"WmBs\""
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

# Determine paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/templates/plugin-template"
TARGET_DIR="$REPO_ROOT/plugins/$PLUGIN_CLASS"

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

log_info "Creating new plugin: $PLUGIN_NAME"
log_info "Class name: $PLUGIN_CLASS"
log_info "Plugin code: $PLUGIN_CODE"
log_info "Target: $TARGET_DIR"
echo ""

# Create branch name from plugin class (lowercase with hyphens)
BRANCH_NAME="plugin/$(echo "$PLUGIN_CLASS" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')"

# Create and switch to new branch
log_info "Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Create target directory
mkdir -p "$(dirname "$TARGET_DIR")"

# Copy template
log_info "Copying template..."
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
log_info "Replacing placeholders..."

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

# Rename class files if needed
# (Template uses PluginProcessor which is generic, so no renaming needed)

# ============================================================================
# LINK CACHED LIBRARIES (Docker environment)
# If running in Docker with pre-cached JUCE/SST, symlink them for instant setup
# ============================================================================
if [ -d "/opt/JUCE" ] && [ -d "/opt/sst" ]; then
    log_info "Docker environment detected - linking cached libraries..."

    # Link JUCE
    ln -sf /opt/JUCE "$TARGET_DIR/JUCE"

    # Link SST libraries
    mkdir -p "$TARGET_DIR/libs/sst"
    ln -sf /opt/sst/sst-basic-blocks "$TARGET_DIR/libs/sst/sst-basic-blocks"
    ln -sf /opt/sst/sst-filters "$TARGET_DIR/libs/sst/sst-filters"
    ln -sf /opt/sst/sst-effects "$TARGET_DIR/libs/sst/sst-effects"
    ln -sf /opt/sst/sst-waveshapers "$TARGET_DIR/libs/sst/sst-waveshapers"

    log_info "Libraries linked (no git submodule setup needed)"

    # Build UI
    log_info "Installing UI dependencies..."
    cd "$TARGET_DIR/ui"
    npm install --silent
    npm run build --silent
    cd "$REPO_ROOT"

    log_info "Plugin created and ready to build!"
    log_info "Branch: $BRANCH_NAME"
    echo ""
    echo "Build immediately:"
    echo "  cd $TARGET_DIR"
    echo "  cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release"
    echo "  cmake --build build"
    echo ""
    echo "Or use: ./scripts/dev.sh build-plugin $TARGET_DIR"
    echo ""
else
    # Standard setup (outside Docker)
    log_info "Plugin created successfully!"
    log_info "Branch: $BRANCH_NAME"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Add git submodules:"
    echo "     cd $TARGET_DIR"
    echo "     git submodule add https://github.com/juce-framework/JUCE.git JUCE"
    echo "     git submodule add https://github.com/surge-synthesizer/sst-basic-blocks.git libs/sst/sst-basic-blocks"
    echo "     git submodule add https://github.com/surge-synthesizer/sst-filters.git libs/sst/sst-filters"
    echo "     git submodule add https://github.com/surge-synthesizer/sst-effects.git libs/sst/sst-effects"
    echo "     git submodule add https://github.com/surge-synthesizer/sst-waveshapers.git libs/sst/sst-waveshapers"
    echo ""
    echo "  2. Build the UI:"
    echo "     cd $TARGET_DIR/ui"
    echo "     npm install"
    echo "     npm run build"
    echo ""
    echo "  3. Build the plugin:"
    echo "     cd $TARGET_DIR"
    echo "     cmake -B build -DCMAKE_BUILD_TYPE=Release"
    echo "     cmake --build build --config Release"
    echo ""
    echo "  TIP: Use Docker for faster setup: ./scripts/dev.sh"
    echo ""
fi

echo "  Start developing:"
echo "    - Edit source/dsp/Voice.h for DSP"
echo "    - Edit ui/src/App.tsx for UI"
echo "    - See README.md for more info"
echo ""
