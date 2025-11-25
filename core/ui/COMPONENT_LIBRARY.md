# Core UI Component Library

> Central component library for all Studio synthesizer plugins

## Available Components

### Layout & Structure

#### `SynthRow`
**Purpose:** Layout container for horizontal rows of controls with theming
**Location:** `core/ui/components/SynthRow.jsx`
**Props:**
- `label?` (string): Section label
- `icon?` (string): Icon/symbol before label
- `theme?` (string): `'default'`, `'amber'`, `'blue'`, `'green'`, `'magenta'`, `'cyan'`, `'pink'`, `'orange'`
- `gap?` (string): Space between children (default: '24px')
- `wrap?` (boolean): Allow wrapping (default: true)
- `children` (ReactNode): Child controls

**Theme Recommendation:**
For a clean, consistent look across your synth, use `theme="orange"` on all SynthRow components. The orange theme has a minimal bottom-border accent style that works well across all control types.

**Example:**
```tsx
<SynthRow label="OSCILLATOR" theme="orange" icon="~">
  <SynthKnob label="FREQ" min={20} max={20000} value={440} />
  <SynthKnob label="LEVEL" min={0} max={1} value={0.8} />
</SynthRow>
```

---

### Controls

#### `SynthKnob`
**Purpose:** Rotary control for continuous parameters
**Location:** `core/ui/components/SynthKnob.tsx`
**Props:**
- `label` (string): Knob label
- `min` (number): Minimum value
- `max` (number): Maximum value
- `value` (number): Current value (raw, not normalized)
- `onChange` (function): `(value: number) => void`
- `step?` (number): Step increment (optional)
- `options?` (string[]): For stepped values, display labels (optional)

**Example:**
```tsx
<SynthKnob
  label="CUTOFF"
  min={20}
  max={20000}
  value={1000}
  onChange={(v) => setParameter('filter_cutoff', v)}
/>

// Stepped with options
<SynthKnob
  label="WAVE"
  min={0}
  max={2}
  step={1}
  value={0}
  onChange={(v) => setWaveform(v)}
  options={['SIN', 'TRI', 'SAW']}
/>
```

---

### Envelopes

#### `SynthADSR`
**Purpose:** 4-stage ADSR envelope editor with visual display
**Location:** `core/ui/components/SynthADSR.jsx`
**Props:**
- `label?` (string): Envelope label
- `attack` (number): Attack time in **milliseconds**
- `decay` (number): Decay time in **milliseconds**
- `sustain` (number): Sustain level 0-**100** (percent)
- `release` (number): Release time in **milliseconds**
- `onAttackChange` (function): `(ms: number) => void`
- `onDecayChange` (function): `(ms: number) => void`
- `onSustainChange` (function): `(percent: number) => void`
- `onReleaseChange` (function): `(ms: number) => void`
- `maxAttack?` (number): Max attack time (default: 60000ms)
- `maxDecay?` (number): Max decay time (default: 60000ms)
- `maxRelease?` (number): Max release time (default: 60000ms)
- `showTabs?` (boolean): Show tab interface for multiple envelopes (default: true). Set to `false` for single envelope use.

**Example:**
```tsx
<SynthADSR
  label="AMP ENV"
  attack={10}           // 10ms
  decay={100}           // 100ms
  sustain={70}          // 70%
  release={300}         // 300ms
  onAttackChange={(ms) => setParameter('env_attack', ms / 1000)}
  onDecayChange={(ms) => setParameter('env_decay', ms / 1000)}
  onSustainChange={(pct) => setParameter('env_sustain', pct / 100)}
  onReleaseChange={(ms) => setParameter('env_release', ms / 1000)}
  maxAttack={2000}
  maxDecay={2000}
  maxRelease={5000}
  showTabs={false}  // Hide tabs for single envelope
/>
```

