/**
 * @file Voice.h
 * @brief Single synthesizer voice implementation using SST libraries
 *
 * A voice represents one instance of the synthesis chain that plays
 * a single note. Multiple voices enable polyphony.
 *
 * Signal Flow:
 *   Oscillators -> [Mix] -> Filter -> Amp Envelope -> Output
 *
 * SST Dependencies:
 *   - sst/basic-blocks/dsp/DPWSawOscillator.h (or other oscillator types)
 *   - sst/filters/CytomicSVF.h (or VintageLadder, etc.)
 *   - sst/basic-blocks/modulators/ADSREnvelope.h
 *
 * @note All DSP algorithms come from SST libraries - never write custom DSP
 */

#pragma once

#include <cmath>
#include <array>

// ============================================================================
// SST Library Includes
// TODO: Uncomment and adjust based on your architecture
// ============================================================================

// #include "sst/basic-blocks/dsp/DPWSawOscillator.h"
// #include "sst/basic-blocks/modulators/ADSREnvelope.h"
// #include "sst/filters/CytomicSVF.h"

/**
 * @brief Single synthesizer voice
 *
 * Each voice contains:
 * - One or more oscillators (SST)
 * - One or more filters (SST)
 * - Amplitude and filter envelopes (SST)
 *
 * Thread Safety:
 * - Voice methods are called from audio thread only
 * - No allocations in render path
 */
class Voice
{
public:
    // Block size for internal processing
    static constexpr int BLOCK_SIZE = 32;

    Voice() = default;
    ~Voice() = default;

    //==========================================================================
    // Initialization
    //==========================================================================

    /**
     * @brief Prepare voice for playback
     * @param sampleRate Sample rate in Hz
     */
    void prepare(double sampleRate)
    {
        this->sampleRate = sampleRate;

        // TODO: Initialize SST components
        // Example:
        // osc1.init();
        // filter.init();
        // ampEnv.setSampleRate(sampleRate);
    }

    //==========================================================================
    // Note Events
    //==========================================================================

    /**
     * @brief Start playing a note
     * @param note MIDI note number (0-127)
     * @param vel Velocity (0.0-1.0)
     */
    void noteOn(int note, float vel)
    {
        currentNote = note;
        velocity = vel;
        active = true;
        releasing = false;
        age = 0;

        // Calculate oscillator frequency
        float frequency = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
        phaseIncrement = frequency / static_cast<float>(sampleRate);

        // TODO: Set oscillator frequency
        // Example:
        // osc1.setFrequency(phaseIncrement);

        // TODO: Trigger envelopes
        // Example:
        // ampEnv.attack();
        // filterEnv.attack();

        // Reset phase for clean attack
        phase = 0.0f;
    }

    /**
     * @brief Release the note (enter release phase)
     */
    void noteOff()
    {
        releasing = true;

        // TODO: Release envelopes
        // Example:
        // ampEnv.release();
        // filterEnv.release();
    }

    /**
     * @brief Force voice to stop immediately
     */
    void kill()
    {
        active = false;
        releasing = false;
        currentNote = -1;
    }

    //==========================================================================
    // Audio Rendering
    //==========================================================================

    /**
     * @brief Render audio for this voice
     * @param outputL Left channel output buffer (will be added to)
     * @param outputR Right channel output buffer (will be added to)
     * @param numSamples Number of samples to render
     */
    void render(float* outputL, float* outputR, int numSamples)
    {
        if (!active)
            return;

        ++age; // Track voice age for stealing

        // Process in blocks for efficiency
        int samplesRemaining = numSamples;
        int offset = 0;

        while (samplesRemaining > 0)
        {
            int blockSize = std::min(samplesRemaining, BLOCK_SIZE);
            renderBlock(outputL + offset, outputR + offset, blockSize);
            offset += blockSize;
            samplesRemaining -= blockSize;
        }
    }

