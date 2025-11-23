/**
 * @file SynthEngine.h
 * @brief Polyphonic synthesizer engine for A111-5 VCO clone
 *
 * Manages 4-voice polyphony with voice stealing.
 */

#pragma once

#include <array>
#include <algorithm>
#include "Voice.h"

/**
 * @brief Main synthesizer engine
 */
class SynthEngine
{
public:
    static constexpr int MAX_VOICES = 4;
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

        for (auto& voice : voices)
        {
            voice.prepare(sampleRate);
        }

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
        (void)sampleOffset; // Unused for now

        if (velocity <= 0.0f)
        {
            noteOff(note, sampleOffset);
            return;
        }

        Voice* voice = findFreeVoice(note);
        if (voice)
        {
            // Apply current parameters before noteOn
            applyParametersToVoice(*voice);
            voice->noteOn(note, velocity);
        }
    }

    void noteOff(int note, int sampleOffset = 0)
    {
        (void)sampleOffset; // Unused for now

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
        std::fill(mixBufferL.begin(), mixBufferL.begin() + numSamples, 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.begin() + numSamples, 0.0f);

        for (auto& voice : voices)
        {
            if (voice.isActive())
            {
                applyParametersToVoice(voice);
                voice.render(mixBufferL.data(), mixBufferR.data(), numSamples);
            }
        }

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

    void setWaveform(int wf) { waveform = wf; }
    void setTune(float semitones) { tune = semitones; }
    void setFine(float cents) { fine = cents; }
    void setPulseWidth(float pw) { pulseWidth = pw; }
    void setSubLevel(float level) { subLevel = level; }
    void setSyncEnable(bool enable) { syncEnable = enable; }
    void setFMAmount(float amount) { fmAmount = amount; }
    void setFMRatio(float ratio) { fmRatio = ratio; }
    void setAttack(float seconds) { attack = seconds; }
    void setDecay(float seconds) { decay = seconds; }
    void setSustain(float level) { sustain = level; }
    void setRelease(float seconds) { release = seconds; }
    void setMasterLevel(float level) { masterLevel = level; }

    void setMasterVolume(float volumeLinear)
    {
        masterGain = volumeLinear;
    }

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

        // Steal oldest voice in release phase
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

    void applyParametersToVoice(Voice& voice)
    {
        voice.setWaveform(waveform);
        voice.setTune(tune);
        voice.setFine(fine);
        voice.setPulseWidth(pulseWidth);
        voice.setSubLevel(subLevel);
        voice.setSyncEnable(syncEnable);
        voice.setFMAmount(fmAmount);
        voice.setFMRatio(fmRatio);
        voice.setAttack(attack);
        voice.setDecay(decay);
        voice.setSustain(sustain);
        voice.setRelease(release);
        voice.setMasterLevel(masterLevel);
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
    float masterGain = 0.8f;

    //==========================================================================
    // Global Parameters
    //==========================================================================

    int waveform = 2;        // Default: Saw
    float tune = 0.0f;       // semitones
    float fine = 0.0f;       // cents
    float pulseWidth = 0.5f;
    float subLevel = 0.0f;
    bool syncEnable = false;
    float fmAmount = 0.0f;
    float fmRatio = 1.0f;
    float attack = 0.01f;
    float decay = 0.1f;
    float sustain = 0.7f;
    float release = 0.3f;
    float masterLevel = 0.8f;
};