#### `SynthDAHDSR`
**Purpose:** 6-stage DAHDSR envelope (Delay, Attack, Hold, Decay, Sustain, Release)
**Location:** `core/ui/components/SynthDAHDSR.jsx`
**Props:** Similar to `SynthADSR` with additional:
- `delay` (number): Delay time in milliseconds
- `hold` (number): Hold time in milliseconds
- `onDelayChange` (function)
- `onHoldChange` (function)

---

### Modulation

#### `SynthLFO`
**Purpose:** Visual LFO with waveform selector and rate control
**Location:** `core/ui/components/SynthLFO.jsx`
**Props:**
- `label?` (string): LFO label (default: "LFO")
- `waveform` (number): Waveform index 0-6
  - 0: Triangle
  - 1: Square
  - 2: Sine
  - 3: Sawtooth
  - 4: Ramp
  - 5: Stepped S&H
  - 6: Smooth S&H
- `rate` (number): Rate in Hz
- `onWaveformChange` (function): `(waveform: number) => void`
- `onRateChange` (function): `(hz: number) => void`
- `defaultWaveform?` (number): Default waveform (default: 0)
- `defaultRate?` (number): Default rate (default: 2Hz)
- `minRate?` (number): Min rate (default: 0.1Hz)
- `maxRate?` (number): Max rate (default: 20Hz)

**Example:**
```tsx
<SynthLFO
  label="MOD LFO"
  waveform={2}        // Sine
  rate={5}            // 5 Hz
  onWaveformChange={(w) => setParameter('lfo_wave', w)}
  onRateChange={(r) => setParameter('lfo_rate', r)}
  minRate={0.1}
  maxRate={20}
/>
```

---

### Sequencing

#### `SynthSequencer`
**Purpose:** Step sequencer with pitch and gate per step
**Location:** `core/ui/components/SynthSequencer.jsx`
**Props:**
- `steps` (number): Number of steps (e.g., 4, 8, 16)
- `pitchValues` (number[]): Pitch value per step (MIDI note numbers)
- `gateValues` (boolean[]): Gate on/off per step
- `currentStep?` (number): Currently playing step (-1 for none)
- `onPitchChange` (function): `(step: number, pitch: number) => void`
- `onGateChange` (function): `(step: number, gate: boolean) => void`
- `minPitch?` (number): Min MIDI note (default: 0)
- `maxPitch?` (number): Max MIDI note (default: 127)

**Example:**
```tsx
<SynthSequencer
  steps={4}
  pitchValues={[60, 63, 67, 70]}  // C, Eb, G, Bb
  gateValues={[true, true, false, true]}
  currentStep={0}
  onPitchChange={(step, pitch) => setStepPitch(step, pitch)}
  onGateChange={(step, gate) => setStepGate(step, gate)}
  minPitch={36}   // C1
  maxPitch={84}   // C6
/>
```

---

### Visualization

#### `Oscilloscope`
**Purpose:** Real-time waveform display
**Location:** `core/ui/components/Oscilloscope.jsx`
**Props:**
- `label?` (string): Scope label
- `audioData?` (number[]): Audio sample data (mono)
- `width?` (number): Canvas width (default: 400)
- `height?` (number): Canvas height (default: 100)
- `color?` (string): Waveform color (default: "#00ff88")
- `showGrid?` (boolean): Show grid lines (default: true)
- `showPeaks?` (boolean): Show peak indicators (default: false)

**Example:**
```tsx
<Oscilloscope
  label="OUTPUT"
  audioData={audioBuffer}
  width={650}
  height={100}
  color="#ff8844"
  showGrid={true}
  showPeaks={false}
/>
```

---

### Indicators

#### `SynthLED`
**Purpose:** Status indicator (on/off, signal level, etc.)
**Location:** `core/ui/components/SynthLED.jsx`
**Props:**
- `label?` (string): LED label
- `active?` (boolean): LED on/off (default: false)
- `color?` (string): LED color (default: "#00ff88")
- `variant?` (string): "signal" | "clip" | "status"

