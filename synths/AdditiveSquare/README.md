# Additive Square Synthesizer

A unique web-native synthesizer that uses **square wave partials** instead of traditional sine waves for additive synthesis. Creates harmonically rich, metallic, and evolving timbres perfect for drone music, experimental electronica, and sound design.

## Architecture

```
MIDI Input → Voice → [Square 1-8] → SUM → Vintage Ladder Filter → Amp → Output
                           ↓                        ↓              ↓
                    Partial Levels              Filter Env      Amp Env
```

### DSP Components (SST Libraries)

- **8 Square Wave Oscillators** - PulseOscillator at 1x, 2x, 3x, 4x, 5x, 6x, 7x, 8x fundamental
- **Vintage Ladder Filter** - Moog-style 24dB/octave lowpass with resonance
- **2 ADSR Envelopes** - Filter modulation and amplitude control
- **8-voice Polyphony** - Full keyboard playability

## Features

- Individual level control for each of 8 harmonic partials
- Moog-style ladder filter with envelope modulation
- Dual ADSR envelopes (filter and amp)
- Web MIDI support for external controllers
- 8-voice polyphony with automatic voice stealing
- Real-time Web Audio processing via AudioWorklet
- Zero-latency parameter changes

## Quick Start

### Prerequisites

You need either:
1. **Docker** (recommended - includes Emscripten)
2. **Emscripten SDK** (manual install) + Node.js 20+

### Build and Run

#### Option 1: Docker (Recommended)

```bash
# From AutoSynth root directory
docker build -t autosynth .
docker run -p 8080:80 autosynth

# Open http://localhost:8080
```

#### Option 2: Local Development

