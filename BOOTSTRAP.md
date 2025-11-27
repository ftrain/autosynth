# AutoSynth Bootstrap Prompt

## Philosophy: Enlightened Laziness

**The best code is code you didn't write.**

Decades of brilliant engineers have created battle-tested DSP libraries. Mutable Instruments, Surge XT, Airwindows, Faust - these represent thousands of hours of research, optimization, and real-world testing. Our job is not to reinvent - it's to **assemble, integrate, and expose**.

Before writing a single line of DSP:
1. Search the indexed libraries
2. Read the existing implementation
3. Understand the algorithm
4. Wrap it, don't rewrite it

**GPL 3 everywhere.** We stand on the shoulders of giants and contribute back.

---

## Vision

Audio plugins that compile to:
1. **WebAssembly** + React (browser)
2. **VST3/AU** via JUCE 8 + WebView (desktop DAWs)

**One React UI for both targets.** JUCE 8's WebView renders the same React components in desktop plugins. No duplicate UI code ever.
**Use the component library.** Implement, don't invent.

---

## Architecture

```
plugins/
  MyPlugin/
    dsp/                    # Shared C++ DSP (header-only)
      Engine.h
      Voice.h
      Parameters.h
    ui/                     # React UI (serves BOTH targets)
      src/
      package.json
    juce/                   # JUCE wrapper only
      PluginProcessor.cpp   # Hosts WebView + DSP

libs/                       # Git submodules - THE TREASURE
  sst-basic-blocks/
  sst-filters/
  sst-effects/
  airwindows/
  mutable-instruments/
  faust-libraries/
  chowdsp_utils/
  surge-xt/                 # Reference implementation

storybook/                  # THE UI BIBLE
  stories/
    Knob.stories.tsx
    ADSR.stories.tsx
    Sequencer.stories.tsx
    ...every component...

core/
  ui/components/            # Shared React components
  dsp/wrappers/             # C++ wrappers for library DSP
```

---

## DSP Libraries (Index Everything)

### Primary Sources

| Library | What It Provides | License |
|---------|------------------|---------|
| **Surge XT** | Complete synth reference - oscillators, filters, effects, modulation. Study this first. | GPL3 |
| **Mutable Instruments** | Legendary Eurorack DSP - Braids, Clouds, Rings, Plaits, Warps, Elements, Tides | MIT |
| **Faust Libraries** | 500+ DSP functions exportable to C++ - filters, effects, synths, physical models | GPL |
| **Airwindows** | 300+ boutique effects - Console, Iron Oxide, Galactic, PurestDrive | MIT |
| **sst-basic-blocks** | Oscillators (DPW), envelopes, LFOs from Surge team | GPL3 |
| **sst-filters** | Filters from Surge - ladder, SVF, K35, comb, formant | GPL3 |
| **sst-effects** | Effects from Surge - delay, reverb, chorus, phaser | GPL3 |
| **ChowDSP** | Tape emulation, analog modeling, DSP utilities | GPL3 |

### Research Resources (Read Before Coding)

**Awesome Lists (study all of these):**
- **https://github.com/BillyDM/awesome-audio-dsp** - DSP learning, algorithms, papers, frameworks
- **https://github.com/olilarkin/awesome-musicdsp** - Music DSP resources, open source synths
- **https://github.com/sudara/awesome-juce** - JUCE ecosystem, plugins, tutorials
- **https://github.com/MikeMorenoDSP/awesome-synthesis** - Learning synthesis, free tools
- **https://github.com/jonmoshier/awesome-open-source-synths** - Open source synth projects
- **https://github.com/psykon/awesome-synth** - Software and hardware synth projects

**Documentation:**
- **https://faust.grame.fr/doc/libraries/** - Faust library documentation
- **https://surge-synthesizer.github.io/** - Surge architecture docs
- **https://juce.com/learn/tutorials** - Official JUCE tutorials

