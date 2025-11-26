# AutoSynth Production Build
# Multi-stage Dockerfile for building and serving all WASM synths
#
# Stage 1: Compile all synths to WASM using Emscripten
# Stage 2: Build all React UIs with Vite
# Stage 3: Serve everything with Nginx

# ============================================================================
# Stage 1: WASM Build
# ============================================================================
FROM emscripten/emsdk:3.1.51 AS wasm-builder

WORKDIR /build

# Copy DSP libraries (git submodules)
COPY libs/ ./libs/

# Copy all synth DSP code
COPY synths/ ./synths/

# Build all WASM modules
RUN for synth_dir in synths/*/; do \
      if [ -f "$synth_dir/Makefile" ]; then \
        echo "Building WASM for $(basename $synth_dir)..."; \
        cd "$synth_dir" && make wasm && cd /build; \
      fi \
    done

# Verify WASM builds
RUN echo "WASM Modules Built:" && \
    find synths -name "synth.wasm" -exec ls -lh {} \;

# ============================================================================
# Stage 2: React UI Build
# ============================================================================
FROM node:20-slim AS react-builder

WORKDIR /build

# Copy core UI components (shared across all synths)
COPY core/ui/ ./core/ui/

# Install core UI dependencies (if needed)
RUN if [ -f "core/ui/package.json" ]; then \
      cd core/ui && npm install --production; \
    fi

# Copy all synth UIs
COPY synths/ ./synths/

# Copy WASM modules from previous stage
COPY --from=wasm-builder /build/synths/*/ui/public/*.wasm /build/synths/*/ui/public/
COPY --from=wasm-builder /build/synths/*/ui/public/*.js /build/synths/*/ui/public/

# Build all React UIs
RUN for synth_dir in synths/*/ui/; do \
      if [ -f "$synth_dir/package.json" ]; then \
        echo "Building UI for $(basename $(dirname $synth_dir))..."; \
        cd "$synth_dir" && \
        npm install --production && \
        npm run build && \
        cd /build; \
      fi \
    done

# Verify UI builds
RUN echo "UI Builds Complete:" && \
    find synths -name "dist" -type d -exec ls -lh {} \;

# ============================================================================
# Stage 3: Website Build
# ============================================================================
FROM node:20-slim AS website-builder

WORKDIR /build

# Copy website source
COPY website/ ./website/

# Build website (synth browser/launcher)
RUN cd website && \
    npm install --production && \
    npm run build

# ============================================================================
# Stage 4: Nginx Server
# ============================================================================
FROM nginx:alpine

# Install necessary packages
RUN apk add --no-cache \
    curl \
    bash

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy website (home page)
COPY --from=website-builder /build/website/dist/ /usr/share/nginx/html/

# Copy all synth builds
COPY --from=react-builder /build/synths/*/ui/dist/ /usr/share/nginx/html/synths/

# Create synth manifest (list of all available synths)
RUN echo '#!/bin/bash' > /create-manifest.sh && \
    echo 'cd /usr/share/nginx/html/synths' >> /create-manifest.sh && \
    echo 'echo "[" > ../synths.json' >> /create-manifest.sh && \
    echo 'first=true' >> /create-manifest.sh && \
    echo 'for synth in */; do' >> /create-manifest.sh && \
    echo '  if [ "$first" = true ]; then first=false; else echo "," >> ../synths.json; fi' >> /create-manifest.sh && \
    echo '  name=$(basename "$synth")' >> /create-manifest.sh && \
    echo '  echo "  {\"name\": \"$name\", \"path\": \"/synths/$name/\"}" >> ../synths.json' >> /create-manifest.sh && \
    echo 'done' >> /create-manifest.sh && \
    echo 'echo "]" >> ../synths.json' >> /create-manifest.sh && \
    chmod +x /create-manifest.sh && \
    /create-manifest.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
