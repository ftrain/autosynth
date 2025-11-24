# Plugin Template

A complete starter template for JUCE 8 synthesizer plugins with React WebView UI.

## Features

- **JUCE 8** plugin framework (VST3, AU, Standalone)
- **SST Libraries** for professional DSP (sst-basic-blocks, sst-filters, sst-effects)
- **React** WebView frontend with TypeScript
- **Catch2** unit testing
- **GitHub Actions** CI/CD

## Quick Start

### 1. Create Your Plugin

```bash
# Copy the template
cp -r templates/plugin-template my-synth
cd my-synth

# Rename the plugin (use the helper script)
./scripts/new-plugin.sh "FM Drone" "FMDrone" "FmDr"
```

### 2. Initialize Submodules

```bash
git init
git submodule add https://github.com/juce-framework/JUCE.git JUCE
git submodule add https://github.com/surge-synthesizer/sst-basic-blocks.git libs/sst/sst-basic-blocks
git submodule add https://github.com/surge-synthesizer/sst-filters.git libs/sst/sst-filters
git submodule add https://github.com/surge-synthesizer/sst-effects.git libs/sst/sst-effects
git submodule add https://github.com/surge-synthesizer/sst-waveshapers.git libs/sst/sst-waveshapers
git submodule update --init --recursive
```

### 3. Build the UI

```bash
cd ui
npm install
npm run build
cd ..
```

### 4. Build the Plugin

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

### 5. Run Tests

```bash
ctest --test-dir build -C Release --output-on-failure
```

## Project Structure

```
my-synth/
├── CMakeLists.txt              # Build configuration
├── JUCE/                       # JUCE framework (submodule)
├── libs/sst/                   # SST DSP libraries (submodules)
├── source/
│   ├── PluginProcessor.h/cpp   # Main audio processor
│   ├── PluginEditor.h/cpp      # WebView editor
│   └── dsp/
│       ├── Voice.h             # Single voice implementation
│       └── SynthEngine.h       # Polyphonic engine
├── ui/
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   └── hooks/              # JUCE bridge hooks
│   └── package.json
├── tests/
│   └── CMakeLists.txt          # Test configuration
├── presets/                    # Factory presets
├── .github/workflows/          # CI/CD
└── README.md
```

## Development Workflow

### DSP Development

1. Edit voice architecture in `source/dsp/Voice.h`
2. Use SST library components (see `docs/SST_LIBRARIES_INDEX.md`)
3. Add parameters in `PluginProcessor.cpp`
4. Write tests in `tests/`

### UI Development

1. Start the dev server: `cd ui && npm run dev`
2. Edit `ui/src/App.tsx`
3. Use components from the shared library
4. Build for embedding: `npm run build`

### Adding Parameters

1. Add to `PluginProcessor::createParameterLayout()` in C++
2. Add to `PARAMETER_DEFINITIONS` in `ui/src/types/parameters.ts`
3. Use in React via `useParameters` hook

## SST Libraries Reference

| Library | Purpose | Header |
|---------|---------|--------|
| sst-basic-blocks | Oscillators, envelopes, LFOs | `sst/basic-blocks/...` |
| sst-filters | Ladder, SVF, comb filters | `sst/filters/...` |
| sst-effects | Reverb, delay, chorus | `sst/effects/...` |
| sst-waveshapers | Distortion, saturation | `sst/waveshapers/...` |

See `docs/SST_LIBRARIES_INDEX.md` for complete API reference.

## Component Library

The UI uses components from the shared Storybook library:

| Component | Purpose |
|-----------|---------|
| `SynthKnob` | Rotary parameter control |
| `SynthSlider` | Linear fader |
| `SynthADSR` | Envelope editor |
| `SynthLFO` | LFO with waveform |
| `Oscilloscope` | Audio visualization |

Run `npm run storybook` to browse components.

## Testing

```bash
# Build and run tests
cmake --build build --target FMDrone_Tests
ctest --test-dir build -C Release -V

# Run specific test
./build/tests/FMDrone_Tests "[voice]"
```

## CI/CD

The GitHub Actions workflow:
1. Builds on Linux, macOS, and Windows
2. Runs unit tests
3. Validates with pluginval
4. Uploads artifacts

## Documentation

- `docs/LLM_SYNTH_PROGRAMMING_GUIDE.md` - Complete DSP reference
- `docs/SST_LIBRARIES_INDEX.md` - SST component catalog
- `docs/TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md` - UI development

## License

[Your License Here]

---

Built with the Studio collaborative synth system.
