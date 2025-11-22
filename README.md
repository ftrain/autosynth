# AutoSynth

**Build professional synthesizer plugins using AI agent collaboration.**

Describe a synth in plain English:

> "Clone the Moog Model D but add tape saturation with delay options on a per-oscillator basis pre-filter"

...and a team of specialized AI agents will design, implement, and deliver a complete JUCE 8 VST/AU plugin with a React WebView frontend.

## Quick Start

### Prerequisites

- Docker (recommended) or native build tools
- Claude Pro/Max subscription (for OAuth login) or API key

### Using Docker (Recommended)

```bash
# Build the development container
./scripts/docker-run.sh build

# Start Claude Code with full permissions
./scripts/docker-run.sh claude
```

### Creating a Synth

Once inside Claude Code, invoke the project coordinator:

```
@project-coordinator

Build me a Minimoog Model D clone with 3 oscillators, ladder filter,
and classic modulation routing. Optimize for bass sounds.
```

The coordinator analyzes your request, delegates to specialist agents, and delivers:
- JUCE 8 plugin (VST3, AU, Standalone)
- React WebView UI
- Factory presets
- Documentation

## How It Works

```
USER PROMPT
    │
    ▼
PROJECT-COORDINATOR ──────────────────────────────────
    │                                                 │
    ├──► SYNTH-ARCHITECT (architecture doc)          │
    ├──► SOUND-DESIGNER (sonic goals)                │
    └──► SYSTEMS-ENGINEER (project setup)            │
              │                                       │
              ▼                                       │
         DSP-ENGINEER (C++ audio code)               │
              │                                       │
              ▼                                       │
         UI-DEVELOPER (React interface)              │
              │                                       │
              ▼                                       │
         QA-ENGINEER (tests & validation)            │
              │                                       │
              ▼                                       │
         DELIVERABLES ◄───────────────────────────────
```

### Spec-First Architecture

Every synth starts with a `synth-spec.json` that defines oscillators, filters, envelopes, parameters, and UI layout. Code generators produce working C++ and TypeScript from the spec—no TODO placeholders.

```bash
# Generate code from spec
node scripts/generate-from-spec.js my-synth/synth-spec.json my-synth/

# Build the plugin
cd my-synth && cmake -B build && cmake --build build
```

## The Agent Team

| Agent | Role |
|-------|------|
| **project-coordinator** | Orchestrates workflow, delegates tasks, integrates deliverables |
| **synth-architect** | Designs signal flow, selects DSP algorithms, creates architecture docs |
| **dsp-engineer** | Implements C++ audio processing using SST libraries |
| **ui-developer** | Builds React interfaces from the component library |
| **sound-designer** | Defines sonic goals, creates factory presets |
| **systems-engineer** | Sets up CMake, CI/CD, cross-platform builds |
| **qa-engineer** | Writes tests, validates signal flow, ensures plugin compliance |

## Project Structure

```
autosynth/
├── .claude/agents/     # Agent definitions
├── components/         # React UI primitives (knobs, sliders, envelopes)
├── templates/          # Plugin scaffolding + synth spec schema
├── scripts/            # new-plugin.sh, generate-from-spec.js, docker-run.sh
├── docs/               # DSP guides, SST library index
├── themes/             # UI theme system (6 built-in themes)
├── hooks/              # React hooks (useParameters, useJUCEBridge)
└── docker/             # Container configuration
```

## UI Component Library

The React component library provides all UI primitives for synth interfaces:

| Component | Purpose |
|-----------|---------|
| `SynthKnob` | Rotary control |
| `SynthSlider` | Linear fader |
| `SynthADSR` | 4-stage envelope editor |
| `SynthDAHDSR` | 6-stage envelope editor |
| `SynthLFO` | LFO with waveform selection |
| `Oscilloscope` | Real-time waveform display |
| `SynthVUMeter` | Level meter |
| `SynthSequencer` | Step sequencer |

Browse components:
```bash
npm install
npm run storybook
```

### Theming

Six built-in themes (vintage, cyberpunk, analog, minimal, nord, solarized) plus easy customization via CSS tokens or theme objects.

## DSP Libraries

All audio processing uses **Surge Synth Team (SST)** libraries:

| Library | Components |
|---------|------------|
| sst-basic-blocks | Oscillators, envelopes, LFOs |
| sst-filters | Ladder, SVF, diode, comb, formant |
| sst-effects | Delay, reverb, chorus, phaser |
| sst-waveshapers | Soft/hard clip, wavefold |

## Example Prompts

**Classic Clone:**
```
Create a Minimoog Model D clone with 3 oscillators, ladder filter,
and classic modulation routing.
```

**Hybrid Synth:**
```
Build a wavetable synth with FM capabilities, inspired by the
Waldorf Blofeld but with a simpler interface.
```

**Effect-Heavy:**
```
Design a mono synth for bass with built-in tape saturation,
spring reverb, and tempo-synced delay.
```

**Experimental:**
```
Create a granular synthesis engine with real-time spectral
processing and generative modulation.
```

## Development

### Docker Environment

```bash
./scripts/docker-run.sh build      # Build image
./scripts/docker-run.sh run        # Interactive shell
./scripts/docker-run.sh claude     # Claude Code with full permissions
./scripts/docker-run.sh test-x11   # Test X11 display
./scripts/docker-run.sh test-audio # Test audio (Linux)
```

### Native Development

```bash
npm install                        # Install dependencies
npm run storybook                  # Browse UI components
npm run dev                        # Development server
npm run build                      # Production build
npm run typecheck                  # Type check
npm test                           # Run tests
```

### Creating a New Plugin Manually

```bash
./scripts/new-plugin.sh "My Synth" "MySynth" "MySy"
```

## Documentation

- `docs/LLM_SYNTH_PROGRAMMING_GUIDE.md` - Complete synth design manual
- `docs/SST_LIBRARIES_INDEX.md` - All SST library components
- `docs/TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md` - React component guide
- `CLAUDE.md` - Full system documentation for Claude Code

## License

MIT
