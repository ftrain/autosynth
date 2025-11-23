/**
 * @file Voice.h
 * @brief DFAM Voice - Monophonic percussion synthesizer voice
 *
 * Signal Flow (matching original DFAM):
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
 * @brief Simple ladder filter (4-pole lowpass)
 */
class LadderFilter
{
public:
    void prepare(double sr)
    {
        sampleRate = sr;
        reset();
    }

    void reset()
    {
        for (int i = 0; i < 4; ++i)
            stage[i] = 0.0f;
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

    float process(float input)
    {
        float feedback = resonance * 4.0f * (stage[3] - 0.5f * input);
        float x = input - feedback;

        for (int i = 0; i < 4; ++i)
        {
            stage[i] += g * (std::tanh(x) - std::tanh(stage[i]));
            x = stage[i];
        }

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
        pitchEnv.trigger();
        vcfVcaEnv.trigger();
    }

    void render(float* outputL, float* outputR, int numSamples)
    {
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

            // Noise
            float noiseOut = noise.process();

            // Mix
            float mix = vco1Out * vco1Level + vco2Out * vco2Level + noiseOut * noiseLevel;

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

    // Filter
    void setFilterCutoff(float freq) { filterCutoff = freq; filter.setCutoff(freq); }
    void setFilterResonance(float res) { filter.setResonance(res); }
    void setFilterEnvAmount(float amount) { filterEnvAmount = amount; }

    // Pitch envelope
    void setPitchEnvAttack(float t) { pitchEnv.setAttack(t); }
    void setPitchEnvDecay(float t) { pitchEnv.setDecay(t); }
    void setPitchEnvAmount(float semitones) { pitchEnvAmount = semitones; }

    // VCF/VCA envelope
    void setVCFVCAEnvAttack(float t) { vcfVcaEnv.setAttack(t); }
    void setVCFVCAEnvDecay(float t) { vcfVcaEnv.setDecay(t); }

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

    float filterCutoff = 5000.0f;
    float filterEnvAmount = 0.5f;
    float pitchEnvAmount = 24.0f;

    float pitchOffset = 0.0f;
    float velocity = 1.0f;
    float masterLevel = 0.8f;
};

// Compatibility alias
using Voice = DFAMVoice;
