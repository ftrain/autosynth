/**
 * @file Voice.h
 * @brief Single synthesizer voice for Phoneme formant synthesizer
 *
 * Features:
 * - Saw/Pulse oscillator (harmonically rich source)
 * - 3 parallel bandpass formant filters (F1, F2, F3)
 * - Vowel morphing (A, E, I, O, U)
 * - Vibrato LFO for pitch modulation
 * - Vowel LFO for automatic vowel morphing
 *
 * Signal Flow:
 *   Oscillator -> [F1 + F2 + F3 parallel BP filters] -> Amp Envelope -> Output
 */

#pragma once

#include <cmath>
#include <array>
#include <algorithm>

/**
 * @brief Waveform types
 */
enum class WaveformType
{
    Saw = 0,
    Pulse = 1
};

/**
 * @brief Vowel types
 */
enum class Vowel
{
    A = 0,
    E = 1,
    I = 2,
    O = 3,
    U = 4
};

/**
 * @brief Formant frequency data for vowels
 * Each vowel has 3 formant frequencies (F1, F2, F3)
 */
struct FormantData
{
    float f1;  // First formant
    float f2;  // Second formant
    float f3;  // Third formant
};

/**
 * @brief Simple 2-pole State Variable Filter for formant filtering
 */
class FormantFilter
{
public:
    void reset()
    {
        ic1eq = 0.0f;
        ic2eq = 0.0f;
    }

    void setCoefficients(float frequency, float q, float sampleRate)
    {
        // Clamp frequency to Nyquist
        frequency = std::min(frequency, sampleRate * 0.49f);
        frequency = std::max(frequency, 20.0f);

        float g = std::tan(3.14159265359f * frequency / sampleRate);
        float k = 1.0f / q;

        a1 = 1.0f / (1.0f + g * (g + k));
        a2 = g * a1;
        a3 = g * a2;
    }

    float processBandpass(float input)
    {
        float v3 = input - ic2eq;
        float v1 = a1 * ic1eq + a2 * v3;
        float v2 = ic2eq + a2 * ic1eq + a3 * v3;

        ic1eq = 2.0f * v1 - ic1eq;
        ic2eq = 2.0f * v2 - ic2eq;

        return v1;  // Bandpass output
    }

private:
    float ic1eq = 0.0f;
    float ic2eq = 0.0f;
    float a1 = 0.0f;
    float a2 = 0.0f;
    float a3 = 0.0f;
};

/**
 * @brief Single synthesizer voice
 */
class Voice
{
public:
    static constexpr int BLOCK_SIZE = 32;
    static constexpr float PI = 3.14159265359f;
    static constexpr float TWO_PI = 2.0f * PI;

    Voice() = default;
    ~Voice() = default;

    //==========================================================================
    // Initialization
    //==========================================================================

    void prepare(double sr)
    {
        sampleRate = sr;
        phase = 0.0f;
        vibratoPhase = 0.0f;
        vowelLfoPhase = 0.0f;
        envLevel = 0.0f;
        envStage = EnvStage::Idle;

        for (auto& filter : formantFilters)
        {
            filter.reset();
        }
    }

    //==========================================================================
    // Note Events
    //==========================================================================

    void noteOn(int note, float vel)
    {
        currentNote = note;
        velocity = vel;
        active = true;
        releasing = false;
        age = 0;

        // Calculate base frequency
        baseFrequency = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);

        // Reset phases for clean attack
        phase = 0.0f;
        vibratoPhase = 0.0f;

        // Reset filters
        for (auto& filter : formantFilters)
        {
            filter.reset();
        }

        // Start envelope
        envStage = EnvStage::Attack;
        envLevel = 0.0f;
    }

    void noteOff()
    {
        releasing = true;
        envStage = EnvStage::Release;
    }

    void kill()
    {
        active = false;
        releasing = false;
        currentNote = -1;
        envStage = EnvStage::Idle;
        envLevel = 0.0f;
    }

    //==========================================================================
    // Audio Rendering
    //==========================================================================

    void render(float* outputL, float* outputR, int numSamples)
    {
        if (!active)
            return;

        ++age;

        int samplesRemaining = numSamples;
        int offset = 0;

        while (samplesRemaining > 0)
        {
            int blockSize = std::min(samplesRemaining, BLOCK_SIZE);
            renderBlock(outputL + offset, outputR + offset, blockSize);
            offset += blockSize;
            samplesRemaining -= blockSize;
        }
    }

    //==========================================================================
    // State Accessors
    //==========================================================================

    bool isActive() const { return active; }
    bool isReleasing() const { return releasing; }
    int getNote() const { return currentNote; }
    float getVelocity() const { return velocity; }
    int getAge() const { return age; }

    //==========================================================================
    // Parameter Setters
    //==========================================================================

    void setWaveform(int wf) { waveform = static_cast<WaveformType>(std::clamp(wf, 0, 1)); }
    void setTune(float semitones) { tuneOffset = semitones; }
    void setPulseWidth(float pw) { pulseWidth = std::clamp(pw, 0.05f, 0.95f); }
    void setVowel(float v) { vowelValue = std::clamp(v, 0.0f, 4.0f); }
    void setFormantShift(float shift) { formantShift = shift; }
    void setFormantSpread(float spread) { formantSpread = std::clamp(spread, 0.5f, 2.0f); }
    void setVibratoRate(float rate) { vibratoRate = rate; }
    void setVibratoDepth(float depth) { vibratoDepth = depth; }
    void setVowelLfoRate(float rate) { vowelLfoRate = rate; }
    void setVowelLfoDepth(float depth) { vowelLfoDepth = depth; }
    void setAttack(float seconds) { attackTime = std::max(0.001f, seconds); }
    void setDecay(float seconds) { decayTime = std::max(0.001f, seconds); }
    void setSustain(float level) { sustainLevel = std::clamp(level, 0.0f, 1.0f); }
    void setRelease(float seconds) { releaseTime = std::max(0.001f, seconds); }
    void setMasterLevel(float level) { masterLevel = level; }

