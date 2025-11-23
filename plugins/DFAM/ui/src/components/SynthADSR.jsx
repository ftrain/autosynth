/**
 * @file SynthADSR.jsx
 * @brief ADSR envelope component with millisecond-based timing and interactive editing
 *
 * @description
 * A classic 4-stage envelope generator with Attack, Decay, Sustain, and Release controls.
 * Features an interactive SVG visualization where users can click and drag segments
 * to adjust values. Supports tabbed interface for multiple envelope presets.
 *
 * ## Use Cases
 * - **Amplitude Envelope**: Shape the volume contour of a sound from note-on to note-off
 * - **Filter Envelope**: Modulate filter cutoff over time for dynamic timbral changes
 * - **Pitch Envelope**: Create pitch bends, plucks, or swoops at note start
 * - **Modulation Envelope**: Control any parameter that needs time-based shaping
 * - **Effects Control**: Automate effect parameters like reverb mix or delay feedback
 *
 * ## Envelope Shapes
 * - **Pluck/Percussion**: Fast attack (5-20ms), short decay, zero sustain, short release
 * - **Pad/String**: Slow attack (200-1000ms), medium decay, high sustain, long release
 * - **Brass/Lead**: Medium attack (50-150ms), short decay, medium-high sustain
 * - **Piano/Keys**: Instant attack, long decay, medium sustain, medium release
 * - **Swell/Ambient**: Very slow attack, no decay, full sustain, very long release
 *
 * ## Features
 * - Millisecond-based attack, decay, and release values (up to 60 seconds)
 * - Sustain level as percentage (0-100%)
 * - Interactive envelope visualization - click segments to adjust
 * - Tabbed interface for switching between multiple envelopes
 * - Real-time visual feedback with millisecond labels
 *
 * @example
 * ```jsx
 * <SynthADSR
 *   label="AMP ENV"
 *   attack={50}
 *   decay={200}
 *   sustain={70}
 *   release={500}
 *   onAttackChange={(v) => setAttack(v)}
 *   onDecayChange={(v) => setDecay(v)}
 *   onSustainChange={(v) => setSustain(v)}
 *   onReleaseChange={(v) => setRelease(v)}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';

export const SynthADSR = ({
  label = "ADSR ENVELOPE",
  attack: propAttack,
  decay: propDecay,
  sustain: propSustain,
  release: propRelease,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
  defaultAttack = 100,  // milliseconds
  defaultDecay = 200,   // milliseconds
  defaultSustain = 70,  // percentage (0-100)
  defaultRelease = 300,  // milliseconds
  maxAttack = 60000,  // max 60 seconds
  maxDecay = 60000,   // max 60 seconds
  maxRelease = 60000,  // max 60 seconds
  tabs: customTabs,     // optional custom tab labels
  activeTab: propActiveTab,  // optional controlled tab index
  onTabChange           // optional callback when tab changes
}) => {
  const [attack, setAttack] = useState(propAttack ?? defaultAttack);
  const [decay, setDecay] = useState(propDecay ?? defaultDecay);
  const [sustain, setSustain] = useState(propSustain ?? defaultSustain);
  const [release, setRelease] = useState(propRelease ?? defaultRelease);
  const [activeParam, setActiveParam] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState(0);

  // Sync state with props when they change (e.g., when switching tabs)
  useEffect(() => {
    if (propAttack !== undefined) setAttack(propAttack);
  }, [propAttack]);

  useEffect(() => {
    if (propDecay !== undefined) setDecay(propDecay);
  }, [propDecay]);

  useEffect(() => {
    if (propSustain !== undefined) setSustain(propSustain);
  }, [propSustain]);

  useEffect(() => {
    if (propRelease !== undefined) setRelease(propRelease);
  }, [propRelease]);

  // Use controlled or uncontrolled tab state
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
  const handleTabChange = (index) => {
    setInternalActiveTab(index);
    onTabChange?.(index);
  };
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleAttack = propAttack ?? attack;
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
  const totalTime = handleAttack + handleDecay + handleRelease;
  const sustainWidth = w * 0.3; // Fixed 30% for sustain plateau

  // Calculate segment widths based on time proportions
  const attackWidth = (handleAttack / totalTime) * (w - sustainWidth);
  const decayWidth = (handleDecay / totalTime) * (w - sustainWidth);
  const releaseWidth = (handleRelease / totalTime) * (w - sustainWidth);

  // Generate ADSR curve path
  const generatePath = () => {
    const sustainLevel = (handleSustain / 100) * h;

    let path = `M ${padding} ${padding + h}`; // Start at bottom left
    path += ` L ${padding + attackWidth} ${padding}`; // Attack to peak
    path += ` L ${padding + attackWidth + decayWidth} ${padding + h - sustainLevel}`; // Decay to sustain
    path += ` L ${padding + attackWidth + decayWidth + sustainWidth} ${padding + h - sustainLevel}`; // Sustain plateau
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

    if (relX >= 0 && relX < attackWidth) {
      param = 'attack';
      currentValue = handleAttack;
    } else if (relX >= attackWidth && relX < attackWidth + decayWidth) {
      param = 'decay';
      currentValue = handleDecay;
    } else if (relX >= attackWidth + decayWidth && relX < attackWidth + decayWidth + sustainWidth) {
      param = 'sustain';
      currentValue = handleSustain;
    } else if (relX >= attackWidth + decayWidth + sustainWidth) {
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

    if (relX >= 0 && relX < attackWidth) {
      param = 'attack';
      currentValue = handleAttack;
    } else if (relX >= attackWidth && relX < attackWidth + decayWidth) {
      param = 'decay';
      currentValue = handleDecay;
    } else if (relX >= attackWidth + decayWidth && relX < attackWidth + decayWidth + sustainWidth) {
      param = 'sustain';
      currentValue = handleSustain;
    } else if (relX >= attackWidth + decayWidth + sustainWidth) {
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
      case 'attack':
        const newAttack = Math.max(10, Math.min(maxAttack, startValue.current + deltaX * 10));
        setAttack(newAttack);
        onAttackChange?.(newAttack);
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

  const tabs = customTabs ?? ['ENV 1', 'ENV 2', 'ENV 3'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--synth-space-sm)' }}>
      <div style={{
        color: 'var(--synth-text-primary)',
        fontSize: 'var(--synth-font-size-sm)',
        fontWeight: 'var(--synth-font-weight-bold)',
        letterSpacing: 'var(--synth-letter-spacing-wide)',
      }}>
        {label}
      </div>

      {/* Container with tabs and visualization */}
      <div style={{
        width: 'var(--synth-4k)',
        height: 'var(--synth-2k)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--synth-gradient-inset)',
        borderRadius: 'var(--synth-radius-md)',
        boxShadow: 'var(--synth-shadow-inset)',
        padding: 'var(--synth-space-xs)',
        gap: 'var(--synth-space-xs)',
      }}>
        {/* Tab interface - only show if tabs array has items */}
        {tabs.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--synth-space-xs)' }}>
            {tabs.map((tab, index) => (
              <div
                key={index}
                onClick={() => handleTabChange(index)}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: 'var(--synth-space-xs) var(--synth-space-sm)',
                  fontSize: 'var(--synth-font-size-xs)',
                  fontWeight: 'var(--synth-font-weight-bold)',
                  transition: 'var(--synth-transition-fast)',
                  borderRadius: 'var(--synth-radius-sm)',
                  background: activeTab === index
                    ? 'linear-gradient(145deg, #3a3a3a, #252525)'
                    : 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                  color: activeTab === index ? '#ffffff' : '#666',
                  boxShadow: activeTab === index
                    ? 'inset 1px 1px 2px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.3)'
                    : '1px 1px 2px rgba(0,0,0,0.6)',
                  textShadow: activeTab === index ? '0 0 4px rgba(255,255,255,0.6)' : 'none',
                }}
              >
                {tab}
              </div>
            ))}
          </div>
        )}

        {/* Visualization */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            position: 'relative',
            flex: 1,
            background: 'linear-gradient(180deg, #0a0a0a, #1a1a1a)',
            borderRadius: 'var(--synth-radius-sm)',
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

          {/* ADSR curve */}
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
          <text
            x={padding + attackWidth / 2}
            y={padding + h / 3}
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
            fontFamily="var(--synth-font-mono)"
            textAnchor="middle"
          >
            {Math.round(handleAttack)}ms
          </text>

          <text
            x={padding + attackWidth + decayWidth / 2}
            y={padding + h / 2}
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
            fontFamily="var(--synth-font-mono)"
            textAnchor="middle"
          >
            {Math.round(handleDecay)}ms
          </text>

          <text
            x={padding + attackWidth + decayWidth + sustainWidth / 2}
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
          <span>A</span>
          <span>D</span>
          <span>S</span>
          <span>R</span>
        </div>
        </div>
      </div>
    </div>
  );
};
