# The Complete LLM Synthesizer Programming Guide

## A Senior DSP Architect's Manual for Building Professional Synthesizers

**Using Surge XT, SST Libraries, Airwindows, ChowDSP, and JUCE 8**

---

# TABLE OF CONTENTS

## Part I: From Idea to Architecture
1. [Synth Ideation Framework](#1-synth-ideation-framework)
2. [Voice Architecture Design](#2-voice-architecture-design)
3. [Filter Architecture Design](#3-filter-architecture-design)
4. [Effects Chain Design](#4-effects-chain-design)
5. [Modulation System Design](#5-modulation-system-design)
6. [Architecture Documentation Template](#6-architecture-documentation-template)

## Part II: The Open Source Ecosystem
7. [SST Library Reference](#7-sst-library-reference)
8. [Airwindows Effects Catalog](#8-airwindows-effects-catalog)
9. [ChowDSP Components](#9-chowdsp-components)
10. [External DSP Resources](#10-external-dsp-resources)

## Part III: Implementation with JUCE 8
11. [Minimal VST Structure](#11-minimal-vst-structure)
12. [DSP Integration Patterns](#12-dsp-integration-patterns)
13. [Parameter System Design](#13-parameter-system-design)
14. [Real-Time Audio Best Practices](#14-real-time-audio-best-practices)

## Part IV: Testing and Validation
15. [Testing Methodology](#15-testing-methodology)
16. [Signal Flow Verification](#16-signal-flow-verification)
17. [CI/CD Pipeline](#17-cicd-pipeline)

## Part V: UI Handoff
18. [React Component Interface Specification](#18-react-component-interface-specification)

## Part VI: Team Structure
19. [The Synth Building Team](#19-the-synth-building-team)

---

# PART I: FROM IDEA TO ARCHITECTURE

---

## 1. Synth Ideation Framework

### 1.1 Starting Points

Every synthesizer begins with one of these:

| Starting Point | Example | Approach |
|----------------|---------|----------|
| **Sound Goal** | "Warm analog bass" | Work backwards from timbre |
| **Existing Synth** | "Moog Model D clone" | Analyze signal flow, replicate |
| **Novel Concept** | "Granular FM hybrid" | Prototype DSP, iterate |
| **Use Case** | "Live performance pads" | Design for workflow |

### 1.2 The Five Questions

Before writing any code, answer:

1. **VOICE**: How many simultaneous notes? Mono/poly/paraphonic?
2. **GENERATION**: What creates the initial sound? (Oscillators, samples, noise, input)
3. **FILTERING**: How is the spectrum shaped? (Subtractive, formant, comb)
4. **MODULATION**: What moves over time? (Envelopes, LFOs, sequencers)
5. **EFFECTS**: What spatial/timbral processing? (Reverb, delay, saturation)

### 1.3 Reference Synth Analysis Template

When cloning an existing synthesizer:

```
SYNTH: [Name]
YEAR: [Release year]
TYPE: [Analog/Digital/Hybrid]

OSCILLATOR SECTION:
- Count: [e.g., 3 VCOs]
- Types: [Saw, Pulse, Triangle, Sine]
- Features: [Sync, FM, PWM, Sub-osc]
- Tuning: [Coarse, Fine, Octave]

FILTER SECTION:
- Topology: [Ladder, SVF, Diode, etc.]
- Poles: [12dB, 24dB, etc.]
- Modes: [LP, HP, BP, Notch]
- Features: [Self-oscillation, drive, tracking]

MODULATION:
- Envelopes: [Count, type - ADSR/AD/AR]
- LFOs: [Count, shapes, sync]
- Routing: [Hardwired vs matrix]

EFFECTS:
- Built-in: [Chorus, delay, reverb, etc.]

UNIQUE CHARACTERISTICS:
- [What makes this synth special]
```

### 1.4 Sound Character Mapping

Map desired sound qualities to DSP choices:

| Sound Quality | DSP Implementation |
|---------------|-------------------|
| Warm | Soft saturation, subtle filtering |
| Aggressive | Hard clipping, resonance, FM |
| Glassy | FM, additive, high-frequency content |
| Organic | Physical modeling, noise, drift |
| Vintage | Analog-modeled filters, instability |
| Modern | Wavetables, clean digital |
| Thick | Unison, detuning, layering |
| Evolving | Complex modulation, MSEG, randomness |

---

## 2. Voice Architecture Design

### 2.1 Voice Count Decision Tree

```
Need polyphony?
├── NO → Mono voice (lead, bass)
│   └── Need legato?
│       ├── YES → Mono with portamento
│       └── NO → Mono with retrigger
└── YES → How many notes?
    ├── 4-8 → Paraphonic (shared filter)
    ├── 8-16 → Standard poly
    └── 32-64 → Full poly (Surge: 64 voices)
```

### 2.2 Voice State Categories

Design your voice with clear state boundaries:

```
┌─────────────────────────────────────────────────────┐
│ GLOBAL STATE (shared by all voices)                 │
│ - Sample rate, block size                           │
│ - Wavetables, samples                               │
│ - Global LFOs (scene-level)                         │
│ - Effects chain                                     │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│ PER-VOICE STATE (one instance per active note)      │
│ - Oscillator phase                                  │
│ - Filter state (coefficients, delays)              │
│ - Envelope state (stage, level)                    │
│ - Voice LFO state                                   │
│ - Note number, velocity                             │
└─────────────────────────────────────────────────────┘
```

### 2.3 Surge Voice Architecture Reference

Surge uses a 64-voice pool with this structure:

```cpp
// Per-voice components (from SurgeVoice.h)
struct SurgeVoice {
    // Oscillators (3 per voice)
    Oscillator* osc[n_oscs];           // Polymorphic oscillator slots

    // Filters (2 per voice)
    FilterState filterState[2];         // Dual filter state

    // Modulators
    ADSRModulationSource ampEG;         // Amplitude envelope
    ADSRModulationSource filterEG;      // Filter envelope
    LFOModulationSource voiceLFO[6];    // Per-voice LFOs

    // Voice state
    int note;                           // MIDI note number
    float velocity;                     // Note velocity
    float portaSrcPitch, portaDstPitch; // Portamento
    int age;                            // For voice stealing
};
```

### 2.4 Voice Stealing Strategies

| Strategy | Algorithm | Best For |
|----------|-----------|----------|
| **Oldest** | Steal voice with highest age | Sustained pads |
| **Quietest** | Steal voice with lowest amplitude | Dynamic playing |
| **Lowest** | Steal lowest pitch | Bass priority |
| **Release-First** | Prefer voices in release phase | Most musical |

Surge implementation (recommended):
```
1. First, try to steal a voice in release phase
2. If none releasing, steal oldest playing voice
3. Apply fast "uber-release" fade (5-10ms)
```

---

## 3. Filter Architecture Design

### 3.1 Filter Topology Selection

| Topology | Character | Use Case | SST Implementation |
|----------|-----------|----------|-------------------|
| **Moog Ladder** | Warm, round, loses bass at resonance | Classic analog | `sst::filters::LadderFilter` |
| **Oberheim SEM** | Open, airy, 12dB | Vintage poly | `sst::filters::OBXDFilter` |
| **State Variable** | Versatile, clean | General purpose | `sst::filters::CytomicSVF` |
| **Diode Ladder** | Aggressive, gritty | TB-303 style | `sst::filters::DiodeLadder` |
| **Comb** | Metallic, resonant | Karplus-Strong | `sst::filters::CombFilter` |
| **K35** | Korg-style, punchy | Aggressive bass | `sst::filters::K35Filter` |

### 3.2 Filter Routing Configurations

```
SERIAL:
Osc → Filter1 → Filter2 → Amp
Best for: Progressive filtering, vowel sounds

PARALLEL:
      ┌→ Filter1 ─┐
Osc ──┤           ├──Mix──→ Amp
      └→ Filter2 ─┘
Best for: Complex timbres, filter blending

SPLIT (Surge default):
Scene A: Osc1,2 → Filter1,2 → Amp
Scene B: Osc1,2 → Filter1,2 → Amp
Best for: Layered sounds, splits
```

### 3.3 Filter Parameter Ranges

Standard ranges for filter parameters:

| Parameter | Range | Unit | Notes |
|-----------|-------|------|-------|
| Cutoff | 20-20000 | Hz | Exponential scaling |
| Resonance | 0-100 | % | 100% = self-oscillation |
| Drive | 0-24 | dB | Pre-filter saturation |
| Keytrack | -100 to +100 | % | 100% = 1:1 tracking |
| Env Depth | -100 to +100 | % | Bipolar modulation |

### 3.4 Available Filters in SST-Filters

Complete list from `sst-filters` library:

```
LOWPASS:
- LP 12/24 (Classic, SVF, Ladder)
- Vintage Ladder (Moog-style)
- K35 LP
- Diode Ladder
- OB-Xd LP
- Cutoff Warp LP

HIGHPASS:
- HP 12/24 (Classic, SVF)
- K35 HP
- Cutoff Warp HP

BANDPASS:
- BP 12/24
- SVF BP
- Morph BP

NOTCH:
- Notch 12/24
- SVF Notch

SPECIAL:
- Comb (+ / -)
- Sample & Hold
- Allpass
- Formant (Vowel)
- Ring Modulator
```

---

## 4. Effects Chain Design

### 4.1 Standard Effects Chain Order

```
Voice Output
    │
    ▼
┌─────────────┐
│ PRE-FX      │ ← EQ, Filter, Compression
└─────────────┘
    │
    ▼
┌─────────────┐
│ DISTORTION  │ ← Saturation, Waveshaping, Bitcrush
└─────────────┘
    │
    ▼
┌─────────────┐
│ MODULATION  │ ← Chorus, Flanger, Phaser
└─────────────┘
    │
    ▼
┌─────────────┐
│ DELAY       │ ← Delay, Echo, Ping-Pong
└─────────────┘
    │
    ▼
┌─────────────┐
│ REVERB      │ ← Room, Hall, Plate, Spring
└─────────────┘
    │
    ▼
┌─────────────┐
│ POST-FX     │ ← Limiter, Final EQ
└─────────────┘
    │
    ▼
  Output
```

### 4.2 Effects Selection by Category

**From Airwindows (70+ effects):**

| Category | Recommended | Character |
|----------|-------------|-----------|
| Saturation | Density, Drive, Tube | Warm, analog-like |
| Compression | Pressure4, Dynamics | Transparent to punchy |
| Reverb | Verbity, MatrixVerb | Lush, algorithmic |
| Delay | Chorus, ADClip | Clean to lo-fi |
| Lo-Fi | Bitcrush, DeRez | Retro, 8-bit |
| Stereo | Wider, StereoDouble | Width, space |

**From ChowDSP (5 effects):**

| Effect | Use Case | CPU |
|--------|----------|-----|
| CHOW | Soft clipping | Low |
| Tape | Analog tape warmth | Medium |
| Spring Reverb | Vintage spring sound | Medium |
| Exciter | High-frequency enhancement | Low |
| Neuron | Neural network distortion | High |

**From SST-Effects:**

| Effect | Description |
|--------|-------------|
| Reverb1, Reverb2 | Algorithmic reverbs |
| Delay | Tempo-synced delay |
| Chorus | Classic chorus |
| Flanger | Through-zero flanger |
| Phaser | Multi-stage phaser |
| Rotary | Leslie simulation |
| Distortion | Waveshaping |
| Conditioner | Dynamics |
| Frequency Shifter | Pitch effects |
| Vocoder | Voice synthesis |
| Nimbus | Granular reverb |
| Resonator | Modal resonance |

### 4.3 Surge Effect Slot Configuration

Surge provides 16 effect slots:

```
Scene A: 4 insert slots (A1, A2, A3, A4)
Scene B: 4 insert slots (B1, B2, B3, B4)
Send Effects: 2 slots (Send 1, Send 2)
Global: 4 slots (Global 1-4)
Master: 2 slots (Master 1, Master 2)
```

---

## 5. Modulation System Design

### 5.1 Modulation Source Categories

| Category | Sources | Per-Voice? | Rate |
|----------|---------|------------|------|
| **Envelopes** | ADSR, DAHDSR, MSEG | Yes | Audio/Control |
| **LFOs** | Sine, Tri, Saw, S&H, etc. | Both | Control |
| **MIDI** | Velocity, Aftertouch, MW | Yes | Event |
| **Macros** | User knobs | No | Control |
| **Random** | Noise, S&H | Yes | Control |
| **Sequencer** | Step sequencer | No | Tempo-synced |

### 5.2 Essential Modulation Routing

Minimum viable modulation matrix:

```
SOURCES:              DESTINATIONS:
├─ Amp Envelope ──────→ Amplitude (hardwired)
├─ Filter Envelope ───→ Filter Cutoff
├─ LFO 1 ─────────────→ Pitch (vibrato)
├─ LFO 2 ─────────────→ Filter Cutoff
├─ Mod Wheel ─────────→ LFO Depth / Filter
├─ Velocity ──────────→ Amplitude / Filter
└─ Aftertouch ────────→ Vibrato / Filter
```

### 5.3 Surge Modulation Sources (40+)

```cpp
enum modsources {
    // MIDI sources
    ms_velocity, ms_releasevelocity, ms_keytrack,
    ms_polyaftertouch, ms_aftertouch, ms_pitchbend,
    ms_modwheel, ms_breath, ms_expression, ms_sustain,
    ms_timbre, ms_lowest_key, ms_highest_key, ms_latest_key,

    // LFOs (12 total)
    ms_lfo1, ms_lfo2, ms_lfo3, ms_lfo4, ms_lfo5, ms_lfo6,    // Voice
    ms_slfo1, ms_slfo2, ms_slfo3, ms_slfo4, ms_slfo5, ms_slfo6, // Scene

    // Envelopes
    ms_ampeg, ms_filtereg,

    // Macros (8 user-assignable)
    ms_ctrl1 through ms_ctrl8,

    // Random
    ms_random_bipolar, ms_random_unipolar,
    ms_alternate_bipolar, ms_alternate_unipolar,
};
```

### 5.4 LFO Shapes Available

From Surge's LFO implementation:

| Shape | Description | Use Case |
|-------|-------------|----------|
| Sine | Smooth, pure | Vibrato, tremolo |
| Triangle | Linear, symmetric | Filter sweeps |
| Square | On/off switching | Gating, trills |
| Sawtooth | Ramp up/down | Filter opens |
| Noise | Random smooth | Organic movement |
| Sample & Hold | Stepped random | Glitchy modulation |
| Envelope | One-shot DAHDSR | Complex shapes |
| Step Seq | 16-step pattern | Rhythmic patterns |
| MSEG | Multi-segment | Custom envelopes |
| Formula | Lua scripted | Anything |

---

## 6. Architecture Documentation Template

Use this template to document your synth design for team review:

```markdown
# [SYNTH NAME] Architecture Document

## 1. Overview
- **Type**: [Subtractive/FM/Wavetable/Hybrid]
- **Voices**: [Count, Mono/Poly]
- **Target Use**: [Bass/Lead/Pad/FX]

## 2. Signal Flow Diagram
[ASCII diagram of complete signal path]

## 3. Voice Architecture

### 3.1 Oscillators
| Osc | Type | Features |
|-----|------|----------|
| 1 | | |
| 2 | | |
| 3 | | |

### 3.2 Filters
| Filter | Type | Modes | Position |
|--------|------|-------|----------|
| 1 | | | |
| 2 | | | |

### 3.3 Amplifier
- VCA type:
- Saturation:

## 4. Modulation

### 4.1 Envelopes
| Env | Type | Hardwired To |
|-----|------|--------------|
| Amp | | Amplitude |
| Filter | | Cutoff |

### 4.2 LFOs
| LFO | Shapes | Rate Range | Default Routing |
|-----|--------|------------|-----------------|
| 1 | | | |
| 2 | | | |

### 4.3 Modulation Matrix
| Source | Destination | Depth Range |
|--------|-------------|-------------|
| | | |

## 5. Effects

### 5.1 Insert Effects
| Slot | Effect Type | Purpose |
|------|-------------|---------|
| 1 | | |
| 2 | | |

### 5.2 Send Effects
| Send | Effect | Mix Range |
|------|--------|-----------|
| 1 | | |
| 2 | | |

## 6. Parameters

### 6.1 Complete Parameter List
[Table with all parameters, ranges, defaults, units]

### 6.2 MIDI CC Mapping
[Default CC assignments]

## 7. Implementation Notes

### 7.1 DSP Libraries Used
- [ ] sst-filters: [which filters]
- [ ] sst-effects: [which effects]
- [ ] Airwindows: [which effects]
- [ ] ChowDSP: [which components]

### 7.2 Performance Targets
- Max voices at 44.1kHz:
- Max CPU per voice:
- Latency budget:

## 8. Testing Checklist
- [ ] All parameters respond correctly
- [ ] No denormals
- [ ] No clicks on note on/off
- [ ] Voice stealing works
- [ ] State save/load works
- [ ] Automation works
```

---

# PART II: THE OPEN SOURCE ECOSYSTEM

---

## 7. SST Library Reference

### 7.1 Library Dependency Hierarchy

```
Your Plugin
    │
    ├── sst-jucegui (GUI components)
    │
    ├── sst-plugininfra (platform abstraction)
    │
    └── sst-effects
            │
            ├── sst-filters
            │       │
            │       └── sst-waveshapers
            │               │
            │               └── sst-basic-blocks
            │                       │
            │                       └── sst-cpputils
            │
            └── sst-voicemanager (optional)
```

### 7.2 sst-basic-blocks

**Location**: `libs/sst/sst-basic-blocks`
**Purpose**: Foundational DSP building blocks

| Component | Header | Description |
|-----------|--------|-------------|
| BlockInterpolators | `dsp/BlockInterpolators.h` | lipol_ps, lipol_sse for parameter smoothing |
| FastMath | `dsp/FastMath.h` | Fast sin, cos, tanh, exp approximations |
| QuadratureOscillators | `dsp/QuadratureOscillators.h` | Sine/cosine pairs |
| LanczosResampler | `dsp/LanczosResampler.h` | High-quality resampling |
| CorrelatedNoise | `dsp/CorrelatedNoise.h` | Noise with spectral shaping |

**Usage Example**:
```cpp
#include "sst/basic-blocks/dsp/BlockInterpolators.h"

sst::basic_blocks::dsp::lipol_sse cutoffSmooth;
cutoffSmooth.set_target(newCutoff);
cutoffSmooth.process_block(cutoffBuffer, BLOCK_SIZE);
```

### 7.3 sst-filters

**Location**: `libs/sst/sst-filters`
**Purpose**: All Surge filter implementations as header-only templates

| Filter Family | Types | Files |
|---------------|-------|-------|
| Vintage Ladder | LP 6/12/18/24 | `VintageLadder.h` |
| OB-Xd | LP/HP/BP/Notch | `OBXDFilter.h` |
| K35 | LP/HP (Korg-style) | `K35Filter.h` |
| Diode Ladder | LP 24dB | `DiodeLadder.h` |
| Cytomic SVF | LP/HP/BP/Notch/Peak/All | `CytomicSVF.h` |
| Comb | +/- feedback | `CombFilters.h` |
| Sample & Hold | Noise gate | `SampleAndHold.h` |

**Usage Example**:
```cpp
#include "sst/filters/VintageLadder.h"

sst::filters::VintageLadder<SurgeStorage, BLOCK_SIZE> filter;
filter.init();
filter.setCoefficients(cutoffHz, resonance, sampleRate);
filter.process(inputBuffer, outputBuffer, BLOCK_SIZE);
```

### 7.4 sst-waveshapers

**Location**: `libs/sst/sst-waveshapers`
**Purpose**: Distortion and waveshaping algorithms

| Waveshaper | Character |
|------------|-----------|
| Soft | Gentle saturation |
| Hard | Aggressive clipping |
| Asymmetric | Even harmonics |
| Sine | Wavefolder |
| Digital | Bitcrushing |
| Rectify | Half/full-wave |
| Fuzz | Aggressive distortion |

### 7.5 sst-effects

**Location**: `libs/sst/sst-effects`
**Purpose**: Complete effect processors

| Effect | Description | CPU |
|--------|-------------|-----|
| Delay | Tempo-synced, filtered | Low |
| Reverb1 | Simple reverb | Low |
| Reverb2 | Complex reverb | Medium |
| Flanger | Through-zero capable | Low |
| Phaser | Multi-stage | Low |
| Chorus | Stereo chorus | Low |
| Rotary | Leslie simulation | Medium |
| Distortion | Multi-mode | Low |
| EQ | Parametric 3-band | Low |
| Conditioner | Dynamics | Low |
| Freq Shifter | Pitch shifting | Medium |
| Vocoder | 20-band | High |
| Resonator | Modal | Medium |
| Combulator | Comb filter bank | Medium |
| Nimbus | Granular | High |

---

## 8. Airwindows Effects Catalog

### 8.1 Quick Selection Guide

**By Use Case**:

| Need | Use | Parameters |
|------|-----|-----------|
| Warm saturation | Density | Density, Output |
| Tape warmth | ToTape6 | Louder, Softer, Fatter, Flutter |
| Subtle compression | Pressure4 | Pressure, Speed, Mewiness, Output |
| Big reverb | Verbity | Wetness, Size, Darkness |
| Vintage vibe | Console6 | Drive |
| Lo-fi | DeRez | Rate, Rez, Hard, Wet |

**By CPU Cost**:

| CPU | Effects |
|-----|---------|
| Very Low | YBandpass, ZBandpass, SlewOnly, Gatelope |
| Low | Density, Drive, Tube, Console6, Pressure4 |
| Medium | Chorus, Vibrato, ToTape6, Verbity |
| Medium-High | MatrixVerb, Chamber, Infinity |
| High | Glitch Shifter |

### 8.2 Saturation/Drive Effects

| Effect | Parameters | Character |
|--------|------------|-----------|
| **Density** | Density, Out | Smooth, tubey saturation |
| **Drive** | Drive, Out | Amp-like breakup |
| **Tube** | Input, Out | Tube warmth |
| **Console6** | Drive | Console channel strip |
| **Spiral** | Spiral, Out | Phase-shifting saturation |
| **Loud** | Boost, Out | Loudness maximizer |

### 8.3 Reverb Effects

| Effect | Parameters | Character |
|--------|------------|-----------|
| **Verbity** | Wetness, Size, Darkness | General purpose |
| **MatrixVerb** | Wetness, Size, Darkness, Regen | Complex, modulated |
| **Chamber** | Wetness, Size, Darkness | Natural room |
| **Infinity** | Wetness, Size, Darkness | Infinite sustain |
| **Spring** | Wetness, Size, Darkness | Spring tank |

### 8.4 Complete Integration Pattern

```cpp
// Airwindows effect integration in Surge
#include "effects/airwindows/AirWindowsEffect.h"

// Effect selection via parameter
int effectIndex = getParameter(kAirwindowsEffectType);
AirWindowsEffect* effect = createAirwindowsEffect(effectIndex);

// Process block
effect->processReplacing(inputs, outputs, sampleFrames);
```

---

## 9. ChowDSP Components

### 9.1 Main Effects

| Effect | Purpose | Key Parameters |
|--------|---------|----------------|
| **CHOW** | Soft clipper | Threshold, Ratio, Makeup |
| **Tape** | Tape emulation | Bias, Saturation, Drive, Flutter |
| **Spring Reverb** | Spring simulation | Size, Decay, Damping, Shake |
| **Exciter** | Harmonic exciter | Drive, Saturation, Blend |
| **Neuron** | Neural distortion | Chaos, Width, Complexity |

### 9.2 DSP Utilities

| Component | Header | Use Case |
|-----------|--------|----------|
| DelayLine | `chowdsp_DelayLine.h` | Fractional delay with interpolation |
| SVF | `StateVariableFilter.h` | High-quality multi-mode filter |
| Oversampling | `Oversampling.h` | 2x/4x/8x oversampling |
| SmoothedValue | `SmoothedValue.h` | Parameter smoothing |
| IIR Filter | `chowdsp_IIRFilter.h` | Biquad implementation |
| FIR Filter | `FIRFilter.h` | FIR processing |

### 9.3 Tape Effect Architecture

```
Input
  │
  ▼
┌─────────────────┐
│ Hysteresis      │ ← Magnetic saturation (4 solver modes)
│ (HysteresisProc)│
└─────────────────┘
  │
  ▼
┌─────────────────┐
│ Tone Control    │ ← Input/output shelving EQ
└─────────────────┘
  │
  ▼
┌─────────────────┐
│ Loss Filter     │ ← High-frequency rolloff (head bump)
└─────────────────┘
  │
  ▼
┌─────────────────┐
│ Degrade         │ ← Bit reduction, noise
└─────────────────┘
  │
  ▼
┌─────────────────┐
│ Chew            │ ← Dropout artifacts
└─────────────────┘
  │
  ▼
Output
```

---

## 10. External DSP Resources

### 10.1 Essential Reading

| Resource | Author | Topic |
|----------|--------|-------|
| The Art of VA Filter Design | Vadim Zavalishin | Zero-delay feedback filters |
| Designing Software Synthesizer Plugins | Will Pirkle | Complete synth development |
| Physical Audio Signal Processing | Julius O. Smith | Physical modeling, waveguides |
| Introduction to Digital Filters | Julius O. Smith | Filter theory |

### 10.2 Algorithm References

**Oscillators**:
- PolyBLEP: `https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/`
- Wavetables: `https://www.earlevel.com/main/category/digital-audio/oscillators/wavetable-oscillators/`
- BLIT/BLEP: `https://ccrma.stanford.edu/~stilti/papers/blit.pdf`

**Filters**:
- Cytomic SVF: `https://cytomic.com/technical-papers/`
- Moog Ladder: `https://www.musicdsp.org/en/latest/Filters/24-moog-vcf.html`

**Physical Modeling**:
- Karplus-Strong: `https://ccrma.stanford.edu/~jos/pasp/Karplus_Strong_Algorithm.html`
- Modal Synthesis: `https://nathan.ho.name/posts/exploring-modal-synthesis/`

### 10.3 Open Source Synths to Study

| Synth | Focus Area | License |
|-------|------------|---------|
| **Surge XT** | Hybrid, modular | GPL-3.0 |
| **Vital** | Wavetable, GPU UI | GPL-3.0 |
| **Dexed** | FM (DX7 clone) | GPL-3.0 |
| **OB-Xd** | Oberheim emulation | GPL-3.0 |
| **Odin 2** | Semi-modular | GPL-3.0 |

---

# PART III: IMPLEMENTATION WITH JUCE 8

---

## 11. Minimal VST Structure

### 11.1 Project Structure

```
my-synth/
├── CMakeLists.txt
├── JUCE/                    # Submodule
├── libs/
│   └── sst/                 # SST libraries
│       ├── sst-basic-blocks/
│       ├── sst-filters/
│       └── sst-effects/
├── source/
│   ├── PluginProcessor.h
│   ├── PluginProcessor.cpp
│   ├── PluginEditor.h       # Minimal for headless testing
│   ├── PluginEditor.cpp
│   └── dsp/
│       ├── Voice.h
│       ├── Oscillator.h
│       ├── Filter.h
│       └── Effects.h
└── tests/
    ├── OscillatorTests.cpp
    ├── FilterTests.cpp
    └── IntegrationTests.cpp
```

### 11.2 CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.22)
project(MySynth VERSION 1.0.0)

set(CMAKE_CXX_STANDARD 17)

# JUCE
add_subdirectory(JUCE)

# SST Libraries (header-only)
add_library(sst-libraries INTERFACE)
target_include_directories(sst-libraries INTERFACE
    ${CMAKE_SOURCE_DIR}/libs/sst/sst-basic-blocks/include
    ${CMAKE_SOURCE_DIR}/libs/sst/sst-filters/include
    ${CMAKE_SOURCE_DIR}/libs/sst/sst-effects/include
)

# Plugin
juce_add_plugin(MySynth
    VERSION 1.0.0
    COMPANY_NAME "MyCompany"
    PLUGIN_MANUFACTURER_CODE Myco
    PLUGIN_CODE Msyn
    FORMATS VST3 AU Standalone
    PRODUCT_NAME "My Synth"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
)

target_sources(MySynth PRIVATE
    source/PluginProcessor.cpp
    source/PluginEditor.cpp
)

target_link_libraries(MySynth
    PRIVATE
        sst-libraries
        juce::juce_audio_utils
        juce::juce_dsp
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
)

# Tests
enable_testing()
add_subdirectory(libs/Catch2)

add_executable(Tests
    tests/OscillatorTests.cpp
    tests/FilterTests.cpp
)

target_link_libraries(Tests PRIVATE
    Catch2::Catch2WithMain
    sst-libraries
)

include(CTest)
include(Catch)
catch_discover_tests(Tests)
```

### 11.3 Minimal PluginProcessor

```cpp
#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/Voice.h"

class MySynthProcessor : public juce::AudioProcessor
{
public:
    MySynthProcessor();
    ~MySynthProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    void getStateInformation(juce::MemoryBlock&) override;
    void setStateInformation(const void*, int) override;

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    juce::AudioProcessorValueTreeState apvts;

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParams();

    // Voice pool
    static constexpr int MAX_VOICES = 16;
    std::array<Voice, MAX_VOICES> voices;

    // Cached parameters
    std::atomic<float>* oscTypeParam = nullptr;
    std::atomic<float>* filterCutoffParam = nullptr;
    std::atomic<float>* filterResoParam = nullptr;

    double currentSampleRate = 44100.0;

    void handleMidiEvent(const juce::MidiMessage& msg);
    Voice* findFreeVoice();
    Voice* findVoiceForNote(int note);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(MySynthProcessor)
};
```

---

## 12. DSP Integration Patterns

### 12.1 Voice Class with SST Filters

```cpp
#pragma once
#include "sst/filters/VintageLadder.h"
#include "sst/basic-blocks/dsp/BlockInterpolators.h"

class Voice {
public:
    static constexpr int BLOCK_SIZE = 32;

    void noteOn(int note, float velocity);
    void noteOff();
    void render(float* outputL, float* outputR, int numSamples);
    bool isActive() const { return active; }
    int getNote() const { return currentNote; }

    void setSampleRate(double sr);
    void setFilterCutoff(float cutoff);
    void setFilterResonance(float reso);

private:
    bool active = false;
    int currentNote = 0;
    float noteVelocity = 0.0f;

    // Oscillator state
    float phase = 0.0f;
    float phaseIncrement = 0.0f;

    // Filter (from sst-filters)
    sst::filters::VintageLadder<MySynthStorage, BLOCK_SIZE> filter;

    // Parameter smoothing
    sst::basic_blocks::dsp::lipol_sse cutoffSmooth;
    sst::basic_blocks::dsp::lipol_sse resonanceSmooth;

    // Envelope
    enum class EnvStage { Attack, Decay, Sustain, Release, Idle };
    EnvStage envStage = EnvStage::Idle;
    float envLevel = 0.0f;
    float attackRate = 0.001f;
    float decayRate = 0.0001f;
    float sustainLevel = 0.7f;
    float releaseRate = 0.0001f;

    double sampleRate = 44100.0;

    float generateOscillator();
    float processEnvelope();
};
```

### 12.2 Block-Based Processing Pattern

```cpp
void Voice::render(float* outputL, float* outputR, int numSamples) {
    if (!active) return;

    // Process in BLOCK_SIZE chunks
    int samplesRemaining = numSamples;
    int offset = 0;

    while (samplesRemaining > 0) {
        int blockSize = std::min(samplesRemaining, BLOCK_SIZE);

        // Generate oscillator block
        float oscBuffer[BLOCK_SIZE];
        for (int i = 0; i < blockSize; ++i) {
            oscBuffer[i] = generateOscillator();
        }

        // Apply filter
        float filterOut[BLOCK_SIZE];
        filter.process(oscBuffer, filterOut, blockSize);

        // Apply envelope and write to output
        for (int i = 0; i < blockSize; ++i) {
            float env = processEnvelope();
            float sample = filterOut[i] * env * noteVelocity;
            outputL[offset + i] += sample;
            outputR[offset + i] += sample;
        }

        offset += blockSize;
        samplesRemaining -= blockSize;
    }

    // Check if voice finished
    if (envStage == EnvStage::Idle) {
        active = false;
    }
}
```

### 12.3 Effect Integration

```cpp
#include "effects/chowdsp/TapeEffect.h"
#include "effects/airwindows/AirWindowsEffect.h"

class EffectChain {
public:
    void prepare(double sampleRate, int blockSize) {
        tapeEffect.prepare(sampleRate, blockSize);
        reverbEffect.prepare(sampleRate, blockSize);
    }

    void process(float* left, float* right, int numSamples) {
        // Tape saturation
        if (tapeEnabled) {
            tapeEffect.process(left, right, numSamples);
        }

        // Reverb
        if (reverbEnabled) {
            reverbEffect.process(left, right, numSamples);
        }
    }

private:
    chowdsp::TapeEffect tapeEffect;
    sst::effects::Reverb2 reverbEffect;

    bool tapeEnabled = true;
    bool reverbEnabled = true;
};
```

---

## 13. Parameter System Design

### 13.1 Parameter Categories

```cpp
juce::AudioProcessorValueTreeState::ParameterLayout createParams() {
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // === OSCILLATOR PARAMETERS ===
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc_type", 1}, "Oscillator Type",
        juce::StringArray{"Saw", "Square", "Triangle", "Sine"}, 0));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc_tune", 1}, "Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 0.01f), 0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")));

    // === FILTER PARAMETERS ===
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_cutoff", 1}, "Filter Cutoff",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 1.0f, 0.3f), // skew=0.3 for log
        1000.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_reso", 1}, "Filter Resonance",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f), 0.0f,
        juce::AudioParameterFloatAttributes().withLabel("%")));

    // === ENVELOPE PARAMETERS ===
    auto timeRange = juce::NormalisableRange<float>(0.001f, 10.0f, 0.001f, 0.3f);

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_attack", 1}, "Attack", timeRange, 0.01f,
        juce::AudioParameterFloatAttributes().withLabel("s")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_decay", 1}, "Decay", timeRange, 0.1f,
        juce::AudioParameterFloatAttributes().withLabel("s")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_sustain", 1}, "Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f), 0.7f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_release", 1}, "Release", timeRange, 0.3f,
        juce::AudioParameterFloatAttributes().withLabel("s")));

    // === EFFECT PARAMETERS ===
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_mix", 1}, "Reverb Mix",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f), 0.3f));

    return { params.begin(), params.end() };
}
```

### 13.2 Parameter JSON Schema for UI

Export this for React developers:

```json
{
  "parameters": [
    {
      "id": "osc_type",
      "name": "Oscillator Type",
      "type": "choice",
      "options": ["Saw", "Square", "Triangle", "Sine"],
      "default": 0,
      "category": "oscillator"
    },
    {
      "id": "filter_cutoff",
      "name": "Filter Cutoff",
      "type": "float",
      "min": 20,
      "max": 20000,
      "default": 1000,
      "unit": "Hz",
      "skew": 0.3,
      "category": "filter",
      "widget": "knob"
    },
    {
      "id": "filter_reso",
      "name": "Filter Resonance",
      "type": "float",
      "min": 0,
      "max": 1,
      "default": 0,
      "unit": "%",
      "category": "filter",
      "widget": "knob"
    },
    {
      "id": "amp_attack",
      "name": "Attack",
      "type": "float",
      "min": 0.001,
      "max": 10,
      "default": 0.01,
      "unit": "s",
      "skew": 0.3,
      "category": "envelope",
      "widget": "slider"
    }
  ],
  "categories": {
    "oscillator": { "name": "Oscillator", "order": 1 },
    "filter": { "name": "Filter", "order": 2 },
    "envelope": { "name": "Envelope", "order": 3 },
    "effects": { "name": "Effects", "order": 4 }
  }
}
```

---

## 14. Real-Time Audio Best Practices

### 14.1 Golden Rules

```cpp
void MySynthProcessor::processBlock(juce::AudioBuffer<float>& buffer,
                                     juce::MidiBuffer& midi) {
    // 1. ALWAYS suppress denormals
    juce::ScopedNoDenormals noDenormals;

    // 2. Clear output buffer first
    buffer.clear();

    // 3. Read parameters atomically (lock-free)
    float cutoff = filterCutoffParam->load();
    float reso = filterResoParam->load();

    // 4. Handle MIDI
    for (const auto metadata : midi) {
        handleMidiEvent(metadata.getMessage());
    }

    // 5. Render voices
    float* left = buffer.getWritePointer(0);
    float* right = buffer.getWritePointer(1);

    for (auto& voice : voices) {
        if (voice.isActive()) {
            voice.setFilterCutoff(cutoff);
            voice.setFilterResonance(reso);
            voice.render(left, right, buffer.getNumSamples());
        }
    }

    // 6. Apply effects
    effectChain.process(left, right, buffer.getNumSamples());
}
```

### 14.2 Memory Rules

| DO | DON'T |
|----|-------|
| Pre-allocate in `prepareToPlay()` | Allocate in `processBlock()` |
| Use fixed-size arrays | Use `std::vector` growth |
| Pool objects (voice pool) | Create/destroy per note |
| Use atomics for params | Use locks/mutexes |
| Use placement new | Use regular new/delete |

### 14.3 SIMD Alignment

```cpp
// Ensure 16-byte alignment for SSE
alignas(16) float oscBuffer[BLOCK_SIZE];
alignas(16) float filterBuffer[BLOCK_SIZE];

// Or use JUCE's aligned allocator
juce::HeapBlock<float, true> alignedBuffer; // true = aligned
alignedBuffer.allocate(BLOCK_SIZE, true);
```

---

# PART IV: TESTING AND VALIDATION

---

## 15. Testing Methodology

### 15.1 Test Categories

| Category | What to Test | Framework |
|----------|--------------|-----------|
| Unit | Individual DSP components | Catch2 |
| Integration | Voice + Filter + Effects | Catch2 |
| Signal | Frequency, amplitude, phase | Custom + Catch2 |
| Regression | Known-good output comparison | Catch2 |
| Plugin | State, automation, formats | pluginval |

### 15.2 DSP Unit Test Pattern

```cpp
#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "dsp/Oscillator.h"

TEST_CASE("Oscillator generates correct frequency", "[oscillator]") {
    Oscillator osc;
    osc.setSampleRate(48000.0);

    SECTION("A4 = 440 Hz") {
        osc.setFrequency(440.0f);

        // Generate 1 second of audio
        std::vector<float> buffer(48000);
        for (int i = 0; i < 48000; ++i) {
            buffer[i] = osc.process();
        }

        // Count zero crossings
        int zeroCrossings = 0;
        for (int i = 1; i < 48000; ++i) {
            if (buffer[i-1] < 0 && buffer[i] >= 0) {
                zeroCrossings++;
            }
        }

        // Should be approximately 440 cycles
        REQUIRE(zeroCrossings == Catch::Approx(440).margin(2));
    }
}

TEST_CASE("Filter cutoff affects spectrum", "[filter]") {
    // Test that filter actually removes high frequencies
    // ...
}
```

### 15.3 Signal Analysis Helpers

```cpp
// From Surge's test utilities
float measureFrequency(const float* data, int numSamples, float sampleRate) {
    // Count zero crossings with upswing detection
    int crossings = 0;
    for (int i = 1; i < numSamples; ++i) {
        if (data[i-1] < 0 && data[i] >= 0) {
            crossings++;
        }
    }
    return (crossings * sampleRate) / numSamples;
}

float measureRMS(const float* data, int numSamples) {
    float sum = 0.0f;
    for (int i = 0; i < numSamples; ++i) {
        sum += data[i] * data[i];
    }
    return std::sqrt(sum / numSamples);
}

bool hasNaNOrInf(const float* data, int numSamples) {
    for (int i = 0; i < numSamples; ++i) {
        if (std::isnan(data[i]) || std::isinf(data[i])) {
            return true;
        }
    }
    return false;
}
```

---

## 16. Signal Flow Verification

### 16.1 Verification Checklist

```
[ ] Oscillator outputs correct frequency
[ ] Oscillator outputs correct amplitude
[ ] Filter cutoff responds correctly
[ ] Filter resonance responds correctly
[ ] Envelope shapes are correct
[ ] ADSR times are accurate
[ ] Voice stealing works without clicks
[ ] Note on/off are click-free
[ ] No denormals in output
[ ] No NaN or Inf values
[ ] Modulation depths are correct
[ ] Effects wet/dry works
[ ] State save/load preserves sound
[ ] All parameters automate correctly
```

### 16.2 Audio Null Test

```cpp
TEST_CASE("Deterministic output", "[regression]") {
    MySynthProcessor synth1;
    MySynthProcessor synth2;

    synth1.prepareToPlay(48000, 512);
    synth2.prepareToPlay(48000, 512);

    // Set identical state
    // Play same note
    // Compare output

    juce::AudioBuffer<float> buffer1(2, 512);
    juce::AudioBuffer<float> buffer2(2, 512);
    juce::MidiBuffer midi;

    midi.addEvent(juce::MidiMessage::noteOn(1, 60, 0.8f), 0);

    synth1.processBlock(buffer1, midi);
    synth2.processBlock(buffer2, midi);

    // Outputs should be bit-identical
    for (int i = 0; i < 512; ++i) {
        REQUIRE(buffer1.getSample(0, i) == buffer2.getSample(0, i));
    }
}
```

---

## 17. CI/CD Pipeline

### 17.1 GitHub Actions

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-22.04, macos-14, windows-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Linux Dependencies
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y libasound2-dev libx11-dev \
            libxinerama-dev libxext-dev libfreetype6-dev \
            libwebkit2gtk-4.0-dev libglu1-mesa-dev

      - name: Configure
        run: cmake -B build -DCMAKE_BUILD_TYPE=Release

      - name: Build
        run: cmake --build build --config Release

      - name: Test
        run: ctest --test-dir build -C Release --output-on-failure

      - name: Validate Plugin
        run: |
          # Download and run pluginval
          # (platform-specific commands)
```

---

# PART V: UI HANDOFF

---

## 18. React Component Interface Specification

### 18.1 Parameter Interface

```typescript
// types/parameters.ts

export interface SynthParameter {
  id: string;
  name: string;
  type: 'float' | 'int' | 'bool' | 'choice';
  category: string;

  // For float/int
  min?: number;
  max?: number;
  default: number;
  step?: number;
  skew?: number; // For logarithmic scaling
  unit?: string;

  // For choice
  options?: string[];

  // UI hints
  widget: 'knob' | 'slider' | 'toggle' | 'dropdown' | 'xy-pad';
  color?: string;
}

export interface ParameterValue {
  id: string;
  value: number;
  displayValue: string;
}

export interface SynthState {
  parameters: Record<string, number>;
  presetName: string;
  isPlaying: boolean;
}
```

### 18.2 WebSocket Protocol

```typescript
// Communication protocol between React UI and VST backend

// UI -> VST
interface ParameterChangeMessage {
  type: 'parameterChange';
  parameterId: string;
  value: number; // Always 0-1 normalized
}

interface PresetLoadMessage {
  type: 'presetLoad';
  presetId: string;
}

// VST -> UI
interface ParameterUpdateMessage {
  type: 'parameterUpdate';
  parameterId: string;
  value: number;
  displayValue: string;
}

interface StateSnapshotMessage {
  type: 'stateSnapshot';
  parameters: Record<string, number>;
}
```

### 18.3 Display Value Formatting

```typescript
// Provided to React developer for display formatting

export function formatParameterValue(
  param: SynthParameter,
  normalizedValue: number
): string {
  if (param.type === 'choice' && param.options) {
    const index = Math.round(normalizedValue * (param.options.length - 1));
    return param.options[index];
  }

  if (param.type === 'bool') {
    return normalizedValue > 0.5 ? 'On' : 'Off';
  }

  // Denormalize
  let value: number;
  if (param.skew && param.skew !== 1) {
    // Apply skew for logarithmic parameters
    value = param.min! + (param.max! - param.min!) *
            Math.pow(normalizedValue, 1 / param.skew);
  } else {
    value = param.min! + (param.max! - param.min!) * normalizedValue;
  }

  // Format with unit
  if (param.id.includes('frequency') || param.id.includes('cutoff')) {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} kHz`;
    }
    return `${value.toFixed(1)} Hz`;
  }

  if (param.unit === 's') {
    if (value < 0.01) return `${(value * 1000).toFixed(1)} ms`;
    return `${value.toFixed(2)} s`;
  }

  if (param.unit === '%') {
    return `${(value * 100).toFixed(0)}%`;
  }

  return `${value.toFixed(2)} ${param.unit || ''}`;
}
```

---

# PART VI: TEAM STRUCTURE

---

## 19. The Synth Building Team

### 19.1 Team Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNTH DEVELOPMENT TEAM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   ARCHITECT  │───→│ DSP ENGINEER │───→│  QA ENGINEER │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   SYSTEMS    │    │   SOUND      │    │     UI       │       │
│  │   ENGINEER   │    │   DESIGNER   │    │   DEVELOPER  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 19.2 Role Definitions and Documentation Mapping

---

#### **1. DSP ARCHITECT**

**Responsibilities**:
- Define synth concept and signal flow
- Design voice/filter/effects architecture
- Select DSP algorithms and libraries
- Review and approve architecture documents
- Ensure real-time safety

**Required Reading**:
| Document | Section | Priority |
|----------|---------|----------|
| This Guide | Part I: From Idea to Architecture | **Critical** |
| This Guide | Section 7: SST Library Reference | **Critical** |
| SURGE_ARCHITECTURE_ANALYSIS.md | All sections | **Critical** |
| VOICE_ARCHITECTURE_REFERENCE.md | All sections | High |
| MODULATION_SYSTEM_REFERENCE.md | Architecture overview | High |
| External: Art of VA Filter Design | Chapters 1-4 | High |

**Deliverables**:
- Architecture Document (Section 6 template)
- Signal flow diagrams
- Library selection rationale

---

#### **2. DSP ENGINEER**

**Responsibilities**:
- Implement oscillators, filters, effects
- Integrate SST libraries
- Write DSP unit tests
- Optimize for real-time performance
- Implement modulation routing

**Required Reading**:
| Document | Section | Priority |
|----------|---------|----------|
| This Guide | Part III: Implementation | **Critical** |
| SST_LIBRARIES_INDEX.md | All sections | **Critical** |
| OSCILLATOR_DEVELOPMENT_GUIDE.md | All sections | **Critical** |
| SURGE_DEFINITIVE_FILTER_REFERENCE.md | All sections | **Critical** |
| EFFECTS_IMPLEMENTATION_GUIDE.md | All sections | High |
| CHOWDSP_COMPONENTS_INDEX.md | All sections | High |
| TESTING_METHODOLOGY_GUIDE.md | DSP testing sections | High |

**Deliverables**:
- Voice implementation
- Filter integration
- Effects chain
- DSP unit tests

---

#### **3. SYSTEMS ENGINEER**

**Responsibilities**:
- JUCE project setup
- Build system configuration
- CI/CD pipeline
- Plugin format compliance
- Platform testing

**Required Reading**:
| Document | Section | Priority |
|----------|---------|----------|
| This Guide | Section 11: Minimal VST Structure | **Critical** |
| This Guide | Section 17: CI/CD Pipeline | **Critical** |
| JUCE_OpenSource_Audio_Resources.md | Templates, CI sections | High |
| sst-ecosystem-map.md | Build systems section | Medium |

**Deliverables**:
- CMakeLists.txt
- GitHub Actions workflow
- Cross-platform builds

---

#### **4. QA ENGINEER**

**Responsibilities**:
- Write integration tests
- Signal flow verification
- Plugin validation (pluginval)
- Regression testing
- Performance profiling

**Required Reading**:
| Document | Section | Priority |
|----------|---------|----------|
| This Guide | Part IV: Testing and Validation | **Critical** |
| TESTING_METHODOLOGY_GUIDE.md | All sections | **Critical** |
| This Guide | Section 16: Signal Flow Verification | High |

**Deliverables**:
- Test suite
- Signal verification reports
- pluginval compliance
- Performance benchmarks

---

#### **5. SOUND DESIGNER**

**Responsibilities**:
- Define sonic goals
- Create reference patches
- Test musical usability
- Document presets
- Provide feedback on DSP behavior

**Required Reading**:
| Document | Section | Priority |
|----------|---------|----------|
| This Guide | Section 1: Synth Ideation | **Critical** |
| AIRWINDOWS_EFFECTS_CATALOG.md | Effect descriptions | High |
| MODULATION_SYSTEM_REFERENCE.md | LFO shapes, envelope modes | High |
| This Guide | Section 4: Effects Chain Design | Medium |

**Deliverables**:
- Sonic specification
- Reference patches
- Preset library
- User feedback

---

#### **6. UI DEVELOPER (React)**

**Responsibilities**:
- Implement React component UI
- Parameter visualization
- Preset browser
- Responsive design
- Accessibility

**Required Reading**:
| Document | Section | Priority |
|----------|---------|----------|
| This Guide | Part V: UI Handoff | **Critical** |
| SURGE_PARAMETER_SYSTEM_REFERENCE.md | All sections | **Critical** |
| REACT_PARAMETER_QUICKSTART.md | All sections | **Critical** |
| PARAMETER_TYPES.ts | Type definitions | High |
| PARAMETER_SPEC_SCHEMA.json | Schema reference | High |

**Deliverables**:
- React components
- Parameter bindings
- Preset browser UI
- Visual feedback

---

### 19.3 Team Workflow

```
Phase 1: ARCHITECTURE (Week 1-2)
├── Architect: Define concept, signal flow
├── Sound Designer: Define sonic goals
└── Deliverable: Approved Architecture Document

Phase 2: CORE DSP (Week 3-6)
├── DSP Engineer: Implement voice, filter, effects
├── Systems Engineer: Set up build system
├── QA: Set up test framework
└── Deliverable: Working DSP with tests

Phase 3: INTEGRATION (Week 7-8)
├── DSP Engineer: Plugin integration
├── Systems Engineer: CI/CD pipeline
├── QA: Plugin validation
└── Deliverable: Validated VST

Phase 4: UI (Week 9-12)
├── UI Developer: React components
├── Sound Designer: Preset creation
├── QA: Integration testing
└── Deliverable: Complete product
```

---

### 19.4 Communication Protocol

**Daily Standups**:
- What was completed
- What's blocking
- What's next

**Code Reviews**:
- All DSP code reviewed by Architect
- All test code reviewed by QA lead
- All UI code reviewed by senior UI dev

**Documentation Updates**:
- Architecture changes require Architect approval
- Parameter changes require notification to UI Developer
- Test failures block merges

---

# APPENDICES

## A. File Reference Quick Lookup

| Need | File |
|------|------|
| SST library overview | `docs/SST_LIBRARIES_INDEX.md` |
| Airwindows effects | `AIRWINDOWS_EFFECTS_CATALOG.md` |
| ChowDSP components | `CHOWDSP_COMPONENTS_INDEX.md` |
| Filter reference | `SURGE_DEFINITIVE_FILTER_REFERENCE.md` |
| Effects reference | `EFFECTS_IMPLEMENTATION_GUIDE.md` |
| Oscillator guide | `OSCILLATOR_DEVELOPMENT_GUIDE.md` |
| Modulation reference | `MODULATION_SYSTEM_REFERENCE.md` |
| Voice management | `VOICE_ARCHITECTURE_REFERENCE.md` |
| Parameter system | `SURGE_PARAMETER_SYSTEM_REFERENCE.md` |
| Testing guide | `TESTING_METHODOLOGY_GUIDE.md` |
| Architecture overview | `SURGE_ARCHITECTURE_ANALYSIS.md` |
| SST ecosystem | `doc/sst-ecosystem-map.md` |
| JUCE resources | `doc/JUCE_OpenSource_Audio_Resources.md` |
| React quickstart | `REACT_PARAMETER_QUICKSTART.md` |

## B. Essential Code Locations (Surge)

| Component | Path |
|-----------|------|
| Voice | `src/common/SurgeVoice.h` |
| Synthesizer | `src/common/SurgeSynthesizer.h` |
| Oscillators | `src/common/dsp/oscillators/` |
| Filters | `src/common/dsp/filters/` |
| Effects | `src/common/dsp/effects/` |
| Modulators | `src/common/dsp/modulators/` |
| Parameters | `src/common/Parameter.h` |
| Storage | `src/common/SurgeStorage.h` |
| Tests | `src/surge-testrunner/` |

## C. External Links

| Resource | URL |
|----------|-----|
| Surge XT | https://surge-synthesizer.github.io/ |
| SST GitHub | https://github.com/surge-synthesizer |
| JUCE | https://juce.com/ |
| Pamplejuce | https://github.com/sudara/pamplejuce |
| pluginval | https://github.com/Tracktion/pluginval |
| Awesome JUCE | https://github.com/sudara/awesome-juce |

---

**END OF GUIDE**

*Created by a Senior DSP Architect with 10+ years experience on Surge XT*
*For the next generation of synthesizer developers*
