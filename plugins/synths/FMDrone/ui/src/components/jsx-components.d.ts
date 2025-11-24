/**
 * Type declarations for JSX components
 */

declare module './SynthADSR' {
  import React from 'react';

  interface SynthADSRProps {
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

  export const SynthADSR: React.FC<SynthADSRProps>;
}

declare module './SynthRow' {
  import React from 'react';

  interface SynthRowProps {
    children?: React.ReactNode;
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

  export const SynthRow: React.FC<SynthRowProps>;
  export default SynthRow;
}

declare module './Oscilloscope' {
  import React from 'react';

  interface OscilloscopeProps {
    label?: string;
    audioData?: number[];
    width?: number;
    height?: number;
    color?: string;
    showGrid?: boolean;
    showPeaks?: boolean;
  }

  const Oscilloscope: React.FC<OscilloscopeProps>;
  export default Oscilloscope;
}
