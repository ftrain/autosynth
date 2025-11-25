/**
 * TapeLoop AudioWorklet Processor
 * Runs the WASM DSP in the audio thread
 *
 * Full-featured TapeLoop with Airwindows, Galactic3 reverb, ADSR, and more.
 */

class TapeLoopProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.wasmReady = false;
    this.wasmExports = null;
    this.memory = null;
    this.outputPtrL = 0;
    this.outputPtrR = 0;
    this.heapF32 = null;
    this.seq1Step = 0;
    this.seq2Step = 0;
    this.frameCount = 0;

    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  handleMessage(data) {
    if (data.type === 'init') {
      this.initWasm(data.wasmBytes, data.sampleRate);
    } else if (data.type === 'param' && this.wasmReady) {
      this.setParam(data.name, data.value);
    } else if (data.type === 'noteOn' && this.wasmReady) {
      this.wasmExports.noteOn(data.note, data.velocity);
    } else if (data.type === 'noteOff' && this.wasmReady) {
      this.wasmExports.noteOff(data.note);
    } else if (data.type === 'clearTape' && this.wasmReady) {
      this.wasmExports.clearTape();
    }
  }

  async initWasm(wasmBytes, sr) {
    try {
      const self = this;

      // WASM imports for emscripten with WASI stubs
      const imports = {
        wasi_snapshot_preview1: {
          random_get: (buffer, size) => {
            const heap = new Uint8Array(self.memory.buffer);
            for (let i = 0; i < size; i++) {
              heap[buffer + i] = Math.floor(Math.random() * 256);
            }
            return 0;
          },
          fd_close: () => 0,
          fd_write: () => 0,
          fd_seek: () => 0,
        },
        env: {
          emscripten_notify_memory_growth: (memoryIndex) => {
            console.log('[TapeLoop] Memory grew');
            self.updateHeapViews();
          },
        }
      };

      console.log('[TapeLoop] Compiling WASM...');
      const wasmModule = await WebAssembly.compile(wasmBytes);
      const instance = await WebAssembly.instantiate(wasmModule, imports);

      this.wasmExports = instance.exports;

      // Memory export
      this.memory = this.wasmExports.memory;
      if (!this.memory) {
        throw new Error('No memory export found');
      }
      console.log('[TapeLoop] Memory acquired, buffer size:', this.memory.buffer.byteLength);

      // Call _initialize if it exists (emscripten startup)
      if (this.wasmExports._initialize) {
        console.log('[TapeLoop] Calling _initialize...');
        this.wasmExports._initialize();
      }

      this.updateHeapViews();

      // Initialize the synth engine
      console.log('[TapeLoop] Initializing synth at', sr, 'Hz...');
      this.wasmExports.init(sr);

      // Allocate output buffers (128 samples * 4 bytes per float)
      const bufferSize = 128 * 4;
      this.outputPtrL = this.wasmExports.malloc(bufferSize);
      this.outputPtrR = this.wasmExports.malloc(bufferSize);
      console.log('[TapeLoop] Output buffers allocated at:', this.outputPtrL, this.outputPtrR);

      if (this.outputPtrL === 0 || this.outputPtrR === 0) {
        throw new Error('Failed to allocate output buffers');
      }

      this.wasmReady = true;
      this.port.postMessage({ type: 'ready' });
      console.log('[TapeLoop] WASM initialized successfully!');
    } catch (error) {
      console.error('[TapeLoop] WASM init failed:', error);
      this.port.postMessage({ type: 'error', message: error.message });
    }
  }

  updateHeapViews() {
    if (this.memory) {
      this.heapF32 = new Float32Array(this.memory.buffer);
    }
  }

  setParam(name, value) {
    if (!this.wasmExports) return;

    const e = this.wasmExports;
    try {
      switch (name) {
        // Oscillator 1
        case 'osc1Wave': e.setOsc1Waveform(Math.round(value)); break;
        case 'osc1Tune': e.setOsc1Tune(value); break;
        case 'osc1Level': e.setOsc1Level(value); break;
        case 'osc1Attack': e.setOsc1Attack(value); break;
        case 'osc1Decay': e.setOsc1Decay(value); break;
        case 'osc1Sustain': e.setOsc1Sustain(value); break;
        case 'osc1Release': e.setOsc1Release(value); break;

        // Oscillator 2
        case 'osc2Wave': e.setOsc2Waveform(Math.round(value)); break;
        case 'osc2Tune': e.setOsc2Tune(value); break;
        case 'osc2Detune': e.setOsc2Detune(value); break;
        case 'osc2Level': e.setOsc2Level(value); break;
        case 'osc2Attack': e.setOsc2Attack(value); break;
        case 'osc2Decay': e.setOsc2Decay(value); break;
        case 'osc2Sustain': e.setOsc2Sustain(value); break;
        case 'osc2Release': e.setOsc2Release(value); break;

        // FM
        case 'fmAmount': e.setFMAmount(value); break;

        // Tape Loop
        case 'loopLength': e.setLoopLength(value); break;
        case 'loopFeedback': e.setLoopFeedback(value); break;
        case 'recordLevel': e.setRecordLevel(value); break;

        // Tape Character
        case 'saturation': e.setSaturation(value); break;
        case 'wobbleRate': e.setWobbleRate(value); break;
        case 'wobbleDepth': e.setWobbleDepth(value); break;
        case 'tapeHiss': e.setTapeHiss(value); break;
        case 'tapeAge': e.setTapeAge(value); break;
        case 'tapeDegrade': e.setTapeDegrade(value); break;

        // Tape Model (Airwindows)
        case 'tapeModel': e.setTapeModel(Math.round(value)); break;
        case 'tapeDrive': e.setTapeDrive(value); break;
        case 'tapeBump': e.setTapeBump(value); break;

        // LFO
        case 'lfoRate': e.setLFORate(value); break;
        case 'lfoDepth': e.setLFODepth(value); break;
        case 'lfoWaveform': e.setLFOWaveform(Math.round(value)); break;
        case 'lfoTarget': e.setLFOTarget(Math.round(value)); break;

        // Mix
        case 'dryLevel': e.setDryLevel(value); break;
        case 'loopLevel': e.setLoopLevel(value); break;
        case 'masterLevel': e.setMasterLevel(value); break;

        // Record Envelope
        case 'recAttack': e.setRecAttack(value); break;
        case 'recDecay': e.setRecDecay(value); break;

        // Delay
        case 'delayTime': e.setDelayTime(value); break;
        case 'delayFeedback': e.setDelayFeedback(value); break;
        case 'delayMix': e.setDelayMix(value); break;

        // Reverb (Galactic3)
        case 'reverbReplace': e.setReverbReplace(value); break;
        case 'reverbBrightness': e.setReverbBrightness(value); break;
        case 'reverbDetune': e.setReverbDetune(value); break;
        case 'reverbBigness': e.setReverbBigness(value); break;
        case 'reverbSize': e.setReverbSize(value); break;
        case 'reverbMix': e.setReverbMix(value); break;

        // Legacy reverb (mapped)
        case 'reverbDecay': e.setReverbDecay(value); break;
        case 'reverbDamping': e.setReverbDamping(value); break;

        // Compressor
        case 'compThreshold': e.setCompThreshold(value); break;
        case 'compRatio': e.setCompRatio(value); break;
        case 'compAttack': e.setCompAttack(value); break;
        case 'compRelease': e.setCompRelease(value); break;
        case 'compMakeup': e.setCompMakeup(value); break;
        case 'compMix': e.setCompMix(value); break;

        // Sequencer
        case 'seqEnabled': e.setSeqEnabled(value ? 1 : 0); break;
        case 'seqBPM': e.setSeqBPM(value); break;
        case 'seq1Division': e.setSeq1Division(Math.round(value)); break;
        case 'seq2Division': e.setSeq2Division(Math.round(value)); break;

        // Voice to Loop FM
        case 'voiceLoopFM': e.setVoiceLoopFM(value); break;

        // Pan
        case 'panSpeed': e.setPanSpeed(value); break;
        case 'panDepth': e.setPanDepth(value); break;

        default:
          // Sequencer step pitches and gates
          if (name.startsWith('seq1Pitch_')) {
            const step = parseInt(name.split('_')[1]);
            e.setSeq1StepPitch(step, Math.round(value));
          } else if (name.startsWith('seq1Gate_')) {
            const step = parseInt(name.split('_')[1]);
            e.setSeq1StepGate(step, value ? 1 : 0);
          } else if (name.startsWith('seq2Pitch_')) {
            const step = parseInt(name.split('_')[1]);
            e.setSeq2StepPitch(step, Math.round(value));
          } else if (name.startsWith('seq2Gate_')) {
            const step = parseInt(name.split('_')[1]);
            e.setSeq2StepGate(step, value ? 1 : 0);
          }
          break;
      }
    } catch (err) {
      console.error('[TapeLoop] setParam error:', name, value, err);
    }
  }

  process(inputs, outputs, parameters) {
    if (!this.wasmReady || !this.wasmExports || !this.heapF32) {
      return true;
    }

    const output = outputs[0];
    if (!output || output.length < 2) return true;

    const outputL = output[0];
    const outputR = output[1];
    const numSamples = outputL.length;

    try {
      // Update heap view in case memory grew
      if (this.memory.buffer.byteLength !== this.heapF32.buffer.byteLength) {
        this.updateHeapViews();
      }

      // Call WASM process function
      this.wasmExports.process(this.outputPtrL, this.outputPtrR, numSamples);

      // Copy from WASM heap to output buffers
      const offsetL = this.outputPtrL >> 2;
      const offsetR = this.outputPtrR >> 2;

      for (let i = 0; i < numSamples; i++) {
        outputL[i] = this.heapF32[offsetL + i];
        outputR[i] = this.heapF32[offsetR + i];
      }

      // Periodically report sequencer steps
      this.frameCount += numSamples;
      if (this.frameCount >= 4410) { // ~10 times per second
        this.frameCount = 0;
        const newStep1 = this.wasmExports.getSeq1CurrentStep();
        const newStep2 = this.wasmExports.getSeq2CurrentStep();
        if (newStep1 !== this.seq1Step || newStep2 !== this.seq2Step) {
          this.seq1Step = newStep1;
          this.seq2Step = newStep2;
          this.port.postMessage({ type: 'seqStep', seq1: newStep1, seq2: newStep2 });
        }
      }
    } catch (err) {
      console.error('[TapeLoop] process error:', err);
    }

    return true;
  }
}

registerProcessor('tapeloop-processor', TapeLoopProcessor);
