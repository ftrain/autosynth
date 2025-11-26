#pragma once

#include <array>
#include <cmath>

// SST Library includes
#include "sst/basic-blocks/dsp/PulseOscillator.h"
#include "sst/basic-blocks/modulators/ADSREnvelope.h"
#include "sst/filters/VintageLadder.h"

/**
 * Single voice for Additive Square synthesizer
 *
 * Architecture:
 *   8 Square Wave Oscillators (1x, 2x, 3x, 4x, 5x, 6x, 7x, 8x fundamental)
 *   → SUM (with individual levels)
 *   → Vintage Ladder Filter
 *   → Amp Envelope
 *   → Output
 *
 * Uses SST libraries:
 * - sst::basic_blocks::dsp::PulseOscillator (square waves)
 * - sst::filters::VintageLadder (Moog-style filter)
 * - sst::basic_blocks::modulators::ADSREnvelope (envelopes)
 */
class Voice {
public:
    static constexpr int NUM_PARTIALS = 8;

    Voice() = default;

    void init(float sr) {
        sampleRate = sr;

        // Initialize all 8 square wave oscillators
        for (int i = 0; i < NUM_PARTIALS; i++) {
            partials[i].init();
        }

        // Initialize filter
        filter.init(sr);
        filter.setSampleRate(sr);

        // Initialize envelopes
        filterEnv.setSampleRate(sr);
        ampEnv.setSampleRate(sr);
    }

    void noteOn(int midiNote, float vel) {
        note = midiNote;
        velocity = vel;
        isActive = true;

        // Convert MIDI note to frequency
        frequency = 440.0f * std::pow(2.0f, (midiNote - 69) / 12.0f);

        // Set frequencies for all partials (1x, 2x, 3x, ... 8x fundamental)
        for (int i = 0; i < NUM_PARTIALS; i++) {
            float partialFreq = frequency * (i + 1);  // Integer multiples
            partials[i].setRate(partialFreq / sampleRate);
        }

        // Trigger envelopes
        filterEnv.attack();
        ampEnv.attack();
    }

    void noteOff() {
        // Release envelopes (voice stays active until amp envelope completes)
        filterEnv.release();
        ampEnv.release();
    }

    int getNote() const {
        return note;
    }

    bool active() const {
        // Voice is active until amp envelope finishes
        return isActive && !ampEnv.isComplete();
    }

    float process(const std::array<float, 128>& params) {
        if (!active()) {
            isActive = false;
            return 0.0f;
        }

        // Generate all 8 partials and sum with individual levels
        float summed = 0.0f;
        for (int i = 0; i < NUM_PARTIALS; i++) {
            float level = params[i];  // params 0-7 are partial levels
            float partialSample = partials[i].value();  // Get square wave sample
            summed += partialSample * level;
            partials[i].step();  // Advance oscillator
        }

        // Normalize by number of active partials to prevent clipping
        summed *= 0.25f;  // Conservative scaling

        // Process filter envelope
        filterEnv.process();
        float filterEnvValue = filterEnv.output;

        // Calculate filter cutoff with envelope modulation
        float baseCutoff = params[8];  // 0-1 normalized
        float filterRes = params[9];
        float envAmount = params[10];   // -1 to 1

        // Map cutoff to 20Hz - 20kHz (exponential)
        float cutoffHz = 20.0f * std::pow(1000.0f, baseCutoff);  // 20Hz to 20kHz
        float envModHz = envAmount * filterEnvValue * 10000.0f;
        cutoffHz = std::clamp(cutoffHz + envModHz, 20.0f, 20000.0f);

        // Set filter parameters
        filter.setFrequency(cutoffHz);
        filter.setResonance(filterRes);

        // Process through filter
        float filtered = filter.process(summed, 0);  // Process left channel

        // Process amp envelope
        ampEnv.process();
        float ampEnvValue = ampEnv.output;

        // Apply amp envelope and velocity
        return filtered * ampEnvValue * velocity;
    }

    void setFilterEnvelope(float attack, float decay, float sustain, float release) {
        // Times in seconds
        filterEnv.attack = attack;
        filterEnv.decay = decay;
        filterEnv.sustain = sustain;
        filterEnv.release = release;
    }

    void setAmpEnvelope(float attack, float decay, float sustain, float release) {
        // Times in seconds
        ampEnv.attack = attack;
        ampEnv.decay = decay;
        ampEnv.sustain = sustain;
        ampEnv.release = release;
    }

private:
    float sampleRate = 48000.0f;
    int note = 0;
    float velocity = 0.0f;
    float frequency = 440.0f;
    bool isActive = false;

    // 8 square wave oscillators (partials at 1x, 2x, 3x, ... 8x fundamental)
    std::array<sst::basic_blocks::dsp::PulseOscillator, NUM_PARTIALS> partials;

    // Filter (Moog-style ladder)
    sst::filters::VintageLadder<sst::filters::VintageLadder<>::LowPass> filter;

    // Envelopes
    sst::basic_blocks::modulators::ADSREnvelope filterEnv;
    sst::basic_blocks::modulators::ADSREnvelope ampEnv;
};
