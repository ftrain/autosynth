/**
 * Component prop types
 */

export interface SynthKnobProps {
  label: string;
  min: number;
  max: number;
  value?: number;
  onChange?: (value: number) => void;
  defaultValue?: number;
  step?: number;
  options?: string[];
}

export interface SynthADSRProps {
  label?: string;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  onAttackChange?: (value: number) => void;
  onDecayChange?: (value: number) => void;
  onSustainChange?: (value: number) => void;
  onReleaseChange?: (value: number) => void;
  defaultAttack?: number;
  defaultDecay?: number;
  defaultSustain?: number;
  defaultRelease?: number;
  maxAttack?: number;
  maxDecay?: number;
  maxRelease?: number;
  tabs?: string[];
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

export interface SynthSliderProps {
  label: string;
  min: number;
  max: number;
  value?: number;
  onChange?: (value: number) => void;
  vertical?: boolean;
}

export interface SynthRowProps {
  children: React.ReactNode;
  label?: string;
  gap?: string;
  align?: string;
  justify?: string;
  padding?: string;
  wrap?: boolean;
  showPanel?: boolean;
  showDivider?: boolean;
  style?: React.CSSProperties;
}

export interface OscilloscopeProps {
  label?: string;
  audioData?: number[];
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showPeaks?: boolean;
}
