/**
 * Web Audio implementation of DualModeOscillator
 * Uses AudioWorklet for sample-accurate processing
 */

import type { DualModeOscillatorParams, DualModeOscillatorInputs } from './types';

/** AudioWorklet processor code */
export const processorCode = `
class DualOscProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.params = {
      waveform: 0,
      level: 0.7,
      octave: 0,
      pulseWidth: 0.5,
      pwmAmount: 0,
      fineTune: 0,
    };
    this.inputs = {
      pitch: 440,
      pwm: 0.5,
      gate: 1,
    };

    this.port.onmessage = (e) => {
      const { type, ...data } = e.data;
      if (type === 'params') {
        Object.assign(this.params, data);
      } else if (type === 'inputs') {
        Object.assign(this.inputs, data);
      }
    };
  }

  polyBLEP(t, dt) {
    if (t < dt) {
      t /= dt;
      return t + t - t * t - 1.0;
    } else if (t > 1.0 - dt) {
      t = (t - 1.0) / dt;
      return t * t + t + t + 1.0;
    }
    return 0.0;
  }

  process(inputs, outputs) {
    const output = outputs[0][0];
    if (!output) return true;

    const { waveform, level, octave, pulseWidth, pwmAmount, fineTune } = this.params;
    const { pitch, pwm, gate } = this.inputs;

    if (gate < 0.5) {
      output.fill(0);
      return true;
    }

    const sampleRate = 44100;
    let freq = pitch * Math.pow(2, octave) * Math.pow(2, fineTune / 12);
    freq = Math.max(20, Math.min(freq, sampleRate * 0.45));
    const dt = freq / sampleRate;

    for (let i = 0; i < output.length; i++) {
      let sample = 0;

      if (waveform < 0.5) {
        // Square with PWM
        const pwmMod = (pwm - 0.5) * 0.8 * pwmAmount;
        const pw = Math.max(0.05, Math.min(0.95, pulseWidth + pwmMod));
        sample = this.phase < pw ? 1 : -1;
        sample += this.polyBLEP(this.phase, dt);
        sample -= this.polyBLEP((this.phase - pw + 1) % 1, dt);
      } else {
        // Sawtooth
        sample = 2 * this.phase - 1;
        sample -= this.polyBLEP(this.phase, dt);
      }

      output[i] = sample * level * 0.3;

      this.phase += dt;
      if (this.phase >= 1) this.phase -= 1;
    }

    return true;
  }
}

registerProcessor('dual-osc-processor', DualOscProcessor);
`;

/**
 * Creates and manages a DualModeOscillator AudioWorklet
 */
export class DualModeOscillatorWorklet {
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private _isReady = false;

  get isReady() {
    return this._isReady;
  }

  get outputNode(): AudioNode | null {
    return this.node;
  }

  async init(context?: AudioContext): Promise<void> {
    this.context = context || new AudioContext({ sampleRate: 44100 });

    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    await this.context.audioWorklet.addModule(url);
    this.node = new AudioWorkletNode(this.context, 'dual-osc-processor');

    URL.revokeObjectURL(url);
    this._isReady = true;
  }

  connect(destination: AudioNode): void {
    if (this.node) {
      this.node.connect(destination);
    }
  }

  disconnect(): void {
    if (this.node) {
      this.node.disconnect();
    }
  }

  setParams(params: Partial<DualModeOscillatorParams>): void {
    if (this.node) {
      this.node.port.postMessage({ type: 'params', ...params });
    }
  }

  setInputs(inputs: Partial<DualModeOscillatorInputs>): void {
    if (this.node) {
      this.node.port.postMessage({ type: 'inputs', ...inputs });
    }
  }

  async start(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  async stop(): Promise<void> {
    if (this.context?.state === 'running') {
      await this.context.suspend();
    }
  }
}
