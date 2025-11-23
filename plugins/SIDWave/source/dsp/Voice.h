/**
 * @file Voice.h
 * @brief SID Wave voice - 8-bit wavetable synth inspired by Commodore 64 SID chip
 *
 * Signal Flow:
 *   [OSC1] + [OSC2 (optionally ring mod with OSC1)] + [OSC3] -> [Bit Crusher] -> [Filter] -> [Amp Env] -> Output
 *
 * Features:
 * - 3 oscillators (like SID's 3 voices)
 * - Classic SID waveforms: Pulse (variable width), Saw, Triangle, Noise
 * - Ring modulation (OSC2 * OSC1)
 * - Bit crushing for authentic 8-bit crunch
 * - Sample rate reduction
 * - Simple multimode filter (LP/BP/HP)
 */

#pragma once

#include <cmath>
#include <array>
#include <cstdint>
#include <random>

// SST Filter
#include "sst/filters/CytomicSVF.h"

// SST Envelope
#include "sst/basic-blocks/modulators/ADSREnvelope.h"

/**
 * @brief SID-style waveform types
 */
enum class SIDWaveform
{
    Pulse = 0,
    Saw = 1,
    Triangle = 2,
    Noise = 3
};

/**
 * @brief Filter mode
 */
enum class FilterMode
{
    LowPass = 0,
    BandPass = 1,
    HighPass = 2
};

/**
 * @brief Single SID Wave voice
 */
class Voice
{
public:
    static constexpr int BLOCK_SIZE = 32;

    Voice() = default;
    ~Voice() = default;

    //==========================================================================
    // Initialization
    //==========================================================================

    void prepare(double sr)
    {
        sampleRate = sr;

        // Initialize SST envelope
        ampEnv.setSampleRate(static_cast<float>(sampleRate));

        // Initialize noise generator
        noiseValue1 = 0.0f;
        noiseValue2 = 0.0f;

        // Reset sample-and-hold state
        sampleHoldCounter = 0;
        heldSample = 0.0f;
    }

    //==========================================================================
    // Note Events
    //==========================================================================

    void noteOn(int note, float vel)
    {
        currentNote = note;
        velocity = vel;
        active = true;
        releasing = false;
        age = 0;

        // Calculate base frequency
        float frequency = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
        basePhaseInc = frequency / static_cast<float>(sampleRate);

        // Reset oscillator phases
        phase1 = 0.0f;
        phase2 = 0.0f;
        phase3 = 0.0f;

        // Reset noise shift registers (classic LFSR like SID)
        noiseShift1 = 0x7FFFF8;
        noiseShift2 = 0x7FFFF8;
        noiseShift3 = 0x7FFFF8;

        // Trigger envelope
        ampEnv.attackFrom(0.0f, attackTime, decayTime, sustainLevel, releaseTime, 1.0f, 1.0f);
    }

    void noteOff()
    {
        releasing = true;
        ampEnv.release();
    }

    void kill()
    {
        active = false;
        releasing = false;
        currentNote = -1;
    }

    //==========================================================================
    // Audio Rendering
    //==========================================================================

