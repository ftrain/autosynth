#pragma once

#include <array>
#include <cmath>

// SST Libraries for DSP
#include "sst/basic-blocks/dsp/DPWSawOscillator.h"
#include "sst/basic-blocks/dsp/DPWPulseOscillator.h"
#include "sst/basic-blocks/dsp/LanczosResampler.h"
#include "sst/basic-blocks/modulators/SimpleLFO.h"
#include "sst/basic-blocks/modulators/ADSREnvelope.h"
#include "sst/filters/HalfRateFilter.h"

/**
 * PeanutsVoice - Single voice implementation
 *
 * Recreates the classic muted trombone "wah wah wah" sound from Peanuts cartoons.
 *
 * Signal Flow:
 *   MIDI → OSC (saw/pulse) → WAVESHAPER → FORMANT FILTER BANK → AMP → Output
 *             ↓                  ↓             ↓                   ↓
 *           Tune              Drive      LFO + ENV (vowel)       ADSR
 *
 * The "wah wah" effect is created by:
 * 1. Brass-like oscillator (sawtooth with harmonics)
 * 2. Formant filter bank (3 parallel band-pass filters)
 * 3. LFO modulating between vowel positions (/a/ ↔ /o/ ↔ /u/)
 * 4. Multiple resonant peaks creating speech-like formants
 *
 * Formant Filter Bank:
 * - F1, F2, F3 (three formant frequencies)
 * - Each is a resonant band-pass filter
 * - Vowel morphing: /a/ (ah) → /o/ (oh) → /u/ (oo)
 */
class Voice {
public:
    // Formant filter structure (one band-pass filter per formant)
    struct FormantFilter {
        float z1 = 0.0f, z2 = 0.0f;  // Input state
        float y1 = 0.0f, y2 = 0.0f;  // Output state

        float process(float input, float freq, float q, float sampleRate) {
            float omega = 2.0f * M_PI * freq / sampleRate;
            float alpha = std::sin(omega) / (2.0f * q);

            // Band-pass filter coefficients
            float b0 = alpha;
            float b1 = 0.0f;
            float b2 = -alpha;
            float a0 = 1.0f + alpha;
            float a1 = -2.0f * std::cos(omega);
            float a2 = 1.0f - alpha;

            // Direct Form I
            float output = (b0 * input + b1 * z1 + b2 * z2 - a1 * y1 - a2 * y2) / a0;

            // Update state
            z2 = z1;
            z1 = input;
            y2 = y1;
            y1 = output;

            return output;
        }

        void reset() {
            z1 = z2 = y1 = y2 = 0.0f;
        }
    };

    // Vowel formant definitions (adult male voice, Hz)
    struct Vowel {
        float f1, f2, f3;  // Formant frequencies
        float g1, g2, g3;  // Formant gains
    };

    static constexpr Vowel VOWELS[5] = {
        {730.0f, 1090.0f, 2440.0f, 1.0f, 0.5f, 0.3f},  // /a/ (ah) - open
        {530.0f, 1840.0f, 2480.0f, 1.0f, 0.4f, 0.2f},  // /e/ (eh)
        {270.0f, 2290.0f, 3010.0f, 0.8f, 0.4f, 0.2f},  // /i/ (ee) - closed
        {570.0f, 840.0f, 2410.0f, 1.0f, 0.6f, 0.3f},   // /o/ (oh) - muted brass
        {300.0f, 870.0f, 2240.0f, 0.9f, 0.6f, 0.3f}    // /u/ (oo) - very muted
    };

public:
    // Parameter IDs (matching the architecture doc)
    enum Params {
        OSC_WAVEFORM = 0,     // 0=saw, 1=pulse
        OSC_TUNE = 1,         // -24 to +24 semitones
        OSC_LEVEL = 2,        // 0-1
        DRIVE = 3,            // Waveshaper drive
        FILTER_FORMANT = 4,   // Formant vowel (0-4)
        FILTER_CUTOFF = 5,    // Base cutoff frequency
        FILTER_RESONANCE = 6, // Filter Q
        LFO_RATE = 7,         // Hz
        LFO_DEPTH = 8,        // Modulation depth
        LFO_WAVEFORM = 9,     // 0=sine, 1=triangle, 2=square
        FILTER_ATTACK = 10,
        FILTER_DECAY = 11,
        FILTER_SUSTAIN = 12,
        FILTER_RELEASE = 13,
        AMP_ATTACK = 14,
        AMP_DECAY = 15,
        AMP_SUSTAIN = 16,
        AMP_RELEASE = 17
    };

