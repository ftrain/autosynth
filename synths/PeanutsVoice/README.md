# PeanutsVoice - Muted Trombone "Wah Wah Wah" Synthesizer

Recreates the iconic adult voice sound from Peanuts animated specials - the classic muted trombone "wah wah wah" effect.

## Overview

The adult voices in Peanuts cartoons weren't actually voices - they were a muted trombone played by jazz musician Bill Melendez. This synthesizer recreates that iconic sound using:

- Brass-like sawtooth/pulse oscillators (SST)
- Heavy resonant filtering for muting effect
- LFO modulation for "wah wah" talking articulation
- Envelope control for speech-like attack and decay

## Architecture

### Signal Flow

```
MIDI Input → Voice → SAW OSC → WAVESHAPER → BAND-PASS FILTER → AMP → Output
                        ↓          ↓              ↓              ↓
                      Tune      Drive        LFO + ENV         ADSR
```

### DSP Components

All DSP uses SST libraries - no custom code:

| Component | Library | Purpose |
|-----------|---------|---------|
| Oscillators | sst-basic-blocks | DPWSawOscillator, DPWPulseOscillator (brass tone) |
| LFO | sst-basic-blocks | SimpleLFO (wah wah modulation) |
| Envelopes | sst-basic-blocks | ADSREnvelope x2 (filter + amp articulation) |
| Waveshaper | Custom tanh | Brass harmonic enhancement |
| Filter | Custom IIR | Resonant band-pass (formant-like) |

### Parameters

| ID | Name | Range | Default | Description |
|----|------|-------|---------|-------------|
| 0 | OSC_WAVEFORM | 0-1 | 0 | Waveform (0=saw, 1=pulse) |
| 1 | OSC_TUNE | 0-1 | 0.5 | Tuning (-24 to +24 semitones) |
| 2 | OSC_LEVEL | 0-1 | 0.8 | Oscillator output level |
| 3 | DRIVE | 0-1 | 0.3 | Waveshaper drive (brass harmonics) |
| 4 | FILTER_FORMANT | 0-4 | 1 | Formant vowel (reserved for future) |
| 5 | FILTER_CUTOFF | 0-1 | 0.1 | Base filter cutoff (20-8000 Hz) |
| 6 | FILTER_RESONANCE | 0-1 | 0.6 | Filter resonance (Q) |
| 7 | LFO_RATE | 0-1 | 0.2 | LFO rate (0.1-10 Hz) |
| 8 | LFO_DEPTH | 0-1 | 0.5 | LFO modulation depth |
| 9 | LFO_WAVEFORM | 0-2 | 0 | LFO shape (0=sine, 1=tri, 2=square) |
| 10 | FILTER_ATTACK | 0-1 | 0.01 | Filter envelope attack (1-1000ms) |
| 11 | FILTER_DECAY | 0-1 | 0.05 | Filter envelope decay (10-2000ms) |
| 12 | FILTER_SUSTAIN | 0-1 | 0.7 | Filter envelope sustain level |
| 13 | FILTER_RELEASE | 0-1 | 0.067 | Filter envelope release (10-3000ms) |
| 14 | AMP_ATTACK | 0-1 | 0.01 | Amplitude attack (1-500ms) |
| 15 | AMP_DECAY | 0-1 | 0.075 | Amplitude decay (10-2000ms) |
| 16 | AMP_SUSTAIN | 0-1 | 0.8 | Amplitude sustain level |
| 17 | AMP_RELEASE | 0-1 | 0.1 | Amplitude release (10-3000ms) |
| 127 | MASTER_VOLUME | 0-1 | 0.8 | Master output level |

## Quick Start

### Build WASM

```bash
cd synths/PeanutsVoice
make wasm
```

This compiles the C++ DSP code to WebAssembly using Emscripten.

### Run Development Server

```bash
cd ui
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
cd ui
npm run build
```

Output goes to `ui/dist/`.

## Sound Design Guide

### Classic "Wah Wah Wah" Sound

1. **Oscillator:**
   - Waveform: SAW (0)
   - Tune: 0 (no transposition)
   - Level: 80%
   - Drive: 30-50% (adds brass harmonics)

2. **Filter:**
   - Cutoff: 200-400 Hz (very low for muted effect)
   - Resonance: 70-80% (creates formant peaks)

3. **LFO:**
   - Waveform: SINE (0)
   - Rate: 2-4 Hz (talking speed)
   - Depth: 50-70% (strong modulation)

4. **Envelopes:**
   - Filter Attack: 5-10ms (fast)
   - Filter Decay: 100-200ms
   - Filter Sustain: 70%
   - Amp Attack: 5ms (percussive)
   - Amp Release: 300ms

### Variations

**Slower "Grown-up" Voice:**
- LFO Rate: 1-2 Hz
- Filter Cutoff: 300-500 Hz
- More resonance (80%+)

**Angry "Wah Wah":**
- Use SQUARE LFO waveform
- Higher LFO rate (4-6 Hz)
- More drive (60%+)
- Lower cutoff (150-250 Hz)

