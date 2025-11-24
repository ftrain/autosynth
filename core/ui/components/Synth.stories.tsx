import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { Synth } from './Synth';
import { SynthRow } from './SynthRow';
import { SynthKnob } from './SynthKnob';
import { SynthSlider } from './SynthSlider';
import { SynthADSR } from './SynthADSR';
import { SynthLFO } from './SynthLFO';
import { SynthLCD } from './SynthLCD';
import { SynthLED } from './SynthLED';
import { SynthVUMeter } from './SynthVUMeter';
import { SynthSequencer } from './SynthSequencer';
import { TransportControls } from './TransportControls';
import Oscilloscope from './Oscilloscope';
import '../styles/tokens.css';

const meta: Meta<typeof Synth> = {
  title: 'Layout/Synth',
  component: Synth,
  argTypes: {
    title: {
      description: 'Main title displayed in the synth header',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    subtitle: {
      description: 'Subtitle or model name displayed below the title',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    gap: {
      description: 'Gap between child rows (CSS value)',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    padding: {
      description: 'Internal padding (CSS value)',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    width: {
      description: 'Container width (CSS value or "auto")',
      control: 'text',
      table: { type: { summary: 'string' } },
    },
    showBorder: {
      description: 'Show decorative border around the synth',
      control: 'boolean',
      table: { type: { summary: 'boolean' } },
    },
    variant: {
      description: 'Visual style variant',
      control: { type: 'select', options: ['default', 'dark', 'panel'] },
      table: { type: { summary: "'default' | 'dark' | 'panel'" } },
    },
    children: {
      description: 'Child components (typically SynthRow elements)',
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
The Synth component is the top-level container for building complete synthesizer interfaces.
It provides a vertically stacked layout with consistent styling and serves as the main wrapper for SynthRow components.

**Use Cases:**
- Complete Synthesizer UI - Wrap multiple SynthRow components to create a full synth interface
- Effect Rack - Stack effect modules vertically for a rack-style layout
- Modular System - Container for modular synth patches with multiple sections
- Control Surface - DAW control surface with multiple rows of controls
- Sound Design Panel - Complex sound design interfaces with organized sections
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Synth>;

// Helper for interactive knobs
function KnobWithState(props: { label: string; min?: number; max?: number; defaultValue?: number; step?: number; options?: string[] }) {
  const [value, setValue] = useState(props.defaultValue ?? 50);
  return (
    <SynthKnob
      label={props.label}
      min={props.min ?? 0}
      max={props.max ?? 100}
      value={value}
      onChange={setValue}
      step={props.step}
      options={props.options}
    />
  );
}

export const Default: Story = {
  render: () => (
    <Synth title="STUDIO SYNTH">
      <SynthRow label="OSCILLATOR">
        <KnobWithState label="WAVE" min={0} max={3} step={1} options={['SIN', 'SAW', 'SQR', 'TRI']} />
        <KnobWithState label="TUNE" min={-24} max={24} defaultValue={0} step={1} />
        <KnobWithState label="LEVEL" defaultValue={75} />
      </SynthRow>
      <SynthRow label="FILTER">
        <KnobWithState label="CUTOFF" />
        <KnobWithState label="RESO" defaultValue={25} />
      </SynthRow>
    </Synth>
  ),
};

export const WithTitleAndSubtitle: Story = {
  render: () => (
    <Synth title="LEAD SYNTH" subtitle="Analog Modeling v2.0">
      <SynthRow label="OSCILLATORS">
        <KnobWithState label="OSC 1" />
        <KnobWithState label="OSC 2" />
        <KnobWithState label="MIX" defaultValue={50} />
      </SynthRow>
    </Synth>
  ),
};

export const DarkVariant: Story = {
  render: () => (
    <Synth title="DARK SYNTH" variant="dark">
      <SynthRow label="CONTROLS">
        <KnobWithState label="A" />
        <KnobWithState label="B" />
        <KnobWithState label="C" />
      </SynthRow>
    </Synth>
  ),
};

export const PanelVariant: Story = {
  render: () => (
    <Synth title="PANEL SYNTH" variant="panel">
      <SynthRow label="CONTROLS">
        <KnobWithState label="X" />
        <KnobWithState label="Y" />
        <KnobWithState label="Z" />
      </SynthRow>
    </Synth>
  ),
};

export const NoBorder: Story = {
  render: () => (
    <Synth title="MINIMAL" showBorder={false}>
      <SynthRow>
        <KnobWithState label="ONE" />
        <KnobWithState label="TWO" />
      </SynthRow>
    </Synth>
  ),
};

export const CompleteSynth: Story = {
  render: () => {
    const [attack, setAttack] = useState(50);
    const [decay, setDecay] = useState(200);
    const [sustain, setSustain] = useState(70);
    const [release, setRelease] = useState(300);
    const [lfoWave, setLfoWave] = useState(2);
    const [lfoRate, setLfoRate] = useState(4);

    // Animated oscilloscope
    const [phase, setPhase] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => setPhase(p => (p + 0.1) % (Math.PI * 2)), 50);
      return () => clearInterval(interval);
    }, []);
    const audioData = Array.from({ length: 256 }, (_, i) =>
      Math.sin((i / 256) * Math.PI * 4 + phase) * 0.7
    );

    return (
      <Synth title="STUDIO LEAD" subtitle="Virtual Analog Synthesizer">
        {/* Status Row */}
        <SynthRow justify="space-between" padding="var(--synth-space-sm)">
          <div style={{ display: 'flex', gap: '16px' }}>
            <SynthLED label="POWER" active={true} color="green" />
            <SynthLED label="MIDI" active={true} color="blue" />
          </div>
          <SynthLCD text="INIT PATCH" />
          <div style={{ display: 'flex', gap: '16px' }}>
            <SynthLED label="CLIP" active={false} color="red" />
            <SynthLED label="SYNC" active={true} color="white" />
          </div>
        </SynthRow>

        {/* Oscillators */}
        <SynthRow label="OSCILLATORS" showDivider>
          <KnobWithState label="OSC1 WAVE" min={0} max={3} step={1} options={['SIN', 'SAW', 'SQR', 'TRI']} />
          <KnobWithState label="OSC1 TUNE" min={-24} max={24} defaultValue={0} step={1} />
          <KnobWithState label="OSC1 LEVEL" defaultValue={80} />
          <div style={{ width: '24px' }} />
          <KnobWithState label="OSC2 WAVE" min={0} max={3} step={1} options={['SIN', 'SAW', 'SQR', 'TRI']} defaultValue={1} />
          <KnobWithState label="OSC2 TUNE" min={-24} max={24} defaultValue={0} step={1} />
          <KnobWithState label="OSC2 LEVEL" defaultValue={60} />
          <div style={{ width: '24px' }} />
          <Oscilloscope audioData={audioData} width={150} height={80} />
        </SynthRow>

        {/* Filter & Envelope */}
        <SynthRow label="FILTER" showDivider>
          <KnobWithState label="CUTOFF" min={20} max={20000} defaultValue={5000} />
          <KnobWithState label="RESO" defaultValue={25} />
          <KnobWithState label="ENV AMT" min={-100} max={100} defaultValue={50} />
          <KnobWithState label="KEY TRK" defaultValue={50} />
          <SynthADSR
            label="FILTER ENV"
            attack={attack}
            decay={decay}
            sustain={sustain}
            release={release}
            onAttackChange={setAttack}
            onDecayChange={setDecay}
            onSustainChange={setSustain}
            onReleaseChange={setRelease}
          />
        </SynthRow>

        {/* Modulation */}
        <SynthRow label="MODULATION" showDivider>
          <SynthLFO
            label="LFO 1"
            waveform={lfoWave}
            rate={lfoRate}
            onWaveformChange={setLfoWave}
            onRateChange={setLfoRate}
          />
          <KnobWithState label="LFO DEST" min={0} max={3} step={1} options={['OFF', 'PITCH', 'FILTER', 'AMP']} />
          <KnobWithState label="LFO AMT" defaultValue={30} />
        </SynthRow>

        {/* Output */}
        <SynthRow label="OUTPUT">
          <KnobWithState label="VOLUME" defaultValue={75} />
          <KnobWithState label="PAN" min={-100} max={100} defaultValue={0} />
          <SynthVUMeter label="L" level={65} />
          <SynthVUMeter label="R" level={62} />
          <div style={{ width: '24px' }} />
          <TransportControls />
        </SynthRow>
      </Synth>
    );
  },
};

export const SequencerSynth: Story = {
  render: () => {
    const [pitches, setPitches] = useState([60, 62, 64, 65, 67, 69, 71, 72, 72, 71, 69, 67, 65, 64, 62, 60]);
    const [gates, setGates] = useState(Array(16).fill(true).map((_, i) => i % 2 === 0 || i % 3 === 0));
    const [currentStep, setCurrentStep] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
      if (!isPlaying) return;
      const interval = setInterval(() => {
        setCurrentStep(s => (s + 1) % 16);
      }, 150);
      return () => clearInterval(interval);
    }, [isPlaying]);

    return (
      <Synth title="SEQ SYNTH" subtitle="Step Sequencer">
        <SynthRow label="SEQUENCE">
          <SynthSequencer
            pitchValues={pitches}
            gateValues={gates}
            currentStep={currentStep}
            onPitchChange={(i, v) => {
              const newPitches = [...pitches];
              newPitches[i] = v;
              setPitches(newPitches);
            }}
            onGateChange={(i, v) => {
              const newGates = [...gates];
              newGates[i] = v;
              setGates(newGates);
            }}
          />
        </SynthRow>

        <SynthRow label="CONTROLS">
          <KnobWithState label="TEMPO" min={40} max={200} defaultValue={120} step={1} />
          <KnobWithState label="GATE LEN" defaultValue={50} />
          <KnobWithState label="SWING" defaultValue={0} />
          <TransportControls
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onStop={() => {
              setIsPlaying(false);
              setCurrentStep(-1);
            }}
          />
        </SynthRow>
      </Synth>
    );
  },
};

export const MixerStrip: Story = {
  render: () => {
    const channels = ['KICK', 'SNARE', 'HATS', 'BASS', 'LEAD', 'PAD'];

    return (
      <Synth title="MIXER" subtitle="6-Channel">
        <SynthRow gap="var(--synth-space-lg)">
          {channels.map((name, i) => {
            const [level, setLevel] = useState(70 + Math.random() * 20);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <SynthVUMeter label="" level={level * 0.9} />
                <SynthSlider label={name} value={level} onChange={setLevel} />
                <KnobWithState label="PAN" min={-100} max={100} defaultValue={0} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <SynthLED label="M" active={false} color="red" />
                  <SynthLED label="S" active={false} color="green" />
                </div>
              </div>
            );
          })}
        </SynthRow>
      </Synth>
    );
  },
};

export const EffectRack: Story = {
  render: () => (
    <Synth title="FX RACK" subtitle="Effect Processor">
      <SynthRow label="DELAY" showPanel showDivider>
        <KnobWithState label="TIME" defaultValue={40} />
        <KnobWithState label="FEEDBACK" defaultValue={35} />
        <KnobWithState label="MIX" defaultValue={30} />
        <SynthLED label="SYNC" active={true} color="green" />
      </SynthRow>

      <SynthRow label="REVERB" showPanel showDivider>
        <KnobWithState label="SIZE" defaultValue={60} />
        <KnobWithState label="DECAY" defaultValue={45} />
        <KnobWithState label="DAMP" defaultValue={50} />
        <KnobWithState label="MIX" defaultValue={25} />
      </SynthRow>

      <SynthRow label="CHORUS" showPanel>
        <KnobWithState label="RATE" defaultValue={30} />
        <KnobWithState label="DEPTH" defaultValue={50} />
        <KnobWithState label="MIX" defaultValue={40} />
        <SynthLED label="ON" active={true} color="blue" />
      </SynthRow>
    </Synth>
  ),
};
