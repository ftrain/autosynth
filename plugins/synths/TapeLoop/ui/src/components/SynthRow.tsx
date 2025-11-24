/**
 * @file SynthRow.tsx
 * @brief Container component for grouping synth controls in a horizontal row
 */

import React from 'react';

interface SynthRowProps {
  label: string;
  children: React.ReactNode;
}

/**
 * A horizontal row of synth controls with a label
 */
export const SynthRow: React.FC<SynthRowProps> = ({ label, children }) => {
  return (
    <div style={styles.container}>
      <div style={styles.labelContainer}>
        <span style={styles.label}>{label}</span>
      </div>
      <div style={styles.controls}>
        {children}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    background: 'linear-gradient(145deg, #1a1a1a, #141414)',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    marginBottom: '12px',
  },
  labelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: '#888',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
};

export default SynthRow;
