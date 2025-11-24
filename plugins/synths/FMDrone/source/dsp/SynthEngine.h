/**
 * @file SynthEngine.h
 * @brief Polyphonic FM synthesizer engine for FM Drone
 *
 * The SynthEngine manages polyphony and passes FM parameters to voices.
 *
 * Signal Flow:
 *   MIDI -> Voice Manager -> [Voice Pool] -> [Mix] -> Output
 */

#pragma once

#include <array>
#include <algorithm>
#include "Voice.h"

/**
 * @brief FM Drone synthesizer engine
 *
 * Manages 4-voice polyphony with FM synthesis parameters.
 */
class SynthEngine
{
public:
    //==========================================================================
    // Configuration
    //==========================================================================

    /** Maximum number of simultaneous voices (4 for drones) */
    static constexpr int MAX_VOICES = 4;

    /** Block size for internal processing */
    static constexpr int BLOCK_SIZE = 64;

    SynthEngine() = default;
    ~SynthEngine() = default;

    //==========================================================================
    // Lifecycle
    //==========================================================================

    void prepare(double sampleRate, int maxBlockSize)
    {
        this->sampleRate = sampleRate;
        this->maxBlockSize = maxBlockSize;

        // Prepare all voices
        for (auto& voice : voices)
        {
            voice.prepare(sampleRate);
        }

        // Clear buffers
        std::fill(mixBufferL.begin(), mixBufferL.end(), 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.end(), 0.0f);
    }

    void releaseResources()
    {
        allNotesOff();
    }

    //==========================================================================
    // MIDI Handling
    //==========================================================================

    void noteOn(int note, float velocity, int sampleOffset = 0)
    {
        juce::ignoreUnused(sampleOffset);

        if (velocity <= 0.0f)
        {
            noteOff(note, sampleOffset);
            return;
        }

        Voice* voice = findFreeVoice(note);
        if (voice)
        {
            // Apply current parameters to voice before noteOn
            applyParametersToVoice(*voice);
            voice->noteOn(note, velocity);
        }
    }

    void noteOff(int note, int sampleOffset = 0)
    {
        juce::ignoreUnused(sampleOffset);

        for (auto& voice : voices)
        {
            if (voice.isActive() && voice.getNote() == note && !voice.isReleasing())
            {
                voice.noteOff();
            }
        }
    }

    void allNotesOff()
    {
        for (auto& voice : voices)
        {
            voice.kill();
        }
    }

    void setPitchBend(float bend)
    {
        pitchBend = bend;
    }

    //==========================================================================
    // Audio Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int numSamples)
    {
        // Clear mix buffers
        std::fill(mixBufferL.begin(), mixBufferL.begin() + numSamples, 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.begin() + numSamples, 0.0f);

        // Update and render all active voices
        for (auto& voice : voices)
        {
            if (voice.isActive())
            {
                // Update voice parameters
                applyParametersToVoice(voice);
                voice.render(mixBufferL.data(), mixBufferR.data(), numSamples);
            }
        }

        // Copy to output with master gain
        float gain = masterGain;
        for (int i = 0; i < numSamples; ++i)
        {
            outputL[i] = mixBufferL[i] * gain;
            outputR[i] = mixBufferR[i] * gain;
        }
    }

    //==========================================================================
    // FM Parameter Setters
    //==========================================================================

    // Carrier
    void setCarrierRatio(float ratio) { carrierRatio = ratio; }
    void setCarrierLevel(float level) { carrierLevel = level; }

    // Modulator
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

    // Drift
    void setDriftRate(float rate) { driftRate = rate; }
    void setDriftAmount(float amount) { driftAmount = amount; }

    // Master
    void setMasterLevel(float level) { masterLevel = level; masterGain = level; }

    //==========================================================================
    // State Queries
    //==========================================================================

    int getActiveVoiceCount() const
    {
        int count = 0;
        for (const auto& voice : voices)
        {
            if (voice.isActive())
                ++count;
        }
        return count;
    }

private:
    //==========================================================================
    // Voice Management
    //==========================================================================

    void applyParametersToVoice(Voice& voice)
    {
        voice.setCarrierRatio(carrierRatio);
        voice.setCarrierLevel(carrierLevel);
        voice.setModRatio(modRatio);
        voice.setModDepth(modDepth);
        voice.setModFeedback(modFeedback);
        voice.setModAttack(modAttack);
        voice.setModDecay(modDecay);
        voice.setModSustain(modSustain);
        voice.setModRelease(modRelease);
        voice.setAmpAttack(ampAttack);
        voice.setAmpDecay(ampDecay);
        voice.setAmpSustain(ampSustain);
        voice.setAmpRelease(ampRelease);
        voice.setDriftRate(driftRate);
        voice.setDriftAmount(driftAmount);
        voice.setMasterLevel(masterLevel);
    }

    Voice* findFreeVoice(int note)
    {
        // First, look for an inactive voice
        for (auto& voice : voices)
        {
            if (!voice.isActive())
            {
                return &voice;
            }
        }

        // Voice stealing: oldest voice in release phase
        Voice* oldest = nullptr;
        int oldestAge = -1;

        for (auto& voice : voices)
        {
            if (voice.isReleasing() && voice.getAge() > oldestAge)
            {
                oldest = &voice;
                oldestAge = voice.getAge();
            }
        }

        if (oldest)
        {
            oldest->kill();
            return oldest;
        }

        // Steal oldest playing voice
        for (auto& voice : voices)
        {
            if (voice.getAge() > oldestAge)
            {
                oldest = &voice;
                oldestAge = voice.getAge();
            }
        }

        if (oldest)
        {
            oldest->kill();
            return oldest;
        }

        return nullptr;
    }

    //==========================================================================
    // Voice Pool
    //==========================================================================

    std::array<Voice, MAX_VOICES> voices;

    //==========================================================================
    // Mix Buffers
    //==========================================================================

    std::array<float, 8192> mixBufferL{};
    std::array<float, 8192> mixBufferR{};

    //==========================================================================
    // Engine State
    //==========================================================================

    double sampleRate = 44100.0;
    int maxBlockSize = 512;
    float pitchBend = 0.0f;
    float masterGain = 0.7f;

    //==========================================================================
    // FM Parameters (cached for voice updates)
    //==========================================================================

    // Carrier
    float carrierRatio = 1.0f;
    float carrierLevel = 0.8f;

    // Modulator
    float modRatio = 2.0f;
    float modDepth = 0.3f;
    float modFeedback = 0.0f;

    // Modulator envelope (very long for drones)
    float modAttack = 5.0f;
    float modDecay = 10.0f;
    float modSustain = 0.7f;
    float modRelease = 8.0f;

    // Amp envelope (very long for drones)
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
