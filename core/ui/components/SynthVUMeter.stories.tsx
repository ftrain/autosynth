import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { SynthVUMeter } from './SynthVUMeter';
import '../styles/tokens.css';

const meta: Meta<typeof SynthVUMeter> = {
  title: 'Visualization/SynthVUMeter',
  component: SynthVUMeter,
  argTypes: {
    label: {
      description: 'Text label displayed below the meter',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    level: {
      description: 'Current signal level (0-100)',
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { type: { summary: 'number' } },
    },
    peakHold: {
      description: 'Enable peak hold indicator',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
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
Classic segmented VU meter with peak hold functionality. Color-coded segments show green/yellow/red zones.

**Use Cases:**
- Output Level - Monitor master or channel output levels
- Input Monitoring - Show input signal strength
- Gain Staging - Visual feedback for proper gain structure
- Stereo Metering - Paired L/R meters for stereo monitoring
- Sidechain Monitor - Show compressor sidechain level
- Envelope Follower - Display envelope output level

**Zones:** Green (0-70% safe), Yellow (70-85% hot), Red (85-100% clipping).
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthVUMeter>;

export const Default: Story = {
  render: () => <SynthVUMeter />,
};

export const ZeroLevel: Story = {
  render: () => <SynthVUMeter level={0} />,
};

export const LowLevel: Story = {
  render: () => <SynthVUMeter level={25} />,
};

export const MediumLevel: Story = {
  render: () => <SynthVUMeter level={50} />,
};

export const HighLevel: Story = {
  render: () => <SynthVUMeter level={75} />,
};

export const MaxLevel: Story = {
  render: () => <SynthVUMeter level={100} />,
};

export const YellowZone: Story = {
  render: () => <SynthVUMeter level={78} />,
};

export const RedZone: Story = {
  render: () => <SynthVUMeter level={92} />,
};

export const WithLabel: Story = {
  render: () => <SynthVUMeter label="OUTPUT" level={65} />,
};

export const LeftChannel: Story = {
  render: () => <SynthVUMeter label="L" level={70} />,
};

export const RightChannel: Story = {
  render: () => <SynthVUMeter label="R" level={68} />,
};

export const NoPeakHold: Story = {
  render: () => <SynthVUMeter level={60} peakHold={false} />,
};

export const StereoMeters: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <SynthVUMeter label="L" level={72} />
      <SynthVUMeter label="R" level={68} />
    </div>
  ),
};

export const MultiChannel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <SynthVUMeter label="1" level={60} />
      <SynthVUMeter label="2" level={75} />
      <SynthVUMeter label="3" level={45} />
      <SynthVUMeter label="4" level={82} />
    </div>
  ),
};

export const MixerStrip: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <SynthVUMeter label="CH1" level={55} />
      <SynthVUMeter label="CH2" level={70} />
      <SynthVUMeter label="CH3" level={35} />
      <SynthVUMeter label="CH4" level={80} />
      <SynthVUMeter label="MAIN" level={75} />
    </div>
  ),
};

// Animated VU meter
function AnimatedVUMeter(props: { label?: string; baseLevel?: number; variance?: number }) {
  const [level, setLevel] = useState(props.baseLevel ?? 50);

  useEffect(() => {
    const interval = setInterval(() => {
      const variance = props.variance ?? 20;
      const base = props.baseLevel ?? 50;
      const newLevel = base + (Math.random() - 0.5) * variance * 2;
      setLevel(Math.max(0, Math.min(100, newLevel)));
    }, 100);
    return () => clearInterval(interval);
  }, [props.baseLevel, props.variance]);

  return <SynthVUMeter label={props.label ?? 'LEVEL'} level={level} />;
}

export const Animated: Story = {
  render: () => <AnimatedVUMeter />,
};

export const AnimatedLow: Story = {
  render: () => <AnimatedVUMeter label="LOW" baseLevel={30} variance={15} />,
};

export const AnimatedMedium: Story = {
  render: () => <AnimatedVUMeter label="MED" baseLevel={55} variance={20} />,
};

export const AnimatedHigh: Story = {
  render: () => <AnimatedVUMeter label="HIGH" baseLevel={80} variance={15} />,
};

export const AnimatedStereo: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <AnimatedVUMeter label="L" baseLevel={65} variance={25} />
      <AnimatedVUMeter label="R" baseLevel={62} variance={25} />
    </div>
  ),
};

export const AnimatedMixer: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <AnimatedVUMeter label="1" baseLevel={50} variance={20} />
      <AnimatedVUMeter label="2" baseLevel={65} variance={25} />
      <AnimatedVUMeter label="3" baseLevel={40} variance={15} />
      <AnimatedVUMeter label="4" baseLevel={75} variance={20} />
      <AnimatedVUMeter label="OUT" baseLevel={70} variance={15} />
    </div>
  ),
};

// Pulsing meter (for beat sync visualization)
function PulsingVUMeter(props: { label?: string; bpm?: number }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const bpm = props.bpm ?? 120;
    const beatInterval = 60000 / bpm;

    const pulse = () => {
      setLevel(95);
      setTimeout(() => setLevel(40), 50);
      setTimeout(() => setLevel(20), 100);
      setTimeout(() => setLevel(10), 150);
    };

    pulse();
    const interval = setInterval(pulse, beatInterval);
    return () => clearInterval(interval);
  }, [props.bpm]);

  return <SynthVUMeter label={props.label ?? 'BEAT'} level={level} />;
}

export const BeatSync120BPM: Story = {
  render: () => <PulsingVUMeter bpm={120} />,
};

export const BeatSync140BPM: Story = {
  render: () => <PulsingVUMeter label="FAST" bpm={140} />,
};

export const BeatSync90BPM: Story = {
  render: () => <PulsingVUMeter label="SLOW" bpm={90} />,
};
