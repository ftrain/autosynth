# 🎹 Faust WASM Test Environment

A rapid prototyping environment for DSP algorithms using Faust, WebAssembly, and React.

## Features

- **Instant Feedback Loop**: Edit Faust DSP code → Compile → Reload → Hear changes
- **Web Audio API Integration**: Real-time audio processing via AudioWorklet
- **React UI**: Interactive controls for parameter manipulation
- **Hot Module Replacement**: Fast iteration with Vite's HMR
- **Cross-Origin Headers**: Properly configured for SharedArrayBuffer support

## Quick Start

### Prerequisites

1. **Faust Compiler**: Install from [faust.grame.fr](https://faust.grame.fr/)
   ```bash
   # macOS
   brew install faust

   # Linux
   sudo apt-get install faust

   # Or download from https://github.com/grame-cncm/faust/releases
   ```

2. **Node.js**: Version 18 or higher

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile the example Faust DSP:
   ```bash
   cd dsp
   ./build.sh
   cd ..
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown (typically `http://localhost:5173`)

5. Click "Start" to begin audio playback

## Project Structure

```
wasm-test-env/
├── dsp/
│   ├── simple-synth.dsp       # Faust DSP source code
│   └── build.sh                # Compilation script
├── public/
│   └── dsp/                    # Compiled WASM files (generated)
│       ├── simple-synth.wasm
│       └── simple-synth-processor.js
├── src/
│   ├── hooks/
│   │   └── useFaustDSP.ts      # React hook for managing DSP
│   ├── types/
│   │   └── faust.d.ts          # TypeScript types for Faust
│   ├── App.tsx                 # Main UI component
│   └── App.css                 # Styles
├── vite.config.ts              # Vite config with WASM support
└── package.json
```

## Workflow

### 1. Edit DSP Code

Edit `dsp/simple-synth.dsp`:

```faust
import("stdfaust.lib");

// Add your DSP code here
freq = hslider("frequency", 440, 20, 5000, 1);
process = os.osc(freq) * 0.5 <: _, _;
```

### 2. Compile to WebAssembly

```bash
cd dsp
./build.sh
```

This generates:
- `public/dsp/simple-synth.wasm` - The WebAssembly module
- `public/dsp/simple-synth-processor.js` - AudioWorklet processor

### 3. Reload Browser

The Vite dev server will hot-reload the UI. Click "Stop" then "Start" to reload the audio engine.

### 4. Test Your DSP

Use the UI controls to manipulate parameters in real-time.

## Faust DSP Examples

### Basic Oscillator with Filter

```faust
import("stdfaust.lib");

freq = hslider("frequency[unit:Hz]", 440, 20, 5000, 1);
cutoff = hslider("cutoff[unit:Hz]", 2000, 20, 20000, 1);
resonance = hslider("resonance", 1, 1, 20, 0.1);

process = os.sawtooth(freq)
        : fi.lowpass(2, cutoff)
        * 0.5 <: _, _;
```

### Multiple Oscillators with Mixer

```faust
import("stdfaust.lib");

freq = hslider("frequency", 440, 20, 5000, 1);
mix = hslider("mix", 0.5, 0, 1, 0.01);

osc1 = os.osc(freq);
osc2 = os.sawtooth(freq);

process = (osc1 * (1 - mix) + osc2 * mix) * 0.5 <: _, _;
```

### FM Synthesis

```faust
import("stdfaust.lib");

carrier = hslider("carrier", 440, 20, 5000, 1);
modulator = hslider("modulator", 220, 20, 5000, 1);
modIndex = hslider("modIndex", 1, 0, 100, 0.1);

process = os.osc(carrier + os.osc(modulator) * modIndex) * 0.5 <: _, _;
```

## Using the React Hook

The `useFaustDSP` hook manages audio context and DSP loading:

```tsx
import { useFaustDSP } from './hooks/useFaustDSP';

function MyComponent() {
  const { isReady, isPlaying, error, start, stop, setParam } = useFaustDSP({
    processorUrl: '/dsp/simple-synth-processor.js',
    autoStart: false,
  });

  return (
    <div>
      <button onClick={isPlaying ? stop : start}>
        {isPlaying ? 'Stop' : 'Start'}
      </button>
      <input
        type="range"
        min="20"
        max="5000"
        onChange={(e) => setParam('frequency', Number(e.target.value))}
      />
    </div>
  );
}
```

## Technical Details

### Vite Configuration

The `vite.config.ts` includes:

```typescript
{
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  assetsInclude: ['**/*.wasm'],
}
```

These headers are **required** for SharedArrayBuffer support in AudioWorklet.

### Faust Compilation

The `faust2wasm` compiler generates:

1. **WebAssembly Module** (`.wasm`): Compiled DSP code
2. **AudioWorklet Processor** (`.js`): Web Audio API integration

The processor:
- Instantiates the WASM module
- Exposes parameter setters/getters
- Processes audio in real-time on the audio thread

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support (v79+)
- **Safari**: Partial support (requires enabling SharedArrayBuffer)

## Troubleshooting

### "Failed to load processor"

1. Ensure you ran `./dsp/build.sh`
2. Check that files exist in `public/dsp/`
3. Verify the processor URL matches the generated filename

### "SharedArrayBuffer is not defined"

This means the COOP/COEP headers aren't set correctly. The Vite config should handle this automatically for the dev server.

For production, ensure your server sets:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### No audio output

1. Check browser console for errors
2. Ensure you clicked "Start" (browsers require user interaction to start audio)
3. Check system volume and browser audio permissions

### Faust compiler not found

```bash
# Install Faust
# macOS:
brew install faust

# Linux:
sudo apt-get install faust

# Or download from:
# https://github.com/grame-cncm/faust/releases
```

## Advanced Usage

### Custom Parameters

Faust UI elements automatically become controllable parameters:

```faust
// Horizontal slider
freq = hslider("frequency[unit:Hz]", 440, 20, 5000, 1);

// Vertical slider
gain = vslider("gain[unit:dB]", 0, -60, 12, 0.1);

// Button
gate = button("gate");

// Checkbox
bypass = checkbox("bypass");

// Numerical entry
octave = nentry("octave", 0, -2, 2, 1);
```

Access them in React:

```tsx
setParam('frequency', 880);  // Path is the label
setParam('gain', -6);
```

### Multiple DSP Modules

Load different Faust programs dynamically:

```tsx
const [currentDSP, setCurrentDSP] = useState('simple-synth');

const { /* ... */ } = useFaustDSP({
  processorUrl: `/dsp/${currentDSP}-processor.js`,
});

// Switching DSP requires reinitialization
<select onChange={(e) => setCurrentDSP(e.target.value)}>
  <option value="simple-synth">Simple Synth</option>
  <option value="fm-synth">FM Synth</option>
</select>
```

## Resources

- [Faust Documentation](https://faustdoc.grame.fr/)
- [Faust Libraries](https://faustlibraries.grame.fr/)
- [Faust Online IDE](https://faustide.grame.fr/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)

## License

This test environment is part of the Studio synthesizer development system.

---

**Happy prototyping!** 🎵
