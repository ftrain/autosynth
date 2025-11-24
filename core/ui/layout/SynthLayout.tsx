/**
 * @file SynthLayout.tsx
 * @brief Main layout container for synthesizer UIs with responsive behavior
 */

import React from 'react';
import { LayoutProps } from '../types/components';

/**
 * SynthLayout component - main container for synth interfaces
 * Provides consistent padding, responsive behavior, and vertical scrolling
 *
 * @remarks
 * - Vertical scrolling enabled by default
 * - Horizontal scaling: components scale down to 50% on narrow screens
 * - Dark background by default
 *
 * @example
 * ```tsx
 * <SynthLayout>
 *   <ParameterGroup title="Oscillators">
 *     <Row>...</Row>
 *   </ParameterGroup>
 *   <ParameterGroup title="Filter">
 *     <Row>...</Row>
 *   </ParameterGroup>
 * </SynthLayout>
 * ```
 */
export const SynthLayout: React.FC<LayoutProps> = ({ children, style }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--synth-bg-darkest)',
        color: 'var(--synth-text-secondary)',
        minHeight: '100vh',
        height: '100vh',
        padding: 'var(--synth-space-2xl)',
        fontFamily: 'var(--synth-font-mono)',
        overflowY: 'scroll',
        overflowX: 'hidden',
        // Responsive scaling using CSS clamp
        fontSize: 'clamp(10px, 1vw, 12px)',
        ...style,
      }}
    >
      {/* Container with max-width for better readability on large screens */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children}
      </div>

      {/* Responsive CSS for scaling */}
      <style>{`
        /* Scale down components on smaller screens - K scales down */
        @media (max-width: 1200px) {
          :root {
            --synth-k: 56px;
            --synth-knob-inner-size: 42px;
            --synth-toggle-size: 42px;
          }
        }

        @media (max-width: 900px) {
          :root {
            --synth-k: 48px;
            --synth-knob-inner-size: 36px;
            --synth-toggle-size: 38px;
            --synth-font-size-xs: 7px;
            --synth-font-size-sm: 9px;
            --synth-font-size-md: 10px;
          }
        }

        @media (max-width: 600px) {
          :root {
            --synth-k: 40px;
            --synth-knob-inner-size: 30px;
            --synth-toggle-size: 34px;
            --synth-font-size-xs: 6px;
            --synth-font-size-sm: 8px;
            --synth-font-size-md: 9px;
            --synth-space-xs: 3px;
            --synth-space-sm: 6px;
            --synth-space-md: 9px;
            --synth-space-lg: 12px;
          }
        }

        /* Ensure controls wrap on narrow screens */
        @media (max-width: 768px) {
          [style*="display: flex"][style*="flex-direction: row"] {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default SynthLayout;
