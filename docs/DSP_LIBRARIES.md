# DSP Libraries Reference

**AutoSynth DSP Library Index**
**Version**: 1.0
**Last Updated**: November 2025

---

## Overview

AutoSynth uses three primary DSP library families:
1. **SST** (Surge Synth Team) - Oscillators, filters, envelopes, effects
2. **Airwindows** - High-end effects and processing
3. **ChowDSP** - Tape emulation and analog modeling

**Rule: Never write custom DSP. Always use these libraries.**

---

## SST Libraries

### sst-basic-blocks

**Purpose:** Fundamental DSP building blocks
**Location:** `libs/sst-basic-blocks/include/sst/basic-blocks/dsp/`

#### Oscillators

| Component | Use For | Example |
|-----------|---------|---------|
| `DPWSawOscillator` | Band-limited sawtooth | Bass, leads, pads |
| `DPWPulseOscillator` | Band-limited pulse/square | Aggressive sounds |
| `SineOscillator` | Clean sine wave | Sub bass, FM carrier |

**Usage:**
```cpp
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"

sst::basic_blocks::dsp::DPWSawOscillator saw;
saw.init(sampleRate);
saw.setFrequency(440.0f);
float sample = saw.process();
```

#### Envelopes

| Component | Use For |
|-----------|---------|
| `ADSREnvelope` | Amp, filter, pitch envelopes |

**Usage:**
```cpp
#include "sst/basic-blocks/modulators/ADSREnvelope.h"

sst::basic_blocks::modulators::ADSREnvelope env;
env.setAttack(0.01f);    // 10ms
env.setDecay(0.1f);      // 100ms
env.setSustain(0.7f);    // 70%
env.setRelease(0.2f);    // 200ms

env.trigger();
float level = env.process(sampleRate);
```

#### LFOs

| Component | Use For |
|-----------|---------|
| `LFO` | Vibrato, tremolo, filter modulation |

**Usage:**
```cpp
#include "sst/basic-blocks/modulators/LFO.h"

sst::basic_blocks::modulators::LFO lfo;
lfo.setRate(2.0f);  // 2 Hz
float value = lfo.process();  // -1 to +1
```

---

### sst-filters

**Purpose:** High-quality filter implementations
**Location:** `libs/sst-filters/include/sst/filters/`

#### Filter Types

| Component | Character | Use For |
|-----------|-----------|---------|
| `VintageLadder` | Moog-style 24dB/oct | Bass, classic synth sounds |
| `CytomicSVF` | Clean state variable | Precise filtering, modern synths |
| `DiodeLadder` | TB-303 style | Acid bass, squelchy sounds |
| `Comb` | Resonant comb | Physical modeling, special FX |

**VintageLadder Usage:**
```cpp
#include "sst/filters/VintageLadder.h"

sst::filters::VintageLadder filter;
filter.init(sampleRate);
filter.setCutoff(1000.0f);  // Hz
filter.setResonance(0.7f);  // 0-1

float output = filter.process(input);
```

**CytomicSVF Usage:**
```cpp
#include "sst/filters/CytomicSVF.h"

sst::filters::CytomicSVF filter;
filter.setCoeff(
    sst::filters::CytomicSVF::LP,  // Lowpass
    1000.0f,                        // Cutoff (Hz)
    0.7f,                           // Resonance
    sampleRate
);
float output = filter.process(input);
```

---

### sst-effects

**Purpose:** Effect processors
**Location:** `libs/sst-effects/include/sst/effects/`

#### Available Effects

| Effect | Use For |
|--------|---------|
| `Delay` | Echo, doubling, rhythmic delays |
| `Chorus` | Thickness, detuning, movement |
| `Phaser` | Sweeping, psychedelic effects |
| `Flanger` | Metallic, jet-plane effects |

**Delay Usage:**
```cpp
#include "sst/effects/Delay.h"

sst::effects::Delay delay;
delay.setSampleRate(48000);
delay.setDelayTime(0.5f);     // 500ms
delay.setFeedback(0.5f);      // 50%
delay.setMix(0.3f);           // 30% wet

delay.process(inputL, inputR, outputL, outputR, numSamples);
```

---

## Airwindows

**Purpose:** High-end effects and processing
**Location:** `libs/airwin2rack/`

### Key Components

| Component | Use For | Character |
|-----------|---------|-----------|
| `Galactic3` | Reverb | Huge, lush, algorithmic spaces |
| `ToTape6` | Tape saturation | Vintage tape warmth, compression |
| `Density` | Saturation | Analog warmth, thickness |
| `Tube2` | Tube distortion | Valve amp character |

**Galactic3 Usage:**
```cpp
#include "airwin2rack/Galactic3.h"

Galactic3 reverb;
reverb.setSampleRate(48000);

// Parameters (0-1 range)
reverb.setParameter(0, 0.5);  // Replace
reverb.setParameter(1, 0.5);  // Brightness
reverb.setParameter(2, 0.2);  // Detune
reverb.setParameter(3, 0.5);  // Bigness
reverb.setParameter(4, 0.5);  // Size

// Process audio
reverb.processReplacing(inL, inR, outL, outR, numSamples);
```

