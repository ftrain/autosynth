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
}

export interface SynthSliderProps {
  label: string;
  min: number;
  max: number;
  value?: number;
  onChange?: (value: number) => void;
  vertical?: boolean;
}
