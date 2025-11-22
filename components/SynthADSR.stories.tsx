import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SynthADSR } from './SynthADSR';
import '../styles/tokens.css';

const meta: Meta<typeof SynthADSR> = {
  title: 'Envelopes/SynthADSR',
  component: SynthADSR,
  argTypes: {
    label: {
      description: 'Text label displayed above the envelope display',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    attack: {
      description: 'Attack time in milliseconds (0-60000ms)',
      control: { type: 'range', min: 0, max: 5000, step: 10 },
      table: { type: { summary: 'number' } },
    },
    decay: {
      description: 'Decay time in milliseconds (0-60000ms)',
      control: { type: 'range', min: 0, max: 5000, step: 10 },
      table: { type: { summary: 'number' } },
    },
    sustain: {
      description: 'Sustain level as percentage (0-100%)',
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { type: { summary: 'number' } },
    },
    release: {
      description: 'Release time in milliseconds (0-60000ms)',
      control: { type: 'range', min: 0, max: 5000, step: 10 },
      table: { type: { summary: 'number' } },
    },
    onAttackChange: {
      description: 'Callback when attack value changes',
      action: 'attackChanged',
      table: { type: { summary: '(value: number) => void' } },
    },
    onDecayChange: {
      description: 'Callback when decay value changes',
      action: 'decayChanged',
      table: { type: { summary: '(value: number) => void' } },
    },
    onSustainChange: {
      description: 'Callback when sustain value changes',
      action: 'sustainChanged',
      table: { type: { summary: '(value: number) => void' } },
    },
    onReleaseChange: {
      description: 'Callback when release value changes',
      action: 'releaseChanged',
      table: { type: { summary: '(value: number) => void' } },
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
Classic 4-stage envelope generator with Attack, Decay, Sustain, and Release controls. Features an interactive SVG visualization where users can click and drag segments to adjust values.

**Use Cases:**
- Amplitude Envelope - Shape the volume contour of a sound from note-on to note-off
- Filter Envelope - Modulate filter cutoff over time for dynamic timbral changes
- Pitch Envelope - Create pitch bends, plucks, or swoops at note start
- Modulation Envelope - Control any parameter that needs time-based shaping

**Common Shapes:**
- Pluck/Percussion: Fast attack, short decay, zero sustain
- Pad/String: Slow attack, high sustain, long release
- Brass/Lead: Medium attack, medium-high sustain
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthADSR>;

// Wrapper component to handle state
function ADSRWithState(props: Partial<Parameters<typeof SynthADSR>[0]>) {
  const [attack, setAttack] = useState(props.attack ?? 100);
  const [decay, setDecay] = useState(props.decay ?? 200);
  const [sustain, setSustain] = useState(props.sustain ?? 70);
  const [release, setRelease] = useState(props.release ?? 300);

  return (
    <SynthADSR
      attack={attack}
      decay={decay}
      sustain={sustain}
      release={release}
      onAttackChange={setAttack}
      onDecayChange={setDecay}
      onSustainChange={setSustain}
      onReleaseChange={setRelease}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <ADSRWithState />,
};

export const FastAttack: Story = {
  render: () => <ADSRWithState attack={10} decay={200} sustain={70} release={300} />,
};

export const SlowAttack: Story = {
  render: () => <ADSRWithState attack={1000} decay={200} sustain={70} release={300} />,
};

export const ShortDecay: Story = {
  render: () => <ADSRWithState attack={100} decay={50} sustain={70} release={300} />,
};

export const LongDecay: Story = {
  render: () => <ADSRWithState attack={100} decay={1000} sustain={70} release={300} />,
};

export const HighSustain: Story = {
  render: () => <ADSRWithState attack={100} decay={200} sustain={95} release={300} />,
};

export const LowSustain: Story = {
  render: () => <ADSRWithState attack={100} decay={200} sustain={20} release={300} />,
};

export const FastRelease: Story = {
  render: () => <ADSRWithState attack={100} decay={200} sustain={70} release={50} />,
};

export const SlowRelease: Story = {
  render: () => <ADSRWithState attack={100} decay={200} sustain={70} release={2000} />,
};

export const PluckySound: Story = {
  render: () => <ADSRWithState attack={5} decay={100} sustain={0} release={200} />,
};

export const PadSound: Story = {
  render: () => <ADSRWithState attack={500} decay={500} sustain={80} release={1000} />,
};

export const CustomLabel: Story = {
  render: () => <ADSRWithState label="FILTER ENV" />,
};

export const WithTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState(0);
    const envSettings = [
      { attack: 10, decay: 100, sustain: 0, release: 200 },
      { attack: 200, decay: 300, sustain: 70, release: 500 },
      { attack: 500, decay: 500, sustain: 90, release: 1000 },
    ];

    return (
      <SynthADSR
        label="ENVELOPE"
        tabs={['PLUCK', 'LEAD', 'PAD']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        {...envSettings[activeTab]}
      />
    );
  },
};