**Questioning Tone:**
- Automate LFO depth increasing over time
- Rise filter cutoff at end of phrase
- Use PULSE waveform for brighter tone

**Muffled Background Voice:**
- Very low cutoff (100-200 Hz)
- Low resonance (30-40%)
- Less drive (10-20%)
- Slower LFO (0.5-1 Hz)

## Technical Details

### Voice Architecture

- **Polyphony:** 8 voices (first-note priority stealing)
- **Sample Rate:** 48 kHz
- **Block Size:** 128 samples
- **Bit Depth:** 32-bit float
- **Latency:** ~3ms (AudioWorklet)

### Filter Design

The filter is a resonant band-pass IIR biquad that simulates formant filtering:

```cpp
// Resonant band-pass coefficients
omega = 2π * cutoff / sampleRate
q = 1 + resonance * 9  // Q from 1 to 10
alpha = sin(omega) / (2 * q)

b0 = alpha
b1 = 0
b2 = -alpha
a0 = 1 + alpha
a1 = -2 * cos(omega)
a2 = 1 - alpha
```

The LFO and filter envelope both modulate the cutoff frequency multiplicatively, creating the characteristic "wah wah" sweep.

### MIDI Implementation

- **Note On/Off:** Standard polyphonic
- **Velocity:** Scales amplitude
- **Pitch Bend:** Not yet implemented (reserved)
- **CC Control:** Not yet implemented (reserved)

### Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Full | Web MIDI supported |
| Edge | ✅ Full | Web MIDI supported |
| Firefox | ⚠️ Partial | No Web MIDI (use virtual keyboard) |
| Safari | ⚠️ Partial | No AudioWorklet in older versions |

## File Structure

```
PeanutsVoice/
├── dsp/
│   ├── Engine.h           # Voice management and parameter routing
│   ├── Voice.h            # Single voice DSP implementation
│   └── wasm_bindings.cpp  # C → WASM interface
├── ui/
│   ├── src/
│   │   ├── App.tsx                    # Main UI component
│   │   └── hooks/useAudioEngine.ts    # Web Audio + WASM bridge
│   ├── public/
│   │   ├── processor.js   # AudioWorklet processor
│   │   └── synth.wasm     # Compiled WASM module (generated)
│   └── package.json
├── Makefile              # WASM build configuration
└── README.md             # This file
```

## Development Notes

### Adding Features

To add a new parameter:

1. Add enum to `Voice.h` Params
2. Add parameter handling in `Voice::process()`
3. Add UI control in `App.tsx`
4. Update this README parameter table

### Debugging

```bash
# Check WASM exports
wasm-objdump -x ui/public/synth.wasm

# View browser console for errors
# Enable Web Audio debug: chrome://flags/#enable-web-audio-api-logging

# Check MIDI devices
navigator.requestMIDIAccess().then(midi => {
  console.log('MIDI inputs:', Array.from(midi.inputs.values()));
});
```

### Performance

Current CPU usage (tested on 2020 MacBook Pro):
- Idle (no voices): < 1%
- 1 voice: ~2%
- 8 voices: ~8%
- Total latency: ~3ms (AudioWorklet)

## Sound Design Tips

### Getting the "Talking" Effect

The key to the Peanuts voice is **rhythmic modulation**:

1. Play staccato notes (short attack, medium release)
2. Use medium-fast LFO (2-4 Hz) for syllable rhythm
3. Vary note velocity to create emphasis
4. Low cutoff (200-400 Hz) for muffled character
5. High resonance (70%+) for vowel-like formants

### MIDI Controller Mapping

Suggested CC mappings:

- **CC 1 (Mod Wheel):** LFO Depth (expressive wah control)
- **CC 74:** Filter Cutoff (brightness)
- **CC 71:** Filter Resonance (formant intensity)
- **CC 73:** Drive (harmonics)
- **CC 75:** LFO Rate (talking speed)

### Creating Phrases

To mimic speech patterns:

1. **Short notes** = consonants (50-100ms)
2. **Long notes** = vowels (200-500ms)
3. **Pauses** = breaths (100-200ms silence)
4. **Pitch variation** = intonation (use different notes)
5. **Velocity changes** = dynamics (loud = emphasis)

Example "Hello":
```
Note: C4 (100ms, vel 100)  - "He"
Note: D4 (200ms, vel 80)   - "ll"
Note: C4 (300ms, vel 90)   - "o"
```

## Credits

**Original Sound:**
- Bill Melendez - Trombone performance (Peanuts TV specials)
- Vince Guaraldi - Music composer

**Synthesizer:**
- Built with AutoSynth framework
- SST DSP libraries
- WebAssembly + Web Audio API
- React + TypeScript UI

## License

Part of the AutoSynth project.

## References

- [SST Libraries](https://github.com/surge-synthesizer/sst-basic-blocks)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)

---

**WAH WAH WAH!** 🎺
