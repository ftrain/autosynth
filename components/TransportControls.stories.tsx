import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TransportControls } from './TransportControls';
import '../styles/tokens.css';

const meta: Meta<typeof TransportControls> = {
  title: 'Sequencing/TransportControls',
  component: TransportControls,
  argTypes: {
    isPlaying: {
      description: 'Current playback state (true = playing, false = stopped/paused)',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    isRecording: {
      description: 'Current recording state (true = recording)',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    onPlay: {
      description: 'Callback when play button is pressed',
      action: 'play',
      table: { type: { summary: '() => void' } },
    },
    onPause: {
      description: 'Callback when pause button is pressed',
      action: 'pause',
      table: { type: { summary: '() => void' } },
    },
    onStop: {
      description: 'Callback when stop button is pressed',
      action: 'stop',
      table: { type: { summary: '() => void' } },
    },
    onRecord: {
      description: 'Callback when record button is toggled',
      action: 'record',
      table: { type: { summary: '(isRecording: boolean) => void' } },
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
Standard transport control bar with Play/Pause, Stop, and Record buttons.

**Use Cases:**
- Sequencer Control - Play/stop step sequencer playback
- Audio Recording - Start/stop audio capture
- Pattern Playback - Control pattern or loop playback
- Live Performance - Quick access to playback controls
- DAW Integration - Sync with external DAW transport

**Features:** Play/Pause toggle, Record arms and starts playback, Stop resets all states.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TransportControls>;

// Interactive transport wrapper
function TransportWithState() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <TransportControls
      isPlaying={isPlaying}
      isRecording={isRecording}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onStop={() => {
        setIsPlaying(false);
        setIsRecording(false);
      }}
      onRecord={(recording) => {
        setIsRecording(recording);
        if (recording) setIsPlaying(true);
      }}
    />
  );
}

export const Default: Story = {
  render: () => <TransportWithState />,
};

export const Stopped: Story = {
  render: () => (
    <TransportControls
      isPlaying={false}
      isRecording={false}
    />
  ),
};

export const Playing: Story = {
  render: () => (
    <TransportControls
      isPlaying={true}
      isRecording={false}
    />
  ),
};

export const Recording: Story = {
  render: () => (
    <TransportControls
      isPlaying={true}
      isRecording={true}
    />
  ),
};

export const Interactive: Story = {
  render: () => <TransportWithState />,
};
