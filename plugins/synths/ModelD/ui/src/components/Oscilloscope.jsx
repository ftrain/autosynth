import React, { useRef, useEffect } from 'react';

/**
 * @file Oscilloscope.jsx
 * @brief Real-time audio waveform visualization component
 *
 * @description
 * A canvas-based oscilloscope display for visualizing audio waveforms in real-time.
 * Renders sample data as a continuous line with optional grid overlay and peak indicators.
 *
 * ## Use Cases
 * - **Waveform Monitoring**: Visualize oscillator output, filter response, or final mix
 * - **LFO Visualization**: Display low-frequency oscillator shapes
 * - **Input Monitoring**: Show incoming audio signal for recording
 * - **Tuner Display**: Visualize pitch for tuning purposes
 * - **Educational**: Demonstrate waveform concepts (sine, square, saw, etc.)
 * - **Sound Design Feedback**: Visual confirmation of synthesis parameters
 * - **Clipping Detection**: Peak indicators warn of distortion
 *
 * ## Display Features
 * - High-DPI canvas rendering for crisp visuals
 * - Configurable grid overlay for reference
 * - Peak level indicators with percentage readout
 * - Customizable colors to match your synth theme
 * - Glow effect on waveform for retro CRT aesthetic
 *
 * ## Data Format
 * Pass an array of sample values normalized to -1 to +1 range.
 * Typical array length is 256-1024 samples for smooth display.
 *
 * @example
 * ```jsx
 * // Connect to Web Audio analyzer
 * const [audioData, setAudioData] = useState([]);
 *
 * useEffect(() => {
 *   const dataArray = new Float32Array(256);
 *   analyser.getFloatTimeDomainData(dataArray);
 *   setAudioData(Array.from(dataArray));
 * }, []);
 *
 * <Oscilloscope
 *   audioData={audioData}
 *   color="#4CAF50"
 *   width={300}
 *   height={150}
 *   showGrid={true}
 *   showPeaks={true}
 * />
 * ```
 */

const Oscilloscope = ({
  label = 'SCOPE',
  width = 300,
  height = 150,
  audioData = [],  // Array of sample values from -1 to 1
  color = '#4CAF50',
  backgroundColor = '#0a0a0a',
  gridColor = '#1a1a1a',
  showGrid = true,
  showPeaks = true,
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set canvas size accounting for device pixel ratio
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
          const y = (height / 4) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 8; i++) {
          const x = (width / 8) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Center line (0V)
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      // Draw waveform
      if (audioData && audioData.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        const sliceWidth = width / audioData.length;
        let x = 0;

        for (let i = 0; i < audioData.length; i++) {
          // Apply gain to make waveforms more visible (2x amplification)
          const amplifiedValue = (audioData[i] || 0) * 2.0;
          // Clamp value to -1 to 1 range after amplification
          const value = Math.max(-1, Math.min(1, amplifiedValue));
          // Convert to canvas Y coordinate (inverted, 0 at top)
          const y = ((value + 1) / 2) * height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw peak indicators
        if (showPeaks && audioData.length > 0) {
          const peak = Math.max(...audioData.map(Math.abs));
          const peakY = ((1 - peak) / 2) * height;
          const minY = ((1 + peak) / 2) * height;

          ctx.fillStyle = peak > 0.9 ? '#ff4444' : color;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(0, peakY, width, minY - peakY);
          ctx.globalAlpha = 1.0;

          // Peak value text
          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${(peak * 100).toFixed(0)}%`, width - 5, 12);
        }
      } else {
        // No signal - draw flat line
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    // Animation loop
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, width, height, color, backgroundColor, gridColor, showGrid, showPeaks]);

  return (
    <div style={{
      display: 'inline-block',
      background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
      border: '2px solid #3a3a3a',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), 2px 2px 6px rgba(0,0,0,0.5)',
    }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: '4px',
          border: '1px solid #2a2a2a',
          boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.8)',
        }}
      />
    </div>
  );
};

export default Oscilloscope;
