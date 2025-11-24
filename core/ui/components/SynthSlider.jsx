/**
 * @file SynthSlider.jsx
 * @brief Linear slider component (vertical/horizontal)
 *
 * @description
 * A linear fader/slider control supporting both vertical and horizontal orientations.
 * Features smooth drag interaction, click-to-position, and double-click reset.
 *
 * ## Use Cases
 * - **Volume Fader**: Classic mixer-style volume control
 * - **Pitch Bend**: Vertical slider for pitch wheel emulation
 * - **Mod Wheel**: Modulation amount control
 * - **Crossfader**: Horizontal slider for DJ-style crossfading
 * - **EQ Bands**: Multiple sliders for graphic EQ
 * - **Filter Cutoff**: Alternative to knob for filter control
 * - **Send Levels**: Aux send amount controls
 * - **Pan Position**: Horizontal pan control
 *
 * ## Interaction
 * - Click anywhere on the track to jump to that value
 * - Drag to smoothly adjust the value
 * - Double-click to reset to default value
 * - Supports touch interaction for tablet use
 *
 * ## Orientations
 * - **Vertical**: Traditional fader style (default)
 * - **Horizontal**: For pan controls or crossfaders
 *
 * @example
 * ```jsx
 * // Mixer fader
 * <SynthSlider
 *   label="CHANNEL 1"
 *   orientation="vertical"
 *   min={0}
 *   max={100}
 *   value={volume}
 *   onChange={setVolume}
 * />
 *
 * // Pan control
 * <SynthSlider
 *   label="PAN"
 *   orientation="horizontal"
 *   min={-100}
 *   max={100}
 *   defaultValue={0}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';

export const SynthSlider = ({
  label = "LEVEL",
  min = 0,
  max = 100,
  value: propValue,
  onChange,
  defaultValue = 50,
  orientation = "vertical",
  step
}) => {
  const [value, setValue] = useState(propValue ?? defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const startPos = useRef(0);
  const startValue = useRef(0);

  const handleValue = propValue ?? value;

  const applyStep = (val) => {
    if (step) {
      return Math.round(val / step) * step;
    }
    return val;
  };

  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    startPos.current = orientation === "vertical" ? clientY : clientX;
    startValue.current = handleValue;
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const currentPos = orientation === "vertical" ? clientY : clientX;
    const delta = orientation === "vertical"
      ? startPos.current - currentPos
      : currentPos - startPos.current;
    const range = max - min;
    const rawValue = startValue.current + (delta / 100) * range;
    const newValue = applyStep(Math.max(min, Math.min(max, rawValue)));
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    // Check if this is the start of a drag or a single click
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (orientation === "vertical") {
      // Calculate value from click position
      const clickY = e.clientY - rect.top;
      const percentage = 1 - (clickY / rect.height);  // Inverted for vertical
      const rawValue = min + percentage * (max - min);
      const newValue = applyStep(Math.max(min, Math.min(max, rawValue)));
      setValue(newValue);
      onChange?.(newValue);
    } else {
      // Horizontal
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const rawValue = min + percentage * (max - min);
      const newValue = applyStep(Math.max(min, Math.min(max, rawValue)));
      setValue(newValue);
      onChange?.(newValue);
    }

    // Then start dragging from this position
    handleStart(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
  };

  const handleDoubleClick = () => {
    const resetValue = applyStep(defaultValue);
    setValue(resetValue);
    onChange?.(resetValue);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
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

  const percentage = ((handleValue - min) / (max - min)) * 100;

  const sliderStyle = orientation === "vertical"
    ? {
        width: 'var(--synth-1k)',
        height: 'var(--synth-2k)',
        background: 'linear-gradient(180deg, #1a1a1a, #0a0a0a)',
      }
    : {
        width: 'var(--synth-2k)',
        height: 'var(--synth-1k)',
        background: 'linear-gradient(90deg, #1a1a1a, #0a0a0a)',
      };

  const trackStyle = orientation === "vertical"
    ? {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '8px',
        width: '8px',
        height: 'calc(100% - 16px)',
        background: '#0a0a0a',
        borderRadius: '4px',
        boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.8)',
      }
    : {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        left: '8px',
        height: '8px',
        width: 'calc(100% - 16px)',
        background: '#0a0a0a',
        borderRadius: '4px',
        boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.8)',
      };

  const fillStyle = orientation === "vertical"
    ? {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${percentage}%`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
        borderRadius: '4px',
        boxShadow: '0 0 8px rgba(255,255,255,0.6)',
      }
    : {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${percentage}%`,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.8))',
        borderRadius: '4px',
        boxShadow: '0 0 8px rgba(255,255,255,0.6)',
      };

  // Calculate constrained percentage to keep handle within bounds
  // For vertical: handle is 24px tall in a 200px track (192px usable = 200 - 16 padding)
  // For horizontal: handle is 32px wide in a 200px track (192px usable = 200 - 16 padding)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--synth-space-sm)' }}>
      <div style={{ color: 'var(--synth-text-primary)', fontSize: 'var(--synth-font-size-sm)', fontWeight: 'var(--synth-font-weight-bold)', letterSpacing: 'var(--synth-letter-spacing-wide)' }}>{label}</div>
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          ...sliderStyle,
          borderRadius: '8px',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8), 2px 2px 6px rgba(0,0,0,0.5)',
          touchAction: 'none',
        }}
      >
        <div style={trackStyle}>
          <div style={{
            ...fillStyle,
            background: isDragging
              ? 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))'
              : orientation === 'vertical'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))'
                : 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.8))',
            boxShadow: isDragging
              ? '0 0 12px rgba(255,255,255,0.8), 0 0 6px rgba(255,255,255,0.6), inset 0 0 8px rgba(255,255,255,0.4)'
              : '0 0 8px rgba(255,255,255,0.6), inset 0 0 6px rgba(255,255,255,0.3)',
          }} />
        </div>
      </div>
      <div style={{ color: 'var(--synth-text-tertiary)', fontSize: 'var(--synth-font-size-sm)', fontFamily: 'var(--synth-font-mono)' }}>
        {step && step >= 1 ? Math.round(handleValue) : handleValue.toFixed(2)}
      </div>
    </div>
  );
};
