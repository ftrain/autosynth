/**
 * @file VintageSynthUI.jsx
 * @brief Vintage Synthesizer UI Component Library
 *
 * @description
 * A comprehensive black and white vintage synth component library
 * for StudioSynths WebView interface. Contains foundational UI elements
 * styled with authentic analog hardware aesthetics.
 *
 * ## Components
 *
 * ### SynthKnob
 * Rotary knob control with vertical drag interaction.
 * - **Use Cases**: Filter cutoff, resonance, levels, tuning, any continuous parameter
 * - **Features**: 270° rotation range, stepped mode, double-click reset
 *
 * ### SynthToggle
 * Power button style toggle switch with illumination.
 * - **Use Cases**: Oscillator on/off, effect bypass, sync enable, mode switches
 * - **Features**: On/off state, glow effect when active, click to toggle
 *
 * ### SynthMultiSwitch
 * Multi-state selector for choosing between options.
 * - **Use Cases**: Waveform selection, filter type, LFO shape, routing options
 * - **Features**: Multiple discrete states, click to cycle through options
 *
 * ## Styling
 * All components use a consistent black/white/gray color scheme
 * with realistic shadows and highlights for a hardware-like appearance.
 *
 * @example
 * ```jsx
 * import { SynthKnob, SynthToggle, SynthMultiSwitch } from './VintageSynthUI';
 *
 * // Continuous knob
 * <SynthKnob label="CUTOFF" min={20} max={20000} value={cutoff} onChange={setCutoff} />
 *
 * // Toggle switch
 * <SynthToggle label="SYNC" value={syncEnabled} onChange={setSyncEnabled} />
 *
 * // Multi-state selector
 * <SynthMultiSwitch label="WAVE" options={['SIN', 'SAW', 'SQR']} value={wave} onChange={setWave} />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// SYNTH KNOB COMPONENT
// ============================================================================
export const SynthKnob = ({ label = "FREQ", min = 0, max = 100, value: propValue, onChange, defaultValue = 50, step }) => {
  const [value, setValue] = useState(propValue ?? defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef(null);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleValue = propValue ?? value;

  const applyStep = (val) => {
    if (step) {
      return Math.round(val / step) * step;
    }
    return val;
  };

  const handleStart = (clientY) => {
    setIsDragging(true);
    startY.current = clientY;
    startValue.current = handleValue;
  };

  const handleMove = (clientY) => {
    if (!isDragging) return;
    const deltaY = startY.current - clientY;
    const range = max - min;
    const rawValue = startValue.current + (deltaY / 100) * range;
    const newValue = applyStep(Math.max(min, Math.min(max, rawValue)));
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    handleStart(e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientY);
    e.preventDefault();
  };

  const handleDoubleClick = () => {
    const resetValue = applyStep(defaultValue);
    setValue(resetValue);
    onChange?.(resetValue);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientY);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientY);
    e.preventDefault();
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleValue]);

  const rotation = ((handleValue - min) / (max - min)) * 270 - 135;
  const normalizedValue = (handleValue - min) / (max - min); // 0-1 for glow intensity

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', textAlign: 'center' }}>
        {label}
      </div>
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s',
          width: '64px',
          height: '64px',
          background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
          borderRadius: '50%',
          boxShadow: `inset 0 0 ${8 + normalizedValue * 12}px rgba(${Math.round(normalizedValue * 180)},${Math.round(normalizedValue * 180)},${Math.round(normalizedValue * 180)},${normalizedValue * 0.8}), inset 1px 1px 2px rgba(0,0,0,0.6), 1px 1px 3px rgba(0,0,0,0.3)`,
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '48px',
            height: '48px',
            background: 'linear-gradient(145deg, #3a3a3a, #252525)',
            borderRadius: '50%',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.6)',
            transform: `translate(-50%, -50%)`,
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '50%',
              width: '3px',
              height: '16px',
              background: 'linear-gradient(180deg, #ffffff, #e0e0e0)',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.5)',
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transformOrigin: `center ${24 - 4}px`,
              borderRadius: '0',
            }}
          />
        </div>
      </div>
      <div style={{ color: '#999', fontSize: '11px', fontFamily: 'monospace', textAlign: 'center' }}>
        {step && step >= 1 ? Math.round(handleValue) : handleValue.toFixed(2)}
      </div>
    </div>
  );
};

// ============================================================================
// TOGGLE SWITCH COMPONENT
// ============================================================================
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
        on: 'radial-gradient(circle at center, #ffb347, #ff8c00)',
        glow: 'rgba(255,179,71,0.8)',
        glowSecondary: 'rgba(255,140,0,0.5)',
        innerGlow: 'rgba(255,220,150,0.8)'
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

  const handleDoubleClick = () => {
    const resetValue = defaultValue;
    setIsOn(resetValue);
    onChange?.(resetValue);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--synth-space-sm)' }}>
      {/* Label */}
      <div style={{
        color: 'var(--synth-text-primary)',
        fontSize: 'var(--synth-font-size-sm)',
        fontWeight: 'var(--synth-font-weight-bold)',
        letterSpacing: 'var(--synth-letter-spacing-wide)',
        textAlign: 'center'
      }}>
        {label}
      </div>

      {/* Invisible outer circle for alignment (same size as knob) */}
      <div style={{
        width: 'var(--synth-knob-size)',
        height: 'var(--synth-knob-size)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Toggle button */}
        <div
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={{
            position: 'relative',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'var(--synth-transition-fast)',
            width: '48px',
            height: '48px',
            borderRadius: 'var(--synth-radius-round)',
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
                top: '8px',
                left: '8px',
                right: '8px',
                bottom: '8px',
                borderRadius: '50%',
                transition: 'all 0.2s',
                background: `radial-gradient(circle at center, ${colors.innerGlow}, rgba(255,255,255,0.3))`,
                boxShadow: `0 0 15px ${colors.innerGlow}, inset 0 0 10px rgba(255,255,255,0.4)`,
                animation: 'pulse 2s ease-in-out infinite',
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
              fontSize: '18px',
              fontWeight: 'bold',
              textShadow: handleValue ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
              transition: 'all 200ms',
            }}
          >
            {handleValue ? '●' : '○'}
          </div>
        </div>
      </div>

      {/* Value display */}
      <div
        style={{
          color: 'var(--synth-text-tertiary)',
          fontSize: 'var(--synth-font-size-sm)',
          fontFamily: 'var(--synth-font-mono)',
          textAlign: 'center',
        }}
      >
        {handleValue ? 'ON' : 'OFF'}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// MULTI-STATE SWITCH COMPONENT
// ============================================================================
export const SynthMultiSwitch = ({ label = "WAVE", options = ["SINE", "TRI", "SAW", "SQR"], value: propValue, onChange, defaultValue = 0 }) => {
  const [selectedIndex, setSelectedIndex] = useState(propValue ?? defaultValue);

  const handleValue = propValue ?? selectedIndex;

  const handleClick = (index) => {
    setSelectedIndex(index);
    onChange?.(index);
  };

  const handleChange = (e) => {
    const index = parseInt(e.target.value);
    setSelectedIndex(index);
    onChange?.(index);
  };

  const handleDoubleClick = () => {
    setSelectedIndex(defaultValue);
    onChange?.(defaultValue);
  };

  // Use dropdown if more than 3 options
  if (options.length > 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', textAlign: 'center' }}>
          {label}
        </div>
        <select
          value={handleValue}
          onChange={handleChange}
          onDoubleClick={handleDoubleClick}
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
            color: '#fff',
            border: '2px solid #3a3a3a',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), 2px 2px 6px rgba(0,0,0,0.5)',
            minWidth: '120px',
          }}
        >
          {options.map((option, index) => (
            <option key={index} value={index} style={{ background: '#1a1a1a', color: '#fff' }}>
              {option}
            </option>
          ))}
        </select>
        <div style={{ color: '#999', fontSize: '11px', fontFamily: 'monospace', textAlign: 'center' }}>
          {options[handleValue]}
        </div>
      </div>
    );
  }

  // Original button-based UI for 3 or fewer options
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', textAlign: 'center' }}>
        {label}
      </div>
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '8px',
          borderRadius: '4px',
          background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.15), 2px 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {options.map((option, index) => (
          <div
            key={index}
            onClick={() => handleClick(index)}
            style={{
              position: 'relative',
              padding: '4px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center',
              minWidth: '60px',
              background: handleValue === index
                ? 'linear-gradient(145deg, #666, #98947a)'
                : 'linear-gradient(145deg, #c8c4b8, #b0ac9a)',
              boxShadow: handleValue === index
                ? 'inset 1px 1px 3px rgba(0,0,0,0.2), 1px 1px 2px rgba(255,255,255,0.3)'
                : '1px 1px 2px rgba(0,0,0,0.15)',
              borderRadius: '3px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'color 0.15s',
                color: handleValue === index ? '#2563eb' : '#999',
                textShadow: handleValue === index ? '0 0 4px rgba(37, 99, 235, 0.4)' : 'none',
              }}
            >
              {option}
            </span>
          </div>
        ))}
      </div>
      <div style={{ color: '#999', fontSize: '11px', fontFamily: 'monospace', textAlign: 'center' }}>
        {options[handleValue]}
      </div>
    </div>
  );
};

// Export separate components
export * from './SynthSlider';
export * from './SynthADSR';
export * from './SynthLED';
export * from './SynthLCD';
export * from './SynthVUMeter';
export * from './SynthLFO';
export * from './TransportControls';
