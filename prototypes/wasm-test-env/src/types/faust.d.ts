// Type definitions for Faust WebAssembly AudioWorklet

export interface FaustDspMeta {
  name: string;
  version: string;
  options: string;
}

export interface FaustUIDescriptor {
  type: string;
  label: string;
  address: string;
  init?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface FaustAudioWorkletNode extends AudioWorkletNode {
  setParamValue(path: string, value: number): void;
  getParamValue(path: string): number;
  getParams(): string[];
  getJSON(): string;
  getMeta(): FaustDspMeta;
}

declare global {
  interface Window {
    FaustAudioWorkletNode: {
      new (
        context: AudioContext,
        processorName: string,
        options?: AudioWorkletNodeOptions
      ): FaustAudioWorkletNode;
    };
  }
}
