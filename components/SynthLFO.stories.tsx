import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SynthLFO } from './SynthLFO';
import '../styles/tokens.css';

const meta: Meta<typeof SynthLFO> = {
  title: 'Modulation/SynthLFO',
  component: SynthLFO,
  argTypes: {
    label: {
      description: 'Text label displayed above the LFO display',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    waveform: {
      description: 'Waveform type: 0=Triangle, 1=Square, 2=Sine, 3=Sawtooth, 4=Ramp, 5=Stepped S&H, 6=Smooth S&H',
      control: { type: 'range', min: 0, max: 6, step: 1 },
      table: { type: { summary: 'number' } },
    },
    rate: {
      description: 'LFO frequency in Hz',
      control: { type: 'range', min: 0.1, max: 20, step: 0.1 },
      table: { type: { summary: 'number' } },
    },
    minRate: {
      description: 'Minimum rate value for the slider',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    maxRate: {
      description: 'Maximum rate value for the slider',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    onWaveformChange: {
      description: 'Callback when waveform selection changes',
      action: 'waveformChanged',
      table: { type: { summary: '(waveform: number) => void' } },
    },
    onRateChange: {
      description: 'Callback when rate value changes',
      action: 'rateChanged',
      table: { type: { summary: '(rate: number) => void' } },
    },
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1a1a2e' }],
    },
    docs: {
      description: {
        component: `
Low Frequency Oscillator component with visual waveform display and knob-based waveform selection. Includes rate control slider.

**Use Cases:**
- Vibrato - Modulate pitch at 4-8Hz for natural vibrato effect
- Tremolo - Modulate amplitude for rhythmic volume changes
- Filter Sweep - Slow modulation of filter cutoff for movement
- PWM - Modulate pulse width for thickening
- Pan Modulation - Auto-pan effect with triangle or sine waves
- Wobble Bass - Square or triangle LFO on filter for dubstep bass

**Waveforms:** Triangle, Square, Sine, Sawtooth, Ramp, Stepped S&H, Smooth S&H
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthLFO>;

// Interactive LFO wrapper
function LFOWithState(props: Partial<Parameters<typeof SynthLFO>[0]>) {
  const [waveform, setWaveform] = useState(props.waveform ?? props.defaultWaveform ?? 0);
  const [rate, setRate] = useState(props.rate ?? props.defaultRate ?? 2);

  return (
    <SynthLFO
      waveform={waveform}
      rate={rate}
      onWaveformChange={(w) => {
        setWaveform(w);
        console.log(`Waveform: ${['TRI', 'SQR', 'SINE', 'SAW', 'RAMP', 'S&H', 'SMOOTH'][w]}`);
      }}
      onRateChange={(r) => {
        setRate(r);
        console.log(`Rate: ${r.toFixed(2)} Hz`);
      }}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <LFOWithState />,
};

export const Triangle: Story = {
  render: () => <LFOWithState waveform={0} />,
};

export const Square: Story = {
  render: () => <LFOWithState waveform={1} />,
};

export const Sine: Story = {
  render: () => <LFOWithState waveform={2} />,
};

export const Sawtooth: Story = {
  render: () => <LFOWithState waveform={3} />,
};

export const Ramp: Story = {
  render: () => <LFOWithState waveform={4} />,
};

export const SteppedSampleAndHold: Story = {
  render: () => <LFOWithState waveform={5} />,
};

export const SmoothSampleAndHold: Story = {
  render: () => <LFOWithState waveform={6} />,
};

export const SlowRate: Story = {
  render: () => <LFOWithState rate={0.5} />,
};

export const MediumRate: Story = {
  render: () => <LFOWithState rate={4} />,
};

export const FastRate: Story = {
  render: () => <LFOWithState rate={15} />,
};

export const LFO1: Story = {
  render: () => <LFOWithState label="LFO 1" />,
};

export const LFO2: Story = {
  render: () => <LFOWithState label="LFO 2" />,
};

export const Vibrato: Story = {
  render: () => (
    <LFOWithState
      label="VIBRATO"
      waveform={2}
      rate={5}
    />
  ),
};

export const Tremolo: Story = {
  render: () => (
    <LFOWithState
      label="TREMOLO"
      waveform={2}
      rate={8}
    />
  ),
};

export const FilterSweep: Story = {
  render: () => (
    <LFOWithState
      label="FILTER LFO"
      waveform={0}
      rate={0.5}
    />
  ),
};

export const DualLFOs: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <LFOWithState label="LFO 1" waveform={2} rate={2} />
      <LFOWithState label="LFO 2" waveform={0} rate={0.5} />
    </div>
  ),
};

export const CustomRateRange: Story = {
  render: () => (
    <LFOWithState
      label="SLOW LFO"
      minRate={0.01}
      maxRate={2}
      defaultRate={0.1}
    />
  ),
};

export const AudioRateLFO: Story = {
  render: () => (
    <LFOWithState
      label="AUDIO LFO"
      minRate={1}
      maxRate={100}
      defaultRate={20}
    />
  ),
};
