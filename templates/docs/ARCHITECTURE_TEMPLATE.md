# [SYNTH NAME] Architecture Document

> **Status**: Draft | In Review | Approved
> **Author**: [synth-architect]
> **Date**: [YYYY-MM-DD]

## 1. Overview

### 1.1 Concept
- **Type**: [Subtractive / FM / Wavetable / Hybrid / Physical Modeling]
- **Voices**: [Count, Mono/Poly/Paraphonic]
- **Target Use**: [Bass / Lead / Pad / FX / General Purpose]

### 1.2 Inspiration
<!-- List reference synths and what aspects you're drawing from -->
- [Reference Synth 1]: [Which aspects]
- [Reference Synth 2]: [Which aspects]

### 1.3 Unique Features
<!-- What makes this synth special? -->
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

---

## 2. Signal Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VOICE ARCHITECTURE                              │
│                                                                           │
│  ┌─────────────┐                                                         │
│  │   OSC 1     │──┐                                                      │
│  │ [Type]      │  │                                                      │
│  └─────────────┘  │                                                      │
│                   │  ┌─────────┐  ┌──────────┐  ┌─────────┐             │
│  ┌─────────────┐  ├─→│  MIX    │─→│ FILTER 1 │─→│  AMP    │──→ Voice Out│
│  │   OSC 2     │──┤  │         │  │ [Type]   │  │         │             │
│  │ [Type]      │  │  └─────────┘  └──────────┘  └─────────┘             │
│  └─────────────┘  │       ▲            ▲             ▲                  │
│                   │       │            │             │                  │
│  ┌─────────────┐  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │   OSC 3     │──┘  │  LFO 1  │  │ FLT ENV │  │ AMP ENV │             │
│  │ [Type]      │     └─────────┘  └─────────┘  └─────────┘             │
│  └─────────────┘                                                         │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           GLOBAL EFFECTS                                  │
│                                                                           │
│  Voice Mix ─→ [FX 1] ─→ [FX 2] ─→ [FX 3] ─→ Master Out                  │
│               [Type]    [Type]    [Type]                                 │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Voice Architecture

### 3.1 Oscillators

| Osc | Types Available | Features | SST Component |
|-----|-----------------|----------|---------------|
| 1 | Saw, Square, Tri, Sine | Detune, PWM | `DPWSawOscillator` / `SinOscillator` |
| 2 | Saw, Square, Tri, Sine | Detune, PWM, Sync | `DPWSawOscillator` |
| 3 | Sub, Noise | Level only | `SinOscillator` / `CorrelatedNoise` |

### 3.2 Oscillator Mixer

| Input | Level Range | Notes |
|-------|-------------|-------|
| Osc 1 | 0-100% | |
| Osc 2 | 0-100% | |
| Osc 3 | 0-100% | |
| Noise | 0-100% | White/Pink |

### 3.3 Filters

| Filter | Topology | Modes | SST Component |
|--------|----------|-------|---------------|
| 1 | [Ladder/SVF/K35] | LP12, LP24, HP12, BP | `CytomicSVF` / `VintageLadder` |
| 2 | [Optional] | | |

### 3.4 Amplifier

- **VCA Type**: Linear / Exponential
- **Saturation**: None / Soft / Hard

---

## 4. Modulation

### 4.1 Envelopes

| Env | Type | Hardwired To | SST Component |
|-----|------|--------------|---------------|
| Amp | ADSR | Amplitude | `ADSREnvelope` |
| Filter | ADSR | Filter 1 Cutoff | `ADSREnvelope` |
| Mod | ADSR | [Assignable] | `ADSREnvelope` |

### 4.2 LFOs

| LFO | Shapes | Rate Range | Sync | Default Routing |
|-----|--------|------------|------|-----------------|
| 1 | Sin, Tri, Saw, Sqr, S&H | 0.01-50 Hz | Yes | Pitch (vibrato) |
| 2 | Sin, Tri, Saw, Sqr, S&H | 0.01-50 Hz | Yes | Filter cutoff |

### 4.3 Modulation Matrix

| Source | Destinations | Depth Range |
|--------|--------------|-------------|
| LFO 1 | Pitch, Filter, Amp, PWM | -100% to +100% |
| LFO 2 | Pitch, Filter, Amp, PWM | -100% to +100% |
| Filter Env | Filter Cutoff | -100% to +100% |
| Velocity | Amp, Filter | 0-100% |
| Mod Wheel | LFO Depth, Filter | 0-100% |

---

## 5. Effects

### 5.1 Effect Chain

| Slot | Effect | Bypass | SST Component |
|------|--------|--------|---------------|
| 1 | [Type] | Yes | `sst::effects::...` |
| 2 | [Type] | Yes | `sst::effects::...` |
| 3 | [Type] | Yes | `sst::effects::...` |

### 5.2 Effect Parameters

<!-- Detail each effect's parameters -->

---

## 6. Parameters

### 6.1 Complete Parameter List

| ID | Name | Min | Max | Default | Unit | Category |
|----|------|-----|-----|---------|------|----------|
| `osc1_waveform` | Osc 1 Wave | 0 | 3 | 0 | - | Oscillator |
| `osc1_level` | Osc 1 Level | 0 | 1 | 0.8 | - | Oscillator |
| `filter_cutoff` | Filter Cutoff | 20 | 20000 | 5000 | Hz | Filter |
| `filter_reso` | Filter Resonance | 0 | 1 | 0 | - | Filter |
| ... | ... | ... | ... | ... | ... | ... |

### 6.2 MIDI CC Mapping

| CC | Parameter | Notes |
|----|-----------|-------|
| 1 | Mod Wheel | LFO depth |
| 74 | Filter Cutoff | |
| 71 | Resonance | |

---

## 7. Implementation Notes

### 7.1 SST Libraries Used

- [ ] sst-basic-blocks
  - [ ] `DPWSawOscillator`
  - [ ] `ADSREnvelope`
  - [ ] `SimpleLFO`
- [ ] sst-filters
  - [ ] `CytomicSVF` / `VintageLadder`
- [ ] sst-effects
  - [ ] [Effect 1]
  - [ ] [Effect 2]
- [ ] sst-waveshapers
  - [ ] [Waveshaper type]

### 7.2 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Max voices @ 44.1kHz | 16 | |
| CPU per voice | < 5% | Single core |
| Latency | < 10ms | |

### 7.3 Special Considerations

<!-- Any implementation challenges or notes -->

---

## 8. UI Component Mapping

| Section | Components | Notes |
|---------|------------|-------|
| Oscillator | `SynthKnob` x3, Waveform selector | |
| Filter | `SynthKnob` x3 | |
| Envelopes | `SynthADSR` x2 | |
| LFO | `SynthLFO` x2 | |
| Effects | `SynthKnob` per effect | |
| Master | `SynthSlider`, `SynthVUMeter` | |

---

## 9. Testing Checklist

- [ ] All oscillator waveforms produce correct output
- [ ] Filter cutoff responds correctly across range
- [ ] Filter resonance reaches self-oscillation
- [ ] Envelopes have correct timing
- [ ] Voice stealing works without clicks
- [ ] Note on/off are click-free
- [ ] No denormals in output
- [ ] No NaN or Inf values
- [ ] All parameters automate correctly
- [ ] State save/load preserves sound
- [ ] Effects wet/dry works correctly

---

## 10. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Architect | | | |
| DSP Lead | | | |
| Sound Designer | | | |

---

*Document generated from template. See `docs/LLM_SYNTH_PROGRAMMING_GUIDE.md` for reference.*
