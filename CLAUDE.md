# AutoSynth - Web Synthesizer Framework

## Overview

AutoSynth is a web-native framework for building professional synthesizers that run entirely in the browser. Give it a high-level description like:

> "Build me a Minimoog Model D clone with tape saturation"

...and the system will design, implement, and deliver a complete WebAssembly + React synth using industrial-strength DSP libraries (SST, Airwindows, ChowDSP).

## Core Principles

### 1. Web-First Architecture

**No plugins. No native code. No JUCE.**

Everything runs in the browser using:
- **WebAssembly**: C++ DSP compiled with Emscripten
- **AudioWorklet**: Real-time audio processing
- **Web MIDI API**: MIDI input/output for controllers and hardware
- **React**: Modern UI with shared component library
- **Docker**: Reproducible builds

### 2. Never Write Custom DSP

**Always use existing, proven libraries:**
- **SST** (sst-basic-blocks, sst-filters, sst-effects): Oscillators, filters, effects
- **Airwindows**: High-end effects (reverbs, delays, saturation)
- **ChowDSP**: Tape emulation, analog modeling

The libraries are complex because real synthesis is complex. Embrace their APIs - they represent decades of research.

### 3. Shared Component Library

**Never create custom UI components.**

All synths use the same React components from `core/ui/components/`:
- `SynthKnob` - Rotary controls
- `SynthADSR` - Envelope editors
- `SynthLFO` - LFO visualizers
- `SynthSequencer` - Step sequencers
- `Oscilloscope` - Waveform displays

**One codebase, one design language, zero duplication.**

### 4. Docker-Based Development

All builds happen in Docker with Emscripten pre-installed:
```bash
docker build -t autosynth .
docker run -p 8080:80 autosynth
```

No "works on my machine" problems.

---

## Quick Start

### Create a New Synth

```bash
# Inside Docker container
./scripts/new-synth.sh "My Synth" "MySynth"
```

This creates `synths/MySynth/` with:
- DSP template (`dsp/Engine.h`, `dsp/wasm_bindings.cpp`)
- React UI template (`ui/App.tsx`, `ui/useAudioEngine.ts`)
- AudioWorklet processor (`public/processor.js`)
- Makefile for WASM build

### Build and Run

```bash
cd synths/MySynth

# Build WASM
make wasm

# Start dev server
cd ui
npm install
npm run dev

# Open http://localhost:5173
```

### Deploy

```bash
# Build everything (all synths + website)
docker build -t autosynth .

# Run
docker run -p 8080:80 autosynth

# Visit http://localhost:8080
```

---

## Project Structure

```
autosynth/
├── synths/                      # Individual synthesizers
│   ├── TapeLoop/
│   │   ├── dsp/                 # C++ DSP (uses SST/Airwindows)
│   │   ├── ui/                  # React UI (uses core/ui/components)
│   │   ├── public/processor.js  # AudioWorklet
│   │   └── Makefile             # Emscripten build
│   ├── DFAM/
│   └── ...
│
├── core/                        # Shared across all synths
│   ├── ui/
│   │   ├── components/          # **THE COMPONENT LIBRARY**
│   │   └── styles/              # Shared CSS
│   └── dsp/                     # Shared DSP helpers
│
├── libs/                        # DSP libraries (git submodules)
│   ├── sst-basic-blocks/        # Oscillators, envelopes, LFOs
│   ├── sst-filters/             # Ladder, SVF, comb, formant filters
│   ├── sst-effects/             # Delay, reverb, chorus, phaser
│   ├── airwin2rack/             # Airwindows effects
│   └── chowdsp_utils/           # Tape emulation
│
├── website/                     # Synth browser (home page)
│   └── src/App.tsx              # Grid of all synths
│
├── docker/
│   └── Dockerfile               # Emscripten + Node build env
│
├── scripts/
│   ├── new-synth.sh             # Create new synth
│   ├── build-synth.sh           # Build one synth
│   └── build-all.sh             # Build all synths
│
├── templates/
│   └── synth-template/          # Template for new synths
│
└── docs/
    ├── WASM_ARCHITECTURE.md     # Complete architecture guide
    ├── DSP_LIBRARIES.md         # SST/Airwindows/ChowDSP reference
    ├── COMPONENT_LIBRARY.md     # UI component reference
    └── GETTING_STARTED.md       # Tutorials
```

