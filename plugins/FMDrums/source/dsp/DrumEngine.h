/**
 * @file DrumEngine.h
 * @brief FM drum synthesizer engine with 4 drum channels
 *
 * Drum channels mapped to MIDI notes:
 *   - KICK:  C1 (36)
 *   - SNARE: D1 (38)
 *   - HAT:   F#1 (42) closed, A#1 (46) open
 *   - PERC:  C#2 (49) or any other note
 */

#pragma once

#include "DrumVoice.h"
#include <array>

/**
 * @brief FM drum engine with 4 drum channels
 */
class DrumEngine
{
public:
    // MIDI note assignments (GM standard)
    static constexpr int NOTE_KICK = 36;      // C1
    static constexpr int NOTE_SNARE = 38;     // D1
    static constexpr int NOTE_HAT_CLOSED = 42; // F#1
    static constexpr int NOTE_HAT_OPEN = 46;   // A#1
    static constexpr int NOTE_PERC = 49;       // C#2

    DrumEngine() = default;
    ~DrumEngine() = default;

    void prepare(double sampleRate, int /*samplesPerBlock*/)
    {
        kick.prepare(sampleRate);
        snare.prepare(sampleRate);
        hat.prepare(sampleRate);
        perc.prepare(sampleRate);
    }

    void releaseResources() {}

    void noteOn(int note, float velocity, int /*samplePosition*/)
    {
        switch (note)
        {
            case NOTE_KICK:
                kick.trigger(velocity);
                break;
            case NOTE_SNARE:
                snare.trigger(velocity);
                break;
            case NOTE_HAT_CLOSED:
            case NOTE_HAT_OPEN:
                hat.trigger(velocity);
                break;
            default:
                // All other notes trigger perc
                perc.trigger(velocity);
                break;
        }
    }

    void noteOff(int /*note*/, int /*samplePosition*/)
    {
        // Drums are one-shot, ignore note off
    }

    void allNotesOff()
    {
        // Drums continue to decay naturally
    }

    void setPitchBend(float /*bend*/)
    {
        // Not used for drums
    }

    void renderBlock(float* outputL, float* outputR, int numSamples)
    {
        // Clear buffers
        std::fill(outputL, outputL + numSamples, 0.0f);
        std::fill(outputR, outputR + numSamples, 0.0f);

        // Render each drum voice
        kick.render(outputL, outputR, numSamples);
        snare.render(outputL, outputR, numSamples);
        hat.render(outputL, outputR, numSamples);
        perc.render(outputL, outputR, numSamples);

        // Apply master level
        for (int i = 0; i < numSamples; ++i)
        {
            outputL[i] *= masterLevel;
            outputR[i] *= masterLevel;
        }
    }

    // Kick parameters
    void setKickCarrierFreq(float v) { kick.setCarrierFreq(v); }
    void setKickModRatio(float v) { kick.setModRatio(v); }
    void setKickModDepth(float v) { kick.setModDepth(v); }
    void setKickPitchDecay(float v) { kick.setPitchDecay(v); }
    void setKickPitchAmount(float v) { kick.setPitchAmount(v); }
    void setKickAmpDecay(float v) { kick.setAmpDecay(v); }
    void setKickLevel(float v) { kick.setLevel(v); }

    // Snare parameters
    void setSnareCarrierFreq(float v) { snare.setCarrierFreq(v); }
    void setSnareModRatio(float v) { snare.setModRatio(v); }
    void setSnareModDepth(float v) { snare.setModDepth(v); }
    void setSnarePitchDecay(float v) { snare.setPitchDecay(v); }
    void setSnareAmpDecay(float v) { snare.setAmpDecay(v); }
    void setSnareNoise(float v) { snare.setNoiseAmount(v); }
    void setSnareLevel(float v) { snare.setLevel(v); }

    // Hat parameters
    void setHatCarrierFreq(float v) { hat.setCarrierFreq(v); }
    void setHatModRatio(float v) { hat.setModRatio(v); }
    void setHatModDepth(float v) { hat.setModDepth(v); }
    void setHatAmpDecay(float v) { hat.setAmpDecay(v); }
    void setHatNoise(float v) { hat.setNoiseAmount(v); }
    void setHatLevel(float v) { hat.setLevel(v); }

    // Perc parameters
    void setPercCarrierFreq(float v) { perc.setCarrierFreq(v); }
    void setPercModRatio(float v) { perc.setModRatio(v); }
    void setPercModDepth(float v) { perc.setModDepth(v); }
    void setPercPitchDecay(float v) { perc.setPitchDecay(v); }
    void setPercAmpDecay(float v) { perc.setAmpDecay(v); }
    void setPercLevel(float v) { perc.setLevel(v); }

    // Master
    void setMasterLevel(float v) { masterLevel = v; }

private:
    DrumVoice kick;
    DrumVoice snare;
    DrumVoice hat;
    DrumVoice perc;

    float masterLevel = 0.8f;
};
