# Tape Loop

A tape-based drone synthesizer that records, layers, and loops oscillator drones with authentic tape degradation.

## Concept

Inspired by tape loop artists like William Basinski, this synthesizer creates evolving drone textures through a tape-style looper. Oscillators feed into a circular buffer that continuously plays back while recording new material. With feedback, layers accumulate and degrade over time - wobble, saturation, filtering, and noise all contribute to the characteristic sound of aging tape.

## Features

- **2 Drone Oscillators**: Sine, triangle, and saw waveforms with tuning and detune
- **Tape Loop Buffer**: 0.5 to 10 seconds of recording time
- **Tape Degradation**:
  - Saturation (tanh soft clipping)
  - Wobble (wow/flutter from tape speed variation)
  - Age filter (high frequency loss over time)
  - Tape hiss (filtered noise floor)
- **Feedback Loop**: Control how much signal feeds back (layer accumulation)
- **Mix Control**: Blend dry oscillators with tape loop output

## Parameters

### Oscillator 1
| Parameter | Range | Description |
|-----------|-------|-------------|
| Wave | Sine/Tri/Saw | Waveform selection |
| Tune | -24 to +24 st | Coarse tuning |
| Level | 0-100% | Oscillator volume |

### Oscillator 2
| Parameter | Range | Description |
|-----------|-------|-------------|
| Wave | Sine/Tri/Saw | Waveform selection |
| Tune | -24 to +24 st | Coarse tuning |
| Detune | -100 to +100 ct | Fine detuning |
| Level | 0-100% | Oscillator volume |

### Tape Loop
| Parameter | Range | Description |
|-----------|-------|-------------|
| Length | 0.5-10 s | Loop duration |
| Feedback | 0-100% | Signal recirculation |
| Record | 0-100% | Input level to loop |

### Tape Character
| Parameter | Range | Description |
|-----------|-------|-------------|
| Saturation | 0-100% | Tape compression/warmth |
| Wobble Rate | 0.1-5 Hz | Wow/flutter speed |
| Wobble Depth | 0-100% | Pitch variation amount |

### Tape Noise
| Parameter | Range | Description |
|-----------|-------|-------------|
| Hiss | 0-100% | Background noise level |
| Age | 0-100% | High frequency degradation |

### Mix
| Parameter | Range | Description |
|-----------|-------|-------------|
| Dry | 0-100% | Direct oscillator level |
| Loop | 0-100% | Tape loop output level |
| Master | 0-100% | Final output level |

## Usage

1. Hold a MIDI note to start recording oscillators into the tape loop
2. Release to stop recording (loop continues playing)
3. Hold another note to add more layers
4. Adjust feedback to control how quickly old layers fade
5. Use tape character controls to add warmth and movement
6. Blend dry oscillators with the evolving tape textures

## Building

### Quick Build (Docker recommended)
```bash
# From autosynth root
./scripts/dev.sh

# Inside container
cd plugins/TapeLoop
cd ui && npm install && npm run build && cd ..
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

### Manual Build
```bash
# Build UI first
cd ui
npm install
npm run build
cd ..

# Build plugin
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

## Technical Details

- **DSP**: Custom tape loop engine with SST oscillators
- **UI**: React WebView with SynthRow layout
- **Format**: VST3, AU, Standalone
- **Latency**: Zero latency (tape loop is separate from main signal path)

## License

Copyright 2024 Studio
