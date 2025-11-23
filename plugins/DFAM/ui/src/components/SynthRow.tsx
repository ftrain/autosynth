/**
 * @file SynthRow.tsx
 * @brief Layout component for organizing synth controls in horizontal rows
 */

import React from 'react';

interface SynthRowProps {
  children: React.ReactNode;
  label?: string;
  gap?: string;
  align?: 'flex-start' | 'center' | 'flex-end';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  padding?: string;
  wrap?: boolean;
  showPanel?: boolean;
  showDivider?: boolean;
  style?: React.CSSProperties;
}

export const SynthRow: React.FC<SynthRowProps> = ({
  children,
  label,
  gap = '24px',
  align = 'flex-start',
  justify = 'flex-start',
  padding = '12px',
  wrap = false,
  showPanel = false,
  showDivider = false,
  style = {},
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: label ? '8px' : 0,
      }}
    >
      {/* Section label */}
      {label && (
        <div
          style={{
            color: '#888',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            paddingLeft: padding,
          }}
        >
          {label}
        </div>
      )}

      {/* Row content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap,
          padding,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          ...(showPanel && {
            background: 'rgba(40, 40, 40, 0.6)',
            borderRadius: '8px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          }),
          ...style,
        }}
      >
        {children}
      </div>

      {/* Optional divider */}
      {showDivider && (
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            margin: `8px ${padding}`,
          }}
        />
      )}
    </div>
  );
};

export default SynthRow;
