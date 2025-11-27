/**
 * @file juce.d.ts
 * @brief TypeScript type definitions for JUCE WebView bridge
 */

/**
 * JUCE backend interface exposed to WebView
 */
export interface JUCEBackend {
  /** Backend type identifier */
  backend: 'juce';
  /** JUCE version string */
  version: string;
  /** Operating system platform */
  platform: 'mac' | 'windows' | 'linux' | string;
  /** Sample rate */
  sampleRate?: number;
  /** Buffer size */
  bufferSize?: number;
  /** Pending parameters from UI */
  pendingParams?: Record<string, number>;
  /** Initial parameters from C++ */
  initialParams?: Record<string, number>;
  /** Console logs buffer */
  consoleLogs?: string[];
}

/**
 * Parameter update message from C++ to JavaScript
 */
export interface ParameterUpdateMessage {
  type: 'parameterUpdate';
  paramId: string;
  value: number;
}

/**
 * Audio data message from C++ to JavaScript
 */
export interface AudioDataMessage {
  type: 'audioData';
  channel: 'lead' | 'drum' | 'sub' | 'master';
  samples: number[];
}

/**
 * Preset list message from C++ to JavaScript
 */
export interface PresetListMessage {
  type: 'presetList';
  presets: string[];
}

/**
 * Current preset message from C++ to JavaScript
 */
export interface PresetChangedMessage {
  type: 'presetChanged';
  name: string;
}

/**
 * All possible messages from C++ to JavaScript
 */
export type JUCEMessage =
  | ParameterUpdateMessage
  | AudioDataMessage
  | PresetListMessage
  | PresetChangedMessage;

/**
 * Batch parameter update for efficiency
 */
export interface BatchParameterUpdate {
  [paramId: string]: number;
}

declare global {
  interface Window {
    /**
     * Set a parameter value (called from JavaScript to C++)
     * @param paramId - Parameter identifier
     * @param normalizedValue - Value between 0 and 1
     */
    setParameter?: (paramId: string, normalizedValue: number) => void;

    /**
     * Get a parameter value (called from JavaScript to C++)
     * @param paramId - Parameter identifier
     * @returns Normalized value between 0 and 1
     */
    getParameter?: (paramId: string) => number;

    /**
     * Load a preset by name
     * @param name - Preset name
     */
    loadPreset?: (name: string) => void;

    /**
     * Save current state as a preset
     * @param name - Preset name
     */
    savePreset?: (name: string) => void;

    /**
     * Delete a preset
     * @param name - Preset name
     */
    deletePreset?: (name: string) => void;

    /**
     * Get list of available presets
     * @returns Array of preset names
     */
    getPresets?: () => string[];

    /**
     * Trigger a note on event
     * @param note - MIDI note number (0-127)
     * @param velocity - Note velocity (0-127)
     */
    noteOn?: (note: number, velocity: number) => void;

    /**
     * Trigger a note off event
     * @param note - MIDI note number (0-127)
     */
    noteOff?: (note: number) => void;

    /**
     * JUCE backend metadata
     */
    __juce__?: JUCEBackend;

    /**
     * Callback for receiving messages from C++
     * Set this function to handle incoming messages
     */
    onJUCEMessage?: (message: JUCEMessage) => void;

    /**
     * Send a batch of parameter updates
     * More efficient than individual setParameter calls
     */
    batchSetParameters?: (updates: BatchParameterUpdate) => void;
  }
}

export {};
