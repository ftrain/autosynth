# AutoSynth

**Build professional web-native synthesizers using AI agent collaboration.**

Describe a synth in plain English:

> "Clone the Moog Model D with tape saturation and Airwindows reverb"

...and a team of specialized AI agents will design, implement, and deliver a complete WebAssembly synthesizer running in your browser with Web Audio API and Web MIDI support.

---

## ⚡ Quick Start

### Create Your First Synth

```bash
# Create a new synth from template
./scripts/new-synth.sh "My Synth" "MySynth"

# Build WASM module
cd synths/MySynth
make wasm

# Start development server
cd ui
npm install
npm run dev

# Open http://localhost:5173
```

### Using AI Agents

Invoke the project coordinator:

```
@project-coordinator

Build me a bass synth with SST sawtooth oscillator, VintageLadder filter,
and ChowDSP tape saturation. Optimize for deep bass sounds.
```

The coordinator analyzes your request, selects appropriate DSP libraries, and delegates to specialist agents to deliver:
- WebAssembly DSP engine (SST/Airwindows/ChowDSP)
- React UI with Web Audio bridge
- Web MIDI support
- Documentation

---

## 🌐 Web-First Architecture

```
Browser
├── React UI (controls, MIDI routing)
├── Web MIDI API (hardware controllers)
├── Web Audio API (AudioContext)
└── AudioWorklet (audio thread)
    └── WASM Module (C++ DSP)
        ├── SST libraries (oscillators, filters, effects)
        ├── Airwindows (reverb, saturation)
        └── ChowDSP (tape emulation)
```

**No plugins. No downloads. No installation. Just a URL.**

---

## 🎛️ Features

- **WebAssembly** - C++ DSP compiled to WASM for native performance
- **Web Audio API** - Low-latency audio processing in the browser
- **Web MIDI API** - Connect hardware MIDI keyboards and controllers
- **Shared Component Library** - Professional UI components for all synths
- **SST/Airwindows/ChowDSP** - Industrial-strength DSP libraries
- **Docker Build System** - Reproducible builds with Emscripten
- **One Codebase** - All synths share components and styles

---

## 🤖 The Agent Team

| Agent | Role | Deliverables |
|-------|------|--------------|
| **project-coordinator** | Orchestrates workflow, selects DSP libraries | Project plan, architecture doc |
| **synth-architect** | Designs signal flow, selects SST components | Architecture doc, signal diagrams |
| **dsp-engineer** | Implements C++ DSP using SST/Airwindows/ChowDSP | Engine.h, Voice.h, wasm_bindings.cpp |
| **ui-developer** | Builds React UI from shared component library | App.tsx, useAudioEngine.ts |
| **sound-designer** | Defines sonic goals, creates presets | Preset library, sonic specs |
| **qa-engineer** | Browser testing, MIDI validation | Test reports, compatibility matrix |

---

## 📁 Project Structure

```
autosynth/
├── synths/              # Individual synthesizers
│   └── MySynth/
│       ├── dsp/         # C++ DSP (Engine.h, Voice.h, wasm_bindings.cpp)
│       ├── ui/          # React UI (uses core/ui/components/)
│       ├── public/      # processor.js (AudioWorklet)
│       └── Makefile     # Emscripten build
│
├── core/
│   └── ui/
│       ├── components/  # Shared React components (SynthKnob, SynthADSR, etc.)
│       └── styles/      # Shared CSS
│
├── libs/                # DSP libraries (git submodules)
│   ├── sst-basic-blocks/
│   ├── sst-filters/
│   ├── sst-effects/
│   ├── airwin2rack/
│   └── chowdsp_utils/
│
├── website/             # Synth browser (home page)
├── templates/           # synth-template/ (scaffold for new synths)
├── scripts/             # new-synth.sh, build-all.sh
├── docker/              # Production Dockerfile, nginx config
└── docs/                # Architecture guides, DSP library reference
```

---

## 🎨 UI Component Library

All synths use the same professional React components:

| Component | Purpose |
|-----------|---------|
| `SynthKnob` | Rotary control for continuous parameters |
| `SynthSlider` | Linear fader |
| `SynthADSR` | 4-stage ADSR envelope editor with visualization |
| `SynthDAHDSR` | 6-stage DAHDSR envelope editor |
| `SynthLFO` | LFO with waveform selection and rate control |
| `SynthSequencer` | Step sequencer with pitch and gate per step |
| `Oscilloscope` | Real-time waveform display |
| `SynthRow` | Layout container with theming |

See `core/ui/COMPONENT_LIBRARY.md` for complete API reference.

---

## 🔊 DSP Libraries

**Rule: Never write custom DSP. Always use existing libraries.**

| Library | Components | Use For |
|---------|-----------|---------|
| **SST sst-basic-blocks** | DPWSawOscillator, DPWPulseOscillator, SineOscillator, ADSREnvelope, LFO | Oscillators, envelopes, modulation |
| **SST sst-filters** | VintageLadder, CytomicSVF, DiodeLadder, Comb | Filters (Moog-style, clean SVF, TB-303 style) |
| **SST sst-effects** | Delay, Chorus, Phaser, Flanger | Time-based effects |
| **Airwindows** | Galactic3, ToTape6, Density, Tube2 | Reverb, tape saturation, tube distortion |
| **ChowDSP** | TapeModel | Authentic tape emulation with wow/flutter |

