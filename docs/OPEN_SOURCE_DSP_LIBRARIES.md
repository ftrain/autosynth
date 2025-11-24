# Open Source Audio/DSP Libraries Index

## Comprehensive Reference Guide for Synthesizer and Audio Plugin Development

**Version**: 1.0
**Last Updated**: November 2025
**Status**: Active Reference

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference Matrix](#quick-reference-matrix)
3. [Core DSP & Filters](#core-dsp--filters)
   - [Faust](#1-faust)
   - [HIIR](#2-hiir)
   - [Signalsmith Stretch](#3-signalsmith-stretch)
   - [Rubber Band](#4-rubber-band)
4. [Synthesis & Oscillators](#synthesis--oscillators)
   - [Surge Synth DSP Core](#5-surge-synth-dsp-core)
   - [Vital/Vitalium](#6-vitalvitalium)
   - [DPF (DISTRHO Plugin Framework)](#7-dpf-distrho-plugin-framework)
5. [Effects & Dynamics](#effects--dynamics)
   - [zita-rev1](#8-zita-rev1)
   - [zita-convolver](#9-zita-convolver)
   - [Dattorro Reverb](#10-dattorro-reverb-implementations)
   - [x42 Plugins](#11-x42-plugins)
6. [Utilities & Math](#utilities--math)
   - [KFR](#12-kfr)
   - [SpeexDSP](#13-speexdsp)
   - [libsamplerate](#14-libsamplerate)
7. [Mutable Instruments](#mutable-instruments)
   - [Overview](#15-mutable-instruments-eurorack)
   - [Clouds](#clouds)
   - [Rings](#rings)
   - [Plaits](#plaits)
   - [Elements](#elements)
8. [Anti-Aliasing Techniques](#anti-aliasing-techniques)
   - [PolyBLEP](#16-polyblep)
   - [MinBLEP](#17-minblep)
9. [Integration Patterns](#integration-patterns)
10. [Library Selection Guide](#library-selection-guide)
11. [Build Configuration](#build-configuration)

---

## Overview

This document catalogs high-quality open-source audio/DSP libraries that complement the SST (Surge Synth Team) libraries. These libraries represent the state of the art in various audio processing domains and can be integrated into JUCE-based synthesizer projects.

### Design Philosophy

These libraries share common traits:
- **Battle-tested**: Used in production software and hardware
- **Well-architected**: Clean APIs, good documentation
- **Performance-focused**: SIMD optimization where applicable
- **Open Source**: Various licenses (MIT, GPL, BSD, WTFPL)

### When to Use These Libraries

| Need | Primary Choice | Alternative |
|------|----------------|-------------|
| Time-stretching | Rubber Band | Signalsmith Stretch |
| Pitch-shifting | Rubber Band | Signalsmith Stretch |
| Oversampling/Downsampling | HIIR | libsamplerate |
| Algorithmic Reverb | zita-rev1 | Dattorro implementations |
| Convolution Reverb | zita-convolver | - |
| Granular Synthesis | Mutable Clouds | - |
| Physical Modeling | Mutable Rings/Elements | - |
| Macro Oscillator | Mutable Plaits | Vital oscillators |
| Wavetable Synthesis | Vital | Surge oscillators |
| Fast FFT | KFR | FFTW |
| Resampling | libsamplerate | KFR, SpeexDSP |
| Echo Cancellation | SpeexDSP | - |
| DSP Prototyping | Faust | - |
| Anti-aliased Oscillators | PolyBLEP | MinBLEP |

---

## Quick Reference Matrix

| Library | Domain | License | Language | SIMD | Header-Only |
|---------|--------|---------|----------|------|-------------|
| **Faust** | DSP Language | GPL2 | Faust→C++ | Yes | N/A |
| **HIIR** | Filters/Resampling | WTFPL | C++ | AVX/SSE/NEON | Yes |
| **Signalsmith Stretch** | Time/Pitch | MIT | C++11 | Optional | Yes |
| **Rubber Band** | Time/Pitch | GPL2/Commercial | C++ | Yes | No |
| **Surge DSP** | Full Synth | GPL3 | C++ | SSE/AVX | No |
| **Vital** | Wavetable Synth | GPL3 | C++ | SSE | No |
| **DPF** | Plugin Framework | ISC | C++ | N/A | No |
| **zita-rev1** | Reverb | GPL2 | C++ | No | No |
| **zita-convolver** | Convolution | GPL3 | C++ | Yes | No |
| **Dattorro** | Reverb | Various | C++ | No | Yes |
| **x42** | Meters/EQ | GPL2 | C | No | No |
| **KFR** | DSP/FFT | GPL2/Commercial | C++20 | AVX512/AVX/SSE/NEON | No |
| **SpeexDSP** | Voice Processing | BSD | C | No | No |
| **libsamplerate** | Resampling | BSD-2 | C | No | No |
| **Mutable Instruments** | Eurorack DSP | MIT/GPL3 | C++ | No | No |

---

## Core DSP & Filters

### 1. Faust

**Repository**: https://github.com/grame-cncm/faust
**Website**: https://faust.grame.fr/
**Documentation**: https://faustdoc.grame.fr/
**License**: GPL2
**Language**: Faust (functional DSP language) → compiles to C++, C, LLVM, WebAssembly, Rust

#### Purpose & Scope

Faust (Functional Audio Stream) is a domain-specific functional programming language for real-time signal processing. It compiles high-level DSP descriptions into highly optimized C++ code.

**Key Strengths**:
- Extremely concise DSP descriptions
- Automatic SIMD optimization in generated code
- Rich standard library of filters, effects, oscillators
- Direct plugin generation (VST, AU, LV2, CLAP)
- Block diagram visualization
- JUCE integration via faust2juce

#### Faust Syntax Fundamentals

```faust
// Basic signal processing: process is the main entry point
process = +;  // Simple mixer (adds two inputs)

// Oscillator
import("stdfaust.lib");
process = os.osc(440);  // 440 Hz sine wave

// Filter
process = fi.lowpass(2, 1000);  // 2nd order lowpass at 1kHz

// Complete synth voice
freq = hslider("freq", 440, 20, 20000, 1);
gate = button("gate");
process = os.sawtooth(freq) : fi.lowpass(2, freq*4) * en.adsr(0.01, 0.1, 0.7, 0.3, gate);
```

#### Key Library Components

| Library | Purpose | Key Functions |
|---------|---------|---------------|
| `os` (oscillators) | Wave generation | `osc`, `sawtooth`, `square`, `triangle`, `pulsetrain` |
| `fi` (filters) | Filtering | `lowpass`, `highpass`, `bandpass`, `resonlp`, `svf` |
| `ef` (effects) | Effects | `echo`, `flanger`, `phaser`, `wahwah` |
| `re` (reverbs) | Reverb | `mono_freeverb`, `stereo_freeverb`, `zita_rev1` |
| `en` (envelopes) | Envelopes | `adsr`, `asr`, `ar`, `smoothEnvelope` |
| `no` (noises) | Noise | `noise`, `pink_noise`, `lfnoise` |
| `an` (analyzers) | Analysis | `amp_follower`, `rms`, `peak_envelope` |
| `de` (delays) | Delays | `delay`, `fdelay`, `sdelay` |
| `dm` (demos) | Complete examples | `zita_rev1`, `phaser2_demo` |

#### Compilation to C++

```bash
# Generate C++ from Faust
faust -a minimal.cpp synth.dsp -o synth.cpp

# Generate JUCE project
faust2juce -nvoices 8 synth.dsp

# Generate VST plugin directly
faust2vst synth.dsp

# Generate LV2 plugin
faust2lv2 synth.dsp
```

#### JUCE Integration Pattern

```cpp
// Using faust2api to generate a DSP engine
#include "DspFaust.h"

class FaustProcessor : public juce::AudioProcessor
{
    std::unique_ptr<DspFaust> faust;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override
    {
        faust = std::make_unique<DspFaust>(sampleRate, samplesPerBlock);
    }

    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        faust->compute(buffer.getNumSamples(),
                       buffer.getArrayOfReadPointers(),
                       buffer.getArrayOfWritePointers());
    }
};
```

#### libfaust JIT Compilation

```cpp
// Dynamic Faust compilation at runtime
#include <faust/dsp/llvm-dsp.h>

std::string faustCode = R"(
    import("stdfaust.lib");
    process = os.osc(440);
)";

std::string errorMsg;
llvm_dsp_factory* factory = createDSPFactoryFromString(
    "synth", faustCode, 0, nullptr, "", errorMsg);

if (factory) {
    dsp* DSP = factory->createDSPInstance();
    DSP->init(sampleRate);
    // Use DSP->compute() for processing
}
```

#### When to Use Faust

- **Prototyping**: Quickly test DSP algorithms
- **Complex filters**: Faust's filter library is exceptional
- **Academic/research**: Clear mathematical notation
- **Cross-platform**: Single source, multiple targets

---

### 2. HIIR

**Repository**: https://github.com/unevens/hiir (header-only mirror)
**Original**: http://ldesoras.free.fr/prod.html#src_hiir
**License**: WTFPL (Do What The Fuck You Want To Public License)
**Author**: Laurent de Soras

#### Purpose & Scope

HIIR provides extremely optimized polyphase half-band IIR filters for:
- **Upsampling by 2x** (for oversampling before nonlinear processing)
- **Downsampling by 2x** (after oversampling)
- **Hilbert transforms** (for frequency shifting, SSB modulation)

#### Why HIIR is Special

Traditional FIR oversampling filters require many taps for good performance. HIIR uses IIR polyphase structures that achieve:
- **Fewer coefficients** (typically 4-13 vs 100+ for FIR)
- **Lower latency**
- **Extremely flat passband**
- **Sharp transition band**

#### Key Components

| Class | Purpose | SIMD Support |
|-------|---------|--------------|
| `Upsampler2x*` | 2x upsampling | FPU, SSE, AVX, NEON |
| `Downsampler2x*` | 2x downsampling | FPU, SSE, AVX, NEON |
| `PhaseHalfPi*` | Hilbert transform | FPU, SSE, AVX |
| `PolyphaseIir2Designer` | Coefficient calculator | N/A |

#### Coefficient Design

```cpp
#include "hiir/PolyphaseIir2Designer.h"

// Design filter coefficients
// Parameters: transition bandwidth (0-0.5), stopband attenuation (dB)
double coefs[8];
int numCoefs = 8;

// Transition = 0.1 means passband ends at 0.4*Nyquist, stopband at 0.5*Nyquist
// This gives ~100dB attenuation with 6-8 coefficients
hiir::PolyphaseIir2Designer::compute_coefs_spec_order_tbw(
    coefs, numCoefs, 0.1);  // 10% transition band

// Or specify attenuation and get required order
int order = hiir::PolyphaseIir2Designer::compute_order_from_tbw(0.1, 96.0);
```

#### Usage Pattern: 4x Oversampling

```cpp
#include "hiir/Upsampler2xSse.h"
#include "hiir/Downsampler2xSse.h"

class Oversampler4x
{
public:
    static constexpr int NUM_COEFS = 8;

    void init()
    {
        double coefs[NUM_COEFS];
        hiir::PolyphaseIir2Designer::compute_coefs_spec_order_tbw(coefs, NUM_COEFS, 0.1);

        up1.set_coefs(coefs);
        up2.set_coefs(coefs);
        down1.set_coefs(coefs);
        down2.set_coefs(coefs);
    }

    void processBlock(float* input, float* output, int numSamples)
    {
        // Upsample: 1x -> 2x -> 4x
        float stage1[numSamples * 2];
        float stage2[numSamples * 4];

        up1.process_block(stage1, input, numSamples);
        up2.process_block(stage2, stage1, numSamples * 2);

        // Process at 4x (your nonlinear processing here)
        for (int i = 0; i < numSamples * 4; ++i)
            stage2[i] = processNonlinear(stage2[i]);

        // Downsample: 4x -> 2x -> 1x
        down2.process_block(stage1, stage2, numSamples * 2);
        down1.process_block(output, stage1, numSamples);
    }

private:
    hiir::Upsampler2xSse<NUM_COEFS> up1, up2;
    hiir::Downsampler2xSse<NUM_COEFS> down1, down2;
};
```

#### Hilbert Transform for Frequency Shifting

```cpp
#include "hiir/PhaseHalfPiSse.h"

class FrequencyShifter
{
public:
    void init(double sampleRate)
    {
        double coefs[NUM_COEFS];
        hiir::PolyphaseIir2Designer::compute_coefs_spec_order_tbw(coefs, NUM_COEFS, 0.01);
        hilbert.set_coefs(coefs);

        shiftFreq = 100.0;  // Hz
        phaseInc = 2.0 * M_PI * shiftFreq / sampleRate;
    }

    float process(float input)
    {
        float re, im;
        hilbert.process_sample(re, im, input);

        // Frequency shift via complex multiplication
        float cosPhase = std::cos(phase);
        float sinPhase = std::sin(phase);
        float output = re * cosPhase - im * sinPhase;

        phase += phaseInc;
        if (phase > 2.0 * M_PI) phase -= 2.0 * M_PI;

        return output;
    }

private:
    static constexpr int NUM_COEFS = 12;
    hiir::PhaseHalfPiSse<NUM_COEFS> hilbert;
    double phase = 0.0;
    double phaseInc;
    double shiftFreq;
};
```

#### Build Integration

```cmake
# Header-only, just include the path
target_include_directories(my_plugin PRIVATE path/to/hiir)
```

---

### 3. Signalsmith Stretch

**Repository**: https://github.com/Signalsmith-Audio/signalsmith-stretch
**Website**: https://signalsmith-audio.co.uk/code/stretch/
**License**: MIT
**Language**: C++11 (header-only)

#### Purpose & Scope

High-quality time-stretching and pitch-shifting library using phase vocoder techniques. Designed for polyphonic material with minimal artifacts.

**Key Characteristics**:
- Header-only (single file)
- Handles wide pitch shifts (multiple octaves)
- Best for modest time-stretching (0.75x - 1.5x)
- Low latency mode available
- Optional FFT acceleration (Accelerate, IPP, PFFFT)

#### Basic Usage

```cpp
#include "signalsmith-stretch.h"

signalsmith::stretch::SignalsmithStretch<float> stretch;

void init(int channels, float sampleRate)
{
    // Use preset for easy configuration
    stretch.presetDefault(channels, sampleRate);
    // Or: stretch.presetCheaper(channels, sampleRate);
}

void process(float** input, int inputSamples,
             float** output, int outputSamples,
             float pitchRatio)
{
    // Set pitch shift (1.0 = no shift, 2.0 = octave up, 0.5 = octave down)
    stretch.setTransposeFactor(pitchRatio);

    // Process - different input/output sizes = time stretch
    stretch.process(input, inputSamples, output, outputSamples);
}
```

#### Time Stretching

```cpp
// Time stretch by providing different input/output buffer sizes
void timeStretch(float stretchRatio)
{
    int inputSamples = 1024;
    int outputSamples = static_cast<int>(inputSamples * stretchRatio);

    // stretchRatio = 2.0: output is twice as long (slower playback)
    // stretchRatio = 0.5: output is half as long (faster playback)
    stretch.process(inputBuffers, inputSamples, outputBuffers, outputSamples);
}
```

#### Latency Compensation

```cpp
int inputLatency = stretch.inputLatency();   // Samples to provide ahead
int outputLatency = stretch.outputLatency(); // Samples delayed in output

// For automation accuracy, provide values from:
// currentTime + outputLatency samples ahead
```

#### Seeking (for non-linear playback)

```cpp
// Jump to a new position in the source audio
// Provide context samples for smooth transition
stretch.seek(contextBuffers, contextSamples, playbackRateHint);
```

#### Formant Preservation

```cpp
// For voice/instrument pitch shifting, preserve formants
// Set approximate fundamental frequency (relative to Nyquist)
float fundamentalHz = 200.0f;  // e.g., middle register
stretch.setFormantBase(fundamentalHz / sampleRate);
```

#### FFT Acceleration

```cpp
// Define before including to use faster FFT
#define SIGNALSMITH_USE_ACCELERATE  // macOS/iOS
// or
#define SIGNALSMITH_USE_IPP         // Intel IPP
// or
#define SIGNALSMITH_USE_PFFFT       // Cross-platform

#include "signalsmith-stretch.h"
```

---

### 4. Rubber Band

**Repository**: https://github.com/breakfastquay/rubberband
**Website**: https://breakfastquay.com/rubberband/
**API Docs**: https://breakfastquay.com/rubberband/code-doc/
**License**: GPL2 (or commercial license available)
**Language**: C++ with C bindings

#### Purpose & Scope

Industry-standard time-stretching and pitch-shifting library. More mature than Signalsmith Stretch, with offline and real-time modes.

**Key Characteristics**:
- Battle-tested in professional DAWs
- Offline mode (best quality, uses full audio)
- Real-time mode (streaming, lock-free)
- Formant preservation option
- Multi-channel support

#### Main Classes

| Class | Purpose |
|-------|---------|
| `RubberBandStretcher` | Full-featured time/pitch processing |
| `RubberBandLiveShifter` | Simplified real-time pitch shifting |

#### Offline Mode (Best Quality)

```cpp
#include <rubberband/RubberBandStretcher.h>

using namespace RubberBand;

void processOffline(const float* const* input, int totalSamples,
                    float** output, double timeRatio, double pitchRatio)
{
    RubberBandStretcher stretcher(
        sampleRate,
        channels,
        RubberBandStretcher::OptionProcessOffline |
        RubberBandStretcher::OptionPitchHighQuality
    );

    stretcher.setTimeRatio(timeRatio);    // 2.0 = twice as long
    stretcher.setPitchScale(pitchRatio);  // 2.0 = octave up

    // Study the audio first (required for offline mode)
    stretcher.study(input, totalSamples, true);

    // Process
    stretcher.process(input, totalSamples, true);

    // Retrieve output
    int available;
    while ((available = stretcher.available()) > 0) {
        stretcher.retrieve(output, available);
    }
}
```

#### Real-Time Mode

```cpp
#include <rubberband/RubberBandStretcher.h>

class RealTimeStretcher
{
public:
    void init(double sampleRate, int channels)
    {
        stretcher = std::make_unique<RubberBand::RubberBandStretcher>(
            sampleRate,
            channels,
            RubberBand::RubberBandStretcher::OptionProcessRealTime |
            RubberBand::RubberBandStretcher::OptionPitchHighConsistency
        );
    }

    void setPitch(double semitones)
    {
        double ratio = std::pow(2.0, semitones / 12.0);
        stretcher->setPitchScale(ratio);
    }

    void setTimeRatio(double ratio)
    {
        stretcher->setTimeRatio(ratio);
    }

    void process(const float* const* input, float** output, int samples)
    {
        stretcher->process(input, samples, false);

        int available = stretcher->available();
        if (available > 0) {
            stretcher->retrieve(output, available);
        }
    }

private:
    std::unique_ptr<RubberBand::RubberBandStretcher> stretcher;
};
```

#### Pitch Options

```cpp
// Choose based on use case:
OptionPitchHighSpeed       // Default, good for time-stretch only
OptionPitchHighQuality     // Best for fixed pitch shifts
OptionPitchHighConsistency // Best for dynamic pitch changes
```

#### Latency

```cpp
int latency = stretcher->getLatency();  // In samples
// Account for this in your host sync
```

#### Build Integration

```cmake
find_package(PkgConfig REQUIRED)
pkg_check_modules(RUBBERBAND REQUIRED rubberband)

target_include_directories(my_plugin PRIVATE ${RUBBERBAND_INCLUDE_DIRS})
target_link_libraries(my_plugin ${RUBBERBAND_LIBRARIES})
```

---

## Synthesis & Oscillators

### 5. Surge Synth DSP Core

**Repository**: https://github.com/surge-synthesizer/surge
**Website**: https://surge-synthesizer.github.io/
**License**: GPL3
**Language**: C++ with SSE/AVX

#### Purpose & Scope

Surge XT is a full-featured open-source synthesizer. Its DSP core provides battle-tested implementations of oscillators, filters, and effects that can be studied and adapted.

#### Architecture Overview

```
Surge DSP Core
├── oscillators/           [12 oscillator algorithms]
│   ├── Classic            [Morphable pulse/saw with sub-osc]
│   ├── Modern             [Mixable saw/pulse/triangle]
│   ├── Wavetable          [Wavetable with morphing]
│   ├── Window             [Window function oscillator]
│   ├── Sine               [FM-capable sine]
│   ├── FM2/FM3            [2/3 operator FM]
│   ├── String             [Karplus-Strong variants]
│   ├── Twist              [Mutable Plaits port]
│   └── Alias              [Deliberately aliased]
│
├── filters/               [Extensive filter library]
│   ├── Lowpass 12/24      [3 variations each]
│   ├── Ladder             [Vintage and legacy]
│   ├── K35/Diode          [From Odin 2]
│   ├── OB-Xd              [Oberheim-style]
│   ├── Cutoff/Reso Warp   [Chowdhury designs]
│   └── Comb/Notch/Allpass [Various]
│
├── effects/               [Modular effect rack]
│   ├── Delay              [Tempo-synced, ping-pong]
│   ├── Reverb1/2          [Algorithmic]
│   ├── Chorus             [Ensemble types]
│   ├── Phaser             [Multi-stage]
│   ├── Flanger            [Classic flanger]
│   ├── Rotary             [Leslie simulation]
│   ├── Distortion         [Multiple algorithms]
│   ├── Conditioner        [EQ/dynamics]
│   └── Vocoder            [Channel vocoder]
│
└── modulation/            [Comprehensive mod system]
    ├── LFOs               [Multiple waveforms, sync]
    ├── Envelopes          [DAHDSR with curves]
    └── ModMatrix          [Extensive routing]
```

#### Key Learning Points from Surge

**1. Band-Limited Oscillators**
Most oscillators are strictly band-limited (no aliasing):
```cpp
// Surge uses DPW (Differentiated Parabolic Waveform) for anti-aliasing
// See: src/common/dsp/oscillators/
```

**2. SSE-Optimized Filters**
Filters process in SIMD blocks:
```cpp
// QuadFilterUnit processes 4 voices simultaneously
// See: src/common/dsp/filters/
```

**3. Modulation System**
Extensive modulation with smoothing:
```cpp
// All parameter changes are smoothed to prevent zipper noise
// See: src/common/dsp/SurgeVoice.cpp
```

#### Studying Surge Code

The most instructive files:
- `src/common/dsp/Oscillator.cpp` - Oscillator factory and base
- `src/common/dsp/SurgeVoice.cpp` - Voice architecture
- `src/common/dsp/QuadFilterChain.cpp` - Filter routing
- `src/common/dsp/effects/` - Effect implementations

---

### 6. Vital/Vitalium

**Repository**: https://github.com/mtytel/vital
**Website**: https://vital.audio/
**License**: GPL3 (source), Trademark restrictions apply
**Language**: C++ with SSE

#### Purpose & Scope

Vital is a spectral warping wavetable synthesizer with sophisticated DSP. The open-source version provides excellent reference implementations for:

- Wavetable synthesis with anti-aliasing
- Spectral processing
- Advanced modulation
- Efficient polyphony

#### Key DSP Concepts

**1. Wavetable Anti-Aliasing**
Vital generates extremely clean oscillators with sharp Nyquist cutoff:
```cpp
// Vital uses clever SSE optimizations for wavetable playback
// See: src/synthesis/producers/
```

**2. Spectral Warping**
Operates on waveform harmonics to create new timbres:
```cpp
// Spectral warping transforms simple waves into complex timbres
// See: src/synthesis/modules/
```

**3. Wavetable Generation**
Convert samples to wavetables:
```cpp
// Pitch-splice and vocode algorithms
// Text-to-wavetable synthesis
// See: src/synthesis/
```

#### Architecture Study Points

| Component | Location | Key Learning |
|-----------|----------|--------------|
| Oscillator | `src/synthesis/producers/` | Band-limited wavetable |
| Filters | `src/synthesis/filters/` | State-variable variants |
| Effects | `src/synthesis/effects/` | Modern implementations |
| Modulation | `src/synthesis/modules/` | High-resolution mod |

**Note**: The Vital repository is updated on delay after binary releases. Matt Tytel does not accept pull requests.

---

### 7. DPF (DISTRHO Plugin Framework)

**Repository**: https://github.com/DISTRHO/DPF
**Documentation**: https://distrho.github.io/DPF/
**License**: ISC (permissive)
**Language**: C++

#### Purpose & Scope

DPF is a lightweight alternative to JUCE for audio plugin development. Supports LV2, VST2, VST3, CLAP, LADSPA, DSSI, and JACK standalone.

**Key Differences from JUCE**:
- Smaller footprint
- No commercial licensing required
- Native LV2 support (important for Linux)
- Less batteries-included (more DIY)

#### Basic Plugin Structure

```cpp
// DistrhoPluginInfo.h
#define DISTRHO_PLUGIN_NAME "My Synth"
#define DISTRHO_PLUGIN_NUM_INPUTS 0
#define DISTRHO_PLUGIN_NUM_OUTPUTS 2
#define DISTRHO_PLUGIN_IS_SYNTH 1
#define DISTRHO_PLUGIN_WANT_MIDI_INPUT 1

// MyPlugin.cpp
#include "DistrhoPlugin.hpp"

class MyPlugin : public Plugin
{
public:
    MyPlugin() : Plugin(kParameterCount, 0, 0) {}

protected:
    const char* getLabel() const override { return "mysynth"; }
    const char* getMaker() const override { return "MyName"; }
    const char* getLicense() const override { return "MIT"; }
    uint32_t getVersion() const override { return d_version(1, 0, 0); }
    int64_t getUniqueId() const override { return d_cconst('M', 'y', 'S', 'y'); }

    void initParameter(uint32_t index, Parameter& param) override
    {
        param.hints = kParameterIsAutomatable;
        param.name = "Frequency";
        param.ranges.def = 440.0f;
        param.ranges.min = 20.0f;
        param.ranges.max = 20000.0f;
    }

    void run(const float**, float** outputs, uint32_t frames,
             const MidiEvent* midiEvents, uint32_t midiEventCount) override
    {
        // Process audio here
        for (uint32_t i = 0; i < frames; ++i) {
            outputs[0][i] = generateSample();
            outputs[1][i] = outputs[0][i];
        }
    }
};

START_NAMESPACE_DISTRHO
Plugin* createPlugin() { return new MyPlugin(); }
END_NAMESPACE_DISTRHO
```

#### When to Use DPF vs JUCE

| Criterion | Use DPF | Use JUCE |
|-----------|---------|----------|
| License | Need fully permissive | Commercial OK |
| LV2 Priority | Yes | No |
| Binary Size | Minimal | Don't care |
| GUI Complexity | Simple | Complex |
| Learning Resources | Comfortable with less | Need more examples |

---

## Effects & Dynamics

### 8. zita-rev1

**Repository**: https://github.com/PelleJuul/zita-rev1 (portable version)
**Original**: http://kokkinizita.linuxaudio.org/
**License**: GPL2
**Author**: Fons Adriaensen

#### Purpose & Scope

Audiophile-grade algorithmic reverb combining Schroeder and FDN (Feedback Delay Network) structures. Known for:
- Extremely natural decay
- Low coloration
- Smooth diffusion
- Clean implementation

#### Architecture

```
Input → Bandwidth Limit → Delay Lines (8) → Output
                              ↓
                         Allpass Combs
                              ↓
                         Damping Filters (low-shelf + lowpass)
                              ↓
                         Feedback Matrix (8x8 Hadamard)
```

#### Integration

```cpp
#include "reverb.h"

Reverb reverb;

void init(float sampleRate)
{
    reverb.init(sampleRate);
    reverb.set_delay(0.04f);    // Pre-delay (seconds)
    reverb.set_xover(200.0f);   // Crossover frequency
    reverb.set_rtlow(3.0f);     // RT60 low frequencies
    reverb.set_rtmid(2.0f);     // RT60 mid frequencies
    reverb.set_fdamp(6000.0f);  // High frequency damping
    reverb.set_eq1(160.0f, 0.0f);   // Low shelf
    reverb.set_eq2(2500.0f, 0.0f);  // High shelf
    reverb.set_mix(0.3f);       // Dry/wet mix
}

void process(float* left, float* right, int numSamples)
{
    reverb.process(numSamples, left, right);
}
```

#### Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| `delay` | 0.02-0.1s | Pre-delay time |
| `xover` | 50-1000 Hz | Low/mid crossover |
| `rtlow` | 1-8s | Low frequency RT60 |
| `rtmid` | 1-8s | Mid frequency RT60 |
| `fdamp` | 1.5k-24k Hz | HF damping frequency |
| `eq1` | freq + gain | Low shelf EQ |
| `eq2` | freq + gain | High shelf EQ |

---

### 9. zita-convolver

**Repository**: http://kokkinizita.linuxaudio.org/
**License**: GPL3
**Author**: Fons Adriaensen

#### Purpose & Scope

High-performance partitioned convolution engine for:
- Impulse response reverbs
- Cabinet simulation
- Room correction
- Any linear time-invariant system

#### Key Features

- Non-uniform partitioning (low latency + efficiency)
- Multi-threaded processing
- Supports very long IRs (minutes)
- SIMD-optimized FFT

#### Basic Usage

```cpp
#include <zita-convolver.h>

Convproc convolver;

void init(int numInputs, int numOutputs,
          float* impulseResponse, int irLength,
          int maxBlockSize)
{
    int fragm = 64;  // Minimum partition size (latency)
    int partn = 8192; // Maximum partition size

    convolver.configure(numInputs, numOutputs,
                        irLength, fragm, partn, maxBlockSize);

    // Add impulse responses for each input->output routing
    for (int in = 0; in < numInputs; ++in) {
        for (int out = 0; out < numOutputs; ++out) {
            convolver.impdata_create(in, out, 1,
                                      impulseResponse, 0, irLength);
        }
    }

    convolver.start_process(0, 0);  // Priority, CPU affinity
}

void process(float** inputs, float** outputs, int numSamples)
{
    // Copy inputs
    for (int ch = 0; ch < numInputs; ++ch)
        std::memcpy(convolver.inpdata(ch), inputs[ch], numSamples * sizeof(float));

    convolver.process(false);  // false = non-blocking

    // Copy outputs
    for (int ch = 0; ch < numOutputs; ++ch)
        std::memcpy(outputs[ch], convolver.outdata(ch), numSamples * sizeof(float));
}
```

---

### 10. Dattorro Reverb Implementations

**Original Paper**: https://ccrma.stanford.edu/~dattorro/EffectDesignPart1.pdf
**Key Implementations**:
- MVerb: https://github.com/martineastwood/mverb
- dsp-lib: https://github.com/mjarmy/dsp-lib
- Faust: `dm.zita_rev1` in Faust libraries

#### Purpose & Scope

Jon Dattorro's 1997 paper describes a classic plate reverb topology. Implementations are characterized by:
- Figure-of-eight feedback structure
- Modulated delay lines
- Rich, plate-like character
- Relatively simple implementation

#### MVerb (Self-Contained Implementation)

```cpp
// MVerb is entirely self-contained in mverb.h
#include "mverb.h"

MVerb<float> reverb;

void init(float sampleRate)
{
    reverb.setSampleRate(sampleRate);
    reverb.setParameter(MVerb<float>::DAMPINGFREQ, 0.5f);
    reverb.setParameter(MVerb<float>::DENSITY, 0.5f);
    reverb.setParameter(MVerb<float>::BANDWIDTHFREQ, 0.5f);
    reverb.setParameter(MVerb<float>::DECAY, 0.5f);
    reverb.setParameter(MVerb<float>::PREDELAY, 0.0f);
    reverb.setParameter(MVerb<float>::SIZE, 0.5f);
    reverb.setParameter(MVerb<float>::GAIN, 1.0f);
    reverb.setParameter(MVerb<float>::MIX, 0.5f);
    reverb.setParameter(MVerb<float>::EARLYMIX, 0.5f);
}

void process(float* left, float* right, int numSamples)
{
    float* inputs[2] = {left, right};
    float* outputs[2] = {left, right};
    reverb.process(inputs, outputs, numSamples);
}
```

#### Dattorro Algorithm Components

| Component | Purpose |
|-----------|---------|
| Input diffusers | 4 allpass filters for density |
| Tank | Two parallel delay lines with feedback |
| Modulation | LFOs modulating delay times |
| Damping | Lowpass in feedback for decay shaping |
| Output taps | Multiple taps for stereo image |

---

### 11. x42 Plugins

**Repository**: https://github.com/x42
**Website**: http://x42-plugins.com/
**License**: GPL2
**Author**: Robin Gareus

#### Purpose & Scope

Collection of professional-quality LV2 plugins, particularly notable for:
- **Meters**: Reference-grade level meters (VU, PPM, EBU R128, K-meters)
- **EQ**: fil4.lv2 parametric EQ
- **Auto-tune**: fat1.lv2 based on zita-at1

#### Key Plugins

| Plugin | Purpose | Notable Features |
|--------|---------|------------------|
| meters.lv2 | Audio metering | VU, PPM, EBU R128, K-meters, goniometer |
| fil4.lv2 | 4-band parametric EQ | Based on Fons Adriaensen's fil-plugin |
| fat1.lv2 | Auto-tuner | Based on zita-at1 |
| dpl.lv2 | Digital peak limiter | Look-ahead design |
| darc.lv2 | Compressor | General purpose dynamics |

#### meters.lv2 Types

| Type | Standard | Use Case |
|------|----------|----------|
| VU | Classic | Analog-style mixing |
| PPM | BBC/EBU/DIN/Nordic | Broadcast |
| EBU R128 | Loudness | Mastering, broadcast |
| K-12/K-14/K-20 | Bob Katz | Mastering |
| True Peak | ITU-R BS.1770 | Limiting |
| Goniometer | - | Stereo imaging |

#### Studying x42 Code

The meters code is exemplary for:
- Accurate ballistics (rise/fall times)
- Thread-safe UI updates
- Efficient DSP for analysis

---

## Utilities & Math

### 12. KFR

**Repository**: https://github.com/kfrlib/kfr
**Website**: https://www.kfrlib.com/
**License**: GPL2/GPL3 (or commercial)
**Language**: C++20

#### Purpose & Scope

Fast, modern C++ DSP framework with:
- One of the fastest FFT implementations (faster than FFTW in many cases)
- SIMD-optimized throughout (SSE, AVX, AVX-512, NEON, RISC-V RVV)
- FIR/IIR filter design
- High-quality resampling
- Multi-dimensional tensors

#### Key Features (v6, 2024)

- Multidimensional DFT (any size, including primes)
- Multiarchitecture builds with runtime dispatch
- Windows ARM64 and WebAssembly support
- EBU R128 loudness computation

#### FFT Usage

```cpp
#include <kfr/dft.hpp>
#include <kfr/dsp.hpp>

using namespace kfr;

void fftExample()
{
    // Create complex input
    univector<complex<float>, 1024> input, output;

    // Create DFT plan
    dft_plan<float> plan(1024);

    // Allocate temp buffer
    univector<u8> temp(plan.temp_size);

    // Execute forward FFT
    plan.execute(output, input, temp);

    // Execute inverse FFT
    plan.execute(input, output, temp, true);
}
```

#### Filter Design

```cpp
#include <kfr/dsp.hpp>

using namespace kfr;

void filterDesign()
{
    // Butterworth lowpass, 4th order, cutoff at 0.1 * Nyquist
    zpk<float> filt = iir_lowpass(butterworth<float>(4), 0.1);

    // Convert to biquad sections
    std::vector<biquad_section<float>> sections = to_sos(filt);

    // Create filter processor
    biquad_filter<float> filter(sections);

    // Process
    univector<float, 1024> input, output;
    filter.apply(output, input);
}
```

#### Resampling

```cpp
#include <kfr/dsp.hpp>

using namespace kfr;

void resample()
{
    // Resample from 44100 to 48000
    auto resampler = sample_rate_converter<float>(
        resample_quality::high, 48000, 44100);

    univector<float> input(44100), output(48000);
    resampler.process(output, input);
}
```

#### Build Integration

```cmake
# As submodule
add_subdirectory(kfr)
target_link_libraries(my_plugin PRIVATE kfr)

# Or find installed package
find_package(kfr CONFIG REQUIRED)
target_link_libraries(my_plugin PRIVATE kfr::kfr)
```

---

### 13. SpeexDSP

**Repository**: https://github.com/xiph/speexdsp
**Website**: https://www.speex.org/
**License**: BSD-3
**Language**: C

#### Purpose & Scope

Audio processing library originally part of Speex codec, now standalone. Provides:
- Acoustic Echo Cancellation (AEC)
- Noise Suppression
- Automatic Gain Control (AGC)
- Voice Activity Detection (VAD)
- Resampling

#### Echo Cancellation

```c
#include <speex/speex_echo.h>
#include <speex/speex_preprocess.h>

SpeexEchoState* echo;
SpeexPreprocessState* preprocess;

void init(int sampleRate, int frameSize)
{
    int filterLength = sampleRate / 3;  // ~300ms tail

    echo = speex_echo_state_init(frameSize, filterLength);
    preprocess = speex_preprocess_state_init(frameSize, sampleRate);

    speex_echo_ctl(echo, SPEEX_ECHO_SET_SAMPLING_RATE, &sampleRate);
    speex_preprocess_ctl(preprocess, SPEEX_PREPROCESS_SET_ECHO_STATE, echo);
}

void process(short* mic, short* speaker, short* output, int frameSize)
{
    // Cancel echo from speaker signal in mic signal
    speex_echo_cancellation(echo, mic, speaker, output);

    // Additional noise suppression
    speex_preprocess_run(preprocess, output);
}

void cleanup()
{
    speex_echo_state_destroy(echo);
    speex_preprocess_state_destroy(preprocess);
}
```

#### Noise Suppression Standalone

```c
#include <speex/speex_preprocess.h>

SpeexPreprocessState* preprocess;

void init(int frameSize, int sampleRate)
{
    preprocess = speex_preprocess_state_init(frameSize, sampleRate);

    // Configure noise suppression (dB reduction, default -15)
    int denoise = 1;
    speex_preprocess_ctl(preprocess, SPEEX_PREPROCESS_SET_DENOISE, &denoise);

    int noiseSuppress = -25;  // More aggressive
    speex_preprocess_ctl(preprocess, SPEEX_PREPROCESS_SET_NOISE_SUPPRESS, &noiseSuppress);
}

void process(short* audio, int frameSize)
{
    speex_preprocess_run(preprocess, audio);
}
```

#### Resampler

```c
#include <speex/speex_resampler.h>

SpeexResamplerState* resampler;

void init(int channels, int inRate, int outRate)
{
    int quality = SPEEX_RESAMPLER_QUALITY_DEFAULT;  // 0-10
    int err;
    resampler = speex_resampler_init(channels, inRate, outRate, quality, &err);
}

void process(float* in, unsigned int* inLen, float* out, unsigned int* outLen)
{
    speex_resampler_process_interleaved_float(resampler, in, inLen, out, outLen);
}
```

---

### 14. libsamplerate

**Repository**: https://github.com/libsndfile/libsamplerate
**Website**: http://libsndfile.github.io/libsamplerate/
**API**: https://libsndfile.github.io/libsamplerate/api.html
**License**: BSD-2
**Author**: Erik de Castro Lopo

#### Purpose & Scope

High-quality sample rate conversion. The benchmark against which other resamplers are compared.

**Converter Types**:
| Constant | Quality | CPU | Use Case |
|----------|---------|-----|----------|
| `SRC_SINC_BEST_QUALITY` | Excellent | High | Mastering |
| `SRC_SINC_MEDIUM_QUALITY` | Very Good | Medium | General |
| `SRC_SINC_FASTEST` | Good | Low | Real-time |
| `SRC_ZERO_ORDER_HOLD` | Poor | Minimal | Lo-fi effect |
| `SRC_LINEAR` | Poor | Minimal | Quick preview |

#### Simple API (One-Shot)

```c
#include <samplerate.h>

void convertFile(float* input, int inputFrames, int inputRate,
                 float* output, int outputRate)
{
    SRC_DATA src_data;

    src_data.data_in = input;
    src_data.input_frames = inputFrames;
    src_data.data_out = output;
    src_data.output_frames = (int)(inputFrames * (double)outputRate / inputRate) + 1;
    src_data.src_ratio = (double)outputRate / inputRate;

    int error = src_simple(&src_data, SRC_SINC_BEST_QUALITY, channels);

    if (error)
        printf("Error: %s\n", src_strerror(error));
}
```

#### Full API (Streaming)

```c
#include <samplerate.h>

SRC_STATE* state;

void init(int channels)
{
    int error;
    state = src_new(SRC_SINC_MEDIUM_QUALITY, channels, &error);
}

void process(float* input, int inputFrames, float* output, int* outputFrames, double ratio)
{
    SRC_DATA src_data;

    src_data.data_in = input;
    src_data.input_frames = inputFrames;
    src_data.data_out = output;
    src_data.output_frames = *outputFrames;
    src_data.src_ratio = ratio;
    src_data.end_of_input = 0;  // Set to 1 for final block

    int error = src_process(state, &src_data);

    *outputFrames = src_data.output_frames_gen;
}

void cleanup()
{
    src_delete(state);
}
```

#### Build Integration

```cmake
find_package(PkgConfig REQUIRED)
pkg_check_modules(SAMPLERATE REQUIRED samplerate)

target_include_directories(my_plugin PRIVATE ${SAMPLERATE_INCLUDE_DIRS})
target_link_libraries(my_plugin ${SAMPLERATE_LIBRARIES})
```

---

## Mutable Instruments

### 15. Mutable Instruments Eurorack

**Repository**: https://github.com/pichenettes/eurorack
**Documentation**: https://pichenettes.github.io/mutable-instruments-documentation/
**License**: MIT (STM32), GPL3 (AVR)
**Author**: Émilie Gillet

#### Purpose & Scope

The complete open-source firmware for Mutable Instruments Eurorack modules. This codebase represents some of the most thoughtful and elegant DSP code in existence.

**Why Study This Code**:
- Exceptional algorithm design within CPU constraints
- Clean C++ architecture
- Innovative synthesis techniques
- Production-quality code

#### Repository Structure

```
eurorack/
├── avrlibx/              [AVR microcontroller support]
├── stmlib/               [STM32 support library]
│   ├── dsp/              [Core DSP utilities]
│   │   ├── filter.h      [SVF, DC blocker]
│   │   ├── delay_line.h  [Delay lines]
│   │   ├── dsp.h         [Math utilities]
│   │   └── units.h       [Pitch/frequency conversion]
│   └── utils/            [Ring buffers, random, etc.]
│
├── plaits/               [Macro oscillator 2]
├── rings/                [Resonator]
├── clouds/               [Texture synthesizer]
├── elements/             [Modal synthesizer]
├── braids/               [Macro oscillator 1]
├── warps/                [Meta-modulator]
├── marbles/              [Random sampler]
├── stages/               [Segment generator]
├── tides/                [Tidal modulator]
├── grids/                [Topographic drum sequencer]
└── [many more modules...]
```

#### stmlib DSP Utilities

These utilities are used across all modules:

```cpp
// stmlib/dsp/filter.h
namespace stmlib {

// One-pole lowpass
template<typename T>
class OnePole {
public:
    void Init() { state_ = 0; }
    void set_f(T f) { f_ = f; }

    T Process(T in) {
        state_ += f_ * (in - state_);
        return state_;
    }

private:
    T f_;
    T state_;
};

// State Variable Filter
class Svf {
public:
    void Init();
    void set_f_q(float f, float q);
    void Process(float in);

    float lp() const { return lp_; }
    float bp() const { return bp_; }
    float hp() const { return hp_; }

private:
    float f_, damp_;
    float lp_, bp_, hp_;
};

}  // namespace stmlib
```

---

### Clouds

**Module**: Texture Synthesizer / Granular Processor
**Path**: `eurorack/clouds/`

#### What It Does

Clouds is a granular audio processor that captures audio and replays it as a texture of grains. Features:
- Real-time granular processing
- 4 quality/character modes
- Freeze function
- Pitch shifting
- Reverb tail

#### Key DSP Components

```cpp
// clouds/dsp/granular_processor.h
class GranularProcessor {
public:
    void Process(ShortFrame* input, ShortFrame* output, size_t size);

    void set_position(float position);     // Grain position in buffer
    void set_size(float size);             // Grain size
    void set_pitch(float pitch);           // Pitch shift
    void set_density(float density);       // Grain density
    void set_texture(float texture);       // Grain shape
    void set_dry_wet(float dry_wet);
    void set_stereo_spread(float spread);
    void set_feedback(float feedback);
    void set_reverb(float amount);
    void Freeze(bool freeze);

private:
    GranularSamplePlayer player_;
    Reverb reverb_;
    AudioBuffer<RESOLUTION>* buffer_;
};
```

#### Grain Engine Architecture

```cpp
// clouds/dsp/grain.h
struct Grain {
    float position;           // Position in buffer (0-1)
    float size;               // Duration in samples
    float phase;              // Playback phase (0-1)
    float phase_increment;    // For pitch shifting
    float envelope_phase;     // Window function phase
    float pan;                // Stereo position
};
```

---

### Rings

**Module**: Resonator
**Path**: `eurorack/rings/`

#### What It Does

Rings is a resonator module based on physical modeling:
- Modal synthesis (struck/plucked objects)
- Sympathetic string model
- Inharmonic string (stiff strings)
- FM synthesis mode

#### Key Algorithm: Modal Resonator

```cpp
// rings/dsp/part.h
class Part {
public:
    void Process(const PerformanceState& state,
                 const Patch& patch,
                 const float* in,
                 float* out,
                 float* aux,
                 size_t size);

private:
    Resonator resonator_[kMaxModes];
    // Each mode is a bandpass filter with
    // frequency, amplitude, and decay
};

// rings/dsp/resonator.h
class Resonator {
public:
    void Init();
    void Process(float frequency, float structure,
                 float brightness, float damping,
                 const float* in, float* center, float* sides,
                 size_t size);

private:
    float frequency_, structure_, brightness_, damping_;
    Svf filter_[kMaxModes];  // State variable filters as resonators
};
```

#### Modal Parameters

| Parameter | Effect |
|-----------|--------|
| Frequency | Fundamental pitch |
| Structure | Harmonic spacing (metal → wood → glass) |
| Brightness | High frequency content |
| Damping | Decay time |
| Position | Excitation point on resonator |

---

### Plaits

**Module**: Macro Oscillator 2
**Path**: `eurorack/plaits/`

#### What It Does

Plaits contains 16 synthesis engines in one module:
1. Virtual Analog (saw, square, etc.)
2. Waveshaping
3. FM
4. Grain / Formant
5. Harmonic
6. Wavetable
7. Chords
8. Speech
9. Various physical models

#### Engine Architecture

```cpp
// plaits/dsp/engine/engine.h
class Engine {
public:
    virtual ~Engine() {}
    virtual void Init(BufferAllocator* allocator) = 0;
    virtual void Reset() = 0;
    virtual void Render(const EngineParameters& params,
                        float* out,
                        float* aux,
                        size_t size,
                        bool* already_enveloped) = 0;
};

// Each engine implements this interface
// plaits/dsp/engine/virtual_analog_engine.h
class VirtualAnalogEngine : public Engine {
    // Classic VA oscillator with sync, PWM, sub-osc
};

// plaits/dsp/engine/fm_engine.h
class FMEngine : public Engine {
    // 2-operator FM with various algorithms
};

// plaits/dsp/engine/string_engine.h
class StringEngine : public Engine {
    // Karplus-Strong with refined model
};
```

#### Engine Parameters

```cpp
struct EngineParameters {
    float note;           // MIDI note (with pitch bend)
    float timbre;         // Engine-specific tone control
    float morph;          // Engine-specific morphing
    float harmonics;      // Harmonic content
    TriggerState trigger; // Gate/trigger input
    float accent;         // Accent amount
};
```

---

### Elements

**Module**: Modal Synthesizer
**Path**: `eurorack/elements/`

#### What It Does

Complete voice based on physical modeling:
- Exciter section (bow, blow, strike)
- Resonator section (modal synthesis)
- Built-in reverb

#### Signal Flow

```
Exciter (Bow/Blow/Strike)
    ↓
Modal Resonator (tuned modes)
    ↓
Reverb
    ↓
Output
```

#### Key Classes

```cpp
// elements/dsp/exciter.h
class Exciter {
public:
    void Process(uint8_t flags, float* out, size_t size);

    void set_bow_timbre(float t);
    void set_blow_timbre(float t);
    void set_strike_timbre(float t);
    void set_bow_level(float l);
    void set_blow_level(float l);
    void set_strike_level(float l);
};

// elements/dsp/resonator.h
class Resonator {
public:
    void Process(float* in, float* out, size_t size);

    void set_frequency(float f);
    void set_geometry(float g);      // Mode spacing
    void set_brightness(float b);    // Mode amplitudes
    void set_damping(float d);       // Mode decay
    void set_position(float p);      // Excitation point
};
```

---

### Integration Patterns for Mutable Code

#### Porting to JUCE

```cpp
// Example: Using Plaits engine in JUCE
#include "plaits/dsp/voice.h"

class PlaitsVoice : public juce::SynthesiserVoice
{
public:
    void startNote(int midiNote, float velocity,
                   juce::SynthesiserSound*, int) override
    {
        params_.note = midiNote;
        params_.trigger = plaits::TRIGGER_RISING_EDGE;
        params_.accent = velocity;
    }

    void renderNextBlock(juce::AudioBuffer<float>& buffer,
                         int startSample, int numSamples) override
    {
        float out[kBlockSize];
        float aux[kBlockSize];

        for (int i = 0; i < numSamples; i += kBlockSize) {
            int blockSize = std::min(kBlockSize, numSamples - i);

            bool enveloped;
            voice_.Render(params_, out, aux, blockSize, &enveloped);

            for (int j = 0; j < blockSize; ++j) {
                buffer.addSample(0, startSample + i + j, out[j]);
                buffer.addSample(1, startSample + i + j, aux[j]);
            }

            params_.trigger = plaits::TRIGGER_LOW;
        }
    }

private:
    plaits::Voice voice_;
    plaits::EngineParameters params_;
    static constexpr int kBlockSize = 24;  // Plaits native block size
};
```

#### Memory Considerations

Mutable code is designed for embedded systems with limited RAM. When porting:

```cpp
// Plaits uses its own memory allocator
plaits::BufferAllocator allocator;
allocator.Init(buffer, sizeof(buffer));
voice_.Init(&allocator);

// On desktop, you can allocate more generously
static char buffer[16384 * sizeof(float)];
```

---

## Anti-Aliasing Techniques

### 16. PolyBLEP

**Reference**: [Martin Finke's Tutorial](https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/)
**Implementation**: https://github.com/martinfinke/PolyBLEP

#### Purpose & Scope

PolyBLEP (Polynomial Bandlimited Step) is an efficient anti-aliasing technique for geometric waveforms. It:
- Corrects discontinuities in naive waveforms
- Uses simple polynomial evaluation
- Only processes 2 samples per discontinuity
- No precomputed tables required

#### How It Works

1. Generate naive waveform
2. At each discontinuity (e.g., saw reset), add correction
3. Correction is a polynomial approximation of ideal BLEP

#### Implementation

```cpp
class PolyBLEPOscillator {
public:
    void setFrequency(float freq, float sampleRate) {
        phaseIncrement = freq / sampleRate;
    }

    float nextSample() {
        float t = phase / phaseIncrement;  // Normalized distance from edge

        // Naive sawtooth: 2*phase - 1
        float value = 2.0f * phase - 1.0f;

        // Apply PolyBLEP correction at discontinuity
        value -= polyBLEP(t);

        // Advance phase
        phase += phaseIncrement;
        if (phase >= 1.0f) phase -= 1.0f;

        return value;
    }

private:
    // PolyBLEP correction function
    float polyBLEP(float t) {
        float dt = phaseIncrement;

        // 0 <= t < 1 (just after discontinuity)
        if (t < dt) {
            t /= dt;
            return t + t - t * t - 1.0f;
        }
        // -1 < t < 0 (just before discontinuity)
        else if (t > 1.0f - dt) {
            t = (t - 1.0f) / dt;
            return t * t + t + t + 1.0f;
        }
        return 0.0f;
    }

    float phase = 0.0f;
    float phaseIncrement = 0.0f;
};
```

#### Square Wave with PolyBLEP

```cpp
float squareWave() {
    float t = phase / phaseIncrement;

    // Naive square
    float value = (phase < pulseWidth) ? 1.0f : -1.0f;

    // Correct rising edge
    value += polyBLEP(t);

    // Correct falling edge
    value -= polyBLEP(fmod(t + (1.0f - pulseWidth) / phaseIncrement, 1.0f / phaseIncrement));

    phase += phaseIncrement;
    if (phase >= 1.0f) phase -= 1.0f;

    return value;
}
```

---

### 17. MinBLEP

**Reference**: "Hard Sync Without Aliasing" (Eli Brandt, 2001)

#### Purpose & Scope

MinBLEP (Minimum-phase Bandlimited Step) provides better anti-aliasing than PolyBLEP but requires:
- Precomputed lookup table
- More complex implementation
- Slightly more CPU

#### Key Difference from PolyBLEP

- **PolyBLEP**: Symmetric correction, some pre-ringing
- **MinBLEP**: All ringing after discontinuity, lower latency

#### Precomputed Table Generation

```cpp
// Generate minBLEP table at compile time or init
void generateMinBLEP(float* table, int tableSize, int oversampling) {
    // 1. Generate bandlimited impulse (windowed sinc)
    // 2. Integrate to get step response
    // 3. Apply minimum-phase transform (Hilbert)
    // 4. Store oversampled version in table

    // This is complex - use existing implementation from
    // Surge or VCV Rack as reference
}
```

#### Usage Pattern

```cpp
class MinBLEPOscillator {
public:
    void addDiscontinuity(float fractionalDelay, float amplitude) {
        // Add correction to ring buffer
        for (int i = 0; i < minBLEPLength; ++i) {
            float tablePos = i + fractionalDelay * oversampling;
            float correction = interpolateTable(tablePos) * amplitude;
            ringBuffer[(ringIndex + i) % ringBufferSize] += correction;
        }
    }

    float getSample() {
        float out = ringBuffer[ringIndex];
        ringBuffer[ringIndex] = 0.0f;
        ringIndex = (ringIndex + 1) % ringBufferSize;
        return out;
    }

private:
    std::vector<float> ringBuffer;
    int ringIndex = 0;
    static const float minBLEPTable[];
};
```

---

## Integration Patterns

### Pattern 1: Faust in JUCE Project

```cpp
// Use faust2api to generate a DSP class, then wrap it

#include "FaustReverb.h"  // Generated by faust2api

class ReverbProcessor : public juce::AudioProcessor {
    std::unique_ptr<FaustReverb> faust;

    void prepareToPlay(double sr, int bs) override {
        faust = std::make_unique<FaustReverb>();
        faust->init(sr);
        faust->buildUserInterface(&ui);  // Connect parameters
    }

    void processBlock(juce::AudioBuffer<float>& b, juce::MidiBuffer&) override {
        faust->compute(b.getNumSamples(),
                       b.getArrayOfReadPointers(),
                       b.getArrayOfWritePointers());
    }
};
```

### Pattern 2: HIIR Oversampling Wrapper

```cpp
template<typename Processor, int Factor>
class OversampledProcessor {
public:
    void init() {
        double coefs[8];
        hiir::PolyphaseIir2Designer::compute_coefs_spec_order_tbw(coefs, 8, 0.1);
        for (auto& up : upsamplers) up.set_coefs(coefs);
        for (auto& down : downsamplers) down.set_coefs(coefs);
    }

    void process(float* io, int samples) {
        float upsampled[samples * Factor];

        // Cascade upsample
        float* current = io;
        for (int stage = 0; stage < stages; ++stage) {
            upsamplers[stage].process_block(upsampled, current, samples << stage);
            current = upsampled;
        }

        // Process at high rate
        for (int i = 0; i < samples * Factor; ++i)
            upsampled[i] = processor.process(upsampled[i]);

        // Cascade downsample
        for (int stage = stages - 1; stage >= 0; --stage) {
            downsamplers[stage].process_block(io, upsampled, samples << stage);
        }
    }

private:
    static constexpr int stages = /* log2(Factor) */;
    Processor processor;
    std::array<hiir::Upsampler2xSse<8>, stages> upsamplers;
    std::array<hiir::Downsampler2xSse<8>, stages> downsamplers;
};
```

### Pattern 3: Mutable Module in Voice

```cpp
#include "plaits/dsp/engine/virtual_analog_engine.h"

class SynthVoice {
public:
    void init() {
        allocator.Init(buffer, sizeof(buffer));
        engine.Init(&allocator);
    }

    void render(float* out, float* aux, int samples) {
        plaits::EngineParameters params;
        params.note = currentNote;
        params.timbre = timbre;
        params.morph = morph;
        params.harmonics = harmonics;
        params.trigger = gate ? plaits::TRIGGER_HIGH : plaits::TRIGGER_LOW;

        bool enveloped;
        engine.Render(params, out, aux, samples, &enveloped);
    }

private:
    plaits::VirtualAnalogEngine engine;
    plaits::BufferAllocator allocator;
    char buffer[4096];
    float currentNote, timbre, morph, harmonics;
    bool gate;
};
```

---

## Library Selection Guide

### By Task

| Task | Recommended | Notes |
|------|-------------|-------|
| **Time-Stretch (Quality)** | Rubber Band | GPL, industry standard |
| **Time-Stretch (MIT)** | Signalsmith Stretch | Header-only, MIT license |
| **Pitch Shift** | Rubber Band | Or Signalsmith for MIT |
| **Granular** | Mutable Clouds | Study the code |
| **Physical Modeling** | Mutable Elements/Rings | Modal synthesis |
| **Wavetable** | Vital | Or Surge oscillators |
| **FFT** | KFR | Faster than FFTW |
| **Resampling (Quality)** | libsamplerate | Benchmark standard |
| **Resampling (Speed)** | HIIR | For oversampling |
| **Algorithmic Reverb** | zita-rev1 | Natural decay |
| **Convolution** | zita-convolver | Large IR support |
| **Echo Cancellation** | SpeexDSP | Voice applications |
| **Anti-Aliasing** | PolyBLEP | Simple, effective |
| **Prototyping** | Faust | Quick iteration |
| **Metering** | x42 | Reference quality |

### By License Requirements

| License | Libraries |
|---------|-----------|
| **MIT/BSD** | Signalsmith Stretch, libsamplerate, SpeexDSP, Mutable (STM32) |
| **GPL2** | HIIR (WTFPL), Rubber Band, KFR, zita-*, x42 |
| **GPL3** | Vital, Surge, Mutable (AVR), zita-convolver |
| **Commercial Available** | Rubber Band, KFR |

---

## Build Configuration

### CMake Integration Example

```cmake
# Example CMakeLists.txt integrating multiple libraries

cmake_minimum_required(VERSION 3.15)
project(MySynth)

# JUCE
add_subdirectory(JUCE)

# Header-only libraries (just include paths)
target_include_directories(MySynth PRIVATE
    libs/hiir
    libs/signalsmith-stretch
    libs/polyblep
)

# Libraries requiring compilation
add_subdirectory(libs/rubberband)
target_link_libraries(MySynth PRIVATE rubberband)

# pkg-config libraries
find_package(PkgConfig REQUIRED)
pkg_check_modules(SAMPLERATE REQUIRED samplerate)
target_link_libraries(MySynth PRIVATE ${SAMPLERATE_LIBRARIES})

# KFR (if using)
find_package(kfr CONFIG)
if(kfr_FOUND)
    target_link_libraries(MySynth PRIVATE kfr::kfr)
endif()

# Mutable Instruments (copy needed files)
target_sources(MySynth PRIVATE
    libs/eurorack/plaits/dsp/voice.cc
    libs/eurorack/plaits/dsp/engine/virtual_analog_engine.cc
    # ... other engines as needed
)
target_include_directories(MySynth PRIVATE libs/eurorack)
```

### Compiler Flags

```cmake
# For performance-critical DSP
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
    target_compile_options(MySynth PRIVATE
        -ffast-math
        -O3
        -march=native  # Or specific: -msse4.2 -mavx2
    )
endif()

# For SIMD
target_compile_definitions(MySynth PRIVATE
    __SSE2__
    __SSE3__
    __SSSE3__
    __SSE4_1__
)
```

---

## References & Resources

### Documentation
- [Faust Documentation](https://faustdoc.grame.fr/)
- [KFR Documentation](https://www.kfrlib.com/docs/)
- [Rubber Band API](https://breakfastquay.com/rubberband/code-doc/)
- [libsamplerate API](https://libsndfile.github.io/libsamplerate/api.html)
- [Mutable Instruments Documentation](https://pichenettes.github.io/mutable-instruments-documentation/)

### Academic Papers
- Dattorro, J. (1997). "Effect Design Part 1: Reverberator and Other Filters"
- Välimäki, V. et al. (2010). "Alias-Suppressed Oscillators Based on Differentiated Polynomial Waveforms"
- Brandt, E. (2001). "Hard Sync Without Aliasing"

### Communities
- [KVR Audio DSP Forum](https://www.kvraudio.com/forum/viewforum.php?f=33)
- [The Audio Programmer Discord](https://www.theaudioprogrammer.com/)
- [JUCE Forum](https://forum.juce.com/)

---

*This document is part of the Studio synthesizer development system. Update as new libraries are evaluated and integrated.*
