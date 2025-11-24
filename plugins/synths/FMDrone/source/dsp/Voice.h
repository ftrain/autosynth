/**
 * @file Voice.h
 * @brief 2-operator FM synthesis voice optimized for drones
 *
 * Signal Flow:
 *   Modulator (sine) -> [feedback] -> FM Depth -> Carrier (sine) -> Amp Env -> Output
 *                           |                         |
 *                      Mod Envelope              Drift LFO
 *
 * Based on classic DX7-style FM synthesis but simplified for ambient/drone sounds.
 */

#pragma once

#include <cmath>
#include <array>

/**
 * @brief Simple envelope stages
 */
enum class EnvStage
{
    Idle = 0,
    Attack,
    Decay,
    Sustain,
    Release
};

/**
 * @brief 2-operator FM voice for drone synthesis
 */
class Voice
{
public:
    static constexpr int BLOCK_SIZE = 32;
    static constexpr float TWO_PI = 6.283185307179586f;

    Voice() = default;
    ~Voice() = default;

    //==========================================================================
    // Initialization
    //==========================================================================

    void prepare(double sampleRate)
    {
        this->sampleRate = sampleRate;
        sampleRateInv = 1.0f / static_cast<float>(sampleRate);

        // Reset envelope state
        ampEnvStage = EnvStage::Idle;
        ampEnvLevel = 0.0f;
        modEnvStage = EnvStage::Idle;
        modEnvLevel = 0.0f;
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

        // Calculate base frequency from MIDI note
        baseFrequency = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);

        // Reset oscillator phases for clean attack
        carrierPhase = 0.0f;
        modulatorPhase = 0.0f;
        driftPhase = 0.0f;
        feedbackSample = 0.0f;

