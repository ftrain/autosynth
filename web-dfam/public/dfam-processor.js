/**
 * DFAM AudioWorklet Processor
 * Runs the WASM DSP in the audio thread
 */

class DFAMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.wasmReady = false;
    this.wasmExports = null;
    this.memory = null;
    this.outputPtrL = 0;
    this.outputPtrR = 0;
    this.heapF32 = null;
    this.currentStep = 0;
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
    }
  }

  async initWasm(wasmBytes, sr) {
    try {
      // Create a reference for use in imports (before we have exports)
      const self = this;

      // Create the imports that the WASM module needs
      // The import module name is "a" with keys a, b, c, d, e
      const imports = {
        a: {
          a: () => { // _abort
            console.error('[Worklet] WASM abort called');
            throw new Error('abort');
          },
          b: (ptr, type, destructor) => { // ___cxa_throw
            console.error('[Worklet] C++ exception thrown');
            throw new Error('C++ exception');
          },
          c: (buffer, size) => { // _getentropy
            if (!self.memory) return -1;
            const view = new Uint8Array(self.memory.buffer, buffer, size);
            for (let i = 0; i < size; i++) {
              view[i] = Math.floor(Math.random() * 256);
            }
            return 0;
          },
          d: (dest, src, num) => { // _emscripten_memcpy_js
            if (!self.memory) return;
            const heap = new Uint8Array(self.memory.buffer);
            heap.copyWithin(dest, src, src + num);
          },
          e: (requestedSize) => { // _emscripten_resize_heap
            // Don't support growing in worklet
            return 0;
          },
        }
      };

      console.log('[Worklet] Compiling WASM...');
      // Compile and instantiate the WASM module
      const wasmModule = await WebAssembly.compile(wasmBytes);
      const instance = await WebAssembly.instantiate(wasmModule, imports);

      this.wasmExports = instance.exports;

      // Memory is exported at 'f'
      this.memory = this.wasmExports.f;
      if (!this.memory) {
        throw new Error('No memory export found');
      }
      console.log('[Worklet] Memory acquired, buffer size:', this.memory.buffer.byteLength);

      // Call __wasm_call_ctors if it exists (export 'g')
      if (this.wasmExports.g) {
        console.log('[Worklet] Calling __wasm_call_ctors...');
        this.wasmExports.g();
      }

      // Update heap view
      this.updateHeapViews();

      // Initialize the synth engine (_init is export 'h')
      console.log('[Worklet] Initializing synth at', sr, 'Hz...');
      this.wasmExports.h(sr);

      // Allocate output buffers (128 samples * 4 bytes per float)
      // _malloc is export 'V'
      const bufferSize = 128 * 4;
      this.outputPtrL = this.wasmExports.V(bufferSize);
      this.outputPtrR = this.wasmExports.V(bufferSize);
      console.log('[Worklet] Output buffers allocated at:', this.outputPtrL, this.outputPtrR);

      if (this.outputPtrL === 0 || this.outputPtrR === 0) {
        throw new Error('Failed to allocate output buffers');
      }

      this.wasmReady = true;
      this.port.postMessage({ type: 'ready' });
      console.log('[Worklet] WASM initialized successfully!');
    } catch (error) {
      console.error('[Worklet] WASM init failed:', error);
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

    // Map parameter names to WASM exports
    // Based on the compiled WASM export names:
    // h=init, i=process, j=setRunning, k=isRunning, l=setTempo, m=setClockDivider
    // n=setStepPitch, o=setStepVelocity, p=getCurrentStep
    // q=setVCO1Frequency, r=setVCO2Frequency, s=setVCO1Level, t=setVCO2Level
    // u=setVCO1Waveform, v=setVCO2Waveform, w=setFMAmount, x=setNoiseLevel
    // y=setFilterCutoff, z=setFilterResonance, A=setFilterEnvAmount, B=setFilterMode
    // C=setFilterLfoRate, D=setFilterLfoClockSync, E=setFilterLfoAmount
    // F=setPitchEnvAttack, G=setPitchEnvDecay, H=setPitchEnvAmount
    // I=setVCFVCAEnvAttack, J=setVCFVCAEnvDecay
    // K=setSaturatorDrive, L=setSaturatorMix
    // M=setDelayTime, N=setDelayClockSync, O=setDelayFeedback, P=setDelayMix
    // Q=setReverbDecay, R=setReverbDamping, S=setReverbMix
    // T=setMasterVolume

    const e = this.wasmExports;
    try {
      switch (name) {
        case 'running': e.j(value > 0.5 ? 1 : 0); break;
        case 'tempo': e.l(value); break;
        case 'clockDivider': e.m(value); break;
        case 'vco1Freq': e.q(value); break;
        case 'vco1Wave': e.u(Math.round(value)); break;
        case 'vco1Level': e.s(value); break;
        case 'vco2Freq': e.r(value); break;
        case 'vco2Wave': e.v(Math.round(value)); break;
        case 'vco2Level': e.t(value); break;
        case 'fmAmount': e.w(value); break;
        case 'noiseLevel': e.x(value); break;
        case 'filterCutoff': e.y(value); break;
        case 'filterReso': e.z(value); break;
        case 'filterEnvAmount': e.A(value); break;
        case 'filterMode': e.B(Math.round(value)); break;
        case 'filterLfoRate': e.C(value); break;
        case 'filterLfoClockSync': e.D(value); break;
        case 'filterLfoAmount': e.E(value); break;
        case 'pitchEnvAttack': e.F(value); break;
        case 'pitchEnvDecay': e.G(value); break;
        case 'pitchEnvAmount': e.H(value); break;
        case 'vcfVcaAttack': e.I(value); break;
        case 'vcfVcaDecay': e.J(value); break;
        case 'satDrive': e.K(value); break;
        case 'satMix': e.L(value); break;
        case 'delayTime': e.M(value); break;
        case 'delayClockSync': e.N(value); break;
        case 'delayFeedback': e.O(value); break;
        case 'delayMix': e.P(value); break;
        case 'reverbDecay': e.Q(value); break;
        case 'reverbDamping': e.R(value); break;
        case 'reverbMix': e.S(value); break;
        case 'masterVolume': e.T(value); break;
        default:
          if (name.startsWith('seqPitch_')) {
            const step = parseInt(name.split('_')[1]);
            e.n(step, value);
          } else if (name.startsWith('seqVel_')) {
            const step = parseInt(name.split('_')[1]);
            e.o(step, value);
          }
          break;
      }
    } catch (err) {
      console.error('[Worklet] setParam error:', name, value, err);
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

      // Call WASM process function: _process (export 'i')
      this.wasmExports.i(this.outputPtrL, this.outputPtrR, numSamples);

      // Copy from WASM heap to output buffers
      const offsetL = this.outputPtrL >> 2; // Divide by 4 to get float index
      const offsetR = this.outputPtrR >> 2;

      for (let i = 0; i < numSamples; i++) {
        outputL[i] = this.heapF32[offsetL + i];
        outputR[i] = this.heapF32[offsetR + i];
      }

      // Periodically report current step
      this.frameCount += numSamples;
      if (this.frameCount >= 4410) { // ~10 times per second at 44.1kHz
        this.frameCount = 0;
        const newStep = this.wasmExports.p(); // _getCurrentStep
        if (newStep !== this.currentStep) {
          this.currentStep = newStep;
          this.port.postMessage({ type: 'step', step: newStep });
        }
      }
    } catch (err) {
      console.error('[Worklet] process error:', err);
    }

    return true;
  }
}

registerProcessor('dfam-processor', DFAMProcessor);
