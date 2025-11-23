/**
 * @file SynthRow.tsx
 * @brief Layout component for organizing synth controls in horizontal rows
 */

import React from 'react';
import { SynthRowProps } from '../types/components';

export const SynthRow: React.FC<SynthRowProps> = ({
  children,
  label,
  gap = 'var(--synth-space-xl)',
  align = 'flex-start',
  justify = 'flex-start',
  padding = 'var(--synth-space-md)',
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
        gap: label ? 'var(--synth-space-sm)' : 0,
      }}
    >
      {label && (
        <div
          style={{
            color: 'var(--synth-text-secondary)',
            fontSize: 'var(--synth-font-size-xs)',
            fontWeight: 'var(--synth-font-weight-bold)',
            letterSpacing: 'var(--synth-letter-spacing-wide)',
            paddingLeft: padding,
          }}
        >
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
          padding,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          ...(showPanel && {
            background: 'var(--synth-gradient-panel)',
            borderRadius: 'var(--synth-radius-md)',
            boxShadow: 'var(--synth-shadow-sm)',
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
            margin: `var(--synth-space-sm) ${padding}`,
          }}
        />
      )}
    </div>
  );
};

export default SynthRow;
