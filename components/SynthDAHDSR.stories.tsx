import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SynthDAHDSR } from './SynthDAHDSR';
import '../styles/tokens.css';

const meta: Meta<typeof SynthDAHDSR> = {
  title: 'Envelopes/SynthDAHDSR',
  component: SynthDAHDSR,
  argTypes: {
    label: {
      description: 'Text label displayed above the envelope display',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    delay: {
      description: 'Delay time in milliseconds before envelope starts (0-60000ms)',
      control: { type: 'range', min: 0, max: 2000, step: 10 },
      table: { type: { summary: 'number' } },
    },
    attack: {
      description: 'Attack time in milliseconds (0-60000ms)',
      control: { type: 'range', min: 0, max: 5000, step: 10 },
      table: { type: { summary: 'number' } },
    },
    hold: {
      description: 'Hold time at peak level in milliseconds (0-60000ms)',
      control: { type: 'range', min: 0, max: 2000, step: 10 },
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
Extended 6-stage envelope generator with Delay, Attack, Hold, Decay, Sustain, and Release. Provides more sophisticated envelope shaping than standard ADSR.

**Use Cases:**
- Delayed Pad Swells - Use delay stage for layered entry effects
- Brass Instruments - Hold stage maintains peak before decay for realistic brass attacks
- Gated Effects - Precise hold time for rhythmic gating effects
- Sound Design - Complex envelope shapes for evolving textures
- Percussive Sounds - Short hold creates punchy transients before decay
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthDAHDSR>;

// Interactive DAHDSR wrapper
function DAHDSRWithState(props: Partial<Parameters<typeof SynthDAHDSR>[0]>) {
  const [delay, setDelay] = useState(props.delay ?? 50);
  const [attack, setAttack] = useState(props.attack ?? 100);
  const [hold, setHold] = useState(props.hold ?? 100);
  const [decay, setDecay] = useState(props.decay ?? 200);
  const [sustain, setSustain] = useState(props.sustain ?? 70);
  const [release, setRelease] = useState(props.release ?? 300);

  return (
    <SynthDAHDSR
      delay={delay}
      attack={attack}
      hold={hold}
      decay={decay}
      sustain={sustain}
      release={release}
      onDelayChange={setDelay}
      onAttackChange={setAttack}
      onHoldChange={setHold}
      onDecayChange={setDecay}
      onSustainChange={setSustain}
      onReleaseChange={setRelease}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <DAHDSRWithState />,
};

export const NoDelay: Story = {
  render: () => <DAHDSRWithState delay={0} />,
};

export const LongDelay: Story = {
  render: () => <DAHDSRWithState delay={500} />,
};

export const FastAttack: Story = {
  render: () => <DAHDSRWithState attack={10} />,
};

export const SlowAttack: Story = {
  render: () => <DAHDSRWithState attack={1000} />,
};

export const NoHold: Story = {
  render: () => <DAHDSRWithState hold={0} />,
};

export const LongHold: Story = {
  render: () => <DAHDSRWithState hold={500} />,
};

export const ShortDecay: Story = {
  render: () => <DAHDSRWithState decay={50} />,
};

export const LongDecay: Story = {
  render: () => <DAHDSRWithState decay={1000} />,
};

export const HighSustain: Story = {
  render: () => <DAHDSRWithState sustain={95} />,
};

export const LowSustain: Story = {
  render: () => <DAHDSRWithState sustain={20} />,
};

export const ZeroSustain: Story = {
  render: () => <DAHDSRWithState sustain={0} />,
};

export const FastRelease: Story = {
  render: () => <DAHDSRWithState release={50} />,
};

export const SlowRelease: Story = {
  render: () => <DAHDSRWithState release={2000} />,
};

export const PluckSound: Story = {
  render: () => (
    <DAHDSRWithState
      label="PLUCK ENV"
      delay={0}
      attack={5}
      hold={0}
      decay={100}
      sustain={0}
      release={200}
    />
  ),
};

export const PadSound: Story = {
  render: () => (
    <DAHDSRWithState
      label="PAD ENV"
      delay={100}
      attack={500}
      hold={200}
      decay={500}
      sustain={80}
      release={1000}
    />
  ),
};

export const BrassSound: Story = {
  render: () => (
    <DAHDSRWithState
      label="BRASS ENV"
      delay={0}
      attack={100}
      hold={50}
      decay={200}
      sustain={75}
      release={300}
    />
  ),
};

export const GatedEffect: Story = {
  render: () => (
    <DAHDSRWithState
      label="GATE ENV"
      delay={0}
      attack={0}
      hold={300}
      decay={0}
      sustain={100}
      release={10}
    />
  ),
};

export const DelayedAttack: Story = {
  render: () => (
    <DAHDSRWithState
      label="DELAYED"
      delay={200}
      attack={300}
      hold={100}
      decay={200}
      sustain={70}
      release={400}
    />
  ),
};

export const CustomLabel: Story = {
  render: () => <DAHDSRWithState label="FILTER ENVELOPE" />,
};

export const AmpEnvelope: Story = {
  render: () => <DAHDSRWithState label="AMP ENVELOPE" />,
};
