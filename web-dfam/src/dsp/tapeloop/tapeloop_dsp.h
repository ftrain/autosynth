/**
 * @file tapeloop_dsp.h
 * @brief TapeLoop DSP engine for WebAssembly
 *
 * Tape loop drone synthesizer with:
 * - 2 oscillators with waveform selection
 * - FM modulation between oscillators
 * - Tape loop buffer with recording/playback
 * - Tape degradation effects (wobble, saturation, age, hiss)
 * - Dual 4-step sequencers
 * - Effects: delay, reverb, compressor
 */

#pragma once

#include <array>
#include <vector>
#include <cmath>
#include <algorithm>
#include <random>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace tapeloop {

//==============================================================================
// Basic DSP Components
//==============================================================================

class ADEnvelope {
public:
    void setSampleRate(float sr) { sampleRate = sr; updateCoefficients(); }
    void setAttack(float seconds) { attackTime = std::max(0.005f, seconds); updateCoefficients(); }
    void setDecay(float seconds) { decayTime = std::max(0.01f, seconds); updateCoefficients(); }

    void trigger() { inAttack = true; inDecay = false; }
    void release() { inAttack = false; inDecay = true; }

    float process() {
        if (inAttack) {
            currentLevel += attackIncrement;
            if (currentLevel >= 1.0f) { currentLevel = 1.0f; inAttack = false; }
        } else if (inDecay) {
            currentLevel *= decayCoef;
            if (currentLevel < 0.0001f) { currentLevel = 0.0f; inDecay = false; }
        }
        return currentLevel;
    }

    bool isActive() const { return inAttack || inDecay || currentLevel > 0.0001f; }

private:
    void updateCoefficients() {
        attackIncrement = 1.0f / (attackTime * sampleRate);
        decayCoef = std::exp(-4.0f / (decayTime * sampleRate));
    }

    float sampleRate = 44100.0f;
    float attackTime = 0.01f, decayTime = 0.5f;
    float attackIncrement = 0.001f, decayCoef = 0.99f;
    float currentLevel = 0.0f;
    bool inAttack = false, inDecay = false;
};

class SimpleLFO {
public:
    void setSampleRate(float sr) { sampleRate = sr; }
    void setRate(float hz) { rate = std::clamp(hz, 0.01f, 50.0f); }
    void setWaveform(int wf) { waveform = wf; }

    float process() {
        float output = 0.0f;
        switch (waveform) {
            case 0: output = std::sin(phase * 6.283185f); break;
            case 1: output = 4.0f * std::abs(phase - 0.5f) - 1.0f; break;
            case 2: output = 2.0f * phase - 1.0f; break;
            case 3: output = phase < 0.5f ? 1.0f : -1.0f; break;
            default: output = std::sin(phase * 6.283185f);
        }
        phase += rate / sampleRate;
        if (phase >= 1.0f) phase -= 1.0f;
        return output;
    }

private:
    float phase = 0.0f, rate = 1.0f, sampleRate = 44100.0f;
    int waveform = 0;
};

class SimpleOscillator {
public:
    void setFrequency(double freqHz, double sr) {
        frequency = freqHz;
        sampleRate = sr;
        basePhaseIncrement = frequency / sampleRate;
        phaseIncrement = basePhaseIncrement;
    }

    void resetPhase() { phase = 0.0; }

    float process(int waveform, float fmMod = 0.0f) {
        float output = 0.0f;
        phaseIncrement = std::max(0.0, std::min(basePhaseIncrement + static_cast<double>(fmMod), 0.5));

        switch (waveform) {
            case 0: // Sine
                output = static_cast<float>(std::sin(phase * 2.0 * M_PI));
                break;
            case 1: // Triangle
                output = static_cast<float>(4.0 * std::abs(phase - 0.5) - 1.0);
                break;
            case 2: // Saw with PolyBLEP
            default: {
                double t = phase;
                output = static_cast<float>(2.0 * t - 1.0);
                // PolyBLEP
                double dt = phaseIncrement;
                if (dt > 0.0001) {
                    if (t < dt) { t /= dt; output -= static_cast<float>(t + t - t * t - 1.0); }
                    else if (t > 1.0 - dt) { t = (t - 1.0) / dt; output -= static_cast<float>(t * t + t + t + 1.0); }
                }
                break;
            }
        }

        phase += phaseIncrement;
        if (phase >= 1.0) phase -= 1.0;
        if (phase < 0.0) phase += 1.0;
        return output;
    }

private:
    double phase = 0.0, phaseIncrement = 0.0, basePhaseIncrement = 0.0;
    double frequency = 440.0, sampleRate = 44100.0;
};

