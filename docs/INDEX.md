# Studio Documentation Index

A comprehensive index of all documentation, resources, and references for building synthesizers with the collaborative agent system.

## Quick Navigation

| Need To... | Go To |
|------------|-------|
| Scaffold a new plugin | `./scripts/new-plugin.sh` |
| Start a new synth project | [CLAUDE.md](../CLAUDE.md) |
| Understand DSP architecture | [LLM_SYNTH_PROGRAMMING_GUIDE.md](#dsp-architecture) |
| Find SST library components | [SST_LIBRARIES_INDEX.md](#sst-libraries) |
| Find open-source DSP libraries | [OPEN_SOURCE_DSP_LIBRARIES.md](#open-source-dsp) |
| Build React UI components | [TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md](#ui-development) |
| Design parameter interfaces | [DESIGNER_GUIDE.md](#design-patterns) |
| Browse UI components | [Storybook](#component-library) (`npm run storybook`) |
| Get plugin template | [templates/plugin-template/](#plugin-template) |
| Document architecture | [templates/docs/ARCHITECTURE_TEMPLATE.md](#doc-templates) |

---

## Documentation Files

### Core Reference

#### CLAUDE.md (Project Root)
**Purpose**: Main entry point for using the Studio system
**Use When**: Starting any new project, understanding the agent orchestration
**Key Sections**:
- Quick Start guide
- Agent team overview
- Orchestration flow diagram
- Example prompts
- Development workflow

#### docs/LLM_SYNTH_PROGRAMMING_GUIDE.md {#dsp-architecture}
**Purpose**: Comprehensive DSP and synth architecture manual
**Use When**: Designing synth architecture, implementing DSP, understanding audio concepts
**Key Sections**:
- Section 1-3: Synth ideation and architecture
- Section 4: Voice architecture
- Section 5: Oscillator implementation
- Section 6: Filter design
- Section 7: Envelopes
- Section 8: LFO and modulation
- Section 9: Effects (delay, reverb, chorus, distortion)
- Section 10: Master section
- Section 11-12: Modulation matrices
- Section 13: SST library reference
- Section 14: JUCE integration (APVTS)
- Section 15-16: Testing
- Section 17: CI/CD pipeline

**Critical Concepts**:
- Parameter normalization (0.0-1.0)
- Voice stealing strategies
- Signal flow conventions
- Thread safety in DSP

#### docs/SST_LIBRARIES_INDEX.md {#sst-libraries}
**Purpose**: Complete reference for all SST (Surge Synth Team) libraries
**Use When**: Selecting DSP components, finding implementation examples from Surge
**Libraries Covered**:

| Library | Purpose | Key Components |
|---------|---------|----------------|
| sst-basic-blocks | Core DSP primitives | DPWSawOscillator, SincTable, ADSREnvelope, SimpleLFO |
| sst-filters | Filter implementations | CytomicSVF, VintageLadder, K35Filter, NonlinearFeedback |
| sst-effects | Effect processors | Delay, Reverb, Chorus, Phaser, Flanger |
| sst-waveshapers | Distortion/saturation | ADAA waveshapers, soft clip, hard clip, wavefold |
| sst-plugininfra | Plugin utilities | Presets, patches, state management |
| sst-jucegui | JUCE GUI components | Knobs, sliders, modulation displays |

**Usage Pattern**:
```cpp
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"
#include "sst/filters/VintageLadder.h"
#include "sst/effects/Reverb.h"
```

#### docs/OPEN_SOURCE_DSP_LIBRARIES.md {#open-source-dsp}
**Purpose**: Comprehensive reference for open-source audio/DSP libraries beyond SST
**Use When**: Selecting external DSP components, time-stretching, granular synthesis, reverbs, utility DSP
**Libraries Covered**:

| Category | Libraries |
|----------|-----------|
| Core DSP & Filters | Faust, HIIR, signalsmith-stretch, Rubber Band |
| Synthesis | Surge DSP core, Vital/Vitalium, DPF |
| Effects | zita-rev1, zita-convolver, Dattorro reverbs, x42 plugins |
| Utilities | KFR (FFT/filters), SpeexDSP (echo/noise), libsamplerate |
| Mutable Instruments | Clouds, Rings, Plaits, Elements |
| Anti-Aliasing | PolyBLEP, MinBLEP implementations |

**Key Use Cases**:
- Time-stretching/pitch-shifting → Rubber Band, Signalsmith Stretch
- Granular synthesis → Mutable Clouds
- Physical modeling → Mutable Rings, Elements
- High-quality reverb → zita-rev1, Dattorro
- Fast FFT → KFR
- Oversampling → HIIR

#### docs/TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md {#ui-development}
**Purpose**: Guide for React engineers building synth UIs
**Use When**: Implementing user interfaces, connecting UI to JUCE backend
**Key Sections**:
- Component library overview
- Parameter system (value normalization)
- JUCE WebView bridge implementation
- State management patterns
- Layout composition

**Critical Patterns**:
```tsx
// Parameter binding
const { value, onChange } = useParameter('filter_cutoff');

// JUCE bridge
const { isConnected, setParameter } = useJUCEBridge();

// Component composition
<Synth title="My Synth">
  <SynthRow label="Filter">
    <SynthKnob value={cutoff} onChange={setCutoff} />
  </SynthRow>
</Synth>
```

#### docs/DESIGNER_GUIDE.md {#design-patterns}
**Purpose**: UI/UX patterns for audio parameter interfaces
**Use When**: Designing controls, mapping parameters to visuals
**Key Sections**:
- Parameter type taxonomy
- Control type selection matrix
- Visual feedback patterns
- Layout principles
- Component specifications

**Parameter-to-Control Mapping**:
| Parameter Type | Recommended Control |
|----------------|---------------------|
| Frequency (20Hz-20kHz) | Knob, logarithmic |
| Level (dB) | Slider, linear |
| Time (ms/s) | Knob, logarithmic |
| Percentage | Knob, linear |
| On/Off | LED button |
| Waveform | Segmented selector |
| Envelope | ADSR/DAHDSR editor |

---

## Agent Definitions

Location: `.claude/agents/`

### Orchestration

#### project-coordinator.md
**Role**: Team orchestrator and project manager
**Invoke When**: Starting ANY new synth project
**Capabilities**:
- Analyzes high-level requirements
- Creates project plans
- Delegates to specialist agents
- Integrates deliverables
- Manages workflow

**Input**: Natural language synth description
**Output**: Complete project plan, coordinated deliverables

### Architecture & Design

#### synth-architect.md
**Role**: Technical architect for synth design
**Invoke When**: Major architectural decisions needed
**Capabilities**:
- Voice architecture design
- Signal flow planning
- DSP algorithm selection
- Parameter layout
- Modulation routing

**Input**: Sonic goals, reference synths
**Output**: Architecture document with signal flow diagram

#### sound-designer.md
**Role**: Sonic direction and preset creation
**Invoke When**: Defining sound goals, creating presets
**Capabilities**:
- Analyze reference synths
- Describe sounds in DSP terms
- Specify sonic goals
- Create factory presets
- Test musical usability

**Input**: Musical requirements, reference tracks
**Output**: Sonic goals document, preset library

### Implementation

#### dsp-engineer.md
**Role**: DSP code implementation
**Invoke When**: Writing audio processing code
**Capabilities**:
- SST library integration
- Voice implementation
- Filter/oscillator setup
- Effects chains
- Parameter smoothing

**Input**: Architecture document
**Output**: C++ DSP code using SST libraries

**Key Pattern**:
```cpp
struct Voice {
    sst::basic_blocks::dsp::DPWSawOscillator osc;
    sst::filters::VintageLadder<float, 1> filter;
    sst::basic_blocks::modulators::ADSREnvelope env;
};
```

#### ui-developer.md
**Role**: React UI implementation
**Invoke When**: Building user interfaces
**Capabilities**:
- Component composition
- JUCE WebView integration
- Parameter state management
- Responsive layouts
- Accessibility

**Input**: Parameter list, UI requirements
**Output**: React components using library

**Key Pattern**:
```tsx
<SynthRow label="Filter">
  <SynthKnob label="Cutoff" value={cutoff} onChange={setCutoff} />
  <SynthKnob label="Resonance" value={reso} onChange={setReso} />
</SynthRow>
```

#### systems-engineer.md
**Role**: Build system and infrastructure
**Invoke When**: Project setup, CI/CD needed
**Capabilities**:
- CMakeLists.txt creation
- GitHub Actions workflows
- Docker configuration
- Cross-platform builds
- Dependency management

**Input**: Project requirements
**Output**: Build configuration, CI/CD pipelines

### Quality

#### qa-engineer.md
**Role**: Testing and validation
**Invoke When**: Tests needed, validation required
**Capabilities**:
- Unit tests (Catch2)
- Integration tests
- Signal validation
- Plugin validation (pluginval)
- Performance profiling

**Input**: Implementation to test
**Output**: Test suite, validation report

---

## Component Library {#component-library}

Location: `components/`
Browse: `npm run storybook`

### Layout Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Synth` | Top-level container | `title`, `subtitle`, `variant` |
| `SynthRow` | Horizontal control row | `label`, `gap`, `showPanel` |

### Control Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `SynthKnob` | Rotary control | `value`, `onChange`, `min`, `max`, `unit`, `bipolar` |
| `SynthSlider` | Linear fader | `value`, `onChange`, `orientation`, `min`, `max` |
| `SynthADSR` | 4-stage envelope | `values`, `onChange`, `label` |
| `SynthDAHDSR` | 6-stage envelope | `values`, `onChange`, `label` |
| `SynthLFO` | LFO with waveform | `values`, `onChange`, `label` |

### Display Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Oscilloscope` | Waveform display | `data`, `width`, `height` |
| `SynthVUMeter` | Level meter | `level`, `label`, `orientation` |
| `SynthLCD` | Text display | `text`, `rows`, `cols` |
| `SynthLED` | Status indicator | `active`, `color`, `label` |

### Sequencer Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `SynthSequencer` | Step sequencer | `steps`, `activeStep`, `onChange` |
| `TransportControls` | Play/stop/tempo | `isPlaying`, `bpm`, `onPlay` |

### Advanced Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `DualModeOscillator` | Combined osc control | `mode`, `params`, `onChange` |

---

## External References

### SST Libraries (GitHub)
- [sst-basic-blocks](https://github.com/surge-synthesizer/sst-basic-blocks)
- [sst-filters](https://github.com/surge-synthesizer/sst-filters)
- [sst-effects](https://github.com/surge-synthesizer/sst-effects)
- [sst-waveshapers](https://github.com/surge-synthesizer/sst-waveshapers)

### Open Source DSP Libraries
- [Faust](https://github.com/grame-cncm/faust) - Functional DSP language
- [HIIR](https://github.com/unevens/hiir) - Polyphase filters & Hilbert transform
- [Signalsmith Stretch](https://github.com/Signalsmith-Audio/signalsmith-stretch) - Time/pitch shifting
- [Rubber Band](https://github.com/breakfastquay/rubberband) - Industry-standard time-stretching
- [Mutable Instruments](https://github.com/pichenettes/eurorack) - Clouds, Rings, Plaits, Elements
- [Vital](https://github.com/mtytel/vital) - Wavetable synth
- [zita-rev1](https://github.com/PelleJuul/zita-rev1) - Algorithmic reverb
- [KFR](https://github.com/kfrlib/kfr) - Fast FFT & DSP
- [libsamplerate](https://github.com/libsndfile/libsamplerate) - Sample rate conversion
- [DPF](https://github.com/DISTRHO/DPF) - Plugin framework

### JUCE
- [JUCE Framework](https://juce.com/)
- [JUCE Tutorials](https://juce.com/learn/tutorials)
- [JUCE API Documentation](https://docs.juce.com/)

### Testing
- [Catch2](https://github.com/catchorg/Catch2)
- [pluginval](https://github.com/Tracktion/pluginval)

---

## Common Workflows

### Creating a New Synth
1. Invoke `project-coordinator` with description
2. Review architecture from `synth-architect`
3. DSP implementation by `dsp-engineer`
4. UI implementation by `ui-developer`
5. Testing by `qa-engineer`
6. Presets by `sound-designer`

### Adding a New Feature
1. Check `SST_LIBRARIES_INDEX.md` for existing DSP
2. Check Storybook for existing UI components
3. Update architecture document if needed
4. Implement DSP → UI → Tests

### Debugging DSP Issues
1. Consult `LLM_SYNTH_PROGRAMMING_GUIDE.md` Section 15-16
2. Check for denormals, NaN, Inf
3. Verify parameter normalization (0-1)
4. Use `qa-engineer` for test creation

### Building for Release
1. Follow `systems-engineer` CMake template
2. Run GitHub Actions workflow
3. Validate with pluginval
4. Package for distribution

---

## Templates {#plugin-template}

### Spec-First System (Recommended)

The most efficient workflow uses a `synth-spec.json` to generate code:

| File | Purpose |
|------|---------|
| `templates/synth-spec.schema.json` | JSON Schema for spec validation |
| `templates/synth-spec.example.json` | Complete example spec (Warm Bass) |
| `scripts/generate-from-spec.js` | Generates Voice.h, Parameters.h, parameters.ts |

**Usage:**
```bash
# 1. Copy and edit spec
cp templates/synth-spec.example.json my-synth/synth-spec.json

# 2. Generate code (deterministic, no TODOs)
node scripts/generate-from-spec.js my-synth/synth-spec.json my-synth/
```

### Plugin Template (`templates/plugin-template/`)

For scaffolding the project structure:
```bash
./scripts/new-plugin.sh "Plugin Name" "PluginName" "PlNm"
```

**Contents**:
| File | Purpose |
|------|---------|
| `CMakeLists.txt` | JUCE 8 + SST build configuration |
| `source/PluginProcessor.*` | Main audio processor with APVTS |
| `source/PluginEditor.*` | WebView editor with JUCE bridge |
| `source/dsp/Voice.h` | Voice template (or use generator) |
| `source/dsp/SynthEngine.h` | Polyphonic engine |
| `ui/src/App.tsx` | React UI scaffold |
| `ui/src/hooks/useJUCEBridge.ts` | WebView-JUCE communication |
| `ui/src/hooks/useParameters.ts` | Parameter state management |
| `tests/` | Catch2 test setup |
| `.github/workflows/build.yml` | CI/CD for all platforms |

### Documentation Templates {#doc-templates}

| Template | Used By | Purpose |
|----------|---------|---------|
| `templates/docs/ARCHITECTURE_TEMPLATE.md` | synth-architect | Signal flow, voice design |
| `templates/docs/SONIC_GOALS_TEMPLATE.md` | sound-designer | Sonic direction, references |
| `templates/docs/PARAMETERS_TEMPLATE.md` | All | Parameter documentation |

### Preset Templates

| File | Purpose |
|------|---------|
| `templates/presets/preset-schema.json` | JSON schema for preset validation |
| `templates/presets/example-preset.json` | Example preset demonstrating format |

---

## File Locations Quick Reference

```
studio/
├── CLAUDE.md                    # Main entry point
├── docs/
│   ├── INDEX.md                 # This file
│   ├── LLM_SYNTH_PROGRAMMING_GUIDE.md
│   ├── SST_LIBRARIES_INDEX.md
│   ├── OPEN_SOURCE_DSP_LIBRARIES.md  # Faust, Mutable, zita, KFR, etc.
│   ├── TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md
│   └── DESIGNER_GUIDE.md
├── templates/
│   ├── plugin-template/         # Complete plugin starter
│   │   ├── CMakeLists.txt
│   │   ├── source/              # C++ source templates
│   │   ├── ui/                  # React UI templates
│   │   └── tests/               # Test templates
│   ├── docs/                    # Documentation templates
│   └── presets/                 # Preset schema & examples
├── scripts/
│   └── new-plugin.sh            # Create new plugin from template
├── .claude/
│   └── agents/
│       ├── project-coordinator.md
│       ├── synth-architect.md
│       ├── dsp-engineer.md
│       ├── ui-developer.md
│       ├── systems-engineer.md
│       ├── qa-engineer.md
│       ├── sound-designer.md
│       └── audio-component-spec-writer.md
├── components/                   # React component library
├── hooks/                        # React hooks
├── types/                        # TypeScript types
├── themes/                       # Theme definitions
├── styles/                       # CSS/styling
├── presets/                      # Example presets
└── .storybook/                   # Storybook config
```

---

## Search This Documentation

To find specific information:

| Looking For | Search In |
|-------------|-----------|
| Oscillator implementation | `LLM_SYNTH_PROGRAMMING_GUIDE.md` Section 5 |
| Filter types available | `SST_LIBRARIES_INDEX.md` → sst-filters |
| Effect algorithms | `SST_LIBRARIES_INDEX.md` → sst-effects |
| Time-stretching/pitch-shifting | `OPEN_SOURCE_DSP_LIBRARIES.md` → Rubber Band, Signalsmith |
| Granular/physical modeling | `OPEN_SOURCE_DSP_LIBRARIES.md` → Mutable Instruments |
| Reverb algorithms | `OPEN_SOURCE_DSP_LIBRARIES.md` → zita-rev1, Dattorro |
| FFT/Resampling | `OPEN_SOURCE_DSP_LIBRARIES.md` → KFR, libsamplerate |
| Anti-aliasing oscillators | `OPEN_SOURCE_DSP_LIBRARIES.md` → PolyBLEP, MinBLEP |
| UI component props | Storybook or `TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md` |
| Control design patterns | `DESIGNER_GUIDE.md` |
| Project setup | `systems-engineer.md` agent |
| Testing patterns | `qa-engineer.md` agent |
| Preset format | `sound-designer.md` agent |

---

*This index is maintained as part of the Studio system. Update as new documentation is added.*