    Voice() = default;

    void init(float sr) {
        sampleRate = sr;

        // Initialize oscillators
        sawOsc.setRate(sr);
        pulseOsc.setRate(sr);

        // Initialize LFO
        lfo.setSampleRate(sr);
        lfo.attack();  // LFO always running

        // Initialize phase for simple formant implementation
        phase = 0.0f;
    }

    void noteOn(int midiNote, float vel) {
        note = midiNote;
        velocity = vel;
        isActive = true;

        // Trigger envelopes
        filterEnv.attack();
        ampEnv.attack();
    }

    void noteOff() {
        // Release envelopes
        filterEnv.release();
        ampEnv.release();

        // Keep voice active until amp envelope completes
        // (In a real implementation, check if amp envelope is done)
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

        // Get parameters
        float oscWaveform = params[OSC_WAVEFORM];
        float oscTune = params[OSC_TUNE] * 48.0f - 24.0f;  // -24 to +24 semitones
        float oscLevel = params[OSC_LEVEL];
        float drive = params[DRIVE];
        float filterCutoff = params[FILTER_CUTOFF] * 7980.0f + 20.0f;  // 20-8000 Hz
        float filterRes = params[FILTER_RESONANCE];
        float lfoRate = params[LFO_RATE] * 9.9f + 0.1f;  // 0.1-10 Hz
        float lfoDepth = params[LFO_DEPTH];

        // Envelope parameters (convert to seconds)
        filterEnv.a = std::max(0.001f, params[FILTER_ATTACK] * 0.999f + 0.001f);  // 1-1000ms
        filterEnv.d = std::max(0.01f, params[FILTER_DECAY] * 1.99f + 0.01f);       // 10-2000ms
        filterEnv.s = params[FILTER_SUSTAIN];
        filterEnv.r = std::max(0.01f, params[FILTER_RELEASE] * 2.99f + 0.01f);     // 10-3000ms

        ampEnv.a = std::max(0.001f, params[AMP_ATTACK] * 0.499f + 0.001f);        // 1-500ms
        ampEnv.d = std::max(0.01f, params[AMP_DECAY] * 1.99f + 0.01f);            // 10-2000ms
        ampEnv.s = params[AMP_SUSTAIN];
        ampEnv.r = std::max(0.01f, params[AMP_RELEASE] * 2.99f + 0.01f);          // 10-3000ms

        // Calculate frequency with tuning
        float tunedNote = note + oscTune;
        float frequency = 440.0f * std::pow(2.0f, (tunedNote - 69.0f) / 12.0f);

        // Generate oscillator
        sawOsc.setFrequency(frequency);
        pulseOsc.setFrequency(frequency);

        float oscSample;
        if (oscWaveform < 0.5f) {
            oscSample = sawOsc.value();
            sawOsc.step();
        } else {
            pulseOsc.setPulseWidth(0.5f);  // Square wave for brass character
            oscSample = pulseOsc.value();
            pulseOsc.step();
        }

        oscSample *= oscLevel;

        // Waveshaper for brass harmonics (soft clipping)
        float driven = oscSample * (1.0f + drive * 4.0f);
        float shaped = tanhApprox(driven);

        // FORMANT FILTER BANK
        // Morph between vowel positions based on filter cutoff parameter
        float vowelPos = params[FILTER_FORMANT] * 4.0f;  // 0-4 (5 vowels)

        // LFO modulation
        lfo.setRate(lfoRate);
        float lfoValue = lfo.step();  // Returns -1 to +1

        // Filter envelope modulation
        float filterEnvValue = filterEnv.processForSampleRate(sampleRate);

        // Modulate vowel position (creates "wah wah" effect)
        vowelPos += lfoValue * lfoDepth * 2.0f;       // LFO morphs between vowels
        vowelPos += filterEnvValue * 2.0f;            // Envelope also morphs vowels

        // Clamp to valid vowel range
        vowelPos = std::max(0.0f, std::min(vowelPos, 3.999f));

        // Interpolate between two adjacent vowels
        int vowelIdx = static_cast<int>(vowelPos);
        float vowelBlend = vowelPos - vowelIdx;
        int nextVowelIdx = std::min(vowelIdx + 1, 4);

        const Vowel& v1 = VOWELS[vowelIdx];
        const Vowel& v2 = VOWELS[nextVowelIdx];

        // Interpolated formant frequencies and gains
        float f1 = v1.f1 + (v2.f1 - v1.f1) * vowelBlend;
        float f2 = v1.f2 + (v2.f2 - v1.f2) * vowelBlend;
        float f3 = v1.f3 + (v2.f3 - v1.f3) * vowelBlend;
        float g1 = v1.g1 + (v2.g1 - v1.g1) * vowelBlend;
        float g2 = v1.g2 + (v2.g2 - v1.g2) * vowelBlend;
        float g3 = v1.g3 + (v2.g3 - v1.g3) * vowelBlend;

        // Q values for formant filters (higher Q = more resonant/vowel-like)
        float q = 5.0f + filterRes * 15.0f;  // Q from 5 to 20

        // Process through 3-formant filter bank
        float out1 = formant1.process(shaped, f1, q, sampleRate);
        float out2 = formant2.process(shaped, f2, q * 0.7f, sampleRate);  // F2 less resonant
        float out3 = formant3.process(shaped, f3, q * 0.5f, sampleRate);  // F3 even less

        // Mix formants with appropriate gains
        float filtered = out1 * g1 + out2 * g2 + out3 * g3;

        // Boost output (formant filters can be quiet)
        filtered *= 2.0f;

        // Amplitude envelope
        float ampEnvValue = ampEnv.processForSampleRate(sampleRate);

        // Check if amp envelope is done
        if (ampEnvValue < 0.0001f && ampEnv.stage == ampEnv.s_eoc) {
            isActive = false;
        }

        // Final output
        float output = filtered * ampEnvValue * velocity * 0.5f;

        return output;
    }

private:
    // Fast tanh approximation for waveshaping
    float tanhApprox(float x) {
        if (x < -3.0f) return -1.0f;
        if (x > 3.0f) return 1.0f;
        float x2 = x * x;
        return x * (27.0f + x2) / (27.0f + 9.0f * x2);
    }

    float sampleRate = 48000.0f;
    int note = 60;
    float velocity = 1.0f;
    bool isActive = false;
    float phase = 0.0f;

    // SST oscillators
    sst::basic_blocks::dsp::DPWSawOscillator sawOsc;
    sst::basic_blocks::dsp::DPWPulseOscillator pulseOsc;

    // SST modulators
    sst::basic_blocks::modulators::SimpleLFO lfo;
    sst::basic_blocks::modulators::ADSREnvelope filterEnv;
    sst::basic_blocks::modulators::ADSREnvelope ampEnv;

    // Formant filter bank (3 formants for vowel synthesis)
    FormantFilter formant1;  // F1 (low frequency, primary vowel character)
    FormantFilter formant2;  // F2 (mid frequency, vowel color)
    FormantFilter formant3;  // F3 (high frequency, brightness)
};
