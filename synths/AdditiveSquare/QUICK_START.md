# Additive Square - Quick Start

## Build in 3 Commands

```bash
# 1. Build WASM (from /home/user/autosynth/synths/AdditiveSquare)
make wasm

# 2. Start dev server
cd ui && npm run dev

# 3. Open browser
# Navigate to http://localhost:5173
```

## What You Get

A web synthesizer with:
- 8 square wave harmonics (1x-8x fundamental)
- Moog-style ladder filter
- 2 ADSR envelopes
- Web MIDI support
- 8-voice polyphony

## First Sounds

### 1. Start the Synth
- Click orange "Start Synth" button
- Connect MIDI keyboard (or use virtual MIDI)

### 2. Try These Presets

**Metallic Bell:**
- Partials: Mix of all 8 at varying levels
- Amp Attack: 5ms, Decay: 300ms, Sustain: 10%

**Hollow Organ:**
- Partials: Only 1x, 3x, 5x, 7x at 100%
- Filter Cutoff: 30%, Resonance: 0%

**Evolving Pad:**
- Partials: All at 50%
- Filter Env Amount: +80%
- Filter Attack: 1000ms, Decay: 2000ms
- Amp Attack: 500ms

## Controls Overview

### Partials Row
8 knobs (1x through 8x) - Level of each harmonic

### Filter Row
- CUTOFF: Filter frequency (20Hz-20kHz)
- RES: Filter resonance/emphasis
- ENV AMT: How much envelope affects filter

### Filter Envelope
Visual ADSR editor - Modulates filter cutoff

### Amp Envelope
Visual ADSR editor - Controls note volume over time

### Master
Volume control

## Troubleshooting

**No sound?**
- Check master volume knob
- Check browser audio isn't muted
- Try clicking "Start Synth" again

**WASM error?**
- Run `make wasm` first
- Check `ui/public/synth.wasm` exists

**MIDI not working?**
- Use Chrome or Edge
- Firefox: Enable Web MIDI in about:config
- Safari: Not supported

## Need More Info?

- **Complete guide:** `README.md`
- **Build help:** `BUILD_GUIDE.md`
- **Architecture:** `ARCHITECTURE.md`
- **Full summary:** `PROJECT_SUMMARY.md`

---

Have fun!
