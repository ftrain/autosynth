/**
 * @file Voice.h
 * @brief Famdrum Voice - Monophonic percussion synthesizer voice
 *
 * Signal Flow:
 *   VCO1 ----+
 *            |---> Mixer ---> VCF (Ladder) ---> VCA ---> Output
 *   VCO2 ----+                   ^               ^
 *     ^      |                   |               |
 *     |   Noise                  |               |
 *   FM from VCO1             VCF Decay       VCA Decay
 *                               Env             Env
 *   VCO Decay Env
 *     |
 *     +---> VCO1 Pitch
 *     +---> VCO2 Pitch
 *
 * Envelopes:
 *   - VCO Decay: Attack + Decay envelope for pitch modulation
 *   - VCF/VCA Decay: Attack + Decay envelope for filter and amplitude
 */

#pragma once

#include <juce_core/juce_core.h>
#include <cmath>
#include <random>
#include <algorithm>

// SST Libraries
#include "sst/basic-blocks/dsp/Clippers.h"

/**
 * @brief Simple noise generator
 */
class NoiseGenerator
{
public:
    float process()
    {
        return distribution(generator);
    }

private:
    std::mt19937 generator{std::random_device{}()};
    std::uniform_real_distribution<float> distribution{-1.0f, 1.0f};
};

/**
 * @brief Simple LFO for modulation
 */
class SimpleLFO
{
public:
    enum Waveform { SINE, TRIANGLE, SAW, SQUARE };

    void prepare(double sr)
    {
        sampleRate = sr;
        phase = 0.0;
        updatePhaseIncrement();
    }

    void setRate(float hz)
    {
        rate = std::clamp(hz, 0.01f, 20.0f);
        updatePhaseIncrement();
    }

    void setWaveform(Waveform w) { waveform = w; }
    void setWaveform(int w) { waveform = static_cast<Waveform>(std::clamp(w, 0, 3)); }

    /**
     * @brief Get current LFO value without advancing phase
     * @return Value in range [-1, 1]
     */
    float getValue() const
    {
        return computeValue(phase);
    }

    /**
     * @brief Process and advance phase
     * @return Value in range [-1, 1]
     */
    float process()
    {
        float output = computeValue(phase);
        phase += phaseIncrement;
        if (phase >= 1.0)
            phase -= 1.0;
        return output;
    }

    void reset() { phase = 0.0; }

private:
    void updatePhaseIncrement()
    {
        phaseIncrement = rate / sampleRate;
    }

