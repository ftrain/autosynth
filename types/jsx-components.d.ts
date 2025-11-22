// Type declarations for JSX component modules
// These need to be absolute paths from project root

declare module '*/VintageSynthUI.jsx' {
  export const SynthKnob: React.FC<any>;
  export const SynthToggle: React.FC<any>;
}

declare module '*/SynthADSR.jsx' {
  export const SynthADSR: React.FC<any>;
}

declare module '*/TransportControls.jsx' {
  export const TransportControls: React.FC<any>;
}

declare module '*/SynthRow.jsx' {
  export const SynthRow: React.FC<any>;
}

declare module '*/SynthSequencer.jsx' {
  export const SynthSequencer: React.FC<any>;
}

declare module '*/Oscilloscope.jsx' {
  const Oscilloscope: React.FC<any>;
  export default Oscilloscope;
}
