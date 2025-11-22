import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SynthKnob } from './SynthKnob';
import '../styles/tokens.css';

const meta: Meta<typeof SynthKnob> = {
  title: 'Controls/SynthKnob',
  component: SynthKnob,
  argTypes: {
    label: {
      description: 'Text label displayed above the knob',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    min: {
      description: 'Minimum value of the knob range',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    max: {
      description: 'Maximum value of the knob range',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    value: {
      description: 'Current value (controlled mode)',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    defaultValue: {
      description: 'Initial value when uncontrolled, also used for double-click reset',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    step: {
      description: 'Step increment for discrete values (e.g., 1 for integers)',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    options: {
      description: 'Array of string labels for stepped values (e.g., waveform names)',
      control: 'object',
      table: { type: { summary: 'string[]' } },
    },
    onChange: {
      description: 'Callback fired when value changes',
      action: 'changed',
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
The fundamental rotary knob control for synthesizer interfaces. 270° rotation range with vertical drag control.

**Use Cases:**
- Filter Cutoff - Primary filter frequency control (20Hz - 20kHz)
- Resonance - Filter resonance/Q control
- Oscillator Level - Mix level for each oscillator
- Tune/Detune - Coarse tuning or fine tune
- Attack/Decay/Release - Envelope time controls
- Pan - Stereo position
- Drive/Saturation - Distortion amount
- LFO Rate/Depth - Modulation controls
- Waveform Selection - Stepped knob with options array

**Interaction:** Drag vertically, double-click to reset, arrow keys for fine adjustment.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthKnob>;

// Interactive knob wrapper
function KnobWithState(props: Partial<Parameters<typeof SynthKnob>[0]>) {
  const [value, setValue] = useState(props.value ?? props.defaultValue ?? 50);

  return (
    <SynthKnob
      label="KNOB"
      min={0}
      max={100}
      value={value}
      onChange={(v) => {
        setValue(v);
        console.log(`Knob value: ${v}`);
      }}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <KnobWithState />,
};

export const Cutoff: Story = {
  render: () => (
    <KnobWithState
      label="CUTOFF"
      min={20}
      max={20000}
      defaultValue={1000}
    />
  ),
};

export const Resonance: Story = {
  render: () => (
    <KnobWithState
      label="RESONANCE"
      min={0}
      max={100}
      defaultValue={25}
    />
  ),
};

export const Volume: Story = {
  render: () => (
    <KnobWithState
      label="VOLUME"
      min={0}
      max={100}
      defaultValue={75}
    />
  ),
};

export const Pan: Story = {
  render: () => (
    <KnobWithState
      label="PAN"
      min={-100}
      max={100}
      defaultValue={0}
    />
  ),
};

export const Fine: Story = {
  render: () => (
    <KnobWithState
      label="FINE"
      min={-1}
      max={1}
      defaultValue={0}
      step={0.01}
    />
  ),
};

export const Coarse: Story = {
  render: () => (
    <KnobWithState
      label="COARSE"
      min={-24}
      max={24}
      defaultValue={0}
      step={1}
    />
  ),
};

export const WithOptions: Story = {
  render: () => (
    <KnobWithState
      label="WAVEFORM"
      min={0}
      max={3}
      defaultValue={0}
      step={1}
      options={['SINE', 'SAW', 'SQR', 'TRI']}
    />
  ),
};

export const Drive: Story = {
  render: () => (
    <KnobWithState
      label="DRIVE"
      min={0}
      max={4}
      defaultValue={0}
      step={1}
      options={['OFF', 'LOW', 'MID', 'HIGH', 'MAX']}
    />
  ),
};

export const MultipleKnobs: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <KnobWithState label="ATTACK" min={0} max={100} defaultValue={10} />
      <KnobWithState label="DECAY" min={0} max={100} defaultValue={30} />
      <KnobWithState label="SUSTAIN" min={0} max={100} defaultValue={70} />
      <KnobWithState label="RELEASE" min={0} max={100} defaultValue={40} />
    </div>
  ),
};

export const FilterSection: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <KnobWithState label="CUTOFF" min={20} max={20000} defaultValue={5000} />
      <KnobWithState label="RESO" min={0} max={100} defaultValue={25} />
      <KnobWithState label="ENV" min={-100} max={100} defaultValue={50} />
      <KnobWithState label="KEY" min={0} max={100} defaultValue={0} />
    </div>
  ),
};

export const AtMinimum: Story = {
  render: () => (
    <KnobWithState
      label="MIN"
      min={0}
      max={100}
      value={0}
    />
  ),
};

export const AtMaximum: Story = {
  render: () => (
    <KnobWithState
      label="MAX"
      min={0}
      max={100}
      value={100}
    />
  ),
};

export const AtCenter: Story = {
  render: () => (
    <KnobWithState
      label="CENTER"
      min={0}
      max={100}
      value={50}
    />
  ),
};
