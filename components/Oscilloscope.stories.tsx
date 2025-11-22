import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import Oscilloscope from './Oscilloscope';
import '../styles/tokens.css';

const meta: Meta<typeof Oscilloscope> = {
  title: 'Visualization/Oscilloscope',
  component: Oscilloscope,
  argTypes: {
    audioData: {
      description: 'Array of sample values normalized to -1 to +1 range (typically 256-1024 samples)',
      control: 'object',
      table: { type: { summary: 'number[]' } },
    },
    width: {
      description: 'Canvas width in pixels',
      control: { type: 'range', min: 100, max: 600, step: 10 },
      table: { type: { summary: 'number' } },
    },
    height: {
      description: 'Canvas height in pixels',
      control: { type: 'range', min: 50, max: 300, step: 10 },
      table: { type: { summary: 'number' } },
    },
    color: {
      description: 'Waveform line color (CSS color string)',
      control: 'color',
      table: { type: { summary: 'string' } },
    },
    backgroundColor: {
      description: 'Background color of the display',
      control: 'color',
      table: { type: { summary: 'string' } },
    },
    showGrid: {
      description: 'Show reference grid lines',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    showPeaks: {
      description: 'Show peak level indicators',
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
Real-time audio waveform visualization component. Renders sample data as a continuous line with optional grid overlay and peak indicators.

**Use Cases:**
- Waveform Monitoring - Visualize oscillator output, filter response, or final mix
- LFO Visualization - Display low-frequency oscillator shapes
- Input Monitoring - Show incoming audio signal for recording
- Tuner Display - Visualize pitch for tuning purposes
- Educational - Demonstrate waveform concepts (sine, square, saw, etc.)
- Sound Design Feedback - Visual confirmation of synthesis parameters
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Oscilloscope>;

// Generate sine wave data
const generateSineWave = (samples: number, frequency: number, amplitude: number = 1) => {
  return Array.from({ length: samples }, (_, i) =>
    Math.sin((i / samples) * Math.PI * 2 * frequency) * amplitude
  );
};

// Generate square wave data
const generateSquareWave = (samples: number, frequency: number, amplitude: number = 1) => {
  return Array.from({ length: samples }, (_, i) =>
    Math.sin((i / samples) * Math.PI * 2 * frequency) > 0 ? amplitude : -amplitude
  );
};

// Generate sawtooth wave data
const generateSawtoothWave = (samples: number, frequency: number, amplitude: number = 1) => {
  return Array.from({ length: samples }, (_, i) =>
    ((((i / samples) * frequency) % 1) * 2 - 1) * amplitude
  );
};

// Animated oscilloscope wrapper
function AnimatedOscilloscope(props: { waveType?: 'sine' | 'square' | 'sawtooth'; frequency?: number }) {
  const [phase, setPhase] = useState(0);
  const { waveType = 'sine', frequency = 2 } = props;

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => (p + 0.05) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const generateWave = () => {
    const samples = 256;
    switch (waveType) {
      case 'square':
        return generateSquareWave(samples, frequency, 0.8);
      case 'sawtooth':
        return generateSawtoothWave(samples, frequency, 0.8);
      default:
        return Array.from({ length: samples }, (_, i) =>
          Math.sin((i / samples) * Math.PI * 2 * frequency + phase) * 0.8
        );
    }
  };

  return <Oscilloscope audioData={generateWave()} {...props} />;
}

export const Default: Story = {
  render: () => <AnimatedOscilloscope />,
};

export const SineWave: Story = {
  render: () => <AnimatedOscilloscope waveType="sine" frequency={3} />,
};

export const SquareWave: Story = {
  render: () => <AnimatedOscilloscope waveType="square" frequency={2} />,
};

export const SawtoothWave: Story = {
  render: () => <AnimatedOscilloscope waveType="sawtooth" frequency={2} />,
};

export const HighFrequency: Story = {
  render: () => <AnimatedOscilloscope waveType="sine" frequency={8} />,
};

export const LowAmplitude: Story = {
  render: () => <Oscilloscope audioData={generateSineWave(256, 2, 0.3)} />,
};

export const HighAmplitude: Story = {
  render: () => <Oscilloscope audioData={generateSineWave(256, 2, 0.95)} />,
};

export const NoSignal: Story = {
  render: () => <Oscilloscope audioData={[]} />,
};

export const GreenColor: Story = {
  render: () => <AnimatedOscilloscope />,
};

export const CyanColor: Story = {
  render: () => (
    <Oscilloscope
      audioData={generateSineWave(256, 2, 0.7)}
      color="#00FFFF"
    />
  ),
};

export const NoGrid: Story = {
  render: () => (
    <Oscilloscope
      audioData={generateSineWave(256, 3, 0.7)}
      showGrid={false}
    />
  ),
};

export const NoPeaks: Story = {
  render: () => (
    <Oscilloscope
      audioData={generateSineWave(256, 2, 0.8)}
      showPeaks={false}
    />
  ),
};

export const LargeSize: Story = {
  render: () => (
    <Oscilloscope
      audioData={generateSineWave(256, 2, 0.7)}
      width={500}
      height={250}
    />
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Oscilloscope
      audioData={generateSineWave(256, 2, 0.7)}
      width={200}
      height={100}
    />
  ),
};
