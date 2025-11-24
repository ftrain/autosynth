# DFAM Web Synth - Emscripten Build

EMCC = emcc
SRC = src/dsp/wasm_bindings.cpp
OUT = public/dfam.js

EMCC_FLAGS = \
	-std=c++17 \
	-O3 \
	-s WASM=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME="createDFAMModule" \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s INITIAL_MEMORY=33554432 \
	-s ENVIRONMENT='web,worker' \
	--bind \
	-I src/dsp

.PHONY: all clean wasm

all: wasm

wasm: $(OUT)

$(OUT): $(SRC) src/dsp/dfam_dsp.h
	@mkdir -p public
	$(EMCC) $(EMCC_FLAGS) $(SRC) -o $(OUT)
	@echo "Build complete: $(OUT)"

clean:
	rm -f public/dfam.js public/dfam.wasm
