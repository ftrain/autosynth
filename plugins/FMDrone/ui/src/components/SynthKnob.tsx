/**
 * @file SynthKnob.tsx
 * @brief Rotary knob control with mouse/touch drag support
 *
 * @description
 * The fundamental control element for synthesizer interfaces. A rotary knob
 * with 270° rotation range, vertical drag control, and optional stepped/discrete values.
 *
 * ## Use Cases
 * - **Filter Cutoff**: Primary filter frequency control (20Hz - 20kHz)
 * - **Resonance**: Filter resonance/Q control (0-100%)
 * - **Oscillator Level**: Mix level for each oscillator
 * - **Tune/Detune**: Coarse tuning (-24 to +24 semitones) or fine tune (-100 to +100 cents)
 * - **Attack/Decay/Release**: Envelope time controls
 * - **Sustain Level**: Envelope sustain amount
 * - **Pan**: Stereo position (-100 to +100)
 * - **Drive/Saturation**: Distortion amount
 * - **LFO Rate/Depth**: Modulation controls
 * - **Effect Mix**: Wet/dry balance
 * - **Waveform Selection**: Stepped knob with options array
 *
 * ## Interaction
 * - Drag vertically to adjust (up = increase, down = decrease)
 * - Double-click to reset to default value
 * - Arrow keys for fine adjustment when focused
 * - Home/End keys jump to min/max
 *
 * ## Stepped Mode
 * Use the `options` prop for discrete selections like waveforms or modes.
 * The knob will snap to positions and display option labels.
 *
 * ## Accessibility
 * - Full ARIA slider support
 * - Keyboard navigation
 * - Focus indicators
 *
 * @example
 * ```tsx
 * // Continuous filter cutoff
 * <SynthKnob
 *   label="CUTOFF"
 *   min={20}
 *   max={20000}
 *   value={cutoff}
 *   onChange={setCutoff}
 * />
 *
 * // Stepped waveform selector
 * <SynthKnob
 *   label="WAVE"
 *   min={0}
 *   max={3}
 *   step={1}
 *   options={['SIN', 'SAW', 'SQR', 'TRI']}
 * />
 *
 * // Bipolar pan control
 * <SynthKnob
 *   label="PAN"
 *   min={-100}
 *   max={100}
 *   defaultValue={0}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';
import { SynthKnobProps } from '../types/components';
import { synthStyles } from '../styles/shared';
export const SynthKnob: React.FC<SynthKnobProps> = ({
  label,
  min,
  max,
  value: propValue,
  onChange,
  defaultValue = (min + max) / 2,
  step,
  options,
}) => {
  const [value, setValue] = useState<number>(propValue ?? defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleValue = propValue ?? value;

  const applyStep = (val: number): number => {
    if (step) {
      return Math.round(val / step) * step;
    }
    return val;
  };

  const clampValue = (val: number): number => {
    return Math.max(min, Math.min(max, val));
  };

  const updateValue = (newValue: number) => {
    const steppedValue = applyStep(clampValue(newValue));
    setValue(steppedValue);
    onChange?.(steppedValue);
  };

  const handleStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    startValue.current = handleValue;
  };

  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = startY.current - clientY;
    const range = max - min;
    // 50 pixels for full range - responsive feel
    const sensitivity = 50;
    const rawValue = startValue.current + (deltaY / sensitivity) * range;
    updateValue(rawValue);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0]!.clientY);
    e.preventDefault();
  };

  const handleDoubleClick = () => {
    updateValue(defaultValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const keyStep = step ?? (max - min) / 100;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        updateValue(handleValue + keyStep);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        updateValue(handleValue - keyStep);
        e.preventDefault();
        break;
      case 'Home':
        updateValue(min);
        e.preventDefault();
        break;
      case 'End':
        updateValue(max);
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        handleDoubleClick();
        e.preventDefault();
        break;
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0]!.clientY);
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
    return undefined;
  }, [isDragging, handleValue]);

  // Calculate rotation (-135° to +135° = 270° total range)
  const rotation = ((handleValue - min) / (max - min)) * 270 - 135;

  // Calculate glow intensity (0 to 1) based on value position
  const glowIntensity = (handleValue - min) / (max - min);

  // For stepped knobs with options, calculate LED color based on step
  const getLEDColor = () => {
    if (!options || options.length === 0) return null;
    const colors = [
      'rgb(50, 50, 50)',     // OFF - dark gray
      'rgb(100, 200, 100)',  // LOW - green
      'rgb(255, 200, 50)',   // MID - yellow/amber
      'rgb(255, 100, 50)',   // HIGH - orange
      'rgb(255, 50, 50)',    // MAX - red
    ];
    // Offset by min to handle ranges like -2 to 2
    const index = Math.round(handleValue - min);
    return colors[Math.max(0, Math.min(index, colors.length - 1))] || colors[0];
  };

  const ledColor = getLEDColor();
  const effectiveGlowIntensity = ledColor ? 1 : glowIntensity;

  // Format display value
  const displayValue = (() => {
    // If options array is provided, use it for display
    if (options && options.length > 0) {
      // Offset by min to handle ranges like -2 to 2
      const index = Math.round(handleValue - min);
      return options[Math.max(0, Math.min(index, options.length - 1))] ?? '';
    }
    if (step && step >= 1) {
      return Math.round(handleValue).toString();
    }
    const range = max - min;
    if (range >= 100) {
      return Math.round(handleValue).toString();
    } else if (range >= 10) {
      return handleValue.toFixed(1);
    } else {
      return handleValue.toFixed(2);
    }
  })();

  return (
    <div style={synthStyles.knobContainer}>
      {/* Label */}
      <div style={synthStyles.knobLabel}>{label}</div>

      {/* Knob */}
      <div
        ref={knobRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={handleValue}
        aria-valuetext={displayValue}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          ...synthStyles.knobBody(isDragging || isFocused, effectiveGlowIntensity, ledColor),
          outline: isFocused ? '2px solid var(--synth-accent-primary)' : 'none',
          outlineOffset: '2px',
        }}
      >
        {/* Inner circle */}
        <div style={synthStyles.knobInner}>
          {/* Indicator */}
          <div style={synthStyles.knobIndicator(rotation)} />
        </div>
      </div>

      {/* Value display */}
      <div style={synthStyles.knobValue}>{displayValue}</div>
    </div>
  );
};

export default SynthKnob;
