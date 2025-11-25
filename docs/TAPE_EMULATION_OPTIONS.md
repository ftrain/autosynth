# Tape Emulation Options for Studio Synths

> Comparison of tape emulation libraries for realistic tape hiss, saturation, and aging

---

## 🎯 Summary

For the TapeLoop plugin specifically, **replace simple white noise with Airwindows TapeDust** for authentic tape hiss that responds to signal content.

For full tape emulation (saturation, compression, wow/flutter), consider **ChowDSP Chow Tape Model** or **Airwindows ToTape series**.

---

## Option 1: Airwindows TapeDust ⭐ **RECOMMENDED FOR TAPE HISS**

### What It Does
**"Slew noise"** - tape-like noise that's modulated by the rate of change of the signal, not just random white noise.

### How It Works
1. Tracks last 10 samples of input
2. Generates random noise scaled by user parameter (0-5x range)
3. **Multiplies noise by slew rate:** `(1.0 - abs(current - previous)) * fuzz`
   - Fast changes = less noise
   - Slow/static signal = more noise
   - Creates authentic tape "dust" character
4. Blends 9 past samples with fractional gains for smoothing
5. Wet/dry mix control

### Parameters
- **Range (A):** 0-1 (squared to 0-5) - Amount of tape dust
- **Wet/Dry (B):** 0-1 - Mix control

### Integration
```cpp
// Standalone header (see example below)
class TapeDust {
    void setRange(float r);  // 0-1
    void setMix(float m);    // 0-1
    void process(float& left, float& right);
};
```

### Pros
- ✅ Much more realistic than white noise
- ✅ Responds to signal content (slew-dependent)
- ✅ Small codebase (~100 lines of DSP)
- ✅ MIT license (free to use)
- ✅ Low CPU usage

### Cons
- ❌ Only does noise/hiss (not full tape emulation)
- ❌ Requires manual port from VST to standalone

