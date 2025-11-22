import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { SynthLED } from './SynthLED';
import '../styles/tokens.css';

const meta: Meta<typeof SynthLED> = {
  title: 'Display/SynthLED',
  component: SynthLED,
  argTypes: {
    label: {
      description: 'Text label displayed below the LED',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    active: {
      description: 'LED on/off state (true = illuminated)',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    color: {
      description: 'LED color when active',
      control: { type: 'select', options: ['white', 'red', 'green', 'blue'] },
      table: { type: { summary: "'white' | 'red' | 'green' | 'blue'" } },
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
Simple LED indicator light with multiple color options and realistic glow effects.

**Use Cases:**
- Signal Present - Indicate audio signal on a channel
- MIDI Activity - Flash on MIDI input/output
- Clip Warning - Red LED for signal clipping
- Sync Status - Show external sync lock
- Power Indicator - Basic on/off status
- Mode Selection - Show active mode in a group
- Voice Activity - Indicate active polyphony voices

**Colors:** White (general), Red (warnings), Green (status), Blue (MIDI).
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthLED>;

export const Default: Story = {
  render: () => <SynthLED />,
};

export const Active: Story = {
  render: () => <SynthLED active={true} />,
};

export const Inactive: Story = {
  render: () => <SynthLED active={false} />,
};

export const WhiteOn: Story = {
  render: () => <SynthLED label="SIGNAL" active={true} color="white" />,
};

export const WhiteOff: Story = {
  render: () => <SynthLED label="SIGNAL" active={false} color="white" />,
};

export const RedOn: Story = {
  render: () => <SynthLED label="CLIP" active={true} color="red" />,
};

export const RedOff: Story = {
  render: () => <SynthLED label="CLIP" active={false} color="red" />,
};

export const GreenOn: Story = {
  render: () => <SynthLED label="SYNC" active={true} color="green" />,
};

export const GreenOff: Story = {
  render: () => <SynthLED label="SYNC" active={false} color="green" />,
};

export const BlueOn: Story = {
  render: () => <SynthLED label="MIDI" active={true} color="blue" />,
};

export const BlueOff: Story = {
  render: () => <SynthLED label="MIDI" active={false} color="blue" />,
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <SynthLED label="WHITE" active={true} color="white" />
      <SynthLED label="RED" active={true} color="red" />
      <SynthLED label="GREEN" active={true} color="green" />
      <SynthLED label="BLUE" active={true} color="blue" />
    </div>
  ),
};

export const AllColorsOff: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <SynthLED label="WHITE" active={false} color="white" />
      <SynthLED label="RED" active={false} color="red" />
      <SynthLED label="GREEN" active={false} color="green" />
      <SynthLED label="BLUE" active={false} color="blue" />
    </div>
  ),
};

export const StatusIndicators: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <SynthLED label="POWER" active={true} color="green" />
      <SynthLED label="MIDI" active={true} color="blue" />
      <SynthLED label="CLIP" active={false} color="red" />
      <SynthLED label="SYNC" active={true} color="white" />
    </div>
  ),
};

export const OscillatorStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <SynthLED label="OSC 1" active={true} color="green" />
      <SynthLED label="OSC 2" active={true} color="green" />
      <SynthLED label="NOISE" active={false} color="green" />
      <SynthLED label="SUB" active={true} color="green" />
    </div>
  ),
};

// Blinking LED
function BlinkingLED(props: { label?: string; color?: 'white' | 'red' | 'green' | 'blue'; interval?: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((a) => !a);
    }, props.interval ?? 500);
    return () => clearInterval(timer);
  }, [props.interval]);

  return <SynthLED label={props.label ?? 'BLINK'} active={active} color={props.color ?? 'white'} />;
}

export const Blinking: Story = {
  render: () => <BlinkingLED />,
};

export const BlinkingRed: Story = {
  render: () => <BlinkingLED label="REC" color="red" interval={300} />,
};

export const BlinkingGreen: Story = {
  render: () => <BlinkingLED label="SYNC" color="green" interval={1000} />,
};

export const BlinkingBlue: Story = {
  render: () => <BlinkingLED label="MIDI" color="blue" interval={100} />,
};

export const MixedBlinking: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <BlinkingLED label="TEMPO" color="white" interval={500} />
      <BlinkingLED label="REC" color="red" interval={300} />
      <SynthLED label="POWER" active={true} color="green" />
      <BlinkingLED label="MIDI IN" color="blue" interval={150} />
    </div>
  ),
};

// Random activity
function ActivityLED() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(Math.random() > 0.5);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return <SynthLED label="ACTIVITY" active={active} color="green" />;
}

export const RandomActivity: Story = {
  render: () => <ActivityLED />,
};

export const MIDIActivity: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px' }}>
      <ActivityLED />
      <ActivityLED />
    </div>
  ),
};
