/**
 * @file DrumVoice.h
 * @brief FM drum synthesis voice for a single drum channel
 *
 * Signal Flow:
 *   Modulator (sine) -> FM Depth -> Carrier (sine) -> Amp Env -> Output
 *                           |             |
 *                      Pitch Env     Noise Mix
 *
 * Each drum has fast exponential envelopes for punchy, percussive sounds.
 * Pitch envelope sweeps the carrier frequency down for classic FM drum sounds.
 */

#pragma once

#include <cmath>
#include <random>

/**
 * @brief Single FM drum voice (one-shot trigger)
 */
class DrumVoice
{
public:
    DrumVoice() = default;
    ~DrumVoice() = default;

    void prepare(double sampleRate)
    {
        this->sampleRate = sampleRate;
        sampleRateInv = 1.0f / static_cast<float>(sampleRate);
    }

    void trigger(float vel)
    {
        velocity = vel;
        active = true;
        phase = 0.0f;
        modPhase = 0.0f;
        pitchEnvValue = 1.0f;
        ampEnvValue = 1.0f;

        // Calculate decay coefficients from times
        pitchDecayCoeff = std::exp(-1.0f / (pitchDecayTime * static_cast<float>(sampleRate)));
        ampDecayCoeff = std::exp(-1.0f / (ampDecayTime * static_cast<float>(sampleRate)));
    }

    void render(float* outputL, float* outputR, int numSamples)
    {
        if (!active)
            return;

        static constexpr float TWO_PI = 6.283185307179586f;

        for (int i = 0; i < numSamples; ++i)
        {
            // Exponential decay envelopes
            pitchEnvValue *= pitchDecayCoeff;
            ampEnvValue *= ampDecayCoeff;

            // Check if voice is done (amplitude below threshold)
            if (ampEnvValue < 0.0001f)
            {
                active = false;
                return;
            }

            // Calculate current frequency with pitch envelope
            // Pitch envelope sweeps from high to base frequency
            float pitchMod = 1.0f + pitchAmount * pitchEnvValue * 4.0f; // Up to 4x freq at start
            float currentFreq = carrierFreq * pitchMod;
            float modFreq = currentFreq * modRatio;

            // Phase increments
            float phaseInc = currentFreq * sampleRateInv;
            float modPhaseInc = modFreq * sampleRateInv;

            // FM modulator
            float modulator = std::sin(modPhase * TWO_PI);
            modPhase += modPhaseInc;
            if (modPhase >= 1.0f) modPhase -= 1.0f;

            // FM carrier with modulation
            float fmIndex = modDepth * 6.0f; // FM index range 0-6
            float carrier = std::sin((phase + modulator * fmIndex / TWO_PI) * TWO_PI);
            phase += phaseInc;
            if (phase >= 1.0f) phase -= 1.0f;

            // Noise component (for snare/hat)
            float noise = 0.0f;
            if (noiseAmount > 0.0f)
            {
                noise = (dist(rng) * 2.0f - 1.0f) * noiseAmount;
            }

            // Mix carrier and noise
            float output = (carrier * (1.0f - noiseAmount) + noise) * ampEnvValue * velocity * level;

            // Soft clip for warmth
            output = std::tanh(output * 1.5f);

            // Output
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    bool isActive() const { return active; }

    // Parameter setters
    void setCarrierFreq(float freq) { carrierFreq = freq; }
    void setModRatio(float ratio) { modRatio = ratio; }
    void setModDepth(float depth) { modDepth = depth; }
    void setPitchDecay(float ms) { pitchDecayTime = ms * 0.001f; }
    void setPitchAmount(float amt) { pitchAmount = amt; }
    void setAmpDecay(float ms) { ampDecayTime = ms * 0.001f; }
    void setNoiseAmount(float noise) { noiseAmount = noise; }
    void setLevel(float lvl) { level = lvl; }

private:
    double sampleRate = 44100.0;
    float sampleRateInv = 1.0f / 44100.0f;

    bool active = false;
    float velocity = 1.0f;

    // Oscillator state
    float phase = 0.0f;
    float modPhase = 0.0f;

    // Envelope state
    float pitchEnvValue = 0.0f;
    float ampEnvValue = 0.0f;
    float pitchDecayCoeff = 0.999f;
    float ampDecayCoeff = 0.9999f;

    // Parameters
    float carrierFreq = 60.0f;   // Hz
    float modRatio = 1.0f;
    float modDepth = 0.5f;       // 0-1
    float pitchDecayTime = 0.05f; // seconds
    float pitchAmount = 0.8f;    // 0-1
    float ampDecayTime = 0.4f;   // seconds
    float noiseAmount = 0.0f;    // 0-1
    float level = 0.8f;          // 0-1

    // Noise generator
    std::mt19937 rng{std::random_device{}()};
    std::uniform_real_distribution<float> dist{0.0f, 1.0f};
};
