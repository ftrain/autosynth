/**
 * Component prop types for FM Drums UI
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
