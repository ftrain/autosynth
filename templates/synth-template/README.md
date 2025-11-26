# {{SYNTH_NAME}} - AutoSynth Template

This is a template for creating web-native synthesizers using WebAssembly + Web Audio API + Web MIDI API.

## Quick Start

### 1. Build WASM

```bash
make wasm
```

This compiles your C++ DSP code to WebAssembly and outputs:
- `ui/public/synth.js` - JavaScript loader
- `ui/public/synth.wasm` - WebAssembly module

### 2. Run Development Server

```bash
cd ui
npm install
npm run dev
```

Open http://localhost:5173 in your browser (Chrome/Edge recommended for full MIDI support).

## Project Structure

```
{{SYNTH_NAME}}/
├── dsp/
│   ├── Engine.h          - Main DSP engine (voice management, parameters)
│   ├── Voice.h           - Single voice implementation
│   └── wasm_bindings.cpp - WASM exports (init, process, noteOn, etc.)
│
├── ui/
│   ├── src/
│   │   ├── App.tsx       - React UI (customize your controls here)
│   │   ├── main.tsx      - React entry point
│   │   └── hooks/
│   │       └── useAudioEngine.ts - Web Audio + WASM + MIDI bridge
│   ├── public/
│   │   └── processor.js  - AudioWorklet processor (audio thread)
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── Makefile              - WASM build configuration
└── README.md             - This file
```

## Customization Guide

### 1. Implement DSP (Voice.h)

Replace the placeholder sine oscillator with SST/Airwindows/ChowDSP components:

```cpp
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"
#include "sst/filters/VintageLadder.h"

class Voice {
    sst::basic_blocks::dsp::DPWSawOscillator osc;
    sst::filters::VintageLadder filter;

    void init(float sr) {
        osc.init(sr);
        filter.init(sr);
    }

    float process(const std::array<float, 128>& params) {
        float sample = osc.process();
        filter.setCutoff(params[CUTOFF_PARAM]);
        return filter.process(sample);
    }
};
```

**Rule:** Never write custom DSP. Always use SST/Airwindows/ChowDSP libraries.

### 2. Define Parameters (Engine.h)

Map parameter IDs to DSP controls:

```cpp
enum ParamID {
    OSC_FREQ = 0,
    OSC_LEVEL = 1,
    FILTER_CUTOFF = 2,
    FILTER_RESONANCE = 3,
    // ... add your parameters
    MASTER_VOLUME = 127,  // Reserved for master
};
```

### 3. Build UI (App.tsx)

Use components from `core/ui/components/`:

```tsx
import {
  SynthKnob,
  SynthRow,
  SynthADSR,
  SynthLFO,
} from '../../../core/ui/components';

<SynthRow label="OSCILLATOR" theme="orange">
  <SynthKnob
    label="FREQ"
    min={20}
    max={20000}
    value={440}
    onChange={(v) => setParameter(ParamID.OSC_FREQ, v)}
  />
</SynthRow>
```

**Rule:** Never create custom components. Always use shared components.

## DSP Library Reference

See `docs/DSP_LIBRARIES.md` for complete API reference:

- **SST sst-basic-blocks** - Oscillators, envelopes, LFOs
- **SST sst-filters** - VintageLadder, CytomicSVF, DiodeLadder
- **SST sst-effects** - Delay, chorus, phaser, flanger
- **Airwindows** - Galactic3 reverb, ToTape6 saturation
- **ChowDSP** - TapeModel for authentic tape emulation

## Browser Support

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| AudioWorklet | ✅ | ✅ | ⚠️ Limited |
| Web MIDI | ✅ | ❌ | ❌ |
| WASM | ✅ | ✅ | ✅ |

**Recommendation:** Target Chrome/Edge for full MIDI support.

## Build Commands

```bash
# Build optimized WASM
make wasm

# Build with debug symbols
make dev

# Clean build artifacts
make clean

# Start dev server
cd ui && npm run dev

# Build for production
cd ui && npm run build
```

## Web Audio Architecture

```
Browser Tab (Main Thread)
├── React UI (App.tsx)
├── useAudioEngine Hook
└── Web MIDI API
    ↓
AudioContext
    ↓
AudioWorklet (Audio Thread)
├── processor.js
└── WASM Module (DSP)
    ├── Engine.h
    └── Voice.h
```

## MIDI Support

### Input
- Hardware MIDI keyboards/controllers
- USB MIDI interfaces
- Virtual MIDI ports
- Hot-plug support

### Output
- Send MIDI to external hardware
- MIDI clock sync
- Parameter automation

### Example
```typescript
const { midiInputs, sendMidiOut } = useAudioEngine();

// Send Note On to hardware
sendMidiOut(0x90, 60, 100);  // Note On, C4, velocity 100
```

## Performance Targets

- Sample rate: 48kHz
- Block size: 128 samples
- Target latency: < 3ms per block
- CPU usage: < 50% with 8 voices
- WASM size: < 1MB

## Troubleshooting

### WASM doesn't load
- Check browser console for errors
- Verify `synth.wasm` exists in `ui/public/`
- Ensure HTTPS or localhost (required for AudioWorklet)

### No sound
- Check AudioContext state (should be "running")
- Verify WASM initialized successfully
- Check browser audio output device

### MIDI not working
- Only Chrome/Edge support Web MIDI
- Check browser permissions
- Try connecting device after page load

## Next Steps

1. Customize Voice.h with SST components
2. Add parameters to Engine.h
3. Build UI with shared components
4. Test in browser
5. Iterate and refine

For more information, see:
- `docs/WASM_ARCHITECTURE.md` - Complete architecture guide
- `docs/DSP_LIBRARIES.md` - DSP library reference
- `core/ui/COMPONENT_LIBRARY.md` - UI component reference
- `CLAUDE.md` - Development workflow

---

**AutoSynth** - Build professional synthesizers for the web.
