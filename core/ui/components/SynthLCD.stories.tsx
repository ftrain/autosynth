import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { SynthLCD } from './SynthLCD';
import '../styles/tokens.css';

const meta: Meta<typeof SynthLCD> = {
  title: 'Display/SynthLCD',
  component: SynthLCD,
  argTypes: {
    text: {
      description: 'Text to display (string for single line, string[] for multi-line)',
      control: 'text',
      table: { type: { summary: 'string | string[]' } },
    },
    lines: {
      description: 'Number of display lines (1 or 2)',
      control: { type: 'select', options: [1, 2] },
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
Retro-style LCD display with classic green-on-dark styling. Supports single or multi-line text.

**Use Cases:**
- Patch Name Display - Show current preset/patch name
- Parameter Readout - Display detailed parameter values
- Bank/Program Selection - Show bank and program numbers
- MIDI Monitor - Display incoming MIDI data
- Status Messages - Show system status and notifications
- Tempo/BPM Display - Show current tempo
- Tuner Display - Show note name and cents offset

**Modes:** Single line for compact display, two lines for header + value.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SynthLCD>;

export const Default: Story = {
  render: () => <SynthLCD />,
};

export const CustomText: Story = {
  render: () => <SynthLCD text="LEAD PATCH 01" />,
};

export const PatchName: Story = {
  render: () => <SynthLCD text="VINTAGE BRASS" />,
};

export const PresetNumber: Story = {
  render: () => <SynthLCD text="PRESET 128" />,
};

export const TwoLines: Story = {
  render: () => (
    <SynthLCD
      text={['STUDIO SYNTH', 'PATCH: INIT']}
      lines={2}
    />
  ),
};

export const TwoLinesPatch: Story = {
  render: () => (
    <SynthLCD
      text={['BANK A', 'ANALOG PAD 03']}
      lines={2}
    />
  ),
};

export const TwoLinesStatus: Story = {
  render: () => (
    <SynthLCD
      text={['BPM: 120', 'PLAYING...']}
      lines={2}
    />
  ),
};

export const TwoLinesFilter: Story = {
  render: () => (
    <SynthLCD
      text={['FILTER', 'CUTOFF: 1250Hz']}
      lines={2}
    />
  ),
};

export const EmptyLine: Story = {
  render: () => (
    <SynthLCD
      text={['READY', '']}
      lines={2}
    />
  ),
};

export const LongText: Story = {
  render: () => (
    <SynthLCD
      text="SUPER LONG PATCH NAME THAT OVERFLOWS"
    />
  ),
};

export const ShortText: Story = {
  render: () => <SynthLCD text="OK" />,
};

export const Numbers: Story = {
  render: () => <SynthLCD text="001 / 128" />,
};

export const MIDIInfo: Story = {
  render: () => (
    <SynthLCD
      text={['MIDI CH: 1', 'NOTE: C4 (60)']}
      lines={2}
    />
  ),
};

// Animated LCD
function AnimatedLCD() {
  const patches = [
    'INIT PATCH',
    'LEAD SYNTH',
    'BRASS STAB',
    'PAD SWEEP',
    'BASS GROWL',
    'VINTAGE KEY',
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % patches.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SynthLCD
      text={[`PATCH ${index + 1}/${patches.length}`, patches[index]]}
      lines={2}
    />
  );
}

export const AnimatedPatchBrowser: Story = {
  render: () => <AnimatedLCD />,
};

// Scrolling text
function ScrollingLCD() {
  const fullText = 'WELCOME TO STUDIO SYNTH - THE ULTIMATE VIRTUAL ANALOG SYNTHESIZER';
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((o) => (o + 1) % fullText.length);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const displayText = (fullText + '   ' + fullText).substring(offset, offset + 16);

  return <SynthLCD text={displayText} />;
}

export const ScrollingText: Story = {
  render: () => <ScrollingLCD />,
};
