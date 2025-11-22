# Studio - Collaborative Synth Building System

## Overview

Studio is a framework for building professional synthesizers using AI agent collaboration. Give it a high-level description like:

> "Clone the Moog Model D but add tape processing with delay options on a per-oscillator basis pre-filter"

...and a team of specialized agents will collaborate to design, implement, and deliver a complete JUCE 8 VST/AU plugin with a React WebView frontend.

## Quick Start

### Recommended: Docker Development Environment

The fastest way to start building synths. JUCE and all dependencies are pre-installed:

```bash
# First time: build the image (~5-10 minutes, only once)
./scripts/dev.sh build

# Start development shell
./scripts/dev.sh

# Inside container: create a new synth (instant!)
./scripts/new-plugin.sh "Warm Bass" "WarmBass" "WmBs"

# Build immediately - no setup needed
cd plugins/WarmBass
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

**What's pre-cached in Docker:**
- JUCE 8.0.0 with juceaide pre-compiled (saves ~50 seconds per build)
- All SST libraries (sst-basic-blocks, sst-filters, sst-effects, sst-waveshapers)
- GTK3, WebKit, ALSA, PulseAudio, and all Linux dependencies
- Node.js 20 for React UI development
- Clang compiler for faster builds

**Helper commands:**
```bash
./scripts/dev.sh                    # Interactive shell
./scripts/dev.sh new "My Synth"     # Create plugin from host
./scripts/dev.sh build-plugin dir   # Build a plugin
./scripts/dev.sh claude             # Start Claude Code in container
./scripts/dev.sh stop               # Stop container
```

### Alternative: Manual Setup (without Docker)

```bash
./scripts/new-plugin.sh "My Synth Name" "MySynthName" "MySn"
```

This creates a plugin structure but requires manual setup:
- Git submodules for JUCE and SST libraries
- System package installation (GTK3, WebKit, ALSA, etc.)
- npm install for UI dependencies

See the script output for full instructions.

### Starting a New Synth Project

Use the **project-coordinator** agent to begin any synth project:

```
@project-coordinator

Build me a synthesizer that [describe your synth idea]
```

The coordinator will:
1. Analyze your request
2. Ask clarifying questions if needed
3. Create a project plan
4. Delegate to specialist agents
5. Integrate all deliverables

### Example Prompts

**Classic Clone:**
```
Create a Minimoog Model D clone with 3 oscillators, ladder filter, and classic modulation routing.
```

**Hybrid Synth:**
```
Build a wavetable synth with FM capabilities, inspired by the Waldorf Blofeld but with a simpler interface.
```

**Effect-Heavy:**
```
Design a mono synth optimized for bass with built-in tape saturation, spring reverb, and tempo-synced delay.
```

**Experimental:**
```
Create a granular synthesis engine with real-time spectral processing and generative modulation.
```

## Agent Team

### The Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **project-coordinator** | Orchestrates the team, manages workflow | Starting any new project |
| **synth-architect** | Designs architecture, signal flow | Major design decisions |
| **dsp-engineer** | Implements audio processing | Writing DSP code |
| **ui-developer** | Builds React interfaces | UI implementation |
| **systems-engineer** | Build system, CI/CD | Project setup, builds |
| **qa-engineer** | Testing, validation | Quality assurance |
| **sound-designer** | Sonic direction, presets | Sound goals, presets |
| **audio-component-spec-writer** | Component specifications | Detailed specs |

### Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER PROMPT                                  │
│  "Clone the Moog Model D with tape saturation per oscillator"       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROJECT-COORDINATOR                               │
│  - Analyzes request                                                  │
│  - Creates project plan                                              │
│  - Delegates to specialists                                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ SYNTH-ARCHITECT │  │ SOUND-DESIGNER  │  │ SYSTEMS-ENGINEER│
│ Architecture doc │  │ Sonic goals     │  │ Project setup   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │    DSP-ENGINEER     │
                    │ Implement DSP code  │
                    └─────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │    UI-DEVELOPER     │
                    │ Build React UI      │
                    └─────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │    QA-ENGINEER      │
                    │ Test & validate     │
                    └─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DELIVERABLES                                    │
│  - JUCE 8 plugin (VST3, AU, Standalone)                             │
│  - React WebView UI                                                  │
│  - Factory presets                                                   │
│  - Documentation                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Git Workflow

### Branch-per-Plugin Strategy

The `main` branch is the **meta-template** - it contains the framework, templates, and shared infrastructure. Each plugin lives on its own branch:

```
main                          <- Framework, templates, shared code
├── plugin/model-d            <- Minimoog Model D clone
├── plugin/warm-bass          <- Bass synth
├── plugin/tape-delay         <- Delay effect
└── plugin/granular-pad       <- Granular synth
```

**Why this approach:**
1. **Clean separation**: Each plugin is isolated, no conflicts
2. **Shared improvements**: Template fixes on `main` benefit all plugins
3. **Easy experimentation**: Create branches, discard if needed
4. **Parallel development**: Multiple synths can be developed simultaneously

**Creating a new plugin automatically creates its branch:**
```bash
./scripts/new-plugin.sh "Model D" "ModelD" "ModD"
# Creates branch: plugin/model-d
```

**Merging improvements back to main:**
When you discover fixes or improvements that apply to all plugins (template bugs, new test utilities, documentation), commit them to `main`:
```bash
git checkout main
# Make changes to templates/
git commit -m "fix: Template improvement"
```

## Core Philosophy

### Minimal Code, Maximum Reuse

1. **DSP**: All audio processing uses **SST libraries** (sst-basic-blocks, sst-filters, sst-effects)
   - Never write custom DSP algorithms
   - Thin JUCE wrappers around SST components

2. **UI**: All interfaces use the **React component library**
   - Never create new UI components
   - Compose from existing Storybook components

3. **Build**: Standard **JUCE 8 + CMake** project structure
   - Cross-platform from day one
   - CI/CD via GitHub Actions

### What This Means

**Good**: "Use the VintageLadder filter from sst-filters"
**Bad**: "Implement a custom ladder filter algorithm"

**Good**: "Compose the UI from SynthKnob and SynthADSR components"
**Bad**: "Create a custom knob component"

## Spec-First Architecture

### The Problem with TODO-Driven Development

Traditional approach: Templates with TODO comments require agents to interpret context and make decisions. This is error-prone and non-deterministic.

### The Solution: Single Source of Truth

**Every synth starts with a `synth-spec.json` file** that defines:
- Oscillators (count, types, SST components)
- Filters (types, modes, SST components)
- Envelopes and LFOs
- Every parameter (with exact ranges, defaults, units)
- UI layout

This spec is validated against a JSON Schema, then **code generators produce working code** - not TODO placeholders.

### Workflow Comparison

| Old Approach | Spec-First Approach |
|--------------|---------------------|
| Agent reads docs, makes decisions | Spec defines everything upfront |
| TODO comments in templates | Generated working code |
| Parameters defined 3 places | Single source (spec.json) |
| Sequential agent handoffs | Parallel work from spec |
| Errors compound through phases | Validation at each gate |

### How It Works

```
1. SPEC CREATION
   User prompt → project-coordinator → synth-spec.json (validated)

