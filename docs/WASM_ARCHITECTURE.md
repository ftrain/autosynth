# AutoSynth WASM-First Architecture

**Version**: 2.0
**Status**: Active Development
**Last Updated**: November 2025

---

## Overview

AutoSynth is a **web-native synthesizer framework** that runs entirely in the browser using WebAssembly + Web Audio API. No plugins, no native code, no JUCE - just pure web technology with industrial-strength DSP libraries.

### Core Principles

1. **Web-First**: Everything runs in the browser
2. **Shared Libraries**: Never write custom DSP - use SST, Airwindows, ChowDSP
3. **Shared Components**: One React component library for all synths
4. **Docker Build**: Consistent, reproducible builds
5. **Simple Workflow**: Describe → Build → Deploy

### Architecture Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB BROWSER (User)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React UI (Knobs, Sliders, Visualizers)               │ │
│  │  - Shared component library (core/ui/components/)     │ │
│  │  - Shared styles (core/ui/styles/)                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                    ↓ ↑ (Parameters)   ↓ ↑ (MIDI)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Web MIDI API (Main Thread)                           │ │
│  │  - MIDI input from controllers/keyboards              │ │
│  │  - MIDI output to external devices                    │ │
│  │  - MIDI learn for parameter mapping                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓ ↑ (MIDI Messages)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Web Audio API (Main Thread)                          │ │
│  │  - AudioContext                                        │ │
│  │  - Parameter scheduling                                │ │
│  │  - Visualization data                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓ ↑ (Audio)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AudioWorklet (Audio Thread)                           │ │
│  │  - Real-time audio processing                          │ │
│  │  - WASM DSP engine                                     │ │
│  │  - 128-sample blocks at 48kHz                          │ │
│  │  - MIDI event handling                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓ ↑ (WASM calls)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  WASM Module (C++ compiled with Emscripten)           │ │
│  │  - SST libraries (oscillators, filters, effects)      │ │
│  │  - Airwindows effects                                  │ │
│  │  - ChowDSP tape emulation                             │ │
│  │  - Custom voice/engine logic                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
autosynth/
├── synths/                      # Individual synthesizer projects
│   ├── TapeLoop/
│   │   ├── dsp/                 # C++ DSP code
│   │   │   ├── Voice.cpp        # Voice implementation
│   │   │   ├── Engine.h         # Synth engine
│   │   │   └── wasm_bindings.cpp # WASM exports
│   │   ├── ui/                  # React UI
│   │   │   ├── App.tsx          # Main UI component
│   │   │   └── useAudioEngine.ts # Web Audio bridge
│   │   ├── public/
│   │   │   └── processor.js     # AudioWorklet processor
│   │   ├── Makefile             # WASM build
│   │   └── synth.json           # Synth metadata
│   ├── DFAM/
│   ├── ModelD/
│   └── ...
│
├── core/                        # Shared code across all synths
│   ├── ui/
│   │   ├── components/          # React component library
│   │   │   ├── SynthKnob.tsx
│   │   │   ├── SynthADSR.tsx
│   │   │   ├── SynthLFO.tsx
│   │   │   ├── SynthSequencer.tsx
│   │   │   └── ...
│   │   └── styles/              # Shared CSS/themes
│   │       └── shared.ts        # Common styles
│   └── dsp/                     # Shared DSP utilities
│       └── helpers.h
│
├── libs/                        # DSP libraries (git submodules)
│   ├── sst-basic-blocks/        # SST oscillators, envelopes, LFOs
│   ├── sst-filters/             # SST filters
│   ├── sst-effects/             # SST effects
│   ├── airwin2rack/             # Airwindows effects
│   └── chowdsp_utils/           # ChowDSP tape emulation
│
├── website/                     # Synth browser/launcher
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx         # Synth grid
│   │   └── App.tsx              # Router
│   └── public/
│       └── synths/              # Built WASM modules
│
├── docker/
│   └── Dockerfile               # Emscripten + Node build env
│
├── scripts/
│   ├── new-synth.sh             # Create new synth from template
│   ├── build-synth.sh           # Build single synth
│   └── build-all.sh             # Build all synths
│
├── templates/
│   └── synth-template/          # Template for new synths
│       ├── dsp/
│       ├── ui/
│       └── Makefile
│
└── docs/
    ├── WASM_ARCHITECTURE.md     # This file
    ├── DSP_LIBRARIES.md         # Library index
    ├── COMPONENT_LIBRARY.md     # UI components
    └── GETTING_STARTED.md       # Quick start guide
