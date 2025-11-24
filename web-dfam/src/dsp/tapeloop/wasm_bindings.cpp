/**
 * @file wasm_bindings.cpp
 * @brief Plain C exports for TapeLoop DSP (AudioWorklet compatible)
 */

#include "tapeloop_dsp.h"

static tapeloop::TapeLoopEngine* g_engine = nullptr;

extern "C" {

void init(int sampleRate) {
    if (g_engine) delete g_engine;
    g_engine = new tapeloop::TapeLoopEngine();
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

// Oscillators
void setOsc1Waveform(int w) { if (g_engine) g_engine->setOsc1Waveform(w); }
void setOsc1Tune(float semitones) { if (g_engine) g_engine->setOsc1Tune(semitones); }
void setOsc1Level(float level) { if (g_engine) g_engine->setOsc1Level(level); }
void setOsc2Waveform(int w) { if (g_engine) g_engine->setOsc2Waveform(w); }
void setOsc2Tune(float semitones) { if (g_engine) g_engine->setOsc2Tune(semitones); }
void setOsc2Detune(float cents) { if (g_engine) g_engine->setOsc2Detune(cents); }
void setOsc2Level(float level) { if (g_engine) g_engine->setOsc2Level(level); }
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

// LFO
void setLFORate(float hz) { if (g_engine) g_engine->setLFORate(hz); }
void setLFODepth(float depth) { if (g_engine) g_engine->setLFODepth(depth); }
void setLFOWaveform(int wf) { if (g_engine) g_engine->setLFOWaveform(wf); }
void setLFOTarget(int target) { if (g_engine) g_engine->setLFOTarget(target); }

// Mix
void setDryLevel(float level) { if (g_engine) g_engine->setDryLevel(level); }
void setLoopLevel(float level) { if (g_engine) g_engine->setLoopLevel(level); }
void setMasterLevel(float level) { if (g_engine) g_engine->setMasterLevel(level); }

// Envelope
void setRecAttack(float seconds) { if (g_engine) g_engine->setRecAttack(seconds); }
void setRecDecay(float seconds) { if (g_engine) g_engine->setRecDecay(seconds); }

// Effects
void setDelayTime(float seconds) { if (g_engine) g_engine->setDelayTime(seconds); }
void setDelayFeedback(float fb) { if (g_engine) g_engine->setDelayFeedback(fb); }
void setDelayMix(float mix) { if (g_engine) g_engine->setDelayMix(mix); }
void setReverbDecay(float decay) { if (g_engine) g_engine->setReverbDecay(decay); }
void setReverbDamping(float damping) { if (g_engine) g_engine->setReverbDamping(damping); }
void setReverbMix(float mix) { if (g_engine) g_engine->setReverbMix(mix); }

// Sequencer
void setSeqEnabled(int enabled) { if (g_engine) g_engine->setSeqEnabled(enabled != 0); }
void setSeqBPM(float bpm) { if (g_engine) g_engine->setSeqBPM(bpm); }
void setSeq1Division(int divIdx) { if (g_engine) g_engine->setSeq1Division(divIdx); }
void setSeq1StepPitch(int step, int midiNote) { if (g_engine) g_engine->setSeq1StepPitch(step, midiNote); }
void setSeq1StepGate(int step, int gate) { if (g_engine) g_engine->setSeq1StepGate(step, gate != 0); }
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
