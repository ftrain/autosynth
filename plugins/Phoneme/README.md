# Phoneme - Formant Synthesizer

A formant synthesizer for vocal-like sounds with vowel morphing capabilities.

## Features

- **Harmonically Rich Source**: Saw or pulse oscillator as the excitation signal
- **3 Parallel Formant Filters**: F1, F2, F3 bandpass filters for vocal formants
- **5 Vowel Presets**: A, E, I, O, U with smooth interpolation
- **Formant Shift**: Transpose all formants up/down by semitones
- **Formant Spread**: Adjust spacing between formant frequencies
- **Vibrato**: Classic pitch vibrato for natural quality
- **Vowel LFO**: Automatic morphing between vowels
- **4-Voice Polyphony**: Play chords with formant sounds

## Formant Frequencies

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) |
|-------|---------|---------|---------|
| A     | 800     | 1200    | 2500    |
| E     | 400     | 2000    | 2600    |
| I     | 300     | 2300    | 3000    |
| O     | 500     | 800     | 2300    |
| U     | 350     | 700     | 2500    |

## Parameters

### Source
- **WAVE**: Oscillator waveform (SAW / PLS)
- **TUNE**: Coarse tuning (-24 to +24 semitones)
- **PW**: Pulse width (5% to 95%)

### Formant
- **VOWEL**: Vowel selection (A / E / I / O / U)
- **SHIFT**: Formant shift (-12 to +12 semitones)
- **SPREAD**: Formant spacing (0.5x to 2.0x)

### Vibrato
- **RATE**: Vibrato speed (0.1 to 10 Hz)
- **DEPTH**: Vibrato amount (0 to 100%)

### Vowel LFO
- **RATE**: Vowel morphing speed (0.01 to 5 Hz)
- **DEPTH**: Vowel morphing amount (0 to 100%)

### Amp
- **ATTACK**: Envelope attack time (1ms to 5s)
- **DECAY**: Envelope decay time (1ms to 5s)
- **SUSTAIN**: Envelope sustain level (0 to 100%)
- **RELEASE**: Envelope release time (1ms to 5s)
- **LEVEL**: Master output level (0 to 100%)

## Building

### Prerequisites
- CMake 3.22+
- C++20 compiler
- Node.js 18+
- JUCE dependencies (GTK3, WebKit on Linux)

### Build Steps

```bash
# Build UI
cd ui
npm install
npm run build
cd ..

# Build plugin
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build

# Run tests
cd build && ctest --output-on-failure
```

### Output Locations
- VST3: `build/Phoneme_artefacts/Release/VST3/`
- AU (macOS): `build/Phoneme_artefacts/Release/AU/`
- Standalone: `build/Phoneme_artefacts/Release/Standalone/`

## Signal Flow

```
Saw/Pulse Oscillator (with vibrato)
          |
          v
    +-----+-----+
    |     |     |
    v     v     v
   F1    F2    F3   (Parallel bandpass filters)
    |     |     |
    +--+--+--+--+
          |
          v
    Formant Mix
          |
          v
    Amp Envelope
          |
          v
       Output
```

## License

Copyright 2024 Studio. All rights reserved.
