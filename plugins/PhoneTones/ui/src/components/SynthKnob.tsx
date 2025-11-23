/**
 * @file SynthKnob.tsx
 * @brief Rotary knob control for Phone Tones
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

  const rotation = ((handleValue - min) / (max - min)) * 270 - 135;
  const glowIntensity = (handleValue - min) / (max - min);

  const getLEDColor = () => {
    if (!options || options.length === 0) return null;
    const colors = [
      'rgb(50, 50, 50)',
      'rgb(100, 200, 100)',
      'rgb(255, 200, 50)',
      'rgb(255, 100, 50)',
      'rgb(255, 50, 50)',
      'rgb(200, 50, 200)',
    ];
    const index = Math.round(handleValue - min);
    return colors[Math.max(0, Math.min(index, colors.length - 1))] || colors[0];
  };

  const ledColor = getLEDColor();
  const effectiveGlowIntensity = ledColor ? 1 : glowIntensity;

  const displayValue = (() => {
    if (options && options.length > 0) {
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
      <div style={synthStyles.knobLabel}>{label}</div>
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
        <div style={synthStyles.knobInner}>
          <div style={synthStyles.knobIndicator(rotation)} />
        </div>
      </div>
      <div style={synthStyles.knobValue}>{displayValue}</div>
    </div>
  );
};

export default SynthKnob;
