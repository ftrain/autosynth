/**
 * @file Voice.h
 * @brief Subharmonicon Voice - True 2-voice synthesizer architecture
 *
 * REVISED Signal Flow (each VCO has its own signal path):
 *
 *   Voice 1:
 *   VCO1 ----+
 *   SUB1A ---+---> Mixer1 ---> Ladder Filter1 ---> VCA1 ---> +
 *   SUB1B ---+        (24dB/oct LPF)     (Amp Env1)         |
 *                                                           +---> Output
 *   Voice 2:                                                |
 *   VCO2 ----+                                              |
 *   SUB2A ---+---> Mixer2 ---> Ladder Filter2 ---> VCA2 ---> +
 *   SUB2B ---+        (24dB/oct LPF)     (Amp Env2)
 *
 * Key Features:
 *   - 2 completely independent signal paths
 *   - Each voice has its own ladder filter with independent cutoff/resonance
 *   - Each voice has its own AD envelopes (VCF and VCA)
 *   - Subharmonic oscillators divide parent VCO frequency by integers 1-16
 *   - Waveform selection for each oscillator (SAW, SQR, TRI, SIN)
 */

#pragma once

#include <cmath>
#include <array>
#include <algorithm>

// Constants
static constexpr float PI = 3.14159265358979323846f;
static constexpr float TWO_PI = 2.0f * PI;

/**
 * @brief Waveform types
 */
enum class Waveform { Saw = 0, Square = 1, Triangle = 2, Sine = 3 };

/**
 * @brief Attack/Decay Envelope Generator
 */
class ADEnvelope
{
public:
    enum class Stage { Idle, Attack, Decay };

    void setSampleRate(float sr) { sampleRate = sr; }

    void setAD(float a, float d)
    {
        attackRate = 1.0f / std::max(0.001f, a * sampleRate);
        decayRate = 1.0f / std::max(0.001f, d * sampleRate);
    }

    void trigger()
    {
        stage = Stage::Attack;
    }

    void reset()
    {
        stage = Stage::Idle;
        level = 0.0f;
    }

    float process()
    {
        switch (stage)
        {
        case Stage::Attack:
            level += attackRate;
            if (level >= 1.0f)
            {
                level = 1.0f;
                stage = Stage::Decay;
            }
            break;

        case Stage::Decay:
            level -= decayRate;
            if (level <= 0.0f)
            {
                level = 0.0f;
                stage = Stage::Idle;
            }
            break;

        case Stage::Idle:
        default:
            level = 0.0f;
            break;
        }

        return level;
    }

    bool isActive() const { return stage != Stage::Idle; }
    float getLevel() const { return level; }
    Stage getStage() const { return stage; }

private:
    float sampleRate = 44100.0f;
    float attackRate = 0.001f;
    float decayRate = 0.001f;
    float level = 0.0f;
    Stage stage = Stage::Idle;
};

/**
 * @brief Multi-waveform Oscillator with PolyBLEP anti-aliasing
 */
class MultiOscillator
{
public:
    void setSampleRate(float sr) { sampleRate = sr; }

    void setFrequency(float freq)
    {
        frequency = std::clamp(freq, 1.0f, sampleRate * 0.45f);
        phaseIncrement = frequency / sampleRate;
    }

    void setLevel(float l) { level = l; }
    void setWaveform(Waveform w) { waveform = w; }
    void setWaveform(int w) { waveform = static_cast<Waveform>(std::clamp(w, 0, 3)); }

    void reset() { phase = 0.0f; }

    float process()
    {
        float output = 0.0f;

        switch (waveform)
        {
        case Waveform::Saw:
            output = 2.0f * phase - 1.0f;
            output -= polyBlepSaw(phase, phaseIncrement);
            break;

        case Waveform::Square:
            output = phase < 0.5f ? 1.0f : -1.0f;
            output += polyBlepSquare(phase, phaseIncrement);
            break;

        case Waveform::Triangle:
            // Integrated square wave for triangle
            output = 4.0f * std::abs(phase - 0.5f) - 1.0f;
            break;

        case Waveform::Sine:
            output = std::sin(TWO_PI * phase);
            break;
        }

        // Advance phase
        phase += phaseIncrement;
        if (phase >= 1.0f)
            phase -= 1.0f;

        return output * level;
    }