private:
    //==========================================================================
    // Formant Frequency Tables
    //==========================================================================

    static constexpr FormantData formantTable[5] = {
        { 800.0f, 1200.0f, 2500.0f },  // A
        { 400.0f, 2000.0f, 2600.0f },  // E
        { 300.0f, 2300.0f, 3000.0f },  // I
        { 500.0f,  800.0f, 2300.0f },  // O
        { 350.0f,  700.0f, 2500.0f }   // U
    };

    //==========================================================================
    // Envelope Stages
    //==========================================================================

    enum class EnvStage
    {
        Idle,
        Attack,
        Decay,
        Sustain,
        Release
    };

    //==========================================================================
    // Get interpolated formant frequencies
    //==========================================================================

    FormantData getInterpolatedFormants(float vowelPos) const
    {
        // Apply vowel LFO modulation
        float modulatedVowel = vowelPos + vowelLfoDepth * 4.0f * std::sin(vowelLfoPhase * TWO_PI);
        modulatedVowel = std::fmod(modulatedVowel + 100.0f, 5.0f);  // Wrap around 0-5 range

        int v1 = static_cast<int>(modulatedVowel);
        int v2 = (v1 + 1) % 5;
        float frac = modulatedVowel - v1;

        // Linear interpolation between vowels
        FormantData result;
        result.f1 = formantTable[v1].f1 * (1.0f - frac) + formantTable[v2].f1 * frac;
        result.f2 = formantTable[v1].f2 * (1.0f - frac) + formantTable[v2].f2 * frac;
        result.f3 = formantTable[v1].f3 * (1.0f - frac) + formantTable[v2].f3 * frac;

        // Apply formant shift (in semitones)
        float shiftRatio = std::pow(2.0f, formantShift / 12.0f);
        result.f1 *= shiftRatio;
        result.f2 *= shiftRatio;
        result.f3 *= shiftRatio;

        // Apply formant spread (centered on F2)
        float centerFreq = result.f2;
        result.f1 = centerFreq + (result.f1 - centerFreq) * formantSpread;
        result.f3 = centerFreq + (result.f3 - centerFreq) * formantSpread;

        return result;
    }

    //==========================================================================
    // Block Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        // Get current formant frequencies
        FormantData formants = getInterpolatedFormants(vowelValue);

        // Update formant filter coefficients
        // Using Q values typical for vocal formants
        formantFilters[0].setCoefficients(formants.f1, 8.0f, sampleRate);
        formantFilters[1].setCoefficients(formants.f2, 10.0f, sampleRate);
        formantFilters[2].setCoefficients(formants.f3, 12.0f, sampleRate);

        // Calculate base phase increment
        float tunedFreq = baseFrequency * std::pow(2.0f, tuneOffset / 12.0f);

        // LFO phase increments
        float vibratoPhaseInc = vibratoRate / static_cast<float>(sampleRate);
        float vowelLfoPhaseInc = vowelLfoRate / static_cast<float>(sampleRate);

        for (int i = 0; i < blockSize; ++i)
        {
            // ================================================================
            // VIBRATO LFO
            // ================================================================
            float vibratoMod = 0.0f;
            if (vibratoDepth > 0.0f)
            {
                vibratoMod = std::sin(vibratoPhase * TWO_PI) * vibratoDepth * 0.5f;  // +/- 0.5 semitones max
                vibratoPhase += vibratoPhaseInc;
                if (vibratoPhase >= 1.0f)
                    vibratoPhase -= 1.0f;
            }

            // ================================================================
            // VOWEL LFO (update phase)
            // ================================================================
            vowelLfoPhase += vowelLfoPhaseInc;
            if (vowelLfoPhase >= 1.0f)
                vowelLfoPhase -= 1.0f;

            // Apply vibrato to frequency
            float modulatedFreq = tunedFreq * std::pow(2.0f, vibratoMod / 12.0f);
            float phaseInc = modulatedFreq / static_cast<float>(sampleRate);

            // ================================================================
            // OSCILLATOR
            // ================================================================
            float oscOut = 0.0f;

            switch (waveform)
            {
                case WaveformType::Saw:
                    oscOut = polyBlepSaw(phase, phaseInc);
                    break;

                case WaveformType::Pulse:
                    oscOut = polyBlepPulse(phase, phaseInc, pulseWidth);
                    break;
            }

            // Advance phase
            phase += phaseInc;
            if (phase >= 1.0f)
                phase -= 1.0f;

            // ================================================================
            // FORMANT FILTERS (parallel)
            // ================================================================
            float f1Out = formantFilters[0].processBandpass(oscOut);
            float f2Out = formantFilters[1].processBandpass(oscOut);
            float f3Out = formantFilters[2].processBandpass(oscOut);

            // Mix formants with decreasing amplitude for higher formants
            float formantMix = f1Out * 1.0f + f2Out * 0.7f + f3Out * 0.5f;

            // Normalize the mix
            formantMix *= 0.5f;

            // ================================================================
            // AMPLITUDE ENVELOPE (ADSR)
            // ================================================================
            float envOut = processEnvelope();

            // Check if voice has finished
            if (envOut <= 0.0f && envStage == EnvStage::Idle)
            {
                active = false;
                return;
            }

            // ================================================================
            // OUTPUT
            // ================================================================
            float output = formantMix * envOut * velocity * masterLevel;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    //==========================================================================
    // PolyBLEP Anti-aliasing
    //==========================================================================

    float polyBlep(float t, float dt)
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

    float polyBlepSaw(float ph, float dt)
    {
        float value = 2.0f * ph - 1.0f;
        value -= polyBlep(ph, dt);
        return value;
    }

    float polyBlepPulse(float ph, float dt, float pw)
    {
        float value = ph < pw ? 1.0f : -1.0f;
        value += polyBlep(ph, dt);
        value -= polyBlep(std::fmod(ph + 1.0f - pw, 1.0f), dt);
        return value;
    }

    //==========================================================================
    // ADSR Envelope
    //==========================================================================

    float processEnvelope()
    {
        float rate = 1.0f / static_cast<float>(sampleRate);

        switch (envStage)
        {
            case EnvStage::Attack:
            {
                float attackRate = rate / attackTime;
                envLevel += attackRate;
                if (envLevel >= 1.0f)
                {
                    envLevel = 1.0f;
                    envStage = EnvStage::Decay;
                }
                break;
            }

            case EnvStage::Decay:
            {
                float decayRate = rate / decayTime;
                envLevel -= decayRate;
                if (envLevel <= sustainLevel)
                {
                    envLevel = sustainLevel;
                    envStage = EnvStage::Sustain;
                }
                break;
            }

            case EnvStage::Sustain:
                envLevel = sustainLevel;
                break;

            case EnvStage::Release:
            {
                float releaseRate = rate / releaseTime;
                envLevel -= releaseRate;
                if (envLevel <= 0.0f)
                {
                    envLevel = 0.0f;
                    envStage = EnvStage::Idle;
                    active = false;
                }
                break;
            }

            case EnvStage::Idle:
            default:
                envLevel = 0.0f;
                break;
        }

        return envLevel;
    }

    //==========================================================================
    // Voice State
    //==========================================================================

    bool active = false;
    bool releasing = false;
    int currentNote = -1;
    float velocity = 0.0f;
    int age = 0;

    //==========================================================================
    // DSP State
    //==========================================================================

    double sampleRate = 44100.0;
    float baseFrequency = 440.0f;

    // Oscillator phase
    float phase = 0.0f;

    // LFO phases
    float vibratoPhase = 0.0f;
    float vowelLfoPhase = 0.0f;

    // Envelope state
    EnvStage envStage = EnvStage::Idle;
    float envLevel = 0.0f;

    // Formant filters
    std::array<FormantFilter, 3> formantFilters;

    //==========================================================================
    // Parameters
    //==========================================================================

    WaveformType waveform = WaveformType::Saw;
    float tuneOffset = 0.0f;      // semitones
    float pulseWidth = 0.5f;
    float vowelValue = 0.0f;      // 0-4 for A/E/I/O/U with interpolation
    float formantShift = 0.0f;    // semitones
    float formantSpread = 1.0f;   // 0.5-2.0
    float vibratoRate = 5.0f;     // Hz
    float vibratoDepth = 0.0f;    // 0-1
    float vowelLfoRate = 0.5f;    // Hz
    float vowelLfoDepth = 0.0f;   // 0-1

    // ADSR parameters
    float attackTime = 0.01f;
    float decayTime = 0.1f;
    float sustainLevel = 0.7f;
    float releaseTime = 0.3f;

    float masterLevel = 0.8f;
};
