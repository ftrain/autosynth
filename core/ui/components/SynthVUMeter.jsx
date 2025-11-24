/**
 * @file SynthVUMeter.jsx
 * @brief VU meter display component for level visualization
 *
 * @description
 * A classic segmented VU meter with peak hold functionality.
 * Displays audio levels with color-coded segments (green/yellow/red zones).
 *
 * ## Use Cases
 * - **Output Level**: Monitor master or channel output levels
 * - **Input Monitoring**: Show input signal strength
 * - **Gain Staging**: Visual feedback for proper gain structure
 * - **Stereo Metering**: Paired L/R meters for stereo monitoring
 * - **Sidechain Monitor**: Show compressor sidechain level
 * - **Envelope Follower**: Display envelope output level
 * - **LFO Depth**: Visualize modulation depth
 *
 * ## Level Zones
 * - **Green (0-70%)**: Safe operating level
 * - **Yellow (70-85%)**: Approaching hot levels
 * - **Red (85-100%)**: Hot/clipping danger zone
 *
 * ## Features
 * - 20 segment LED-style display
 * - Peak hold with automatic decay
 * - Smooth level interpolation
 * - Numeric percentage readout
 *
 * ## Integration
 * - Connect to Web Audio analyser node
 * - Use RMS or peak level values
 * - Update at 60fps for smooth animation
 *
 * @example
 * ```jsx
 * // Stereo output meters
 * <SynthRow>
 *   <SynthVUMeter label="L" level={leftLevel} />
 *   <SynthVUMeter label="R" level={rightLevel} />
 * </SynthRow>
 *
 * // Multi-channel mixer
 * {channels.map((ch, i) => (
 *   <SynthVUMeter key={i} label={`CH${i+1}`} level={ch.level} />
 * ))}
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';

export const SynthVUMeter = ({ label = "OUTPUT", level: propLevel = 0, peakHold = true }) => {
  const [displayLevel, setDisplayLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const peakTimer = useRef(null);

  useEffect(() => {
    // Smooth level changes
    const targetLevel = Math.max(0, Math.min(100, propLevel));
    const diff = targetLevel - displayLevel;

    if (Math.abs(diff) > 1) {
      const step = diff * 0.3; // Smooth interpolation
      setDisplayLevel(displayLevel + step);
    } else {
      setDisplayLevel(targetLevel);
    }

    // Peak hold logic
    if (peakHold && targetLevel > peakLevel) {
      setPeakLevel(targetLevel);

      // Reset peak after 2 seconds
      if (peakTimer.current) {
        clearTimeout(peakTimer.current);
      }
      peakTimer.current = setTimeout(() => {
        setPeakLevel(0);
      }, 2000);
    }
  }, [propLevel, displayLevel, peakLevel, peakHold]);

  const segments = 20;
  const filledSegments = Math.floor((displayLevel / 100) * segments);
  const peakSegment = Math.floor((peakLevel / 100) * segments);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--synth-space-sm)' }}>
      <div
        style={{
          position: 'relative',
          padding: 'var(--synth-space-sm)',
          borderRadius: 'var(--synth-radius-md)',
          width: 'var(--synth-1k)',
          height: 'var(--synth-2k)',
          background: 'linear-gradient(180deg, #1a1a1a, #0a0a0a)',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8), 2px 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px', height: '100%' }}>
          {Array.from({ length: segments }).map((_, index) => {
            const isFilled = index < filledSegments;
            const isPeak = peakHold && index === peakSegment - 1;
            const isRed = index >= segments * 0.85;
            const isYellow = index >= segments * 0.7 && index < segments * 0.85;
            const isGreen = index < segments * 0.7;

            let segmentColor;
            if (isFilled) {
              if (isRed) segmentColor = 'rgba(255,50,50,0.9)';
              else if (isYellow) segmentColor = 'rgba(255,220,50,0.9)';
              else segmentColor = 'rgba(50,255,50,0.9)';
            } else {
              segmentColor = '#1a1a1a';
            }

            let segmentGlow = 'none';
            if (isFilled) {
              if (isRed) segmentGlow = '0 0 6px rgba(255,50,50,0.8)';
              else if (isYellow) segmentGlow = '0 0 6px rgba(255,220,50,0.8)';
              else segmentGlow = '0 0 6px rgba(50,255,50,0.8)';
            }

            if (isPeak && !isFilled) {
              if (isRed) {
                segmentColor = 'rgba(255,50,50,0.9)';
                segmentGlow = '0 0 8px rgba(255,50,50,0.9)';
              } else {
                segmentColor = 'rgba(255,255,255,0.9)';
                segmentGlow = '0 0 8px rgba(255,255,255,0.9)';
              }
            }

            return (
              <div
                key={index}
                style={{
                  transition: 'all 100ms',
                  height: '6px',
                  background: segmentColor,
                  borderRadius: '1px',
                  boxShadow: segmentGlow,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Level indicator */}
      <div style={{ color: 'var(--synth-text-tertiary)', fontSize: '10px', fontFamily: 'var(--synth-font-mono)' }}>
        {Math.round(displayLevel)}
      </div>
    </div>
  );
};
