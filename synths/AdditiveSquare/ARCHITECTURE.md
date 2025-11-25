# Additive Square Synthesizer - Architecture

## Overview
An additive synthesis engine using square wave partials instead of traditional sine waves. Each partial is a square wave oscillator tuned to integer multiples of the fundamental frequency, creating a harmonically rich, unique character distinct from classic additive synthesis.

## Signal Flow

```
MIDI Input → Voice → [Square 1, Square 2, ..., Square 8] → SUM → FILTER → AMP → Output
                           ↓        ↓              ↓            ↓      ↓
                       Level 1   Level 2       Level 8      ADSR   ADSR
                                                               ↑
                                                           Filter Env
```

## DSP Components

### Oscillators
- **Library:** sst-basic-blocks
- **Component:** DPWPulseOscillator (with 50% pulse width = square wave)
- **Count:** 8 partials per voice
- **Tuning:** Each partial at integer multiple of fundamental (1x, 2x, 3x, 4x, 5x, 6x, 7x, 8x)
- **Parameters:** Individual level control for each partial (0-1)

### Filter
- **Library:** sst-filters
- **Component:** VintageLadder (Moog-style 24dB/octave ladder filter)
- **Parameters:** Cutoff (20-20000 Hz), Resonance (0-1)
- **Modulation:** Filter envelope with amount control

### Envelopes
- **Library:** sst-basic-blocks
- **Components:**
  - Filter ADSR (modulates filter cutoff)
  - Amp ADSR (controls voice amplitude)
- **Parameters:** Attack, Decay, Sustain, Release for each envelope

## Parameters

| ID | Name | Range | Default | Description |
|----|------|-------|---------|-------------|
| 0 | partial_1_level | 0-1 | 1.0 | Level of 1st partial (fundamental) |
| 1 | partial_2_level | 0-1 | 0.5 | Level of 2nd partial (2x frequency) |
| 2 | partial_3_level | 0-1 | 0.3 | Level of 3rd partial (3x frequency) |
| 3 | partial_4_level | 0-1 | 0.2 | Level of 4th partial (4x frequency) |
| 4 | partial_5_level | 0-1 | 0.15 | Level of 5th partial (5x frequency) |
| 5 | partial_6_level | 0-1 | 0.1 | Level of 6th partial (6x frequency) |
| 6 | partial_7_level | 0-1 | 0.05 | Level of 7th partial (7x frequency) |
| 7 | partial_8_level | 0-1 | 0.02 | Level of 8th partial (8x frequency) |
| 8 | filter_cutoff | 20-20000 Hz | 2000 | Filter cutoff frequency |
| 9 | filter_resonance | 0-1 | 0.3 | Filter resonance amount |
| 10 | filter_env_amount | -1 to 1 | 0.5 | Filter envelope modulation amount |
| 11 | filter_attack | 1-5000 ms | 10 | Filter envelope attack time |
| 12 | filter_decay | 1-5000 ms | 300 | Filter envelope decay time |
| 13 | filter_sustain | 0-1 | 0.5 | Filter envelope sustain level |
| 14 | filter_release | 1-10000 ms | 500 | Filter envelope release time |
| 15 | amp_attack | 1-5000 ms | 5 | Amp envelope attack time |
| 16 | amp_decay | 1-5000 ms | 100 | Amp envelope decay time |
| 17 | amp_sustain | 0-1 | 0.8 | Amp envelope sustain level |
| 18 | amp_release | 1-10000 ms | 300 | Amp envelope release time |
| 127 | master_volume | 0-1 | 0.7 | Master output level |

## Voice Architecture

Each voice contains:
- 8 DPWPulseOscillator instances (one per partial)
- 1 VintageLadder filter
- 2 ADSR envelopes (filter, amp)
- Voice state (note, velocity, active flag)

Maximum polyphony: 8 voices

## WASM Exports

```cpp
extern "C" {
  void init(int sampleRate);
  void process(float* outL, float* outR, int samples);
  void setParameter(int id, float value);
  float getParameter(int id);
  void noteOn(int note, float velocity);
  void noteOff(int note);
  void midiCC(int cc, float value);
  void pitchBend(float value);
  void shutdown();
  int getVersion();
}
```

## UI Components

From `core/ui/components/`:
- **SynthKnob** - Individual partial levels, filter controls, envelope times
- **SynthADSR** - Visual envelope editors for filter and amp
- **SynthRow** - Grouping for partials, filter, envelopes
- **Oscilloscope** - Optional waveform display

## Technical Notes

### Why Square Waves for Additive Synthesis?
Traditional additive synthesis uses sine waves because they're the "pure" harmonics that can be combined to create any waveform (Fourier synthesis). Using square waves instead:
- Each partial already contains odd harmonics (1, 3, 5, 7...)
- Creates complex, metallic, organ-like timbres
- Produces denser harmonic content with fewer oscillators
- Unique sonic character not achievable with sine-based additive

### Performance Considerations
- 8 partials × 8 voices = 64 oscillators running simultaneously
- SST's DPWPulseOscillator uses band-limited synthesis (Differentiated Parabolic Wave)
- No aliasing even at high frequencies
- Suitable for real-time performance in AudioWorklet (128-sample blocks at 48kHz)

## Sonic Character

This synthesizer excels at:
- Thick, harmonic drone textures
- Bell-like and organ-like tones
- Evolving pads with partial level modulation
- Metallic, industrial sounds
- Experimental electronic music

By adjusting partial levels, users can:
- Create hollow sounds (low harmonics only)
- Bright, cutting leads (high harmonics emphasized)
- Evolving timbres (automate partial levels)
- Formant-like resonances (specific harmonic combinations)
