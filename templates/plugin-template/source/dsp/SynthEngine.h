/**
 * @file SynthEngine.h
 * @brief Polyphonic synthesizer engine managing multiple voices
 *
 * The SynthEngine is the top-level DSP orchestrator. It:
 * - Manages a pool of voices for polyphony
 * - Handles voice allocation and stealing
 * - Routes MIDI to voices
 * - Applies global effects
 * - Provides parameters to voices
 *
 * Signal Flow:
 *   MIDI -> Voice Manager -> [Voice Pool] -> [Mix] -> [Effects] -> Output
 *
 * @note This class is called from the audio thread - no allocations allowed
 */

#pragma once

#include <array>
#include <algorithm>
#include "Voice.h"

// SST Effects (uncomment when needed)
// #include "sst/effects/Reverb.h"
// #include "sst/effects/Delay.h"
// #include "sst/effects/Chorus.h"

/**
 * @brief Main synthesizer engine
 *
 * Manages polyphony, voice stealing, and global effects.
 */
class SynthEngine
{
public:
    //==========================================================================
    // Configuration
    //==========================================================================

    /** Maximum number of simultaneous voices */
    static constexpr int MAX_VOICES = 16;

    /** Block size for internal processing */
    static constexpr int BLOCK_SIZE = 64;

    SynthEngine() = default;
    ~SynthEngine() = default;

    //==========================================================================
    // Lifecycle
    //==========================================================================

    /**
     * @brief Prepare the engine for playback
     * @param sampleRate Sample rate in Hz
     * @param maxBlockSize Maximum expected block size
     */
    void prepare(double sampleRate, int maxBlockSize)
    {
        this->sampleRate = sampleRate;
        this->maxBlockSize = maxBlockSize;

        // Prepare all voices
        for (auto& voice : voices)
        {
            voice.prepare(sampleRate);
        }

        // TODO: Prepare effects
        // Example:
        // reverb.prepare(sampleRate, maxBlockSize);
        // delay.prepare(sampleRate, maxBlockSize);

        // Clear buffers
        std::fill(mixBufferL.begin(), mixBufferL.end(), 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.end(), 0.0f);
    }

    /**
     * @brief Release resources
     */
    void releaseResources()
    {
        allNotesOff();
    }

    //==========================================================================
    // MIDI Handling
    //==========================================================================

    /**
     * @brief Handle MIDI note on
     * @param note MIDI note number (0-127)
     * @param velocity Note velocity (0.0-1.0)
     * @param sampleOffset Sample offset within current block
     */
    void noteOn(int note, float velocity, int sampleOffset = 0)
    {
        juce::ignoreUnused(sampleOffset); // TODO: Implement sample-accurate timing

        if (velocity <= 0.0f)
        {
            noteOff(note, sampleOffset);
            return;
        }

        Voice* voice = findFreeVoice(note);
        if (voice)
        {
            voice->noteOn(note, velocity);
        }
    }

    /**
     * @brief Handle MIDI note off
     * @param note MIDI note number (0-127)
     * @param sampleOffset Sample offset within current block
     */
    void noteOff(int note, int sampleOffset = 0)
    {
        juce::ignoreUnused(sampleOffset);

        for (auto& voice : voices)
        {
            if (voice.isActive() && voice.getNote() == note && !voice.isReleasing())
            {
                voice.noteOff();
                // Don't break - release all voices playing this note
            }
        }
    }

    /**
     * @brief Stop all notes immediately
     */
    void allNotesOff()
    {
        for (auto& voice : voices)
        {
            voice.kill();
        }
    }

    /**
     * @brief Set pitch bend amount
     * @param bend Pitch bend value (-1.0 to 1.0)
     */
    void setPitchBend(float bend)
    {
        pitchBend = bend;
        // TODO: Apply pitch bend to all active voices
    }

    //==========================================================================
    // Audio Rendering
    //==========================================================================

    /**
     * @brief Render audio output
     * @param outputL Left channel output buffer
     * @param outputR Right channel output buffer
     * @param numSamples Number of samples to render
     */
    void renderBlock(float* outputL, float* outputR, int numSamples)
    {
        // Clear mix buffers
        std::fill(mixBufferL.begin(), mixBufferL.begin() + numSamples, 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.begin() + numSamples, 0.0f);

        // Render all active voices
        for (auto& voice : voices)
        {
            if (voice.isActive())
            {
                // TODO: Update voice parameters before rendering
                // voice.setFilterCutoff(filterCutoff);
                // voice.setFilterResonance(filterResonance);

                voice.render(mixBufferL.data(), mixBufferR.data(), numSamples);
            }
        }

        // ====================================================================
        // GLOBAL EFFECTS
        // TODO: Add effects processing
        // ====================================================================

        // TODO: Apply effects
        // Example:
        // if (reverbEnabled) {
        //     reverb.process(mixBufferL.data(), mixBufferR.data(), numSamples);
        // }

        // Apply master volume
        float gain = masterGain;
        for (int i = 0; i < numSamples; ++i)
        {
            outputL[i] = mixBufferL[i] * gain;
            outputR[i] = mixBufferR[i] * gain;
        }
    }

    //==========================================================================
    // Parameter Setters
    //==========================================================================

    // TODO: Add parameter setters for your synth
    // These should store values that get passed to voices in renderBlock

    void setMasterVolume(float volumeDb)
    {
        // Convert dB to linear gain
        masterGain = std::pow(10.0f, volumeDb / 20.0f);
    }

    // void setFilterCutoff(float cutoffHz) { filterCutoff = cutoffHz; }
    // void setFilterResonance(float reso) { filterResonance = reso; }
    // void setReverbMix(float mix) { reverbMix = mix; }

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

    /**
     * @brief Find a free voice or steal one
     * @param note The note to be played (used for note stealing priority)
     * @return Pointer to available voice, or nullptr if none available
     */
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

        // No free voice - use voice stealing

        // Strategy 1: Steal oldest voice in release phase
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

        // Strategy 2: Steal oldest playing voice
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
    // Mix Buffers (pre-allocated for real-time safety)
    //==========================================================================

    std::array<float, 8192> mixBufferL{};
    std::array<float, 8192> mixBufferR{};

    //==========================================================================
    // Engine State
    //==========================================================================

    double sampleRate = 44100.0;
    int maxBlockSize = 512;
    float pitchBend = 0.0f;
    float masterGain = 0.5f;  // -6dB default

    //==========================================================================
    // Global Parameters
    // TODO: Add parameters for your synth
    //==========================================================================

    // float filterCutoff = 5000.0f;
    // float filterResonance = 0.0f;
    // float reverbMix = 0.0f;
    // bool reverbEnabled = false;

    //==========================================================================
    // SST Effects
    // TODO: Uncomment and configure for your architecture
    //==========================================================================

    // sst::effects::Reverb reverb;
    // sst::effects::Delay delay;
    // sst::effects::Chorus chorus;
};
