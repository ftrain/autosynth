/**
 * @file SynthEngine.h
 * @brief SID Wave polyphonic synthesizer engine
 *
 * Signal Flow:
 *   MIDI -> Voice Manager -> [Voice Pool (4 voices)] -> [Mix] -> Output
 */

#pragma once

#include <array>
#include <algorithm>
#include "Voice.h"

/**
 * @brief Main SID Wave synthesizer engine
 */
class SynthEngine
{
public:
    //==========================================================================
    // Configuration
    //==========================================================================

    /** 4 voices like SID (SID had 3, we give 4 for flexibility) */
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
        juce::ignoreUnused(sampleOffset);

        if (velocity <= 0.0f)
        {
            noteOff(note, sampleOffset);
            return;
        }

        Voice* voice = findFreeVoice(note);
        if (voice)
        {
            // Apply current parameters to voice before note on
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
        for (int i = 0; i < numSamples; ++i)
        {
            outputL[i] = mixBufferL[i] * masterGain;
            outputR[i] = mixBufferR[i] * masterGain;
        }
    }

    //==========================================================================
    // Parameter Setters
    //==========================================================================

    // Oscillator 1
    void setOsc1Wave(int wave) { osc1Wave = wave; }
    void setOsc1Tune(float semitones) { osc1Tune = semitones; }
    void setOsc1PW(float pw) { osc1PW = pw; }
    void setOsc1Level(float level) { osc1Level = level; }

    // Oscillator 2
    void setOsc2Wave(int wave) { osc2Wave = wave; }
    void setOsc2Tune(float semitones) { osc2Tune = semitones; }
    void setOsc2PW(float pw) { osc2PW = pw; }
    void setOsc2Level(float level) { osc2Level = level; }
    void setOsc2Ring(float ring) { osc2Ring = ring; }

    // Oscillator 3
    void setOsc3Wave(int wave) { osc3Wave = wave; }
    void setOsc3Tune(float semitones) { osc3Tune = semitones; }
    void setOsc3Level(float level) { osc3Level = level; }

    // Lo-Fi
    void setBitDepth(int bits) { bitDepth = bits; }
    void setSampleRate(float rate) { sampleRateReduction = rate; }

    // Filter
    void setFilterCutoff(float hz) { filterCutoff = hz; }
    void setFilterReso(float reso) { filterReso = reso; }
    void setFilterType(int type) { filterType = type; }

    // Envelope
    void setAmpAttack(float seconds) { ampAttack = seconds; }
    void setAmpDecay(float seconds) { ampDecay = seconds; }
    void setAmpSustain(float level) { ampSustain = level; }
    void setAmpRelease(float seconds) { ampRelease = seconds; }

    // Master
    void setMasterLevel(float level) { masterGain = level; }

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
        // Oscillator 1
        voice.setOsc1Wave(osc1Wave);
        voice.setOsc1Tune(osc1Tune);
        voice.setOsc1PW(osc1PW);
        voice.setOsc1Level(osc1Level);

        // Oscillator 2
        voice.setOsc2Wave(osc2Wave);
        voice.setOsc2Tune(osc2Tune);
        voice.setOsc2PW(osc2PW);
        voice.setOsc2Level(osc2Level);
        voice.setOsc2Ring(osc2Ring);

        // Oscillator 3
        voice.setOsc3Wave(osc3Wave);
        voice.setOsc3Tune(osc3Tune);
        voice.setOsc3Level(osc3Level);

        // Lo-Fi
        voice.setBitDepth(bitDepth);
        voice.setSampleRateReduction(sampleRateReduction);

        // Filter
        voice.setFilterCutoff(filterCutoff);
        voice.setFilterReso(filterReso);
        voice.setFilterMode(filterType);

        // Envelope
        voice.setAttack(ampAttack);
        voice.setDecay(ampDecay);
        voice.setSustain(ampSustain);
        voice.setRelease(ampRelease);
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
    // Cached Parameters
    //==========================================================================

    // Oscillator 1
    int osc1Wave = 1;       // Saw
    float osc1Tune = 0.0f;
    float osc1PW = 0.5f;
    float osc1Level = 0.8f;

    // Oscillator 2
    int osc2Wave = 0;       // Pulse
    float osc2Tune = 0.0f;
    float osc2PW = 0.5f;
    float osc2Level = 0.5f;
    float osc2Ring = 0.0f;

    // Oscillator 3
    int osc3Wave = 2;       // Triangle
    float osc3Tune = 0.0f;
    float osc3Level = 0.3f;

    // Lo-Fi
    int bitDepth = 8;
    float sampleRateReduction = 1.0f;

    // Filter
    float filterCutoff = 8000.0f;
    float filterReso = 0.2f;
    int filterType = 0;     // LP

    // Envelope
    float ampAttack = 0.01f;
    float ampDecay = 0.2f;
    float ampSustain = 0.7f;
    float ampRelease = 0.3f;
};
