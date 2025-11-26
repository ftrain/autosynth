# AutoSynth Development Container
# X11 + Audio (PulseAudio/ALSA) + JUCE Build Environment
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Core build tools and X11
RUN apt-get update && apt-get install -y \
    # Build essentials
    build-essential \
    cmake \
    ninja-build \
    git \
    curl \
    wget \
    pkg-config \
    # X11 and GUI
    libx11-dev \
    libxrandr-dev \
    libxinerama-dev \
    libxcursor-dev \
    libxi-dev \
    libxcomposite-dev \
    libxext-dev \
    libxrender-dev \
    libxfixes-dev \
    libxdamage-dev \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    mesa-utils \
    x11-apps \
    xauth \
    # Audio - ALSA
    libasound2-dev \
    alsa-utils \
    # Audio - PulseAudio
    pulseaudio \
    libpulse-dev \
    pulseaudio-utils \
    # Audio - JACK (optional, for pro audio)
    libjack-jackd2-dev \
    # JUCE dependencies
    libfreetype6-dev \
    libcurl4-openssl-dev \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    # Fonts
    fonts-liberation \
    fonts-dejavu-core \
    # Node.js for React UI
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Use existing ubuntu user (UID 1000) and grant sudo
RUN apt-get update \
    && apt-get install -y sudo \
    && echo "ubuntu ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu \
    && chmod 0440 /etc/sudoers.d/ubuntu \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# PulseAudio configuration for container
RUN mkdir -p /etc/pulse && \
    echo "load-module module-native-protocol-unix auth-anonymous=1" >> /etc/pulse/default.pa && \
    echo "load-module module-native-protocol-tcp auth-anonymous=1" >> /etc/pulse/default.pa

# Set up working directory
WORKDIR /workspace

# Switch to non-root user
USER ubuntu

# Create directories for Claude Code config
RUN mkdir -p /home/ubuntu/.claude

# Default command
CMD ["/bin/bash"]
