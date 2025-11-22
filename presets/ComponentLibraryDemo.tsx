/**
 * @file ComponentLibraryDemo.tsx
 * @brief Component library showcase - use this to see all available components
 *
 * This is NOT the main synth UI - it's a demo/documentation of the component library.
 * To use this instead of the main synth, import it in App.tsx
 */

import { ComponentShowcase } from './ComponentShowcase';
import { useParameters } from '../hooks/useParameters';
import { useJUCEBridge } from '../hooks/useJUCEBridge';
import { parameters } from '../parameters';
import '../styles/tokens.css';

export function ComponentLibraryDemo() {
  const {
    paramValues,
    handleChange,
    isJUCE,
  } = useParameters({
    parameters,
    syncWithJUCE: true,
    batchUpdates: true,
  });

  const {
    currentPreset,
  } = useJUCEBridge({
    enableAudioData: false,
    enablePresets: true,
  });

  return (
    <div style={{ position: 'relative' }}>
      {isJUCE && (
        <div
          style={{
            position: 'fixed',
            top: 'var(--synth-space-lg)',
            left: 'var(--synth-space-lg)',
            padding: 'var(--synth-space-sm) var(--synth-space-md)',
            background: 'var(--synth-gradient-panel)',
            border: '1px solid var(--synth-accent-primary)',
            borderRadius: 'var(--synth-radius-md)',
            color: 'var(--synth-text-primary)',
            fontSize: 'var(--synth-font-size-xs)',
            boxShadow: 'var(--synth-shadow-glow-accent)',
            zIndex: 1000,
          }}
        >
          JUCE
          {currentPreset && ` • ${currentPreset}`}
        </div>
      )}

      <ComponentShowcase
        paramValues={paramValues}
        onChange={handleChange}
        parameters={parameters}
      />
    </div>
  );
}
