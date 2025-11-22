/**
 * @file Row.tsx
 * @brief Horizontal flex layout component with responsive behavior
 */

import React from 'react';
import { RowProps } from '../types/components';
import { synthStyles } from '../styles/shared';

/**
 * Row component for horizontal layouts
 *
 * @example
 * ```tsx
 * <Row gap={16} wrap>
 *   <SynthKnob label="CUTOFF" {...props} />
 *   <SynthKnob label="RESONANCE" {...props} />
 * </Row>
 * ```
 */
export const Row: React.FC<RowProps> = ({
  children,
  gap,
  align = 'flex-start',
  wrap = false,
  style,
}) => {
  const rowStyle = synthStyles.row(gap, wrap);

  return (
    <div
      style={{
        ...rowStyle,
        alignItems: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Row;
