/**
 * @file dfam_dsp.h
 * @brief DFAM DSP Engine - Pure C++ for WebAssembly
 *
 * A percussion synthesizer inspired by the Moog DFAM.
 * No JUCE or SST dependencies - compatible with Emscripten.
 */

#pragma once

#include <cmath>
#include <random>
#include <array>
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace dfam {

/**
 * @brief White noise generator
 */
class NoiseGenerator {
public:
    float process() {
        return distribution(generator);
    }

private:
    std::mt19937 generator{std::random_device{}()};
    std::uniform_real_distribution<float> distribution{-1.0f, 1.0f};
};

/**
 * @brief Simple LFO with multiple waveforms
 */
class LFO {
public:
    enum Waveform { SINE, TRIANGLE, SAW, SQUARE };

    void prepare(double sr) {
        sampleRate = sr;
        phase = 0.0;
        updatePhaseIncrement();
    }

    void setRate(float hz) {
        rate = std::clamp(hz, 0.01f, 20.0f);
        updatePhaseIncrement();
    }

    void setClockSyncRate(float bpm, float divider) {
        float beatsPerSecond = bpm / 60.0f;
        float cyclesPerSecond = beatsPerSecond * divider;
        phaseIncrement = cyclesPerSecond / sampleRate;
    }

    void setWaveform(Waveform w) { waveform = w; }
    void setWaveform(int w) { waveform = static_cast<Waveform>(std::clamp(w, 0, 3)); }

    float getValue() const {
        return computeValue(phase);
    }

    float process() {
        float output = computeValue(phase);
        phase += phaseIncrement;
        if (phase >= 1.0) phase -= 1.0;
        return output;
    }

    void reset() { phase = 0.0; }

private:
    void updatePhaseIncrement() {
        phaseIncrement = rate / sampleRate;
    }

    float computeValue(double p) const {
        switch (waveform) {
            case SINE:
                return std::sin(2.0f * static_cast<float>(M_PI) * static_cast<float>(p));
            case TRIANGLE:
                return 4.0f * std::abs(static_cast<float>(p) - 0.5f) - 1.0f;
            case SAW:
                return 2.0f * static_cast<float>(p) - 1.0f;
            case SQUARE:
                return p < 0.5 ? 1.0f : -1.0f;
            default:
                return 0.0f;
        }
    }

    double sampleRate = 44100.0;
    double phase = 0.0;
    double phaseIncrement = 0.0;
    float rate = 1.0f;
    Waveform waveform = SINE;
};

/**
 * @brief Oscillator with multiple waveforms
 */
class Oscillator {
public:
    enum Waveform { SAW, SQUARE, TRIANGLE, SINE };

    void prepare(double sr) {
        sampleRate = sr;
        phase = 0.0;
    }

    void setFrequency(float freq) {
        frequency = std::clamp(freq, 20.0f, 20000.0f);
        phaseIncrement = frequency / sampleRate;
    }

    void setWaveform(Waveform w) { waveform = w; }
    void setWaveform(int w) { waveform = static_cast<Waveform>(std::clamp(w, 0, 3)); }

    void resetPhase() { phase = 0.0; }

    float process() {
        float output = 0.0f;

        switch (waveform) {
            case SAW:
                output = 2.0f * static_cast<float>(phase) - 1.0f;
                break;
            case SQUARE:
                output = phase < 0.5 ? 1.0f : -1.0f;
                break;
            case TRIANGLE:
                output = 4.0f * std::abs(static_cast<float>(phase) - 0.5f) - 1.0f;
                break;
            case SINE:
                output = std::sin(2.0f * static_cast<float>(M_PI) * static_cast<float>(phase));
                break;
        }

        phase += phaseIncrement;
        if (phase >= 1.0) phase -= 1.0;

        return output;
    }

private:
    double sampleRate = 44100.0;
    double phase = 0.0;
    double phaseIncrement = 0.0;
    float frequency = 440.0f;
    Waveform waveform = SAW;
};

/**
 * @brief AD (Attack/Decay) envelope with exponential curves
 */
class ADEnvelope {
public:
    enum Stage { IDLE, ATTACK, DECAY };

    void prepare(double sr) {
        sampleRate = sr;
        updateCoefficients();
    }

    void setAttack(float seconds) {
        attackTime = std::max(0.001f, seconds);
        updateCoefficients();
    }

    void setDecay(float seconds) {
        decayTime = std::max(0.001f, seconds);
        updateCoefficients();
    }

    void trigger() {
        stage = ATTACK;
        if (value < 0.001f) value = 0.0f;
    }

    float process() {
        switch (stage) {
            case ATTACK:
                value += attackCoef * (1.0f - value);
                if (value >= 0.999f) {
                    value = 1.0f;
                    stage = DECAY;
                }
                break;

            case DECAY:
                value *= decayCoef;
                if (value <= 0.001f) {
                    value = 0.0f;
                    stage = IDLE;
                }
                break;

            case IDLE:
            default:
                break;
        }
        return value;
    }

    bool isActive() const { return stage != IDLE; }

private:
    void updateCoefficients() {
        float attackSamples = attackTime * static_cast<float>(sampleRate);
        attackCoef = 1.0f - std::exp(-4.0f / attackSamples);

        float decaySamples = decayTime * static_cast<float>(sampleRate);
        decayCoef = std::exp(-4.0f / decaySamples);
    }

    double sampleRate = 44100.0;
    float attackTime = 0.01f;
    float decayTime = 0.5f;
    float attackCoef = 0.001f;
    float decayCoef = 0.9999f;
    float value = 0.0f;
    Stage stage = IDLE;
};

/**
 * @brief Simple ladder filter (LP/HP)
 */
class LadderFilter {
public:
    enum Mode { LOWPASS, HIGHPASS };

    void prepare(double sr) {
        sampleRate = sr;
        reset();
    }

    void reset() {
        for (int i = 0; i < 4; ++i) stage[i] = 0.0f;
    }

    void setCutoff(float freq) {
        cutoff = std::clamp(freq, 20.0f, 20000.0f);
        updateCoefficients();
    }

    void setResonance(float res) {
        resonance = std::clamp(res, 0.0f, 1.0f);
    }

    void setMode(Mode m) { mode = m; }
    void setMode(int m) { mode = static_cast<Mode>(std::clamp(m, 0, 1)); }

    float process(float input) {
        float feedback = resonance * 4.0f * (stage[3] - 0.5f * input);
        float x = input - feedback;

        for (int i = 0; i < 4; ++i) {
            stage[i] += g * (std::tanh(x) - std::tanh(stage[i]));
            x = stage[i];
        }

        if (mode == HIGHPASS)
            return input - stage[3];
        return stage[3];
    }

private:
    void updateCoefficients() {
        float fc = cutoff / static_cast<float>(sampleRate);
        g = std::tan(static_cast<float>(M_PI) * std::min(fc, 0.49f));
        g = g / (1.0f + g);
    }

    double sampleRate = 44100.0;
    float cutoff = 5000.0f;
    float resonance = 0.0f;
    float g = 0.0f;
    float stage[4] = {0, 0, 0, 0};
    Mode mode = LOWPASS;
};

/**
 * @brief Soft clipper / saturator
 */
class Saturator {
public:
    void setDrive(float d) { drive = std::clamp(d, 1.0f, 20.0f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    float process(float input) {
        float driven = std::tanh(input * drive);
        return input * (1.0f - mix) + driven * mix;
    }

private:
    float drive = 1.0f;
    float mix = 0.0f;
};

/**
 * @brief Stereo delay with tempo sync
 */
class StereoDelay {
public:
    void prepare(double sr) {
        sampleRate = sr;
        bufferSize = static_cast<size_t>(sr * 4.0);
        bufferL.resize(bufferSize, 0.0f);
        bufferR.resize(bufferSize, 0.0f);
        writePos = 0;
    }

    void setTime(float seconds) {
        delaySamples = static_cast<size_t>(std::clamp(seconds, 0.001f, 4.0f) * sampleRate);
        if (delaySamples >= bufferSize) delaySamples = bufferSize - 1;
    }

    void setClockSyncTime(float bpm, float divider) {
        float secondsPerBeat = 60.0f / bpm;
        float syncedTime = secondsPerBeat / divider;
        setTime(syncedTime);
    }

    void setFeedback(float fb) { feedback = std::clamp(fb, 0.0f, 0.95f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    void process(float& left, float& right) {
        size_t readPos = (writePos + bufferSize - delaySamples) % bufferSize;

        float delayedL = bufferL[readPos];
        float delayedR = bufferR[readPos];

        bufferL[writePos] = left + delayedL * feedback;
        bufferR[writePos] = right + delayedR * feedback;

        left = left * (1.0f - mix) + delayedL * mix;
        right = right * (1.0f - mix) + delayedR * mix;

        writePos = (writePos + 1) % bufferSize;
    }

private:
    double sampleRate = 44100.0;
    std::vector<float> bufferL;
    std::vector<float> bufferR;
    size_t bufferSize = 176400;
    size_t writePos = 0;
    size_t delaySamples = 22050;
    float feedback = 0.3f;
    float mix = 0.0f;
};

/**
 * @brief Simple Schroeder reverb
 */
class Reverb {
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
    void setDamping(float d) { damping = std::clamp(d, 0.0f, 1.0f); }

    void setMix(float m) {
        float linear = std::clamp(m, 0.0f, 1.0f);
        mix = linear * linear * linear * linear;
    }

    void process(float& left, float& right) {
        float input = (left + right) * 0.5f;

        float diffused = input;
        for (int i = 0; i < 4; ++i)
            diffused = processAllpass(i, diffused);

        float reverbL = 0.0f;
        float reverbR = 0.0f;
        float combGain = std::pow(0.001f, 1.0f / (decay * static_cast<float>(sampleRate)));

        for (int i = 0; i < 4; ++i)
            reverbL += processComb(i, diffused, combGain);
        for (int i = 4; i < 8; ++i)
            reverbR += processComb(i, diffused, combGain);

        reverbL *= 0.25f;
        reverbR *= 0.25f;

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
    float decay = 2.0f;
    float mix = 0.0f;
    float damping = 0.5f;

    float apTimes[4] = {0.0051f, 0.0076f, 0.01f, 0.0123f};
    std::vector<float> apDelays[4];
    size_t apPos[4] = {0, 0, 0, 0};

    float combTimes[8] = {0.0297f, 0.0371f, 0.0411f, 0.0437f,
                          0.0299f, 0.0373f, 0.0413f, 0.0439f};
    std::vector<float> combDelays[8];
    size_t combPos[8] = {0, 0, 0, 0, 0, 0, 0, 0};
    float combFilters[8] = {0, 0, 0, 0, 0, 0, 0, 0};
};

/**
 * @brief DFAM Voice
 */
class Voice {
public:
    void prepare(double sr) {
        sampleRate = sr;
        vco1.prepare(sr);
        vco2.prepare(sr);
        filter.prepare(sr);
        pitchEnv.prepare(sr);
        vcfVcaEnv.prepare(sr);

        pitchEnv.setAttack(0.001f);
        pitchEnv.setDecay(0.3f);
        vcfVcaEnv.setAttack(0.001f);
        vcfVcaEnv.setDecay(0.5f);
    }

    void trigger(float vel = 1.0f) {
        velocity = vel;
        vco1.resetPhase();
        vco2.resetPhase();
        pitchEnv.trigger();
        vcfVcaEnv.trigger();
        antiClickRamp = 0.0f;
        antiClickActive = true;
    }

    void render(float* outputL, float* outputR, int numSamples) {
        for (int i = 0; i < numSamples; ++i) {
            float pitchEnvValue = pitchEnv.process();
            float vcfVcaEnvValue = vcfVcaEnv.process();

            float vco1Freq = vco1BaseFreq * std::pow(2.0f, (pitchEnvValue * pitchEnvAmount + pitchOffset) / 12.0f);
            float vco2Freq = vco2BaseFreq * std::pow(2.0f, (pitchEnvValue * pitchEnvAmount + pitchOffset) / 12.0f);

            vco1.setFrequency(vco1Freq);
            float vco1Out = vco1.process();

            float fmMod = vco1Out * fmAmount * vco2Freq;
            vco2.setFrequency(vco2Freq + fmMod);
            float vco2Out = vco2.process();

            float noiseOut = noise.process();

            float mix = vco1Out * vco1Level + vco2Out * vco2Level + noiseOut * noiseLevel;

            float filterMod = filterCutoff + vcfVcaEnvValue * filterEnvAmount * 10000.0f;
            filter.setCutoff(std::clamp(filterMod, 20.0f, 20000.0f));
            float filtered = filter.process(mix);

            float output = filtered * vcfVcaEnvValue * velocity * masterLevel;

            if (antiClickActive) {
                antiClickRamp += antiClickIncrement;
                if (antiClickRamp >= 1.0f) {
                    antiClickRamp = 1.0f;
                    antiClickActive = false;
                }
                output *= antiClickRamp;
            }

            outputL[i] += output;
            outputR[i] += output;
        }
    }

    // VCO1
    void setVCO1Frequency(float freq) { vco1BaseFreq = freq; }
    void setVCO1Level(float level) { vco1Level = level; }
    void setVCO1Waveform(int w) { vco1.setWaveform(w); }

    // VCO2
    void setVCO2Frequency(float freq) { vco2BaseFreq = freq; }
    void setVCO2Level(float level) { vco2Level = level; }
    void setVCO2Waveform(int w) { vco2.setWaveform(w); }

    // FM
    void setFMAmount(float amount) { fmAmount = amount; }

    // Noise
    void setNoiseLevel(float level) { noiseLevel = level; }

    // Filter
    void setFilterCutoff(float freq) { filterCutoff = freq; filter.setCutoff(freq); }
    void setFilterResonance(float res) { filter.setResonance(res); }
    void setFilterEnvAmount(float amount) { filterEnvAmount = amount; }
    void setFilterMode(int mode) { filter.setMode(mode); }

    // Envelopes
    void setPitchEnvAttack(float t) { pitchEnv.setAttack(t); }
    void setPitchEnvDecay(float t) { pitchEnv.setDecay(t); }
    void setPitchEnvAmount(float semitones) { pitchEnvAmount = semitones; }
    void setVCFVCAEnvAttack(float t) { vcfVcaEnv.setAttack(t); }
    void setVCFVCAEnvDecay(float t) { vcfVcaEnv.setDecay(t); }

    // Pitch
    void setPitchOffset(float semitones) { pitchOffset = semitones; }
    void setMasterLevel(float level) { masterLevel = level; }

    bool isActive() const { return vcfVcaEnv.isActive(); }

private:
    double sampleRate = 44100.0;

    Oscillator vco1;
    Oscillator vco2;
    NoiseGenerator noise;
    LadderFilter filter;
    ADEnvelope pitchEnv;
    ADEnvelope vcfVcaEnv;

    float vco1BaseFreq = 110.0f;
    float vco2BaseFreq = 110.0f;
    float vco1Level = 0.5f;
    float vco2Level = 0.5f;
    float noiseLevel = 0.0f;
    float fmAmount = 0.0f;

    float filterCutoff = 5000.0f;
    float filterEnvAmount = 0.5f;
    float pitchEnvAmount = 24.0f;

    float pitchOffset = 0.0f;
    float velocity = 1.0f;
    float masterLevel = 0.8f;

    float antiClickRamp = 1.0f;
    bool antiClickActive = false;
    static constexpr float antiClickIncrement = 1.0f / 88.0f;
};

/**
 * @brief 8-step sequencer
 */
class Sequencer {
public:
    static constexpr int NUM_STEPS = 8;

    void reset() { currentStep = 0; }

    void setStepPitch(int step, float semitones) {
        if (step >= 0 && step < NUM_STEPS)
            pitches[step] = semitones;
    }

    void setStepVelocity(int step, float vel) {
        if (step >= 0 && step < NUM_STEPS)
            velocities[step] = std::clamp(vel, 0.0f, 1.0f);
    }

    float getStepPitch(int step) const {
        if (step >= 0 && step < NUM_STEPS) return pitches[step];
        return 0.0f;
    }

    float getStepVelocity(int step) const {
        if (step >= 0 && step < NUM_STEPS) return velocities[step];
        return 1.0f;
    }

    std::pair<float, float> advance() {
        currentStep = (currentStep + 1) % NUM_STEPS;
        return {pitches[currentStep], velocities[currentStep]};
    }

    float getCurrentPitch() const { return pitches[currentStep]; }
    float getCurrentVelocity() const { return velocities[currentStep]; }
    int getCurrentStep() const { return currentStep; }

private:
    std::array<float, NUM_STEPS> pitches = {0, 0, 0, 0, 0, 0, 0, 0};
    std::array<float, NUM_STEPS> velocities = {1, 1, 1, 1, 1, 1, 1, 1};
    int currentStep = 0;
};

/**
 * @brief Main DFAM Synth Engine
 */
class SynthEngine {
public:
    void prepare(double sr, int blockSize) {
        sampleRate = sr;
        voice.prepare(sr);
        pitchLfo.prepare(sr);
        filterLfo.prepare(sr);
        delay.prepare(sr);
        reverb.prepare(sr);
        saturator.setDrive(1.0f);
        updateClockRate();
        sequencer.reset();
    }

    void renderBlock(float* outputL, float* outputR, int numSamples) {
        std::fill(outputL, outputL + numSamples, 0.0f);
        std::fill(outputR, outputR + numSamples, 0.0f);

        for (int i = 0; i < numSamples; ++i) {
            pitchLfo.process();
            float filterLfoValue = filterLfo.process();

            float modulatedCutoff = filterCutoffBase + filterLfoValue * filterLfoAmount * 5000.0f;
            modulatedCutoff = std::clamp(modulatedCutoff, 20.0f, 20000.0f);
            voice.setFilterCutoff(modulatedCutoff);

            if (running) {
                clockAccumulator += 1.0;
                if (clockAccumulator >= samplesPerStep) {
                    clockAccumulator -= samplesPerStep;
                    processSequencerStep();
                }
            }

            float outL = 0.0f;
            float outR = 0.0f;
            voice.render(&outL, &outR, 1);

            outL = saturator.process(outL);
            outR = saturator.process(outR);

            delay.process(outL, outR);
            reverb.process(outL, outR);

            outputL[i] = outL * masterGain;
            outputR[i] = outR * masterGain;
        }
    }

    // Transport
    void setRunning(bool run) {
        if (run && !running) {
            clockAccumulator = 0.0;
            sequencer.reset();
            processSequencerStep();
        }
        running = run;
    }

    bool isRunning() const { return running; }

    void setTempo(float bpm) {
        tempo = std::clamp(bpm, 20.0f, 300.0f);
        updateClockRate();
    }

    void setClockDivider(float divider) {
        clockDivider = std::clamp(divider, 0.0625f, 16.0f);
        updateClockRate();
    }

    // Sequencer
    void setStepPitch(int step, float semitones) { sequencer.setStepPitch(step, semitones); }
    void setStepVelocity(int step, float velocity) { sequencer.setStepVelocity(step, velocity); }
    int getCurrentStep() const { return sequencer.getCurrentStep(); }

    // VCO
    void setVCO1Frequency(float freq) { voice.setVCO1Frequency(freq); }
    void setVCO2Frequency(float freq) { voice.setVCO2Frequency(freq); }
    void setVCO1Level(float level) { voice.setVCO1Level(level); }
    void setVCO2Level(float level) { voice.setVCO2Level(level); }
    void setVCO1Waveform(int w) { voice.setVCO1Waveform(w); }
    void setVCO2Waveform(int w) { voice.setVCO2Waveform(w); }
    void setFMAmount(float amount) { voice.setFMAmount(amount); }
    void setNoiseLevel(float level) { voice.setNoiseLevel(level); }

    // Filter
    void setFilterCutoff(float freq) {
        filterCutoffBase = freq;
        voice.setFilterCutoff(freq);
    }
    void setFilterResonance(float res) { voice.setFilterResonance(res); }
    void setFilterEnvAmount(float amount) { voice.setFilterEnvAmount(amount); }
    void setFilterMode(int mode) { voice.setFilterMode(mode); }

    // Filter LFO
    void setFilterLfoRate(float hz) { filterLfo.setRate(hz); }
    void setFilterLfoClockSync(float divider) { filterLfo.setClockSyncRate(tempo, divider); }
    void setFilterLfoAmount(float amount) { filterLfoAmount = std::clamp(amount, 0.0f, 1.0f); }

    // Envelopes
    void setPitchEnvAttack(float t) { voice.setPitchEnvAttack(t); }
    void setPitchEnvDecay(float t) { voice.setPitchEnvDecay(t); }
    void setPitchEnvAmount(float semitones) { voice.setPitchEnvAmount(semitones); }
    void setVCFVCAEnvAttack(float t) { voice.setVCFVCAEnvAttack(t); }
    void setVCFVCAEnvDecay(float t) { voice.setVCFVCAEnvDecay(t); }

    // Effects
    void setSaturatorDrive(float drive) { saturator.setDrive(drive); }
    void setSaturatorMix(float mix) { saturator.setMix(mix); }
    void setDelayTime(float seconds) { delay.setTime(seconds); }
    void setDelayClockSync(float divider) { delay.setClockSyncTime(tempo, divider); }
    void setDelayFeedback(float fb) { delay.setFeedback(fb); }
    void setDelayMix(float mix) { delay.setMix(mix); }
    void setReverbDecay(float decay) { reverb.setDecay(decay); }
    void setReverbDamping(float damping) { reverb.setDamping(damping); }
    void setReverbMix(float mix) { reverb.setMix(mix); }

    // Master
    void setMasterVolume(float volumeDb) {
        masterGain = std::pow(10.0f, volumeDb / 20.0f);
    }

private:
    void updateClockRate() {
        float stepsPerSecond = (tempo / 60.0f) * 4.0f * clockDivider;
        samplesPerStep = sampleRate / stepsPerSecond;
    }

    void processSequencerStep() {
        auto [pitch, velocity] = sequencer.advance();
        int step = sequencer.getCurrentStep();

        float modulatedPitch = pitch;
        if (pitchLfoEnabled[step]) {
            float lfoValue = pitchLfo.getValue();
            modulatedPitch += lfoValue * pitchLfoAmount;
        }

        voice.setPitchOffset(modulatedPitch);
        voice.trigger(velocity);
    }

    double sampleRate = 44100.0;
    Voice voice;
    Sequencer sequencer;

    LFO pitchLfo;
    LFO filterLfo;
    float pitchLfoAmount = 12.0f;
    float filterLfoAmount = 0.5f;
    float filterCutoffBase = 5000.0f;
    std::array<bool, 8> pitchLfoEnabled = {false, false, false, false, false, false, false, false};

    Saturator saturator;
    StereoDelay delay;
    Reverb reverb;

    bool running = false;
    float tempo = 120.0f;
    float clockDivider = 1.0f;
    double samplesPerStep = 1000.0;
    double clockAccumulator = 0.0;

    float masterGain = 0.5f;
};

} // namespace dfam
