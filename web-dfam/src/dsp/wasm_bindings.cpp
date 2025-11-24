/**
 * @file wasm_bindings.cpp
 * @brief Plain C exports for DFAM DSP (AudioWorklet compatible)
 *
 * Uses extern "C" exports instead of Embind for direct WASM usage in AudioWorklet
 */

#include "dfam_dsp.h"

// Global engine instance
static dfam::SynthEngine* g_engine = nullptr;

extern "C" {

// Initialize the engine
void init(int sampleRate) {
    if (g_engine) delete g_engine;
    g_engine = new dfam::SynthEngine();
    g_engine->prepare(static_cast<double>(sampleRate), 128);
}

// Process audio block - takes pointers to output buffers
void process(float* outputL, float* outputR, int numSamples) {
    if (!g_engine) return;
    g_engine->renderBlock(outputL, outputR, numSamples);
}

// Transport
void setRunning(int running) {
    if (g_engine) g_engine->setRunning(running != 0);
}

int isRunning() {
    return g_engine ? (g_engine->isRunning() ? 1 : 0) : 0;
}

void setTempo(float bpm) {
    if (g_engine) g_engine->setTempo(bpm);
}

void setClockDivider(float divider) {
    if (g_engine) g_engine->setClockDivider(divider);
}

// Sequencer
void setStepPitch(int step, float semitones) {
    if (g_engine) g_engine->setStepPitch(step, semitones);
}

void setStepVelocity(int step, float velocity) {
    if (g_engine) g_engine->setStepVelocity(step, velocity);
}

int getCurrentStep() {
    return g_engine ? g_engine->getCurrentStep() : 0;
}

// VCO
void setVCO1Frequency(float freq) {
    if (g_engine) g_engine->setVCO1Frequency(freq);
}

void setVCO2Frequency(float freq) {
    if (g_engine) g_engine->setVCO2Frequency(freq);
}

void setVCO1Level(float level) {
    if (g_engine) g_engine->setVCO1Level(level);
}

void setVCO2Level(float level) {
    if (g_engine) g_engine->setVCO2Level(level);
}

void setVCO1Waveform(int w) {
    if (g_engine) g_engine->setVCO1Waveform(w);
}

void setVCO2Waveform(int w) {
    if (g_engine) g_engine->setVCO2Waveform(w);
}

void setFMAmount(float amount) {
    if (g_engine) g_engine->setFMAmount(amount);
}

void setNoiseLevel(float level) {
    if (g_engine) g_engine->setNoiseLevel(level);
}

// Filter
void setFilterCutoff(float freq) {
    if (g_engine) g_engine->setFilterCutoff(freq);
}

void setFilterResonance(float res) {
    if (g_engine) g_engine->setFilterResonance(res);
}

void setFilterEnvAmount(float amount) {
    if (g_engine) g_engine->setFilterEnvAmount(amount);
}

void setFilterMode(int mode) {
    if (g_engine) g_engine->setFilterMode(mode);
}

// Filter LFO
void setFilterLfoRate(float hz) {
    if (g_engine) g_engine->setFilterLfoRate(hz);
}

void setFilterLfoClockSync(float divider) {
    if (g_engine) g_engine->setFilterLfoClockSync(divider);
}

void setFilterLfoAmount(float amount) {
    if (g_engine) g_engine->setFilterLfoAmount(amount);
}

// Envelopes
void setPitchEnvAttack(float t) {
    if (g_engine) g_engine->setPitchEnvAttack(t);
}

void setPitchEnvDecay(float t) {
    if (g_engine) g_engine->setPitchEnvDecay(t);
}

void setPitchEnvAmount(float semitones) {
    if (g_engine) g_engine->setPitchEnvAmount(semitones);
}

void setVCFVCAEnvAttack(float t) {
    if (g_engine) g_engine->setVCFVCAEnvAttack(t);
}

void setVCFVCAEnvDecay(float t) {
    if (g_engine) g_engine->setVCFVCAEnvDecay(t);
}

// Effects
void setSaturatorDrive(float drive) {
    if (g_engine) g_engine->setSaturatorDrive(drive);
}

void setSaturatorMix(float mix) {
    if (g_engine) g_engine->setSaturatorMix(mix);
}

void setDelayTime(float seconds) {
    if (g_engine) g_engine->setDelayTime(seconds);
}

void setDelayClockSync(float divider) {
    if (g_engine) g_engine->setDelayClockSync(divider);
}

void setDelayFeedback(float fb) {
    if (g_engine) g_engine->setDelayFeedback(fb);
}

void setDelayMix(float mix) {
    if (g_engine) g_engine->setDelayMix(mix);
}

void setReverbDecay(float decay) {
    if (g_engine) g_engine->setReverbDecay(decay);
}

void setReverbDamping(float damping) {
    if (g_engine) g_engine->setReverbDamping(damping);
}

void setReverbMix(float mix) {
    if (g_engine) g_engine->setReverbMix(mix);
}

// Master
void setMasterVolume(float volumeDb) {
    if (g_engine) g_engine->setMasterVolume(volumeDb);
}

} // extern "C"