---

## Development Workflow

### Starting a New Synth

**Use the project-coordinator agent:**

```
@project-coordinator

Build me a [describe synth]

Examples:
- "Minimoog Model D clone with 3 oscillators and ladder filter"
- "Tape loop drone synth with Airwindows Galactic reverb"
- "FM synth with 4 operators inspired by DX7"
```

The coordinator will:
1. Identify required DSP libraries (SST components, Airwindows effects)
2. Create architecture document
3. Delegate to specialist agents
4. Deliver working synth

### Agent Team

| Agent | Purpose | Tools |
|-------|---------|-------|
| **project-coordinator** | Orchestrate project | Plans, delegates |
| **synth-architect** | Design signal flow | SST library selection |
| **dsp-engineer** | Implement DSP | C++, WASM bindings |
| **ui-developer** | Build React UI | Component library |
| **qa-engineer** | Test & validate | Browser testing |
| **sound-designer** | Define sonic goals | Presets |

### Example Workflow

```
User: "Build a bass synth with tape saturation"
  ↓
project-coordinator:
  - Identifies: sst-basic-blocks (oscillator), sst-filters (ladder)
  - Identifies: chowdsp_utils (tape emulation)
  - Creates plan, delegates
  ↓
synth-architect:
  - Designs: OSC → FILTER → TAPE → OUTPUT
  - Writes architecture doc
  ↓
dsp-engineer:
  - Implements Engine.h using SST + ChowDSP
  - Writes wasm_bindings.cpp
  - Builds with: make wasm
  ↓
ui-developer:
  - Builds App.tsx using SynthKnob, SynthADSR
  - Hooks up useAudioEngine
  ↓
qa-engineer:
  - Tests in browser
  - Validates audio output
  ↓
DONE: Visit http://localhost:5173
```

---

## DSP Implementation

### Rule: Never Write Custom DSP

**Wrong:**
```cpp
// DON'T DO THIS
float oscillator(float phase) {
  return sin(2.0 * M_PI * phase);
}
```

**Right:**
```cpp
// USE SST LIBRARIES
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"

sst::basic_blocks::dsp::DPWSawOscillator osc;
osc.init(sampleRate);
float sample = osc.process();
```

### Common DSP Patterns

#### Oscillators (sst-basic-blocks)

```cpp
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"
#include "sst/basic-blocks/dsp/DPWPulseOscillator.h"

sst::basic_blocks::dsp::DPWSawOscillator saw;
sst::basic_blocks::dsp::DPWPulseOscillator pulse;

saw.init(sampleRate);
pulse.init(sampleRate);

float sawSample = saw.process();
float pulseSample = pulse.process();
```

#### Filters (sst-filters)

```cpp
#include "sst/filters/VintageLadder.h"

sst::filters::VintageLadder filter;
filter.init(sampleRate);
filter.setCutoff(1000.0f);
filter.setResonance(0.7f);

float output = filter.process(input);
```

#### Envelopes (sst-basic-blocks)

```cpp
#include "sst/basic-blocks/dsp/ADSREnvelope.h"

sst::basic_blocks::dsp::ADSREnvelope env;
env.setAttack(0.01);   // 10ms
env.setDecay(0.1);     // 100ms
env.setSustain(0.7);   // 70%
env.setRelease(0.2);   // 200ms

env.trigger();
float level = env.process();
```

#### Effects (Airwindows)

```cpp
#include "airwin2rack/Galactic3.h"

Galactic3 reverb;
reverb.setSampleRate(48000);
reverb.setParameter(0, 0.5);  // Replace
reverb.setParameter(1, 0.5);  // Brightness
reverb.setParameter(4, 0.5);  // Size

reverb.processReplacing(inL, inR, outL, outR, numSamples);
```