```

---

## Synth Anatomy

Each synth is a self-contained project with:

### 1. DSP Code (C++)

**Location**: `synths/{SynthName}/dsp/`

- Uses SST, Airwindows, ChowDSP libraries
- Never write custom oscillators, filters, effects
- Thin C++ glue code to wire up library components

**Key files:**
- `Voice.cpp` - Single voice implementation
- `Engine.h` - Polyphonic engine
- `wasm_bindings.cpp` - Extern "C" exports for WASM

**Example wasm_bindings.cpp:**
```cpp
#include "Engine.h"

static Engine* g_engine = nullptr;

extern "C" {
  void init(int sampleRate) {
    g_engine = new Engine(sampleRate);
  }

  void process(float* outL, float* outR, int samples) {
    g_engine->render(outL, outR, samples);
  }

  void setParameter(int id, float value) {
    g_engine->setParam(id, value);
  }

  void noteOn(int note, float velocity) {
    g_engine->noteOn(note, velocity);
  }

  void noteOff(int note) {
    g_engine->noteOff(note);
  }
}
```

### 2. WASM Build (Emscripten)

**Location**: `synths/{SynthName}/Makefile`

```makefile
EMCC = emcc
SRC = dsp/wasm_bindings.cpp
OUT = public/synth.js

EMCC_FLAGS = \
  -std=c++17 \
  -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createSynthModule" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ENVIRONMENT='web,worker' \
  --no-entry \
  -I dsp \
  -I ../../libs/sst-basic-blocks/include \
  -I ../../libs/sst-filters/include \
  -I ../../libs/sst-effects/include

wasm: $(OUT)

$(OUT): $(SRC)
  @mkdir -p public
  $(EMCC) $(EMCC_FLAGS) $(SRC) -o $(OUT)
```

### 3. AudioWorklet Processor (JavaScript)

**Location**: `synths/{SynthName}/public/processor.js`

```javascript
class SynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.wasmReady = false;
    this.wasmExports = null;

    // Listen for WASM module from main thread
    this.port.onmessage = (e) => {
      if (e.data.type === 'init') {
        this.initWasm(e.data.wasmModule, e.data.sampleRate);
      }
    };
  }

  async initWasm(wasmModule, sampleRate) {
    const instance = await WebAssembly.instantiate(wasmModule, {});
    this.wasmExports = instance.exports;
    this.wasmExports.init(sampleRate);
    this.wasmReady = true;
    this.port.postMessage({ type: 'ready' });
  }

  process(inputs, outputs, parameters) {
    if (!this.wasmReady) return true;

    const output = outputs[0];
    const outL = output[0];
    const outR = output[1];

    // Get pointers to WASM memory
    const memL = this.wasmExports.getOutputL();
    const memR = this.wasmExports.getOutputR();

    // Process block
    this.wasmExports.process(memL, memR, outL.length);

    // Copy from WASM memory to output
    const heap = new Float32Array(this.wasmExports.memory.buffer);
    outL.set(heap.subarray(memL/4, memL/4 + outL.length));
    outR.set(heap.subarray(memR/4, memR/4 + outR.length));

    return true;
  }
}

