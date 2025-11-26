#pragma once

#include <array>
#include <cmath>

// TODO: Include SST/Airwindows/ChowDSP libraries as needed
// #include "sst/basic-blocks/dsp/DPWSawOscillator.h"
// #include "sst/filters/VintageLadder.h"
// #include "sst/basic-blocks/modulators/ADSREnvelope.h"

/**
 * Single voice implementation for {{SYNTH_NAME}}
 *
 * IMPORTANT: This template should be customized with actual SST/Airwindows/ChowDSP components.
 * Never write custom DSP - always use existing libraries.
 *
 * Example voice architecture:
 *   MIDI → Voice → OSC → FILTER → AMP → Output
 *                   ↓      ↓       ↓
 *                  LFO   ADSR    ADSR
 */
class Voice {
public:
    Voice() = default;

    void init(float sr) {
        sampleRate = sr;
        // TODO: Initialize SST components
        // osc.init(sr);
        // filter.init(sr);
    }

    void noteOn(int midiNote, float vel) {
        note = midiNote;
        velocity = vel;
        isActive = true;

        // Convert MIDI note to frequency
        frequency = 440.0f * std::pow(2.0f, (midiNote - 69) / 12.0f);

        // TODO: Trigger envelopes
        // filterEnv.trigger();
        // ampEnv.trigger();

        // TODO: Set oscillator frequency
        // osc.setFrequency(frequency);
    }

    void noteOff() {
        isActive = false;
        // TODO: Release envelopes
        // filterEnv.release();
        // ampEnv.release();
    }

    int getNote() const {
        return note;
    }

    bool active() const {
        return isActive;
    }

    float process(const std::array<float, 128>& params) {
        if (!isActive) {
            return 0.0f;
        }

        // TODO: Implement actual DSP using SST/Airwindows/ChowDSP
        //
        // Example:
        // float oscSample = osc.process();
        // float envValue = filterEnv.process(sampleRate);
        // float cutoff = params[CUTOFF_PARAM] * (1.0f + envValue);
        // filter.setCutoff(cutoff);
        // float filtered = filter.process(oscSample);
        // float amp = ampEnv.process(sampleRate);
        // return filtered * amp * velocity;

        // Placeholder: simple sine oscillator
        float sample = std::sin(phase * 2.0f * M_PI);
        phase += frequency / sampleRate;
        if (phase >= 1.0f) phase -= 1.0f;

        return sample * velocity * 0.3f;
    }

private:
    float sampleRate = 48000.0f;
    int note = 0;
    float velocity = 0.0f;
    float frequency = 440.0f;
    float phase = 0.0f;
    bool isActive = false;

    // TODO: Add SST/Airwindows/ChowDSP components
    // sst::basic_blocks::dsp::DPWSawOscillator osc;
    // sst::filters::VintageLadder filter;
    // sst::basic_blocks::modulators::ADSREnvelope filterEnv;
    // sst::basic_blocks::modulators::ADSREnvelope ampEnv;
};
