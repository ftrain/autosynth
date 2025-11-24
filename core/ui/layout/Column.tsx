/**
 * @file Column.tsx
 * @brief Vertical flex layout component
 */

import React from 'react';
import { ColumnProps } from '../types/components';
import { synthStyles } from '../styles/shared';

/**
 * Column component for vertical layouts
 *
 * @example
 * ```tsx
 * <Column gap={12}>
 *   <SynthKnob label="ATTACK" {...props} />
 *   <SynthKnob label="DECAY" {...props} />
 * </Column>
 * ```
 */
export const Column: React.FC<ColumnProps> = ({
  children,
  gap,
  align = 'flex-start',
  style,
}) => {
  const columnStyle = synthStyles.column(gap);

  return (
    <div
      style={{
        ...columnStyle,
        alignItems: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Column;
