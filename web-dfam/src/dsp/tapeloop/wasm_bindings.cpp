/**
 * @file wasm_bindings.cpp
 * @brief Plain C exports for TapeLoop DSP (AudioWorklet compatible)
 *
 * Full-featured TapeLoop engine with Airwindows effects, Galactic3 reverb,
 * dual sequencers, per-oscillator ADSR, and more.
 */

#include "TapeLoopEngine.h"

static TapeLoopEngine* g_engine = nullptr;

extern "C" {

void init(int sampleRate) {
    if (g_engine) delete g_engine;
    g_engine = new TapeLoopEngine();
    g_engine->prepare(static_cast<double>(sampleRate), 128);
}

void process(float* outputL, float* outputR, int numSamples) {
    if (!g_engine) return;
    g_engine->renderBlock(outputL, outputR, numSamples);
}

void noteOn(int note, float velocity) {
    if (g_engine) g_engine->noteOn(note, velocity);
}

void noteOff(int note) {
    if (g_engine) g_engine->noteOff(note);
}

void clearTape() {
    if (g_engine) g_engine->clearTape();
}

// Oscillator 1
void setOsc1Waveform(int w) { if (g_engine) g_engine->setOsc1Waveform(w); }
void setOsc1Tune(float semitones) { if (g_engine) g_engine->setOsc1Tune(semitones); }
void setOsc1Level(float level) { if (g_engine) g_engine->setOsc1Level(level); }

// Oscillator 1 ADSR
void setOsc1Attack(float ms) { if (g_engine) g_engine->setOsc1Attack(ms); }
void setOsc1Decay(float ms) { if (g_engine) g_engine->setOsc1Decay(ms); }
void setOsc1Sustain(float level) { if (g_engine) g_engine->setOsc1Sustain(level); }
void setOsc1Release(float ms) { if (g_engine) g_engine->setOsc1Release(ms); }

// Oscillator 2
void setOsc2Waveform(int w) { if (g_engine) g_engine->setOsc2Waveform(w); }
void setOsc2Tune(float semitones) { if (g_engine) g_engine->setOsc2Tune(semitones); }
void setOsc2Detune(float cents) { if (g_engine) g_engine->setOsc2Detune(cents); }
void setOsc2Level(float level) { if (g_engine) g_engine->setOsc2Level(level); }

// Oscillator 2 ADSR
void setOsc2Attack(float ms) { if (g_engine) g_engine->setOsc2Attack(ms); }
void setOsc2Decay(float ms) { if (g_engine) g_engine->setOsc2Decay(ms); }
void setOsc2Sustain(float level) { if (g_engine) g_engine->setOsc2Sustain(level); }
void setOsc2Release(float ms) { if (g_engine) g_engine->setOsc2Release(ms); }

// FM
void setFMAmount(float amount) { if (g_engine) g_engine->setFMAmount(amount); }

// Tape Loop
void setLoopLength(float seconds) { if (g_engine) g_engine->setLoopLength(seconds); }
void setLoopFeedback(float fb) { if (g_engine) g_engine->setLoopFeedback(fb); }
void setRecordLevel(float level) { if (g_engine) g_engine->setRecordLevel(level); }

// Tape Character
void setSaturation(float sat) { if (g_engine) g_engine->setSaturation(sat); }
void setWobbleRate(float rate) { if (g_engine) g_engine->setWobbleRate(rate); }
void setWobbleDepth(float depth) { if (g_engine) g_engine->setWobbleDepth(depth); }
void setTapeHiss(float hiss) { if (g_engine) g_engine->setTapeHiss(hiss); }
void setTapeAge(float age) { if (g_engine) g_engine->setTapeAge(age); }
void setTapeDegrade(float degrade) { if (g_engine) g_engine->setTapeDegrade(degrade); }

// Tape Model (Airwindows)
void setTapeModel(int model) { if (g_engine) g_engine->setTapeModel(model); }
void setTapeDrive(float drive) { if (g_engine) g_engine->setTapeDrive(drive); }
void setTapeBump(float bump) { if (g_engine) g_engine->setTapeBump(bump); }

// LFO
void setLFORate(float hz) { if (g_engine) g_engine->setLFORate(hz); }
void setLFODepth(float depth) { if (g_engine) g_engine->setLFODepth(depth); }
void setLFOWaveform(int wf) { if (g_engine) g_engine->setLFOWaveform(wf); }
void setLFOTarget(int target) { if (g_engine) g_engine->setLFOTarget(target); }

// Mix
void setDryLevel(float level) { if (g_engine) g_engine->setDryLevel(level); }
void setLoopLevel(float level) { if (g_engine) g_engine->setLoopLevel(level); }
void setMasterLevel(float level) { if (g_engine) g_engine->setMasterLevel(level); }

// Recording Envelope
void setRecAttack(float seconds) { if (g_engine) g_engine->setRecAttack(seconds); }
void setRecDecay(float seconds) { if (g_engine) g_engine->setRecDecay(seconds); }

// Delay
void setDelayTime(float seconds) { if (g_engine) g_engine->setDelayTime(seconds); }
void setDelayFeedback(float fb) { if (g_engine) g_engine->setDelayFeedback(fb); }
void setDelayMix(float mix) { if (g_engine) g_engine->setDelayMix(mix); }

// Reverb (Galactic3)
void setReverbReplace(float r) { if (g_engine) g_engine->setReverbReplace(r); }
void setReverbBrightness(float b) { if (g_engine) g_engine->setReverbBrightness(b); }
void setReverbDetune(float d) { if (g_engine) g_engine->setReverbDetune(d); }
void setReverbBigness(float b) { if (g_engine) g_engine->setReverbBigness(b); }
void setReverbSize(float s) { if (g_engine) g_engine->setReverbSize(s); }
void setReverbMix(float mix) { if (g_engine) g_engine->setReverbMix(mix); }

// Legacy reverb API (mapped to Galactic3)
void setReverbDecay(float decay) { if (g_engine) g_engine->setReverbReplace(decay); }
void setReverbDamping(float damping) { if (g_engine) g_engine->setReverbBrightness(1.0f - damping); }

// Compressor
void setCompThreshold(float db) { if (g_engine) g_engine->setCompThreshold(db); }
void setCompRatio(float r) { if (g_engine) g_engine->setCompRatio(r); }
void setCompAttack(float ms) { if (g_engine) g_engine->setCompAttack(ms); }
void setCompRelease(float ms) { if (g_engine) g_engine->setCompRelease(ms); }
void setCompMakeup(float db) { if (g_engine) g_engine->setCompMakeup(db); }
void setCompMix(float m) { if (g_engine) g_engine->setCompMix(m); }

// Sequencer (common)
void setSeqEnabled(int enabled) { if (g_engine) g_engine->setSeqEnabled(enabled != 0); }
void setSeqBPM(float bpm) { if (g_engine) g_engine->setSeqBPM(bpm); }

// Sequencer 1
void setSeq1Division(int divIdx) { if (g_engine) g_engine->setSeq1Division(divIdx); }
void setSeq1StepPitch(int step, int midiNote) { if (g_engine) g_engine->setSeq1StepPitch(step, midiNote); }
void setSeq1StepGate(int step, int gate) { if (g_engine) g_engine->setSeq1StepGate(step, gate != 0); }

// Sequencer 2
void setSeq2Division(int divIdx) { if (g_engine) g_engine->setSeq2Division(divIdx); }
void setSeq2StepPitch(int step, int midiNote) { if (g_engine) g_engine->setSeq2StepPitch(step, midiNote); }
void setSeq2StepGate(int step, int gate) { if (g_engine) g_engine->setSeq2StepGate(step, gate != 0); }

// Voice to Loop FM
void setVoiceLoopFM(float amount) { if (g_engine) g_engine->setVoiceLoopFM(amount); }

// Pan LFO
void setPanSpeed(float hz) { if (g_engine) g_engine->setPanSpeed(hz); }
void setPanDepth(float depth) { if (g_engine) g_engine->setPanDepth(depth); }

// Getters
int getSeq1CurrentStep() { return g_engine ? g_engine->getSeq1CurrentStep() : 0; }
int getSeq2CurrentStep() { return g_engine ? g_engine->getSeq2CurrentStep() : 0; }

} // extern "C"
