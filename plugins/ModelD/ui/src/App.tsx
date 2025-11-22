/**
 * @file App.tsx
 * @brief Model D Synthesizer UI Component
 *
 * This is the root component for the Model D plugin UI. It:
 * - Manages parameter state via useParameters hook
 * - Connects to JUCE via useJUCEBridge hook
 * - Implements a classic Minimoog-style layout
 *
 * Layout based on Minimoog Model D:
 * - 3 Oscillators with waveform, octave, and level controls
 * - Mixer section with noise
 * - 24dB/oct Ladder Filter with envelope modulation
 * - Filter and Amp ADSR envelopes
 * - Master volume
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS, WAVEFORM_OPTIONS, OCTAVE_OPTIONS } from './types/parameters';

/**
 * Oscillator Section Component
 */
interface OscillatorProps {
  title: string;
  waveformId: string;
  octaveId: string;
  levelId: string;
  detuneId?: string;
  syncId?: string;
  paramValues: Record<string, number>;
  handleChange: (id: string, value: number) => void;
}

const OscillatorSection: React.FC<OscillatorProps> = ({
  title,
  waveformId,
  octaveId,
  levelId,
  detuneId,
  syncId,
  paramValues,
  handleChange,
}) => {
  return (
    <div className="oscillator-section">
      <h3>{title}</h3>
      <div className="control-row">
        <div className="control-group">
          <label>Waveform</label>
          <select
            value={Math.round(paramValues[waveformId] || 0)}
            onChange={(e) => handleChange(waveformId, parseInt(e.target.value))}
          >
            {WAVEFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Octave</label>
          <select
            value={Math.round(paramValues[octaveId] || 0)}
            onChange={(e) => handleChange(octaveId, parseInt(e.target.value))}
          >
            {OCTAVE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {detuneId && (
          <div className="control-group">
            <label>Detune</label>
            <input
              type="range"
              min={-50}
              max={50}
              step={1}
              value={paramValues[detuneId] || 0}
              onChange={(e) => handleChange(detuneId, parseFloat(e.target.value))}
            />
            <span>{Math.round(paramValues[detuneId] || 0)} cents</span>
          </div>
        )}

        <div className="control-group">
          <label>Level</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={paramValues[levelId] || 0}
            onChange={(e) => handleChange(levelId, parseFloat(e.target.value))}
          />
          <span>{Math.round((paramValues[levelId] || 0) * 100)}%</span>
        </div>

        {syncId && (
          <div className="control-group sync-control">
            <label>
              <input
                type="checkbox"
                checked={paramValues[syncId] > 0.5}
                onChange={(e) => handleChange(syncId, e.target.checked ? 1 : 0)}
              />
              Sync
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ADSR Envelope Component
 */
interface ADSRProps {
  title: string;
  attackId: string;
  decayId: string;
  sustainId: string;
  releaseId: string;
  paramValues: Record<string, number>;
  handleChange: (id: string, value: number) => void;
}

const ADSRSection: React.FC<ADSRProps> = ({
  title,
  attackId,
  decayId,
  sustainId,
  releaseId,
  paramValues,
  handleChange,
}) => {
  return (
    <div className="envelope-group">
      <h3>{title}</h3>
      <div className="adsr-controls">
        <div className="adsr-slider">
          <label>A</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={paramValues[attackId] || 0.01}
            onChange={(e) => handleChange(attackId, parseFloat(e.target.value))}
            className="vertical-slider"
          />
        </div>
        <div className="adsr-slider">
          <label>D</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={paramValues[decayId] || 0.1}
            onChange={(e) => handleChange(decayId, parseFloat(e.target.value))}
            className="vertical-slider"
          />
        </div>
        <div className="adsr-slider">
          <label>S</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={paramValues[sustainId] || 0.7}
            onChange={(e) => handleChange(sustainId, parseFloat(e.target.value))}
            className="vertical-slider"
          />
        </div>
        <div className="adsr-slider">
          <label>R</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={paramValues[releaseId] || 0.3}
            onChange={(e) => handleChange(releaseId, parseFloat(e.target.value))}
            className="vertical-slider"
          />
        </div>
      </div>
    </div>
  );
};

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
    <div className="synth-container model-d">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className="synth-header">
        <h1 className="synth-title">Model D</h1>
        <span className="synth-subtitle">Minimoog-Style Synthesizer</span>
        <div className="connection-status">
          <span
            className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
          />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* ================================================================
          OSCILLATORS SECTION
          ================================================================ */}
      <section className="synth-section oscillators-panel">
        <h2 className="section-title">Oscillator Bank</h2>

        <OscillatorSection
          title="Oscillator 1"
          waveformId="osc1_waveform"
          octaveId="osc1_octave"
          levelId="osc1_level"
          paramValues={paramValues}
          handleChange={handleChange}
        />

        <OscillatorSection
          title="Oscillator 2"
          waveformId="osc2_waveform"
          octaveId="osc2_octave"
          levelId="osc2_level"
          detuneId="osc2_detune"
          syncId="osc2_sync"
          paramValues={paramValues}
          handleChange={handleChange}
        />

        <OscillatorSection
          title="Oscillator 3"
          waveformId="osc3_waveform"
          octaveId="osc3_octave"
          levelId="osc3_level"
          detuneId="osc3_detune"
          paramValues={paramValues}
          handleChange={handleChange}
        />

        {/* Noise */}
        <div className="oscillator-section noise-section">
          <h3>Noise</h3>
          <div className="control-row">
            <div className="control-group">
              <label>Level</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={paramValues.noise_level || 0}
                onChange={(e) => handleChange('noise_level', parseFloat(e.target.value))}
              />
              <span>{Math.round((paramValues.noise_level || 0) * 100)}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FILTER SECTION
          ================================================================ */}
      <section className="synth-section filter-panel">
        <h2 className="section-title">Ladder Filter</h2>
        <div className="control-row filter-controls">
          <div className="control-group cutoff-control">
            <label>Cutoff</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={Math.pow((paramValues.filter_cutoff || 5000) / 20000, 1/3)}
              onChange={(e) => {
                const normalized = parseFloat(e.target.value);
                const freq = Math.pow(normalized, 3) * 20000;
                handleChange('filter_cutoff', Math.max(20, freq));
              }}
            />
            <span>
              {(paramValues.filter_cutoff || 5000) >= 1000
                ? `${((paramValues.filter_cutoff || 5000) / 1000).toFixed(1)} kHz`
                : `${Math.round(paramValues.filter_cutoff || 5000)} Hz`}
            </span>
          </div>

          <div className="control-group">
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

          <div className="control-group">
            <label>Env Amount</label>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={paramValues.filter_env_amount || 0.5}
              onChange={(e) => handleChange('filter_env_amount', parseFloat(e.target.value))}
            />
            <span>{Math.round((paramValues.filter_env_amount || 0.5) * 100)}%</span>
          </div>

          <div className="control-group">
            <label>Kbd Track</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={paramValues.filter_kbd_track || 0}
              onChange={(e) => handleChange('filter_kbd_track', parseFloat(e.target.value))}
            />
            <span>{Math.round((paramValues.filter_kbd_track || 0) * 100)}%</span>
          </div>
        </div>
      </section>

      {/* ================================================================
          ENVELOPES SECTION
          ================================================================ */}
      <section className="synth-section envelopes-panel">
        <h2 className="section-title">Envelopes</h2>
        <div className="envelope-row">
          <ADSRSection
            title="Filter Envelope"
            attackId="filter_attack"
            decayId="filter_decay"
            sustainId="filter_sustain"
            releaseId="filter_release"
            paramValues={paramValues}
            handleChange={handleChange}
          />

          <ADSRSection
            title="Amp Envelope"
            attackId="amp_attack"
            decayId="amp_decay"
            sustainId="amp_sustain"
            releaseId="amp_release"
            paramValues={paramValues}
            handleChange={handleChange}
          />
        </div>
      </section>

      {/* ================================================================
          MASTER SECTION
          ================================================================ */}
      <section className="synth-section master-panel">
        <h2 className="section-title">Output</h2>
        <div className="control-row">
          <div className="control-group volume-control">
            <label>Master Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={(paramValues.master_volume + 60) / 60}
              onChange={(e) => {
                const normalized = parseFloat(e.target.value);
                const db = normalized * 60 - 60;
                handleChange('master_volume', db);
              }}
            />
            <span>{(paramValues.master_volume || -6).toFixed(1)} dB</span>
          </div>

          <button className="reset-button" onClick={resetToDefaults}>
            Reset All
          </button>
        </div>
      </section>

      {/* ================================================================
          VISUALIZATION (if audio data available)
          ================================================================ */}
      {audioData.length > 0 && (
        <section className="synth-section visualization-panel">
          <div className="oscilloscope">
            <canvas
              ref={(canvas) => {
                if (canvas && audioData.length > 0) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
              height={80}
            />
          </div>
        </section>
      )}

      {/* Debug info in development */}
      {import.meta.env.DEV && (
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
