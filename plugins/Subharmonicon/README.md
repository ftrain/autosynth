# Subharmonicon

A JUCE 8 clone of the Moog Subharmonicon - a semi-modular polyrhythmic analog synthesizer.

## Features

### Oscillator Section
- **2 VCOs** - Sawtooth oscillators with independent frequency controls (20Hz - 2kHz)
- **4 Subharmonic Oscillators** - Each VCO has 2 subharmonic generators
  - Subharmonics divide the parent VCO frequency by integers 1-16
  - Creates rich, organ-like textures

### Filter Section
- **Moog 4-pole Ladder Filter** (24dB/octave)
- Cutoff frequency: 20Hz - 20kHz
- Resonance with self-oscillation capability
- Attack/Decay envelope modulation

### Envelope Section
- **VCF Envelope** - Attack/Decay for filter modulation
- **VCA Envelope** - Attack/Decay for amplitude

### Polyrhythmic Sequencer
- **2 Four-step Sequencers** - One per VCO
- **4 Rhythm Generators** - Independent clock dividers (1-8)
  - Rhythms 1 & 2 trigger Sequencer 1 (VCO1)
  - Rhythms 3 & 4 trigger Sequencer 2 (VCO2)
- Pitch offset per step: +/- 24 semitones
- Tempo: 20-300 BPM

## Building

### Prerequisites
- CMake 3.22+
- JUCE 8.0.0 (included as submodule)
- Node.js 18+ (for UI)
- Linux: GTK3, WebKitGTK 4.1

### Build Steps

```bash
# 1. Initialize submodules
git submodule update --init --recursive

# 2. Build the UI
cd ui
npm install
npm run build
cd ..

# 3. Build the plugin
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

### Docker Build (Recommended)

If using the Studio Docker environment:

```bash
./scripts/dev.sh
cd plugins/Subharmonicon
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

## Usage

1. **Set VCO Frequencies** - Use the FREQ knobs to set base pitch for each VCO
2. **Configure Subharmonics** - Set division ratios (DIV) and levels for each subharmonic
3. **Set Filter** - Adjust cutoff, resonance, and envelope amount
4. **Configure Sequencer** - Set pitch offsets for each step
5. **Set Rhythm Divisions** - Each rhythm generator divides the master clock
6. **Press RUN** - Start the polyrhythmic sequencer

### Polyrhythm Tips

The magic of the Subharmonicon is in the polyrhythmic sequencer:

- **Simple Pattern**: Set all rhythms to 1 for unison stepping
- **Basic Polyrhythm**: R1=1, R2=2 creates a 2:1 pattern
- **Complex Patterns**: R1=1, R2=3, R3=2, R4=5 creates intricate interlocking patterns
- **Gregorian Textures**: Use 4th and 5th subharmonic divisions for church-like sounds

## Architecture

```
VCO1 (Saw) ----+
SUB1A (/N) ----+---> Mixer ---> Ladder Filter ---> VCA ---> Output
SUB1B (/N) ----+        |            |
VCO2 (Saw) ----+        |            |
SUB2A (/N) ----+     VCF EG      VCA EG
SUB2B (/N) ----+

Sequencer 1 --> VCO1 Pitch
Sequencer 2 --> VCO2 Pitch

Master Clock --> Rhythm 1 & 2 --> Sequencer 1
             --> Rhythm 3 & 4 --> Sequencer 2
```

## Credits

- Original Moog Subharmonicon designed by Moog Music
- DSP implementation inspired by SST libraries
- Built with JUCE 8 framework
- React WebView UI

## License

GPL-3.0-or-later (to match SST library licensing)
