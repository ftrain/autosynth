/**
 * @file Voice.h
 * @brief Single synthesizer voice for A111-5 VCO clone
 *
 * Doepfer A-111-5 High-End VCO features:
 * - Multiple waveforms (sine/tri/saw/pulse)
 * - Sub-oscillator
 * - Hard sync
 * - Linear FM
 * - PWM
 *
 * Signal Flow:
 *   Main Osc (with FM) -> [Mix with Sub] -> Amp Envelope -> Output
 */

#pragma once

#include <cmath>
#include <array>
#include <algorithm>

/**
 * @brief Waveform types for the main oscillator
 */
enum class Waveform
{
    Sine = 0,
    Triangle = 1,
    Saw = 2,
    Pulse = 3
};

/**
 * @brief Single synthesizer voice
 *
 * Each voice contains:
 * - Main oscillator with multiple waveforms
 * - Sub oscillator (one octave down)
 * - Linear FM modulation
 * - Hard sync capability
 * - Amplitude envelope
 */
class Voice
{
public:
    static constexpr int BLOCK_SIZE = 32;

    Voice() = default;
    ~Voice() = default;

    //==========================================================================
    // Initialization
    //==========================================================================

    void prepare(double sampleRate)
    {
        this->sampleRate = sampleRate;
        phase = 0.0f;
        subPhase = 0.0f;
        fmPhase = 0.0f;
        envLevel = 0.0f;
        envStage = EnvStage::Idle;
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
        subPhase = 0.0f;
        fmPhase = 0.0f;

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

    void setWaveform(int wf) { waveform = static_cast<Waveform>(std::clamp(wf, 0, 3)); }
    void setTune(float semitones) { tuneOffset = semitones; }
    void setFine(float cents) { fineOffset = cents; }
    void setPulseWidth(float pw) { pulseWidth = std::clamp(pw, 0.01f, 0.99f); }
    void setSubLevel(float level) { subLevel = level; }
    void setSyncEnable(bool enable) { syncEnabled = enable; }
    void setFMAmount(float amount) { fmAmount = amount; }
    void setFMRatio(float ratio) { fmRatio = std::clamp(ratio, 0.5f, 8.0f); }
    void setAttack(float seconds) { attackTime = std::max(0.001f, seconds); }
    void setDecay(float seconds) { decayTime = std::max(0.001f, seconds); }
    void setSustain(float level) { sustainLevel = std::clamp(level, 0.0f, 1.0f); }
    void setRelease(float seconds) { releaseTime = std::max(0.001f, seconds); }
    void setMasterLevel(float level) { masterLevel = level; }

private:
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
    // Block Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        // Calculate actual frequency with tuning
        float tunedFreq = baseFrequency * std::pow(2.0f, tuneOffset / 12.0f + fineOffset / 1200.0f);
        float phaseInc = tunedFreq / static_cast<float>(sampleRate);
        float subPhaseInc = phaseInc * 0.5f; // Sub is one octave down
        float fmPhaseInc = (tunedFreq * fmRatio) / static_cast<float>(sampleRate);

        for (int i = 0; i < blockSize; ++i)
        {
            // ================================================================
            // FM MODULATOR (sine wave)
            // ================================================================
            float fmMod = 0.0f;
            if (fmAmount > 0.0f)
            {
                fmMod = std::sin(fmPhase * 2.0f * 3.14159265359f) * fmAmount * tunedFreq;
                fmPhase += fmPhaseInc;
                if (fmPhase >= 1.0f)
                    fmPhase -= 1.0f;
            }

            // Apply FM to main oscillator phase increment
            float modulatedPhaseInc = (tunedFreq + fmMod) / static_cast<float>(sampleRate);
            modulatedPhaseInc = std::max(0.0f, modulatedPhaseInc); // Prevent negative frequencies

            // ================================================================
            // MAIN OSCILLATOR with multiple waveforms
            // ================================================================
            float oscOut = 0.0f;

            switch (waveform)
            {
                case Waveform::Sine:
                    oscOut = std::sin(phase * 2.0f * 3.14159265359f);
                    break;

                case Waveform::Triangle:
                    // Triangle: 4 * |phase - 0.5| - 1
                    oscOut = 4.0f * std::abs(phase - 0.5f) - 1.0f;
                    break;

                case Waveform::Saw:
                    // Saw with simple anti-aliasing (PolyBLEP)
                    oscOut = polyBlepSaw(phase, modulatedPhaseInc);
                    break;

                case Waveform::Pulse:
                    // Pulse with PWM
                    oscOut = polyBlepPulse(phase, modulatedPhaseInc, pulseWidth);
                    break;
            }

            // Advance main oscillator phase
            phase += modulatedPhaseInc;

            // Hard sync - reset phase when sub oscillator completes a cycle
            if (syncEnabled)
            {
                float prevSubPhase = subPhase;
                subPhase += subPhaseInc;
                if (subPhase >= 1.0f)
                {
                    subPhase -= 1.0f;
                    phase = subPhase / subPhaseInc * modulatedPhaseInc; // Reset with phase correction
                }
            }
            else
            {
                subPhase += subPhaseInc;
                if (subPhase >= 1.0f)
                    subPhase -= 1.0f;
            }

            if (phase >= 1.0f)
                phase -= 1.0f;

            // ================================================================
            // SUB OSCILLATOR (sine, one octave down)
            // ================================================================
            float subOut = std::sin(subPhase * 2.0f * 3.14159265359f) * subLevel;

            // ================================================================
            // MIX
            // ================================================================
            float mixOut = oscOut + subOut;

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
            float output = mixOut * envOut * velocity * masterLevel;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    //==========================================================================
    // PolyBLEP Anti-aliasing
    //==========================================================================

    float polyBlep(float t, float dt)
    {
        // 0 <= t < 1
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

    float polyBlepSaw(float phase, float dt)
    {
        float value = 2.0f * phase - 1.0f;
        value -= polyBlep(phase, dt);
        return value;
    }

    float polyBlepPulse(float phase, float dt, float pw)
    {
        float value = phase < pw ? 1.0f : -1.0f;
        value += polyBlep(phase, dt);
        value -= polyBlep(std::fmod(phase + 1.0f - pw, 1.0f), dt);
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
                // Hold at sustain level until note off
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

    // Oscillator phases
    float phase = 0.0f;
    float subPhase = 0.0f;
    float fmPhase = 0.0f;

    // Envelope state
    EnvStage envStage = EnvStage::Idle;
    float envLevel = 0.0f;

    //==========================================================================
    // Parameters
    //==========================================================================

    Waveform waveform = Waveform::Saw;
    float tuneOffset = 0.0f;      // semitones
    float fineOffset = 0.0f;      // cents
    float pulseWidth = 0.5f;
    float subLevel = 0.0f;
    bool syncEnabled = false;
    float fmAmount = 0.0f;
    float fmRatio = 1.0f;

    // ADSR parameters
    float attackTime = 0.01f;
    float decayTime = 0.1f;
    float sustainLevel = 0.7f;
    float releaseTime = 0.3f;

    float masterLevel = 0.8f;
};