registerProcessor('synth-processor', SynthProcessor);
```

### 4. Web Audio Bridge with MIDI Support (TypeScript)

**Location**: `synths/{SynthName}/ui/useAudioEngine.ts`

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

export const useAudioEngine = () => {
  const [isReady, setIsReady] = useState(false);
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [midiInputs, setMidiInputs] = useState<MIDIInput[]>([]);
  const [midiOutputs, setMidiOutputs] = useState<MIDIOutput[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const initialize = useCallback(async () => {
    // Create AudioContext
    const ctx = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = ctx;

    // Load and compile WASM
    const wasmResponse = await fetch('/synth.wasm');
    const wasmModule = await WebAssembly.compileStreaming(wasmResponse);

    // Register AudioWorklet
    await ctx.audioWorklet.addModule('/processor.js');

    // Create worklet node
    const worklet = new AudioWorkletNode(ctx, 'synth-processor');
    worklet.connect(ctx.destination);
    workletNodeRef.current = worklet;

    // Send WASM module to worklet
    worklet.port.postMessage({
      type: 'init',
      wasmModule,
      sampleRate: ctx.sampleRate,
    });

    // Wait for ready
    worklet.port.onmessage = (e) => {
      if (e.data.type === 'ready') {
        setIsReady(true);
      }
    };

    // Initialize Web MIDI
    if (navigator.requestMIDIAccess) {
      try {
        const midi = await navigator.requestMIDIAccess({ sysex: false });
        setMidiAccess(midi);

        // Get MIDI inputs
        const inputs = Array.from(midi.inputs.values());
        setMidiInputs(inputs);

        // Get MIDI outputs
        const outputs = Array.from(midi.outputs.values());
        setMidiOutputs(outputs);

        // Listen to all MIDI inputs
        inputs.forEach((input) => {
          input.onmidimessage = handleMidiMessage;
        });

        // Listen for device changes
        midi.onstatechange = () => {
          setMidiInputs(Array.from(midi.inputs.values()));
          setMidiOutputs(Array.from(midi.outputs.values()));
        };
      } catch (err) {
        console.warn('MIDI access denied:', err);
      }
    }
  }, []);

  const handleMidiMessage = useCallback((message: MIDIMessageEvent) => {
    if (!workletNodeRef.current) return;

    const [status, data1, data2] = message.data;
    const command = status & 0xf0;
    const channel = status & 0x0f;

    // Send MIDI to AudioWorklet
    workletNodeRef.current.port.postMessage({
      type: 'midi',
      status,
      data1,
      data2,
      timestamp: message.timeStamp,
    });

    // Parse common MIDI messages
    if (command === 0x90 && data2 > 0) {
      // Note On
      noteOn(data1, data2 / 127);
    } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      // Note Off
      noteOff(data1);
    } else if (command === 0xb0) {
      // CC (can be used for MIDI learn)
      // TODO: Implement MIDI learn
    }
  }, []);

  const sendMidiOut = useCallback((status: number, data1: number, data2: number) => {
    // Send to all MIDI outputs
    midiOutputs.forEach((output) => {
      output.send([status, data1, data2]);
    });
  }, [midiOutputs]);

  const setParameter = useCallback((id: number, value: number) => {
    if (!workletNodeRef.current) return;
    workletNodeRef.current.port.postMessage({
      type: 'setParameter',
      id,
      value,
    });
  }, []);

  const noteOn = useCallback((note: number, velocity: number) => {
    if (!workletNodeRef.current) return;
    workletNodeRef.current.port.postMessage({
      type: 'noteOn',
      note,
      velocity,
    });
  }, []);

  const noteOff = useCallback((note: number) => {
    if (!workletNodeRef.current) return;
    workletNodeRef.current.port.postMessage({
      type: 'noteOff',
      note,
    });
  }, []);

  return {
    isReady,
    midiInputs,
    midiOutputs,
    initialize,
    setParameter,
    noteOn,
    noteOff,
    sendMidiOut,
  };
};
```

### 5. React UI

**Location**: `synths/{SynthName}/ui/App.tsx`

```typescript
import React from 'react';
import { useAudioEngine } from './useAudioEngine';
import { SynthKnob, SynthRow, SynthADSR } from '../../../core/ui/components';

const App: React.FC = () => {
  const { isReady, initialize, setParameter } = useAudioEngine();

  return (
    <div>
      <button onClick={initialize} disabled={isReady}>
        {isReady ? 'Ready' : 'Start'}
      </button>

      <SynthRow label="OSCILLATOR">
        <SynthKnob
          label="FREQ"
          min={20}
          max={20000}
          value={440}
          onChange={(v) => setParameter(0, v)}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={0.5}
          onChange={(v) => setParameter(1, v)}
        />
      </SynthRow>

      <SynthADSR
        label="AMP ENV"
        attack={10}
        decay={100}
        sustain={70}
        release={200}
        onAttackChange={(v) => setParameter(2, v)}
        onDecayChange={(v) => setParameter(3, v)}
        onSustainChange={(v) => setParameter(4, v / 100)}
        onReleaseChange={(v) => setParameter(5, v)}
      />
    </div>
  );
};

export default App;
```

---

## Docker Build System

### Dockerfile

**Location**: `docker/Dockerfile`

```dockerfile
# Multi-stage build: Emscripten → Node → Nginx

FROM emscripten/emsdk:3.1.51 AS wasm-builder
WORKDIR /app
COPY synths/ synths/
COPY libs/ libs/
RUN cd synths && for dir in */; do \
      cd "$dir" && make wasm && cd ..; \
    done

FROM node:20-slim AS react-builder
WORKDIR /app
COPY website/ website/
COPY --from=wasm-builder /app/synths/*/public/*.wasm website/public/synths/
COPY --from=wasm-builder /app/synths/*/public/*.js website/public/synths/
RUN cd website && npm install && npm run build

FROM nginx:alpine
COPY --from=react-builder /app/website/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Usage

```bash
# Build all synths and website
docker build -t autosynth .

