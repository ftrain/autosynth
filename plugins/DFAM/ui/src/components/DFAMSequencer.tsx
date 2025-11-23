/**
 * @file DFAMSequencer.tsx
 * @brief 8-step sequencer with vertical bars for DFAM
 *
 * Shows pitch or velocity values as vertical bars with click-to-edit.
 * Supports semitone range (-24 to +24) for pitch and 0-1 for velocity.
 * Optional per-step LFO enable toggles.
 */

import React from 'react';

interface DFAMSequencerProps {
  /** Label displayed above the sequencer */
  label: string;
  /** Number of steps (default 8) */
  steps?: number;
  /** Array of step values */
  values: number[];
  /** Currently playing step (-1 = none) */
  currentStep?: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Callback when a step value changes */
  onChange: (step: number, value: number) => void;
  /** Accent color */
  accentColor?: string;
  /** Show bipolar (centered) bars */
  bipolar?: boolean;
  /** Value format function */
  formatValue?: (value: number) => string;
  /** Optional: LFO enable states per step */
  lfoEnabled?: boolean[];
  /** Optional: Callback when LFO enable changes */
  onLfoToggle?: (step: number, enabled: boolean) => void;
  /** Optional: LFO indicator color */
  lfoColor?: string;
}

export const DFAMSequencer: React.FC<DFAMSequencerProps> = ({
  label,
  steps = 8,
  values,
  currentStep = -1,
  min,
  max,
  onChange,
  accentColor = '#ff6600',
  bipolar = false,
  formatValue = (v) => Math.round(v).toString(),
  lfoEnabled,
  onLfoToggle,
  lfoColor = '#ff00ff',
}) => {
  const barHeight = 100;
  const range = max - min;

  const handleClick = (step: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = rect.bottom - e.clientY; // Distance from bottom
    const ratio = Math.max(0, Math.min(1, y / barHeight));
    const newValue = min + ratio * range;
    onChange(step, Math.round(newValue));
  };

  const handleDrag = (step: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleClick(step, e);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Label */}
      <div
        style={{
          color: '#888',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '2px',
        }}
      >
        {label}
      </div>

      {/* Steps container */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '12px',
          background: 'rgba(40, 40, 40, 0.6)',
          borderRadius: '8px',
        }}
      >
        {Array.from({ length: steps }).map((_, i) => {
          // Round value to avoid float precision issues
          const rawValue = values[i] ?? (bipolar ? 0 : min);
          const value = Math.round(rawValue);
          const isActive = currentStep === i;
          const hasLfo = lfoEnabled && lfoEnabled[i];

          // Calculate bar position and height
          let barTop = 0;
          let barH = 0;

          if (bipolar) {
            // Bipolar: bar grows from center
            const centerY = barHeight / 2;
            const normalizedValue = (value - min) / range; // 0-1
            const offsetFromCenter = normalizedValue - 0.5; // -0.5 to 0.5
            if (offsetFromCenter >= 0) {
              barH = offsetFromCenter * barHeight;
              barTop = centerY - barH;
            } else {
              barH = Math.abs(offsetFromCenter) * barHeight;
              barTop = centerY;
            }
          } else {
            // Unipolar: bar grows from bottom
            const normalizedValue = (value - min) / range;
            barH = normalizedValue * barHeight;
            barTop = barHeight - barH;
          }

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {/* Step number */}
              <div
                style={{
                  fontSize: '10px',
                  color: isActive ? accentColor : '#666',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                {i + 1}
              </div>

              {/* Bar container */}
              <div
                style={{
                  width: '28px',
                  height: `${barHeight}px`,
                  background: 'rgba(20, 20, 20, 0.8)',
                  borderRadius: '4px',
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  border: isActive ? `2px solid ${accentColor}` : '2px solid #333',
                  boxSizing: 'border-box',
                }}
                onMouseDown={(e) => handleClick(i, e)}
                onMouseMove={handleDrag(i)}
              >
                {/* Center line for bipolar */}
                {bipolar && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: '#555',
                    }}
                  />
                )}

                {/* Value bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: '2px',
                    right: '2px',
                    top: `${barTop}px`,
                    height: `${Math.max(2, barH)}px`,
                    background: hasLfo
                      ? `linear-gradient(to top, ${lfoColor}, ${lfoColor}88)`
                      : isActive
                        ? `linear-gradient(to top, ${accentColor}, ${accentColor}88)`
                        : 'linear-gradient(to top, #4a9eff, #7fbfff)',
                    borderRadius: '2px',
                    transition: isActive ? 'none' : 'all 50ms',
                    boxShadow: isActive ? `0 0 8px ${accentColor}` : hasLfo ? `0 0 4px ${lfoColor}` : 'none',
                  }}
                />
              </div>

              {/* Value display */}
              <div
                style={{
                  fontSize: '9px',
                  color: '#888',
                  fontFamily: 'monospace',
                  minWidth: '28px',
                  textAlign: 'center',
                }}
              >
                {formatValue(value)}
              </div>

              {/* LFO toggle (if enabled) */}
              {onLfoToggle && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onLfoToggle(i, !hasLfo);
                  }}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    background: hasLfo
                      ? `linear-gradient(135deg, ${lfoColor}, ${lfoColor}88)`
                      : 'rgba(30, 30, 30, 0.8)',
                    border: hasLfo ? `1px solid ${lfoColor}` : '1px solid #444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    color: hasLfo ? '#fff' : '#555',
                    fontWeight: 'bold',
                    boxShadow: hasLfo ? `0 0 6px ${lfoColor}` : 'none',
                    transition: 'all 100ms',
                  }}
                  title={hasLfo ? 'LFO enabled' : 'Click to enable LFO'}
                >
                  ~
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DFAMSequencer;
