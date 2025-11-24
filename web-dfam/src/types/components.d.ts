/**
 * @file components.ts
 * @brief TypeScript type definitions for React components
 * @note Copied from core/ui/types/components.d.ts - keep in sync
 */

import * as React from 'react';

/**
 * Base props for controlled components
 */
export interface ControlledComponentProps<T> {
  /** Current value (controlled mode) */
  value?: T;
  /** Change handler */
  onChange?: (value: T) => void;
  /** Default value (uncontrolled mode) */
  defaultValue?: T;
}

/**
 * SynthKnob component props
 */
export interface SynthKnobProps extends ControlledComponentProps<number> {
  /** Label text */
  label: string;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Optional step size */
  step?: number;
  /** Optional array of string labels for stepped values */
  options?: string[];
}

/**
 * SynthToggle component props
 */
export interface SynthToggleProps extends ControlledComponentProps<boolean> {
  /** Label text */
  label: string;
}

/**
 * SynthMultiSwitch component props
 */
export interface SynthMultiSwitchProps extends ControlledComponentProps<number> {
  /** Label text */
  label: string;
  /** Available options */
  options: string[];
}

/**
 * SynthSlider component props
 */
export interface SynthSliderProps extends ControlledComponentProps<number> {
  /** Label text */
  label: string;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Optional step size */
  step?: number;
}

/**
 * SynthADSR component props
 */
export interface SynthADSRProps {
  /** Label text */
  label?: string;
  /** Attack value (0-100) */
  attack?: number;
  /** Decay value (0-100) */
  decay?: number;
  /** Sustain value (0-100) */
  sustain?: number;
  /** Release value (0-100) */
  release?: number;
  /** Attack change handler */
  onAttackChange?: (value: number) => void;
  /** Decay change handler */
  onDecayChange?: (value: number) => void;
  /** Sustain change handler */
  onSustainChange?: (value: number) => void;
  /** Release change handler */
  onReleaseChange?: (value: number) => void;
  /** Default attack value */
  defaultAttack?: number;
  /** Default decay value */
  defaultDecay?: number;
  /** Default sustain value */
  defaultSustain?: number;
  /** Default release value */
  defaultRelease?: number;
}

/**
 * SynthLFO component props
 */
export interface SynthLFOProps {
  /** Label text */
  label?: string;
  /** Current waveform index */
  waveform?: number;
  /** Current rate value */
  rate?: number;
  /** Waveform change handler */
  onWaveformChange?: (value: number) => void;
  /** Rate change handler */
  onRateChange?: (value: number) => void;
}

/**
 * Sequencer component props
 */
export interface SequencerProps {
  /** Label text */
  label?: string;
  /** Step values (0-100) */
  steps: number[];
  /** Current playing step index */
  currentStep?: number;
  /** Steps change handler */
  onStepsChange?: (steps: number[]) => void;
  /** Playing state */
  isPlaying?: boolean;
  /** Playing state change handler */
  onPlayingChange?: (playing: boolean) => void;
  /** Bipolar mode */
  bipolar?: boolean;
}

/**
 * ModMatrix component props
 */
export interface ModMatrixProps {
  /** Available sources */
  sources: string[];
  /** Available destinations */
  destinations: string[];
  /** Current routing configuration */
  routings: ModRouting[];
  /** Routing change handler */
  onRoutingsChange?: (routings: ModRouting[]) => void;
}

/**
 * Modulation routing definition
 */
export interface ModRouting {
  /** Source parameter ID */
  source: string;
  /** Destination parameter ID */
  destination: string;
  /** Modulation amount (-1 to 1) */
  amount: number;
}

/**
 * Oscilloscope component props
 */
export interface OscilloscopeProps {
  /** Label text */
  label?: string;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Audio data array (-1 to 1) */
  audioData?: number[];
  /** Waveform color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Grid color */
  gridColor?: string;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show peak indicators */
  showPeaks?: boolean;
}

/**
 * SynthLED component props
 */
export interface SynthLEDProps {
  /** Label text */
  label?: string;
  /** LED state */
  isOn?: boolean;
  /** LED color */
  color?: 'white' | 'red' | 'green' | 'blue' | 'yellow';
}

/**
 * SynthLCD component props
 */
export interface SynthLCDProps {
  /** Text to display */
  text: string;
  /** Number of lines */
  lines?: number;
}

/**
 * SynthVUMeter component props
 */
export interface SynthVUMeterProps {
  /** Label text */
  label?: string;
  /** Current level (0-1) */
  level?: number;
  /** Peak level (0-1) */
  peakLevel?: number;
  /** Orientation */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * TransportControls component props
 */
export interface TransportControlsProps {
  /** Playing state */
  isPlaying?: boolean;
  /** Recording state */
  isRecording?: boolean;
  /** Play button handler */
  onPlay?: () => void;
  /** Pause button handler */
  onPause?: () => void;
  /** Stop button handler */
  onStop?: () => void;
  /** Record button handler */
  onRecord?: () => void;
}

/**
 * PresetBrowser component props
 */
export interface PresetBrowserProps {
  /** Available presets */
  presets?: string[];
  /** Current preset name */
  currentPreset?: string;
  /** Load preset handler */
  onLoadPreset?: (name: string) => void;
  /** Save preset handler */
  onSavePreset?: (name: string) => void;
  /** Delete preset handler */
  onDeletePreset?: (name: string) => void;
}

/**
 * FMSynthUI component props
 */
export interface FMSynthUIProps {
  /** Current parameter values */
  parameters: Record<string, number>;
  /** Parameter change handler */
  onChange: (paramId: string, value: number) => void;
}

/**
 * FMOperatorPanel component props
 */
export interface FMOperatorPanelProps {
  /** Operator index (0-5) */
  opIndex: number;
  /** Current parameter values */
  parameters: Record<string, number>;
  /** Parameter change handler */
  onChange: (paramId: string, value: number) => void;
}

/**
 * AlgorithmSelector component props
 */
export interface AlgorithmSelectorProps {
  /** Current algorithm (1-32) */
  value: number;
  /** Algorithm change handler */
  onChange: (value: number) => void;
}

/**
 * SpeechSynthUI component props
 */
export interface SpeechSynthUIProps {
  /** Current parameter values */
  parameters: Record<string, number>;
  /** Parameter change handler */
  onChange: (paramId: string, value: number) => void;
}

/**
 * Layout component props
 */
export interface LayoutProps {
  /** Child elements */
  children?: React.ReactNode;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * ParameterGroup component props
 */
export interface ParameterGroupProps extends LayoutProps {
  /** Group title */
  title: string;
  /** Collapsible state */
  collapsible?: boolean;
  /** Initial open state */
  isOpen?: boolean;
  /** Toggle handler */
  onToggle?: () => void;
}

/**
 * Row component props
 */
export interface RowProps extends LayoutProps {
  /** Gap between items */
  gap?: string | number;
  /** Alignment */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  /** Wrap behavior */
  wrap?: boolean;
}

/**
 * Column component props
 */
export interface ColumnProps extends LayoutProps {
  /** Gap between items */
  gap?: string | number;
  /** Alignment */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}
