# [SYNTH NAME] Parameter Reference

> **Version**: 1.0.0
> **Last Updated**: [YYYY-MM-DD]

## Overview

This document provides a complete reference for all parameters exposed by [Synth Name].
All values in the JUCE-React WebView communication use **normalized 0-1 range**.

---

## Parameter Categories

| Category | Description | Count |
|----------|-------------|-------|
| Oscillator | Sound generation | |
| Filter | Frequency shaping | |
| Amp Envelope | Amplitude modulation | |
| Filter Envelope | Filter modulation | |
| LFO | Periodic modulation | |
| Effects | Processing | |
| Master | Global controls | |

---

## Oscillator Parameters

### OSC1_WAVEFORM
| Property | Value |
|----------|-------|
| ID | `osc1_waveform` |
| Name | Oscillator 1 Waveform |
| Type | Choice |
| Range | 0-3 |
| Default | 0 |
| Options | 0=Saw, 1=Square, 2=Triangle, 3=Sine |
| MIDI CC | - |

### OSC1_LEVEL
| Property | Value |
|----------|-------|
| ID | `osc1_level` |
| Name | Oscillator 1 Level |
| Type | Float |
| Range | 0.0 - 1.0 |
| Default | 0.8 |
| Unit | - |
| Skew | 1.0 (linear) |
| MIDI CC | - |

### OSC1_TUNE
| Property | Value |
|----------|-------|
| ID | `osc1_tune` |
| Name | Oscillator 1 Tune |
| Type | Float |
| Range | -24.0 - +24.0 |
| Default | 0.0 |
| Unit | semitones |
| Skew | 1.0 (linear) |
| MIDI CC | - |

<!-- Add more oscillator parameters -->

---

## Filter Parameters

### FILTER_CUTOFF
| Property | Value |
|----------|-------|
| ID | `filter_cutoff` |
| Name | Filter Cutoff |
| Type | Float |
| Range | 20 - 20000 |
| Default | 5000 |
| Unit | Hz |
| Skew | 0.3 (logarithmic) |
| MIDI CC | 74 |

**Notes**: Logarithmic scaling provides musical response.

### FILTER_RESO
| Property | Value |
|----------|-------|
| ID | `filter_reso` |
| Name | Filter Resonance |
| Type | Float |
| Range | 0.0 - 1.0 |
| Default | 0.0 |
| Unit | - |
| Skew | 1.0 (linear) |
| MIDI CC | 71 |

**Notes**: 1.0 = self-oscillation threshold.

### FILTER_ENV_AMOUNT
| Property | Value |
|----------|-------|
| ID | `filter_env_amount` |
| Name | Filter Envelope Amount |
| Type | Float |
| Range | -1.0 - +1.0 |
| Default | 0.5 |
| Unit | - |
| Skew | 1.0 (linear) |
| MIDI CC | - |

**Notes**: Bipolar. Negative values invert envelope.

<!-- Add more filter parameters -->

---

## Amplitude Envelope Parameters

### AMP_ATTACK
| Property | Value |
|----------|-------|
| ID | `amp_attack` |
| Name | Amp Attack |
| Type | Float |
| Range | 0.001 - 10.0 |
| Default | 0.01 |
| Unit | seconds |
| Skew | 0.3 (logarithmic) |
| MIDI CC | 73 |

### AMP_DECAY
| Property | Value |
|----------|-------|
| ID | `amp_decay` |
| Name | Amp Decay |
| Type | Float |
| Range | 0.001 - 10.0 |
| Default | 0.1 |
| Unit | seconds |
| Skew | 0.3 (logarithmic) |
| MIDI CC | 75 |

### AMP_SUSTAIN
| Property | Value |
|----------|-------|
| ID | `amp_sustain` |
| Name | Amp Sustain |
| Type | Float |
| Range | 0.0 - 1.0 |
| Default | 0.7 |
| Unit | - |
| Skew | 1.0 (linear) |
| MIDI CC | - |

### AMP_RELEASE
| Property | Value |
|----------|-------|
| ID | `amp_release` |
| Name | Amp Release |
| Type | Float |
| Range | 0.001 - 10.0 |
| Default | 0.3 |
| Unit | seconds |
| Skew | 0.3 (logarithmic) |
| MIDI CC | 72 |

---

## Filter Envelope Parameters

<!-- Same pattern as amp envelope -->

### FILTER_ATTACK
| Property | Value |
|----------|-------|
| ID | `filter_attack` |
| Name | Filter Attack |
| Type | Float |
| Range | 0.001 - 10.0 |
| Default | 0.01 |
| Unit | seconds |
| Skew | 0.3 (logarithmic) |
| MIDI CC | - |

<!-- Add D, S, R -->

---

## Master Parameters

### MASTER_VOLUME
| Property | Value |
|----------|-------|
| ID | `master_volume` |
| Name | Master Volume |
| Type | Float |
| Range | -60.0 - 0.0 |
| Default | -6.0 |
| Unit | dB |
| Skew | 1.0 (linear in dB) |
| MIDI CC | 7 |

---

## Normalization Formulas

All parameters are communicated as normalized 0-1 values.

### Linear Parameters
```
normalized = (value - min) / (max - min)
value = min + normalized * (max - min)
```

### Skewed Parameters (Logarithmic)
```
// With skew factor (e.g., 0.3 for frequency)
normalized = pow((value - min) / (max - min), skew)
value = min + (max - min) * pow(normalized, 1/skew)
```

### Choice Parameters
```
normalized = index / (numOptions - 1)
index = round(normalized * (numOptions - 1))
```

---

## MIDI CC Quick Reference

| CC | Parameter | Notes |
|----|-----------|-------|
| 1 | Mod Wheel | Assignable |
| 7 | Master Volume | |
| 71 | Resonance | |
| 72 | Release | |
| 73 | Attack | |
| 74 | Cutoff | |
| 75 | Decay | |

---

## TypeScript Type Definition

```typescript
interface ParameterDefinition {
  id: string;
  name: string;
  type: 'float' | 'int' | 'choice' | 'bool';
  min: number;
  max: number;
  default: number;
  step?: number;
  skew?: number;
  unit?: string;
  options?: string[];
  midiCC?: number;
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | | Initial release |

---

*Generated from template. Keep in sync with PluginProcessor.cpp*
