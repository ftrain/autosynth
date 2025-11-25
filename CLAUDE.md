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
./scripts/new-plugin.sh synth "Warm Bass" "WarmBass" "WmBs"

# Build immediately - no setup needed
cd plugins/synths/WarmBass
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build

# Or build from repo root with monorepo CMake
cmake -B build -DPLUGINS="WarmBass"
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

### Embrace SST Complexity

**SST libraries are complex because real synthesis is complex.** The Moog ladder filter models thermal drift, transistor nonlinearities, and capacitor tolerances. The DPW oscillators implement sophisticated anti-aliasing. This complexity is not accidental—it's essential for accurate modeling of real analog behavior.

**Do NOT simplify away from SST complexity.** When you encounter complex SST APIs, study them. The complexity exists because the original hardware behavior is complex. A "simpler" approach is almost always a worse-sounding approach. SST represents the most thorough thinking about synthesis available.

### Minimal Code, Maximum Reuse

1. **DSP**: All audio processing uses **SST libraries** (sst-basic-blocks, sst-filters, sst-effects)
   - Use SST components directly—they model real analog behavior
   - Thin JUCE wrappers around SST components
   - Study SST source code to understand parameter ranges
   - When SST has multiple implementations, understand the trade-offs

2. **UI**: All interfaces use the **React component library**
   - Use components from `core/ui/components/`
   - Compose from SynthKnob, SynthADSR, SynthSlider, Oscilloscope
   - Value normalization: useParameters stores 0-1, SynthKnob expects raw values

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

### Component Library ⚠️ **READ THIS FIRST WHEN BUILDING UIs**
- **`core/ui/COMPONENT_LIBRARY.md`** - **ALWAYS READ THIS BEFORE BUILDING ANY UI**
  - Complete reference for all 12+ UI components (SynthKnob, SynthADSR, SynthLFO, etc.)
  - Includes props, examples, and critical parameter normalization patterns
  - Single source of truth for component usage
- `core/ui/components/index.js` - Component exports and quick reference
- `core/ui/components/` - All React component source files
- Run `npm run storybook` to browse components interactively

### Templates & Scripts
- `templates/plugin-template/` - Complete plugin starter
- `templates/docs/` - Documentation templates (architecture, sonic goals, parameters)
- `templates/presets/` - Preset schema and examples
- `scripts/new-plugin.sh` - Create new plugin from template

### Agent References
- `.claude/agents/` - All agent definitions

## Project Structure

### Monorepo Layout

```
autosynth/
├── CMakeLists.txt              # Root build configuration (monorepo)
├── libs/                       # Shared dependencies
│   ├── JUCE/                   # JUCE framework
│   └── sst-*/                  # SST DSP libraries
├── core/                       # Shared code across plugins
│   ├── dsp/                    # Shared DSP components
│   ├── effects/                # Shared effects
│   ├── ui/                     # React component library
│   │   ├── components/         # SynthKnob, SynthADSR, etc.
│   │   ├── hooks/              # useJUCEBridge, useParameters
│   │   └── themes/             # Theme system
│   └── bridge/                 # JUCE-WebView communication
├── plugins/
│   ├── synths/                 # Synthesizer plugins
│   │   ├── ModelD/
│   │   ├── DFAM/
│   │   └── ...
│   ├── effects/                # Effect plugins
│   └── midi/                   # MIDI utility plugins
├── templates/
│   ├── plugin-template/        # Plugin starter template
│   ├── synth-spec.schema.json  # Spec validation schema
│   └── dsp-libraries.json      # DSP library registry
└── docs/                       # Documentation
```

### Individual Plugin Structure

```
plugins/synths/MySynth/
├── CMakeLists.txt              # Plugin build configuration
├── synth-spec.json             # Plugin specification
├── source/
│   ├── PluginProcessor.cpp     # Main audio processor
│   ├── PluginEditor.cpp        # WebView host
│   └── dsp/                    # DSP components
│       ├── Voice.h             # Voice implementation
│       └── SynthEngine.h       # Polyphonic engine
├── ui/
│   ├── src/                    # React UI source
│   └── dist/                   # Built UI (embedded)
├── tests/                      # Unit & integration tests
├── presets/                    # Factory presets
└── docs/
    ├── ARCHITECTURE.md         # Design documentation
    └── PARAMETERS.md           # Parameter reference
```

### Build Options

