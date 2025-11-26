/**
 * AudioWorklet Processor for Peanuts Voice
 *
 * This runs on the audio rendering thread and calls into the WASM module.
 *
 * CRITICAL:
 * - Runs on audio thread - must be real-time safe
 * - No console.log, no allocations, no blocking operations
 * - Communication with main thread via MessagePort only
 */

class SynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.wasmModule = null;
    this.wasmInstance = null;
    this.isInitialized = false;

    // WASM function pointers
    this.wasmProcess = null;
    this.wasmSetParameter = null;
    this.wasmNoteOn = null;
    this.wasmNoteOff = null;
    this.wasmMidiCC = null;
    this.wasmPitchBend = null;

    // Audio buffers
    this.outputLPtr = null;
    this.outputRPtr = null;
    this.blockSize = 128;

    // Setup message handler
    this.port.onmessage = (e) => this.handleMessage(e.data);
  }

  async handleMessage(msg) {
    switch (msg.type) {
      case 'init':
        await this.initWasm(msg.wasmModule, msg.sampleRate);
        break;

      case 'setParameter':
        if (this.isInitialized && this.wasmSetParameter) {
          this.wasmSetParameter(msg.id, msg.value);
        }
        break;

      case 'noteOn':
        if (this.isInitialized && this.wasmNoteOn) {
          this.wasmNoteOn(msg.note, msg.velocity);
        }
        break;

      case 'noteOff':
        if (this.isInitialized && this.wasmNoteOff) {
          this.wasmNoteOff(msg.note);
        }
        break;

      case 'midi':
        this.handleMidi(msg.status, msg.data1, msg.data2);
        break;
    }
  }

  async initWasm(wasmModule, sampleRate) {
    try {
      // Instantiate WASM module
      const instance = await WebAssembly.instantiate(wasmModule, {
        env: {
          memory: new WebAssembly.Memory({ initial: 512, maximum: 1024 }),
        },
      });

      this.wasmInstance = instance;
      const exports = instance.exports;

      // Get WASM exports
      this.wasmProcess = exports.process;
      this.wasmSetParameter = exports.setParameter;
      this.wasmNoteOn = exports.noteOn;
      this.wasmNoteOff = exports.noteOff;
      this.wasmMidiCC = exports.midiCC;
      this.wasmPitchBend = exports.pitchBend;

      // Allocate audio buffers in WASM memory
      const malloc = exports.malloc;
      if (malloc) {
        this.outputLPtr = malloc(this.blockSize * 4);  // 4 bytes per float
        this.outputRPtr = malloc(this.blockSize * 4);
      }

      // Initialize DSP engine
      if (exports.init) {
        exports.init(sampleRate);
      }

      this.isInitialized = true;

      // Notify main thread
      this.port.postMessage({ type: 'ready' });
    } catch (error) {
      this.port.postMessage({ type: 'error', error: error.message });
    }
  }

  handleMidi(status, data1, data2) {
    if (!this.isInitialized) return;

    const msgType = status & 0xF0;

    switch (msgType) {
      case 0x90:  // Note On
        if (data2 > 0) {  // velocity > 0
          this.wasmNoteOn(data1, data2 / 127.0);
        } else {  // velocity = 0 is Note Off
          this.wasmNoteOff(data1);
        }
        break;

      case 0x80:  // Note Off
        this.wasmNoteOff(data1);
        break;

      case 0xB0:  // Control Change
        if (this.wasmMidiCC) {
          this.wasmMidiCC(data1, data2);
        }
        break;

      case 0xE0:  // Pitch Bend
        if (this.wasmPitchBend) {
          const bend14bit = (data2 << 7) | data1;
          const normalized = (bend14bit - 8192) / 8192.0;
          this.wasmPitchBend(normalized);
        }
        break;
    }
  }

  process(inputs, outputs, parameters) {
    if (!this.isInitialized || !this.wasmProcess) {
      // Output silence if not initialized
      const output = outputs[0];
      for (let channel = 0; channel < output.length; channel++) {
        output[channel].fill(0);
      }
      return true;
    }

    const output = outputs[0];
    const numSamples = output[0].length;

    // Call WASM process function
    this.wasmProcess(this.outputLPtr, this.outputRPtr, numSamples);

    // Copy WASM output to AudioWorklet output
    const memory = new Float32Array(this.wasmInstance.exports.memory.buffer);
    const outputL = memory.subarray(
      this.outputLPtr / 4,
      this.outputLPtr / 4 + numSamples
    );
    const outputR = memory.subarray(
      this.outputRPtr / 4,
      this.outputRPtr / 4 + numSamples
    );

    output[0].set(outputL);
    if (output.length > 1) {
      output[1].set(outputR);
    }

    return true;  // Keep processor alive
  }
}

// Register processor
registerProcessor('synth-processor', SynthProcessor);
