import { useState } from 'react';
import './App.css';
import { useFaustDSP } from './hooks/useFaustDSP';

function App() {
  const { isReady, isPlaying, error, start, stop, setParam } = useFaustDSP({
    processorUrl: '/dsp/simple-synth-processor.js',
    autoStart: false,
  });

  // UI state for parameters
  const [frequency, setFrequency] = useState(440);
  const [filterCutoff, setFilterCutoff] = useState(2000);
  const [resonance, setResonance] = useState(1);
  const [volume, setVolume] = useState(0.5);
  const [waveform, setWaveform] = useState(0);

  const waveformNames = ['Sine', 'Sawtooth', 'Square'];

  // Handle parameter changes
  const handleFrequencyChange = (value: number) => {
    setFrequency(value);
    setParam('frequency', value);
  };

  const handleFilterCutoffChange = (value: number) => {
    setFilterCutoff(value);
    setParam('filterCutoff', value);
  };

  const handleResonanceChange = (value: number) => {
    setResonance(value);
    setParam('resonance', value);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setParam('volume', value);
  };

  const handleWaveformChange = (value: number) => {
    setWaveform(value);
    setParam('waveform', value);
  };

  return (
    <div className="app">
      <header>
        <h1>🎹 Faust WASM Test Environment</h1>
        <p className="subtitle">Rapid prototyping for DSP algorithms</p>
      </header>

      <main>
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <br />
            <small>
              Make sure to run <code>./dsp/build.sh</code> to compile the Faust DSP first.
            </small>
          </div>
        )}

        <div className="transport">
          <button
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={isPlaying ? stop : start}
            disabled={!isReady && isPlaying}
          >
            {isPlaying ? '⏸ Stop' : '▶ Start'}
          </button>
          <div className="status">
            {!isReady && !error && <span className="badge">Loading...</span>}
            {isReady && !isPlaying && <span className="badge">Ready</span>}
            {isPlaying && <span className="badge playing">Playing</span>}
          </div>
        </div>

        <div className="controls">
          <div className="control-group">
            <label>
              <span className="label-text">Oscillator</span>
              <div className="button-group">
                {waveformNames.map((name, idx) => (
                  <button
                    key={name}
                    className={`waveform-button ${waveform === idx ? 'active' : ''}`}
                    onClick={() => handleWaveformChange(idx)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="control-group">
            <label>
              <span className="label-text">
                Frequency: <strong>{frequency} Hz</strong>
              </span>
              <input
                type="range"
                min="20"
                max="5000"
                step="1"
                value={frequency}
                onChange={(e) => handleFrequencyChange(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              <span className="label-text">
                Filter Cutoff: <strong>{filterCutoff} Hz</strong>
              </span>
              <input
                type="range"
                min="20"
                max="20000"
                step="1"
                value={filterCutoff}
                onChange={(e) => handleFilterCutoffChange(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              <span className="label-text">
                Resonance: <strong>{resonance.toFixed(1)}</strong>
              </span>
              <input
                type="range"
                min="1"
                max="20"
                step="0.1"
                value={resonance}
                onChange={(e) => handleResonanceChange(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              <span className="label-text">
                Volume: <strong>{(volume * 100).toFixed(0)}%</strong>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="info">
          <h3>About</h3>
          <p>
            This is a test environment for rapidly prototyping DSP algorithms using Faust and
            WebAssembly. Edit <code>dsp/simple-synth.dsp</code>, run <code>./dsp/build.sh</code>,
            and reload to hear your changes.
          </p>
          <h3>Technology Stack</h3>
          <ul>
            <li>
              <strong>Faust</strong> - Functional DSP language that compiles to WASM
            </li>
            <li>
              <strong>Web Audio API</strong> - AudioWorklet for real-time audio processing
            </li>
            <li>
              <strong>React + Vite</strong> - Fast UI development with hot module replacement
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