**Example:**
```tsx
<SynthLED
  label="CLIP"
  active={isClipping}
  color="#ff4444"
  variant="clip"
/>
```

#### `SynthLCD`
**Purpose:** LCD-style text display
**Location:** `core/ui/components/SynthLCD.jsx`
**Props:**
- `text` (string): Display text
- `width?` (number): Display width
- `height?` (number): Display height

---

### Utility

#### `SynthVUMeter`
**Purpose:** VU meter for level monitoring
**Location:** `core/ui/components/SynthVUMeter.jsx`
**Props:**
- `label?` (string): Meter label
- `level` (number): Level 0-1
- `orientation?` (string): "horizontal" | "vertical"

---

## Usage Patterns

### Parameter Normalization
**CRITICAL:** The `useParameters` hook stores values as **0-1 normalized**, but components expect **raw values**.

Use the normalization helpers:

```tsx
import { normalizeValue, denormalizeValue } from './hooks/useParameters';

// Store normalized (0-1)
const { paramValues, handleChange } = useParameters({
  parameters: PARAMETER_DEFINITIONS,
});

// Display denormalized (raw values)
<SynthKnob
  label="CUTOFF"
  min={20}
  max={20000}
  value={denormalizeValue(
    paramValues.filter_cutoff ?? 0.5,  // normalized
    20,     // min
    20000   // max
  )}
  onChange={(rawValue) => {
    const normalized = normalizeValue(rawValue, 20, 20000);
    handleChange('filter_cutoff', normalized);
  }}
/>
```

### Component Composition
Build complex UIs by combining components:

```tsx
<SynthRow label="OSCILLATOR 1">
  {/* Oscillator controls */}
  <SynthKnob label="WAVE" min={0} max={2} step={1} options={['SIN', 'TRI', 'SAW']} />
  <SynthKnob label="TUNE" min={-24} max={24} />
  <SynthKnob label="LEVEL" min={0} max={1} />

  {/* Envelope */}
  <SynthADSR
    label="OSC1 ENV"
    attack={10}
    decay={100}
    sustain={70}
    release={300}
    {...envHandlers}
  />

  {/* Sequencer */}
  <SynthSequencer
    steps={4}
    pitchValues={[60, 63, 67, 70]}
    {...seqHandlers}
  />
</SynthRow>
```

---

## Development

### Running Storybook
```bash
cd core/ui
npm run storybook
```
Opens at `http://localhost:6006` with all components documented and interactive.

### Adding New Components
1. Create component in `core/ui/components/MyComponent.jsx`
2. Create story in `core/ui/components/MyComponent.stories.tsx`
3. Export from `core/ui/components/index.js`
4. Add to this documentation

---

## File Locations

All components are in `/home/user/autosynth/core/ui/components/`:

```
core/ui/components/
├── SynthKnob.tsx           # Rotary knob control
├── SynthRow.jsx            # Layout row container
├── SynthADSR.jsx           # 4-stage ADSR envelope
├── SynthDAHDSR.jsx         # 6-stage envelope
├── SynthLFO.jsx            # Visual LFO component
├── SynthSequencer.jsx      # Step sequencer
├── Oscilloscope.jsx        # Waveform display
├── SynthLED.jsx            # Status indicator
├── SynthLCD.jsx            # Text display
├── SynthVUMeter.jsx        # VU meter
├── SynthSlider.jsx         # Linear slider
├── TransportControls.jsx  # Transport controls
└── index.js                # Component exports
```

---

## Import Examples

```tsx
// From plugin UI (relative path)
import { SynthKnob } from '../../../../../core/ui/components/SynthKnob';
import { SynthRow } from '../../../../../core/ui/components/SynthRow';
import { SynthADSR } from '../../../../../core/ui/components/SynthADSR';
import { SynthLFO } from '../../../../../core/ui/components/SynthLFO';
```

---

**Last Updated:** 2024-11-24
**Component Count:** 12+ core components
**Storybook:** Available at `core/ui`