### Source
- [TapeDust - Airwindows](https://www.airwindows.com/tapedust/)
- GitHub: `/tmp/airwindows/plugins/LinuxVST/src/TapeDust/`
- License: MIT

---

## Option 2: ChowDSP Chow Tape Model 🎓 **BEST FOR FULL TAPE EMULATION**

### What It Does
Physical modeling of **reel-to-reel analog tape machines** (originally Sony TC-260, now models many machines).

### Features
- Tape saturation and compression
- Wow and flutter (pitch modulation)
- Hysteresis modeling (magnetic tape nonlinearity)
- Tape degradation and aging
- Bias and oversampling controls

### Technical Background
- Developed at **Stanford University** (Music 420 class)
- Academic paper: *"Real-Time Physical Modelling for Analog Tape Machines"* (DAFx 2019)
- Uses **Wave Digital Filter (WDF)** circuit modeling
- C++ libraries: `chowdsp_utils`, `chowdsp_wdf`

### Integration Options
1. **Full plugin integration** - Link entire Chow Tape codebase
2. **Library integration** - Use `chowdsp_utils` and `chowdsp_wdf` modules
3. **Algorithm extraction** - Port specific algorithms (hysteresis, saturation)

### Pros
- ✅ Industry-standard quality (used by professionals)
- ✅ Physically accurate tape modeling
- ✅ Open source (GPL-3)
- ✅ Well-documented academic foundation
- ✅ Active development and community

### Cons
- ❌ GPL-3 license (requires open-sourcing derived works)
- ❌ Large codebase (full plugin is complex)
- ❌ Higher CPU usage than simpler approaches
- ❌ Overkill if you only need hiss

### Source
- [Chow Tape Model - Plugin Boutique](https://www.pluginboutique.com/product/2-Effects/44-Saturation/7318-CHOW-Tape-Model)
- GitHub: https://github.com/Chowdhury-DSP/
- [Paper](https://ccrma.stanford.edu/~jatin/papers/Complex_NLs.pdf)
- License: GPL-3

---

## Option 3: Airwindows ToTape Series 🎵 **SIMPLER TAPE SOUND**

### Available Versions
- **ToTape** - Original version
- **ToTape4** - Enhanced version
- **ToTape5** - More features
- **ToTape6** - Most sophisticated
- **ToTape8** - Latest iteration
- **Tape (Redux)** - Simplified "director's cut"

### What It Does
Analog tape sound with:
- Tape saturation
- Head bump (bass boost from playback head)
- Soften (HF rolloff)
- Flutter (optional wow/flutter)

### Best Version for TapeLoop
**Tape (Redux)** - Chris from Airwindows' personal choice for "mix into" DAW output stage:
- Simpler than ToTape6
- Focused on essential tape character
- Lower CPU than full ToTape series

### Pros
- ✅ MIT license (free, permissive)
- ✅ Multiple versions to choose from
- ✅ Proven sound quality
- ✅ Moderate CPU usage
- ✅ Well-tested in production

### Cons
- ❌ Not as physically accurate as ChowDSP
- ❌ Requires porting from VST format
- ❌ Documentation is minimal

### Source
- [ToTape6 - Airwindows](https://www.airwindows.com/totape6/)
- [Tape Redux - Airwindows](https://www.airwindows.com/tape-redux/)
- GitHub: https://github.com/airwindows/airwindows
- License: MIT

---

## Option 4: Airwindows TapeHack 🔬 **EXPERIMENTAL**

### What It Does
"A new dimension in tape realism, abstracted to software"

More experimental/abstract approach to tape sound. Less documentation available.

### Use Case
If you want something unique and less "by-the-book" than standard tape emulation.

---

## Recommendation for TapeLoop

### Current Implementation
```cpp
// TapeLoopEngine.h - Simple white noise
float hiss = ((rand() / (float)RAND_MAX) * 2.0f - 1.0f) * hissLevel;
output += hiss;
```

### Upgrade Path: Add TapeDust

**Step 1:** Create standalone TapeDust header (port from Airwindows)

```cpp
// TapeDust.h - Standalone slew noise generator
class TapeDust {
public:
    void prepare(double sr) {
        sampleRate = sr;
        std::memset(bL, 0, sizeof(bL));
        std::memset(bR, 0, sizeof(bR));
        std::memset(fL, 0, sizeof(fL));
        std::memset(fR, 0, sizeof(fR));
    }

    void setRange(float r) { range = std::clamp(r, 0.0f, 1.0f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    void process(float& left, float& right) {
        double inputL = left;
        double inputR = right;
        double dryL = inputL;
        double dryR = inputR;

        // Compute slew-dependent noise (see algorithm above)
        double rRange = std::pow(range, 2.0) * 5.0;
        double xfuzz = rRange * 0.002;
        double rOffset = (rRange * 0.4) + 1.0;

        // Shift buffer
        for (int i = 9; i > 0; i--) {
            bL[i] = bL[i-1];
            bR[i] = bR[i-1];
        }

        bL[0] = inputL;
        bR[0] = inputR;

        // Generate slew noise
        double noiseL = (rand() / (double)RAND_MAX);
        double noiseR = (rand() / (double)RAND_MAX);
        double gainL = (noiseL * rRange) + rOffset;
        double gainR = (noiseR * rRange) + rOffset;

        noiseL *= ((1.0 - std::abs(bL[0] - bL[1])) * xfuzz);
        noiseR *= ((1.0 - std::abs(bR[0] - bR[1])) * xfuzz);

        if (fpFlip) {
            noiseL = -noiseL;
            noiseR = -noiseR;
        }
        fpFlip = !fpFlip;

        // Fractional delay blend (simplified)
        for (int i = 0; i < 9; i++) {
            double fracL = (gainL > 1.0) ? 1.0 : gainL;
            double fracR = (gainR > 1.0) ? 1.0 : gainR;
            gainL -= fracL;
            gainR -= fracR;

            noiseL += bL[i] * fracL / (gainL + 1.0);
            noiseR += bR[i] * fracR / (gainR + 1.0);
        }

        // Mix
        left = static_cast<float>((noiseL * mix) + (dryL * (1.0 - mix)));
        right = static_cast<float>((noiseR * mix) + (dryR * (1.0 - mix)));
    }

private:
    double bL[11]{}, bR[11]{};  // Buffer
    double fL[11]{}, fR[11]{};  // Fractional gains
    float range = 0.3f;
    float mix = 0.1f;
    bool fpFlip = false;
    double sampleRate = 44100.0;
};
```

**Step 2:** Replace in TapeLoopEngine

```cpp
// Old: Simple white noise
float hiss = ((rand() / (float)RAND_MAX) * 2.0f - 1.0f) * hissLevel;

// New: Slew-dependent tape dust
tapeDust.setRange(tapeHissLevel);
tapeDust.setMix(tapeHissLevel);
tapeDust.process(left, right);
```

---

## Comparison Matrix

| Feature | Current (White Noise) | TapeDust | Chow Tape | ToTape |
|---------|----------------------|----------|-----------|--------|
| **Noise Quality** | Basic | Slew-dependent | N/A (has degradation) | N/A |
| **Saturation** | ❌ | ❌ | ✅ Physical | ✅ Analog |
| **Wow/Flutter** | ❌ | ❌ | ✅ Modeled | ✅ Optional |
| **Complexity** | 1 line | ~100 lines | ~5000 lines | ~500 lines |
| **CPU Usage** | Minimal | Low | High | Medium |
| **License** | N/A | MIT | GPL-3 | MIT |
| **Best For** | Placeholder | Tape hiss | Full emulation | Tape character |

---

## Implementation Priority

### Phase 1: Replace Hiss (Quick Win) ⚡
**Add TapeDust** for realistic tape noise
- Time: 2-3 hours
- Impact: Immediately better sound
- Risk: Low

### Phase 2: Full Tape Character (Optional) 🎚️
**Add ToTape (Redux)** for saturation and head bump
- Time: 4-6 hours
- Impact: Complete tape sound
- Risk: Medium (more complex integration)

### Phase 3: Physical Modeling (Advanced) 🔬
**Integrate ChowDSP** for ultimate realism
- Time: 1-2 days
- Impact: Industry-standard quality
- Risk: High (GPL license, complex codebase)

---

## Sources

- [Airwindows TapeDust](https://www.airwindows.com/tapedust/)
- [Airwindows ToTape6](https://www.airwindows.com/totape6/)
- [Airwindows Tape Redux](https://www.airwindows.com/tape-redux/)
- [Chow Tape Model - Plugin Boutique](https://www.pluginboutique.com/product/2-Effects/44-Saturation/7318-CHOW-Tape-Model)
- [ChowDSP GitHub](https://github.com/Chowdhury-DSP/)
- [ChowDSP Products](https://chowdsp.com/products.html)
- [Airwindows GitHub](https://github.com/airwindows/airwindows)

---

**Recommendation:** Start with **TapeDust** for Phase 1 - it's a low-risk, high-impact upgrade that takes the tape hiss from "placeholder white noise" to "authentic slew-dependent tape dust" in a few hours of work.
