# Additive Square - Build Guide

Complete step-by-step instructions for building and running the Additive Square synthesizer.

## Prerequisites Check

Before building, verify you have the required tools:

### Option 1: Docker (Recommended)

```bash
docker --version
# Should show Docker version 20.10+
```

If Docker is not installed:
- **Linux:** https://docs.docker.com/engine/install/
- **macOS:** https://docs.docker.com/desktop/mac/install/
- **Windows:** https://docs.docker.com/desktop/windows/install/

### Option 2: Local Build (Advanced)

```bash
# Check Emscripten
emcc --version
# Should show version 3.1.51 or higher

# Check Node.js
node --version
# Should show version 20+

# Check npm
npm --version
# Should show version 9+
```

If Emscripten is not installed:
```bash
# Clone Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install latest
./emsdk install latest
./emsdk activate latest

# Activate for current shell
source ./emsdk_env.sh
```

## Build Process

### Step 1: Clone or Navigate to Project

```bash
cd /path/to/autosynth/synths/AdditiveSquare
```

### Step 2: Build WASM Module

#### Using Docker

```bash
# From AutoSynth root directory
docker build -t autosynth .

# The Docker build automatically compiles all WASM modules
# including AdditiveSquare
```

#### Using Local Emscripten

```bash
# From synths/AdditiveSquare directory
make wasm
```

Expected output:
```
Building WASM module...
✓ WASM built: ui/public/synth.js
  Size: ~1.2M
```

This creates:
- `ui/public/synth.js` - JavaScript WASM loader (includes glue code)
- `ui/public/synth.wasm` - Compiled C++ DSP engine

### Step 3: Install UI Dependencies

```bash
cd ui
npm install
```

This installs:
- React 18
- Vite (dev server and build tool)
- TypeScript
- Shared component dependencies

### Step 4: Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v4.4.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser

Navigate to: http://localhost:5173

**Important:** Use Chrome or Edge for full Web MIDI support.

## Verifying the Build

### Check WASM Files Exist

```bash
ls -lh ui/public/synth.*
```

Should show:
```
-rw-r--r-- 1 user user 300K synth.js
-rw-r--r-- 1 user user 1.2M synth.wasm
```

### Check Dev Server is Running

```bash
curl http://localhost:5173
```

Should return HTML content (not an error).

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - "WASM module loaded"
   - No red errors
4. Go to Network tab
5. Verify `synth.wasm` loaded successfully (200 status)

## Testing the Synthesizer

### 1. Initialize Audio

Click the orange "Start Synth" button.

Expected behavior:
- Button disappears
- UI appears with knobs and envelopes
- Console shows: "AudioContext started"

### 2. Test MIDI (if available)

Connect a MIDI keyboard and play a note.

Expected behavior:
- Sound is produced
- Polyphonic (up to 8 notes simultaneously)

If no MIDI keyboard:
- Use virtual MIDI software (e.g., LoopBE, IAC Driver)
- Or use computer keyboard as fallback

### 3. Test Parameters

Try adjusting:

**Partials:**
- Turn down 1x, 2x, 3x, 4x (lower harmonics)
- Turn up 5x, 6x, 7x, 8x (higher harmonics)
- Sound should become brighter and more metallic

**Filter:**
- Lower cutoff → sound becomes darker
- Increase resonance → adds emphasis at cutoff frequency
- Adjust ENV AMT → filter sweeps with note envelope

**Envelopes:**
- Increase filter attack → slow filter opening
- Decrease amp attack → percussive sound

### 4. Sound Design Tests

**Test 1: Organ Sound**
- Set 1x, 3x, 5x, 7x to 100%
- Set 2x, 4x, 6x, 8x to 0%
- Filter cutoff: 30%
- Filter res: 0%
- Result: Hollow organ tone

**Test 2: Bell Sound**
- Set all partials to varying levels (1x=100%, 2x=50%, 3x=80%, etc.)
- Amp attack: 5ms
- Amp decay: 300ms
- Amp sustain: 10%
- Result: Metallic bell

