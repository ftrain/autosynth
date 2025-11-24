import React from 'react';

export interface OscilloscopeProps {
  /** Audio sample data array (normalized -1 to +1) */
  audioData?: number[];
  /** Display width in pixels */
  width?: number;
  /** Display height in pixels */
  height?: number;
  /** Waveform color (CSS color string) */
  color?: string;
  /** Show grid overlay */
  showGrid?: boolean;
  /** Show peak level indicators */
  showPeaks?: boolean;
  /** Component label */
  label?: string;
}

declare const Oscilloscope: React.FC<OscilloscopeProps>;

export default Oscilloscope;
