import React from 'react';

interface OscilloscopeProps {
  label?: string;
  audioData?: number[];
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showGrid?: boolean;
  showPeaks?: boolean;
}

declare const Oscilloscope: React.FC<OscilloscopeProps>;
export default Oscilloscope;
