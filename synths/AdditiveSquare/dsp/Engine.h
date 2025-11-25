#pragma once

#include "Voice.h"
#include <array>
#include <cmath>

/**
 * Main DSP Engine for Additive Square Synthesizer
 *
 * Manages 8-voice polyphony with additive square wave synthesis.
 * Routes parameters to all voices and handles master processing.
 *
 * Parameter Map:
 *   0-7:   Partial levels (1x through 8x fundamental)
 *   8:     Filter cutoff (0-1, mapped to 20Hz-20kHz)
 *   9:     Filter resonance (0-1)
 *   10:    Filter envelope amount (-1 to 1)
 *   11-14: Filter ADSR (attack, decay, sustain, release)
 *   15-18: Amp ADSR (attack, decay, sustain, release)
 *   127:   Master volume
 */
class Engine {
public:
    static constexpr int MAX_VOICES = 8;
    static constexpr int MAX_PARAMS = 128;

    // Parameter IDs
    enum ParamID {
        PARTIAL_1_LEVEL = 0,
        PARTIAL_2_LEVEL = 1,
        PARTIAL_3_LEVEL = 2,
        PARTIAL_4_LEVEL = 3,
        PARTIAL_5_LEVEL = 4,
        PARTIAL_6_LEVEL = 5,
        PARTIAL_7_LEVEL = 6,
        PARTIAL_8_LEVEL = 7,
        FILTER_CUTOFF = 8,
        FILTER_RESONANCE = 9,
        FILTER_ENV_AMOUNT = 10,
        FILTER_ATTACK = 11,
        FILTER_DECAY = 12,
        FILTER_SUSTAIN = 13,
        FILTER_RELEASE = 14,
        AMP_ATTACK = 15,
        AMP_DECAY = 16,
        AMP_SUSTAIN = 17,
        AMP_RELEASE = 18,
        MASTER_VOLUME = 127
    };

    Engine() {
        // Initialize default parameter values
        params.fill(0.0f);

        // Set sensible defaults
        params[PARTIAL_1_LEVEL] = 1.0f;      // Fundamental at full level
        params[PARTIAL_2_LEVEL] = 0.5f;      // 2nd harmonic
        params[PARTIAL_3_LEVEL] = 0.3f;      // 3rd harmonic
        params[PARTIAL_4_LEVEL] = 0.2f;      // 4th harmonic
        params[PARTIAL_5_LEVEL] = 0.15f;     // 5th harmonic
        params[PARTIAL_6_LEVEL] = 0.1f;      // 6th harmonic
        params[PARTIAL_7_LEVEL] = 0.05f;     // 7th harmonic
        params[PARTIAL_8_LEVEL] = 0.02f;     // 8th harmonic

        params[FILTER_CUTOFF] = 0.5f;        // Mid-range cutoff
        params[FILTER_RESONANCE] = 0.3f;     // Moderate resonance
        params[FILTER_ENV_AMOUNT] = 0.5f;    // Moderate envelope amount

        params[FILTER_ATTACK] = 0.01f;       // 10ms
        params[FILTER_DECAY] = 0.3f;         // 300ms
        params[FILTER_SUSTAIN] = 0.5f;       // 50%
        params[FILTER_RELEASE] = 0.5f;       // 500ms

        params[AMP_ATTACK] = 0.005f;         // 5ms
        params[AMP_DECAY] = 0.1f;            // 100ms
        params[AMP_SUSTAIN] = 0.8f;          // 80%
        params[AMP_RELEASE] = 0.3f;          // 300ms

        params[MASTER_VOLUME] = 0.7f;        // 70% master volume

        voiceActive.fill(false);
    }

    void prepare(float sr) {
        sampleRate = sr;
        for (auto& voice : voices) {
            voice.init(sr);
            updateVoiceEnvelopes(voice);
        }
    }

    void noteOn(int note, float velocity) {
        // Find first inactive voice
        for (int i = 0; i < MAX_VOICES; i++) {
            if (!voiceActive[i]) {
                voices[i].noteOn(note, velocity);
                voiceActive[i] = true;
                updateVoiceEnvelopes(voices[i]);
                return;
            }
        }

        // All voices active - steal oldest (voice 0)
        voices[0].noteOn(note, velocity);
        voiceActive[0] = true;
        updateVoiceEnvelopes(voices[0]);
    }

    void noteOff(int note) {
        for (int i = 0; i < MAX_VOICES; i++) {
            if (voiceActive[i] && voices[i].getNote() == note) {
                voices[i].noteOff();
                // Don't set voiceActive to false - let voice finish its release
            }
        }
    }

    void setParam(int id, float value) {
        if (id >= 0 && id < MAX_PARAMS) {
            params[id] = value;

            // Update all voices if envelope parameters changed
            if (id >= FILTER_ATTACK && id <= AMP_RELEASE) {
                for (auto& voice : voices) {
                    updateVoiceEnvelopes(voice);
                }
            }
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

        // Process all voices
        for (int v = 0; v < MAX_VOICES; v++) {
            // Update voice active state
            if (voiceActive[v] && !voices[v].active()) {
                voiceActive[v] = false;
            }

            if (voiceActive[v]) {
                for (int i = 0; i < numSamples; i++) {
                    float sample = voices[v].process(params);
                    outL[i] += sample;
                    outR[i] += sample;
                }
            }
        }

        // Apply master volume
        float masterGain = params[MASTER_VOLUME];
        for (int i = 0; i < numSamples; i++) {
            outL[i] *= masterGain;
            outR[i] *= masterGain;
        }
    }

private:
    void updateVoiceEnvelopes(Voice& voice) {
        // Update filter envelope
        voice.setFilterEnvelope(
            params[FILTER_ATTACK],
            params[FILTER_DECAY],
            params[FILTER_SUSTAIN],
            params[FILTER_RELEASE]
        );

        // Update amp envelope
        voice.setAmpEnvelope(
            params[AMP_ATTACK],
            params[AMP_DECAY],
            params[AMP_SUSTAIN],
            params[AMP_RELEASE]
        );
    }

    float sampleRate = 48000.0f;
    std::array<Voice, MAX_VOICES> voices;
    std::array<bool, MAX_VOICES> voiceActive;
    std::array<float, MAX_PARAMS> params;
};