```bash
# Build WASM module (requires Emscripten)
cd synths/AdditiveSquare
make wasm

# Install UI dependencies
cd ui
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

## Parameters

### Partials (0-7)
- **1x** - Fundamental frequency (MIDI note)
- **2x** - 2nd harmonic (octave above)
- **3x** - 3rd harmonic (octave + fifth)
- **4x** - 4th harmonic (two octaves)
- **5x** - 5th harmonic (two octaves + major third)
- **6x** - 6th harmonic (two octaves + fifth)
- **7x** - 7th harmonic (flat seventh above)
- **8x** - 8th harmonic (three octaves)

### Filter (8-10)
- **Cutoff** - Filter frequency (20Hz - 20kHz, exponential)
- **Resonance** - Filter Q/resonance
- **Env Amount** - Filter envelope modulation depth (-100% to +100%)

### Filter Envelope (11-14)
- **Attack** - 1-5000ms
- **Decay** - 1-5000ms
- **Sustain** - 0-100%
- **Release** - 1-10000ms

### Amp Envelope (15-18)
- **Attack** - 1-5000ms
- **Decay** - 1-5000ms
- **Sustain** - 0-100%
- **Release** - 1-10000ms

### Master (127)
- **Volume** - Master output level

## Sound Design Tips

### Hollow Organ Tones
Set only odd partials (1x, 3x, 5x, 7x) at equal levels, with low filter cutoff and no resonance.

### Bright Leads
Emphasize high partials (5x-8x), use high filter cutoff with resonance, fast amp attack.

### Evolving Pads
Start with all partials at equal levels, then slowly adjust individual levels while playing. Add filter envelope with slow attack/decay.

### Bell Sounds
Short amp attack (5ms), moderate decay (200ms), low sustain (10%), adjust partials for metallic overtones.

### Drone Textures
Long amp attack (1000ms+), all partials active, low filter resonance, slow filter envelope.

## Web MIDI

Connect a MIDI keyboard or controller for full playability:

1. **Chrome/Edge** - Full MIDI support (plug and play)
2. **Firefox** - Enable `dom.webmidi.enabled` in `about:config`
3. **Safari** - No MIDI support (use on-screen keyboard)

MIDI Note On/Off messages are automatically routed to the synthesizer engine.

## Project Structure

```
AdditiveSquare/
├── dsp/
│   ├── Engine.h           # Main engine (voice management, parameter routing)
│   ├── Voice.h            # Single voice (8 oscillators, filter, envelopes)
│   └── wasm_bindings.cpp  # C → WASM exports
├── ui/
│   ├── src/
│   │   ├── App.tsx                  # React UI (shared components)
│   │   └── hooks/useAudioEngine.ts  # Web Audio bridge
│   ├── public/
│   │   ├── processor.js   # AudioWorklet processor
│   │   └── synth.wasm     # Compiled DSP engine
│   └── package.json
├── Makefile               # Emscripten build configuration
├── ARCHITECTURE.md        # Detailed technical architecture
└── README.md              # This file
```

## Building from Source

### WASM Module

The Makefile uses Emscripten to compile C++ to WebAssembly:

```bash
make wasm
```

This generates:
- `ui/public/synth.js` - WASM loader
- `ui/public/synth.wasm` - Compiled DSP engine

### React UI

```bash
cd ui
npm install
npm run dev      # Development server
npm run build    # Production build
```

## Technical Details

### Sample Rate
48kHz (AudioContext default)

### Block Size
128 samples (AudioWorklet quantum)

### Voice Architecture
Each voice processes independently:
1. Generate 8 square waves at harmonic frequencies
2. Mix with individual partial levels
3. Process through ladder filter with envelope modulation
4. Apply amp envelope
5. Sum all voices to stereo output

### Real-Time Safety
- No memory allocation in audio thread
- Lock-free parameter updates
- Pre-allocated voice pool
- Band-limited oscillators (no aliasing)

## Why Square Waves?

Traditional additive synthesis uses sine waves as "pure" harmonics. Square waves are interesting because:

1. **Harmonic Density** - Each square wave already contains odd harmonics (1, 3, 5, 7...)
2. **Unique Timbre** - Creates metallic, organ-like, bell-like sounds
3. **Complexity** - Dense harmonic content from fewer oscillators
4. **Experimental** - Explores additive synthesis beyond the classical sine wave approach

A single square wave partial at frequency F contains:
- F (fundamental)
- 3F (at 1/3 amplitude)
- 5F (at 1/5 amplitude)
- 7F (at 1/7 amplitude)
- ... continuing infinitely

When you combine 8 square wave partials at different frequencies and levels, you create incredibly complex harmonic interactions.

## Performance

- **CPU Usage** - ~5-10% on modern systems (8 voices, 64 oscillators)
- **Latency** - ~3-6ms (AudioWorklet processing)
- **Memory** - ~2MB WASM module

## Browser Support

| Browser | WASM | AudioWorklet | Web MIDI | Status |
|---------|------|-------------|----------|--------|
| Chrome 88+ | Yes | Yes | Yes | Full Support |
| Edge 88+ | Yes | Yes | Yes | Full Support |
| Firefox 89+ | Yes | Yes | Flag | Partial Support |
| Safari 14.1+ | Yes | Yes | No | No MIDI |

**Recommendation:** Chrome or Edge for best experience.

## Troubleshooting

### No Sound
1. Check browser console for errors
2. Ensure audio context is running (click "Start Synth")
3. Verify WASM module loaded (check Network tab)
4. Check master volume is not zero

### WASM Build Fails
1. Install Emscripten: https://emscripten.org/docs/getting_started/downloads.html
2. Activate: `source /path/to/emsdk/emsdk_env.sh`
3. Verify: `emcc --version`
4. Rebuild: `make clean && make wasm`

### MIDI Not Working
1. Chrome/Edge: Should work automatically
2. Firefox: Enable `dom.webmidi.enabled`
3. Safari: Not supported, use on-screen keyboard

## License

Part of the AutoSynth project. Uses SST DSP libraries.

## Links

- **AutoSynth Docs:** `/docs/`
- **DSP Libraries:** `/docs/DSP_LIBRARIES.md`
- **Component Library:** `/core/ui/COMPONENT_LIBRARY.md`
- **SST GitHub:** https://github.com/surge-synthesizer/sst-basic-blocks

---

**AutoSynth** - Professional web synthesizers powered by WebAssembly.
