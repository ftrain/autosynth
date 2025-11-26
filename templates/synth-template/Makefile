# Makefile for {{SYNTH_NAME}} WASM build
#
# Usage:
#   make wasm    - Build WASM module
#   make clean   - Remove build artifacts

# Emscripten compiler
EMCC = emcc

# Source files
SRC = dsp/wasm_bindings.cpp

# Output files
OUT_DIR = ui/public
OUT = $(OUT_DIR)/synth.js

# Compiler flags
EMCC_FLAGS = \
  -std=c++17 \
  -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createSynthModule" \
  -s EXPORTED_FUNCTIONS="['_init','_process','_setParameter','_getParameter','_noteOn','_noteOff','_midiCC','_pitchBend','_shutdown','_getVersion']" \
  -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=33554432 \
  -s MAXIMUM_MEMORY=67108864 \
  -s ENVIRONMENT='web,worker' \
  -s ASSERTIONS=0 \
  --no-entry \
  -I dsp \
  -I ../../libs/sst-basic-blocks/include \
  -I ../../libs/sst-filters/include \
  -I ../../libs/sst-effects/include \
  -I ../../libs/airwin2rack \
  -I ../../libs/chowdsp_utils/include

# Development flags (for debugging)
DEV_FLAGS = \
  -s ASSERTIONS=1 \
  -s SAFE_HEAP=1 \
  -s STACK_OVERFLOW_CHECK=2 \
  -g

.PHONY: all wasm dev clean

all: wasm

wasm: $(OUT)

$(OUT): $(SRC) dsp/*.h
	@echo "Building WASM module..."
	@mkdir -p $(OUT_DIR)
	$(EMCC) $(EMCC_FLAGS) $(SRC) -o $(OUT)
	@echo "✓ WASM built: $(OUT)"
	@ls -lh $(OUT_DIR)/synth.wasm | awk '{print "  Size:", $$5}'

dev: EMCC_FLAGS += $(DEV_FLAGS)
dev: $(OUT)

clean:
	@echo "Cleaning build artifacts..."
	@rm -f $(OUT_DIR)/synth.js $(OUT_DIR)/synth.wasm
	@echo "✓ Clean complete"

# Help target
help:
	@echo "{{SYNTH_NAME}} Build System"
	@echo ""
	@echo "Targets:"
	@echo "  make wasm    - Build optimized WASM module"
	@echo "  make dev     - Build with debug symbols and assertions"
	@echo "  make clean   - Remove build artifacts"
	@echo ""
	@echo "Output:"
	@echo "  $(OUT_DIR)/synth.js   - JavaScript loader"
	@echo "  $(OUT_DIR)/synth.wasm - WebAssembly module"
