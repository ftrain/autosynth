/**
 * Shared styles for synth components
 */

import React from 'react';

type CSSProperties = React.CSSProperties;

export const synthStyles = {
  colors: {
    bgPrimary: '#1a1a1a',
    bgSecondary: '#242424',
    bgTertiary: '#2a2a2a',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    accentPrimary: '#00ff88',
    accentSecondary: '#0088ff',
    border: '#333333',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fonts: {
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '18px',
  },

  // Knob styles
  knobContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    userSelect: 'none',
  } as CSSProperties,

  knobLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#a0a0a0',
  } as CSSProperties,

  knobBody: (isActive: boolean, glowIntensity: number, ledColor: string | null): CSSProperties => ({
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
    boxShadow: `
      inset 2px 2px 4px rgba(0,0,0,0.5),
      inset -1px -1px 2px rgba(255,255,255,0.05),
      ${isActive ? `0 0 ${15 * glowIntensity}px ${ledColor || '#00ff88'}` : '2px 2px 6px rgba(0,0,0,0.5)'}
    `,
    border: `2px solid ${ledColor || '#3a3a3a'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'box-shadow 0.1s ease',
  }),

  knobInner: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
    boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  } as CSSProperties,

  knobIndicator: (rotation: number): CSSProperties => ({
    position: 'absolute',
    top: '4px',
    left: '50%',
    width: '3px',
    height: '12px',
    marginLeft: '-1.5px',
    background: '#00ff88',
    borderRadius: '2px',
    boxShadow: '0 0 6px #00ff88',
    transformOrigin: 'center 18px',
    transform: `rotate(${rotation}deg)`,
  }),

  knobValue: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#00ff88',
    minHeight: '14px',
  } as CSSProperties,

  // Slider styles
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    userSelect: 'none',
  } as CSSProperties,

  sliderLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#a0a0a0',
  } as CSSProperties,

  sliderTrack: (isVertical: boolean): CSSProperties => ({
    position: 'relative',
    width: isVertical ? '30px' : '120px',
    height: isVertical ? '120px' : '30px',
    background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
    borderRadius: '8px',
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), 2px 2px 6px rgba(0,0,0,0.3)',
    border: '1px solid #3a3a3a',
    cursor: 'pointer',
  }),

  sliderFill: (percentage: number, isVertical: boolean): CSSProperties => ({
    position: 'absolute',
    bottom: isVertical ? 0 : 'auto',
    left: isVertical ? 0 : 0,
    width: isVertical ? '100%' : `${percentage}%`,
    height: isVertical ? `${percentage}%` : '100%',
    background: 'linear-gradient(to top, #00ff88, #00aa55)',
    borderRadius: '8px',
    opacity: 0.3,
  }),

  sliderThumb: (percentage: number, isVertical: boolean, isDragging: boolean): CSSProperties => ({
    position: 'absolute',
    left: isVertical ? '50%' : `${percentage}%`,
    bottom: isVertical ? `${percentage}%` : '50%',
    transform: isVertical ? 'translate(-50%, 50%)' : 'translate(-50%, 50%)',
    width: '24px',
    height: '12px',
    background: isDragging
      ? 'linear-gradient(145deg, #00ff88, #00aa55)'
      : 'linear-gradient(145deg, #4a4a4a, #3a3a3a)',
    borderRadius: '3px',
    boxShadow: isDragging
      ? '0 0 10px #00ff88, 2px 2px 4px rgba(0,0,0,0.5)'
      : '2px 2px 4px rgba(0,0,0,0.5)',
    border: '1px solid #5a5a5a',
  }),

  sliderValue: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#00ff88',
    minHeight: '14px',
  } as CSSProperties,

  // ADSR styles
  adsrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
    border: '2px solid #3a3a3a',
    borderRadius: '8px',
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), 2px 2px 6px rgba(0,0,0,0.5)',
  } as CSSProperties,

  adsrLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: '#a0a0a0',
  } as CSSProperties,

  adsrCanvas: {
    display: 'block',
    borderRadius: '4px',
    border: '1px solid #2a2a2a',
    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.8)',
  } as CSSProperties,

  adsrSliders: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  } as CSSProperties,

  adsrSliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  } as CSSProperties,

  adsrSliderLabel: {
    fontSize: '9px',
    fontWeight: 'bold',
    color: '#666',
  } as CSSProperties,

  adsrSliderTrack: {
    position: 'relative',
    width: '20px',
    height: '80px',
    background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
    borderRadius: '4px',
    boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.6)',
    border: '1px solid #3a3a3a',
    cursor: 'pointer',
  } as CSSProperties,

  adsrSliderFill: (percentage: number): CSSProperties => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: `${percentage}%`,
    background: 'linear-gradient(to top, #00ff88, #00aa55)',
    borderRadius: '4px',
    opacity: 0.3,
  }),

  adsrSliderThumb: (percentage: number, isDragging: boolean): CSSProperties => ({
    position: 'absolute',
    left: '50%',
    bottom: `${percentage}%`,
    transform: 'translate(-50%, 50%)',
    width: '16px',
    height: '8px',
    background: isDragging
      ? 'linear-gradient(145deg, #00ff88, #00aa55)'
      : 'linear-gradient(145deg, #4a4a4a, #3a3a3a)',
    borderRadius: '2px',
    boxShadow: isDragging
      ? '0 0 8px #00ff88'
      : '1px 1px 2px rgba(0,0,0,0.5)',
    border: '1px solid #5a5a5a',
  }),

  adsrSliderValue: {
    fontSize: '9px',
    fontFamily: 'monospace',
    color: '#00ff88',
    minWidth: '28px',
    textAlign: 'center',
  } as CSSProperties,
};

export default synthStyles;