2. CODE GENERATION (deterministic)
   synth-spec.json → generate-from-spec.js →
   - source/dsp/Voice.h (with SST components wired up)
   - source/Parameters.h (JUCE APVTS)
   - ui/src/types/parameters.ts

3. CUSTOMIZATION (parallel)
   - dsp-engineer: Adds custom DSP logic to Voice.h
   - ui-developer: Builds UI from generated parameter types

4. VALIDATION
   - Schema validation (spec)
   - Build check (C++)
   - Type check (TypeScript)
   - Unit tests
```

### Using the Spec System

```bash
# 1. Create spec (by hand or via project-coordinator)
cp templates/synth-spec.example.json my-synth/synth-spec.json
# Edit to match your design

# 2. Generate code
node scripts/generate-from-spec.js my-synth/synth-spec.json my-synth/

# 3. Customize generated code
# DSP engineer adds custom logic to Voice.h
# UI developer builds interface from parameters.ts

# 4. Build and test
cd my-synth && cmake -B build && cmake --build build
```

### Spec File Structure

```json
{
  "meta": { "name": "Warm Bass", "type": "subtractive", "voices": 4 },
  "voice": {
    "oscillators": [{ "id": "osc1", "sst": "DPWSawOscillator" }],
    "filters": [{ "id": "filter1", "sst": "VintageLadder" }],
    "envelopes": [{ "id": "env1", "type": "ADSR", "target": "amp" }]
  },
  "parameters": [
    { "id": "filter_cutoff", "name": "Cutoff", "min": 20, "max": 20000, "default": 2000 }
  ],
  "ui": { "layout": [...] }
}
```

See `templates/synth-spec.schema.json` for full schema and `templates/synth-spec.example.json` for a complete example.

## Documentation Index

### Architecture & DSP
- `docs/LLM_SYNTH_PROGRAMMING_GUIDE.md` - Complete synth design manual
- `docs/SST_LIBRARIES_INDEX.md` - All SST library components
- `docs/INDEX.md` - Complete documentation navigation

### UI Development
- `docs/TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md` - React component guide
- `docs/DESIGNER_GUIDE.md` - UI/UX patterns for synths

### Component Library
- `components/` - All React components
- Run `npm run storybook` to browse components

### Templates & Scripts
- `templates/plugin-template/` - Complete plugin starter
- `templates/docs/` - Documentation templates (architecture, sonic goals, parameters)
- `templates/presets/` - Preset schema and examples
- `scripts/new-plugin.sh` - Create new plugin from template

### Agent References
- `.claude/agents/` - All agent definitions

## Project Structure

A typical synth project created by this system:

```
my-synth/
├── CMakeLists.txt              # Build configuration
├── JUCE/                       # JUCE framework
├── libs/sst/                   # SST DSP libraries
├── source/
│   ├── PluginProcessor.cpp     # Main audio processor
│   ├── PluginEditor.cpp        # WebView host
│   └── dsp/                    # DSP components
├── ui/
│   ├── src/                    # React UI source
│   └── dist/                   # Built UI (embedded)
├── tests/                      # Unit & integration tests
├── presets/                    # Factory presets
├── docs/
│   ├── ARCHITECTURE.md         # Design documentation
│   └── PARAMETERS.md           # Parameter reference
└── .github/workflows/          # CI/CD
```

## Key SST Libraries

| Library | Purpose | Key Components |
|---------|---------|----------------|
| sst-basic-blocks | Core DSP | Oscillators, envelopes, LFOs, math |
| sst-filters | Filters | Ladder, SVF, diode, comb, formant |
| sst-effects | Effects | Delay, reverb, chorus, phaser |
| sst-waveshapers | Distortion | Soft/hard clip, wavefold |

## Component Library

| Component | Purpose |
|-----------|---------|
| `SynthKnob` | Rotary control for continuous params |
| `SynthSlider` | Linear fader |
| `SynthADSR` | 4-stage envelope editor |
| `SynthDAHDSR` | 6-stage envelope editor |
| `SynthLFO` | LFO with waveform selection |
| `Oscilloscope` | Real-time waveform display |
| `SynthVUMeter` | Level meter |
| `SynthLCD` | Text display |
| `SynthLED` | Status indicator |
| `SynthSequencer` | Step sequencer |

## Development Workflow

### 0. Scaffold Phase
```bash
./scripts/new-plugin.sh "My Synth" "MySynth" "MySy"
```
Result: Complete plugin structure from template

### 1. Spec Phase (THE CRITICAL STEP)
```
User prompt → project-coordinator → synth-spec.json
```
Result: Validated spec defining all oscillators, filters, parameters, UI
**This is where all design decisions are made and locked in.**

### 2. Generation Phase (DETERMINISTIC)
```bash
node scripts/generate-from-spec.js synth-spec.json ./
```
Result: Generated Voice.h, Parameters.h, parameters.ts - working code, not TODOs

### 3. Customization Phase (PARALLEL)
```
Generated code → dsp-engineer (Voice.h) + ui-developer (App.tsx) in parallel
```
Result: Custom DSP logic and polished UI added to generated scaffolding

### 4. Validation Gates
```
- [ ] Spec validates against schema
- [ ] C++ builds without errors
- [ ] TypeScript type checks
- [ ] Unit tests pass
- [ ] Integration tests pass
```

### 5. Quality Phase
```
Implementation → qa-engineer → sound-designer (presets)
Result: Tested plugin with factory presets
```

### 6. Delivery
```
All deliverables → project-coordinator → packaging
Result: Release-ready plugin
```

## Tips for Best Results

### Be Specific About Sound
```
Good: "Warm, Moog-style bass with punchy attack and long decay"
Bad: "A bass synth"
```

### Reference Known Synths
```
Good: "Like the Prophet-5's polysynth character but with a TB-303 filter"
Bad: "A good sounding synth"
```

### Specify Key Features
```
Good: "3 oscillators, each with independent tape saturation pre-filter"
Bad: "Some oscillators with effects"
```

### Describe Use Cases
```
Good: "Optimized for live performance with macro controls"
Bad: "A general purpose synth"
```

## Troubleshooting

### Agent Not Responding as Expected
- Make sure to invoke `project-coordinator` first for new projects
- Provide clear, specific requirements
- Ask for clarification if output seems off-target

### Missing Components
- Check SST library reference in `docs/SST_LIBRARIES_INDEX.md`
- Check component library in Storybook
- If truly missing, note as a requirement for future implementation

### Build Issues
- Run `git submodule update --init --recursive`
- Ensure JUCE and SST libraries are properly cloned
- Check `docs/LLM_SYNTH_PROGRAMMING_GUIDE.md` Section 17 for CI/CD

### Docker Issues
- **X11 not working on macOS**: Ensure XQuartz is installed and running, then log out and back in
- **Audio not working**: Linux only; ensure PulseAudio is running (`pulseaudio --start`)
- **Login not persisting**: Check `.docker-state/claude/` directory exists and is writable
- **Build fails**: Run `./scripts/docker-run.sh build` to rebuild the image

## Contributing

This is an evolving system. To improve it:

1. **Add documentation**: Put new guides in `docs/`
2. **Add components**: Extend the Storybook library in `components/`
3. **Update agents**: Modify agent definitions in `.claude/agents/`
4. **Add presets**: Include example presets in `presets/`

---

**Studio** - Build professional synthesizers with AI collaboration.
