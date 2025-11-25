import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Web Audio + WASM Engine Hook for {{SYNTH_NAME}}
 *
 * This hook:
 * - Loads WASM module
 * - Initializes AudioWorklet
 * - Connects Web MIDI API
 * - Provides parameter control
 * - Handles hot-plug MIDI devices
 */

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
}

export interface AudioEngineAPI {
  // State
  isReady: boolean;
  midiInputs: MIDIDevice[];
  midiOutputs: MIDIDevice[];
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setParameter: (id: number, value: number) => void;
  sendNoteOn: (note: number, velocity: number) => void;
  sendNoteOff: (note: number) => void;
  sendMidiOut: (status: number, data1: number, data2: number) => void;
}

export const useAudioEngine = (): AudioEngineAPI => {
  const [isReady, setIsReady] = useState(false);
  const [midiInputs, setMidiInputs] = useState<MIDIDevice[]>([]);
  const [midiOutputs, setMidiOutputs] = useState<MIDIDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  /**
   * Initialize Web Audio + WASM + MIDI
   */
  const initialize = useCallback(async () => {
    try {
      // 1. Create AudioContext
      const ctx = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = ctx;

      // Resume if suspended (required by browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 2. Load WASM module
      const wasmResponse = await fetch('/synth.wasm');
      if (!wasmResponse.ok) {
        throw new Error(`Failed to load WASM: ${wasmResponse.statusText}`);
      }
      const wasmModule = await WebAssembly.compileStreaming(wasmResponse);

      // 3. Register AudioWorklet
      try {
        await ctx.audioWorklet.addModule('/processor.js');
      } catch (e) {
        throw new Error(`Failed to load AudioWorklet: ${e}`);
      }

      // 4. Create AudioWorklet node
      const worklet = new AudioWorkletNode(ctx, 'synth-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      workletNodeRef.current = worklet;

      // Connect to output
      worklet.connect(ctx.destination);

      // 5. Initialize WASM in worklet
      worklet.port.postMessage({
        type: 'init',
        wasmModule,
        sampleRate: ctx.sampleRate,
      });

      // Wait for ready signal
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WASM initialization timeout'));
        }, 5000);

        worklet.port.onmessage = (e) => {
          if (e.data.type === 'ready') {
            clearTimeout(timeout);
            resolve();
          } else if (e.data.type === 'error') {
            clearTimeout(timeout);
            reject(new Error(e.data.error));
          }
        };
      });

      // 6. Initialize Web MIDI (if available)
      if (navigator.requestMIDIAccess) {
        try {
          const midi = await navigator.requestMIDIAccess({ sysex: false });
          midiAccessRef.current = midi;

          // Get initial devices
          updateMidiDevices(midi);

          // Handle hot-plug
          midi.onstatechange = () => updateMidiDevices(midi);

          // Connect MIDI inputs to worklet
          Array.from(midi.inputs.values()).forEach((input) => {
            input.onmidimessage = (msg) => {
              const [status, data1, data2] = msg.data;
              worklet.port.postMessage({
                type: 'midi',
                status,
                data1,
                data2,
              });
            };
          });
        } catch (midiError) {
          console.warn('Web MIDI not available:', midiError);
          // Continue without MIDI
        }
      }

      setIsReady(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Audio engine initialization failed:', err);
    }
  }, []);

  /**
   * Update MIDI device lists
   */
  const updateMidiDevices = (midi: MIDIAccess) => {
    const inputs: MIDIDevice[] = Array.from(midi.inputs.values()).map((device) => ({
      id: device.id,
      name: device.name || 'Unknown MIDI Input',
      manufacturer: device.manufacturer || '',
      type: 'input' as const,
    }));

    const outputs: MIDIDevice[] = Array.from(midi.outputs.values()).map((device) => ({
      id: device.id,
      name: device.name || 'Unknown MIDI Output',
      manufacturer: device.manufacturer || '',
      type: 'output' as const,
    }));

    setMidiInputs(inputs);
    setMidiOutputs(outputs);
  };

  /**
   * Set parameter value
   */
  const setParameter = useCallback((id: number, value: number) => {
    workletNodeRef.current?.port.postMessage({
      type: 'setParameter',
      id,
      value,
    });
  }, []);

  /**
   * Send Note On (for virtual keyboard)
   */
  const sendNoteOn = useCallback((note: number, velocity: number) => {
    workletNodeRef.current?.port.postMessage({
      type: 'noteOn',
      note,
      velocity,
    });
  }, []);

  /**
   * Send Note Off (for virtual keyboard)
   */
  const sendNoteOff = useCallback((note: number) => {
    workletNodeRef.current?.port.postMessage({
      type: 'noteOff',
      note,
    });
  }, []);

  /**
   * Send MIDI message to external devices
   */
  const sendMidiOut = useCallback((status: number, data1: number, data2: number) => {
    if (midiAccessRef.current) {
      Array.from(midiAccessRef.current.outputs.values()).forEach((output) => {
        output.send([status, data1, data2]);
      });
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      workletNodeRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, []);

  return {
    isReady,
    midiInputs,
    midiOutputs,
    error,
    initialize,
    setParameter,
    sendNoteOn,
    sendNoteOff,
    sendMidiOut,
  };
};