# Run
docker run -p 8080:80 autosynth

# Visit http://localhost:8080
```

---

## Development Workflow

### 1. Create New Synth

```bash
./scripts/new-synth.sh "My Synth" "MySynth"
# Creates synths/MySynth/ with template
```

### 2. Describe DSP Architecture

Edit `synths/MySynth/dsp/Engine.h`:
```cpp
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"
#include "sst/filters/VintageLadder.h"

class Engine {
  sst::basic_blocks::dsp::DPWSawOscillator osc;
  sst::filters::VintageLadder filter;

  void render(float* outL, float* outR, int samples) {
    for (int i = 0; i < samples; i++) {
      float sample = osc.process();
      sample = filter.process(sample);
      outL[i] = outR[i] = sample;
    }
  }
};
```

### 3. Build WASM

```bash
cd synths/MySynth
make wasm
# Outputs: public/synth.js, public/synth.wasm
```

### 4. Build UI

```bash
cd ui
npm install
npm run dev
# Vite dev server at http://localhost:5173
```

### 5. Deploy

```bash
# Build Docker image
docker build -t autosynth .

# Deploy to cloud
docker push registry.example.com/autosynth
```

---

## DSP Library Usage

### SST Basic Blocks

**Oscillators:**
```cpp
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"
sst::basic_blocks::dsp::DPWSawOscillator saw;
saw.init(sampleRate);
float sample = saw.process();
```

**Envelopes:**
```cpp
#include "sst/basic-blocks/dsp/ADSREnvelope.h"
sst::basic_blocks::dsp::ADSREnvelope env;
env.setAttack(0.01);
env.setRelease(0.1);
env.trigger();
float level = env.process();
```

### SST Filters

```cpp
#include "sst/filters/VintageLadder.h"
sst::filters::VintageLadder filter;
filter.setCutoff(1000.0f);
filter.setResonance(0.7f);
float out = filter.process(input);
```

### Airwindows

```cpp
#include "airwin2rack/Galactic3.h"
Galactic3 reverb;
reverb.setSampleRate(48000);
reverb.setParameter(0, 0.5); // Replace
reverb.setParameter(1, 0.5); // Brightness
reverb.processReplacing(inputL, inputR, outputL, outputR, numSamples);
```

### ChowDSP Tape

```cpp
#include "chowdsp_utils/TapeModel.h"
chowdsp::TapeModel tape;
tape.prepare(sampleRate);
tape.setDrive(0.5);
tape.setWow(0.1);
float out = tape.processSample(input);
```

---

## Component Library

### Available Components

**From `core/ui/components/`:**

| Component | Purpose | Example |
|-----------|---------|---------|
| `SynthKnob` | Rotary knob | Frequency, level, etc. |
| `SynthSlider` | Linear fader | Volume, pan |
| `SynthADSR` | ADSR envelope editor | Amp/filter envelope |
| `SynthLFO` | LFO with waveform | Vibrato, tremolo |
| `SynthSequencer` | Step sequencer | Note patterns |
| `SynthRow` | Layout container | Group controls |
| `Oscilloscope` | Waveform display | Output visualization |

**Never create custom components** - always use existing library.

### Shared Styles

**From `core/ui/styles/shared.ts`:**
```typescript
export const synthStyles = {
  container: { background: '#0a0a0a', color: '#fff' },
  knobContainer: { display: 'flex', flexDirection: 'column' },
  knobLabel: { fontSize: '11px', color: '#888' },
  // ... full style system
};
```

---

## Agent Roles

### For Development

| Agent | Role | When to Use |
|-------|------|-------------|
| `project-coordinator` | Plan synth project | Starting new synth |
| `synth-architect` | Design DSP architecture | Choosing DSP components |
| `dsp-engineer` | Wire up DSP libraries | Implementing Engine.h |
| `ui-developer` | Build React UI | Creating UI with components |
| `qa-engineer` | Test & validate | Quality assurance |
| `sound-designer` | Define sonic goals | Sound design direction |

### Workflow

```
User: "Build me a Minimoog clone"
  ↓
project-coordinator: Creates project plan, identifies DSP libraries
  ↓
synth-architect: Designs signal flow using SST components
  ↓
