/**
 * @file SynthEngine.h
 * @brief Polyphonic synthesizer engine for Phoneme formant synthesizer
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
        (void)sampleOffset;

        if (velocity <= 0.0f)
        {
            noteOff(note, sampleOffset);
            return;
        }

        Voice* voice = findFreeVoice(note);
        if (voice)
        {
            applyParametersToVoice(*voice);
            voice->noteOn(note, velocity);
        }
    }

    void noteOff(int note, int sampleOffset = 0)
    {
        (void)sampleOffset;

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
    void setPulseWidth(float pw) { pulseWidth = pw; }
    void setVowel(float v) { vowel = v; }
    void setFormantShift(float shift) { formantShift = shift; }
    void setFormantSpread(float spread) { formantSpread = spread; }
    void setVibratoRate(float rate) { vibratoRate = rate; }
    void setVibratoDepth(float depth) { vibratoDepth = depth; }
    void setVowelLfoRate(float rate) { vowelLfoRate = rate; }
    void setVowelLfoDepth(float depth) { vowelLfoDepth = depth; }
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
        voice.setPulseWidth(pulseWidth);
        voice.setVowel(vowel);
        voice.setFormantShift(formantShift);
        voice.setFormantSpread(formantSpread);
        voice.setVibratoRate(vibratoRate);
        voice.setVibratoDepth(vibratoDepth);
        voice.setVowelLfoRate(vowelLfoRate);
        voice.setVowelLfoDepth(vowelLfoDepth);
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

    int waveform = 0;            // 0=Saw, 1=Pulse
    float tune = 0.0f;           // semitones
    float pulseWidth = 0.5f;
    float vowel = 0.0f;          // 0-4 for A/E/I/O/U
    float formantShift = 0.0f;   // semitones
    float formantSpread = 1.0f;  // 0.5-2.0
    float vibratoRate = 5.0f;    // Hz
    float vibratoDepth = 0.0f;   // 0-1
    float vowelLfoRate = 0.5f;   // Hz
    float vowelLfoDepth = 0.0f;  // 0-1
    float attack = 0.01f;
    float decay = 0.1f;
    float sustain = 0.7f;
    float release = 0.3f;
    float masterLevel = 0.8f;
};
