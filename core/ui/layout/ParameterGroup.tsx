/**
 * @file ParameterGroup.tsx
 * @brief Parameter grouping component with optional collapse functionality
 */

import React, { useState } from 'react';
import { ParameterGroupProps } from '../types/components';
import { synthStyles } from '../styles/shared';

/**
 * ParameterGroup component for organizing related parameters
 *
 * @example
 * ```tsx
 * <ParameterGroup title="Filter Section">
 *   <Row>
 *     <SynthKnob label="CUTOFF" {...props} />
 *     <SynthKnob label="RESONANCE" {...props} />
 *   </Row>
 * </ParameterGroup>
 * ```
 *
 * @example Collapsible group
 * ```tsx
 * <ParameterGroup title="Advanced" collapsible>
 *   <Row>...</Row>
 * </ParameterGroup>
 * ```
 */
export const ParameterGroup: React.FC<ParameterGroupProps> = ({
  title,
  children,
  collapsible = false,
  isOpen: controlledIsOpen,
  onToggle,
  style,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div style={{ ...synthStyles.panel, ...style }}>
      {/* Header */}
      <div
        style={{
          ...synthStyles.panelTitle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: collapsible ? 'pointer' : 'default',
        }}
        onClick={collapsible ? handleToggle : undefined}
      >
        <span>{title}</span>
        {collapsible && (
          <span
            style={{
              fontSize: 'var(--synth-font-size-lg)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'var(--synth-transition-normal)',
            }}
          >
            ▼
          </span>
        )}
      </div>

      {/* Content */}
      {isOpen && <div>{children}</div>}
    </div>
  );
};

export default ParameterGroup;