**Test 3: Pad Sound**
- Set all partials to 50%
- Filter cutoff: 60%
- Filter env amt: +80%
- Filter attack: 1000ms
- Amp attack: 500ms
- Result: Evolving pad

## Troubleshooting

### "emcc: command not found"

Emscripten is not installed or not activated.

Solution:
```bash
# If you installed emsdk
cd /path/to/emsdk
source ./emsdk_env.sh

# Then rebuild
cd /path/to/autosynth/synths/AdditiveSquare
make wasm
```

Or use Docker instead.

### "Cannot find module 'react'"

UI dependencies not installed.

Solution:
```bash
cd ui
rm -rf node_modules package-lock.json
npm install
```

### WASM module fails to load

Check browser console for specific error.

Common causes:
1. **CORS issue** - Must serve from http://localhost, not file://
2. **WASM not built** - Run `make wasm` first
3. **Wrong path** - Verify `ui/public/synth.wasm` exists

Solution:
```bash
# Rebuild WASM
make clean
make wasm

# Restart dev server
cd ui
npm run dev
```

### No sound when playing notes

1. Check audio context state:
   - Open console
   - Type: `window.audioContext.state`
   - Should be "running", not "suspended"

2. Check master volume:
   - Ensure Master > Volume knob is not at zero

3. Check browser audio:
   - Try playing a YouTube video
   - Check system volume
   - Check browser isn't muted

4. Check WASM initialization:
   - Console should show "Engine initialized at 48000Hz"

### High CPU usage

The synth runs 64 oscillators (8 partials × 8 voices).

Solutions:
- Reduce polyphony (modify MAX_VOICES in Engine.h)
- Lower number of partials (modify NUM_PARTIALS in Voice.h)
- Use release build: `make wasm` (not `make dev`)

### MIDI not detected

**Chrome/Edge:**
Should work automatically. Check:
- MIDI device is connected
- Device is powered on
- Browser has MIDI permissions

**Firefox:**
1. Navigate to `about:config`
2. Search for `dom.webmidi.enabled`
3. Set to `true`
4. Restart browser

**Safari:**
Web MIDI is not supported. Use virtual on-screen keyboard instead.

## Production Build

For deployment:

```bash
# Build WASM (optimized)
make wasm

# Build UI (optimized)
cd ui
npm run build
```

Output goes to `ui/dist/`:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── synth.wasm
```

Serve with any static file server:

```bash
cd ui/dist
python3 -m http.server 8080
```

Or deploy to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting

## Docker Build

To build everything with Docker:

```bash
# From AutoSynth root
docker build -t autosynth .

# Run
docker run -p 8080:80 autosynth

# Open http://localhost:8080
```

The Dockerfile:
1. Compiles all synths' WASM modules with Emscripten
2. Builds all React UIs
3. Serves everything via Nginx

## Performance Profiling

### Browser Performance Tools

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Play some notes
5. Stop recording
6. Look for:
   - AudioWorklet callback time (should be < 2ms)
   - No long tasks blocking main thread

### WASM Profiling

Build with debug symbols:

```bash
make dev
```

Then use Chrome's WASM profiler:
1. DevTools → Performance → Settings
2. Enable "WASM profiling"
3. Record performance
4. View WASM function call times

## Development Workflow

Typical development cycle:

```bash
# 1. Edit DSP code
vim dsp/Voice.h

# 2. Rebuild WASM
make wasm

# 3. Reload browser
# Dev server auto-reloads on file changes

# 4. Edit UI
vim ui/src/App.tsx

# 5. Browser auto-reloads (Vite HMR)
```

## Next Steps

- **Customize DSP:** Edit `dsp/Voice.h` to modify sound
- **Add parameters:** Update `Engine.h` and `App.tsx`
- **Add presets:** Create preset system in React
- **Optimize:** Profile and reduce CPU usage
- **Deploy:** Build for production and host online

## Resources

- **SST Documentation:** https://surge-synth-team.org/
- **Emscripten Docs:** https://emscripten.org/docs/
- **Web Audio API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Web MIDI API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API

---

Happy synthesizing!