**Reference Synths to Study (Surge ecosystem preferred):**
- **Surge XT** - Feature-rich hybrid, gold standard (https://github.com/surge-synthesizer/surge)
- **OB-Xa** - Surge team's Oberheim emulation (https://github.com/surge-synthesizer/OB-Xd)
- **Six Sines** - BaconPaul's FM synth, Surge ecosystem (https://github.com/baconpaul/six-sines)
- **Vital** - Modern wavetable, rivals Serum (https://github.com/mtytel/vital)
- **Dexed** - DX7 emulation (https://github.com/asb2m10/dexed)
- **Odin 2** - Analog-modeled hybrid (https://github.com/TheWaveWarden/odin2)
- **Cardinal** - VCV Rack as plugin (https://github.com/DISTRHO/Cardinal)

**Books (if needed):**
- "Designing Software Synthesizer Plug-Ins in C++" - Will Pirkle
- "Designing Audio Effect Plugins in C++" - Will Pirkle

### Indexing Task

**Critical first task**: Clone all libraries, parse headers/docs, build searchable index:
```
index/
  oscillators.md      # Every oscillator in every library
  filters.md          # Every filter type available
  effects.md          # Every effect
  envelopes.md        # Every envelope generator
  modulators.md       # LFOs, random, sequencers
  utilities.md        # Math, interpolation, buffers
```

Agents query this index before implementation. "I need a ladder filter" -> index shows 5 options with tradeoffs.

---

## Faust Integration

Faust deserves special attention. It's a functional DSP language with:
- Exhaustive, well-organized standard libraries
- Export to C++ with `faust2cpp`
- Physical models, filters, effects, synths

**Workflow:**
```bash
# Write DSP in Faust (or use library)
faust -a minimal.cpp -o MyFilter.cpp filter.dsp

# Include generated C++ in Engine.h
```

Faust libraries to index:
- `filters.lib` - Every filter topology
- `oscillators.lib` - Analog/digital oscillators
- `reverbs.lib` - Algorithmic reverbs
- `delays.lib` - Delay lines
- `phaflangers.lib` - Modulation effects
- `physmodels.lib` - Physical modeling
- `vaeffects.lib` - Virtual analog effects
- `compressors.lib` - Dynamics processing

---

## Docker Builds & End-to-End Testing

**All builds happen in Docker. No exceptions.**

```bash
# Build WASM in Docker
docker compose run --rm plugin-wasm

# Build JUCE in Docker
docker compose run --rm plugin-juce

# Run full E2E test suite
docker compose run --rm e2e-tests
```

### Automated Verification (Don't Wait for Users to Report)

Every build must automatically verify:

1. **App Opens** - Standalone launches without crash
2. **UI Loads** - React interface renders in WebView
3. **Sound Produced** - Audio output is non-silent when triggered
4. **Parameters Work** - UI controls affect DSP state
5. **Presets Load** - Factory presets recall correctly

```bash
# E2E test script runs after every build
./scripts/e2e-test.sh BassStation

# Tests:
# - Launch standalone, check window opens
# - Send MIDI note, verify audio output > -60dB
# - Iterate all parameters, verify no crashes
# - Load each preset, verify state changes
```

**Headless testing with Xvfb for CI/CD.** No manual verification required.

---

## Storybook: The UI Bible

**A complete component library is provided.** Use it. Don't reinvent.

**Storybook is the single source of truth for all UI components.**

Every component exists in Storybook before it's used in any plugin. No exceptions.

### Required Components

#### Controls
- `Knob` - Rotary control with value display, multiple skins (vintage, modern, minimal)
- `Slider` - Vertical/horizontal faders, with optional notches
- `Switch` - Toggle, momentary, multi-position (2/3/4-way)
- `Button` - Trigger, toggle, radio groups, LED indicator
- `Select` - Dropdown menus, searchable
- `NumberInput` - Direct value entry with unit display

#### Visualization
- `Oscilloscope` - Waveform display, triggered/free-running
- `Spectrum` - FFT analyzer, linear/log scale
- `ADSR` - Envelope visualizer/editor with draggable points
- `LFO` - LFO waveform display with shape selection
- `XYPad` - 2D control surface with crosshairs
- `Piano` - Keyboard with velocity, note names, range selection
- `Meter` - VU, peak, RMS, stereo correlation
- `Goniometer` - Stereo phase display

#### Sequencing
- `StepSequencer` - Pitch/gate/velocity grid, variable steps
- `PatternGrid` - Drum pattern editor, multiple tracks
- `Timeline` - Arrangement view with clips
- `PianoRoll` - Note editor with velocity

#### Modulation
- `ModMatrix` - Source/destination/amount grid
- `Cable` - Modular patching visual
- `ModWheel` - Pitch/mod wheel pair

#### Layout
- `Panel` - Grouping container with label
- `Rack` - Module housing
- `Section` - Collapsible panel
- `Tab` - Tabbed interface

#### Presets
- `PresetBrowser` - Load/save/categorize/search
- `PresetSlot` - Quick access bank
- `PresetCompare` - A/B comparison

### Storybook Commands
```bash
cd storybook
npm run storybook        # Dev server at localhost:6006
npm run build-storybook  # Static export
```

**Rule**: If it's not in Storybook, it doesn't exist.

---

## JUCE 8 + WebView Architecture

JUCE 8's WebView component renders our React UI inside desktop plugins:

```cpp
class PluginEditor : public juce::AudioProcessorEditor {
    juce::WebBrowserComponent webView;

    PluginEditor(PluginProcessor& p) : AudioProcessorEditor(p) {
        webView.goToURL("http://localhost:5173"); // Dev
        // Or load bundled React app in production
        addAndMakeVisible(webView);
    }
};
```

**Communication**: WebView <-> JUCE via message passing:
- React calls `window.juce.setParameter(id, value)`
- JUCE posts parameter changes to WebView
- Bidirectional sync keeps UI and DSP in lockstep

Same React UI serves:
1. Web browser (WASM backend)
2. JUCE plugin (native DSP backend)

---

## Agents

### librarian
Indexes all DSP libraries. Maintains searchable catalog. Answers "what oscillators are available?" with specific file paths and usage examples.

### researcher
Before any implementation, searches awesome-audio-dsp, reads papers, finds reference implementations. Produces research docs with citations.

### project-coordinator
Receives requests, queries librarian/researcher, breaks into tasks, delegates to specialists.

### synth-architect
Designs signal flow by selecting from indexed library components. Never invents - only assembles.

### dsp-engineer
Wraps library DSP in Engine.h interface. Writes WASM bindings. Writes JUCE processor. Copy-pastes from references.

### ui-developer
Builds plugin UI using ONLY Storybook components. If component doesn't exist, creates it in Storybook first.

### qa-engineer
Runs E2E tests after every build: app opens, UI loads, sound produced, parameters work, presets load. Validates audio output matches between WASM and JUCE. Tests all Storybook components. **Never ships without automated verification.**

---

## Bootstrap Tasks

### Phase 1: Research & Index
1. Clone all DSP library repos as submodules
2. Parse every header file, extract DSP components
3. Build searchable index by category
4. Document API patterns for each library
5. Read awesome-audio-dsp and awesome-juce completely
6. Create "cheat sheets" for common tasks

### Phase 2: Build Infrastructure
1. Setup Docker (Emscripten for WASM)
2. Setup CMake (JUCE 8 with WebView)
3. Setup Faust toolchain (faust2cpp)
4. Create `./scripts/new-plugin.sh` template generator
5. Create `./scripts/index-libraries.sh` indexer

### Phase 3: Storybook Foundation
1. Initialize Storybook with React + TypeScript
2. Implement all core components (see complete list above)
3. Document props, variants, accessibility, theming
4. Create plugin layout templates
5. Add interaction testing

### Phase 4: Reference Plugin
1. Build simple subtractive synth using only indexed components
2. One oscillator (from library), one filter (from library), one envelope (from library)
3. Validate WASM + JUCE WebView output identical
4. Document entire process as tutorial

---

## Commands

```bash
# Research & Index
./scripts/index-libraries.sh       # Parse all libs, build index
./scripts/search-index.sh "ladder" # Find components

# Create plugin
./scripts/new-plugin.sh "Bass Station"

# Build
docker compose run --rm bass-station-wasm
cmake --build build --target BassStation_VST3

# UI Development
cd storybook && npm run storybook  # Component dev at :6006
cd plugins/BassStation/ui && npm run dev  # Plugin UI at :5173

# Faust
faust2cpp -cn MyFilter filter.dsp -o dsp/generated/MyFilter.h
```

---

## Constraints

1. **Never write DSP from scratch** - find it in a library or Faust
2. **Index before implement** - know what exists
3. **Storybook first** - no UI without stories
4. **One React UI** - serves web AND JUCE WebView
5. **GPL 3** - we give back what we take
6. **Research before code** - read the papers, study the references
7. **Copy the best** - Surge XT is the gold standard
8. **Docker everything** - builds must be reproducible
9. **E2E test everything** - verify app opens, UI loads, sound produced before shipping

---

## First Session

1. Clone repos: surge-xt, mutable-instruments, faust-libraries, airwindows, sst-*, chowdsp
2. Run indexing script - catalog every DSP component
3. Initialize Storybook with 5 core components (Knob, Slider, ADSR, Oscilloscope, Piano)
4. Build "hello sine" on both WASM and JUCE WebView
5. Verify same React UI renders in browser and plugin

Then: assemble real synths from indexed parts, never writing DSP from scratch.
