/**
 * @file SynthToggle.jsx
 * @brief Toggle switch component for on/off states
 */

import React, { useState } from 'react';

export const SynthToggle = ({ label = "POWER", value: propValue, onChange, defaultValue = false, variant = "power" }) => {
  const [isOn, setIsOn] = useState(propValue ?? defaultValue);
  const [isPressed, setIsPressed] = useState(false);

  const handleValue = propValue ?? isOn;

  // Color scheme based on variant
  const colors = variant === "power"
    ? {
        on: 'radial-gradient(circle at center, #ff3232, #cc0000)',
        glow: 'rgba(255,50,50,0.8)',
        glowSecondary: 'rgba(255,50,50,0.5)',
        innerGlow: 'rgba(255,255,255,0.8)'
      }
    : {
        on: 'radial-gradient(circle at center, #00ff88, #00aa55)',
        glow: 'rgba(0,255,136,0.8)',
        glowSecondary: 'rgba(0,255,136,0.5)',
        innerGlow: 'rgba(200,255,220,0.8)'
      };

  const toggle = () => {
    const newValue = !handleValue;
    setIsOn(newValue);
    onChange?.(newValue);
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    toggle();
  };

  const handleTouchStart = (e) => {
    setIsPressed(true);
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    setIsPressed(false);
    toggle();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {/* Label */}
      <div style={{
        color: '#999',
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '1.5px',
        textAlign: 'center'
      }}>
        {label}
      </div>

      {/* Toggle button */}
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: handleValue
            ? colors.on
            : 'radial-gradient(circle at center, #2a2a2a, #0a0a0a)',
          boxShadow: isPressed
            ? 'inset 2px 2px 6px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.6)'
            : handleValue
              ? `inset 2px 2px 4px rgba(0,0,0,0.5), 0 0 16px ${colors.glow}, 0 0 8px ${colors.glowSecondary}, 4px 4px 8px rgba(0,0,0,0.6)`
              : 'inset 2px 2px 4px rgba(0,0,0,0.5), 4px 4px 8px rgba(0,0,0,0.6)',
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        {/* Rubber texture overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), transparent 50%)',
            opacity: isPressed ? 0.5 : 1,
          }}
        />

        {/* Inner illumination when active */}
        {handleValue && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              right: '6px',
              bottom: '6px',
              borderRadius: '50%',
              transition: 'all 0.2s',
              background: `radial-gradient(circle at center, ${colors.innerGlow}, rgba(255,255,255,0.3))`,
              boxShadow: `0 0 15px ${colors.innerGlow}, inset 0 0 10px rgba(255,255,255,0.4)`,
            }}
          />
        )}

        {/* Label on button */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: handleValue ? '#ffffff' : '#666',
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: handleValue ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
            transition: 'all 200ms',
          }}
        >
          {handleValue ? '●' : '○'}
        </div>
      </div>

      {/* Value display */}
      <div
        style={{
          color: handleValue ? '#00ff88' : '#666',
          fontSize: '9px',
          fontFamily: 'monospace',
          textAlign: 'center',
        }}
      >
        {handleValue ? 'ON' : 'OFF'}
      </div>
    </div>
  );
};

export default SynthToggle;
