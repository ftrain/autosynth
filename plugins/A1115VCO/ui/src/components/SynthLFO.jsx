/**
 * @file SynthLFO.jsx
 * @brief LFO component with waveform display and knob-based waveform selector
 *
 * @description
 * A Low Frequency Oscillator (LFO) component with visual waveform display,
 * knob-based waveform selection, and rate control slider. The waveform icons
 * are arranged around the selector knob for intuitive selection.
 *
 * ## Use Cases
 * - **Vibrato**: Modulate pitch at 4-8Hz for natural vibrato effect
 * - **Tremolo**: Modulate amplitude for rhythmic volume changes
 * - **Filter Sweep**: Slow modulation of filter cutoff for movement
 * - **PWM (Pulse Width Modulation)**: Modulate pulse width for thickening
 * - **Pan Modulation**: Auto-pan effect with triangle or sine waves
 * - **Wobble Bass**: Square or triangle LFO on filter for dubstep bass
 * - **Arpeggiator Sync**: Sync LFO rate to tempo for rhythmic effects
 *
 * ## Waveform Types
 * - **Triangle**: Smooth up/down motion, great for vibrato and subtle modulation
 * - **Square**: Abrupt on/off, perfect for trills and gating effects
 * - **Sine**: Smoothest motion, ideal for natural-sounding modulation
 * - **Sawtooth**: Rising ramp, creates builds and sweeps
 * - **Ramp**: Falling ramp, inverse of sawtooth for decaying effects
 * - **Stepped S&H**: Random stepped values, classic sample-and-hold for chaos
 * - **Smooth S&H**: Smoothly interpolated random, organic random movement
 *
 * ## Rate Ranges
 * - **Sub-audio (0.1-1Hz)**: Slow sweeps, evolving textures
 * - **Standard (1-10Hz)**: Vibrato, tremolo, typical modulation
 * - **Fast (10-20Hz)**: Extreme effects, FM-like timbres
 *
 * @example
 * ```jsx
 * <SynthLFO
 *   label="LFO 1"
 *   waveform={2}  // Sine
 *   rate={5}      // 5 Hz
 *   onWaveformChange={(w) => setWaveform(w)}
 *   onRateChange={(r) => setRate(r)}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';

export const SynthLFO = ({
  label = "LFO",
  waveform: propWaveform,
  rate: propRate,
  onWaveformChange,
  onRateChange,
  defaultWaveform = 0,
  defaultRate = 2,
  minRate = 0.1,
  maxRate = 20
}) => {
  const [waveform, setWaveform] = useState(propWaveform ?? defaultWaveform);
  const [rate, setRate] = useState(propRate ?? defaultRate);
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef(null);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleWaveform = propWaveform ?? waveform;
  const handleRate = propRate ?? rate;

  const waveformCount = 7;

  const handleWaveformClick = (index) => {
    setWaveform(index);
    onWaveformChange?.(index);
  };

  // Knob drag handlers for waveform selection
  const handleKnobStart = (clientY) => {
    setIsDragging(true);
    startY.current = clientY;
    startValue.current = handleWaveform;
  };

  const handleKnobMove = (clientY) => {
    if (!isDragging) return;
    const deltaY = startY.current - clientY;
    const sensitivity = 30; // pixels per step
    const steps = Math.round(deltaY / sensitivity);
    let newWaveform = Math.round(startValue.current + steps);
    newWaveform = Math.max(0, Math.min(waveformCount - 1, newWaveform));
    if (newWaveform !== handleWaveform) {
      setWaveform(newWaveform);
      onWaveformChange?.(newWaveform);
    }
  };

  const handleKnobEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleKnobMove(e.clientY);
      const handleTouchMove = (e) => {
        handleKnobMove(e.touches[0].clientY);
        e.preventDefault();
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleKnobEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleKnobEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleKnobEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleKnobEnd);
      };
    }
  }, [isDragging, handleWaveform]);

  // Generate small SVG icon for each waveform type (for around knob)
  const WaveformIcon = ({ type, size = 18, active = false }) => {
    const w = size;
    const h = size * 0.5;
    const centerY = h / 2;
    const amplitude = h / 2 - 1;

    let path = '';
    switch (type) {
      case 0: // Triangle
        path = `M 0 ${centerY} L ${w/4} ${centerY - amplitude} L ${w*3/4} ${centerY + amplitude} L ${w} ${centerY}`;
        break;
      case 1: // Square
        path = `M 0 ${centerY} L 0 ${centerY - amplitude} L ${w/2} ${centerY - amplitude} L ${w/2} ${centerY + amplitude} L ${w} ${centerY + amplitude} L ${w} ${centerY}`;
        break;
      case 2: // Sine
        path = `M 0 ${centerY} Q ${w/4} ${centerY - amplitude}, ${w/2} ${centerY} Q ${w*3/4} ${centerY + amplitude}, ${w} ${centerY}`;
        break;
      case 3: // Sawtooth (rising ramp with vertical drop)
        path = `M ${w*0.15} ${centerY + amplitude} L ${w*0.5} ${centerY - amplitude} L ${w*0.5} ${centerY + amplitude} L ${w*0.85} ${centerY - amplitude}`;
        break;
      case 4: // Ramp (falling ramp with vertical rise)
        path = `M ${w*0.15} ${centerY - amplitude} L ${w*0.5} ${centerY + amplitude} L ${w*0.5} ${centerY - amplitude} L ${w*0.85} ${centerY + amplitude}`;
        break;
      case 5: // Stepped S&H
        path = `M 0 ${centerY + amplitude*0.3} L ${w*0.25} ${centerY + amplitude*0.3} L ${w*0.25} ${centerY - amplitude*0.8} L ${w*0.5} ${centerY - amplitude*0.8} L ${w*0.5} ${centerY + amplitude*0.5} L ${w*0.75} ${centerY + amplitude*0.5} L ${w*0.75} ${centerY - amplitude*0.2} L ${w} ${centerY - amplitude*0.2}`;
        break;
      case 6: // Smooth S&H
        path = `M 0 ${centerY + amplitude*0.3} Q ${w*0.15} ${centerY + amplitude*0.3}, ${w*0.25} ${centerY - amplitude*0.6} Q ${w*0.35} ${centerY - amplitude}, ${w*0.5} ${centerY + amplitude*0.4} Q ${w*0.65} ${centerY + amplitude}, ${w*0.75} ${centerY - amplitude*0.3} Q ${w*0.85} ${centerY - amplitude*0.5}, ${w} ${centerY}`;
        break;
      default:
        path = '';
    }

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? "2" : "1.5"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Calculate knob rotation based on waveform (-135° to +135° = 270° total)
  const knobRotation = (handleWaveform / (waveformCount - 1)) * 270 - 135;

  // Generate SVG path for waveform
  // Rate directly determines cycles shown: 0.1 Hz = 0.1 cycles, 1 Hz = 1 cycle, 20 Hz = 20 cycles
  const generateWaveformPath = (type, rate) => {
    const width = 180;  // 200 - 20 padding
    const height = 100;
    const centerY = height / 2;
    const amplitude = height / 2 - 10;

    // Cycles shown = actual frequency in Hz
    const cycles = rate;
    const cycleWidth = width / cycles;

    let path = '';

    switch (type) {
      case 0: // Triangle
        for (let i = 0; i < cycles; i++) {
          const x0 = i * cycleWidth;
          const x1 = x0 + cycleWidth / 4;
          const x2 = x0 + cycleWidth * 3 / 4;
          const x3 = x0 + cycleWidth;
          if (i === 0) path += `M ${x0} ${centerY}`;
          path += ` L ${x1} ${centerY - amplitude} L ${x2} ${centerY + amplitude} L ${x3} ${centerY}`;
        }
        return path;

      case 1: // Square
        for (let i = 0; i < cycles; i++) {
          const x0 = i * cycleWidth;
          const x1 = x0 + cycleWidth / 2;
          const x2 = x0 + cycleWidth;
          if (i === 0) path += `M ${x0} ${centerY} L ${x0} ${centerY - amplitude}`;
          else path += ` L ${x0} ${centerY - amplitude}`;
          path += ` L ${x1} ${centerY - amplitude} L ${x1} ${centerY + amplitude} L ${x2} ${centerY + amplitude}`;
          if (i < cycles - 1) path += ` L ${x2} ${centerY}`;
        }
        return path;

      case 2: // Sine
        path = `M 0 ${centerY}`;
        for (let i = 0; i < cycles; i++) {
          const x0 = i * cycleWidth;
          const x1 = x0 + cycleWidth / 4;
          const x2 = x0 + cycleWidth / 2;
          const x3 = x0 + cycleWidth * 3 / 4;
          const x4 = x0 + cycleWidth;
          path += ` Q ${x1} ${centerY - amplitude}, ${x2} ${centerY}`;
          path += ` Q ${x3} ${centerY + amplitude}, ${x4} ${centerY}`;
        }
        return path;

      case 3: // Sawtooth
        for (let i = 0; i < cycles; i++) {
          const x0 = i * cycleWidth;
          const x1 = x0 + cycleWidth;
          if (i === 0) path += `M ${x0} ${centerY + amplitude}`;
          path += ` L ${x1} ${centerY - amplitude}`;
          if (i < cycles - 1) path += ` L ${x1} ${centerY + amplitude}`;
        }
        return path;

      case 4: // Ramp
        for (let i = 0; i < cycles; i++) {
          const x0 = i * cycleWidth;
          const x1 = x0 + cycleWidth;
          if (i === 0) path += `M ${x0} ${centerY - amplitude}`;
          path += ` L ${x1} ${centerY + amplitude}`;
          if (i < cycles - 1) path += ` L ${x1} ${centerY - amplitude}`;
        }
        return path;

      case 5: // Stepped S&H - random stepped values
        {
          // Use deterministic pseudo-random based on rate for consistent display
          const seed = Math.floor(rate * 100);
          const seededRandom = (i) => {
            const x = Math.sin(seed + i * 12.9898) * 43758.5453;
            return x - Math.floor(x);
          };
          const stepsPerCycle = 4;
          const totalSteps = Math.ceil(cycles * stepsPerCycle);
          const stepWidth = width / totalSteps;

          for (let i = 0; i < totalSteps; i++) {
            const x0 = i * stepWidth;
            const x1 = x0 + stepWidth;
            const level = centerY + (seededRandom(i) * 2 - 1) * amplitude;
            if (i === 0) path += `M ${x0} ${level}`;
            else path += ` L ${x0} ${level}`;
            path += ` L ${x1} ${level}`;
          }
        }
        return path;

      case 6: // Smooth S&H - smoothly interpolated random
        {
          const seed = Math.floor(rate * 100);
          const seededRandom = (i) => {
            const x = Math.sin(seed + i * 12.9898) * 43758.5453;
            return x - Math.floor(x);
          };
          const pointsPerCycle = 4;
          const totalPoints = Math.ceil(cycles * pointsPerCycle) + 1;
          const segmentWidth = width / (totalPoints - 1);

          // Generate random levels for each point
          const levels = [];
          for (let i = 0; i < totalPoints; i++) {
            levels.push(centerY + (seededRandom(i) * 2 - 1) * amplitude);
          }

          path = `M 0 ${levels[0]}`;
          for (let i = 0; i < totalPoints - 1; i++) {
            const x0 = i * segmentWidth;
            const x1 = (i + 1) * segmentWidth;
            const xMid = (x0 + x1) / 2;
            path += ` Q ${xMid} ${levels[i]}, ${x1} ${levels[i + 1]}`;
          }
        }
        return path;

      default:
        return '';
    }
  };

  // Positions for waveform icons around the knob (arranged in arc from -135° to +135°)
  // 7 waveforms over 270° = 45° spacing
  const iconPositions = [
    { angle: -135, type: 0 }, // Triangle - bottom left
    { angle: -90, type: 1 },  // Square - left
    { angle: -45, type: 2 },  // Sine - upper left
    { angle: 0, type: 3 },    // Sawtooth - top
    { angle: 45, type: 4 },   // Ramp - upper right
    { angle: 90, type: 5 },   // Stepped S&H - right
    { angle: 135, type: 6 },  // Smooth S&H - bottom right
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--synth-space-sm)' }}>
      <div style={{ color: 'var(--synth-text-primary)', fontSize: 'var(--synth-font-size-sm)', fontWeight: 'bold', letterSpacing: '1.5px' }}>{label}</div>

      {/* Container: waveform knob + display + rate slider */}
      <div style={{ display: 'flex', gap: 'var(--synth-space-sm)', alignItems: 'center' }}>
        {/* Waveform selector knob with icons around it */}
        <div
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Waveform icons positioned around the knob */}
          {iconPositions.map(({ angle, type }) => {
            const radius = 38; // Distance from center
            // Convert angle to radians, adjust so 0° is at top
            const rad = (angle - 90) * (Math.PI / 180);
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            const isActive = handleWaveform === type;

            return (
              <div
                key={type}
                onClick={() => handleWaveformClick(type)}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  color: isActive ? '#fff' : '#555',
                  transition: 'all 150ms',
                  filter: isActive ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none',
                  padding: '1px',
                }}
                title={['Triangle', 'Square', 'Sine', 'Sawtooth', 'Ramp', 'Stepped S&H', 'Smooth S&H'][type]}
              >
                <WaveformIcon type={type} size={12} active={isActive} />
              </div>
            );
          })}

          {/* The knob itself */}
          <div
            ref={knobRef}
            onMouseDown={(e) => {
              handleKnobStart(e.clientY);
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              handleKnobStart(e.touches[0].clientY);
              e.preventDefault();
            }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
              boxShadow: isDragging
                ? 'inset 2px 2px 4px rgba(0,0,0,0.8), 0 0 12px rgba(255,255,255,0.4)'
                : 'inset 2px 2px 4px rgba(0,0,0,0.5), 2px 2px 6px rgba(0,0,0,0.5)',
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: isDragging ? 'none' : 'box-shadow 150ms',
            }}
          >
            {/* Inner circle with indicator */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.8)',
                position: 'relative',
                transform: `rotate(${knobRotation}deg)`,
                transition: isDragging ? 'none' : 'transform 100ms',
              }}
            >
              {/* Indicator line */}
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '3px',
                  height: '10px',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '2px',
                  boxShadow: '0 0 4px rgba(255,255,255,0.6)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Waveform display - 2.5K x 2K */}
        <div
          style={{
            position: 'relative',
            width: '200px',
            height: 'var(--synth-2k)',
            background: 'var(--synth-gradient-inset)',
            borderRadius: 'var(--synth-radius-md)',
            boxShadow: 'var(--synth-shadow-inset)',
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--synth-space-xs)',
          }}
        >
          {/* SVG waveform */}
          <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet" style={{ flex: 1 }}>
            {/* Center line */}
            <line
              x1="10"
              y1="50"
              x2="190"
              y2="50"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />

            {/* Waveform */}
            <path
              d={generateWaveformPath(handleWaveform, handleRate)}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))',
              }}
            />
          </svg>
        </div>

        {/* Rate control on right - custom styled to match display height */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              position: 'relative',
              width: '40px',
              height: 'var(--synth-2k)',
              background: 'linear-gradient(180deg, #1a1a1a, #0a0a0a)',
              borderRadius: '8px',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8), 2px 2px 6px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              touchAction: 'none',
            }}
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickY = e.clientY - rect.top;
              const percentage = 1 - (clickY / rect.height);
              const newRate = minRate + percentage * (maxRate - minRate);
              setRate(Math.max(minRate, Math.min(maxRate, newRate)));
              onRateChange?.(Math.max(minRate, Math.min(maxRate, newRate)));

              const handleDrag = (moveEvent) => {
                const moveY = moveEvent.clientY - rect.top;
                const movePercentage = 1 - (moveY / rect.height);
                const dragRate = minRate + movePercentage * (maxRate - minRate);
                const clampedRate = Math.max(minRate, Math.min(maxRate, dragRate));
                setRate(clampedRate);
                onRateChange?.(clampedRate);
              };

              const handleUp = () => {
                window.removeEventListener('mousemove', handleDrag);
                window.removeEventListener('mouseup', handleUp);
              };

              window.addEventListener('mousemove', handleDrag);
              window.addEventListener('mouseup', handleUp);
              e.preventDefault();
            }}
          >
            {/* Track */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '8px',
              width: '8px',
              height: 'calc(100% - 16px)',
              background: '#0a0a0a',
              borderRadius: '4px',
              boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.8)',
            }}>
              {/* Fill */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${((handleRate - minRate) / (maxRate - minRate)) * 100}%`,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
                borderRadius: '4px',
                boxShadow: '0 0 8px rgba(255,255,255,0.6), inset 0 0 6px rgba(255,255,255,0.3)',
              }} />
            </div>
          </div>
          {/* Rate value - slightly below, off-grid look */}
          <div style={{
            color: 'var(--synth-text-tertiary)',
            fontSize: '10px',
            fontFamily: 'var(--synth-font-mono)',
            marginTop: '2px',
          }}>
            {handleRate.toFixed(1)}Hz
          </div>
        </div>
      </div>
    </div>
  );
};
