#!/bin/bash

# build-all.sh - Build all WASM synthesizers
#
# Usage:
#   ./scripts/build-all.sh [--clean]
#
# Options:
#   --clean  Clean before building

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

CLEAN_BUILD=false
SYNTHS_DIR="synths"
BUILD_LOG="build.log"
FAILED_BUILDS=()
SUCCESSFUL_BUILDS=()

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AutoSynth - Build All Synths${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Find all synths
SYNTH_DIRS=$(find "$SYNTHS_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)

if [ -z "$SYNTH_DIRS" ]; then
    echo -e "${YELLOW}No synths found in $SYNTHS_DIR/${NC}"
    exit 0
fi

SYNTH_COUNT=$(echo "$SYNTH_DIRS" | wc -l)
echo -e "${GREEN}Found $SYNTH_COUNT synth(s) to build${NC}"
echo ""

BUILD_NUM=0

for SYNTH_DIR in $SYNTH_DIRS; do
    BUILD_NUM=$((BUILD_NUM + 1))
    SYNTH_NAME=$(basename "$SYNTH_DIR")

    echo -e "${BLUE}[$BUILD_NUM/$SYNTH_COUNT]${NC} ${YELLOW}$SYNTH_NAME${NC}"

    # Check if Makefile exists
    if [ ! -f "$SYNTH_DIR/Makefile" ]; then
        echo -e "  ${RED}✗ No Makefile found, skipping${NC}"
        FAILED_BUILDS+=("$SYNTH_NAME (no Makefile)")
        continue
    fi

    # Clean if requested
    if [ "$CLEAN_BUILD" = true ]; then
        echo -e "  Cleaning..."
        (cd "$SYNTH_DIR" && make clean > /dev/null 2>&1) || true
    fi

    # Build WASM
    echo -e "  Building WASM..."
    if (cd "$SYNTH_DIR" && make wasm >> "$BUILD_LOG" 2>&1); then
        WASM_SIZE=$(ls -lh "$SYNTH_DIR/ui/public/synth.wasm" 2>/dev/null | awk '{print $5}')
        echo -e "  ${GREEN}✓ WASM built${NC} (${WASM_SIZE})"
        SUCCESSFUL_BUILDS+=("$SYNTH_NAME")
    else
        echo -e "  ${RED}✗ WASM build failed${NC}"
        FAILED_BUILDS+=("$SYNTH_NAME (WASM)")
        continue
    fi

    # Build UI
    if [ -d "$SYNTH_DIR/ui" ]; then
        echo -e "  Building UI..."

        # Install dependencies if needed
        if [ ! -d "$SYNTH_DIR/ui/node_modules" ]; then
            (cd "$SYNTH_DIR/ui" && npm install --silent >> "$BUILD_LOG" 2>&1)
        fi

        # Build
        if (cd "$SYNTH_DIR/ui" && npm run build >> "$BUILD_LOG" 2>&1); then
            echo -e "  ${GREEN}✓ UI built${NC}"
        else
            echo -e "  ${RED}✗ UI build failed${NC}"
            FAILED_BUILDS+=("$SYNTH_NAME (UI)")
        fi
    fi

    echo ""
done

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Build Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Successful builds
if [ ${#SUCCESSFUL_BUILDS[@]} -gt 0 ]; then
    echo -e "${GREEN}✓ Successful builds (${#SUCCESSFUL_BUILDS[@]}):${NC}"
    for synth in "${SUCCESSFUL_BUILDS[@]}"; do
        echo -e "  ${GREEN}•${NC} $synth"
    done
    echo ""
fi

# Failed builds
if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
    echo -e "${RED}✗ Failed builds (${#FAILED_BUILDS[@]}):${NC}"
    for synth in "${FAILED_BUILDS[@]}"; do
        echo -e "  ${RED}•${NC} $synth"
    done
    echo ""
    echo -e "${YELLOW}See $BUILD_LOG for details${NC}"
    echo ""
    exit 1
fi

# All successful
echo -e "${GREEN}✓ All builds successful!${NC}"
echo ""

# Show total size
TOTAL_SIZE=$(du -sh "$SYNTHS_DIR/*/ui/public/*.wasm" 2>/dev/null | awk '{sum+=$1} END {print sum}')
if [ ! -z "$TOTAL_SIZE" ]; then
    echo -e "Total WASM size: ${YELLOW}$TOTAL_SIZE${NC}"
    echo ""
fi