        // Trigger envelopes
        ampEnvStage = EnvStage::Attack;
        ampEnvLevel = 0.0f;
        modEnvStage = EnvStage::Attack;
        modEnvLevel = 0.0f;
    }

    void noteOff()
    {
        releasing = true;
        ampEnvStage = EnvStage::Release;
        modEnvStage = EnvStage::Release;
    }

    void kill()
    {
        active = false;
        releasing = false;
        currentNote = -1;
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

    // Carrier parameters
    void setCarrierRatio(float ratio) { carrierRatio = ratio; }
    void setCarrierLevel(float level) { carrierLevel = level; }

    // Modulator parameters
    void setModRatio(float ratio) { modRatio = ratio; }
    void setModDepth(float depth) { modDepth = depth; }
    void setModFeedback(float fb) { modFeedback = fb; }

    // Modulator envelope
    void setModAttack(float a) { modAttack = a; }
    void setModDecay(float d) { modDecay = d; }
    void setModSustain(float s) { modSustain = s; }
    void setModRelease(float r) { modRelease = r; }

    // Amp envelope
    void setAmpAttack(float a) { ampAttack = a; }
    void setAmpDecay(float d) { ampDecay = d; }
    void setAmpSustain(float s) { ampSustain = s; }
    void setAmpRelease(float r) { ampRelease = r; }

    // Drift parameters
    void setDriftRate(float rate) { driftRate = rate; }
    void setDriftAmount(float amount) { driftAmount = amount; }

    // Master level
    void setMasterLevel(float level) { masterLevel = level; }

private:
    //==========================================================================
    // Block Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        // Calculate frequencies
        float carrierFreq = baseFrequency * carrierRatio;
        float modulatorFreq = baseFrequency * modRatio;

        // Phase increments
        float carrierPhaseInc = carrierFreq * sampleRateInv;
        float modulatorPhaseInc = modulatorFreq * sampleRateInv;
        float driftPhaseInc = driftRate * sampleRateInv;

        // FM index (modulation amount in radians)
        // Higher values = more harmonics, typical range 0-8
        float maxFmIndex = modDepth * 8.0f;

        for (int i = 0; i < blockSize; ++i)
        {
            // Process envelopes
            float ampEnvOut = processEnvelope(ampEnvStage, ampEnvLevel, ampAttack, ampDecay, ampSustain, ampRelease);
            float modEnvOut = processEnvelope(modEnvStage, modEnvLevel, modAttack, modDecay, modSustain, modRelease);

            // Check if voice has finished
            if (ampEnvStage == EnvStage::Idle && releasing)
            {
                active = false;
                return;
            }

            // Drift LFO (slow sine wave for organic movement)
            float drift = std::sin(driftPhase * TWO_PI) * driftAmount * 0.02f;
            driftPhase += driftPhaseInc;
            if (driftPhase >= 1.0f)
                driftPhase -= 1.0f;

            // Apply drift to both oscillators
            float driftedCarrierPhaseInc = carrierPhaseInc * (1.0f + drift);
            float driftedModPhaseInc = modulatorPhaseInc * (1.0f + drift * 0.5f);

            // Modulator with feedback
            float modulatorInput = modulatorPhase + feedbackSample * modFeedback;
            float modulatorOut = std::sin(modulatorInput * TWO_PI);
            feedbackSample = modulatorOut;

            // Update modulator phase
            modulatorPhase += driftedModPhaseInc;
            if (modulatorPhase >= 1.0f)
                modulatorPhase -= 1.0f;

            // FM synthesis: modulator output modulates carrier phase
            float fmIndex = maxFmIndex * modEnvOut;
            float carrierInput = carrierPhase + (modulatorOut * fmIndex / TWO_PI);
            float carrierOut = std::sin(carrierInput * TWO_PI);

            // Update carrier phase
            carrierPhase += driftedCarrierPhaseInc;
            if (carrierPhase >= 1.0f)
                carrierPhase -= 1.0f;

            // Apply amplitude envelope and levels
            float output = carrierOut * carrierLevel * ampEnvOut * velocity * masterLevel;

            // Soft clip for warmth
            output = std::tanh(output * 1.2f);

            // Output (mono summed to stereo with slight spread from drift)
            float spread = drift * 0.1f;
            outputL[i] += output * (1.0f - spread);
            outputR[i] += output * (1.0f + spread);
        }
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
    float sampleRateInv = 1.0f / 44100.0f;

    // Base frequency from MIDI note
    float baseFrequency = 440.0f;

    // Oscillator phases (0-1 range)
    float carrierPhase = 0.0f;
    float modulatorPhase = 0.0f;
    float driftPhase = 0.0f;

    // Feedback state
    float feedbackSample = 0.0f;

    //==========================================================================
    // Envelope State
    //==========================================================================

    EnvStage ampEnvStage = EnvStage::Idle;
    float ampEnvLevel = 0.0f;
    EnvStage modEnvStage = EnvStage::Idle;
    float modEnvLevel = 0.0f;

    /**
     * @brief Process ADSR envelope
     */
    float processEnvelope(EnvStage& stage, float& level, float attack, float decay, float sustain, float release)
    {
        float delta = sampleRateInv;

        switch (stage)
        {
            case EnvStage::Attack:
            {
                float rate = (attack > 0.001f) ? delta / attack : 1.0f;
                level += rate;
                if (level >= 1.0f)
                {
                    level = 1.0f;
                    stage = EnvStage::Decay;
                }
                break;
            }
            case EnvStage::Decay:
            {
                float rate = (decay > 0.001f) ? delta / decay : 1.0f;
                level -= rate * (1.0f - sustain);
                if (level <= sustain)
                {
                    level = sustain;
                    stage = EnvStage::Sustain;
                }
                break;
            }
            case EnvStage::Sustain:
                level = sustain;
                break;

            case EnvStage::Release:
            {
                float rate = (release > 0.001f) ? delta / release : 1.0f;
                level -= rate * sustain;
                if (level <= 0.0f)
                {
                    level = 0.0f;
                    stage = EnvStage::Idle;
                }
                break;
            }
            case EnvStage::Idle:
            default:
                level = 0.0f;
                break;
        }

        return level;
    }

    //==========================================================================
    // Parameter Values
    //==========================================================================

    // Carrier
    float carrierRatio = 1.0f;
    float carrierLevel = 0.8f;

    // Modulator
    float modRatio = 2.0f;
    float modDepth = 0.3f;
    float modFeedback = 0.0f;

    // Modulator envelope (very long times for drones)
    float modAttack = 5.0f;
    float modDecay = 10.0f;
    float modSustain = 0.7f;
    float modRelease = 8.0f;

    // Amp envelope (very long times for drones)
    float ampAttack = 3.0f;
    float ampDecay = 5.0f;
    float ampSustain = 0.9f;
    float ampRelease = 10.0f;

    // Drift
    float driftRate = 0.1f;
    float driftAmount = 0.2f;

    // Master
    float masterLevel = 0.7f;
};