    float computeValue(double p) const
    {
        switch (waveform)
        {
            case SINE:
                return std::sin(2.0f * juce::MathConstants<float>::pi * static_cast<float>(p));
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
 * @brief Simple oscillator with multiple waveforms
 */
class DFAMOscillator
{
public:
    enum Waveform { SAW, SQUARE, TRIANGLE, SINE };

    void prepare(double sr)
    {
        sampleRate = sr;
        phase = 0.0;
    }

    void setFrequency(float freq)
    {
        frequency = std::clamp(freq, 20.0f, 20000.0f);
        phaseIncrement = frequency / sampleRate;
    }

    void setWaveform(Waveform w) { waveform = w; }
    void setWaveform(int w) { waveform = static_cast<Waveform>(std::clamp(w, 0, 3)); }

    float process()
    {
        float output = 0.0f;

        switch (waveform)
        {
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
                output = std::sin(2.0f * juce::MathConstants<float>::pi * static_cast<float>(phase));
                break;
        }

        phase += phaseIncrement;
        if (phase >= 1.0)
            phase -= 1.0;

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
 * @brief Simple AD (Attack/Decay) envelope
 */
class ADEnvelope
{
public:
    enum Stage { IDLE, ATTACK, DECAY };

    void prepare(double sr)
    {
        sampleRate = sr;
        updateRates();
    }

    void setAttack(float seconds)
    {
        attackTime = std::max(0.001f, seconds);
        updateRates();
    }

    void setDecay(float seconds)
    {
        decayTime = std::max(0.001f, seconds);
        updateRates();
    }

    void trigger()
    {
        stage = ATTACK;
    }

    float process()
    {
        switch (stage)
        {
            case ATTACK:
                value += attackRate;
                if (value >= 1.0f)
                {
                    value = 1.0f;
                    stage = DECAY;
                }
                break;

            case DECAY:
                value -= decayRate;
                if (value <= 0.0f)
                {
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
    void updateRates()
    {
        attackRate = 1.0f / (attackTime * static_cast<float>(sampleRate));
        decayRate = 1.0f / (decayTime * static_cast<float>(sampleRate));
    }

    double sampleRate = 44100.0;
    float attackTime = 0.01f;
    float decayTime = 0.5f;
    float attackRate = 0.0f;
    float decayRate = 0.0f;
    float value = 0.0f;
    Stage stage = IDLE;
};

/**
 * @brief Ladder filter with LP/HP modes
 */
class LadderFilter
{
public:
    enum Mode { LOWPASS, HIGHPASS };

    void prepare(double sr)
    {
        sampleRate = sr;
        reset();
    }

    void reset()
    {
        for (int i = 0; i < 4; ++i)
            stage[i] = 0.0f;
        lastInput = 0.0f;
    }

    void setCutoff(float freq)
    {
        cutoff = std::clamp(freq, 20.0f, 20000.0f);
        updateCoefficients();
    }

    void setResonance(float res)
    {
        resonance = std::clamp(res, 0.0f, 1.0f);
    }

    void setMode(Mode m) { mode = m; }
    void setMode(int m) { mode = static_cast<Mode>(std::clamp(m, 0, 1)); }

    float process(float input)
    {
        float feedback = resonance * 4.0f * (stage[3] - 0.5f * input);
        float x = input - feedback;

        for (int i = 0; i < 4; ++i)
        {
            stage[i] += g * (std::tanh(x) - std::tanh(stage[i]));
            x = stage[i];
        }

        lastInput = input;

        if (mode == HIGHPASS)
            return input - stage[3];  // Subtract LP to get HP
        return stage[3];
    }

private:
    void updateCoefficients()
    {
        float fc = cutoff / static_cast<float>(sampleRate);
        g = std::tan(juce::MathConstants<float>::pi * std::min(fc, 0.49f));
        g = g / (1.0f + g);
    }

    double sampleRate = 44100.0;
    float cutoff = 5000.0f;
    float resonance = 0.0f;
    float g = 0.0f;
    float stage[4] = {0, 0, 0, 0};
    float lastInput = 0.0f;
    Mode mode = LOWPASS;
};

/**
 * @brief Saturator using SST tanh7 clipping algorithm
 * Uses sst-basic-blocks/dsp/Clippers.h for high-quality saturation
 */
class Saturator
{
public:
    void setDrive(float d) { drive = std::clamp(d, 1.0f, 20.0f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    float process(float input)
    {
        // Use SST tanh7 for high-quality saturation
        // tanh7 uses 7th-order polynomial approximation for accurate tanh
        alignas(16) float vals[4] = {input * drive, 0.0f, 0.0f, 0.0f};
        auto simdIn = SIMD_MM(load_ps)(vals);
        auto simdOut = sst::basic_blocks::dsp::tanh7_ps(simdIn);
        SIMD_MM(store_ps)(vals, simdOut);

        float driven = vals[0];
        return input * (1.0f - mix) + driven * mix;
    }

    // Block processing for efficiency (uses SST block functions)
    void processBlock(float* buffer, int numSamples)
    {
        if (mix < 0.001f) return;  // Bypass if no effect

        // Process in blocks of 4 for SIMD efficiency
        int i = 0;
        for (; i + 4 <= numSamples; i += 4)
        {
            alignas(16) float dry[4];
            alignas(16) float wet[4];

            for (int j = 0; j < 4; ++j)
            {
                dry[j] = buffer[i + j];
                wet[j] = buffer[i + j] * drive;
            }

            auto simdIn = SIMD_MM(load_ps)(wet);
            auto simdOut = sst::basic_blocks::dsp::tanh7_ps(simdIn);
            SIMD_MM(store_ps)(wet, simdOut);

            for (int j = 0; j < 4; ++j)
                buffer[i + j] = dry[j] * (1.0f - mix) + wet[j] * mix;
        }

        // Handle remaining samples
        for (; i < numSamples; ++i)
            buffer[i] = process(buffer[i]);
    }

private:
    float drive = 1.0f;
    float mix = 0.0f;
};

/**
 * @brief Simple stereo delay
 */
class StereoDelay
{
public:
    void prepare(double sr)
    {
        sampleRate = sr;
        bufferSize = static_cast<size_t>(sr * 2.0);  // 2 seconds max
        bufferL.resize(bufferSize, 0.0f);
        bufferR.resize(bufferSize, 0.0f);
        writePos = 0;
    }

    void setTime(float seconds)
    {
        delayTime = std::clamp(seconds, 0.001f, 2.0f);
        delaySamples = static_cast<size_t>(delayTime * sampleRate);
    }

    void setFeedback(float fb) { feedback = std::clamp(fb, 0.0f, 0.95f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    void process(float& left, float& right)
    {
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
    size_t bufferSize = 88200;
    size_t writePos = 0;
    size_t delaySamples = 22050;
    float delayTime = 0.5f;
    float feedback = 0.3f;
    float mix = 0.0f;
};

/**
 * @brief Simple ambisonic-style reverb (Schroeder-style with diffusion)
 */
class AmbisonicReverb
{
public:
    void prepare(double sr)
    {
        sampleRate = sr;

        // Allpass delays for diffusion
        for (int i = 0; i < 4; ++i)
        {
            apDelays[i].resize(static_cast<size_t>(sr * apTimes[i]), 0.0f);
            apPos[i] = 0;
        }

        // Comb filters for reverb tail
        for (int i = 0; i < 8; ++i)
        {
            combDelays[i].resize(static_cast<size_t>(sr * combTimes[i]), 0.0f);
            combPos[i] = 0;
            combFilters[i] = 0.0f;
        }
    }

    void setDecay(float d) { decay = std::clamp(d, 0.1f, 10.0f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }
    void setDamping(float d) { damping = std::clamp(d, 0.0f, 1.0f); }

    void process(float& left, float& right)
    {
        float input = (left + right) * 0.5f;

        // Allpass diffusion
        float diffused = input;
        for (int i = 0; i < 4; ++i)
            diffused = processAllpass(i, diffused);

        // Parallel comb filters
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
    float processAllpass(int idx, float input)
    {
        float delayed = apDelays[idx][apPos[idx]];
        float output = -input + delayed;
        apDelays[idx][apPos[idx]] = input + delayed * 0.5f;
        apPos[idx] = (apPos[idx] + 1) % apDelays[idx].size();
        return output;
    }

    float processComb(int idx, float input, float gain)
    {
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

    // Allpass filter delays (in seconds)
    float apTimes[4] = {0.0051f, 0.0076f, 0.01f, 0.0123f};
    std::vector<float> apDelays[4];
    size_t apPos[4] = {0, 0, 0, 0};

    // Comb filter delays (in seconds) - slightly different for L/R
    float combTimes[8] = {0.0297f, 0.0371f, 0.0411f, 0.0437f,
                          0.0299f, 0.0373f, 0.0413f, 0.0439f};
    std::vector<float> combDelays[8];
    size_t combPos[8] = {0, 0, 0, 0, 0, 0, 0, 0};
    float combFilters[8] = {0, 0, 0, 0, 0, 0, 0, 0};
};

/**
 * @brief Simple compressor
 */
class Compressor
{
public:
    void prepare(double sr)
    {
        sampleRate = sr;
        updateCoefficients();
    }

    void setThreshold(float db) { threshold = db; }
    void setRatio(float r) { ratio = std::clamp(r, 1.0f, 20.0f); }
    void setAttack(float ms) { attackMs = std::clamp(ms, 0.1f, 100.0f); updateCoefficients(); }
    void setRelease(float ms) { releaseMs = std::clamp(ms, 10.0f, 1000.0f); updateCoefficients(); }
    void setMakeupGain(float db) { makeupGain = std::pow(10.0f, db / 20.0f); }

    void process(float& left, float& right)
    {
        float inputLevel = std::max(std::abs(left), std::abs(right));
        float inputDb = 20.0f * std::log10(inputLevel + 1e-6f);

        // Calculate gain reduction
        float gainReduction = 0.0f;
        if (inputDb > threshold)
            gainReduction = (inputDb - threshold) * (1.0f - 1.0f / ratio);

        // Smooth envelope
        float targetGain = std::pow(10.0f, -gainReduction / 20.0f);
        if (targetGain < envelope)
            envelope = attackCoef * envelope + (1.0f - attackCoef) * targetGain;
        else
            envelope = releaseCoef * envelope + (1.0f - releaseCoef) * targetGain;

        float gain = envelope * makeupGain;
        left *= gain;
        right *= gain;
    }

private:
    void updateCoefficients()
    {
        attackCoef = std::exp(-1.0f / (attackMs * 0.001f * static_cast<float>(sampleRate)));
        releaseCoef = std::exp(-1.0f / (releaseMs * 0.001f * static_cast<float>(sampleRate)));
    }

    double sampleRate = 44100.0;
    float threshold = -10.0f;
    float ratio = 4.0f;
    float attackMs = 10.0f;
    float releaseMs = 100.0f;
    float makeupGain = 1.0f;
    float attackCoef = 0.0f;
    float releaseCoef = 0.0f;
    float envelope = 1.0f;
};

/**
 * @brief DFAM Voice - Single monophonic voice
 */
class DFAMVoice
{
public:
    void prepare(double sr)
    {
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

    void trigger(float vel = 1.0f)
    {
        velocity = vel;

        // Apply pitch-to-decay modulation (bipolar)
        // Normalized pitch: -24 to +24 -> 0 to 1
        float pitchNormalized = std::clamp((pitchOffset + 24.0f) / 48.0f, 0.0f, 1.0f);

        // Bipolar modulation: positive = high pitch = longer decay
        // negative = high pitch = shorter decay
        float decayMod = pitchToDecayAmount * (pitchNormalized - 0.5f) * 2.0f;  // -1 to +1
        float modulatedDecay = baseVcfVcaDecay * (1.0f + decayMod);
        modulatedDecay = std::clamp(modulatedDecay, 0.01f, 4.0f);  // Clamp to reasonable range
        vcfVcaEnv.setDecay(modulatedDecay);

        pitchEnv.trigger();
        vcfVcaEnv.trigger();
    }

    void render(float* outputL, float* outputR, int numSamples)
    {
        // Calculate pitch-based modulation (normalized 0-1 based on pitchOffset range -24 to +24)
        float pitchNormalized = std::clamp((pitchOffset + 24.0f) / 48.0f, 0.0f, 1.0f);

        // Modulate noise level based on pitch (high pitch = more noise)
        float modulatedNoiseLevel = noiseLevel + pitchToNoiseAmount * pitchNormalized;
        modulatedNoiseLevel = std::clamp(modulatedNoiseLevel, 0.0f, 1.0f);

        for (int i = 0; i < numSamples; ++i)
        {
            float pitchEnvValue = pitchEnv.process();
            float vcfVcaEnvValue = vcfVcaEnv.process();

            // VCO frequencies with pitch envelope
            float vco1Freq = vco1BaseFreq * std::pow(2.0f, (pitchEnvValue * pitchEnvAmount + pitchOffset) / 12.0f);
            float vco2Freq = vco2BaseFreq * std::pow(2.0f, (pitchEnvValue * pitchEnvAmount + pitchOffset) / 12.0f);

            vco1.setFrequency(vco1Freq);
            float vco1Out = vco1.process();

            // FM: VCO1 modulates VCO2
            float fmMod = vco1Out * fmAmount * vco2Freq;
            vco2.setFrequency(vco2Freq + fmMod);
            float vco2Out = vco2.process();

            // Noise with pitch modulation
            float noiseOut = noise.process();

            // Mix with pitch-modulated noise
            float mix = vco1Out * vco1Level + vco2Out * vco2Level + noiseOut * modulatedNoiseLevel;

            // Filter with envelope
            float filterMod = filterCutoff + vcfVcaEnvValue * filterEnvAmount * 10000.0f;
            filter.setCutoff(std::clamp(filterMod, 20.0f, 20000.0f));
            float filtered = filter.process(mix);

            // VCA
            float output = filtered * vcfVcaEnvValue * velocity * masterLevel;

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
    void setPitchToNoiseAmount(float amount) { pitchToNoiseAmount = std::clamp(amount, 0.0f, 1.0f); }

    // Filter
    void setFilterCutoff(float freq) { filterCutoff = freq; filter.setCutoff(freq); }
    void setFilterResonance(float res) { filter.setResonance(res); }
    void setFilterEnvAmount(float amount) { filterEnvAmount = amount; }
    void setFilterMode(int mode) { filter.setMode(mode); }

    // Pitch envelope
    void setPitchEnvAttack(float t) { pitchEnv.setAttack(t); }
    void setPitchEnvDecay(float t) { pitchEnv.setDecay(t); }
    void setPitchEnvAmount(float semitones) { pitchEnvAmount = semitones; }

    // VCF/VCA envelope
    void setVCFVCAEnvAttack(float t) { vcfVcaEnv.setAttack(t); }
    void setVCFVCAEnvDecay(float t) { baseVcfVcaDecay = t; }
    void setPitchToDecayAmount(float amount) { pitchToDecayAmount = std::clamp(amount, -1.0f, 1.0f); }

    // Sequencer pitch offset
    void setPitchOffset(float semitones) { pitchOffset = semitones; }

    // Master
    void setMasterLevel(float level) { masterLevel = level; }

    bool isActive() const { return vcfVcaEnv.isActive(); }

private:
    double sampleRate = 44100.0;

    DFAMOscillator vco1;
    DFAMOscillator vco2;
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
    float pitchToNoiseAmount = 0.0f;  // 0-1: how much pitch affects noise level

    float filterCutoff = 5000.0f;
    float filterEnvAmount = 0.5f;
    float pitchEnvAmount = 24.0f;

    float pitchOffset = 0.0f;
    float velocity = 1.0f;
    float masterLevel = 0.8f;

    float baseVcfVcaDecay = 0.5f;     // Base decay time before modulation
    float pitchToDecayAmount = 0.0f;  // -1 to +1: bipolar pitch-to-decay mod
};

// Compatibility alias
using Voice = DFAMVoice;
