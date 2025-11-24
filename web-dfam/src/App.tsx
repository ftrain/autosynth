/**
 * @file App.tsx
 * @brief Web Synth Launcher - Home page linking to all synths
 */

import React, { useState, lazy, Suspense } from 'react';

// Lazy load synth components
const DFAMSynth = lazy(() => import('./synths/dfam/DFAMSynth'));
const TapeLoopSynth = lazy(() => import('./synths/tapeloop/TapeLoopSynth'));

type SynthType = 'home' | 'dfam' | 'tapeloop';

interface SynthInfo {
  id: SynthType;
  name: string;
  description: string;
  color: string;
  available: boolean;
}

const synths: SynthInfo[] = [
  {
    id: 'dfam',
    name: 'DFAM',
    description: 'Percussion synthesizer with 8-step sequencer, 2 VCOs, ladder filter, and effects',
    color: '#ff6600',
    available: true,
  },
  {
    id: 'tapeloop',
    name: 'TapeLoop',
    description: 'Tape loop drone engine with recording, playback, degradation, and dual sequencers',
    color: '#00ccff',
    available: true,
  },
];

const LoadingScreen: React.FC = () => (
  <div style={{
    background: '#0d0d0d',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontSize: '18px',
  }}>
    Loading synth...
  </div>
);

const App: React.FC = () => {
  const [activeSynth, setActiveSynth] = useState<SynthType>('home');

  const handleBack = () => setActiveSynth('home');

  // Render active synth
  if (activeSynth !== 'home') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        {activeSynth === 'dfam' && <DFAMSynth onBack={handleBack} />}
        {activeSynth === 'tapeloop' && <TapeLoopSynth onBack={handleBack} />}
      </Suspense>
    );
  }

  // Home page
  return (
    <div style={{
      background: '#0d0d0d',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px',
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px',
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: '48px',
          fontWeight: 'bold',
          letterSpacing: '8px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #ff6600, #ff00ff, #00ccff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          AUTOSYNTH
        </h1>
        <p style={{
          color: '#666',
          fontSize: '16px',
          letterSpacing: '2px',
        }}>
          Web Audio Synthesizers
        </p>
      </div>

      {/* Synth Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {synths.map((synth) => (
          <button
            key={synth.id}
            onClick={() => synth.available && setActiveSynth(synth.id)}
            disabled={!synth.available}
            style={{
              background: `linear-gradient(145deg, rgba(${hexToRgb(synth.color)}, 0.15), rgba(${hexToRgb(synth.color)}, 0.05))`,
              border: `2px solid ${synth.available ? synth.color : '#333'}`,
              borderRadius: '16px',
              padding: '32px',
              cursor: synth.available ? 'pointer' : 'not-allowed',
              opacity: synth.available ? 1 : 0.5,
              transition: 'transform 0.2s, box-shadow 0.2s',
              textAlign: 'left',
            }}
            onMouseOver={(e) => {
              if (synth.available) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 32px rgba(${hexToRgb(synth.color)}, 0.3)`;
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h2 style={{
              color: synth.color,
              fontSize: '32px',
              fontWeight: 'bold',
              letterSpacing: '4px',
              marginBottom: '12px',
              textShadow: `0 0 20px ${synth.color}40`,
            }}>
              {synth.name}
            </h2>
            <p style={{
              color: '#888',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: 0,
            }}>
              {synth.description}
            </p>
            {!synth.available && (
              <span style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '4px 8px',
                background: '#333',
                borderRadius: '4px',
                color: '#666',
                fontSize: '12px',
              }}>
                Coming Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '60px',
        color: '#444',
        fontSize: '12px',
      }}>
        <p>Built with WebAssembly + AudioWorklet + React</p>
      </div>
    </div>
  );
};

// Helper to convert hex color to RGB string
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

export default App;
