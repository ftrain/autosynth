/**
 * @file Oscilloscope.tsx
 * @brief Real-time audio waveform visualization for Phone Tones
 */

import React, { useRef, useEffect } from 'react';

interface OscilloscopeProps {
  label?: string;
  width?: number;
  height?: number;
  audioData?: number[];
  color?: string;
  backgroundColor?: string;
  gridColor?: string;
  showGrid?: boolean;
  showPeaks?: boolean;
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({
  width = 300,
  height = 150,
  audioData = [],
  color = '#00ccff',
  backgroundColor = '#0a0a0a',
  gridColor = '#1a1a1a',
  showGrid = true,
  showPeaks = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const draw = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      if (showGrid) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
          const y = (height / 4) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        for (let i = 0; i <= 8; i++) {
          const x = (width / 8) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

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
          const amplifiedValue = (audioData[i] || 0) * 2.0;
          const value = Math.max(-1, Math.min(1, amplifiedValue));
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

        if (showPeaks && audioData.length > 0) {
          const peak = Math.max(...audioData.map(Math.abs));
          const peakY = ((1 - peak) / 2) * height;
          const minY = ((1 + peak) / 2) * height;

          ctx.fillStyle = peak > 0.9 ? '#ff4444' : color;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(0, peakY, width, minY - peakY);
          ctx.globalAlpha = 1.0;

          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${(peak * 100).toFixed(0)}%`, width - 5, 12);
        }
      } else {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

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
