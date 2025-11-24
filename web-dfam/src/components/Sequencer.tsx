/**
 * @file Sequencer.tsx
 * @brief 8-step sequencer component
 */

import React from 'react';

interface SequencerProps {
  label: string;
  values: number[];
  currentStep: number;
  min: number;
  max: number;
  bipolar?: boolean;
  onChange: (step: number, value: number) => void;
  formatValue?: (value: number) => string;
}

export const Sequencer: React.FC<SequencerProps> = ({
  label,
  values,
  currentStep,
  min,
  max,
  bipolar = false,
  onChange,
  formatValue = (v) => v.toString(),
}) => {
  const handleSliderChange = (step: number, e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(step, parseFloat(e.target.value));
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid #444',
      borderRadius: '8px',
      padding: '12px',
    }}>
      <div style={{
        color: '#ff66ff',
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        marginBottom: '8px',
        textAlign: 'center',
      }}>{label}</div>

      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
        height: '120px',
      }}>
        {values.map((value, step) => {
          const isActive = step === currentStep;
          const normalizedValue = (value - min) / (max - min);
          const height = bipolar
            ? Math.abs(normalizedValue - 0.5) * 2 * 80
            : normalizedValue * 80;
          const isNegative = bipolar && value < (min + max) / 2;

          return (
            <div
              key={step}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {/* Step indicator */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isActive ? '#ff6600' : '#333',
                boxShadow: isActive ? '0 0 10px #ff6600' : 'none',
              }} />

              {/* Vertical slider container */}
              <div style={{
                width: '24px',
                height: '80px',
                background: '#1a1a1a',
                borderRadius: '4px',
                position: 'relative',
                cursor: 'ns-resize',
                overflow: 'hidden',
              }}>
                {/* Center line for bipolar */}
                {bipolar && (
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '1px',
                    background: '#444',
                    top: '50%',
                  }} />
                )}

                {/* Value bar */}
                {bipolar ? (
                  <div style={{
                    position: 'absolute',
                    width: '16px',
                    left: '4px',
                    height: `${height}px`,
                    background: isActive
                      ? 'linear-gradient(180deg, #ff6600, #cc4400)'
                      : 'linear-gradient(180deg, #666, #444)',
                    borderRadius: '2px',
                    // Positive: bar grows UP from center (bottom of bar at 50%)
                    // Negative: bar grows DOWN from center (top of bar at 50%)
                    ...(isNegative
                      ? { top: '50%' }  // Negative: top edge at center, grows down
                      : { bottom: '50%' }  // Positive: bottom edge at center, grows up
                    ),
                    boxShadow: isActive ? '0 0 8px rgba(255, 102, 0, 0.5)' : 'none',
                  }} />
                ) : (
                  <div style={{
                    position: 'absolute',
                    width: '16px',
                    left: '4px',
                    bottom: 0,
                    height: `${height}px`,
                    background: isActive
                      ? 'linear-gradient(180deg, #ff6600, #cc4400)'
                      : 'linear-gradient(180deg, #666, #444)',
                    borderRadius: '2px',
                    boxShadow: isActive ? '0 0 8px rgba(255, 102, 0, 0.5)' : 'none',
                  }} />
                )}

                {/* Hidden input for interaction - covers the full area */}
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={(max - min) / 48}
                  value={value}
                  onChange={(e) => handleSliderChange(step, e)}
                  style={{
                    position: 'absolute',
                    width: '80px',
                    height: '24px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    opacity: 0,
                    cursor: 'ns-resize',
                    margin: 0,
                    padding: 0,
                  }}
                />
              </div>

              {/* Value display */}
              <div style={{
                fontSize: '9px',
                color: isActive ? '#ff6600' : '#666',
                fontFamily: 'monospace',
                minWidth: '30px',
                textAlign: 'center',
              }}>
                {formatValue(Math.round(value))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
