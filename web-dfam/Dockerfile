# DFAM Web Synth - Build and Serve
FROM emscripten/emsdk:3.1.51 AS wasm-builder

WORKDIR /app

# Copy DSP source
COPY src/dsp/ src/dsp/
COPY Makefile .

# Build WASM
RUN mkdir -p public && \
    emcc -std=c++17 -O3 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createDFAMModule" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=33554432 \
    -s ENVIRONMENT='web,worker' \
    --bind \
    -I src/dsp \
    src/dsp/wasm_bindings.cpp \
    -o public/dfam.js

# Node stage for React build
FROM node:20-slim AS react-builder

WORKDIR /app

# Copy package files
COPY package.json .
RUN npm install

# Copy source
COPY . .

# Copy WASM from previous stage
COPY --from=wasm-builder /app/public/dfam.js public/
COPY --from=wasm-builder /app/public/dfam.wasm public/

# Build React app
RUN npm run build

# Final serve stage
FROM nginx:alpine

# Copy built files
COPY --from=react-builder /app/dist /usr/share/nginx/html
COPY --from=wasm-builder /app/public/dfam.js /usr/share/nginx/html/
COPY --from=wasm-builder /app/public/dfam.wasm /usr/share/nginx/html/
COPY public/dfam-processor.js /usr/share/nginx/html/

# Configure nginx for SPA and CORS headers
RUN echo 'server { \
    listen 8080; \
    root /usr/share/nginx/html; \
    index index.html; \
    add_header Cross-Origin-Opener-Policy same-origin; \
    add_header Cross-Origin-Embedder-Policy require-corp; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|wasm)$ { \
        add_header Cross-Origin-Opener-Policy same-origin; \
        add_header Cross-Origin-Embedder-Policy require-corp; \
        add_header Content-Type application/javascript; \
    } \
    location ~* \.wasm$ { \
        add_header Content-Type application/wasm; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
