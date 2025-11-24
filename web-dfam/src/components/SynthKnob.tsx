/**
 * @file SynthKnob.tsx
 * @brief Rotary knob control
 */

import React, { useState, useRef, useEffect } from 'react';

interface SynthKnobProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  options?: string[];
  defaultValue?: number;
}

export const SynthKnob: React.FC<SynthKnobProps> = ({
  label,
  min,
  max,
  value: propValue,
  onChange,
  step,
  options,
  defaultValue,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startValue = useRef(0);

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
    onChange(steppedValue);
  };

  const handleStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    startValue.current = propValue;
  };

  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = startY.current - clientY;
    const range = max - min;
    const sensitivity = 100;
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
    if (defaultValue !== undefined) {
      updateValue(defaultValue);
    }
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
      const handleTouchMove = (e: TouchEvent) => {
        handleMove(e.touches[0]!.clientY);
        e.preventDefault();
      };

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
  }, [isDragging, propValue]);

  const rotation = ((propValue - min) / (max - min)) * 270 - 135;

  const displayValue = (() => {
    if (options && options.length > 0) {
      const index = Math.round(propValue - min);
      return options[Math.max(0, Math.min(index, options.length - 1))] ?? '';
    }
    if (step && step >= 1) {
      return Math.round(propValue).toString();
    }
    const range = max - min;
    if (range >= 100) {
      return Math.round(propValue).toString();
    } else if (range >= 10) {
      return propValue.toFixed(1);
    } else {
      return propValue.toFixed(2);
    }
  })();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      userSelect: 'none',
    }}>
      <div style={{
        fontSize: '10px',
        color: '#888',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>{label}</div>

      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
          boxShadow: isDragging
            ? '0 0 15px rgba(255, 102, 0, 0.5), inset 0 2px 4px rgba(0,0,0,0.5)'
            : 'inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #333',
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #222, #181818)',
          position: 'relative',
        }}>
          {/* Indicator line */}
          <div style={{
            position: 'absolute',
            width: '3px',
            height: '12px',
            background: '#ff6600',
            borderRadius: '2px',
            left: '50%',
            top: '4px',
            marginLeft: '-1.5px',
            transformOrigin: '50% 14px',
            transform: `rotate(${rotation}deg)`,
            boxShadow: '0 0 8px rgba(255, 102, 0, 0.6)',
          }} />
        </div>
      </div>

      <div style={{
        fontSize: '11px',
        color: '#ff6600',
        fontFamily: 'monospace',
        minWidth: '40px',
        textAlign: 'center',
      }}>{displayValue}</div>
    </div>
  );
};
