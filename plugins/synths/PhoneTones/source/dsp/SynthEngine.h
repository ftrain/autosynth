/**
 * @file SynthEngine.h
 * @brief Phone Tones synth engine - monophonic telephone sound generator
 */

#pragma once

#include "Voice.h"
#include <array>

/**
 * @brief Monophonic synth engine for Phone Tones
 */
class SynthEngine
{
public:
    static constexpr int MAX_VOICES = 1; // Monophonic

    SynthEngine() = default;
    ~SynthEngine() = default;

    void prepare(double sampleRate, int /*samplesPerBlock*/)
    {
        this->sampleRate = sampleRate;
        voice.prepare(sampleRate);
    }

    void releaseResources()
    {
        voice.kill();
    }

    void noteOn(int note, float velocity, int /*samplePosition*/)
    {
        // Monophonic - just retrigger the single voice
        voice.noteOn(note, velocity);
    }

    void noteOff(int note, int /*samplePosition*/)
    {
        if (voice.getNote() == note)
        {
            voice.noteOff();
        }
    }

    void allNotesOff()
    {
        voice.kill();
    }

    void setPitchBend(float /*bend*/)
    {
        // Not used for telephone tones
    }

    void renderBlock(float* leftChannel, float* rightChannel, int numSamples)
    {
        if (voice.isActive())
        {
            voice.render(leftChannel, rightChannel, numSamples);
        }
    }

    //==========================================================================
    // Parameter Setters - forwarded to voice
    //==========================================================================

    void setToneMode(int mode) { voice.setToneMode(mode); }
    void setTone1Freq(float freq) { voice.setTone1Freq(freq); }
    void setTone2Freq(float freq) { voice.setTone2Freq(freq); }
    void setToneMix(float mix) { voice.setToneMix(mix); }
    void setFilterLow(float freq) { voice.setFilterLow(freq); }
    void setFilterHigh(float freq) { voice.setFilterHigh(freq); }
    void setFilterDrive(float drive) { voice.setFilterDrive(drive); }
    void setNoiseLevel(float level) { voice.setNoiseLevel(level); }
    void setNoiseCrackle(float crackle) { voice.setNoiseCrackle(crackle); }
    void setPatternRate(float rate) { voice.setPatternRate(rate); }
    void setPatternDuty(float duty) { voice.setPatternDuty(duty); }
    void setAttack(float seconds) { voice.setAttack(seconds); }
    void setDecay(float seconds) { voice.setDecay(seconds); }
    void setSustain(float level) { voice.setSustain(level); }
    void setRelease(float seconds) { voice.setRelease(seconds); }
    void setMasterLevel(float level) { voice.setMasterLevel(level); }

private:
    double sampleRate = 44100.0;
    Voice voice;
};
