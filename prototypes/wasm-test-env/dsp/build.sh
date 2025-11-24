#!/bin/bash

# Build script for compiling Faust DSP to WebAssembly
# Requires: faust compiler installed

set -e

echo "Compiling Faust DSP to WebAssembly..."

# Check if faust is installed
if ! command -v faust &> /dev/null; then
    echo "Error: faust compiler not found. Please install Faust:"
    echo "  https://faust.grame.fr/"
    exit 1
fi

# Create output directory
mkdir -p ../public/dsp

# Compile simple-synth.dsp to WebAssembly
faust2wasm -worklet simple-synth.dsp

# Move generated files to public directory
if [ -f "simple-synth.wasm" ]; then
    mv simple-synth.wasm ../public/dsp/
    echo "✓ WebAssembly module generated: public/dsp/simple-synth.wasm"
fi

if [ -f "simple-synth-processor.js" ]; then
    mv simple-synth-processor.js ../public/dsp/
    echo "✓ AudioWorklet processor generated: public/dsp/simple-synth-processor.js"
fi

echo ""
echo "Build complete! Files generated:"
echo "  - public/dsp/simple-synth.wasm"
echo "  - public/dsp/simple-synth-processor.js"
echo ""
echo "Note: If you modify the .dsp file, run this script again to rebuild."