    float getPhase() const { return phase; }
    float getFrequency() const { return frequency; }

private:
    float polyBlepSaw(float t, float dt)
    {
        if (t < dt)
        {
            t /= dt;
            return t + t - t * t - 1.0f;
        }
        else if (t > 1.0f - dt)
        {
            t = (t - 1.0f) / dt;
            return t * t + t + t + 1.0f;
        }
        return 0.0f;
    }

    float polyBlepSquare(float t, float dt)
    {
        float blep = 0.0f;
        // Rising edge at 0
        if (t < dt)
        {
            float x = t / dt;
            blep = x + x - x * x - 1.0f;
        }
        else if (t > 1.0f - dt)
        {
            float x = (t - 1.0f) / dt;
            blep = x * x + x + x + 1.0f;
        }
        // Falling edge at 0.5
        if (t > 0.5f - dt && t < 0.5f + dt)
        {
            float x = (t - 0.5f) / dt;
            if (t < 0.5f)
                blep -= (x + x - x * x - 1.0f);
            else
                blep -= (x * x + x + x + 1.0f);
        }
        return blep;
    }

    float sampleRate = 44100.0f;
    float frequency = 220.0f;
    float phase = 0.0f;
    float phaseIncrement = 0.005f;
    float level = 1.0f;
    Waveform waveform = Waveform::Saw;
};

/**
 * @brief Improved Moog-style 4-pole ladder filter (24dB/octave)
 *
 * This version uses improved coefficient calculation for better
 * response across the frequency range, especially at low cutoffs.
 */
class LadderFilter
{
public:
    void setSampleRate(float sr)
    {
        sampleRate = sr;
        std::fill(stage.begin(), stage.end(), 0.0f);
    }

    void setCutoff(float freq)
    {
        cutoffFreq = std::clamp(freq, 20.0f, std::min(20000.0f, sampleRate * 0.45f));

        // Improved coefficient calculation for better low-frequency response
        float fc = cutoffFreq / sampleRate;
        fc = std::clamp(fc, 0.001f, 0.45f);

        // Use tangent approximation for more accurate filter response
        g = std::tan(PI * fc);
        g = g / (1.0f + g);  // Normalized for trapezoidal integration
    }

    void setResonance(float res)
    {
        resonance = std::clamp(res, 0.0f, 1.0f);
        // k ranges from 0 to 4 for self-oscillation
        k = 4.0f * resonance;
    }

    float process(float input)
    {
        // Feedback with saturation
        float feedback = k * (stage[3] - 0.5f * input);
        float u = input - std::tanh(feedback);

        // Four cascaded 1-pole lowpass stages with improved integration
        for (int i = 0; i < 4; ++i)
        {
            float v = g * (u - stage[i]);
            float y = v + stage[i];
            stage[i] = y + v;  // Trapezoidal integration
            u = std::tanh(y);  // Soft saturation between stages
        }

        return stage[3];
    }

    void reset()
    {
        std::fill(stage.begin(), stage.end(), 0.0f);
    }

private:
    float sampleRate = 44100.0f;
    float cutoffFreq = 5000.0f;
    float resonance = 0.0f;
    float g = 0.5f;
    float k = 0.0f;
    std::array<float, 4> stage{};
};

/**
 * @brief Single Voice - VCO + 2 subs + filter + VCA
 *
 * Each voice contains:
 * - 1 main VCO with waveform selection
 * - 2 subharmonic oscillators
 * - 1 ladder filter with envelope
 * - 1 VCA with envelope
 */
class SingleVoice
{
public:
    void prepare(float sr)
    {
        sampleRate = sr;

        vco.setSampleRate(sr);
        subA.setSampleRate(sr);
        subB.setSampleRate(sr);

        filter.setSampleRate(sr);
        vcaEnv.setSampleRate(sr);
        vcfEnv.setSampleRate(sr);

        vcaEnv.setAD(0.01f, 0.5f);
        vcfEnv.setAD(0.01f, 0.5f);
    }

    void trigger()
    {
        vcaEnv.trigger();
        vcfEnv.trigger();
    }

    void reset()
    {
        vcaEnv.reset();
        vcfEnv.reset();
    }

