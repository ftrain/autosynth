/**
 * TapeLoop AudioWorklet Processor
 * Runs the WASM DSP in the audio thread
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
      this.wasmExports.i(data.note, data.velocity);
    } else if (data.type === 'noteOff' && this.wasmReady) {
      this.wasmExports.j(data.note);
    } else if (data.type === 'clearTape' && this.wasmReady) {
      this.wasmExports.k();
    }
  }

  async initWasm(wasmBytes, sr) {
    try {
      const self = this;

      // TapeLoop WASM imports: module "a" with keys a, b, c, d
      const imports = {
        a: {
          a: (ptr, type, destructor) => { // ___cxa_throw
            console.error('[TapeLoop] C++ exception thrown');
            throw new Error('C++ exception');
          },
          b: () => { // _abort
            console.error('[TapeLoop] WASM abort called');
            throw new Error('abort');
          },
          c: (dest, src, num) => { // _emscripten_memcpy_js
            if (!self.memory) return;
            const heap = new Uint8Array(self.memory.buffer);
            heap.copyWithin(dest, src, src + num);
          },
          d: (requestedSize) => { // _emscripten_resize_heap
            return 0;
          },
        }
      };

      console.log('[TapeLoop] Compiling WASM...');
      const wasmModule = await WebAssembly.compile(wasmBytes);
      const instance = await WebAssembly.instantiate(wasmModule, imports);

      this.wasmExports = instance.exports;

      // Memory is exported at 'e'
      this.memory = this.wasmExports.e;
      if (!this.memory) {
        throw new Error('No memory export found');
      }
      console.log('[TapeLoop] Memory acquired, buffer size:', this.memory.buffer.byteLength);

      // Call __wasm_call_ctors if it exists (export 'f')
      if (this.wasmExports.f) {
        console.log('[TapeLoop] Calling __wasm_call_ctors...');
        this.wasmExports.f();
      }

      this.updateHeapViews();

      // Initialize the synth engine (_init is export 'g')
      console.log('[TapeLoop] Initializing synth at', sr, 'Hz...');
      this.wasmExports.g(sr);

      // Allocate output buffers (128 samples * 4 bytes per float)
      // _malloc is export 'da'
      const bufferSize = 128 * 4;
      this.outputPtrL = this.wasmExports.da(bufferSize);
      this.outputPtrR = this.wasmExports.da(bufferSize);
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

    // TapeLoop WASM export mapping:
    // g=init, h=process, i=noteOn, j=noteOff, k=clearTape
    // l=setOsc1Waveform, m=setOsc1Tune, n=setOsc1Level
    // o=setOsc2Waveform, p=setOsc2Tune, q=setOsc2Detune, r=setOsc2Level
    // s=setFMAmount
    // t=setLoopLength, u=setLoopFeedback, v=setRecordLevel
    // w=setSaturation, x=setWobbleRate, y=setWobbleDepth
    // z=setTapeHiss, A=setTapeAge, B=setTapeDegrade
    // C=setLFORate, D=setLFODepth, E=setLFOWaveform, F=setLFOTarget
    // G=setDryLevel, H=setLoopLevel, I=setMasterLevel
    // J=setRecAttack, K=setRecDecay
    // L=setDelayTime, M=setDelayFeedback, N=setDelayMix
    // O=setReverbDecay, P=setReverbDamping, Q=setReverbMix
    // R=setSeqEnabled, S=setSeqBPM
    // T=setSeq1Division, U=setSeq1StepPitch, V=setSeq1StepGate
    // W=setSeq2Division, X=setSeq2StepPitch, Y=setSeq2StepGate
    // Z=setVoiceLoopFM, _=setPanSpeed, $=setPanDepth
    // aa=getSeq1CurrentStep, ba=getSeq2CurrentStep
    // da=malloc, ca=free

    const e = this.wasmExports;
    try {
      switch (name) {
        // Oscillators
        case 'osc1Wave': e.l(Math.round(value)); break;
        case 'osc1Tune': e.m(value); break;
        case 'osc1Level': e.n(value); break;
        case 'osc2Wave': e.o(Math.round(value)); break;
        case 'osc2Tune': e.p(value); break;
        case 'osc2Detune': e.q(value); break;
        case 'osc2Level': e.r(value); break;
        case 'fmAmount': e.s(value); break;

        // Tape Loop
        case 'loopLength': e.t(value); break;
        case 'loopFeedback': e.u(value); break;
        case 'recordLevel': e.v(value); break;

        // Tape Character
        case 'saturation': e.w(value); break;
        case 'wobbleRate': e.x(value); break;
        case 'wobbleDepth': e.y(value); break;
        case 'tapeHiss': e.z(value); break;
        case 'tapeAge': e.A(value); break;
        case 'tapeDegrade': e.B(value); break;

        // LFO
        case 'lfoRate': e.C(value); break;
        case 'lfoDepth': e.D(value); break;
        case 'lfoWaveform': e.E(Math.round(value)); break;
        case 'lfoTarget': e.F(Math.round(value)); break;

        // Mix
        case 'dryLevel': e.G(value); break;
        case 'loopLevel': e.H(value); break;
        case 'masterLevel': e.I(value); break;

        // Envelope
        case 'recAttack': e.J(value); break;
        case 'recDecay': e.K(value); break;

        // Effects
        case 'delayTime': e.L(value); break;
        case 'delayFeedback': e.M(value); break;
        case 'delayMix': e.N(value); break;
        case 'reverbDecay': e.O(value); break;
        case 'reverbDamping': e.P(value); break;
        case 'reverbMix': e.Q(value); break;

        // Sequencer
        case 'seqEnabled': e.R(value ? 1 : 0); break;
        case 'seqBPM': e.S(value); break;
        case 'seq1Division': e.T(Math.round(value)); break;
        case 'seq2Division': e.W(Math.round(value)); break;

        // Voice to Loop FM
        case 'voiceLoopFM': e.Z(value); break;

        // Pan
        case 'panSpeed': e._(value); break;
        case 'panDepth': e.$(value); break;

        default:
          // Sequencer step pitches and gates
          if (name.startsWith('seq1Pitch_')) {
            const step = parseInt(name.split('_')[1]);
            e.U(step, Math.round(value));
          } else if (name.startsWith('seq1Gate_')) {
            const step = parseInt(name.split('_')[1]);
            e.V(step, value ? 1 : 0);
          } else if (name.startsWith('seq2Pitch_')) {
            const step = parseInt(name.split('_')[1]);
            e.X(step, Math.round(value));
          } else if (name.startsWith('seq2Gate_')) {
            const step = parseInt(name.split('_')[1]);
            e.Y(step, value ? 1 : 0);
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

      // Call WASM process function: _process (export 'h')
      this.wasmExports.h(this.outputPtrL, this.outputPtrR, numSamples);

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
        const newStep1 = this.wasmExports.aa(); // getSeq1CurrentStep
        const newStep2 = this.wasmExports.ba(); // getSeq2CurrentStep
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
