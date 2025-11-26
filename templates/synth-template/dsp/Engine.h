#pragma once

#include "Voice.h"
#include <array>
#include <cmath>

/**
 * Main DSP Engine for {{SYNTH_NAME}}
 *
 * This engine manages voice allocation, parameter routing, and master processing.
 * Uses SST/Airwindows/ChowDSP libraries for all DSP operations.
 */
class Engine {
public:
    static constexpr int MAX_VOICES = 8;
    static constexpr int MAX_PARAMS = 128;

    Engine() {
        params.fill(0.5f);  // Initialize all params to midpoint
        voiceActive.fill(false);
    }

    void prepare(float sr) {
        sampleRate = sr;
        for (auto& voice : voices) {
            voice.init(sr);
        }
    }

    void noteOn(int note, float velocity) {
        // Simple voice stealing: find first inactive voice
        for (int i = 0; i < MAX_VOICES; i++) {
            if (!voiceActive[i]) {
                voices[i].noteOn(note, velocity);
                voiceActive[i] = true;
                return;
            }
        }

        // All voices active, steal oldest (voice 0)
        voices[0].noteOn(note, velocity);
        voiceActive[0] = true;
    }

    void noteOff(int note) {
        for (int i = 0; i < MAX_VOICES; i++) {
            if (voiceActive[i] && voices[i].getNote() == note) {
                voices[i].noteOff();
                voiceActive[i] = false;
            }
        }
    }

    void setParam(int id, float value) {
        if (id >= 0 && id < MAX_PARAMS) {
            params[id] = value;
        }
    }

    float getParam(int id) const {
        if (id >= 0 && id < MAX_PARAMS) {
            return params[id];
        }
        return 0.0f;
    }

    void renderBlock(float* outL, float* outR, int numSamples) {
        // Clear output buffers
        for (int i = 0; i < numSamples; i++) {
            outL[i] = 0.0f;
            outR[i] = 0.0f;
        }

        // Sum all active voices
        for (int v = 0; v < MAX_VOICES; v++) {
            if (voiceActive[v]) {
                for (int i = 0; i < numSamples; i++) {
                    float sample = voices[v].process(params);
                    outL[i] += sample;
                    outR[i] += sample;
                }
            }
        }

        // Master gain (param 127 reserved for master volume)
        float masterGain = params[127];
        for (int i = 0; i < numSamples; i++) {
            outL[i] *= masterGain;
            outR[i] *= masterGain;
        }
    }

private:
    float sampleRate = 48000.0f;
    std::array<Voice, MAX_VOICES> voices;
    std::array<bool, MAX_VOICES> voiceActive;
    std::array<float, MAX_PARAMS> params;
};