    float process()
    {
        // Update subharmonic frequencies
        subA.setFrequency(vco.getFrequency() / static_cast<float>(subADiv));
        subB.setFrequency(vco.getFrequency() / static_cast<float>(subBDiv));

        // Generate oscillators
        float vcoOut = vco.process();
        float subAOut = subA.process();
        float subBOut = subB.process();

        // Mix
        float mix = vcoOut * vcoLevel + subAOut * subALevel + subBOut * subBLevel;

        // VCF Envelope modulation
        float vcfEnvOut = vcfEnv.process();
        float modCutoff;

        if (vcfEnvAmount >= 0.0f)
        {
            modCutoff = filterCutoff + vcfEnvAmount * vcfEnvOut * 15000.0f;
        }
        else
        {
            modCutoff = filterCutoff + std::abs(vcfEnvAmount) * (1.0f - vcfEnvOut) * 15000.0f;
        }

        filter.setCutoff(modCutoff);
        filter.setResonance(filterResonance);

        // Apply filter
        float filtered = filter.process(mix);

        // VCA Envelope
        float vcaEnvOut = vcaEnv.process();

        return filtered * vcaEnvOut;
    }

    // VCO settings
    void setVCOFrequency(float freq) { baseFreq = freq; updateVCOFrequency(); }
    void setVCOPitchOffset(float semitones) { pitchOffset = semitones; updateVCOFrequency(); }
    void setVCOLevel(float l) { vcoLevel = l; }
    void setVCOWaveform(int w) { vco.setWaveform(w); subA.setWaveform(w); subB.setWaveform(w); }

    // Subharmonic settings
    void setSubADivision(int div) { subADiv = std::clamp(div, 1, 16); }
    void setSubBDivision(int div) { subBDiv = std::clamp(div, 1, 16); }
    void setSubALevel(float l) { subALevel = l; }
    void setSubBLevel(float l) { subBLevel = l; }

    // Filter settings
    void setFilterCutoff(float freq) { filterCutoff = freq; }
    void setFilterResonance(float res) { filterResonance = res; }
    void setVCFEnvAmount(float amt) { vcfEnvAmount = amt; }

    // Envelope settings
    void setVCFAttack(float t) { vcfAttack = t; vcfEnv.setAD(vcfAttack, vcfDecay); }
    void setVCFDecay(float t) { vcfDecay = t; vcfEnv.setAD(vcfAttack, vcfDecay); }
    void setVCAAttack(float t) { vcaAttack = t; vcaEnv.setAD(vcaAttack, vcaDecay); }
    void setVCADecay(float t) { vcaDecay = t; vcaEnv.setAD(vcaAttack, vcaDecay); }

    bool isEnvelopeActive() const { return vcaEnv.isActive(); }

private:
    void updateVCOFrequency()
    {
        float freq = baseFreq * std::pow(2.0f, pitchOffset / 12.0f);
        vco.setFrequency(freq);
    }

    float sampleRate = 44100.0f;

    // Oscillators
    MultiOscillator vco;
    MultiOscillator subA;
    MultiOscillator subB;

    float baseFreq = 220.0f;
    float pitchOffset = 0.0f;
    float vcoLevel = 0.8f;

    int subADiv = 2;
    int subBDiv = 3;
    float subALevel = 0.5f;
    float subBLevel = 0.5f;

    // Filter
    LadderFilter filter;
    float filterCutoff = 2000.0f;
    float filterResonance = 0.3f;
    float vcfEnvAmount = 0.5f;

    // Envelopes
    ADEnvelope vcaEnv;
    ADEnvelope vcfEnv;

    float vcaAttack = 0.01f;
    float vcaDecay = 0.5f;
    float vcfAttack = 0.01f;
    float vcfDecay = 0.5f;
};

/**
 * @brief Subharmonicon - 2 independent voices
 *
 * This class manages two completely independent signal paths,
 * each with their own oscillators, filter, and envelope.
 */
class SubharmoniconVoice
{
public:
    SubharmoniconVoice() = default;
    ~SubharmoniconVoice() = default;

    void prepare(double sr)
    {
        sampleRate = static_cast<float>(sr);
        voice1.prepare(sampleRate);
        voice2.prepare(sampleRate);
    }

    void triggerVoice1() { voice1.trigger(); }
    void triggerVoice2() { voice2.trigger(); }
    void trigger() { voice1.trigger(); voice2.trigger(); }

