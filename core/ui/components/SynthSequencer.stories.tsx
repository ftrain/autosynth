import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { SynthSequencer } from './SynthSequencer';
import '../styles/tokens.css';

const meta: Meta<typeof SynthSequencer> = {
  title: 'Sequencing/SynthSequencer',
  component: SynthSequencer,
  argTypes: {
    steps: {
      description: 'Number of steps in the sequencer (8 or 16)',
      control: { type: 'select', options: [8, 16] },
      table: { type: { summary: 'number' } },
    },
    pitchValues: {
      description: 'Array of MIDI note values (0-127) for each step',
      control: 'object',
      table: { type: { summary: 'number[]' } },
    },
    gateValues: {
      description: 'Array of boolean gate states for each step',
      control: 'object',
      table: { type: { summary: 'boolean[]' } },
    },
    currentStep: {
      description: 'Currently playing step index (-1 for stopped)',
      control: { type: 'range', min: -1, max: 15, step: 1 },
      table: { type: { summary: 'number' } },
    },
    onPitchChange: {
      description: 'Callback when a step pitch changes',
      action: 'pitchChanged',
      table: { type: { summary: '(step: number, pitch: number) => void' } },
    },
    onGateChange: {
      description: 'Callback when a step gate toggles',
      action: 'gateChanged',
      table: { type: { summary: '(step: number, gate: boolean) => void' } },
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
Step sequencer with per-step pitch and gate controls. Visual feedback shows the currently playing step.

**Use Cases:**
- Melodic Sequences - Program bass lines, arpeggios, or melodies
- Drum Patterns - Gate patterns for triggering drum sounds
- Modulation Sequencer - Step-based modulation source
- Euclidean Rhythms - Create complex rhythmic patterns
- Generative Music - Random or algorithmic pattern generation
- Live Performance - Real-time pattern tweaking

**Features:** Click pitch bars to set note, toggle gates for rhythm, 8 or 16 step modes.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthSequencer>;

// Interactive sequencer wrapper
function SequencerWithState(props: Partial<Parameters<typeof SynthSequencer>[0]>) {
  const [pitchValues, setPitchValues] = useState(
    props.pitchValues ?? [60, 62, 64, 65, 67, 69, 71, 72, 72, 71, 69, 67, 65, 64, 62, 60]
  );
  const [gateValues, setGateValues] = useState(
    props.gateValues ?? Array(16).fill(true)
  );

  const handlePitchChange = (index: number, value: number) => {
    const newPitches = [...pitchValues];
    newPitches[index] = value;
    setPitchValues(newPitches);
  };

  const handleGateChange = (index: number, value: boolean) => {
    const newGates = [...gateValues];
    newGates[index] = value;
    setGateValues(newGates);
  };

  return (
    <SynthSequencer
      pitchValues={pitchValues}
      gateValues={gateValues}
      onPitchChange={handlePitchChange}
      onGateChange={handleGateChange}
      {...props}
    />
  );
}

// Playing sequencer
function PlayingSequencer(props: Partial<Parameters<typeof SynthSequencer>[0]>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [pitchValues, setPitchValues] = useState(
    props.pitchValues ?? [60, 62, 64, 65, 67, 69, 71, 72, 72, 71, 69, 67, 65, 64, 62, 60]
  );
  const [gateValues, setGateValues] = useState(
    props.gateValues ?? Array(16).fill(true)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(s => (s + 1) % 16);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <SynthSequencer
      pitchValues={pitchValues}
      gateValues={gateValues}
      currentStep={currentStep}
      onPitchChange={(i, v) => {
        const newPitches = [...pitchValues];
        newPitches[i] = v;
        setPitchValues(newPitches);
      }}
      onGateChange={(i, v) => {
        const newGates = [...gateValues];
        newGates[i] = v;
        setGateValues(newGates);
      }}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <SequencerWithState />,
};

export const Playing: Story = {
  render: () => <PlayingSequencer />,
};

export const AscendingScale: Story = {
  render: () => (
    <SequencerWithState
      pitchValues={[48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74]}
    />
  ),
};

export const DescendingScale: Story = {
  render: () => (
    <SequencerWithState
      pitchValues={[72, 71, 69, 67, 65, 64, 62, 60, 59, 57, 55, 53, 52, 50, 48, 48]}
    />
  ),
};

export const Arpeggio: Story = {
  render: () => (
    <SequencerWithState
      pitchValues={[48, 52, 55, 60, 48, 52, 55, 60, 48, 52, 55, 60, 48, 52, 55, 60]}
    />
  ),
};

export const WithGaps: Story = {
  render: () => (
    <SequencerWithState
      pitchValues={[60, 62, 64, 65, 67, 69, 71, 72, 72, 71, 69, 67, 65, 64, 62, 60]}
      gateValues={[true, true, false, true, true, false, false, true, true, true, false, true, true, false, false, true]}
    />
  ),
};

export const EightSteps: Story = {
  render: () => (
    <SequencerWithState
      steps={8}
      pitchValues={[60, 64, 67, 72, 67, 64, 60, 55]}
      gateValues={Array(8).fill(true)}
    />
  ),
};

export const AllGatesOff: Story = {
  render: () => (
    <SequencerWithState
      gateValues={Array(16).fill(false)}
    />
  ),
};

export const HighOctave: Story = {
  render: () => (
    <SequencerWithState
      pitchValues={[72, 74, 76, 77, 79, 81, 83, 84, 84, 83, 81, 79, 77, 76, 74, 72]}
    />
  ),
};

export const LowOctave: Story = {
  render: () => (
    <SequencerWithState
      pitchValues={[36, 38, 40, 41, 43, 45, 47, 48, 48, 47, 45, 43, 41, 40, 38, 36]}
    />
  ),
};

export const RandomPattern: Story = {
  render: () => {
    const randomPitches = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 24) + 48
    );
    const randomGates = Array.from({ length: 16 }, () => Math.random() > 0.3);
    return (
      <SequencerWithState
        pitchValues={randomPitches}
        gateValues={randomGates}
      />
    );
  },
};
