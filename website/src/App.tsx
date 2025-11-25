import React, { useEffect, useState } from 'react';
import './App.css';

interface Synth {
  name: string;
  path: string;
}

const App: React.FC = () => {
  const [synths, setSynths] = useState<Synth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/synths.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load synths');
        return res.json();
      })
      .then(data => {
        setSynths(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container loading">
        <div className="spinner"></div>
        <p>Loading synths...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">♪</div>
          <h1>AutoSynth</h1>
        </div>
        <p className="tagline">
          Web-Native Synthesizers Built with WebAssembly
        </p>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h2>Professional Synthesizers in Your Browser</h2>
        <p>
          No plugins. No downloads. No installation. Just click and play.
        </p>
        <div className="tech-stack">
          <span className="tech-badge">WebAssembly</span>
          <span className="tech-badge">Web Audio API</span>
          <span className="tech-badge">Web MIDI</span>
          <span className="tech-badge">React</span>
        </div>
      </section>

      {/* Synths Grid */}
      <section className="synths-section">
        <h2 className="section-title">
          Available Synthesizers
          <span className="synth-count">{synths.length}</span>
        </h2>

        {synths.length === 0 ? (
          <div className="empty-state">
            <p>No synths available yet.</p>
            <p className="empty-hint">
              Create your first synth with: <code>./scripts/new-synth.sh</code>
            </p>
          </div>
        ) : (
          <div className="synths-grid">
            {synths.map((synth) => (
              <a
                key={synth.name}
                href={synth.path}
                className="synth-card"
              >
                <div className="synth-icon">
                  <span>🎹</span>
                </div>
                <h3 className="synth-name">{synth.name}</h3>
                <div className="synth-meta">
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    WASM
                  </span>
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    MIDI
                  </span>
                </div>
                <button className="launch-button">Launch Synth →</button>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="features">
        <h2>Built for the Modern Web</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>High Performance</h3>
            <p>
              DSP engines compiled to WebAssembly for native-like performance
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎛️</div>
            <h3>MIDI Support</h3>
            <p>
              Connect your MIDI keyboards and controllers via Web MIDI API
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔊</div>
            <h3>Pro Audio</h3>
            <p>
              SST, Airwindows, and ChowDSP libraries for studio-quality sound
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Cross-Platform</h3>
            <p>
              Works on any device with a modern browser - no installation needed
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>AutoSynth</h4>
            <p>Web-native synthesizer framework</p>
          </div>
          <div className="footer-section">
            <h4>Technology</h4>
            <ul>
              <li>WebAssembly (Emscripten)</li>
              <li>Web Audio API</li>
              <li>Web MIDI API</li>
              <li>React + TypeScript</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>DSP Libraries</h4>
            <ul>
              <li>SST (Surge Synth Team)</li>
              <li>Airwindows</li>
              <li>ChowDSP</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Browser Support</h4>
            <ul>
              <li>Chrome / Edge (full MIDI)</li>
              <li>Firefox (no MIDI)</li>
              <li>Safari (limited)</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 AutoSynth. Open source synthesizer framework.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
