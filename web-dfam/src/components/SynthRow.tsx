/**
 * @file SynthRow.tsx
 * @brief Layout component for organizing synth controls in horizontal rows
 * @note Copied from core/ui/components/SynthRow.jsx - keep in sync
 */

import React from 'react';

// Predefined themes for different module types
const THEMES: Record<string, React.CSSProperties & { titleColor?: string; titleGlow?: string }> = {
  default: {
    background: 'transparent',
    border: 'none',
    titleColor: '#888',
    titleGlow: 'none',
  },
  amber: {
    background: 'linear-gradient(180deg, #1a1408 0%, #2d2010 50%, #1a1408 100%)',
    border: '2px solid #cc8800',
    borderRadius: '12px',
    titleColor: '#ffaa00',
    titleGlow: '0 0 15px rgba(255,170,0,0.6)',
    boxShadow: '0 0 40px rgba(204,136,0,0.2), inset 0 1px 0 rgba(255,200,100,0.1)',
  },
  blue: {
    background: 'linear-gradient(135deg, #0a0a1f 0%, #151530 30%, #1a1040 70%, #0a0a1f 100%)',
    border: '2px solid #6666ff',
    borderRadius: '16px',
    titleColor: '#8888ff',
    titleGlow: '0 0 20px rgba(136,136,255,0.8)',
    boxShadow: '0 0 50px rgba(102,102,255,0.2), inset 0 0 80px rgba(102,102,255,0.05)',
  },
  green: {
    background: 'linear-gradient(180deg, #0a1a0a 0%, #102010 50%, #0a1a0a 100%)',
    border: '2px solid #00cc44',
    borderRadius: '8px',
    titleColor: '#00ff55',
    titleGlow: '0 0 10px rgba(0,255,85,0.6)',
    boxShadow: '0 0 30px rgba(0,204,68,0.15)',
  },
  magenta: {
    background: 'linear-gradient(135deg, #1a0a1a 0%, #2d1033 50%, #1a0a1a 100%)',
    border: '1px solid #ff00ff',
    borderRadius: '8px',
    titleColor: '#ff00ff',
    titleGlow: '0 0 10px rgba(255,0,255,0.8)',
    boxShadow: '0 0 30px rgba(255,0,255,0.15), inset 0 0 60px rgba(255,0,255,0.05)',
  },
  cyan: {
    background: 'linear-gradient(135deg, #0a1a1a 0%, #0d2d33 50%, #0a1a1a 100%)',
    border: '1px solid #00ffff',
    borderRadius: '8px',
    titleColor: '#00ffff',
    titleGlow: '0 0 10px rgba(0,255,255,0.8)',
    boxShadow: '0 0 30px rgba(0,255,255,0.15), inset 0 0 60px rgba(0,255,255,0.05)',
  },
  pink: {
    background: 'linear-gradient(180deg, #1a0a1a 0%, #200818 30%, #180a20 70%, #100510 100%)',
    border: '1px solid #ff3366',
    borderRadius: '12px',
    titleColor: '#ff3366',
    titleGlow: '0 0 25px rgba(255,51,102,0.7)',
    boxShadow: '0 0 60px rgba(255,51,102,0.1), inset 0 0 100px rgba(255,51,102,0.03)',
  },
  orange: {
    background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
    border: 'none',
    borderBottom: '3px solid #ff6600',
    borderRadius: '0',
    titleColor: '#ff6600',
    titleGlow: '0 0 20px rgba(255,102,0,0.5)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
};

interface SynthRowProps {
  children: React.ReactNode;
  label?: string;
  icon?: string;
  gap?: string;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  padding?: string;
  wrap?: boolean;
  showPanel?: boolean;
  showDivider?: boolean;
  theme?: 'default' | 'amber' | 'blue' | 'green' | 'magenta' | 'cyan' | 'pink' | 'orange';
  themeStyles?: React.CSSProperties & { titleColor?: string; titleGlow?: string };
  style?: React.CSSProperties;
}

export const SynthRow: React.FC<SynthRowProps> = ({
  children,
  label,
  icon,
  gap = 'var(--synth-space-xl, 24px)',
  align = 'flex-start',
  justify = 'flex-start',
  padding = 'var(--synth-space-md, 12px)',
  wrap = true,
  showPanel = false,
  showDivider = false,
  theme = 'default',
  themeStyles = {},
  style = {},
}) => {
  const activeTheme = { ...THEMES[theme] || THEMES.default, ...themeStyles };
  const hasTheme = theme !== 'default' || Object.keys(themeStyles).length > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: label ? 'var(--synth-space-sm, 8px)' : 0,
        ...(hasTheme && {
          background: activeTheme.background,
          border: activeTheme.border,
          borderBottom: activeTheme.borderBottom,
          borderRadius: activeTheme.borderRadius,
          boxShadow: activeTheme.boxShadow,
          padding: padding,
          margin: '8px',
        }),
      }}
    >
      {label && (
        <div
          style={{
            color: activeTheme.titleColor || 'var(--synth-text-secondary, #888)',
            fontSize: 'var(--synth-font-size-sm, 14px)',
            fontWeight: 'var(--synth-font-weight-bold, bold)',
            letterSpacing: 'var(--synth-letter-spacing-wide, 3px)',
            textShadow: activeTheme.titleGlow || 'none',
            paddingLeft: hasTheme ? '0' : padding,
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
          {label}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap,
          padding: hasTheme ? '0' : padding,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          ...(showPanel && !hasTheme && {
            background: 'var(--synth-gradient-panel, rgba(40, 40, 40, 0.6))',
            borderRadius: 'var(--synth-radius-md, 8px)',
            boxShadow: 'var(--synth-shadow-sm, inset 0 1px 3px rgba(0,0,0,0.3))',
          }),
          ...style,
        }}
      >
        {children}
      </div>

      {showDivider && (
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            margin: `var(--synth-space-sm, 8px) ${hasTheme ? '0' : padding}`,
          }}
        />
      )}
    </div>
  );
};

export const SYNTH_THEMES = THEMES;
export default SynthRow;
