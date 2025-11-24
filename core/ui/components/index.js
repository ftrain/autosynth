/**
 * @file index.js
 * @brief Synth UI Component Library - Main Export
 *
 * A comprehensive synthesizer component library for building virtual instrument
 * and audio software interfaces. All components are designed with consistent
 * styling using CSS design tokens.
 *
 * ## Component Categories
 *
 * ### Layout Components
 * - `Synth` - Main container for complete synthesizer interfaces
 * - `SynthRow` - Horizontal row layout for organizing controls
 *
 * ### Control Components
 * - `SynthKnob` - Rotary knob for continuous or stepped parameters
 * - `SynthSlider` - Linear fader for volume and other linear controls
 *
 * ### Envelope & Modulation
 * - `SynthADSR` - 4-stage envelope generator (Attack, Decay, Sustain, Release)
 * - `SynthDAHDSR` - 6-stage envelope (Delay, Attack, Hold, Decay, Sustain, Release)
 * - `SynthLFO` - Low Frequency Oscillator with waveform display
 *
 * ### Visualization
 * - `Oscilloscope` - Real-time waveform display
 * - `SynthVUMeter` - Level meter with peak hold
 *
 * ### Display & Indicators
 * - `SynthLCD` - Text display for patch names and parameters
 * - `SynthLED` - Status indicator lights
 *
 * ### Sequencing & Transport
 * - `SynthSequencer` - Step sequencer with pitch and gate
 * - `TransportControls` - Play/Pause/Stop/Record buttons
 *
 * ## Usage
 * ```jsx
 * import {
 *   Synth, SynthRow, SynthKnob, SynthSlider,
 *   SynthADSR, SynthLFO, Oscilloscope,
 *   SynthLCD, SynthLED, SynthVUMeter,
 *   SynthSequencer, TransportControls
 * } from './components';
 * ```
 */

// Layout
export { Synth } from './Synth';
export { SynthRow } from './SynthRow';

// Controls
export { SynthKnob } from './SynthKnob';
export { SynthSlider } from './SynthSlider';

// Envelopes & Modulation
export { SynthADSR } from './SynthADSR';
export { SynthDAHDSR } from './SynthDAHDSR';
export { SynthLFO } from './SynthLFO';

// Visualization
export { default as Oscilloscope } from './Oscilloscope';
export { SynthVUMeter } from './SynthVUMeter';

// Display & Indicators
export { SynthLCD } from './SynthLCD';
export { SynthLED } from './SynthLED';

// Sequencing & Transport
export { SynthSequencer } from './SynthSequencer';
export { TransportControls } from './TransportControls';

// Legacy exports from VintageSynthUI (if needed)
export { SynthToggle, SynthMultiSwitch } from './VintageSynthUI';