class StereoDelay {
public:
    void prepare(double sr) {
        sampleRate = sr;
        bufferSize = static_cast<size_t>(sr * 4.0);
        bufferL.resize(bufferSize, 0.0f);
        bufferR.resize(bufferSize, 0.0f);
        writePos = 0;
    }

    void setTime(float seconds) { delayTime = std::clamp(seconds, 0.001f, 4.0f); updateDelaySamples(); }
    void setFeedback(float fb) { feedback = std::clamp(fb, 0.0f, 0.95f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    void process(float& left, float& right) {
        size_t readPos = (writePos + bufferSize - delaySamples) % bufferSize;
        float delayedL = bufferL[readPos], delayedR = bufferR[readPos];
        bufferL[writePos] = left + delayedL * feedback;
        bufferR[writePos] = right + delayedR * feedback;
        left = left * (1.0f - mix) + delayedL * mix;
        right = right * (1.0f - mix) + delayedR * mix;
        writePos = (writePos + 1) % bufferSize;
    }

private:
    void updateDelaySamples() {
        delaySamples = static_cast<size_t>(delayTime * sampleRate);
        if (delaySamples >= bufferSize) delaySamples = bufferSize - 1;
    }

    double sampleRate = 44100.0;
    std::vector<float> bufferL, bufferR;
    size_t bufferSize = 176400, writePos = 0, delaySamples = 22050;
    float delayTime = 0.5f, feedback = 0.3f, mix = 0.0f;
};

class SimpleReverb {
public:
    void prepare(double sr) {
        sampleRate = sr;
        for (int i = 0; i < 4; ++i) {
            apDelays[i].resize(static_cast<size_t>(sr * apTimes[i]), 0.0f);
            apPos[i] = 0;
        }
        for (int i = 0; i < 8; ++i) {
            combDelays[i].resize(static_cast<size_t>(sr * combTimes[i]), 0.0f);
            combPos[i] = 0;
            combFilters[i] = 0.0f;
        }
    }

    void setDecay(float d) { decay = std::clamp(d, 0.1f, 10.0f); }
    void setMix(float m) { float l = std::clamp(m, 0.0f, 1.0f); mix = l * l * l * l; }
    void setDamping(float d) { damping = std::clamp(d, 0.0f, 1.0f); }

    void process(float& left, float& right) {
        float input = (left + right) * 0.5f;
        float diffused = input;
        for (int i = 0; i < 4; ++i) diffused = processAllpass(i, diffused);

        float reverbL = 0.0f, reverbR = 0.0f;
        float combGain = std::pow(0.001f, 1.0f / (decay * static_cast<float>(sampleRate)));
        for (int i = 0; i < 4; ++i) reverbL += processComb(i, diffused, combGain);
        for (int i = 4; i < 8; ++i) reverbR += processComb(i, diffused, combGain);

        reverbL *= 0.25f; reverbR *= 0.25f;
        left = left * (1.0f - mix) + reverbL * mix;
        right = right * (1.0f - mix) + reverbR * mix;
    }

private:
    float processAllpass(int idx, float input) {
        float delayed = apDelays[idx][apPos[idx]];
        float output = -input + delayed;
        apDelays[idx][apPos[idx]] = input + delayed * 0.5f;
        apPos[idx] = (apPos[idx] + 1) % apDelays[idx].size();
        return output;
    }

    float processComb(int idx, float input, float gain) {
        float delayed = combDelays[idx][combPos[idx]];
        combFilters[idx] = delayed * (1.0f - damping) + combFilters[idx] * damping;
        combDelays[idx][combPos[idx]] = input + combFilters[idx] * gain;
        combPos[idx] = (combPos[idx] + 1) % combDelays[idx].size();
        return delayed;
    }

    double sampleRate = 44100.0;
    float decay = 2.0f, mix = 0.0f, damping = 0.5f;
    float apTimes[4] = {0.0051f, 0.0076f, 0.01f, 0.0123f};
    std::vector<float> apDelays[4];
    size_t apPos[4] = {0, 0, 0, 0};
    float combTimes[8] = {0.0297f, 0.0371f, 0.0411f, 0.0437f, 0.0299f, 0.0373f, 0.0413f, 0.0439f};
    std::vector<float> combDelays[8];
    size_t combPos[8] = {0, 0, 0, 0, 0, 0, 0, 0};
    float combFilters[8] = {0, 0, 0, 0, 0, 0, 0, 0};
};

class StepSequencer {
public:
    static constexpr int NUM_STEPS = 4;

    void setSampleRate(float sr) { sampleRate = sr; }
    void setBPM(float bpm) { this->bpm = bpm; }
    void setDivisionIndex(int idx) { divisionIndex = std::clamp(idx, 0, 15); }
    void setStepPitch(int step, int midiNote) { if (step >= 0 && step < NUM_STEPS) stepPitches[step] = std::clamp(midiNote, 0, 127); }
    void setStepGate(int step, bool gate) { if (step >= 0 && step < NUM_STEPS) stepGates[step] = gate; }
    int getStepPitch(int step) const { return (step >= 0 && step < NUM_STEPS) ? stepPitches[step] : 60; }
    bool getStepGate(int step) const { return (step >= 0 && step < NUM_STEPS) ? stepGates[step] : true; }
    int getCurrentStep() const { return currentStep; }
    void reset() { phase = 0.0f; currentStep = 0; }

    bool process(int& outMidiNote, bool& outGate) {
        bool stepped = false;
        static constexpr float CLOCK_DIVISIONS[] = {
            128.0f, 64.0f, 32.0f, 16.0f, 8.0f, 4.0f, 2.0f, 1.0f,
            0.5f, 0.25f, 0.125f, 0.0625f, 0.03125f, 0.015625f, 0.0078125f, 0.00390625f
        };

        float beatsPerSecond = bpm / 60.0f;
        float stepsPerSecond = beatsPerSecond * CLOCK_DIVISIONS[divisionIndex] / 4.0f;
        float phaseIncrement = stepsPerSecond / sampleRate;

        phase += phaseIncrement;
        if (phase >= 1.0f) { phase -= 1.0f; currentStep = (currentStep + 1) % NUM_STEPS; stepped = true; }

        outMidiNote = stepPitches[currentStep];
        outGate = stepGates[currentStep];
        return stepped;
    }

    static float midiToFrequency(int midiNote) { return 440.0f * std::pow(2.0f, (midiNote - 69) / 12.0f); }

private:
    float sampleRate = 44100.0f, bpm = 120.0f, phase = 0.0f;
    int divisionIndex = 4, currentStep = 0;
    int stepPitches[NUM_STEPS] = {60, 60, 60, 60};
    bool stepGates[NUM_STEPS] = {true, true, true, true};
};

//==============================================================================
// Main TapeLoop Engine
//==============================================================================

class TapeLoopEngine {
public:
    static constexpr float MAX_LOOP_SECONDS = 30.0f;
    static constexpr size_t MAX_BUFFER_SIZE = static_cast<size_t>(MAX_LOOP_SECONDS * 48000);

    TapeLoopEngine() : rng(42), noiseDist(-1.0f, 1.0f) {
        tapeBufferL.resize(MAX_BUFFER_SIZE, 0.0f);
        tapeBufferR.resize(MAX_BUFFER_SIZE, 0.0f);
    }

    void prepare(double sr, int /*maxBlockSize*/) {
        sampleRate = static_cast<float>(sr);
        osc1.setFrequency(110.0, sr);
        osc2.setFrequency(110.0, sr);
        recordEnvelope.setSampleRate(sampleRate);
        tapeCharLFO.setSampleRate(sampleRate);
        sequencer1.setSampleRate(sampleRate);
        sequencer2.setSampleRate(sampleRate);
        panLFO.setSampleRate(sampleRate);
        panLFO.setWaveform(0);
        maxBufferSamples = static_cast<size_t>(MAX_LOOP_SECONDS * sampleRate);
        delay.prepare(sr);
        reverb.prepare(sr);
    }

    void noteOn(int note, float velocity) {
        bool wasRecording = isRecording;
        isRecording = true;
        currentVelocity = velocity;
        if (!wasRecording) recordEnvelope.trigger();
        float baseFreq = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
        updateOscillatorFrequencies(baseFreq);
        activeNote = note;
    }

    void noteOff(int note) {
        if (note == activeNote) {
            isRecording = false;
            recordEnvelope.release();
            activeNote = -1;
        }
    }

    void clearTape() {
        std::fill(tapeBufferL.begin(), tapeBufferL.end(), 0.0f);
        std::fill(tapeBufferR.begin(), tapeBufferR.end(), 0.0f);
    }

    void renderBlock(float* outputL, float* outputR, int numSamples) {
        size_t loopSamples = static_cast<size_t>(loopLength * sampleRate);
        loopSamples = std::clamp(loopSamples, size_t(1), maxBufferSamples);

        for (int i = 0; i < numSamples; ++i) {
            // LFO modulation
            float lfoValue = tapeCharLFO.process();
            float lfoMod = lfoValue * lfoDepth;
            float modulatedSaturation = saturation, modulatedAge = tapeAge;
            float modulatedWobbleDepth = wobbleDepth, modulatedDegrade = tapeDegrade;

            switch (lfoTarget) {
                case 0: modulatedSaturation = std::clamp(saturation + lfoMod * 0.5f, 0.0f, 1.0f); break;
                case 1: modulatedAge = std::clamp(tapeAge + lfoMod * 0.5f, 0.0f, 1.0f); break;
                case 2: modulatedWobbleDepth = std::clamp(wobbleDepth + lfoMod * 0.5f, 0.0f, 1.0f); break;
                case 3: modulatedDegrade = std::clamp(tapeDegrade + lfoMod * 0.5f, 0.0f, 1.0f); break;
            }

            // Sequencers
            int seq1MidiNote = 60, seq2MidiNote = 60;
            bool seq1Gate = true, seq2Gate = true;

            if (seqEnabled) {
                sequencer1.process(seq1MidiNote, seq1Gate);
                sequencer2.process(seq2MidiNote, seq2Gate);

                float freq1 = StepSequencer::midiToFrequency(seq1MidiNote) * std::pow(2.0f, osc1Tune / 12.0f);
                osc1.setFrequency(freq1, sampleRate);

                float freq2 = StepSequencer::midiToFrequency(seq2MidiNote) * std::pow(2.0f, (osc2Tune + osc2Detune / 100.0f) / 12.0f);
                osc2.setFrequency(freq2, sampleRate);
            }

            // Envelope
            float envLevel = recordEnvelope.process();

            // Pan LFO
            float panLFOValue = panLFO.process();
            float panAmount = panLFOValue * panDepth;
            float panLeft = std::sqrt(0.5f * (1.0f - panAmount));
            float panRight = std::sqrt(0.5f * (1.0f + panAmount));

            // Oscillators
            float oscOutL = 0.0f, oscOutR = 0.0f;
            bool shouldPlay = seqEnabled || isRecording || recordEnvelope.isActive();

            if (shouldPlay) {
                float osc1GateLevel = (!seqEnabled || seq1Gate) ? 1.0f : 0.0f;
                float osc2GateLevel = (!seqEnabled || seq2Gate) ? 1.0f : 0.0f;

                float osc1Out = osc1.process(osc1Waveform) * osc1Level * osc1GateLevel;
                float fmMod = osc1Out * fmAmount * 0.1f;
                float osc2Out = osc2.process(osc2Waveform, fmMod) * osc2Level * osc2GateLevel;

                float levelMod = seqEnabled ? recordLevel : (currentVelocity * recordLevel * envLevel);
                float oscMono = (osc1Out + osc2Out) * levelMod;

                oscOutL = oscMono * panLeft;
                oscOutR = oscMono * panRight;
            }

            // Tape read with wobble
            wobblePhase += wobbleRate / sampleRate;
            if (wobblePhase >= 1.0f) wobblePhase -= 1.0f;
            float wobbleOffset = std::sin(wobblePhase * 6.283185f) * modulatedWobbleDepth * 100.0f;

            float oscMono = (oscOutL + oscOutR) * 0.5f;
            float voiceFMOffset = oscMono * voiceLoopFM * 1000.0f;

            float readPosF = static_cast<float>(writePos) - wobbleOffset - voiceFMOffset;
            while (readPosF < 0) readPosF += static_cast<float>(loopSamples);
            while (readPosF >= static_cast<float>(loopSamples)) readPosF -= static_cast<float>(loopSamples);

            size_t readPos0 = static_cast<size_t>(readPosF) % loopSamples;
            size_t readPos1 = (readPos0 + 1) % loopSamples;
            float frac = readPosF - std::floor(readPosF);

            float tapeL = tapeBufferL[readPos0] * (1.0f - frac) + tapeBufferL[readPos1] * frac;
            float tapeR = tapeBufferR[readPos0] * (1.0f - frac) + tapeBufferR[readPos1] * frac;

            // Tape degradation
            float satAmount = modulatedSaturation * 4.0f + 1.0f;
            tapeL = std::tanh(tapeL * satAmount) / std::tanh(satAmount);
            tapeR = std::tanh(tapeR * satAmount) / std::tanh(satAmount);

            float ageCutoff = 1.0f - (modulatedAge * 0.9f);
            float ageCoeff = ageCutoff * ageCutoff;
            ageFilterStateL += ageCoeff * (tapeL - ageFilterStateL);
            ageFilterStateR += ageCoeff * (tapeR - ageFilterStateR);
            tapeL = ageFilterStateL;
            tapeR = ageFilterStateR;

            float noise = noiseDist(rng) * tapeHiss * 0.02f;
            tapeL += noise;
            tapeR += noise;

            if (modulatedDegrade > 0.0f) {
                float degradeCoeff = 1.0f - (modulatedDegrade * 0.3f);
                degradeFilterStateL += degradeCoeff * (tapeL - degradeFilterStateL);
                degradeFilterStateR += degradeCoeff * (tapeR - degradeFilterStateR);

                float degradeMix = modulatedDegrade * 0.5f;
                tapeL = tapeL * (1.0f - degradeMix) + degradeFilterStateL * degradeMix;
                tapeR = tapeR * (1.0f - degradeMix) + degradeFilterStateR * degradeMix;

                float degradeNoise = noiseDist(rng) * modulatedDegrade * 0.005f;
                tapeL += degradeNoise;
                tapeR += degradeNoise;
            }

            // Tape write
            float effectiveFeedback = loopFeedback * (1.0f - modulatedDegrade * 0.15f);
            float fmReadL = tapeBufferL[readPos0] * (1.0f - frac) + tapeBufferL[readPos1] * frac;
            float fmReadR = tapeBufferR[readPos0] * (1.0f - frac) + tapeBufferR[readPos1] * frac;

            float newL = std::tanh(fmReadL * effectiveFeedback + oscOutL);
            float newR = std::tanh(fmReadR * effectiveFeedback + oscOutR);

            tapeBufferL[writePos] = newL;
            tapeBufferR[writePos] = newR;
            writePos = (writePos + 1) % loopSamples;

            // Output mix
            float dryL = oscOutL * dryLevel;
            float dryR = oscOutR * dryLevel;
            float wetL = tapeL * loopOutputLevel;
            float wetR = tapeR * loopOutputLevel;

            float outL = (dryL + wetL) * masterLevel;
            float outR = (dryR + wetR) * masterLevel;

            // Effects
            delay.process(outL, outR);
            reverb.process(outL, outR);

            outputL[i] = outL;
            outputR[i] = outR;
        }
    }

    // Parameter setters
    void setOsc1Waveform(int waveform) { osc1Waveform = waveform; }
    void setOsc1Tune(float semitones) { osc1Tune = semitones; updateOscillatorFrequencies(baseFrequency); }
    void setOsc1Level(float level) { osc1Level = level; }
    void setOsc2Waveform(int waveform) { osc2Waveform = waveform; }
    void setOsc2Tune(float semitones) { osc2Tune = semitones; updateOscillatorFrequencies(baseFrequency); }
    void setOsc2Detune(float cents) { osc2Detune = cents; updateOscillatorFrequencies(baseFrequency); }
    void setOsc2Level(float level) { osc2Level = level; }
    void setLoopLength(float seconds) { loopLength = std::clamp(seconds, 0.1f, MAX_LOOP_SECONDS); }
    void setLoopFeedback(float fb) { loopFeedback = std::clamp(fb, 0.0f, 0.99f); }
    void setRecordLevel(float level) { recordLevel = level; }
    void setSaturation(float sat) { saturation = sat; }
    void setWobbleRate(float rate) { wobbleRate = rate; }
    void setWobbleDepth(float depth) { wobbleDepth = depth; }
    void setTapeHiss(float hiss) { tapeHiss = hiss; }
    void setTapeAge(float age) { tapeAge = age; }
    void setDryLevel(float level) { dryLevel = level; }
    void setLoopLevel(float level) { loopOutputLevel = level; }
    void setMasterLevel(float level) { masterLevel = level; }
    void setRecAttack(float seconds) { recordEnvelope.setAttack(seconds); }
    void setRecDecay(float seconds) { recordEnvelope.setDecay(seconds); }
    void setFMAmount(float amount) { fmAmount = std::clamp(amount, 0.0f, 1.0f); }
    void setTapeDegrade(float degrade) { tapeDegrade = std::clamp(degrade, 0.0f, 1.0f); }
    void setLFORate(float hz) { tapeCharLFO.setRate(hz); }
    void setLFODepth(float depth) { lfoDepth = std::clamp(depth, 0.0f, 1.0f); }
    void setLFOWaveform(int wf) { tapeCharLFO.setWaveform(wf); }
    void setLFOTarget(int target) { lfoTarget = std::clamp(target, 0, 3); }
    void setDelayTime(float seconds) { delay.setTime(seconds); }
    void setDelayFeedback(float fb) { delay.setFeedback(fb); }
    void setDelayMix(float m) { delay.setMix(m); }
    void setReverbDecay(float d) { reverb.setDecay(d); }
    void setReverbMix(float m) { reverb.setMix(m); }
    void setReverbDamping(float d) { reverb.setDamping(d); }
    void setSeqEnabled(bool enabled) { seqEnabled = enabled; }
    void setSeqBPM(float bpm) { sequencer1.setBPM(bpm); sequencer2.setBPM(bpm); }
    void setSeq1Division(int divIdx) { sequencer1.setDivisionIndex(divIdx); }
    void setSeq1StepPitch(int step, int midiNote) { sequencer1.setStepPitch(step, midiNote); }
    void setSeq1StepGate(int step, bool gate) { sequencer1.setStepGate(step, gate); }
    void setSeq2Division(int divIdx) { sequencer2.setDivisionIndex(divIdx); }
    void setSeq2StepPitch(int step, int midiNote) { sequencer2.setStepPitch(step, midiNote); }
    void setSeq2StepGate(int step, bool gate) { sequencer2.setStepGate(step, gate); }
    void setVoiceLoopFM(float amount) { voiceLoopFM = std::clamp(amount, 0.0f, 1.0f); }
    void setPanSpeed(float hz) { panSpeed = hz; panLFO.setRate(hz); }
    void setPanDepth(float depth) { panDepth = std::clamp(depth, 0.0f, 1.0f); }

    int getSeq1CurrentStep() const { return sequencer1.getCurrentStep(); }
    int getSeq2CurrentStep() const { return sequencer2.getCurrentStep(); }

private:
    void updateOscillatorFrequencies(float baseFreq) {
        baseFrequency = baseFreq;
        double freq1 = baseFreq * std::pow(2.0f, osc1Tune / 12.0f);
        osc1.setFrequency(freq1, sampleRate);
        double freq2 = baseFreq * std::pow(2.0f, (osc2Tune + osc2Detune / 100.0f) / 12.0f);
        osc2.setFrequency(freq2, sampleRate);
    }

    // Oscillators
    SimpleOscillator osc1, osc2;

    // Tape buffer
    std::vector<float> tapeBufferL, tapeBufferR;
    size_t writePos = 0, maxBufferSamples = 0;

    // State
    float wobblePhase = 0.0f;
    float ageFilterStateL = 0.0f, ageFilterStateR = 0.0f;
    float degradeFilterStateL = 0.0f, degradeFilterStateR = 0.0f;
    std::mt19937 rng;
    std::uniform_real_distribution<float> noiseDist;

    float sampleRate = 44100.0f, baseFrequency = 110.0f;
    bool isRecording = false;
    float currentVelocity = 0.0f;
    int activeNote = -1;

    // Parameters
    int osc1Waveform = 0, osc2Waveform = 0;
    float osc1Tune = 0.0f, osc2Tune = 0.0f, osc2Detune = 7.0f;
    float osc1Level = 0.7f, osc2Level = 0.5f;
    float loopLength = 4.0f, loopFeedback = 0.85f, recordLevel = 0.5f;
    float saturation = 0.3f, wobbleRate = 0.5f, wobbleDepth = 0.2f;
    float tapeHiss = 0.1f, tapeAge = 0.3f, tapeDegrade = 0.0f;
    float dryLevel = 0.3f, loopOutputLevel = 0.7f, masterLevel = 0.8f;
    float fmAmount = 0.0f, lfoDepth = 0.0f;
    int lfoTarget = 0;
    float voiceLoopFM = 0.0f, panSpeed = 0.5f, panDepth = 0.0f;

    // Components
    ADEnvelope recordEnvelope;
    SimpleLFO tapeCharLFO, panLFO;
    StepSequencer sequencer1, sequencer2;
    bool seqEnabled = false;
    StereoDelay delay;
    SimpleReverb reverb;
};

} // namespace tapeloop