See `docs/DSP_LIBRARIES.md` for complete API reference with code examples.

---

## 🚀 Build & Deploy

### Development

```bash
# Create new synth
./scripts/new-synth.sh "My Synth" "MySynth"

# Build WASM
cd synths/MySynth && make wasm

# Start dev server (with hot reload)
cd ui && npm run dev

# Open http://localhost:5173
```

### Production

```bash
# Build all synths + website
docker build -f Dockerfile.production -t autosynth .

# Run
docker run -p 8080:80 autosynth

# Open http://localhost:8080
```

The production build:
1. Compiles all synths to WASM (Emscripten stage)
2. Builds all React UIs (Node stage)
3. Builds synth browser website
4. Serves everything with Nginx

---

## 🎹 Web MIDI Support

All synths automatically support Web MIDI:

- **MIDI Input** - Play with hardware keyboards/controllers
- **MIDI Output** - Send MIDI to external devices
- **Hot-plug** - Dynamic device connection/disconnection
- **Browser Support:**
  - Chrome/Edge: ✅ Full MIDI support
  - Firefox: ⚠️ No MIDI (on-screen keyboard fallback)
  - Safari: ⚠️ No MIDI (on-screen keyboard fallback)

---

## 📝 Example Prompts

**Classic Clone:**
```
Create a Minimoog Model D clone with 3 SST oscillators, VintageLadder filter,
and classic modulation routing.
```

**Bass Synth with Effects:**
```
Build a bass synth with SST sawtooth oscillator, VintageLadder filter,
and ChowDSP tape saturation. Add Airwindows Galactic3 reverb.
```

**Experimental:**
```
Design a granular synthesis engine using SST oscillators with
Airwindows ToTape6 for analog warmth.
```

---

## 🛠️ Development Workflow

### 1. Design Phase

```
@project-coordinator

Describe your synth in plain English...
```

The coordinator creates an architecture document identifying:
- Required SST components (oscillators, filters, envelopes)
- Airwindows effects (reverb, saturation)
- ChowDSP emulations (tape, analog modeling)
- Parameter mappings
- UI layout

### 2. Implementation

Agents work in parallel:
- `dsp-engineer` implements C++ using SST/Airwindows/ChowDSP
- `ui-developer` builds React UI with shared components
- Both integrate via WASM bindings and AudioWorklet

### 3. Testing

- Build WASM: `make wasm`
- Start dev server: `npm run dev`
- Test in Chrome/Edge (full MIDI support)
- Validate audio quality, MIDI routing, parameter control

### 4. Deploy

- Add to production build
- Docker builds all synths
- Nginx serves at `/synths/{Name}/`

---

## 📚 Documentation

- **`CLAUDE.md`** - Complete development workflow guide
- **`docs/WASM_ARCHITECTURE.md`** - Technical architecture reference
- **`docs/DSP_LIBRARIES.md`** - SST/Airwindows/ChowDSP API reference
- **`core/ui/COMPONENT_LIBRARY.md`** - UI component reference
- **`templates/synth-template/README.md`** - Template customization guide

---

## 🎯 Key Principles

### 1. Web-First
No plugins, no native code, no JUCE. Everything runs in the browser.

### 2. Never Write Custom DSP
Always use SST/Airwindows/ChowDSP libraries. They're battle-tested and professional-grade.

### 3. Shared Components
All synths use the same React component library. One codebase, one design language.

### 4. Docker Everything
Reproducible builds with Emscripten, Node, and Nginx in multi-stage Docker.

---

## 🌟 Why AutoSynth?

**Traditional Approach:**
- Install development tools (JUCE, Xcode, Visual Studio)
- Build native plugins (VST, AU, AAX)
- Distribute installers
- Handle platform-specific bugs
- Users download and install

**AutoSynth Approach:**
- Write C++ DSP with SST/Airwindows/ChowDSP
- Compile to WASM with Emscripten
- Build React UI with shared components
- Deploy to web with Docker + Nginx
- Users click a URL

**Result:** Professional synthesizers accessible to anyone with a browser.

---

## 🔧 Browser Support

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| AudioWorklet | ✅ | ✅ | ⚠️ Limited |
| Web MIDI | ✅ | ❌ | ❌ |
| WASM | ✅ | ✅ | ✅ |

**Recommendation:** Target Chrome/Edge for full experience. Provide on-screen keyboard fallback for Firefox/Safari.

---

## 📦 What's Included

- ✅ Complete synth template (WASM + AudioWorklet + React)
- ✅ Shared UI component library (12+ components)
- ✅ SST/Airwindows/ChowDSP integration patterns
- ✅ Web Audio + Web MIDI bridge
- ✅ Build scripts (new-synth.sh, build-all.sh)
- ✅ Production Dockerfile (multi-stage)
- ✅ Synth browser website
- ✅ Comprehensive documentation
- ✅ AI agent team (7 specialized agents)

---

## 🚧 Getting Help

**Documentation:**
- Read `CLAUDE.md` for complete workflow
- Check `docs/` for technical references
- Browse `core/ui/COMPONENT_LIBRARY.md` for UI components

**AI Assistance:**
```
@project-coordinator
[Describe what you want to build]
```

The agents know the entire system and can guide you through any task.

---

## 📄 License

MIT

---

**AutoSynth** - Build professional synthesizers for the web.

No plugins. No installers. No compatibility hell. Just a URL.