**ToTape6 Usage:**
```cpp
#include "airwin2rack/ToTape6.h"

ToTape6 tape;
tape.setSampleRate(48000);
tape.setParameter(0, 0.5);  // Input Trim
tape.setParameter(1, 0.5);  // Soften
tape.setParameter(2, 0.5);  // Head Bump
tape.setParameter(3, 0.5);  // Flutter

tape.processReplacing(inL, inR, outL, outR, numSamples);
```

---

## ChowDSP

**Purpose:** Tape emulation and analog modeling
**Location:** `libs/chowdsp_utils/`

### TapeModel

**Use For:** Authentic tape character - saturation, wow/flutter, noise

**Usage:**
```cpp
#include "chowdsp_utils/TapeModel.h"

chowdsp::TapeModel tape;
tape.prepare(sampleRate);

// Controls
tape.setDrive(0.5f);      // 0-1, saturation amount
tape.setWow(0.1f);        // 0-1, slow pitch modulation
tape.setFlutter(0.1f);    // 0-1, fast pitch modulation
tape.setNoise(0.2f);      // 0-1, tape hiss

// Process
float output = tape.processSample(input);
```

---

## Selection Guide

### "I need an oscillator"
→ **SST sst-basic-blocks**
- Sawtooth: `DPWSawOscillator`
- Pulse/Square: `DPWPulseOscillator`
- Sine: `SineOscillator`

### "I need a filter"
→ **SST sst-filters**
- Moog-style: `VintageLadder`
- Clean/modern: `CytomicSVF`
- TB-303 style: `DiodeLadder`

### "I need reverb"
→ **Airwindows Galactic3**
- Huge, lush spaces
- Perfect for pads, ambients

### "I need tape emulation"
→ **ChowDSP TapeModel**
- Authentic analog tape character
- Saturation + wow/flutter + noise

### "I need delay/chorus"
→ **SST sst-effects**
- Clean, modern effects
- Good for classic synth sounds

---

## Integration Patterns

### Basic Voice Architecture

```cpp
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"
#include "sst/filters/VintageLadder.h"
#include "sst/basic-blocks/modulators/ADSREnvelope.h"

struct Voice {
    // Oscillator
    sst::basic_blocks::dsp::DPWSawOscillator osc;

    // Filter
    sst::filters::VintageLadder filter;

    // Envelopes
    sst::basic_blocks::modulators::ADSREnvelope filterEnv;
    sst::basic_blocks::modulators::ADSREnvelope ampEnv;

    void init(float sr) {
        osc.init(sr);
        filter.init(sr);
    }

    float process(float baseCutoff, float sampleRate) {
        // Generate oscillator
        float sample = osc.process();

        // Apply filter with envelope
        float envValue = filterEnv.process(sampleRate);
        float cutoff = baseCutoff * (1.0f + envValue);
        filter.setCutoff(cutoff);
        sample = filter.process(sample);

        // Apply amp envelope
        float amp = ampEnv.process(sampleRate);
        return sample * amp;
    }

    void noteOn(int note, float velocity) {
        float freq = 440.0f * pow(2.0f, (note - 69) / 12.0f);
        osc.setFrequency(freq);
        filterEnv.trigger();
        ampEnv.trigger();
    }
};
```

### Master Effects Chain

```cpp
#include "sst/effects/Delay.h"
#include "airwin2rack/Galactic3.h"
#include "chowdsp_utils/TapeModel.h"

class MasterFX {
    sst::effects::Delay delay;
    Galactic3 reverb;
    chowdsp::TapeModel tape;

public:
    void init(float sr) {
        delay.setSampleRate(sr);
        reverb.setSampleRate(sr);
        tape.prepare(sr);
    }

    void process(float* L, float* R, int samples) {
        // Delay
        delay.process(L, R, L, R, samples);

        // Reverb
        reverb.processReplacing(L, R, L, R, samples);

        // Tape (per sample)
        for (int i = 0; i < samples; i++) {
            L[i] = tape.processSample(L[i]);
            R[i] = tape.processSample(R[i]);
        }
    }
};
```

---

## Performance Notes

### SST Libraries
- **Optimized:** SIMD support (SSE2/AVX)
- **Real-time safe:** No allocations
- **Low latency:** < 1ms typical

### Airwindows
- **CPU usage:** Moderate (Galactic3 is heavier)
- **Quality:** Excellent
- **Real-time safe:** Yes

### ChowDSP
- **CPU usage:** Light to moderate
- **Quality:** Excellent analog modeling
- **Real-time safe:** Yes

---

## Library Versions

| Library | Version | Source |
|---------|---------|--------|
| sst-basic-blocks | Latest | https://github.com/surge-synthesizer/sst-basic-blocks |
| sst-filters | Latest | https://github.com/surge-synthesizer/sst-filters |
| sst-effects | Latest | https://github.com/surge-synthesizer/sst-effects |
| airwin2rack | Latest | https://github.com/baconpaul/airwin2rack |
| chowdsp_utils | Latest | https://github.com/Chowdhury-DSP/chowdsp_utils |

---

## Quick Reference

**Need a...?**
- Oscillator → SST sst-basic-blocks
- Filter → SST sst-filters
- Envelope → SST sst-basic-blocks
- Delay/Chorus → SST sst-effects
- Reverb → Airwindows Galactic3
- Tape → ChowDSP TapeModel

**Remember:** Never write custom DSP. These libraries are professional-grade and battle-tested.
