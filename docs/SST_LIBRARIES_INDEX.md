# SST (Surge Synth Team) Submodule Libraries Index

## Comprehensive Reference Guide for Surge Synthesizer DSP Architects

**Version**: 1.0
**Last Updated**: November 2025
**Repository**: https://github.com/surge-synthesizer/surge
**Status**: Active & Maintained

---

## Table of Contents

1. [Overview](#overview)
2. [Library Ecosystem](#library-ecosystem)
3. [Quick Reference Matrix](#quick-reference-matrix)
4. [Detailed Library Documentation](#detailed-library-documentation)
5. [Integration Patterns](#integration-patterns)
6. [Usage Examples](#usage-examples)
7. [Build Configuration](#build-configuration)

---

## Overview

The Surge Synthesizer leverages 8 critical SST (Surge Synth Team) libraries that provide reusable, high-performance DSP building blocks. These libraries are designed for:

- **Modularity**: Each library serves a specific DSP domain
- **Performance**: SIMD-optimized with SSE2/AVX support
- **Reusability**: Used across Surge XT, Surge FX, and external projects
- **Standardization**: Common patterns and interfaces across all libraries

All SST libraries:
- Use C++20 as the baseline standard
- Are header-only or minimal compilation
- Support cross-platform building (Linux, macOS, Windows)
- Follow the Surge Synth Team's architectural patterns
- Integrate via CMake's `add_subdirectory()` mechanism

---

## Library Ecosystem

```
SST Libraries (libs/sst/)
├── sst-cmake                 [Build Infrastructure]
├── sst-cpputils              [C++ Utilities & Helpers]
├── sst-basic-blocks          [Fundamental DSP Building Blocks]
├── sst-plugininfra           [Plugin Infrastructure]
├── sst-filters               [Filter Implementations]
├── sst-waveshapers           [Waveshaping Algorithms]
├── sst-effects               [Audio Effect Processors]
└── sst-jucegui               [JUCE GUI Component Library]
```

---

## Quick Reference Matrix

| Library | Purpose | Key Components | Usage in Surge | DSP Focus |
|---------|---------|------------------|-----------------|-----------|
| **sst-cmake** | Build system configuration | CMake modules & helpers | Build infrastructure | N/A |
| **sst-cpputils** | C++ utilities | String ops, constructors | Across all modules | Language support |
| **sst-basic-blocks** | Fundamental DSP blocks | Oscillators, interpolators, SIMD ops | Oscillators, filters, voices | Wave generation |
| **sst-plugininfra** | Plugin infrastructure | CPU detection, file paths, native UI | Core infrastructure | Platform abstraction |
| **sst-filters** | Filter implementations | Biquad, ladder, SVF, ring mod filters | QuadFilterChain, distortion | Frequency domain |
| **sst-waveshapers** | Waveshaping algorithms | Quad waveshaper states, distortion models | DistortionEffect, filter chain | Nonlinear |
| **sst-effects** | Effect processors | Delay, reverb, phaser, flanger | 9+ effects (Delay, Reverb1, etc.) | Time/frequency domain |
| **sst-jucegui** | GUI components | Knobs, sliders, style system | Surge XT GUI rendering | Visualization |

---

## Detailed Library Documentation

### 1. sst-cmake

**Location**: `/libs/sst/sst-cmake`
**Purpose**: CMake build infrastructure and modules
**Status**: Essential for all builds

#### Purpose & Scope
Provides standardized CMake functions and configuration used across all Surge builds:
- Cross-platform compiler settings
- SSE/AVX detection and configuration
- Common library addition patterns
- Version management

#### Key Components
- `surge_add_lib_subdirectory()` - Custom function for adding libraries
- Compiler flag configuration for all platforms
- SIMD detection and enablement
- Target property setup

#### Integration Pattern
```cmake
# In root CMakeLists.txt (line 255)
add_subdirectory(libs/sst/sst-cmake)

# In src/common/CMakeLists.txt (line 30+)
surge_add_lib_subdirectory(sst/sst-cpputils)
surge_add_lib_subdirectory(sst/sst-basic-blocks)
```

#### Main Usage
Build-time configuration only - provides utilities to other libraries and Surge build system

---

### 2. sst-cpputils

**Location**: `/libs/sst/sst-cpputils`
**GitHub**: https://github.com/surge-synthesizer/sst-cpputils
**Purpose**: C++ language utilities and helpers
**Status**: Foundational dependency for all other SST libraries

#### Key Features
- **Constructors**: Utility macros for rule-of-five compliance
- **String Operations**: Efficient string manipulation
- **Type Traits**: Template metaprogramming utilities
- **Format Support**: String formatting helpers

#### Main Header
```
include/sst/cpputils.h
include/sst/cpputils/constructors.h
```

#### Usage in Surge
Imported by other SST libraries for fundamental C++ support:
- Parameter metadata strings
- Type-safe constructors
- Cross-platform string handling

#### Example Usage
```cpp
#include "sst/cpputils.h"

// Using constructors pattern
struct MyDSPClass
{
    SURGE_COPY_CONSTRUCT(MyDSPClass)
    SURGE_MOVE_CONSTRUCT(MyDSPClass)
};
```

#### Build Integration
```cmake
# src/common/CMakeLists.txt (line 30)
surge_add_lib_subdirectory(sst/sst-cpputils)

# Link in common library (line 342)
target_link_libraries(surge-common PUBLIC sst-cpputils)
```

---

### 3. sst-basic-blocks (CRITICAL LIBRARY)

**Location**: `/libs/sst/sst-basic-blocks`
**GitHub**: https://github.com/surge-synthesizer/sst-basic-blocks
**Purpose**: Fundamental DSP building blocks - oscillators, interpolators, SIMD operations, noise generation
**Status**: Core DSP infrastructure; heavily used throughout Surge

#### Architecture Layers

```
sst-basic-blocks/
├── dsp/                      [DSP Algorithms]
│   ├── QuadratureOscillators.h    [Quad sine/cos generators]
│   ├── Interpolators.h            [Linear, cubic, sinc interpolation]
│   ├── BlockInterpolators.h       [Block-size interpolators]
│   ├── FastMath.h                 [Fast transcendental functions]
│   ├── CorrelatedNoise.h          [Noise generation]
│   ├── Clippers.h                 [Hard/soft clipping]
│   ├── Lag.h                      [Lag filters]
│   ├── MidSide.h                  [M/S encoding/decoding]
│   ├── LanczosResampler.h         [High-quality resampling]
│   ├── SSESincDelayLine.h         [SIMD delay lines]
│   └── OscillatorDriftUnisonCharacter.h [Detuning]
│
├── mechanics/                [Mechanical Operations]
│   ├── block-ops.h           [Block-wide operations]
│   ├── simd-ops.h            [SIMD-specific operations]
│   └── endian-ops.h          [Endianness handling]
│
├── modulators/               [Modulation Utilities]
│   └── FXModControl.h        [Effect modulation control]
│
├── params/                   [Parameter Infrastructure]
│   └── ParamMetadata.h       [Parameter metadata descriptors]
│
├── simd/                     [SIMD Support]
│   ├── setup.h               [SIMD type setup and selection]
│   └── wrap_simd_f32x4.h     [SIMD vector wrappers]
│
└── tables/                   [Lookup Tables]
    └── SincTableProvider.h   [Sinc interpolation tables]
```

#### Critical Components

##### QuadratureOscillators.h
Generates 4 parallel sine/cosine pairs at arbitrary phase:

```cpp
// From QuadratureOscillators.h
template<typename FLOAT>
struct QuadratureOscillator
{
    FLOAT sin, cos;          // Current sine/cosine values
    void setPhase(FLOAT p);  // Set oscillator phase [0, 1]
    void step();             // Advance to next sample
    void stepSize(FLOAT f);  // Set frequency
};
```

**Usage in Surge**:
- FM oscillators (Oscillator.cpp)
- LFO modulation sources
- Quadrature signal processing

##### Interpolators.h
Multiple interpolation types for wavetable synthesis:

```cpp
// Linear interpolation
float linear(const float *table, int tableSize, float phase);

// Cubic Hermite
float cubic(const float *table, int tableSize, float phase);

// High-quality sinc
float sinc(const float *table, int tableSize, float phase);

// Lanczos resampling
class LanczosResampler { /* ... */ };
```

**Surge Uses**: Wavetable oscillators, resampling in Delay effects

##### SIMD Operations (simd/setup.h, simd/wrap_simd_f32x4.h)

Core SIMD abstraction layer:

```cpp
// SIMD_M128 = __m128 (SSE2 vector of 4 floats)
typedef __m128 SIMD_M128;

// SIMD operations macros
#define SIMD_MM(x) _mm_##x  // x64
#define SIMD_MM(x) _mm256_##x  // AVX

// Wrapped vector operations
struct wrap_simd_float32x4
{
    float data[4];
    // Provides arithmetic operators
};
```

**Surge Uses**: QuadFilterChain SIMD parallel voice processing (4 voices simultaneously)

##### ParamMetadata.h

Metadata descriptor for DSP parameters:

```cpp
namespace sst::basic_blocks::params
{
    struct ParamMetaData
    {
        enum Type { FLOAT, INT, NONE };

        std::string name;
        Type type;
        float defaultVal, minVal, maxVal;
        bool canTemposync, canDeform, canExtend, canDeactivate;
        bool canAbsolute, supportsStringConversion;
    };
}
```

**Surge Uses**: Effect parameter configuration (see SurgeSSTFXAdapter.h)

#### Includes Used in Surge

```cpp
#include "sst/basic-blocks/dsp/QuadratureOscillators.h"     // Oscillators
#include "sst/basic-blocks/dsp/Interpolators.h"            // Wavetable
#include "sst/basic-blocks/dsp/FastMath.h"                 // Math
#include "sst/basic-blocks/dsp/CorrelatedNoise.h"          // Noise gen
#include "sst/basic-blocks/dsp/Clippers.h"                 // Distortion
#include "sst/basic-blocks/dsp/Lag.h"                      // Smoothing
#include "sst/basic-blocks/dsp/MidSide.h"                  // Stereo processing
#include "sst/basic-blocks/dsp/LanczosResampler.h"         // Resampling
#include "sst/basic-blocks/mechanics/block-ops.h"          // Block operations
#include "sst/basic-blocks/mechanics/simd-ops.h"           // SIMD utilities
#include "sst/basic-blocks/mechanics/endian-ops.h"         // Endian handling
#include "sst/basic-blocks/modulators/FXModControl.h"      // Effect mod control
#include "sst/basic-blocks/params/ParamMetadata.h"         // Param descriptors
#include "sst/basic-blocks/simd/setup.h"                   // SIMD types
#include "sst/basic-blocks/simd/wrap_simd_f32x4.h"         // SIMD wrapper
#include "sst/basic-blocks/tables/SincTableProvider.h"     // Sinc tables
```

#### Build Configuration
```cmake
# src/common/CMakeLists.txt (lines 31-32)
set(SST_BASIC_BLOCKS_SIMD_OMIT_NATIVE_ALIASES ON)
surge_add_lib_subdirectory(sst/sst-basic-blocks)

# Link in surge-common (line 350)
target_link_libraries(surge-common PUBLIC sst-basic-blocks)
```

#### Real-World Usage Examples

**In SurgeVoice.cpp** - Using quadrature oscillators:
```cpp
#include "sst/basic-blocks/dsp/QuadratureOscillators.h"

// Process FM oscillators
for (int i = 0; i < n_oscs; i++) {
    quadadv[i].process_block(oscPhase[i], oscFreq[i]);
}
```

**In QuadFilterChain** - SIMD vector operations:
```cpp
#include "sst/basic-blocks/simd/wrap_simd_f32x4.h"

// Process 4 voices simultaneously
SIMD_M128 input = SIMD_MM(load_ps)((float*)inputData);
SIMD_M128 output = filterFunction(input);
```

---

### 4. sst-plugininfra

**Location**: `/libs/sst/sst-plugininfra`
**GitHub**: https://github.com/surge-synthesizer/sst-plugininfra
**Purpose**: Plugin infrastructure, platform abstraction, file/path utilities
**Status**: Essential for cross-platform support

#### Key Components

```
sst-plugininfra/include/
├── sst/plugininfra/
│   ├── cpufeatures.h          [CPU capability detection]
│   ├── paths.h                [Cross-platform file paths]
│   ├── userdefaults.h         [User preference storage]
│   ├── keybindings.h          [Keyboard handling]
│   ├── misc_platform.h        [Platform-specific utilities]
│   ├── strnatcmp.h            [Natural string comparison]
│   └── filesystem/tinyxml/    [Embedded libraries]
```

##### cpufeatures.h
Runtime CPU capability detection:

```cpp
namespace sst::plugininfra::cpufeatures
{
    struct CPUFeatures
    {
        bool sse2, avx, avx512f, neon, // SIMD support
             fma, aes, etc.
    };

    CPUFeatures getCPUFeatures();  // Detect at runtime
}
```

**Surge Uses**:
- Determining SIMD support for filter/effect processing
- Referenced in DSPUtils.h for CPU feature checks

##### paths.h
Cross-platform file path handling:

```cpp
namespace sst::plugininfra::paths
{
    // Get system directories
    std::string userDocumentsPath();
    std::string userHomeDirectory();
    std::string userMusicDirectory();

    // Plugin-specific paths
    std::string pluginUserPresetPath(const std::string& pluginName);
    std::string pluginUserDataPath(const std::string& pluginName);
}
```

**Surge Uses**: Patch storage, user preset locations

##### strnatcmp.h
Natural string comparison (e.g., "File 1" < "File 10"):

```cpp
int strnatcmp(const char *a, const char *b);
int strnatcasecmp(const char *a, const char *b);
```

**Surge Uses**: Sorting patches, waveshapes by natural order

#### Includes Used in Surge

```cpp
#include "sst/plugininfra/cpufeatures.h"      // CPU detection
#include "sst/plugininfra/paths.h"            // File paths
#include "sst/plugininfra/userdefaults.h"    // Preferences
#include "sst/plugininfra/keybindings.h"     // Input handling
#include "sst/plugininfra/misc_platform.h"   // Platform utils
#include "sst/plugininfra/strnatcmp.h"       // String comparison
```

#### Build Integration
```cmake
# src/common/CMakeLists.txt (line 33)
surge_add_lib_subdirectory(sst/sst-plugininfra)

# Link libraries (lines 343-346)
target_link_libraries(surge-common PUBLIC
    sst-plugininfra
    sst-plugininfra::filesystem
    sst-plugininfra::tinyxml
    sst-plugininfra::strnatcmp
)
```

#### Usage Example

**In Surge file handling**:
```cpp
#include "sst/plugininfra/paths.h"

std::string userPresetPath =
    sst::plugininfra::paths::userDocumentsPath() + "/Surge XT/Patches";
```

---

### 5. sst-filters (CRITICAL LIBRARY)

**Location**: `/libs/sst/sst-filters`
**GitHub**: https://github.com/surge-synthesizer/sst-filters
**Purpose**: Filter implementations (30+ filter types)
**Status**: Core audio processing; heavily optimized for SIMD

#### Filter Type Implementations

```
sst-filters/include/sst/filters/
├── QuadFilterUnit.h           [4-voice filter processing]
├── QuadFilterUnitState.h      [Filter state container]
├── BiquadFilter.h             [IIR biquad filters]
├── HalfRateFilter.h           [Halfband anti-alias filter]
├── FilterPlotter.h            [Frequency response visualization]
└── [30+ filter implementations]
    ├── Moog ladder filters (1-4 pole)
    ├── Steiner-Parker ladder
    ├── K35 ladder variations
    ├── Diode ladder filter
    ├── OB-Xd ladder
    ├── SVF (State Variable Filter)
    ├── Comb filters
    ├── Ring modulation filter
    ├── Formant filters
    └── Plus more...
```

##### QuadFilterUnitState.h
Container for SIMD-parallel filter state:

```cpp
namespace sst::filters
{
    struct alignas(16) QuadFilterUnitState
    {
        // 4-voice parallel processing
        SIMD_M128 active;           // Which voices are active
        SIMD_M128 C[3], D[3];      // Filter coefficients
        SIMD_M128 R[4], Q[4];      // Internal states

        // Configuration
        float cutoff, resonance, drive, model;
        int type;  // Filter type ID
    };
}
```

**Surge Uses**: QuadFilterChain processes up to 4 voices simultaneously

##### BiquadFilter.h
Standard 2nd-order IIR filter:

```cpp
namespace sst::filters
{
    struct Biquad
    {
        float a[3], b[3];          // IIR coefficients
        float z[2];                // State (2nd order)

        float process(float input);
        void setCutoff(float freq, float resonance);

        // Tuning adapters
        template<typename GS>
        struct DefaultTuningAndDBAdapter { /* ... */ };
    };
}
```

**Surge Uses**:
- Distortion effect EQ pre/post-processing
- Delay effect filtering
- General-purpose low/high-pass filtering

##### QuadFilterUnit.h
High-level filter processing interface:

```cpp
// Function pointer type
typedef SIMD_M128 (*FilterUnitQFPtr)(
    QuadFilterUnitState &u,
    SIMD_M128 in
);

// Get appropriate filter function
FilterUnitQFPtr GetQFPtrFilterUnit(
    int type,           // Filter type (0-30+)
    int subtype         // Variation
);
```

**Surge Uses**: QuadFilterChain::ProcessFBQuad() to route voices

#### Filter Types Available

Surge supports 30+ filter types including:

```
Analog Emulations (Ladder Filters):
- Moog 1-pole, 2-pole, 3-pole, 4-pole
- Steiner-Parker ladder (1-4 pole)
- K35 ladder (1-pole, 2-pole)
- K35 EX ladder (with drive)
- Diode ladder
- OB-Xd ladder

SVF (State Variable):
- High-pass, Low-pass, Band-pass, Notch
- Morphing variants

Other Types:
- Comb (integer and fractional delay)
- Comb++ (extended range)
- Ring modulation filter
- Formant (vowel synthesis)
- Vog (vocal-like)
- Allpass
- Plus more...
```

#### Includes Used in Surge

```cpp
#include "sst/filters.h"                    // All filter types
#include "sst/filters/BiquadFilter.h"       // Biquad filters
#include "sst/filters/HalfRateFilter.h"     // Halfband filters
#include "sst/filters/FilterPlotter.h"      // Visualization
#include "sst/filters/QuadFilterUnit.h"     // Voice processing
```

#### Build Configuration
```cmake
# src/common/CMakeLists.txt (line 34)
surge_add_lib_subdirectory(sst/sst-filters)

# Link (lines 347-348)
target_link_libraries(surge-common PUBLIC
    sst-filters
    sst-filters-extras  # Extra components
)
```

#### Real-World Usage

**In QuadFilterChain.h** (line 37):
```cpp
#include "sst/filters/QuadFilterUnitState.h"

struct QuadFilterChainState
{
    // 4 filter units for stereo processing
    sst::filters::QuadFilterUnitState FU[4];
};
```

**In DistortionEffect.h** (line 29):
```cpp
#include "sst/filters/BiquadFilter.h"

class DistortionEffect : public Effect
{
    BiquadFilter band1, band2, lp1, lp2;  // For EQ
};
```

**In Distortion processing loop**:
```cpp
// Apply pre-EQ
x = band1.process(x);
x = band2.process(x);

// Apply waveshaping
x = waveshaper.process(x);

// Apply post-EQ
x = lp1.process(x);
x = lp2.process(x);
```

---

### 6. sst-waveshapers

**Location**: `/libs/sst/sst-waveshapers`
**GitHub**: https://github.com/surge-synthesizer/sst-waveshapers
**Purpose**: Nonlinear waveshaping algorithms for distortion and tonal shaping
**Status**: Used in filter chain and distortion effects

#### Architecture

```
sst-waveshapers/include/sst/waveshapers/
├── QuadWaveshaperState.h      [Parallel waveshaper state (4-voice)]
├── WaveshapeState.h           [Single waveshaper state]
├── current/                   [Current algorithm implementations]
│   ├── Tanh.h                 [Hyperbolic tangent]
│   ├── Hard.h                 [Hard clipping]
│   ├── Soft.h                 [Soft clipping]
│   ├── AsymWaveShaper.h       [Asymmetric shaping]
│   └── Plus other distortion models...
└── legacy/                    [Historical implementations]
```

##### QuadWaveshaperState.h
Parallel waveshaper for 4 voices:

```cpp
namespace sst::waveshapers
{
    struct QuadWaveshaperState
    {
        // Parallel SIMD processing (4 voices)
        SIMD_M128 R[3], Q[3];      // State variables
        SIMD_M128 drive;           // Drive level
        SIMD_M128 output;          // Last output

        int type;                  // Waveshaper type
    };
}
```

**Surge Uses**:
- QuadFilterChain waveshaper slot
- Applied between filter units
- Can be bypassed per-filter-chain

##### Waveshaper Types Available

```
Linear Shaping:
- Soft clipping (smooth saturation)
- Hard clipping (brick-wall limiting)
- Asymmetric waveshaping (even/odd harmonics)

Nonlinear Models:
- Tanh saturation (transistor-like)
- Diode clipping
- Tube emulation
- And more...
```

#### Includes Used in Surge

```cpp
#include "sst/waveshapers.h"  // All waveshaper types
```

#### Build Configuration
```cmake
# src/common/CMakeLists.txt (lines 35-37)
surge_add_lib_subdirectory(sst/sst-waveshapers)
target_compile_definitions(sst-waveshapers INTERFACE SURGE_XT_1X_WST=1)
```

#### Real-World Usage

**In QuadFilterChain.h** (line 40):
```cpp
struct QuadFilterChainState
{
    // 2 waveshaper units (L/R channels)
    sst::waveshapers::QuadWaveshaperState WSS[2];
};
```

**In DistortionEffect.h** (line 38):
```cpp
class DistortionEffect : public Effect
{
    sst::waveshapers::QuadWaveshaperState wsState alignas(16);
    // ...
    void process(float *dataL, float *dataR) override
    {
        // Shape signal
        wsState.process(input_data);
    }
};
```

---

### 7. sst-effects (CRITICAL LIBRARY)

**Location**: `/libs/sst/sst-effects`
**GitHub**: https://github.com/surge-synthesizer/sst-effects
**Purpose**: Audio effect processors (delay, reverb, modulation, etc.)
**Status**: Powers Surge's effect chain; template-based architecture

#### Effect Modules

```
sst-effects/include/sst/effects/
├── Bonsai.h                   [Resonant comb filter]
├── Delay.h                    [Multi-tap delay]
├── Flanger.h                  [Flanger modulation effect]
├── FloatyDelay.h              [Pitched delay]
├── Nimbus.h                   [Cloud/spectral effect]
├── NimbusImpl.h                [Nimbus implementation]
├── Phaser.h                   [Phaser modulation]
├── Reverb1.h                  [Classic reverb]
├── Reverb2.h                  [Advanced reverb]
├── RotarySpeaker.h            [Leslie speaker emulation]
├── TreeMonster.h              [Wavescanning effect]
└── EffectCore.h               [Base effect interface]
```

##### EffectCore.h
Template-based effect interface:

```cpp
namespace sst::effects
{
    template<typename FXConfig>
    class EffectBase
    {
    public:
        // Configuration template
        static constexpr uint16_t blockSize = FXConfig::blockSize;
        using GlobalStorage = FXConfig::GlobalStorage;
        using EffectStorage = FXConfig::EffectStorage;

        // Virtual methods
        virtual void initialize() = 0;
        virtual void processBlock(float *L, float *R) = 0;
        virtual void suspendProcessing() = 0;
        virtual int getRingoutDecay() = 0;

        // Parameter access via FXConfig
        static float floatValueAt(const Effect *e, const pdata *v, int idx)
        {
            return FXConfig::floatValueAt(e, v, idx);
        }
    };
}
```

##### Effect Template Pattern

Each effect follows this pattern:

```cpp
// Generic template
namespace sst::effects::delay
{
    template<typename FXConfig>
    class Delay : public EffectBase<FXConfig>
    {
    public:
        static constexpr int numParams = 12;

        void initialize() override { /* ... */ }
        void processBlock(float *L, float *R) override { /* ... */ }

        static ParamMetaData paramAt(int idx);  // Metadata
        static const char* effectName;
    };
}
```

##### Surge Integration (SurgeSSTFXAdapter.h)

Surge bridges the gap between its Effect interface and SST effect templates:

```cpp
namespace surge::sstfx
{
    // Config adapter
    struct SurgeFXConfig
    {
        static constexpr uint16_t blockSize{BLOCK_SIZE};
        using BaseClass = Effect;
        using GlobalStorage = SurgeStorage;
        using EffectStorage = FxStorage;
        using ValueStorage = pdata;

        // Static query methods
        static float floatValueAt(const Effect *e, const pdata *v, int idx)
        {
            return *(e->pd_float[idx]);
        }
        // ... etc
    };

    // Bridge class
    template<typename T>
    class SurgeSSTFXBase : T
    {
        void init() override { T::initialize(); }
        void process(float *L, float *R) override { T::processBlock(L, R); }
    };
}
```

**Example Effect**:
```cpp
// DelayEffect.h
class DelayEffect : public surge::sstfx::SurgeSSTFXBase<
    sst::effects::delay::Delay<surge::sstfx::SurgeFXConfig>>
{
    // Thin wrapper - delegates to sst::effects::delay::Delay
};
```

#### Effects Implemented in sst-effects

1. **Bonsai** - Resonant comb filter with feedback
2. **Delay** - Multi-tap delay with feedback, filtering
3. **Flanger** - Classic LFO-modulated flanger
4. **FloatyDelay** - Pitch-shifting delay
5. **Nimbus** - Cloud/spectral processing
6. **Phaser** - Cascaded allpass modulation
7. **Reverb1** - Algorithmic reverb (Schroeder)
8. **Reverb2** - Advanced reverb algorithm
9. **RotarySpeaker** - Leslie speaker simulation
10. **TreeMonster** - Wavescanning/spectral effect

#### Includes Used in Surge

```cpp
#include "sst/effects/Bonsai.h"
#include "sst/effects/Delay.h"
#include "sst/effects/Flanger.h"
#include "sst/effects/FloatyDelay.h"
#include "sst/effects/Nimbus.h"
#include "sst/effects/NimbusImpl.h"
#include "sst/effects/Phaser.h"
#include "sst/effects/Reverb1.h"
#include "sst/effects/Reverb2.h"
#include "sst/effects/RotarySpeaker.h"
#include "sst/effects/TreeMonster.h"
```

#### Build Configuration
```cmake
# src/common/CMakeLists.txt (line 38)
surge_add_lib_subdirectory(sst/sst-effects)

# Link (line 351)
target_link_libraries(surge-common PUBLIC sst-effects)
```

#### Real-World Usage Examples

**DelayEffect.h**:
```cpp
#include "sst/effects/Delay.h"
#include "SurgeSSTFXAdapter.h"

class DelayEffect : public surge::sstfx::SurgeSSTFXBase<
    sst::effects::delay::Delay<surge::sstfx::SurgeFXConfig>>
{
public:
    DelayEffect(SurgeStorage *storage, FxStorage *fxdata, pdata *pd);
    virtual void init_ctrltypes() override;
    virtual void init_default_values() override;
};
```

**Reverb1Effect.h**:
```cpp
class Reverb1Effect : public surge::sstfx::SurgeSSTFXBase<
    sst::effects::reverb1::Reverb1<surge::sstfx::SurgeFXConfig>>
{
public:
    Reverb1Effect(SurgeStorage *storage, FxStorage *fxdata, pdata *pd);
    virtual int get_ringout_decay() override { return ringout_time; }
};
```

#### Ported Effects

The following Surge effects are now ported to sst-effects:
- BBDEnsembleEffect (BBD delay emulation)
- BonsaiEffect (resonant comb)
- CombulatorEffect (multi-comb)
- DelayEffect (feedback delay)
- FlangerEffect (LFO flanger)
- FloatyDelayEffect (pitch delay)
- NimbusEffect (spectral effect)
- PhaserEffect (allpass modulation)
- Reverb1Effect (algorithmic reverb)
- Reverb2Effect (advanced reverb)
- RotarySpeakerEffect (Leslie simulator)
- TreemonsterEffect (wavescanning)

---

### 8. sst-jucegui

**Location**: `/libs/sst/sst-jucegui`
**GitHub**: https://github.com/surge-synthesizer/sst-jucegui
**Purpose**: JUCE-based GUI components (knobs, sliders, style system)
**Status**: Used in Surge XT GUI rendering

#### Key Components

```
sst-jucegui/include/sst/jucegui/
├── components/
│   ├── Knob.h              [Rotary knob control]
│   ├── Slider.h            [Linear slider control]
│   ├── Button.h            [Button widgets]
│   ├── DropDown.h          [Dropdown selection]
│   └── More...
├── data/
│   ├── Continuous.h        [Continuous parameter control]
│   └── Discrete.h          [Discrete value control]
├── style/
│   ├── StyleSheet.h        [CSS-like styling]
│   └── ColourMap.h         [Color palette]
└── util/
    ├── DebugHelpers.h      [Debug utilities]
    └── More...
```

#### Includes Used in Surge

```cpp
#include <sst/jucegui/components/Knob.h>
#include <sst/jucegui/data/Continuous.h>
#include <sst/jucegui/style/StyleSheet.h>
#include <sst/jucegui/util/DebugHelpers.h>
```

#### Build Configuration
```cmake
# src/common/CMakeLists.txt (line 45)
surge_add_lib_subdirectory(sst/sst-jucegui)
```

#### Usage in Surge XT
Used exclusively for GUI rendering in src/surge-xt/ module - provides knob rendering, parameter binding, and styled components.

---

## Integration Patterns

### Pattern 1: Header-Only Includes

Most SST libraries are header-only or minimize compilation:

```cpp
// In effect header file
#include "sst/effects/Delay.h"
#include "sst/filters/BiquadFilter.h"
#include "sst/waveshapers.h"

// No separate compilation needed - template instantiation
class MyEffect { /* ... */ };
```

### Pattern 2: SIMD Abstraction

All DSP libraries use SIMD abstraction via sst-basic-blocks:

```cpp
#include "sst/basic-blocks/simd/setup.h"

// SIMD_M128 abstracts __m128 (SSE2), __m256 (AVX), or neon
typedef SIMD_M128 (*FilterFn)(QuadFilterUnitState&, SIMD_M128);

// Process 4 voices simultaneously
SIMD_M128 input = SIMD_MM(load_ps)(voiceData);
SIMD_M128 output = filterFunction(filterState, input);
SIMD_MM(store_ps)(outputData, output);
```

### Pattern 3: Template-Based Effects

Effects use template configuration for host integration:

```cpp
// In sst-effects
template<typename FXConfig>
class Delay : public EffectBase<FXConfig> { /* ... */ };

// In Surge adapter
struct SurgeFXConfig { /* provides GlobalStorage, EffectStorage, etc */ };

// Final concrete type
class DelayEffect : public SurgeSSTFXBase<
    sst::effects::delay::Delay<SurgeFXConfig>>
{ /* ... */ };
```

### Pattern 4: Parameter Metadata

All effects expose parameter metadata:

```cpp
namespace sst::effects::delay
{
    static ParamMetaData Delay::paramAt(int index)
    {
        ParamMetaData pmd;
        pmd.name = "Time";
        pmd.type = ParamMetaData::Type::FLOAT;
        pmd.minVal = 0.0f;
        pmd.maxVal = 8000.0f;
        pmd.defaultVal = 500.0f;
        return pmd;
    }
}
```

### Pattern 5: Cross-Platform Support

All libraries use the same build/compiler strategy:

```cmake
# In CMakeLists.txt
surge_add_lib_subdirectory(sst/sst-basic-blocks)

# Automatically handles:
# - SSE2/AVX detection and configuration
# - C++20 standard
# - Platform-specific compilation flags
# - Symbol visibility
```

---

## Usage Examples

### Example 1: Using sst-filters Biquad

```cpp
#include "sst/filters/BiquadFilter.h"
#include "sst/basic-blocks/simd/setup.h"

void processBiquad()
{
    sst::filters::Biquad myFilter;

    // Set filter parameters
    myFilter.setCutoff(1000.0f, 0.5f);  // 1kHz cutoff, 0.5 resonance

    // Process audio sample by sample
    for (int i = 0; i < blockSize; i++) {
        float output = myFilter.process(input[i]);
    }
}
```

### Example 2: QuadFilterChain SIMD Processing

```cpp
#include "sst/filters/QuadFilterUnit.h"
#include "sst/basic-blocks/simd/setup.h"

// Get filter function for type and subtype
FilterUnitQFPtr filterFn = GetQFPtrFilterUnit(
    7,   // Filter type (e.g., Moog 4-pole)
    0    // Subtype
);

// Process 4 voices simultaneously in SIMD vector
SIMD_M128 input = SIMD_MM(load_ps)(voice_data);
SIMD_M128 output = filterFn(filterState, input);
SIMD_MM(store_ps)(output_data, output);
```

### Example 3: Using sst-basic-blocks Oscillators

```cpp
#include "sst/basic-blocks/dsp/QuadratureOscillators.h"

struct MyOscillator
{
    sst::basic_blocks::dsp::QuadratureOscillator<float> osc;

    void init(float freq, float sampleRate)
    {
        osc.setFrequency(freq / sampleRate);
    }

    void process(float *outL, float *outR)
    {
        for (int i = 0; i < BLOCK_SIZE; i++) {
            osc.step();
            outL[i] = osc.sin;
            outR[i] = osc.cos;
        }
    }
};
```

### Example 4: Using sst-effects Delay

```cpp
#include "sst/effects/Delay.h"
#include "SurgeSSTFXAdapter.h"

class MyDelayEffect : public surge::sstfx::SurgeSSTFXBase<
    sst::effects::delay::Delay<surge::sstfx::SurgeFXConfig>>
{
public:
    MyDelayEffect(SurgeStorage *storage, FxStorage *fxdata, pdata *pd)
        : SurgeSSTFXBase(storage, fxdata, pd)
    {
        // Initialize with Surge-specific config
        this->configureControlsFromFXMetadata();
    }
};
```

### Example 5: Parameter Metadata Configuration

```cpp
#include "sst/basic-blocks/params/ParamMetadata.h"
#include "SurgeSSTFXAdapter.h"

// From sst-effects
auto metadata = sst::effects::delay::Delay<SurgeFXConfig>::paramAt(0);

// Surge adapter uses it for UI configuration
void SurgeSSTFXBase::configureControlsFromFXMetadata()
{
    for (int i = 0; i < T::numParams; i++) {
        auto pmd = T::paramAt(i);

        // Copy metadata to Surge's effect parameter
        this->fxdata->p[i].set_name(pmd.name.c_str());
        this->fxdata->p[i].val_min.f = pmd.minVal;
        this->fxdata->p[i].val_max.f = pmd.maxVal;
        this->fxdata->p[i].basicBlocksParamMetaData = pmd;
    }
}
```

---

## Build Configuration

### Root CMake Setup

```cmake
# CMakeLists.txt (line 255)
add_subdirectory(libs/sst/sst-cmake)
```

### Common Library Setup

```cmake
# src/common/CMakeLists.txt (lines 30-38)

# Add all SST libraries
surge_add_lib_subdirectory(sst/sst-cpputils)
set(SST_BASIC_BLOCKS_SIMD_OMIT_NATIVE_ALIASES ON)
surge_add_lib_subdirectory(sst/sst-basic-blocks)
surge_add_lib_subdirectory(sst/sst-plugininfra)
surge_add_lib_subdirectory(sst/sst-filters)
surge_add_lib_subdirectory(sst/sst-waveshapers)
target_compile_definitions(sst-waveshapers INTERFACE SURGE_XT_1X_WST=1)
surge_add_lib_subdirectory(sst/sst-effects)

# Optional: JUCE GUI
surge_add_lib_subdirectory(sst/sst-jucegui)  # Only if not SURGE_SKIP_JUCE_FOR_RACK
```

### Linking

```cmake
# src/common/CMakeLists.txt (lines 335-362)

target_link_libraries(surge-common PUBLIC
    # ... other libs ...
    sst-cpputils
    sst-plugininfra
    sst-plugininfra::filesystem
    sst-plugininfra::tinyxml
    sst-plugininfra::strnatcmp
    sst-filters
    sst-filters-extras
    sst-waveshapers
    sst-basic-blocks
    sst-effects
    # ... other libs ...
)
```

### Compiler Configuration

The sst-cmake module handles:

- **C++ Standard**: C++20 requirement
- **SIMD Detection**: SSE2/AVX/Neon detection and enablement
- **Visibility**: Hidden symbol visibility (except Windows)
- **Optimization**: LTO in Release builds
- **Warnings**: Strict error checking across all platforms

---

## Architecture Diagrams

### Audio Signal Flow

```
┌─────────────────────────────────────────────────────────┐
│ SurgeVoice (4 voices max per QuadFilterChainState)      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Oscillators ──► Pitch Modulation ──┐                   │
│  (sst-basic-blocks QuadratureOscillators)               │
│                                      │                   │
│  Noise Gen ────────────────────────► + ──┐              │
│  (sst-basic-blocks CorrelatedNoise)      │              │
│                                           │              │
│  Unison/Detune ────────────────────────► Mix ──┐        │
│  (sst-basic-blocks OscillatorDriftUnison)      │        │
│                                                 │        │
│                                   Input ────────┤        │
│                                                 ▼        │
│                              QuadFilterChain ──►Filter 1 │
│                              (4 SIMD voices)  (sst-filters)
│                                                 │        │
│                                            Waveshaper   │
│                                        (sst-waveshapers)│
│                                                 │        │
│                                                ▼        │
│                                             Filter 2    │
│                                          (sst-filters)  │
│                                                 │        │
│                                                ▼        │
│                                    Output────► DL, DR   │
│                                                 │        │
└─────────────────────────────────────────────────┼───────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────┐
                    │      Effects Chain (4 chains)        │
                    │                                      │
                    │  Chain A/B/Send1/Send2               │
                    │  Each has 4 effect slots            │
                    │  (sst-effects: Delay, Reverb, etc) │
                    │                                      │
                    └──────────────────────────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │     Output Mix   │
                        │   & Metering     │
                        └──────────────────┘
```

### SST Library Dependency Graph

```
Application (Surge XT)
    │
    ├─ surge-common (library)
    │   │
    │   ├─ sst-effects (10+ effects)
    │   │   ├─ sst-basic-blocks (for params & utilities)
    │   │   └─ sst-cpputils
    │   │
    │   ├─ sst-filters (30+ filters)
    │   │   ├─ sst-basic-blocks (for SIMD ops)
    │   │   ├─ sst-plugininfra (for CPU features)
    │   │   └─ sst-cpputils
    │   │
    │   ├─ sst-waveshapers (distortion models)
    │   │   ├─ sst-basic-blocks (for SIMD)
    │   │   └─ sst-cpputils
    │   │
    │   ├─ sst-basic-blocks (oscillators, interpolators, math)
    │   │   └─ sst-cpputils
    │   │
    │   ├─ sst-plugininfra (CPU features, paths, platform)
    │   │   └─ (no SST dependencies)
    │   │
    │   └─ sst-cpputils (fundamental utilities)
    │       └─ (no SST dependencies)
    │
    └─ sst-jucegui (GUI components, optional)
        └─ JUCE framework

Legend:
  ─── Direct dependency
  ┌─┐ Optional component
```

---

## Performance Characteristics

### SIMD Processing

All critical DSP paths use SIMD (Single Instruction, Multiple Data):

```
Traditional (Sequential):
  Voice 1 → Filter → Output  (N cycles)
  Voice 2 → Filter → Output  (N cycles)
  Voice 3 → Filter → Output  (N cycles)
  Voice 4 → Filter → Output  (N cycles)
  Total: 4N cycles

Surge's SIMD Approach:
  [Voice1, Voice2, Voice3, Voice4] → [Filter×4] → [Output×4]
  Total: N cycles (4× speedup!)
```

### CPU Feature Optimization

- **SIMD_M128**: SSE2 default (128-bit, 4 floats)
- **SIMD_M256**: AVX support where available (256-bit, 8 floats)
- **NEON**: ARM64 support via simde compatibility layer
- **Fallback**: Pure C++ reference implementation

---

## Testing & Validation

### Build Testing

All SST libraries are tested via:

1. **Unit Tests**: Per-library test suites
2. **Integration Tests**: Surge-specific effect/filter tests
3. **Regression Tests**: Consistency checking across releases
4. **SIMD Validation**: Vector operation correctness

### Effect Validation Framework

Surge includes effect validation via:

```cpp
// From SurgeSSTFXAdapter.h
void configureControlsFromFXMetadata()
{
    // Validates parameter metadata consistency
    // Logs mismatches between sst-effects metadata and Surge config
    // Example: Min/max values, control types, temposync capability
}
```

---

## Troubleshooting & Common Issues

### Issue: SST Libraries Not Found

**Cause**: Submodules not initialized

**Solution**:
```bash
git submodule update --init --recursive
```

### Issue: SIMD Mismatch on ARM64

**Cause**: Native SIMD aliases disabled for ARM64EC compatibility

**Config**:
```cmake
set(SST_BASIC_BLOCKS_SIMD_OMIT_NATIVE_ALIASES ON)
```

### Issue: Effect Parameter Metadata Mismatch

**Symptom**: Console warnings like:
```
Metadata Mismatch (fx=Delay attr=Minimum Values):
param[0]='Time'; param metadata value=100 surge value=10
```

**Solution**: Ensure sst-effects parameter definitions match Surge's FxStorage config

---

## Future Development

### Areas for Enhancement

1. **Voice Effects**: sst-voice-effects library (currently minimal)
   - TiltNoise generator available
   - More voice-level processing to come

2. **Modulation**: More sophisticated modulation utilities
   - Cross-library modulation routing
   - Advanced parameter scaling

3. **Algorithm Improvements**: Ongoing filter/effect optimization
   - Better ladder filter emulations
   - New reverb algorithms
   - Improved waveshaper models

---

## References & Resources

### Official Repositories

- **Surge**: https://github.com/surge-synthesizer/surge
- **sst-basic-blocks**: https://github.com/surge-synthesizer/sst-basic-blocks
- **sst-filters**: https://github.com/surge-synthesizer/sst-filters
- **sst-effects**: https://github.com/surge-synthesizer/sst-effects
- **sst-waveshapers**: https://github.com/surge-synthesizer/sst-waveshapers
- **sst-plugininfra**: https://github.com/surge-synthesizer/sst-plugininfra
- **sst-cpputils**: https://github.com/surge-synthesizer/sst-cpputils
- **sst-jucegui**: https://github.com/surge-synthesizer/sst-jucegui

### Documentation

- **Surge Encyclopedic Guide**: /docs/encyclopedic-guide/
  - Chapter 10: Filter Theory
  - Chapter 11: Filter Implementation
  - Chapter 12: Effects Architecture
  - Chapter 32: SIMD Optimization

### Key Header Locations

```
libs/sst/
├── sst-basic-blocks/include/sst/basic-blocks/
├── sst-cpputils/include/sst/
├── sst-effects/include/sst/effects/
├── sst-filters/include/sst/filters/
├── sst-jucegui/include/sst/jucegui/
├── sst-plugininfra/include/sst/plugininfra/
├── sst-waveshapers/include/sst/waveshapers/
└── sst-cmake/ (CMake modules)
```

---

## Contributors & Acknowledgments

**SST Libraries**:
- Developed by the Surge Synth Team
- Community contributions via GitHub

**Surge XT Integration**:
- Maintains compatibility with all SST libraries
- Provides adapter layer for host integration

---

## License

All SST libraries and Surge are released under the **GNU General Public License v3.0 (GPL-3.0-or-later)**.

See individual repository LICENSE files for details.

---

**Document Generated**: November 2025
**Surge Version**: 1.4.0+
**Status**: Reference Guide - Complete Library Index
