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
    accentPrimary: '#00ccff', // Phone-themed blue
    accentSecondary: '#ff9900',
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
      ${isActive ? `0 0 ${15 * glowIntensity}px ${ledColor || '#00ccff'}` : '2px 2px 6px rgba(0,0,0,0.5)'}
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
    background: '#00ccff',
    borderRadius: '2px',
    boxShadow: '0 0 6px #00ccff',
    transformOrigin: 'center 18px',
    transform: `rotate(${rotation}deg)`,
  }),

  knobValue: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#00ccff',
    minHeight: '14px',
  } as CSSProperties,
};

export default synthStyles;
