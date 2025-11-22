/**
 * @file App.tsx
 * @brief Main synthesizer UI component
 *
 * This is the root component for the plugin UI. It:
 * - Manages parameter state via useParameters hook
 * - Connects to JUCE via useJUCEBridge hook
 * - Composes UI from the shared component library
 *
 * @note Use existing components from the component library - never create new ones
 * @see docs/TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';

// TODO: Import components from the shared library
// import { Synth, SynthRow, SynthKnob, SynthSlider, SynthADSR, SynthLFO } from '@studio/components';

/**
 * Main synthesizer UI
 */
const App: React.FC = () => {
  // Connect to JUCE backend
  const { isConnected, juceInfo, audioData } = useJUCEBridge({
    enableAudioData: true,
    audioChannel: 'master',
  });

  // Manage parameter state
  const { paramValues, handleChange, resetToDefaults } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  return (
    <div className="synth-container">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className="synth-header">
        <h1 className="synth-title">My Synth</h1>
        <span className="synth-version">v1.0.0</span>
        <div className="connection-status">
          <span
            className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
          />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* ================================================================
          OSCILLATOR SECTION
          TODO: Replace with actual components from library
          ================================================================ */}
      <section className="synth-section">
        <h2 className="section-title">Oscillator</h2>
        <div className="control-row">
          {/* TODO: Replace with SynthKnob from component library */}
          <div className="knob-placeholder">
            <label>Waveform</label>
            <select
              value={Math.round(paramValues.osc1_waveform || 0)}
              onChange={(e) => handleChange('osc1_waveform', parseInt(e.target.value) / 3)}
            >
              <option value={0}>Saw</option>
              <option value={1}>Square</option>
              <option value={2}>Triangle</option>
              <option value={3}>Sine</option>
            </select>
          </div>

          <div className="knob-placeholder">
            <label>Level</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={paramValues.osc1_level || 0.8}
              onChange={(e) => handleChange('osc1_level', parseFloat(e.target.value))}
            />
            <span>{Math.round((paramValues.osc1_level || 0.8) * 100)}%</span>
          </div>

          <div className="knob-placeholder">
            <label>Tune</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={(paramValues.osc1_tune || 0.5)}
              onChange={(e) => handleChange('osc1_tune', parseFloat(e.target.value))}
            />
            <span>{Math.round(((paramValues.osc1_tune || 0.5) - 0.5) * 48)} st</span>
          </div>
        </div>
      </section>

      {/* ================================================================
          FILTER SECTION
          TODO: Replace with actual components from library
          ================================================================ */}
      <section className="synth-section">
        <h2 className="section-title">Filter</h2>
        <div className="control-row">
          <div className="knob-placeholder">
            <label>Cutoff</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={paramValues.filter_cutoff || 0.5}
              onChange={(e) => handleChange('filter_cutoff', parseFloat(e.target.value))}
            />
            <span>{Math.round(20 + (paramValues.filter_cutoff || 0.5) * 19980)} Hz</span>
          </div>

          <div className="knob-placeholder">
            <label>Resonance</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={paramValues.filter_reso || 0}
              onChange={(e) => handleChange('filter_reso', parseFloat(e.target.value))}
            />
            <span>{Math.round((paramValues.filter_reso || 0) * 100)}%</span>
          </div>

          <div className="knob-placeholder">
            <label>Env Amount</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={paramValues.filter_env_amount || 0.5}
              onChange={(e) => handleChange('filter_env_amount', parseFloat(e.target.value))}
            />
            <span>{Math.round(((paramValues.filter_env_amount || 0.5) - 0.5) * 200)}%</span>
          </div>
        </div>
      </section>

      {/* ================================================================
          ENVELOPES SECTION
          TODO: Replace with SynthADSR components from library
          ================================================================ */}
      <section className="synth-section">
        <h2 className="section-title">Envelopes</h2>
        <div className="envelope-row">
          {/* Amp Envelope */}
          <div className="envelope-group">
            <h3>Amp</h3>
            <div className="adsr-controls">
              <div className="adsr-slider">
                <label>A</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.amp_attack || 0.01}
                  onChange={(e) => handleChange('amp_attack', parseFloat(e.target.value))}
                />
              </div>
              <div className="adsr-slider">
                <label>D</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.amp_decay || 0.1}
                  onChange={(e) => handleChange('amp_decay', parseFloat(e.target.value))}
                />
              </div>
              <div className="adsr-slider">
                <label>S</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.amp_sustain || 0.7}
                  onChange={(e) => handleChange('amp_sustain', parseFloat(e.target.value))}
                />
              </div>
              <div className="adsr-slider">
                <label>R</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.amp_release || 0.3}
                  onChange={(e) => handleChange('amp_release', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Filter Envelope */}
          <div className="envelope-group">
            <h3>Filter</h3>
            <div className="adsr-controls">
              <div className="adsr-slider">
                <label>A</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.filter_attack || 0.01}
                  onChange={(e) => handleChange('filter_attack', parseFloat(e.target.value))}
                />
              </div>
              <div className="adsr-slider">
                <label>D</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.filter_decay || 0.2}
                  onChange={(e) => handleChange('filter_decay', parseFloat(e.target.value))}
                />
              </div>
              <div className="adsr-slider">
                <label>S</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.filter_sustain || 0.5}
                  onChange={(e) => handleChange('filter_sustain', parseFloat(e.target.value))}
                />
              </div>
              <div className="adsr-slider">
                <label>R</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  orient="vertical"
                  value={paramValues.filter_release || 0.3}
                  onChange={(e) => handleChange('filter_release', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          MASTER SECTION
          ================================================================ */}
      <section className="synth-section master-section">
        <h2 className="section-title">Master</h2>
        <div className="control-row">
          <div className="knob-placeholder">
            <label>Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={paramValues.master_volume || 0.7}
              onChange={(e) => handleChange('master_volume', parseFloat(e.target.value))}
            />
            <span>{Math.round(-60 + (paramValues.master_volume || 0.7) * 60)} dB</span>
          </div>

          <button className="reset-button" onClick={resetToDefaults}>
            Reset
          </button>
        </div>
      </section>

      {/* ================================================================
          VISUALIZATION (if audio data available)
          TODO: Replace with Oscilloscope component from library
          ================================================================ */}
      {audioData.length > 0 && (
        <section className="synth-section">
          <h2 className="section-title">Output</h2>
          <div className="oscilloscope-placeholder">
            <canvas
              ref={(canvas) => {
                if (canvas && audioData.length > 0) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = '#00ff88';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    const step = canvas.width / audioData.length;
                    audioData.forEach((sample, i) => {
                      const x = i * step;
                      const y = canvas.height / 2 - sample * (canvas.height / 2);
                      if (i === 0) ctx.moveTo(x, y);
                      else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                  }
                }
              }}
              width={400}
              height={100}
            />
          </div>
        </section>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <footer className="debug-info">
          <small>
            JUCE: {isConnected ? 'Yes' : 'No'} |
            Sample Rate: {juceInfo.sampleRate || 'N/A'} |
            Buffer: {juceInfo.bufferSize || 'N/A'}
          </small>
        </footer>
      )}
    </div>
  );
};

export default App;