    //==========================================================================
    // State Accessors
    //==========================================================================

    bool isActive() const { return active; }
    bool isReleasing() const { return releasing; }
    int getNote() const { return currentNote; }
    float getVelocity() const { return velocity; }
    int getAge() const { return age; }

    //==========================================================================
    // Parameter Setters (call from audio thread)
    //==========================================================================

    // TODO: Add parameter setters for your voice
    // Example:
    // void setFilterCutoff(float cutoffHz) { targetCutoff = cutoffHz; }
    // void setFilterResonance(float reso) { targetResonance = reso; }

private:
    /**
     * @brief Render a single block of audio
     */
    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        for (int i = 0; i < blockSize; ++i)
        {
            // ================================================================
            // OSCILLATOR
            // TODO: Replace with SST oscillator
            // ================================================================

            // Simple placeholder saw wave
            float oscOut = phase * 2.0f - 1.0f;
            phase += phaseIncrement;
            if (phase >= 1.0f)
                phase -= 1.0f;

            // TODO: Use SST oscillator instead
            // Example:
            // float oscOut = osc1.step();

            // ================================================================
            // FILTER
            // TODO: Add SST filter
            // ================================================================

            float filterOut = oscOut; // Bypass for now

            // TODO: Process through SST filter
            // Example:
            // filter.setCoeff(CytomicSVF::LP, cutoff, resonance, sampleRate);
            // float filterOut = filter.process(oscOut);

            // ================================================================
            // ENVELOPE
            // TODO: Replace with SST envelope
            // ================================================================

            // Simple placeholder envelope
            float envOut = calculateSimpleEnvelope();

            // TODO: Use SST envelope instead
            // Example:
            // float envOut = ampEnv.process(sampleRate);

            // Check if voice has finished
            if (envOut <= 0.0f && releasing)
            {
                active = false;
                return;
            }

            // ================================================================
            // OUTPUT
            // ================================================================

            float output = filterOut * envOut * velocity;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    /**
     * @brief Simple placeholder envelope (replace with SST ADSREnvelope)
     */
    float calculateSimpleEnvelope()
    {
        // TODO: Replace this entire method with SST ADSREnvelope

        const float attackTime = 0.01f;   // 10ms attack
        const float releaseTime = 0.3f;   // 300ms release

        if (!releasing)
        {
            // Attack/sustain
            envLevel += (1.0f / (attackTime * static_cast<float>(sampleRate)));
            envLevel = std::min(envLevel, 1.0f);
        }
        else
        {
            // Release
            envLevel -= (1.0f / (releaseTime * static_cast<float>(sampleRate)));
            envLevel = std::max(envLevel, 0.0f);
        }

        return envLevel;
    }

    //==========================================================================
    // Voice State
    //==========================================================================

    bool active = false;
    bool releasing = false;
    int currentNote = -1;
    float velocity = 0.0f;
    int age = 0;  // For voice stealing (older voices get stolen first)

    //==========================================================================
    // DSP State
    //==========================================================================

    double sampleRate = 44100.0;

    // Oscillator state (placeholder - replace with SST)
    float phase = 0.0f;
    float phaseIncrement = 0.0f;

    // Envelope state (placeholder - replace with SST)
    float envLevel = 0.0f;

    //==========================================================================
    // SST Components
    // TODO: Uncomment and configure for your architecture
    //==========================================================================

    // sst::basic_blocks::dsp::DPWSawOscillator osc1;
    // sst::basic_blocks::dsp::DPWSawOscillator osc2;
    // sst::filters::CytomicSVF filter;
    // sst::basic_blocks::modulators::ADSREnvelope ampEnv;
    // sst::basic_blocks::modulators::ADSREnvelope filterEnv;

    //==========================================================================
    // Parameter Targets (smoothed in renderBlock)
    //==========================================================================

    // float targetCutoff = 5000.0f;
    // float targetResonance = 0.0f;
};