```bash
# Build all plugins
cmake -B build -DBUILD_ALL=ON
cmake --build build

# Build by category
cmake -B build -DBUILD_SYNTHS=ON     # All synths
cmake -B build -DBUILD_EFFECTS=ON    # All effects
cmake -B build -DBUILD_MIDI=ON       # All MIDI plugins

# Build specific plugins
cmake -B build -DPLUGINS="ModelD;DFAM;TapeLoop"
cmake --build build
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

## JUCE 8 WebView Integration

### How React UI Communicates with JUCE

JUCE 8's WebBrowserComponent uses a specific pattern for JavaScript-to-C++ communication:

**C++ Side (PluginEditor.cpp):**
```cpp
auto options = juce::WebBrowserComponent::Options{}
    .withNativeIntegrationEnabled()
    .withNativeFunction("setParameter",
        [this](const juce::Array<juce::var>& args, auto completion) {
            juce::String paramId = args[0].toString();
            float value = static_cast<float>(args[1]);
            handleParameterFromWebView(paramId, value);
            completion({});
        });
```

**JavaScript Side - CRITICAL:**
Native functions registered with `withNativeFunction` are NOT directly on `window.__JUCE__.backend`.
They must be called via `emitEvent("__juce__invoke", ...)`:

```typescript
// CORRECT way to call native functions in JUCE 8:
window.__JUCE__?.backend?.emitEvent?.("__juce__invoke", {
  name: "setParameter",    // Function name registered in C++
  params: [paramId, value], // Arguments as array
  resultId: 0,              // For async responses (0 if not needed)
});

// WRONG - these do NOT work:
window.__JUCE__.backend.setParameter(...)  // undefined
window.setParameter(...)                    // undefined
```

### Checking Registered Functions

The list of registered native functions is available at:
```typescript
window.__JUCE__?.initialisationData?.__juce__functions
// Returns: ["noteOff", "noteOn", "requestState", "setParameter"]
```

### The useJUCEBridge Hook

The `useJUCEBridge` hook in `ui/src/hooks/useJUCEBridge.ts` handles this:

```typescript
// Helper to call native JUCE functions via emitEvent
const callNativeFunction = useCallback((name: string, params: unknown[]) => {
  if (!isConnected) return;
  window.__JUCE__?.backend?.emitEvent?.("__juce__invoke", {
    name,
    params,
    resultId: 0,
  });
}, [isConnected]);

// Send parameter to JUCE
const setParameter = useCallback((paramId: string, value: number) => {
  const clampedValue = Math.max(0, Math.min(1, value));
  callNativeFunction("setParameter", [paramId, clampedValue]);
}, [callNativeFunction]);
```

### JUCE -> React Communication

JUCE sends data to React via `evaluateJavascript`:

```cpp
// C++ sends parameter updates
juce::String script = "if (window.onParameterUpdate) window.onParameterUpdate('"
                    + paramId + "', " + juce::String(value) + ");";
webView->evaluateJavascript(script, nullptr);

// C++ sends audio data for oscilloscope
juce::String script = "if (window.onAudioData) window.onAudioData(" + json + ");";
webView->evaluateJavascript(script, nullptr);
```

React registers handlers in `useJUCEBridge`:
```typescript
window.onParameterUpdate = (paramId: string, value: number) => { ... };
window.onStateUpdate = (state: Record<string, number>) => { ... };
window.onAudioData = (samples: number[]) => { ... };
```

### CRITICAL: Resource Provider Pattern for Embedded HTML

**The ONLY reliable way to load embedded HTML in WebView is using `withResourceProvider()` callback with `getResourceProviderRoot()`.**

Other approaches that **DO NOT WORK** reliably:
- `data:text/html;base64,...` URLs (white screen on Linux WebKit)
- `resource://index.html` custom URL scheme (white screen)
- `file://` URLs (security restrictions)
- Custom origins like `http://plugin.local` (fails on Linux)

**The working pattern in PluginEditor.cpp:**

```cpp
// Build WebView options with resource provider
// URL schemes by platform:
//   Linux:   juce://juce.backend/
//   Windows: https://juce.backend/
//   macOS:   juce://juce.backend/
auto options = juce::WebBrowserComponent::Options{}
    .withNativeIntegrationEnabled()
    .withResourceProvider(
        [this](const juce::String& url) -> std::optional<juce::WebBrowserComponent::Resource>
        {
            return getResource(url);
        }
    )
    // ... native functions ...

webView = std::make_unique<juce::WebBrowserComponent>(options);
addAndMakeVisible(*webView);

// CRITICAL: Use getResourceProviderRoot(), NOT a custom URL
#ifdef HAS_UI_RESOURCES
    webView->goToURL(juce::WebBrowserComponent::getResourceProviderRoot());
#else
    webView->goToURL("http://localhost:5173");  // Dev server
#endif
```

**The getResource() implementation:**

