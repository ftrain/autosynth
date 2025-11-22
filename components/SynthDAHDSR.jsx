/**
 * @file SynthDAHDSR.jsx
 * @brief DAHDSR envelope component with millisecond-based timing and interactive editing
 *
 * @description
 * An extended 6-stage envelope generator with Delay, Attack, Hold, Decay, Sustain, and Release.
 * Provides more sophisticated envelope shaping than standard ADSR, with initial delay
 * and peak hold stages for complex modulation scenarios.
 *
 * ## Use Cases
 * - **Delayed Pad Swells**: Use delay stage for layered entry effects
 * - **Brass Instruments**: Hold stage maintains peak before decay for realistic brass attacks
 * - **Gated Effects**: Precise hold time for rhythmic gating effects
 * - **Sound Design**: Complex envelope shapes for evolving textures
 * - **Percussive Sounds**: Short hold creates punchy transients before decay
 * - **Ambient Drones**: Long delay + slow attack for gradual fade-ins
 *
 * ## Stage Descriptions
 * - **Delay**: Time before envelope starts (creates anticipation, layered entries)
 * - **Attack**: Time to rise from zero to peak level
 * - **Hold**: Time to stay at peak before decay begins
 * - **Decay**: Time to fall from peak to sustain level
 * - **Sustain**: Level held while note is sustained (percentage)
 * - **Release**: Time to fall from sustain to zero after note-off
 *
 * ## Features
 * - All time stages support up to 60 seconds
 * - Interactive drag-to-edit on each segment
 * - Real-time millisecond/percentage labels
 * - Touch-friendly for tablet interfaces
 *
 * @example
 * ```jsx
 * <SynthDAHDSR
 *   label="MODULATION ENV"
 *   delay={100}
 *   attack={200}
 *   hold={50}
 *   decay={300}
 *   sustain={60}
 *   release={500}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';

export const SynthDAHDSR = ({
  label = "DAHDSR ENVELOPE",
  delay: propDelay,
  attack: propAttack,
  hold: propHold,
  decay: propDecay,
  sustain: propSustain,
  release: propRelease,
  onDelayChange,
  onAttackChange,
  onHoldChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
  defaultDelay = 50,    // milliseconds
  defaultAttack = 100,  // milliseconds
  defaultHold = 100,    // milliseconds
  defaultDecay = 200,   // milliseconds
  defaultSustain = 70,  // percentage (0-100)
  defaultRelease = 300,  // milliseconds
  maxDelay = 60000,     // max 60 seconds
  maxAttack = 60000,    // max 60 seconds
  maxHold = 60000,      // max 60 seconds
  maxDecay = 60000,     // max 60 seconds
  maxRelease = 60000    // max 60 seconds
}) => {
  const [delay, setDelay] = useState(propDelay ?? defaultDelay);
  const [attack, setAttack] = useState(propAttack ?? defaultAttack);
  const [hold, setHold] = useState(propHold ?? defaultHold);
  const [decay, setDecay] = useState(propDecay ?? defaultDecay);
  const [sustain, setSustain] = useState(propSustain ?? defaultSustain);
  const [release, setRelease] = useState(propRelease ?? defaultRelease);
  const [activeParam, setActiveParam] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleDelay = propDelay ?? delay;
  const handleAttack = propAttack ?? attack;
  const handleHold = propHold ?? hold;
  const handleDecay = propDecay ?? decay;
  const handleSustain = propSustain ?? sustain;
  const handleRelease = propRelease ?? release;

  // SVG dimensions - 4K x 2K (uses viewBox 256x128 to scale)
  const padding = 10;
  const viewBoxWidth = 256;
  const viewBoxHeight = 128;
  const w = viewBoxWidth - padding * 2;
  const h = viewBoxHeight - padding * 2;

  // Calculate total time and proportions
  const totalTime = handleDelay + handleAttack + handleHold + handleDecay + handleRelease;
  const sustainWidth = w * 0.2; // Fixed 20% for sustain plateau

  // Calculate segment widths based on time proportions
  const delayWidth = (handleDelay / totalTime) * (w - sustainWidth);
  const attackWidth = (handleAttack / totalTime) * (w - sustainWidth);
  const holdWidth = (handleHold / totalTime) * (w - sustainWidth);
  const decayWidth = (handleDecay / totalTime) * (w - sustainWidth);
  const releaseWidth = (handleRelease / totalTime) * (w - sustainWidth);

  // Generate DAHDSR curve path
  const generatePath = () => {
    const sustainLevel = (handleSustain / 100) * h;

    let path = `M ${padding} ${padding + h}`; // Start at bottom left
    path += ` L ${padding + delayWidth} ${padding + h}`; // Delay (stays at zero)
    path += ` L ${padding + delayWidth + attackWidth} ${padding}`; // Attack to peak
    path += ` L ${padding + delayWidth + attackWidth + holdWidth} ${padding}`; // Hold at peak
    path += ` L ${padding + delayWidth + attackWidth + holdWidth + decayWidth} ${padding + h - sustainLevel}`; // Decay to sustain
    path += ` L ${padding + delayWidth + attackWidth + holdWidth + decayWidth + sustainWidth} ${padding + h - sustainLevel}`; // Sustain plateau
    path += ` L ${padding + w} ${padding + h}`; // Release to zero (touches right edge)

    return path;
  };

  // Start dragging on click
  const handleMouseDown = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = x - padding;
    const relY = y - padding;

    // Determine which segment was clicked
    let param = null;
    let currentValue = 0;

    if (relX >= 0 && relX < delayWidth) {
      param = 'delay';
      currentValue = handleDelay;
    } else if (relX >= delayWidth && relX < delayWidth + attackWidth) {
      param = 'attack';
      currentValue = handleAttack;
    } else if (relX >= delayWidth + attackWidth && relX < delayWidth + attackWidth + holdWidth) {
      param = 'hold';
      currentValue = handleHold;
    } else if (relX >= delayWidth + attackWidth + holdWidth && relX < delayWidth + attackWidth + holdWidth + decayWidth) {
      param = 'decay';
      currentValue = handleDecay;
    } else if (relX >= delayWidth + attackWidth + holdWidth + decayWidth && relX < delayWidth + attackWidth + holdWidth + decayWidth + sustainWidth) {
      param = 'sustain';
      currentValue = handleSustain;
    } else if (relX >= delayWidth + attackWidth + holdWidth + decayWidth + sustainWidth) {
      param = 'release';
      currentValue = handleRelease;
    }

    if (param) {
      setActiveParam(param);
      setIsDragging(true);
      startX.current = e.clientX;
      startY.current = e.clientY;
      startValue.current = currentValue;
      e.preventDefault();
    }
  };

  const handleTouchStart = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const relX = x - padding;

    // Determine which segment was touched
    let param = null;
    let currentValue = 0;

    if (relX >= 0 && relX < delayWidth) {
      param = 'delay';
      currentValue = handleDelay;
    } else if (relX >= delayWidth && relX < delayWidth + attackWidth) {
      param = 'attack';
      currentValue = handleAttack;
    } else if (relX >= delayWidth + attackWidth && relX < delayWidth + attackWidth + holdWidth) {
      param = 'hold';
      currentValue = handleHold;
    } else if (relX >= delayWidth + attackWidth + holdWidth && relX < delayWidth + attackWidth + holdWidth + decayWidth) {
      param = 'decay';
      currentValue = handleDecay;
    } else if (relX >= delayWidth + attackWidth + holdWidth + decayWidth && relX < delayWidth + attackWidth + holdWidth + decayWidth + sustainWidth) {
      param = 'sustain';
      currentValue = handleSustain;
    } else if (relX >= delayWidth + attackWidth + holdWidth + decayWidth + sustainWidth) {
      param = 'release';
      currentValue = handleRelease;
    }

    if (param) {
      setActiveParam(param);
      setIsDragging(true);
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startValue.current = currentValue;
      e.preventDefault();
    }
  };

  const handleDrag = (e) => {
    if (!isDragging || !activeParam) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = startY.current - e.clientY;

    switch (activeParam) {
      case 'delay':
        const newDelay = Math.max(0, Math.min(maxDelay, startValue.current + deltaX * 10));
        setDelay(newDelay);
        onDelayChange?.(newDelay);
        break;
      case 'attack':
        const newAttack = Math.max(10, Math.min(maxAttack, startValue.current + deltaX * 10));
        setAttack(newAttack);
        onAttackChange?.(newAttack);
        break;
      case 'hold':
        const newHold = Math.max(0, Math.min(maxHold, startValue.current + deltaX * 10));
        setHold(newHold);
        onHoldChange?.(newHold);
        break;
      case 'decay':
        const newDecay = Math.max(10, Math.min(maxDecay, startValue.current + deltaX * 10));
        setDecay(newDecay);
        onDecayChange?.(newDecay);
        break;
      case 'sustain':
        // Sustain uses vertical movement
        const newSustain = Math.max(0, Math.min(100, startValue.current + deltaY / 2));
        setSustain(newSustain);
        onSustainChange?.(newSustain);
        break;
      case 'release':
        const newRelease = Math.max(10, Math.min(maxRelease, startValue.current + deltaX * 10));
        setRelease(newRelease);
        onReleaseChange?.(newRelease);
        break;
    }
  };

  const handleTouchMove = (e) => {
    handleDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveParam(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, activeParam]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--synth-space-sm)' }}>
      <div style={{
        color: 'var(--synth-text-primary)',
        fontSize: 'var(--synth-font-size-sm)',
        fontWeight: 'var(--synth-font-weight-bold)',
        letterSpacing: 'var(--synth-letter-spacing-wide)',
        textAlign: 'center'
      }}>
        {label}
      </div>

      {/* Visualization */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative',
          width: 'var(--synth-4k)',
          height: 'var(--synth-2k)',
          background: 'var(--synth-gradient-inset)',
          borderRadius: 'var(--synth-radius-md)',
          boxShadow: 'var(--synth-shadow-inset)',
          cursor: isDragging ? 'grabbing' : 'crosshair',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={viewBoxWidth - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + h * 0.25} x2={viewBoxWidth - padding} y2={padding + h * 0.25} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + h * 0.5} x2={viewBoxWidth - padding} y2={padding + h * 0.5} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + h * 0.75} x2={viewBoxWidth - padding} y2={padding + h * 0.75} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + h} x2={viewBoxWidth - padding} y2={padding + h} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Fill under curve */}
          <path
            d={generatePath() + ` L ${viewBoxWidth - padding} ${padding + h} L ${padding} ${padding + h} Z`}
            fill="rgba(255,255,255,0.08)"
          />

          {/* DAHDSR curve */}
          <path
            d={generatePath()}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))',
            }}
          />

          {/* Millisecond labels on segments */}
          {delayWidth > 30 && (
            <text
              x={padding + delayWidth / 2}
              y={padding + h - 8}
              fill="rgba(255,255,255,0.6)"
              fontSize="9"
              fontFamily="var(--synth-font-mono)"
              textAnchor="middle"
            >
              {Math.round(handleDelay)}ms
            </text>
          )}

          <text
            x={padding + delayWidth + attackWidth / 2}
            y={padding + h / 3}
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
            fontFamily="var(--synth-font-mono)"
            textAnchor="middle"
          >
            {Math.round(handleAttack)}ms
          </text>

          {holdWidth > 30 && (
            <text
              x={padding + delayWidth + attackWidth + holdWidth / 2}
              y={padding + 12}
              fill="rgba(255,255,255,0.6)"
              fontSize="9"
              fontFamily="var(--synth-font-mono)"
              textAnchor="middle"
            >
              {Math.round(handleHold)}ms
            </text>
          )}

          <text
            x={padding + delayWidth + attackWidth + holdWidth + decayWidth / 2}
            y={padding + h / 2}
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
            fontFamily="var(--synth-font-mono)"
            textAnchor="middle"
          >
            {Math.round(handleDecay)}ms
          </text>

          <text
            x={padding + delayWidth + attackWidth + holdWidth + decayWidth + sustainWidth / 2}
            y={padding + h - (handleSustain / 100) * h - 8}
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
            fontFamily="var(--synth-font-mono)"
            textAnchor="middle"
          >
            {Math.round(handleSustain)}%
          </text>

          <text
            x={padding + w - releaseWidth / 2}
            y={padding + h * 0.6}
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
            fontFamily="var(--synth-font-mono)"
            textAnchor="middle"
          >
            {Math.round(handleRelease)}ms
          </text>
        </svg>

        {/* Stage labels at bottom */}
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: 'var(--synth-font-size-xs)',
          color: 'var(--synth-text-tertiary)',
          fontFamily: 'var(--synth-font-mono)',
          fontWeight: 'var(--synth-font-weight-bold)',
          padding: '0 12px'
        }}>
          <span>D</span>
          <span>A</span>
          <span>H</span>
          <span>D</span>
          <span>S</span>
          <span>R</span>
        </div>
      </div>
    </div>
  );
};