#### Tape Emulation (ChowDSP)

```cpp
#include "chowdsp_utils/TapeModel.h"

chowdsp::TapeModel tape;
tape.prepare(sampleRate);
tape.setDrive(0.5);
tape.setWow(0.1);

float output = tape.processSample(input);
```

### WASM Bindings Pattern

**Always use extern "C" with simple exports:**

```cpp
#include "Engine.h"

static Engine* g_engine = nullptr;

extern "C" {
  void init(int sampleRate) {
    g_engine = new Engine(sampleRate);
  }

  void process(float* outL, float* outR, int samples) {
    if (!g_engine) return;
    g_engine->render(outL, outR, samples);
  }

  void setParameter(int id, float value) {
    if (!g_engine) return;
    g_engine->setParam(id, value);
  }

  void noteOn(int note, float velocity) {
    if (!g_engine) return;
    g_engine->noteOn(note, velocity);
  }

  void noteOff(int note) {
    if (!g_engine) return;
    g_engine->noteOff(note);
  }
}
```

---

## UI Implementation

### Rule: Never Create Custom Components

**Use components from `core/ui/components/`:**

```typescript
import {
  SynthKnob,
  SynthSlider,
  SynthADSR,
  SynthLFO,
  SynthSequencer,
  SynthRow,
  Oscilloscope,
} from '../../../core/ui/components';
```

### Example UI

```typescript
import React from 'react';
import { useAudioEngine } from './useAudioEngine';
import { SynthKnob, SynthRow, SynthADSR } from '../../../core/ui/components';

const App: React.FC = () => {
  const { isReady, initialize, setParameter } = useAudioEngine();

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <header>
        <h1>MY SYNTH</h1>
        {!isReady && <button onClick={initialize}>START</button>}
      </header>

      {/* Oscillator */}
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

      {/* Filter */}
      <SynthRow label="FILTER">
        <SynthKnob
          label="CUTOFF"
          min={20}
          max={20000}
          value={2000}
          onChange={(v) => setParameter(2, v)}
        />
        <SynthKnob
          label="RES"
          min={0}
          max={1}
          value={0.5}
          onChange={(v) => setParameter(3, v)}
        />
      </SynthRow>

      {/* Envelope */}
      <SynthADSR
        label="AMP ENV"
        attack={10}
        decay={100}
        sustain={70}
        release={200}
        onAttackChange={(v) => setParameter(4, v)}
        onDecayChange={(v) => setParameter(5, v)}
        onSustainChange={(v) => setParameter(6, v / 100)}
        onReleaseChange={(v) => setParameter(7, v)}
        maxAttack={5000}
        maxDecay={5000}
        maxRelease={10000}
      />
    </div>
  );
};

export default App;
```

### Web Audio Bridge with MIDI Support

```typescript
import { useState, useCallback, useRef } from 'react';

export const useAudioEngine = () => {
  const [isReady, setIsReady] = useState(false);
  const [midiInputs, setMidiInputs] = useState<MIDIInput[]>([]);
  const [midiOutputs, setMidiOutputs] = useState<MIDIOutput[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const initialize = useCallback(async () => {
    const ctx = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = ctx;

    // Load WASM
    const wasmResponse = await fetch('/synth.wasm');
    const wasmModule = await WebAssembly.compileStreaming(wasmResponse);

    // Register AudioWorklet
    await ctx.audioWorklet.addModule('/processor.js');

    // Create worklet node
    const worklet = new AudioWorkletNode(ctx, 'synth-processor');
    worklet.connect(ctx.destination);
    workletNodeRef.current = worklet;

    // Initialize WASM in worklet
    worklet.port.postMessage({ type: 'init', wasmModule, sampleRate: ctx.sampleRate });

    worklet.port.onmessage = (e) => {
      if (e.data.type === 'ready') setIsReady(true);
    };

    // Initialize Web MIDI
    if (navigator.requestMIDIAccess) {
      const midi = await navigator.requestMIDIAccess();
      setMidiInputs(Array.from(midi.inputs.values()));
      setMidiOutputs(Array.from(midi.outputs.values()));

      // Connect MIDI inputs
      Array.from(midi.inputs.values()).forEach((input) => {
        input.onmidimessage = (msg) => {
          const [status, data1, data2] = msg.data;
          worklet.port.postMessage({ type: 'midi', status, data1, data2 });
        };
      });
    }
  }, []);

  const setParameter = useCallback((id: number, value: number) => {
    workletNodeRef.current?.port.postMessage({ type: 'setParameter', id, value });
  }, []);

  const sendMidiOut = useCallback((status: number, data1: number, data2: number) => {
    midiOutputs.forEach((output) => output.send([status, data1, data2]));
  }, [midiOutputs]);

  return { isReady, midiInputs, midiOutputs, initialize, setParameter, sendMidiOut };
};
```

