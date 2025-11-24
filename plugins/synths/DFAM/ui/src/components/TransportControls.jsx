/**
 * @file TransportControls.jsx
 * @brief Transport controls (play/pause/stop/record)
 *
 * @description
 * Standard transport control bar with Play/Pause, Stop, and Record buttons.
 * Provides visual feedback for current playback and recording state.
 *
 * ## Use Cases
 * - **Sequencer Control**: Play/stop step sequencer playback
 * - **Audio Recording**: Start/stop audio capture with record button
 * - **Pattern Playback**: Control pattern or loop playback
 * - **Live Performance**: Quick access to playback controls
 * - **DAW Integration**: Sync with external DAW transport
 *
 * ## Button States
 * - **Play**: Illuminates when playing, shows pause icon
 * - **Pause**: Toggles with play, shows play icon when paused
 * - **Stop**: Returns to beginning, resets play and record state
 * - **Record**: Red illumination when armed/recording
 *
 * ## Features
 * - Play/Pause toggle functionality
 * - Record automatically starts playback
 * - Stop resets all states
 * - Visual glow feedback for active states
 *
 * @example
 * ```jsx
 * <TransportControls
 *   isPlaying={isPlaying}
 *   isRecording={isRecording}
 *   onPlay={() => startPlayback()}
 *   onPause={() => pausePlayback()}
 *   onStop={() => stopPlayback()}
 *   onRecord={(recording) => setRecording(recording)}
 * />
 * ```
 */

import React, { useState } from 'react';

export const TransportControls = ({
  isPlaying: propIsPlaying,
  isRecording: propIsRecording,
  onPlay,
  onPause,
  onStop,
  onRecord,
  defaultIsPlaying = false,
  defaultIsRecording = false
}) => {
  const [isPlaying, setIsPlaying] = useState(propIsPlaying ?? defaultIsPlaying);
  const [isRecording, setIsRecording] = useState(propIsRecording ?? defaultIsRecording);

  const handleIsPlaying = propIsPlaying ?? isPlaying;
  const handleIsRecording = propIsRecording ?? isRecording;

  const handlePlayClick = () => {
    console.log('[TransportControls] Play/Pause clicked, currently:', handleIsPlaying);
    if (handleIsPlaying) {
      console.log('[TransportControls] Calling onPause');
      setIsPlaying(false);
      onPause?.();
    } else {
      console.log('[TransportControls] Calling onPlay');
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const handleStopClick = () => {
    console.log('[TransportControls] Stop clicked');
    setIsPlaying(false);
    setIsRecording(false);
    onStop?.();
  };

  const handleRecordClick = () => {
    console.log('[TransportControls] Record clicked');
    const newRecording = !handleIsRecording;
    setIsRecording(newRecording);
    if (newRecording) {
      setIsPlaying(true);
    }
    onRecord?.(newRecording);
  };

  const TransportButton = ({ icon, active, onClick, color = 'white' }) => {
    const colorMap = {
      white: {
        on: 'rgba(255,255,255,0.9)',
        glow: 'rgba(255,255,255,0.8)',
      },
      red: {
        on: 'rgba(255,50,50,0.9)',
        glow: 'rgba(255,50,50,0.8)',
      },
    };

    const selectedColor = colorMap[color] || colorMap.white;
    const fillColor = active ? selectedColor.on : '#666';

    return (
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 150ms',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: active
            ? 'radial-gradient(circle at 30% 30%, #3a3a3a, #1a1a1a)'
            : 'radial-gradient(circle at 30% 30%, #2a2a2a, #0a0a0a)',
          boxShadow: active
            ? `inset 2px 2px 4px rgba(0,0,0,0.9), 0 0 16px ${selectedColor.glow}, 0 0 8px ${selectedColor.glow}`
            : 'inset 1px 1px 2px rgba(0,0,0,0.7), 2px 2px 4px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          style={{
            filter: active ? `drop-shadow(0 0 4px ${selectedColor.glow})` : 'none',
          }}
        >
          {icon === 'play' && (
            <path
              d="M8 5v14l11-7z"
              fill={fillColor}
            />
          )}
          {icon === 'pause' && (
            <>
              <rect x="6" y="4" width="4" height="16" fill={fillColor} />
              <rect x="14" y="4" width="4" height="16" fill={fillColor} />
            </>
          )}
          {icon === 'stop' && (
            <rect x="6" y="6" width="12" height="12" fill={fillColor} />
          )}
          {icon === 'record' && (
            <circle cx="12" cy="12" r="6" fill={fillColor} />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--synth-space-sm)' }}>
      <div style={{ color: 'var(--synth-text-primary)', fontSize: 'var(--synth-font-size-sm)', fontWeight: 'bold', letterSpacing: '1.5px' }}>TRANSPORT</div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 'var(--synth-space-md)',
          padding: 'var(--synth-space-md)',
          width: 'var(--synth-3k)',
          height: 'var(--synth-1k)',
          borderRadius: 'var(--synth-radius-md)',
          background: 'var(--synth-gradient-inset)',
          boxShadow: 'var(--synth-shadow-inset)',
        }}
      >
        {/* Play/Pause */}
        <TransportButton
          icon={handleIsPlaying ? 'pause' : 'play'}
          active={handleIsPlaying}
          onClick={handlePlayClick}
        />

        {/* Stop */}
        <TransportButton
          icon="stop"
          active={false}
          onClick={handleStopClick}
        />

        {/* Record */}
        <TransportButton
          icon="record"
          active={handleIsRecording}
          onClick={handleRecordClick}
          color="red"
        />
      </div>
    </div>
  );
};
