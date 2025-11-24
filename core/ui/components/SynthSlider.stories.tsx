import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SynthSlider } from './SynthSlider';
import '../styles/tokens.css';

const meta: Meta<typeof SynthSlider> = {
  title: 'Controls/SynthSlider',
  component: SynthSlider,
  argTypes: {
    label: {
      description: 'Text label displayed below the slider',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    min: {
      description: 'Minimum value of the slider range',
      control: 'number',
      table: { type: { summary: 'number' } },
    },
    max: {
      description: 'Maximum value of the slider range',
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
    orientation: {
      description: 'Slider orientation: vertical for faders, horizontal for pan controls',
      control: 'select',
      options: ['vertical', 'horizontal'],
      table: { type: { summary: "'vertical' | 'horizontal'" } },
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
Linear fader/slider control supporting both vertical and horizontal orientations.

**Use Cases:**
- Volume Fader - Classic mixer-style volume control
- Pitch Bend - Vertical slider for pitch wheel emulation
- Mod Wheel - Modulation amount control
- Crossfader - Horizontal slider for DJ-style crossfading
- EQ Bands - Multiple sliders for graphic EQ
- Filter Cutoff - Alternative to knob for filter control
- Send Levels - Aux send amount controls
- Pan Position - Horizontal pan control

**Interaction:** Click to jump, drag to adjust, double-click to reset.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthSlider>;

// Interactive slider wrapper
function SliderWithState(props: Partial<Parameters<typeof SynthSlider>[0]>) {
  const [value, setValue] = useState(props.value ?? props.defaultValue ?? 50);

  return (
    <SynthSlider
      label="LEVEL"
      min={0}
      max={100}
      value={value}
      onChange={(v) => {
        setValue(v);
        console.log(`Slider value: ${v}`);
      }}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <SliderWithState />,
};

export const Vertical: Story = {
  render: () => <SliderWithState orientation="vertical" />,
};

export const Horizontal: Story = {
  render: () => <SliderWithState orientation="horizontal" />,
};

export const Volume: Story = {
  render: () => (
    <SliderWithState
      label="VOLUME"
      min={0}
      max={100}
      defaultValue={75}
    />
  ),
};

export const Pitch: Story = {
  render: () => (
    <SliderWithState
      label="PITCH"
      min={-24}
      max={24}
      defaultValue={0}
      step={1}
    />
  ),
};

export const ModWheel: Story = {
  render: () => (
    <SliderWithState
      label="MOD"
      min={0}
      max={127}
      defaultValue={0}
      step={1}
    />
  ),
};

export const AtMinimum: Story = {
  render: () => (
    <SliderWithState
      label="MIN"
      value={0}
    />
  ),
};

export const AtMaximum: Story = {
  render: () => (
    <SliderWithState
      label="MAX"
      value={100}
    />
  ),
};

export const AtCenter: Story = {
  render: () => (
    <SliderWithState
      label="CENTER"
      value={50}
    />
  ),
};

export const MixerChannel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
      <SliderWithState label="CH 1" defaultValue={75} />
      <SliderWithState label="CH 2" defaultValue={60} />
      <SliderWithState label="CH 3" defaultValue={80} />
      <SliderWithState label="CH 4" defaultValue={50} />
      <SliderWithState label="MAIN" defaultValue={85} />
    </div>
  ),
};

export const HorizontalMixer: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SliderWithState label="BASS" orientation="horizontal" defaultValue={70} />
      <SliderWithState label="MID" orientation="horizontal" defaultValue={50} />
      <SliderWithState label="HIGH" orientation="horizontal" defaultValue={60} />
    </div>
  ),
};

export const FineControl: Story = {
  render: () => (
    <SliderWithState
      label="FINE"
      min={-1}
      max={1}
      defaultValue={0}
      step={0.01}
    />
  ),
};

export const CoarseControl: Story = {
  render: () => (
    <SliderWithState
      label="OCTAVE"
      min={-2}
      max={2}
      defaultValue={0}
      step={1}
    />
  ),
};