---

## Component Library Reference

### SynthKnob

Rotary control for continuous parameters.

```typescript
<SynthKnob
  label="CUTOFF"
  min={20}
  max={20000}
  value={1000}
  onChange={(value) => setParameter('cutoff', value)}
  step={1}  // optional
  options={['LOW', 'MID', 'HIGH']}  // optional for stepped knobs
/>
```

### SynthSlider

Linear fader.

```typescript
<SynthSlider
  label="VOLUME"
  min={0}
  max={1}
  value={0.8}
  onChange={(value) => setParameter('volume', value)}
  vertical={true}  // optional
/>
```

### SynthADSR

Visual ADSR envelope editor.

```typescript
<SynthADSR
  label="FILTER ENV"
  attack={50}       // ms
  decay={200}       // ms
  sustain={60}      // %
  release={500}     // ms
  onAttackChange={(v) => setParameter('attack', v)}
  onDecayChange={(v) => setParameter('decay', v)}
  onSustainChange={(v) => setParameter('sustain', v / 100)}
  onReleaseChange={(v) => setParameter('release', v)}
  maxAttack={5000}
  maxDecay={5000}
  maxRelease={10000}
/>
```

### SynthLFO

LFO with waveform selection and rate control.

```typescript
<SynthLFO
  label="MOD LFO"
  waveform={0}  // 0=sine, 1=saw, 2=square, 3=triangle
  rate={2.0}    // Hz
  onWaveformChange={(w) => setParameter('lfo_wave', w)}
  onRateChange={(r) => setParameter('lfo_rate', r)}
  minRate={0.1}
  maxRate={20}
/>
```

### SynthSequencer

Step sequencer with pitch and gate per step.

```typescript
<SynthSequencer
  steps={8}
  pitchValues={[60, 62, 64, 65, 67, 69, 71, 72]}  // MIDI notes
  gateValues={[true, true, false, true, true, false, true, false]}
  currentStep={activeStep}
  onPitchChange={(step, pitch) => setStepPitch(step, pitch)}
  onGateChange={(step, gate) => setStepGate(step, gate)}
  minPitch={36}
  maxPitch={84}
/>
```

### Oscilloscope

Real-time waveform display.

```typescript
<Oscilloscope
  label="OUTPUT"
  audioData={waveformData}  // Float32Array
  width={600}
  height={120}
  color="#00ff88"
  showGrid={true}
/>
```

### SynthRow

Layout container for grouping controls.

```typescript
<SynthRow label="OSCILLATOR 1">
  <SynthKnob label="WAVE" ... />
  <SynthKnob label="TUNE" ... />
  <SynthKnob label="LEVEL" ... />
</SynthRow>
```

**See `core/ui/COMPONENT_LIBRARY.md` for complete API reference.**

---

## Web MIDI Support

### MIDI Input

All synths automatically support MIDI input:
- **MIDI keyboards and controllers** - Play notes, control parameters
- **USB MIDI interfaces** - Connect hardware gear
- **Virtual MIDI ports** - Route from DAWs
- **MIDI learn** - Map CC messages to any parameter

### MIDI Output

