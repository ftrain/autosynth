# TypeScript Component Developer Guide

## Building React UI Components for Audio Synthesizers

**For**: TypeScript/React Engineers
**Prerequisite**: Familiarity with React, TypeScript, and basic audio concepts
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Library Reference](#component-library-reference)
4. [Parameter System](#parameter-system)
5. [JUCE WebView Bridge](#juce-webview-bridge)
6. [Building New Components](#building-new-components)
7. [State Management](#state-management)
8. [Testing Components](#testing-components)
9. [Best Practices](#best-practices)

---

## 1. Overview

### Your Role

As a TypeScript Component Developer, you build the visual interface for synthesizers. Your work sits between:

- **Sound Designer** (upstream): Provides sonic specifications and parameter requirements
- **DSP Engineer** (upstream): Implements the audio processing and parameter definitions
- **End User** (downstream): Interacts with your components to control the synth

### Key Responsibilities

1. Implement React components that visualize and control audio parameters
2. Ensure responsive, accessible UI that feels musical
3. Handle communication with the JUCE backend via WebView bridge
4. Create reusable components that work across different synth projects

### The Component Library

This repository contains a pre-built component library designed specifically for synthesizer UIs:

```
components/
├── SynthKnob.tsx      # Rotary parameter control
├── SynthSlider.jsx    # Linear fader control
├── SynthADSR.jsx      # Envelope editor
├── SynthDAHDSR.jsx    # Extended envelope editor
├── SynthLFO.jsx       # LFO shape selector/visualizer
├── SynthLCD.jsx       # Retro LCD display
├── SynthLED.jsx       # LED indicator
├── SynthVUMeter.jsx   # Level meter
├── SynthSequencer.jsx # Step sequencer
├── Oscilloscope.jsx   # Waveform visualizer
├── DualModeOscillator.tsx # Complete oscillator module
└── TransportControls.jsx  # Play/pause/stop
```

---

## 2. Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        JUCE Plugin (C++)                         │
│                                                                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │
│  │ Parameters  │──►│ DSP Engine  │──►│ Audio Output        │    │
│  └─────────────┘   └─────────────┘   └─────────────────────┘    │
│         │                                                         │
│         │ JUCE WebView Bridge                                    │
│         ▼                                                         │
└─────────┼─────────────────────────────────────────────────────────┘
          │
          │ Message passing (normalized 0-1 values)
          │
┌─────────┼─────────────────────────────────────────────────────────┐
│         ▼                     React UI                            │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │
│  │ useJUCE     │──►│ Components  │──►│ Visual Feedback     │    │
│  │ Bridge Hook │   │ (Knobs etc) │   │ (VU, Scope, etc)    │    │
│  └─────────────┘   └─────────────┘   └─────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Key Concepts

1. **Normalized Values**: All parameter values passed between UI and DSP are normalized to 0-1 range
2. **Display Values**: Human-readable strings (e.g., "440 Hz", "100 ms") computed from normalized values
3. **Parameter Metadata**: Describes how to interpret and display each parameter
4. **Real-time Safety**: UI updates must not block the audio thread

---

## 3. Component Library Reference

### SynthKnob

The primary control for continuous parameters like cutoff, resonance, volume.

```tsx
import { SynthKnob } from '../components';

interface SynthKnobProps {
  value: number;           // 0-1 normalized
  onChange: (value: number) => void;
  label?: string;
  min?: number;           // Display min (default 0)
  max?: number;           // Display max (default 100)
  unit?: string;          // Display unit (Hz, %, ms, etc.)
  bipolar?: boolean;      // Center at 0.5 (-100 to +100)
  size?: 'small' | 'medium' | 'large';
  color?: string;         // Accent color
  disabled?: boolean;
}

// Usage
<SynthKnob
  value={filterCutoff}
  onChange={setFilterCutoff}
  label="Cutoff"
  min={20}
  max={20000}
  unit="Hz"
  size="medium"
/>
```

**Interaction Patterns**:
- Click + drag vertically to change value
- Double-click to reset to default
- Shift + drag for fine control
- Scroll wheel for increment/decrement

### SynthSlider

Linear fader for parameters where visual range matters (volume, mix, pan).

```tsx
import { SynthSlider } from '../components';

interface SynthSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  showValue?: boolean;
  min?: number;
  max?: number;
  unit?: string;
}

// Usage
<SynthSlider
  value={volume}
  onChange={setVolume}
  label="Volume"
  orientation="vertical"
  min={-60}
  max={0}
  unit="dB"
/>
```

### SynthADSR

Four-stage envelope editor with visual curve display.

```tsx
import { SynthADSR } from '../components';

interface ADSRValues {
  attack: number;   // 0-1 normalized
  decay: number;
  sustain: number;
  release: number;
}

interface SynthADSRProps {
  values: ADSRValues;
  onChange: (values: ADSRValues) => void;
  label?: string;
  timeRange?: number;  // Max time in seconds (default 10)
}

// Usage
<SynthADSR
  values={ampEnvelope}
  onChange={setAmpEnvelope}
  label="Amp Envelope"
  timeRange={10}
/>
```

### SynthLFO

LFO control with waveform selection and rate/depth controls.

```tsx
import { SynthLFO } from '../components';

interface LFOValues {
  shape: 'sine' | 'triangle' | 'square' | 'saw' | 'random' | 'sh' | 'custom';
  rate: number;     // 0-1 normalized
  depth: number;    // 0-1 normalized
  sync?: boolean;   // Tempo sync
}

// Usage
<SynthLFO
  values={lfo1}
  onChange={setLfo1}
  label="LFO 1"
/>
```

### Oscilloscope

Real-time waveform display. Can show audio output or modulation signals.

```tsx
import { Oscilloscope } from '../components';

interface OscilloscopeProps {
  audioData?: Float32Array;  // Direct audio data
  analyzerNode?: AnalyserNode;  // Web Audio analyzer
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  lineWidth?: number;
}

// Usage with Web Audio
<Oscilloscope
  analyzerNode={audioContext.createAnalyser()}
  width={300}
  height={100}
  color="#00ff00"
/>
```

### SynthSequencer

16-step sequencer with pitch, velocity, and gate controls.

```tsx
import { SynthSequencer } from '../components';

interface Step {
  note: number;      // MIDI note (0-127)
  velocity: number;  // 0-1
  gate: boolean;     // On/off
}

interface SequencerProps {
  steps: Step[];
  currentStep: number;
  onChange: (steps: Step[]) => void;
  onStepTrigger?: (step: number) => void;
  numSteps?: number;  // Default 16
}

// Usage
<SynthSequencer
  steps={sequencerSteps}
  currentStep={playPosition}
  onChange={setSequencerSteps}
  numSteps={16}
/>
```

---

## 4. Parameter System

### Parameter Metadata Schema

Every synthesizer parameter has metadata that describes its behavior:

```typescript
// types/parameters.ts

export interface ParameterMetadata {
  id: string;                 // Unique identifier (e.g., "filter_cutoff")
  name: string;               // Display name (e.g., "Filter Cutoff")
  type: ParameterType;
  category: string;           // Group (oscillator, filter, envelope, etc.)

  // Value configuration
  min: number;                // Real-world minimum
  max: number;                // Real-world maximum
  default: number;            // Default value (normalized 0-1)
  step?: number;              // Increment step
  skew?: number;              // Logarithmic scaling factor

  // Display
  unit?: string;              // Hz, %, ms, dB, etc.
  displayPrecision?: number;  // Decimal places

  // Behavior
  canTemposync?: boolean;     // Can sync to BPM
  canModulate?: boolean;      // Can be a modulation target
  bipolar?: boolean;          // Centered at 0

  // UI hints
  widget: WidgetType;         // knob, slider, toggle, dropdown, etc.
  color?: string;             // Accent color
}

export type ParameterType = 'float' | 'int' | 'bool' | 'choice';
export type WidgetType = 'knob' | 'slider' | 'toggle' | 'dropdown' | 'xy-pad' | 'envelope';
```

### Value Normalization

**Critical**: All values between UI and backend are normalized to 0-1 range.

```typescript
// utils/parameterUtils.ts

/**
 * Convert normalized (0-1) value to real-world value
 */
export function denormalize(
  normalizedValue: number,
  param: ParameterMetadata
): number {
  const { min, max, skew } = param;

  if (skew && skew !== 1) {
    // Logarithmic scaling (e.g., frequency parameters)
    return min + (max - min) * Math.pow(normalizedValue, 1 / skew);
  }

  // Linear scaling
  return min + (max - min) * normalizedValue;
}

/**
 * Convert real-world value to normalized (0-1)
 */
export function normalize(
  realValue: number,
  param: ParameterMetadata
): number {
  const { min, max, skew } = param;

  if (skew && skew !== 1) {
    return Math.pow((realValue - min) / (max - min), skew);
  }

  return (realValue - min) / (max - min);
}

/**
 * Format value for display
 */
export function formatDisplayValue(
  normalizedValue: number,
  param: ParameterMetadata
): string {
  const realValue = denormalize(normalizedValue, param);
  const precision = param.displayPrecision ?? 2;

  // Special formatting by unit type
  switch (param.unit) {
    case 'Hz':
      if (realValue >= 1000) {
        return `${(realValue / 1000).toFixed(precision)} kHz`;
      }
      return `${realValue.toFixed(1)} Hz`;

    case 'ms':
      if (realValue >= 1000) {
        return `${(realValue / 1000).toFixed(precision)} s`;
      }
      return `${realValue.toFixed(0)} ms`;

    case 'dB':
      const sign = realValue >= 0 ? '+' : '';
      return `${sign}${realValue.toFixed(1)} dB`;

    case '%':
      return `${(realValue * 100).toFixed(0)}%`;

    default:
      return `${realValue.toFixed(precision)} ${param.unit || ''}`;
  }
}
```

### Parameter Categories

Group related parameters for UI organization:

```typescript
// Standard categories for synthesizers
export const PARAMETER_CATEGORIES = {
  oscillator: { name: 'Oscillator', order: 1, icon: 'wave' },
  filter: { name: 'Filter', order: 2, icon: 'filter' },
  amplifier: { name: 'Amplifier', order: 3, icon: 'volume' },
  envelope: { name: 'Envelope', order: 4, icon: 'curve' },
  lfo: { name: 'LFO', order: 5, icon: 'sine' },
  modulation: { name: 'Modulation', order: 6, icon: 'connect' },
  effects: { name: 'Effects', order: 7, icon: 'fx' },
  global: { name: 'Global', order: 8, icon: 'settings' },
} as const;
```

---

## 5. JUCE WebView Bridge

### Overview

The JUCE plugin hosts a WebView that runs your React UI. Communication happens via a bidirectional message bridge.

### Using the Bridge Hook

```typescript
// hooks/useJUCEBridge.ts

import { useEffect, useState, useCallback } from 'react';

interface JUCEBridge {
  // Send parameter change to DSP
  setParameter: (id: string, normalizedValue: number) => void;

  // Request current state
  requestState: () => void;

  // Subscribe to parameter updates from DSP
  onParameterUpdate: (callback: (id: string, value: number) => void) => void;

  // Connection status
  isConnected: boolean;
}

export function useJUCEBridge(): JUCEBridge {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if running in JUCE WebView
    if (window.__JUCE__) {
      setIsConnected(true);

      // Register message handler
      window.__JUCE__.onMessage((type, data) => {
        if (type === 'parameterUpdate') {
          // Handle incoming parameter updates
        }
      });
    }
  }, []);

  const setParameter = useCallback((id: string, value: number) => {
    if (window.__JUCE__) {
      window.__JUCE__.postMessage('parameterChange', { id, value });
    }
  }, []);

  const requestState = useCallback(() => {
    if (window.__JUCE__) {
      window.__JUCE__.postMessage('requestState', {});
    }
  }, []);

  return {
    setParameter,
    requestState,
    onParameterUpdate: () => {}, // Implemented via effect
    isConnected,
  };
}
```

### Message Protocol

```typescript
// Messages from UI to JUCE
interface UIToJUCEMessages {
  parameterChange: { id: string; value: number };
  requestState: {};
  presetLoad: { presetId: string };
  presetSave: { name: string };
}

// Messages from JUCE to UI
interface JUCEToUIMessages {
  parameterUpdate: { id: string; value: number; displayValue: string };
  stateSnapshot: { parameters: Record<string, number> };
  presetList: { presets: { id: string; name: string }[] };
  audioData: { left: Float32Array; right: Float32Array };
}
```

### Standalone/Demo Mode

When not running in JUCE, provide mock functionality:

```typescript
// hooks/useParameters.ts

export function useParameters(parameterDefs: ParameterMetadata[]) {
  const bridge = useJUCEBridge();
  const [values, setValues] = useState<Record<string, number>>({});

  // Initialize with defaults
  useEffect(() => {
    const defaults: Record<string, number> = {};
    parameterDefs.forEach(p => {
      defaults[p.id] = p.default;
    });
    setValues(defaults);
  }, [parameterDefs]);

  const setValue = useCallback((id: string, value: number) => {
    setValues(prev => ({ ...prev, [id]: value }));

    if (bridge.isConnected) {
      bridge.setParameter(id, value);
    }
  }, [bridge]);

  return { values, setValue };
}
```

---

## 6. Building New Components

### Component Structure

Follow this pattern for new audio UI components:

```typescript
// components/NewComponent.tsx

import React, { useCallback, useRef, useState } from 'react';

interface NewComponentProps {
  // Always include value and onChange for controlled behavior
  value: number;
  onChange: (value: number) => void;

  // Optional display customization
  label?: string;
  disabled?: boolean;

  // Style customization
  className?: string;
  style?: React.CSSProperties;
}

export function NewComponent({
  value,
  onChange,
  label,
  disabled = false,
  className,
  style,
}: NewComponentProps) {
  // Local state for interaction (dragging, etc.)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle value changes with validation
  const handleChange = useCallback((newValue: number) => {
    // Clamp to 0-1 range
    const clampedValue = Math.max(0, Math.min(1, newValue));
    onChange(clampedValue);
  }, [onChange]);

  // Interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    // ... interaction logic
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      className={`new-component ${disabled ? 'disabled' : ''} ${className || ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-label={label}
      tabIndex={disabled ? -1 : 0}
    >
      {label && <label className="component-label">{label}</label>}
      {/* Component visuals */}
    </div>
  );
}
```

### Creating Storybook Stories

Document every component with Storybook:

```typescript
// components/NewComponent.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NewComponent } from './NewComponent';

const meta: Meta<typeof NewComponent> = {
  title: 'Audio/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive story with state
const InteractiveTemplate = (args: any) => {
  const [value, setValue] = useState(args.value || 0.5);
  return <NewComponent {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: InteractiveTemplate,
  args: {
    value: 0.5,
    label: 'Parameter',
  },
};

export const Disabled: Story = {
  render: InteractiveTemplate,
  args: {
    value: 0.5,
    label: 'Disabled',
    disabled: true,
  },
};
```

### Adding Type Definitions

Create TypeScript definitions for JSX components:

```typescript
// components/NewComponent.d.ts

import { ComponentType } from 'react';

export interface NewComponentProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare const NewComponent: ComponentType<NewComponentProps>;
export default NewComponent;
```

---

## 7. State Management

### Parameter State Hook

```typescript
// hooks/useParameterState.ts

import { useState, useCallback, useMemo } from 'react';
import { ParameterMetadata } from '../types/parameters';
import { useJUCEBridge } from './useJUCEBridge';

interface ParameterState {
  value: number;
  displayValue: string;
  setValue: (value: number) => void;
  reset: () => void;
  metadata: ParameterMetadata;
}

export function useParameterState(metadata: ParameterMetadata): ParameterState {
  const [value, setLocalValue] = useState(metadata.default);
  const bridge = useJUCEBridge();

  const setValue = useCallback((newValue: number) => {
    const clamped = Math.max(0, Math.min(1, newValue));
    setLocalValue(clamped);
    bridge.setParameter(metadata.id, clamped);
  }, [metadata.id, bridge]);

  const reset = useCallback(() => {
    setValue(metadata.default);
  }, [metadata.default, setValue]);

  const displayValue = useMemo(
    () => formatDisplayValue(value, metadata),
    [value, metadata]
  );

  return { value, displayValue, setValue, reset, metadata };
}
```

### Synth Context Provider

```typescript
// context/SynthContext.tsx

import React, { createContext, useContext, useCallback } from 'react';
import { ParameterMetadata } from '../types/parameters';
import { useParameters } from '../hooks/useParameters';

interface SynthContextValue {
  parameters: Record<string, number>;
  setParameter: (id: string, value: number) => void;
  getParameter: (id: string) => number;
  parameterMetadata: Record<string, ParameterMetadata>;
  presetName: string;
  loadPreset: (id: string) => void;
}

const SynthContext = createContext<SynthContextValue | null>(null);

export function SynthProvider({
  children,
  parameterDefs,
}: {
  children: React.ReactNode;
  parameterDefs: ParameterMetadata[];
}) {
  const { values, setValue } = useParameters(parameterDefs);

  const parameterMetadata = useMemo(() => {
    const map: Record<string, ParameterMetadata> = {};
    parameterDefs.forEach(p => { map[p.id] = p; });
    return map;
  }, [parameterDefs]);

  const getParameter = useCallback((id: string) => {
    return values[id] ?? parameterMetadata[id]?.default ?? 0.5;
  }, [values, parameterMetadata]);

  return (
    <SynthContext.Provider value={{
      parameters: values,
      setParameter: setValue,
      getParameter,
      parameterMetadata,
      presetName: 'Init',
      loadPreset: () => {},
    }}>
      {children}
    </SynthContext.Provider>
  );
}

export function useSynth() {
  const context = useContext(SynthContext);
  if (!context) {
    throw new Error('useSynth must be used within SynthProvider');
  }
  return context;
}
```

---

## 8. Testing Components

### Unit Tests

```typescript
// components/__tests__/SynthKnob.test.tsx

import { render, fireEvent, screen } from '@testing-library/react';
import { SynthKnob } from '../SynthKnob';

describe('SynthKnob', () => {
  it('displays the correct value', () => {
    const onChange = jest.fn();
    render(<SynthKnob value={0.5} onChange={onChange} label="Test" />);

    expect(screen.getByLabelText('Test')).toBeInTheDocument();
  });

  it('calls onChange when dragged', () => {
    const onChange = jest.fn();
    render(<SynthKnob value={0.5} onChange={onChange} label="Test" />);

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob, { clientY: 100 });
    fireEvent.mouseMove(document, { clientY: 50 });
    fireEvent.mouseUp(document);

    expect(onChange).toHaveBeenCalled();
  });

  it('respects disabled state', () => {
    const onChange = jest.fn();
    render(<SynthKnob value={0.5} onChange={onChange} disabled />);

    const knob = screen.getByRole('slider');
    fireEvent.mouseDown(knob);
    fireEvent.mouseMove(document, { clientY: 50 });

    expect(onChange).not.toHaveBeenCalled();
  });
});
```

### Visual Regression Tests

Use Storybook's test runner for visual regression:

```typescript
// .storybook/test-runner.ts

import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

module.exports = {
  async postVisit(page, context) {
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot({
      customSnapshotsDir: '__snapshots__',
      customSnapshotIdentifier: context.id,
    });
  },
};
```

---

## 9. Best Practices

### Performance

1. **Memoize expensive computations**
   ```tsx
   const displayValue = useMemo(() =>
     formatDisplayValue(value, metadata),
     [value, metadata]
   );
   ```

2. **Use `useCallback` for handlers**
   ```tsx
   const handleChange = useCallback((v: number) => {
     onChange(v);
   }, [onChange]);
   ```

3. **Throttle high-frequency updates**
   ```tsx
   const throttledOnChange = useMemo(
     () => throttle(onChange, 16), // ~60fps
     [onChange]
   );
   ```

4. **Avoid layout thrashing**
   - Read DOM measurements before writes
   - Use CSS transforms instead of position changes
   - Batch state updates

### Accessibility

1. **Always include ARIA attributes**
   ```tsx
   <div
     role="slider"
     aria-valuenow={value}
     aria-valuemin={0}
     aria-valuemax={1}
     aria-label={label}
     tabIndex={0}
   >
   ```

2. **Support keyboard navigation**
   - Arrow keys for increment/decrement
   - Home/End for min/max
   - Enter/Space for toggle controls

3. **Provide visible focus indicators**
   ```css
   .synth-knob:focus-visible {
     outline: 2px solid var(--focus-color);
     outline-offset: 2px;
   }
   ```

### Responsive Design

1. **Use relative units**
   ```css
   .synth-knob {
     width: 4rem;
     height: 4rem;
   }
   ```

2. **Support touch interaction**
   ```tsx
   onTouchStart={handleTouchStart}
   onTouchMove={handleTouchMove}
   onTouchEnd={handleTouchEnd}
   ```

3. **Test on various screen sizes**
   - Desktop (1920x1080)
   - Laptop (1366x768)
   - Tablet (1024x768)
   - Mobile (375x667)

### Code Style

1. **Follow component naming convention**
   - Components: `PascalCase` (e.g., `SynthKnob`)
   - Hooks: `camelCase` with `use` prefix (e.g., `useParameterState`)
   - Utilities: `camelCase` (e.g., `formatDisplayValue`)

2. **Document props with JSDoc**
   ```tsx
   /**
    * Rotary knob control for continuous parameters
    * @param value - Normalized value (0-1)
    * @param onChange - Called when value changes
    * @param label - Display label
    */
   ```

3. **Export from index files**
   ```typescript
   // components/index.ts
   export { SynthKnob } from './SynthKnob';
   export { SynthSlider } from './SynthSlider';
   // ...
   ```

---

## Quick Reference

### Parameter Value Flow

```
User Interaction
      │
      ▼
Component Handler (0-1 normalized)
      │
      ▼
useParameterState / Context
      │
      ▼
JUCE Bridge (postMessage)
      │
      ▼
JUCE Plugin (AudioProcessorValueTreeState)
      │
      ▼
DSP Engine
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `hooks/useJUCEBridge.ts` | JUCE WebView communication |
| `hooks/useParameters.ts` | Parameter state management |
| `types/parameters.ts` | Parameter metadata types |
| `utils/parameterUtils.ts` | Normalization, formatting |
| `components/index.js` | Component exports |

### Common Parameter Configurations

| Parameter Type | Widget | Skew | Unit | Range |
|----------------|--------|------|------|-------|
| Frequency | Knob | 0.3 | Hz | 20-20000 |
| Time | Knob | 0.3 | ms/s | 0.001-10 |
| Volume | Slider | 1.0 | dB | -60 to +6 |
| Percentage | Knob | 1.0 | % | 0-100 |
| Choice | Dropdown | N/A | - | discrete |

---

**Document Version**: 1.0
**For**: Studio Component Library
**Maintained by**: UI Development Team