    void render(float* outputL, float* outputR, int numSamples)
    {
        if (!active)
            return;

        ++age;

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
    // Parameter Setters
    //==========================================================================

    // Oscillator 1
    void setOsc1Wave(int wave) { osc1Wave = static_cast<SIDWaveform>(std::clamp(wave, 0, 3)); }
    void setOsc1Tune(float semitones) { osc1Tune = semitones; }
    void setOsc1PW(float pw) { osc1PulseWidth = std::clamp(pw, 0.05f, 0.95f); }
    void setOsc1Level(float level) { osc1Level = level; }

    // Oscillator 2
    void setOsc2Wave(int wave) { osc2Wave = static_cast<SIDWaveform>(std::clamp(wave, 0, 3)); }
    void setOsc2Tune(float semitones) { osc2Tune = semitones; }
    void setOsc2PW(float pw) { osc2PulseWidth = std::clamp(pw, 0.05f, 0.95f); }
    void setOsc2Level(float level) { osc2Level = level; }
    void setOsc2Ring(float ring) { osc2RingMod = ring; }

    // Oscillator 3
    void setOsc3Wave(int wave) { osc3Wave = static_cast<SIDWaveform>(std::clamp(wave, 0, 3)); }
    void setOsc3Tune(float semitones) { osc3Tune = semitones; }
    void setOsc3Level(float level) { osc3Level = level; }

    // Lo-Fi
    void setBitDepth(int bits) { bitDepth = std::clamp(bits, 4, 16); }
    void setSampleRateReduction(float reduction)
    {
        // 0.0 = 4kHz, 1.0 = full sample rate
        float targetRate = 4000.0f + reduction * (static_cast<float>(sampleRate) - 4000.0f);
        sampleHoldPeriod = static_cast<int>(sampleRate / targetRate);
        sampleHoldPeriod = std::max(1, sampleHoldPeriod);
    }

    // Filter
    void setFilterCutoff(float hz) { filterCutoff = hz; }
    void setFilterReso(float reso) { filterReso = reso; }
    void setFilterMode(int mode) { filterMode = static_cast<FilterMode>(std::clamp(mode, 0, 2)); }

    // Envelope
    void setAttack(float seconds) { attackTime = seconds; }
    void setDecay(float seconds) { decayTime = seconds; }
    void setSustain(float level) { sustainLevel = level; }
    void setRelease(float seconds) { releaseTime = seconds; }

private:
    //==========================================================================
    // Waveform Generation (SID-style)
    //==========================================================================

    /**
     * @brief Generate SID-style waveform
     */
    float generateWaveform(SIDWaveform wave, float& phase, float phaseInc, float pulseWidth, uint32_t& noiseShift)
    {
        float output = 0.0f;

        switch (wave)
        {
            case SIDWaveform::Pulse:
                // Classic pulse wave with variable width
                output = (phase < pulseWidth) ? 1.0f : -1.0f;
                break;

            case SIDWaveform::Saw:
                // Sawtooth wave
                output = 2.0f * phase - 1.0f;
                break;

            case SIDWaveform::Triangle:
                // Triangle wave
                output = (phase < 0.5f) ? (4.0f * phase - 1.0f) : (3.0f - 4.0f * phase);
                break;

            case SIDWaveform::Noise:
                // SID-style LFSR noise (23-bit shift register)
                // Clock the shift register at oscillator frequency
                {
                    // Simple feedback shift register
                    uint32_t bit = ((noiseShift >> 22) ^ (noiseShift >> 17)) & 1;
                    noiseShift = ((noiseShift << 1) | bit) & 0x7FFFFF;
                    output = (static_cast<float>(noiseShift & 0xFF) / 127.5f) - 1.0f;
                }
                break;
        }

        // Advance phase
        phase += phaseInc;
        if (phase >= 1.0f)
            phase -= 1.0f;

        return output;
    }

    /**
     * @brief Apply bit crushing
     */
    float bitCrush(float sample)
    {
        // Quantize to bit depth
        float levels = std::pow(2.0f, static_cast<float>(bitDepth));
        float halfLevels = levels / 2.0f;

        // Scale to range, quantize, scale back
        float quantized = std::round((sample + 1.0f) * halfLevels) / halfLevels - 1.0f;

        return std::clamp(quantized, -1.0f, 1.0f);
    }

    /**
     * @brief Apply sample rate reduction via sample-and-hold
     */
    float sampleRateReduce(float sample)
    {
        sampleHoldCounter++;
        if (sampleHoldCounter >= sampleHoldPeriod)
        {
            sampleHoldCounter = 0;
            heldSample = sample;
        }
        return heldSample;
    }

    //==========================================================================
    // Block Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        // Calculate phase increments with tuning
        float tune1 = std::pow(2.0f, osc1Tune / 12.0f);
        float tune2 = std::pow(2.0f, osc2Tune / 12.0f);
        float tune3 = std::pow(2.0f, osc3Tune / 12.0f);
        float phaseInc1 = basePhaseInc * tune1;
        float phaseInc2 = basePhaseInc * tune2;
        float phaseInc3 = basePhaseInc * tune3;

        // Process filter coefficients
        using FilterType = sst::filters::CytomicSVF;

        float normalizedCutoff = filterCutoff / static_cast<float>(sampleRate);
        normalizedCutoff = std::clamp(normalizedCutoff, 0.001f, 0.45f);

        // Q from resonance (0-1 -> 0.5-20)
        float q = 0.5f + filterReso * 19.5f;

        for (int i = 0; i < blockSize; ++i)
        {
            // ================================================================
            // OSCILLATORS
            // ================================================================

            float osc1Out = generateWaveform(osc1Wave, phase1, phaseInc1, osc1PulseWidth, noiseShift1);
            float osc2Out = generateWaveform(osc2Wave, phase2, phaseInc2, osc2PulseWidth, noiseShift2);
            float osc3Out = generateWaveform(osc3Wave, phase3, phaseInc3, 0.5f, noiseShift3);

            // ================================================================
            // RING MODULATION
            // ================================================================

            // Ring mod: blend between normal osc2 and osc1*osc2
            float osc2Processed = osc2Out * (1.0f - osc2RingMod) + (osc1Out * osc2Out) * osc2RingMod;

            // ================================================================
            // MIX OSCILLATORS
            // ================================================================

            float mixed = osc1Out * osc1Level + osc2Processed * osc2Level + osc3Out * osc3Level;

            // ================================================================
            // LO-FI PROCESSING
            // ================================================================

            // Sample rate reduction first (before bit crushing for more authentic sound)
            float lofi = sampleRateReduce(mixed);

            // Bit crushing
            lofi = bitCrush(lofi);

            // ================================================================
            // FILTER
            // ================================================================

            // Set coefficients based on mode
            switch (filterMode)
            {
                case FilterMode::LowPass:
                    filterL.setCoeff(FilterType::LP, normalizedCutoff, q);
                    filterR.setCoeff(FilterType::LP, normalizedCutoff, q);
                    break;
                case FilterMode::BandPass:
                    filterL.setCoeff(FilterType::BP, normalizedCutoff, q);
                    filterR.setCoeff(FilterType::BP, normalizedCutoff, q);
                    break;
                case FilterMode::HighPass:
                    filterL.setCoeff(FilterType::HP, normalizedCutoff, q);
                    filterR.setCoeff(FilterType::HP, normalizedCutoff, q);
                    break;
            }

            float filtered = filterL.process(lofi);

            // ================================================================
            // ENVELOPE
            // ================================================================

            float envOut = ampEnv.processSample();

            if (ampEnv.stage == sst::basic_blocks::modulators::ADSREnvelope<1, true>::s_complete)
            {
                active = false;
                return;
            }

            // ================================================================
            // OUTPUT
            // ================================================================

            float output = filtered * envOut * velocity * 0.5f;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    //==========================================================================
    // Voice State
    //==========================================================================

    bool active = false;
    bool releasing = false;
    int currentNote = -1;
    float velocity = 0.0f;
    int age = 0;

    //==========================================================================
    // DSP State
    //==========================================================================

    double sampleRate = 44100.0;
    float basePhaseInc = 0.0f;

    // Oscillator phases
    float phase1 = 0.0f;
    float phase2 = 0.0f;
    float phase3 = 0.0f;

    // Noise shift registers (SID-style LFSR)
    uint32_t noiseShift1 = 0x7FFFF8;
    uint32_t noiseShift2 = 0x7FFFF8;
    uint32_t noiseShift3 = 0x7FFFF8;
    float noiseValue1 = 0.0f;
    float noiseValue2 = 0.0f;
    float noiseValue3 = 0.0f;

    // Sample-and-hold for rate reduction
    int sampleHoldCounter = 0;
    int sampleHoldPeriod = 1;
    float heldSample = 0.0f;

    //==========================================================================
    // SST Components
    //==========================================================================

    sst::filters::CytomicSVF filterL;
    sst::filters::CytomicSVF filterR;
    sst::basic_blocks::modulators::ADSREnvelope<1, true> ampEnv;

    //==========================================================================
    // Parameters
    //==========================================================================

    // Oscillator 1
    SIDWaveform osc1Wave = SIDWaveform::Saw;
    float osc1Tune = 0.0f;
    float osc1PulseWidth = 0.5f;
    float osc1Level = 0.8f;

    // Oscillator 2
    SIDWaveform osc2Wave = SIDWaveform::Pulse;
    float osc2Tune = 0.0f;
    float osc2PulseWidth = 0.5f;
    float osc2Level = 0.5f;
    float osc2RingMod = 0.0f;

    // Oscillator 3
    SIDWaveform osc3Wave = SIDWaveform::Triangle;
    float osc3Tune = 0.0f;
    float osc3Level = 0.3f;

    // Lo-Fi
    int bitDepth = 8;

    // Filter
    float filterCutoff = 8000.0f;
    float filterReso = 0.2f;
    FilterMode filterMode = FilterMode::LowPass;

    // Envelope
    float attackTime = 0.01f;
    float decayTime = 0.2f;
    float sustainLevel = 0.7f;
    float releaseTime = 0.3f;
};
