#!/bin/bash

# new-synth.sh - Create a new WASM-first synthesizer from template
#
# Usage:
#   ./scripts/new-synth.sh "My Synth" "MySynth"
#
# Arguments:
#   $1 - Display name (e.g., "Minimoog Clone")
#   $2 - Class name (e.g., "MinimoogClone")

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 2 ]; then
    echo -e "${RED}Error: Invalid arguments${NC}"
    echo ""
    echo "Usage:"
    echo "  ./scripts/new-synth.sh \"Display Name\" \"ClassName\""
    echo ""
    echo "Example:"
    echo "  ./scripts/new-synth.sh \"Minimoog Clone\" \"MinimoogClone\""
    echo ""
    exit 1
fi

SYNTH_NAME="$1"
CLASS_NAME="$2"
SYNTH_NAME_LOWER=$(echo "$CLASS_NAME" | tr '[:upper:]' '[:lower:]')
TARGET_DIR="synths/$CLASS_NAME"
TEMPLATE_DIR="templates/synth-template"

# Check if template exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo -e "${RED}Error: Template directory not found: $TEMPLATE_DIR${NC}"
    exit 1
fi

# Check if synth already exists
if [ -d "$TARGET_DIR" ]; then
    echo -e "${RED}Error: Synth already exists: $TARGET_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AutoSynth - New Synth Generator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Creating new synthesizer:${NC}"
echo -e "  Display name: ${YELLOW}$SYNTH_NAME${NC}"
echo -e "  Class name:   ${YELLOW}$CLASS_NAME${NC}"
echo -e "  Directory:    ${YELLOW}$TARGET_DIR${NC}"
echo ""

# Create target directory
echo -e "${BLUE}[1/4]${NC} Creating directory structure..."
mkdir -p "$TARGET_DIR"

# Copy template
cp -r "$TEMPLATE_DIR"/* "$TARGET_DIR/"

# Replace placeholders in all files
echo -e "${BLUE}[2/4]${NC} Replacing placeholders..."

find "$TARGET_DIR" -type f -exec sed -i \
    -e "s/{{SYNTH_NAME}}/$SYNTH_NAME/g" \
    -e "s/{{CLASS_NAME}}/$CLASS_NAME/g" \
    -e "s/{{SYNTH_NAME_LOWER}}/$SYNTH_NAME_LOWER/g" \
    {} \;

# Make build scripts executable
if [ -f "$TARGET_DIR/Makefile" ]; then
    chmod +x "$TARGET_DIR/Makefile" 2>/dev/null || true
fi

echo -e "${BLUE}[3/4]${NC} Installing UI dependencies..."
cd "$TARGET_DIR/ui"
npm install --silent

echo -e "${BLUE}[4/4]${NC} Building WASM module..."
cd ../
make wasm

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Synth created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "  ${BLUE}1.${NC} Customize the DSP engine:"
echo -e "     ${YELLOW}$TARGET_DIR/dsp/Voice.h${NC}"
echo -e "     Add SST/Airwindows/ChowDSP components"
echo ""
echo -e "  ${BLUE}2.${NC} Build the WASM module:"
echo -e "     ${YELLOW}cd $TARGET_DIR && make wasm${NC}"
echo ""
echo -e "  ${BLUE}3.${NC} Start the development server:"
echo -e "     ${YELLOW}cd $TARGET_DIR/ui && npm run dev${NC}"
echo ""
echo -e "  ${BLUE}4.${NC} Open in browser:"
echo -e "     ${YELLOW}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo -e "  • ${YELLOW}$TARGET_DIR/README.md${NC} - Getting started guide"
echo -e "  • ${YELLOW}docs/DSP_LIBRARIES.md${NC} - DSP library reference"
echo -e "  • ${YELLOW}core/ui/COMPONENT_LIBRARY.md${NC} - UI component reference"
echo ""
