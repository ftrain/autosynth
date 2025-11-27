import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SynthRow } from './SynthRow';
import { SynthKnob } from './SynthKnob';
import { SynthSlider } from './SynthSlider';
import { SynthLED } from './SynthLED';
import { SynthADSR } from './SynthADSR';
import { SynthVUMeter } from './SynthVUMeter';
import '../styles/tokens.css';

const meta: Meta<typeof SynthRow> = {
  title: 'Layout/SynthRow',
  component: SynthRow,
  argTypes: {
    label: {
      description: 'Optional label displayed above the row',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    gap: {
      description: 'Gap between child elements (CSS value)',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    justify: {
      description: 'Horizontal alignment of children',
      control: { type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] },
      table: { type: { summary: 'string' } },
    },
    align: {
      description: 'Vertical alignment of children',
      control: { type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch'] },
      table: { type: { summary: 'string' } },
    },
    wrap: {
      description: 'Allow children to wrap to next line',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    showPanel: {
      description: 'Show panel background behind the row',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    showDivider: {
      description: 'Show divider line below the row',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    children: {
      description: 'Child components to arrange horizontally',
      control: false,
      table: { type: { summary: 'ReactNode' } },
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
SynthRow is a flexible horizontal layout component for arranging synthesizer controls in organized rows.

**Use Cases:**
- Oscillator Section - Group oscillator controls (waveform, tune, level) horizontally
- Filter Bank - Arrange filter knobs (cutoff, resonance, env amount) in a row
- Envelope Controls - Place ADSR knobs or envelope display with related controls
- Mixer Channel - Combine fader, pan, mute, solo controls in a channel strip
- Effect Parameters - Group delay time, feedback, mix knobs together
- Modulation Section - Arrange LFO with destination controls
- Master Section - Combine volume, pan, and output meters
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthRow>;

// Interactive knob wrapper
function KnobWithState(props: { label: string; min?: number; max?: number; defaultValue?: number }) {
  const [value, setValue] = useState(props.defaultValue ?? 50);
  return (
    <SynthKnob
      label={props.label}
      min={props.min ?? 0}
      max={props.max ?? 100}
      value={value}
      onChange={setValue}
    />
  );
}

export const Default: Story = {
  render: () => (
    <SynthRow>
      <KnobWithState label="KNOB 1" />
      <KnobWithState label="KNOB 2" />
      <KnobWithState label="KNOB 3" />
    </SynthRow>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <SynthRow label="OSCILLATOR 1">
      <KnobWithState label="WAVE" />
      <KnobWithState label="TUNE" min={-24} max={24} defaultValue={0} />
      <KnobWithState label="FINE" min={-100} max={100} defaultValue={0} />
      <KnobWithState label="LEVEL" defaultValue={75} />
    </SynthRow>
  ),
};

export const FilterSection: Story = {
  render: () => (
    <SynthRow label="FILTER">
      <KnobWithState label="CUTOFF" min={20} max={20000} defaultValue={5000} />
      <KnobWithState label="RESO" defaultValue={25} />
      <KnobWithState label="ENV" min={-100} max={100} defaultValue={50} />
      <KnobWithState label="KEY" defaultValue={0} />
    </SynthRow>
  ),
};

export const WithPanel: Story = {
  render: () => (
    <SynthRow label="AMPLIFIER" showPanel>
      <KnobWithState label="ATTACK" />
      <KnobWithState label="DECAY" />
      <KnobWithState label="SUSTAIN" />
      <KnobWithState label="RELEASE" />
      <KnobWithState label="LEVEL" defaultValue={75} />
    </SynthRow>
  ),
};

export const WithDivider: Story = {
  render: () => (
    <div>
      <SynthRow label="SECTION 1" showDivider>
        <KnobWithState label="PARAM A" />
        <KnobWithState label="PARAM B" />
      </SynthRow>
      <SynthRow label="SECTION 2">
        <KnobWithState label="PARAM C" />
        <KnobWithState label="PARAM D" />
      </SynthRow>
    </div>
  ),
};

export const MixedControls: Story = {
  render: () => {
    const [sliderValue, setSliderValue] = useState(75);
    return (
      <SynthRow label="MIXER CHANNEL">
        <SynthSlider label="LEVEL" value={sliderValue} onChange={setSliderValue} />
        <KnobWithState label="PAN" min={-100} max={100} defaultValue={0} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SynthLED label="MUTE" active={false} color="red" />
          <SynthLED label="SOLO" active={false} color="green" />
        </div>
        <SynthVUMeter label="OUT" level={65} />
      </SynthRow>
    );
  },
};

export const CenteredContent: Story = {
  render: () => (
    <SynthRow label="CENTERED" justify="center">
      <KnobWithState label="LEFT" />
      <KnobWithState label="CENTER" />
      <KnobWithState label="RIGHT" />
    </SynthRow>
  ),
};

export const SpaceBetween: Story = {
  render: () => (
    <SynthRow label="SPACED OUT" justify="space-between" style={{ width: '600px' }}>
      <KnobWithState label="START" />
      <KnobWithState label="MIDDLE" />
      <KnobWithState label="END" />
    </SynthRow>
  ),
};

export const WrapEnabled: Story = {
  render: () => (
    <SynthRow label="WRAPPING ROW" wrap style={{ width: '300px' }}>
      <KnobWithState label="K1" />
      <KnobWithState label="K2" />
      <KnobWithState label="K3" />
      <KnobWithState label="K4" />
      <KnobWithState label="K5" />
      <KnobWithState label="K6" />
    </SynthRow>
  ),
};

export const CompactGap: Story = {
  render: () => (
    <SynthRow label="COMPACT" gap="var(--synth-space-sm)">
      <KnobWithState label="A" />
      <KnobWithState label="B" />
      <KnobWithState label="C" />
      <KnobWithState label="D" />
    </SynthRow>
  ),
};

export const WideGap: Story = {
  render: () => (
    <SynthRow label="WIDE SPACING" gap="var(--synth-space-2xl)">
      <KnobWithState label="ONE" />
      <KnobWithState label="TWO" />
      <KnobWithState label="THREE" />
    </SynthRow>
  ),
};

export const WithEnvelope: Story = {
  render: () => {
    const [attack, setAttack] = useState(100);
    const [decay, setDecay] = useState(200);
    const [sustain, setSustain] = useState(70);
    const [release, setRelease] = useState(300);

    return (
      <SynthRow label="ENVELOPE SECTION">
        <SynthADSR
          attack={attack}
          decay={decay}
          sustain={sustain}
          release={release}
          onAttackChange={setAttack}
          onDecayChange={setDecay}
          onSustainChange={setSustain}
          onReleaseChange={setRelease}
        />
        <KnobWithState label="AMOUNT" defaultValue={50} />
        <KnobWithState label="VELOCITY" defaultValue={100} />
      </SynthRow>
    );
  },
};
