import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DualModeOscillator } from './DualModeOscillator';
import '../styles/tokens.css';

const meta: Meta<typeof DualModeOscillator> = {
  title: 'Oscillators/DualModeOscillator',
  component: DualModeOscillator,
  argTypes: {
    paramValues: {
      description: 'Object containing all parameter values keyed by parameter ID (e.g., osc_level, osc_waveform)',
      control: 'object',
      table: { type: { summary: 'Record<string, number>' } },
    },
    onChange: {
      description: 'Callback when any parameter changes',
      action: 'parameterChanged',
      table: { type: { summary: '(paramId: string, value: number) => void' } },
    },
    prefix: {
      description: 'Parameter ID prefix for multiple oscillators (e.g., "osc1", "osc2")',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    label: {
      description: 'Display label for the oscillator section',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
    docs: {
      description: {
        component: `
Dual-mode oscillator supporting both Square/PWM and Sawtooth waveforms. Includes level, octave, pulse width, PWM amount, and fine tune controls.

**Use Cases:**
- Lead Synth - Square wave for punchy leads, saw for bright leads
- Bass - Square wave for sub bass, saw for growl bass
- Pad - Detuned oscillators with PWM for lush pads
- Brass - Saw wave with filter envelope
- FM Source - Basic waveforms as FM carriers/modulators

**Controls:** Waveform selector, Level, Octave (-2 to +2), Pulse Width (square mode), PWM Amount, Fine Tune.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DualModeOscillator>;

// Wrapper component to handle state
function OscillatorWithState(props: { prefix?: string; label?: string }) {
  const [params, setParams] = useState<Record<string, number>>({
    [`${props.prefix || 'osc'}_waveform`]: 0,
    [`${props.prefix || 'osc'}_level`]: 0.7,
    [`${props.prefix || 'osc'}_octave`]: 0.5,
    [`${props.prefix || 'osc'}_pulse_width`]: 0.5,
    [`${props.prefix || 'osc'}_pwm_amount`]: 0,
    [`${props.prefix || 'osc'}_fine_tune`]: 0.5,
  });

  const handleChange = (paramId: string, value: number) => {
    setParams(prev => ({ ...prev, [paramId]: value }));
    console.log(`Parameter changed: ${paramId} = ${value}`);
  };

  return (
    <DualModeOscillator
      paramValues={params}
      onChange={handleChange}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <OscillatorWithState />,
};

export const SquareMode: Story = {
  render: () => {
    const [params, setParams] = useState<Record<string, number>>({
      osc_waveform: 0,  // Square
      osc_level: 0.7,
      osc_octave: 0.5,
      osc_pulse_width: 0.5,
      osc_pwm_amount: 0.3,
      osc_fine_tune: 0.5,
    });
    return (
      <DualModeOscillator
        paramValues={params}
        onChange={(id, v) => setParams(p => ({ ...p, [id]: v }))}
      />
    );
  },
};

export const SawMode: Story = {
  render: () => {
    const [params, setParams] = useState<Record<string, number>>({
      osc_waveform: 1,  // Saw
      osc_level: 0.8,
      osc_octave: 0.5,
      osc_pulse_width: 0.5,
      osc_pwm_amount: 0,
      osc_fine_tune: 0.5,
    });
    return (
      <DualModeOscillator
        paramValues={params}
        onChange={(id, v) => setParams(p => ({ ...p, [id]: v }))}
      />
    );
  },
};

export const Oscillator1: Story = {
  render: () => <OscillatorWithState prefix="osc1" label="OSCILLATOR 1" />,
};

export const Oscillator2: Story = {
  render: () => <OscillatorWithState prefix="osc2" label="OSCILLATOR 2" />,
};

export const DualOscillators: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px' }}>
      <OscillatorWithState prefix="osc1" label="OSC 1" />
      <OscillatorWithState prefix="osc2" label="OSC 2" />
    </div>
  ),
};