```cpp
std::optional<juce::WebBrowserComponent::Resource> PluginEditor::getResource(const juce::String& url)
{
    DBG("Resource request: " + url);

#ifdef HAS_UI_RESOURCES
    juce::String path = url;
    auto root = juce::WebBrowserComponent::getResourceProviderRoot();
    if (path.startsWith(root))
        path = path.substring(root.length());

    if (path.isEmpty() || path == "/" || path == "index.html")
    {
        juce::WebBrowserComponent::Resource resource;
        resource.data = std::vector<std::byte>(
            reinterpret_cast<const std::byte*>(UIResources::index_html),
            reinterpret_cast<const std::byte*>(UIResources::index_html) + UIResources::index_htmlSize
        );
        resource.mimeType = "text/html";
        return resource;
    }
#else
    juce::ignoreUnused(url);
#endif
    return std::nullopt;
}
```

### CRITICAL: DOMContentLoaded in main.tsx

When using `vite-plugin-singlefile` with IIFE format, the inline script executes in `<head>` **before** the `<body>` is parsed. This means `document.getElementById('root')` returns `null` and React cannot mount.

**The fix - ALWAYS wrap React mounting in DOMContentLoaded handler:**

```tsx
// ui/src/main.tsx
const mount = () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else {
    console.error('Could not find #root element');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
```

### CRITICAL: Vite IIFE Format

The Vite config **MUST** use IIFE format, not ES modules:

```typescript
// ui/vite.config.ts
rollupOptions: {
  output: {
    format: 'iife',  // NOT 'es' - ES modules don't work inline
    inlineDynamicImports: true,
  },
},
```

### Troubleshooting WebView Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| White screen | Wrong URL scheme or resource provider | Use `getResourceProviderRoot()` |
| Black screen | CSS loads, JS doesn't execute | Add DOMContentLoaded wrapper |
| React not mounting | Script runs before `#root` exists | Add DOMContentLoaded wrapper |
| Nothing loads | `HAS_UI_RESOURCES` not defined | Check CMakeLists.txt |

## DSP Implementation Notes

### Negative Filter Envelope Amount

When implementing filter envelope modulation with a bipolar amount (positive and negative):

```cpp
float filterEnvOut = filterEnv.process();
float modCutoff;

if (filterEnvAmount >= 0.0f) {
    // Positive: envelope opens filter (sweep up from base)
    modCutoff = filterCutoff + filterEnvAmount * filterEnvOut * 10000.0f;
} else {
    // Negative: inverted - filter starts open, closes at envelope peak
    // At env=0: cutoff = base + |amt| * 10000 (bright)
    // At env=1: cutoff = base (dark)
    modCutoff = filterCutoff + std::abs(filterEnvAmount) * (1.0f - filterEnvOut) * 10000.0f;
}
```

**Why invert the envelope for negative amounts?**
- Simply subtracting would cause the filter to hit the minimum cutoff (20Hz), making everything silent
- Inverting creates the classic "reversed envelope" effect where the filter starts open and closes

### Linear Envelope Time Ranges

**IMPORTANT:** Use linear time ranges for ADSR parameters so that UI millisecond values match actual times:

```cpp
// CORRECT - linear range, UI ms values match actual times
auto timeRange = juce::NormalisableRange<float>(0.001f, 5.0f, 0.001f);

// WRONG - skew factor makes UI values misleading
auto timeRange = juce::NormalisableRange<float>(0.001f, 10.0f, 0.001f, 0.3f);
```

### Stepped Knob Options with Negative Ranges

When using `SynthKnob` with options array for ranges like octave (-2 to +2):

```typescript
// The knob's displayValue must offset by min to get correct array index
if (options && options.length > 0) {
  const index = Math.round(handleValue - min);  // Offset by min!
  return options[Math.max(0, Math.min(index, options.length - 1))];
}
```

This ensures octave values like [-2, -1, 0, 1, 2] map correctly to labels ["32'", "16'", "8'", "4'", "2'"].

### Preventing Clicks at Note Attack

Clicks at note onset come from three sources. Fix all three:

**1. Oscillator Phase Reset**
Reset oscillator phase to 0 when triggered so waveforms start at a known point:

```cpp
void trigger(float vel = 1.0f)
{
    vco1.resetPhase();  // Start at zero-crossing
    vco2.resetPhase();
    // ... trigger envelopes
}
```

**2. Exponential Envelope Attack (not linear)**
Linear attack ramps create clicks because the derivative is discontinuous at the start. Use exponential:

```cpp
// BAD - linear attack creates click
value += attackRate;

// GOOD - exponential approach (smooth start)
value += attackCoef * (1.0f - value);
```