dsp-engineer: Implements Engine.h using sst-filters, sst-basic-blocks
  ↓
ui-developer: Builds UI using SynthKnob, SynthADSR
  ↓
qa-engineer: Tests in browser
  ↓
sound-designer: Creates presets
```

---

## Key Differences from JUCE Version

| Aspect | JUCE Version | WASM Version |
|--------|--------------|--------------|
| **Platform** | Native plugins (VST3/AU) | Web browser |
| **Build** | CMake + JUCE | Emscripten + Vite |
| **Audio** | JUCE AudioProcessor | Web Audio API + AudioWorklet |
| **UI** | JUCE WebView + React | Pure React |
| **Distribution** | Plugin installers | Website URL |
| **Dependencies** | JUCE 8, GTK, WebKit | Browser only |
| **Deployment** | Download + install | Visit URL |

---

## Web MIDI API Integration

### MIDI Input

**Automatically connects to all MIDI devices:**
- MIDI keyboards and controllers
- USB MIDI interfaces
- Virtual MIDI ports
- Bluetooth MIDI devices (with browser support)

**Supported MIDI messages:**
- Note On/Off (0x90, 0x80)
- Control Change (0xB0) - for MIDI learn
- Pitch Bend (0xE0)
- Aftertouch (0xD0)
- Program Change (0xC0)

### MIDI Output

**Send MIDI to external devices:**
```typescript
// Send note on to all connected MIDI outputs
sendMidiOut(0x90, 60, 100); // Note C4, velocity 100

// Send CC
sendMidiOut(0xB0, 1, 64); // Mod wheel

// Send to specific output
midiOutputs[0].send([0x90, 60, 100]);
```

**Use cases:**
- Send sequencer output to hardware synths
- MIDI clock sync to external gear
- Control DAW parameters
- Chain multiple synths together

### MIDI Learn

**Map hardware controllers to parameters:**

```typescript
const [midiLearnMode, setMidiLearnMode] = useState(false);
const [midiMappings, setMidiMappings] = useState<Map<string, number>>(new Map());

const handleMidiCC = (cc: number, value: number) => {
  if (midiLearnMode && selectedParameter) {
    // Store mapping
    setMidiMappings(prev => new Map(prev).set(`cc${cc}`, selectedParameter.id));
    setMidiLearnMode(false);
  } else {
    // Use existing mapping
    const paramId = midiMappings.get(`cc${cc}`);
    if (paramId !== undefined) {
      setParameter(paramId, value / 127);
    }
  }
};
```

### Browser Support

**Web MIDI API is supported in:**
- Chrome/Edge (desktop)
- Chromium-based browsers
- Opera

**Not yet supported:**
- Firefox (experimental flag required)
- Safari (no support)

**Graceful degradation:**
```typescript
if (!navigator.requestMIDIAccess) {
  // Fall back to on-screen keyboard or mouse input
  console.warn('Web MIDI not supported - using virtual keyboard');
}
```

### Example: Full MIDI Integration

```typescript
// Component with MIDI device selector
const MIDIDeviceSelector: React.FC = () => {
  const { midiInputs, midiOutputs } = useAudioEngine();

  return (
    <div>
      <h3>MIDI Inputs</h3>
      {midiInputs.map(input => (
        <div key={input.id}>
          {input.name} - {input.manufacturer}
        </div>
      ))}

      <h3>MIDI Outputs</h3>
      {midiOutputs.map(output => (
        <div key={output.id}>
          {output.name} - {output.manufacturer}
        </div>
      ))}
    </div>
  );
};
```

---

## Getting Started

### 1. Install Docker

```bash
# macOS
brew install docker

# Linux
apt install docker.io
```

### 2. Start Development Container

```bash
cd autosynth
docker build -f docker/Dockerfile -t autosynth-dev .
docker run -it -v $(pwd):/workspace autosynth-dev
```

### 3. Create Your First Synth

```bash
# Inside container
./scripts/new-synth.sh "Bass Synth" "Bass"

cd synths/Bass
make wasm

cd ui
npm install
npm run dev
```

### 4. Open Browser

Visit `http://localhost:5173` to see your synth!

---

## Next Steps

1. **Explore existing synths**: Check `web-dfam/` and `synths/TapeLoop/`
2. **Read library docs**: See `docs/DSP_LIBRARIES.md`
3. **Study components**: See `core/ui/COMPONENT_LIBRARY.md`
4. **Build something**: Use `new-synth.sh` to start

---

**AutoSynth** - Build synthesizers for the web.
