/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// JUCE WebView bridge types
interface JUCEBackend {
  emitEvent: (event: string, data: unknown) => void;
}

interface JUCEInitData {
  __juce__functions?: string[];
}

interface JUCE {
  backend?: JUCEBackend;
  initialisationData?: JUCEInitData;
}

declare global {
  interface Window {
    __JUCE__?: JUCE;
    onParameterUpdate?: (paramId: string, value: number) => void;
    onStateUpdate?: (state: Record<string, number>) => void;
    onAudioData?: (samples: number[]) => void;
  }
}

export {};