Send MIDI to external devices:
- **Sequencer output** - Drive hardware synths
- **MIDI clock** - Sync to external gear
- **Parameter automation** - Control DAWs
- **Chain synths** - Build complex setups

### Browser Support

Web MIDI API works in:
- Chrome/Edge (full support)
- Opera (full support)
- Firefox (experimental flag)
- Safari (no support - falls back to on-screen keyboard)

**See `docs/WASM_ARCHITECTURE.md#web-midi-api-integration` for implementation details.**

---

## Docker Build System

### Dockerfile Structure

Multi-stage build:
1. **Emscripten stage**: Compile all synths to WASM
2. **Node stage**: Build React apps
3. **Nginx stage**: Serve everything

```dockerfile
FROM emscripten/emsdk:3.1.51 AS wasm-builder
# Build all WASM modules

FROM node:20-slim AS react-builder
# Build all React UIs

FROM nginx:alpine
# Serve website + WASM modules
```

### Building

```bash
# Build all synths + website
docker build -t autosynth .

# Run
docker run -p 8080:80 autosynth

# Visit http://localhost:8080
```

### Development

For faster iteration during development:

```bash
# Build WASM locally
cd synths/MySynth
make wasm

# Run dev server
cd ui
npm run dev

# Hot reload at http://localhost:5173
```

---

## Documentation Index

### Core Guides

- **`docs/WASM_ARCHITECTURE.md`** - Complete architecture reference
- **`docs/DSP_LIBRARIES.md`** - SST, Airwindows, ChowDSP library index
- **`core/ui/COMPONENT_LIBRARY.md`** - UI component reference
- **`docs/GETTING_STARTED.md`** - Tutorials and examples

### Agent References

- `.claude/agents/project-coordinator.md` - Project orchestration
- `.claude/agents/synth-architect.md` - DSP architecture design
- `.claude/agents/dsp-engineer.md` - C++ implementation
- `.claude/agents/ui-developer.md` - React UI development

### Templates

- `templates/synth-template/` - New synth scaffold
- `templates/docs/` - Documentation templates

---

## Tips for Best Results

### Be Specific About Sound

```
✅ Good: "Warm, Moog-style bass with punchy attack and long decay"
❌ Bad: "A bass synth"
```

### Reference Known Synths

```
✅ Good: "Like the Prophet-5's polysynth character but with a TB-303 filter"
❌ Bad: "A good sounding synth"
```

### Specify DSP Components

```
✅ Good: "Use SST VintageLadder filter and Airwindows Galactic reverb"
❌ Bad: "Add a filter and reverb"
```

### Describe Use Cases

```
✅ Good: "Optimized for drone music with long evolving textures"
❌ Bad: "A general purpose synth"
```

---

## Troubleshooting

### WASM Build Fails

```bash
# Check Emscripten is installed
emcc --version

# Verify include paths in Makefile
-I ../../libs/sst-basic-blocks/include
-I ../../libs/sst-filters/include
```

### Audio Not Working

```bash
# Check browser console for errors
# Ensure HTTPS or localhost (required for AudioWorklet)
# Verify WASM module loads: Network tab in DevTools
```

### Components Not Found

```bash
# Check import paths
import { SynthKnob } from '../../../core/ui/components';

# Verify core/ui/components/ exists
ls core/ui/components/
```

### Docker Issues

```bash
# Rebuild image
docker build --no-cache -t autosynth .

# Check logs
docker logs <container-id>
```

---

## Philosophy

### Embrace Existing Libraries

SST, Airwindows, and ChowDSP represent decades of research and development. Their complexity is intentional - they model real analog behavior accurately. Don't simplify away from this complexity.

### Shared Components Drive Consistency

One component library means:
- Consistent UX across all synths
- No duplicate code
- Faster development
- Easier maintenance

### Web-Native Is the Future

No installers, no plugin hosts, no compatibility hell. Just a URL.

---

**AutoSynth** - Build professional synthesizers for the web.

For questions or issues: https://github.com/autosynth/autosynth/issues