    void resetVoice1() { voice1.reset(); }
    void resetVoice2() { voice2.reset(); }
    void kill() { voice1.reset(); voice2.reset(); }

    void render(float* outputL, float* outputR, int numSamples)
    {
        for (int i = 0; i < numSamples; ++i)
        {
            float voice1Out = voice1.process();
            float voice2Out = voice2.process();

            float output = (voice1Out + voice2Out) * masterLevel;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    bool isEnvelopeActive() const { return voice1.isEnvelopeActive() || voice2.isEnvelopeActive(); }

    // =========================================================================
    // Voice 1 (VCO1) Settings
    // =========================================================================
    void setVCO1Frequency(float freq) { voice1.setVCOFrequency(freq); }
    void setVCO1PitchOffset(float semitones) { voice1.setVCOPitchOffset(semitones); }
    void setVCO1Level(float l) { voice1.setVCOLevel(l); }
    void setVCO1Waveform(int w) { voice1.setVCOWaveform(w); }

    void setSub1ADivision(int div) { voice1.setSubADivision(div); }
    void setSub1BDivision(int div) { voice1.setSubBDivision(div); }
    void setSub1ALevel(float l) { voice1.setSubALevel(l); }
    void setSub1BLevel(float l) { voice1.setSubBLevel(l); }

    void setFilter1Cutoff(float freq) { voice1.setFilterCutoff(freq); }
    void setFilter1Resonance(float res) { voice1.setFilterResonance(res); }
    void setFilter1EnvAmount(float amt) { voice1.setVCFEnvAmount(amt); }

    void setVCF1Attack(float t) { voice1.setVCFAttack(t); }
    void setVCF1Decay(float t) { voice1.setVCFDecay(t); }
    void setVCA1Attack(float t) { voice1.setVCAAttack(t); }
    void setVCA1Decay(float t) { voice1.setVCADecay(t); }

    // =========================================================================
    // Voice 2 (VCO2) Settings
    // =========================================================================
    void setVCO2Frequency(float freq) { voice2.setVCOFrequency(freq); }
    void setVCO2PitchOffset(float semitones) { voice2.setVCOPitchOffset(semitones); }
    void setVCO2Level(float l) { voice2.setVCOLevel(l); }
    void setVCO2Waveform(int w) { voice2.setVCOWaveform(w); }

    void setSub2ADivision(int div) { voice2.setSubADivision(div); }
    void setSub2BDivision(int div) { voice2.setSubBDivision(div); }
    void setSub2ALevel(float l) { voice2.setSubALevel(l); }
    void setSub2BLevel(float l) { voice2.setSubBLevel(l); }

    void setFilter2Cutoff(float freq) { voice2.setFilterCutoff(freq); }
    void setFilter2Resonance(float res) { voice2.setFilterResonance(res); }
    void setFilter2EnvAmount(float amt) { voice2.setVCFEnvAmount(amt); }

    void setVCF2Attack(float t) { voice2.setVCFAttack(t); }
    void setVCF2Decay(float t) { voice2.setVCFDecay(t); }
    void setVCA2Attack(float t) { voice2.setVCAAttack(t); }
    void setVCA2Decay(float t) { voice2.setVCADecay(t); }

    // =========================================================================
    // Legacy API for compatibility (uses voice 1 filter settings for both)
    // =========================================================================
    void setFilterCutoff(float freq) { setFilter1Cutoff(freq); setFilter2Cutoff(freq); }
    void setFilterResonance(float res) { setFilter1Resonance(res); setFilter2Resonance(res); }
    void setVCFEnvAmount(float amt) { setFilter1EnvAmount(amt); setFilter2EnvAmount(amt); }
    void setVCFAttack(float t) { setVCF1Attack(t); setVCF2Attack(t); }
    void setVCFDecay(float t) { setVCF1Decay(t); setVCF2Decay(t); }
    void setVCAAttack(float t) { setVCA1Attack(t); setVCA2Attack(t); }
    void setVCADecay(float t) { setVCA1Decay(t); setVCA2Decay(t); }

    // =========================================================================
    // Master
    // =========================================================================
    void setMasterLevel(float l) { masterLevel = l; }

private:
    float sampleRate = 44100.0f;

    SingleVoice voice1;
    SingleVoice voice2;

    float masterLevel = 0.7f;
};