Full exponential AD envelope:
```cpp
void updateCoefficients()
{
    float attackSamples = attackTime * sampleRate;
    attackCoef = 1.0f - std::exp(-4.0f / attackSamples);

    float decaySamples = decayTime * sampleRate;
    decayCoef = std::exp(-4.0f / decaySamples);
}

float process()
{
    switch (stage) {
        case ATTACK:
            value += attackCoef * (1.0f - value);  // Exponential rise
            if (value >= 0.999f) { value = 1.0f; stage = DECAY; }
            break;
        case DECAY:
            value *= decayCoef;  // Exponential fall
            if (value <= 0.001f) { value = 0.0f; stage = IDLE; }
            break;
    }
    return value;
}
```

**3. Anti-Click Ramp (~2ms fade-in)**
As a safety net, apply a short linear ramp at note onset:

```cpp
// In trigger():
antiClickRamp = 0.0f;
antiClickActive = true;

// In render():
if (antiClickActive) {
    antiClickRamp += 1.0f / 88.0f;  // ~2ms at 44.1kHz
    if (antiClickRamp >= 1.0f) {
        antiClickRamp = 1.0f;
        antiClickActive = false;
    }
    output *= antiClickRamp;
}
```

### Clock-Synced LFOs and Delays

For tempo-synced modulation, use musical clock dividers instead of Hz:

```cpp
// Clock divider values (musical divisions)
static const float clockDividerValues[] = {
    0.0625f,    // 1/16 (4 bars)
    0.0833333f, // 1/12 (3 bars) - triplet
    0.125f,     // 1/8 (2 bars)
    0.1666667f, // 1/6 - triplet
    0.2f,       // 1/5 - quintuplet
    0.25f,      // 1/4 (1 bar)
    0.3333333f, // 1/3 - triplet
    0.5f,       // 1/2 (half note)
    1.0f,       // 1x (quarter note)
    1.5f,       // 3/2 (dotted quarter)
    2.0f,       // 2x (8th note)
    3.0f,       // 3x (8th triplet)
    4.0f,       // 4x (16th note)
    6.0f,       // 6x (16th triplet)
    8.0f,       // 8x (32nd note)
};

// LFO rate from tempo
void setClockSyncRate(float bpm, float divider)
{
    float beatsPerSecond = bpm / 60.0f;
    float cyclesPerSecond = beatsPerSecond * divider;
    phaseIncrement = cyclesPerSecond / sampleRate;
}

// Delay time from tempo
void setClockSyncTime(float bpm, float divider)
{
    float secondsPerBeat = 60.0f / bpm;
    float syncedTime = secondsPerBeat / divider;
    delaySamples = syncedTime * sampleRate;
}
```

Use `AudioParameterChoice` for the UI:
```cpp
params.push_back(std::make_unique<juce::AudioParameterChoice>(
    juce::ParameterID{"lfo_rate", 1},
    "LFO Rate",
    juce::StringArray{"1/16", "1/12", "1/8", "1/6", "1/5", "1/4", "1/3", "1/2",
                      "1x", "3/2", "2x", "3x", "4x", "5x", "6x", "8x"},
    8  // default to 1x
));
```

### Gradual Effect Mix Curves

For effects like reverb where subtle amounts matter most, use power curves:

```cpp
void setMix(float m)
{
    float linear = std::clamp(m, 0.0f, 1.0f);
    // 4th power: 50% knob = 6.25% actual mix
    mix = linear * linear * linear * linear;
}
```

This gives much more control in the low range where you want subtle room ambience.

### Sending Sequencer State to WebView

For step sequencers, send state via timer callback:

```cpp
// In PluginEditor::timerCallback()
void sendSequencerStateToWebView()
{
    auto state = processorRef.getSequencerState();

    juce::DynamicObject::Ptr stateObj = new juce::DynamicObject();
    stateObj->setProperty("currentStep", state.currentStep);
    stateObj->setProperty("running", state.running);

    juce::String json = juce::JSON::toString(juce::var(stateObj.get()));
    juce::String script = "if (window.onSequencerState) window.onSequencerState(" + json + ");";
    webView->evaluateJavascript(script, nullptr);
}
```

React side:
```typescript
useEffect(() => {
    window.onSequencerState = (state: { currentStep: number; running: boolean }) => {
        setCurrentStep(state.currentStep);
    };
    return () => { window.onSequencerState = null; };
}, []);
```

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
2. **Add components**: Extend the Storybook library in `core/ui/components/`
3. **Update agents**: Modify agent definitions in `.claude/agents/`
4. **Add presets**: Include example presets in `presets/`

---

**Studio** - Build professional synthesizers with AI collaboration.
