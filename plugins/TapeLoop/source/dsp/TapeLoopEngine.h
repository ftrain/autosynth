/**
 * @file TapeLoopEngine.h
 * @brief Tape loop drone engine with recording, playback, and degradation
 *
 * This engine generates drone tones via two oscillators and feeds them into
 * a tape-style looper with accumulation and degradation effects.
 *
 * Signal Flow:
 *   [Osc1] + [Osc2] -> [Tape Loop Buffer] -> [Tape Degradation] -> [Mix] -> Output
 *
 * Tape Loop:
 *   - Circular buffer that continuously plays
 *   - Records incoming oscillator audio when note is held
 *   - Feedback causes layers to accumulate (like tape overdub)
 *   - Degradation (wobble, saturation, filtering, noise) applied each pass
 */

#pragma once

#include <array>
#include <vector>
#include <cmath>
#include <algorithm>
#include <random>

/**
 * @brief Simple band-limited oscillator using PolyBLEP
 *
 * Generates saw, triangle, and sine waveforms with minimal aliasing.
 */
class SimpleOscillator
{
public:
    SimpleOscillator() = default;

    void setFrequency(double freqHz, double sr)
    {
        frequency = freqHz;
        sampleRate = sr;
        phaseIncrement = frequency / sampleRate;
    }

    void reset() { phase = 0.0; }

    /**
     * @brief Generate next sample
     * @param waveform 0=sine, 1=triangle, 2=saw
     */
    float process(int waveform)
    {
        float output = 0.0f;

        switch (waveform)
        {
            case 0: // Sine
                output = static_cast<float>(std::sin(phase * 2.0 * M_PI));
                break;

            case 1: // Triangle
            {
                // Triangle from phase
                double t = phase;
                output = static_cast<float>(4.0 * std::abs(t - 0.5) - 1.0);
                break;
            }

            case 2: // Saw with PolyBLEP anti-aliasing
            default:
            {
                // Naive saw
                double t = phase;
                output = static_cast<float>(2.0 * t - 1.0);

                // PolyBLEP at discontinuity
                output -= static_cast<float>(polyBLEP(t));
                break;
            }
        }

        // Advance phase
        phase += phaseIncrement;
        if (phase >= 1.0)
            phase -= 1.0;

        return output;
    }

private:
    /**
     * @brief PolyBLEP anti-aliasing correction
     */
    double polyBLEP(double t) const
    {
        double dt = phaseIncrement;

        // Start of period
        if (t < dt)
        {
            t /= dt;
            return t + t - t * t - 1.0;
        }
        // End of period
        else if (t > 1.0 - dt)
        {
            t = (t - 1.0) / dt;
            return t * t + t + t + 1.0;
        }
        return 0.0;
    }

    double phase = 0.0;
    double phaseIncrement = 0.0;
    double frequency = 440.0;
    double sampleRate = 44100.0;
};

/**
 * @brief Tape loop drone synthesizer engine
 *
 * Generates layered drone textures through a tape loop mechanism.
 * Two oscillators provide source material that gets recorded into
 * a circular buffer with tape-style degradation on each pass.
 */
class TapeLoopEngine
{
public:
    //==========================================================================
    // Configuration
    //==========================================================================

    /** Maximum tape loop length in seconds */
    static constexpr float MAX_LOOP_SECONDS = 12.0f;

    /** Maximum sample rate supported */
    static constexpr int MAX_SAMPLE_RATE = 192000;

    /** Maximum buffer size (12 seconds at 192kHz) */
    static constexpr size_t MAX_BUFFER_SIZE = static_cast<size_t>(MAX_LOOP_SECONDS * MAX_SAMPLE_RATE);

    TapeLoopEngine()
        : rng(std::random_device{}())
        , noiseDist(-1.0f, 1.0f)
    {
        // Pre-allocate tape buffer
        tapeBufferL.resize(MAX_BUFFER_SIZE, 0.0f);
        tapeBufferR.resize(MAX_BUFFER_SIZE, 0.0f);
    }

    ~TapeLoopEngine() = default;

    //==========================================================================
    // Lifecycle
    //==========================================================================

    /**
     * @brief Prepare the engine for playback
     * @param sr Sample rate in Hz
     * @param maxBlockSize Maximum expected block size
     */
    void prepare(double sr, int maxBlockSize)
    {
        sampleRate = static_cast<float>(sr);

        // Initialize oscillators with default frequency
        osc1.setFrequency(110.0, sr);  // A2
        osc2.setFrequency(110.0, sr);

        // Calculate buffer size for current sample rate
        maxBufferSamples = static_cast<size_t>(MAX_LOOP_SECONDS * sampleRate);

        // Reset read/write positions
        writePos = 0;

        // Initialize wobble LFO phase
        wobblePhase = 0.0f;

        // Initialize age filter state
        ageFilterStateL = 0.0f;
        ageFilterStateR = 0.0f;

        (void)maxBlockSize;
    }

    /**
     * @brief Release resources
     */
    void releaseResources()
    {
        // Clear tape buffer
        std::fill(tapeBufferL.begin(), tapeBufferL.end(), 0.0f);
        std::fill(tapeBufferR.begin(), tapeBufferR.end(), 0.0f);
        writePos = 0;
    }

    //==========================================================================
    // Note Handling
    //==========================================================================

    /**
     * @brief Start recording into the tape loop
     * @param note MIDI note number (sets oscillator pitch)
     * @param velocity Note velocity
     */
    void noteOn(int note, float velocity)
    {
        isRecording = true;
        currentVelocity = velocity;

        // Set oscillator frequencies based on MIDI note
        float baseFreq = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
        updateOscillatorFrequencies(baseFreq);
    }

    /**
     * @brief Stop recording
     */
    void noteOff(int note)
    {
        (void)note;
        isRecording = false;
    }

    /**
     * @brief Stop all immediately
     */
    void allNotesOff()
    {
        isRecording = false;
    }

    /**
     * @brief Clear the tape loop buffer
     */
    void clearTape()
    {
        std::fill(tapeBufferL.begin(), tapeBufferL.end(), 0.0f);
        std::fill(tapeBufferR.begin(), tapeBufferR.end(), 0.0f);
    }

    //==========================================================================
    // Audio Rendering
    //==========================================================================

    /**
     * @brief Render audio output
     * @param outputL Left channel output buffer
     * @param outputR Right channel output buffer
     * @param numSamples Number of samples to render
     */
    void renderBlock(float* outputL, float* outputR, int numSamples)
    {
        // Calculate loop length in samples
        size_t loopSamples = static_cast<size_t>(loopLength * sampleRate);
        loopSamples = std::clamp(loopSamples, size_t(1), maxBufferSamples);

        for (int i = 0; i < numSamples; ++i)
        {
            // ================================================================
            // OSCILLATORS (source material)
            // ================================================================
            float oscOut = 0.0f;

            if (isRecording)
            {
                // Generate oscillator 1
                float osc1Out = osc1.process(osc1Waveform) * osc1Level;

                // Generate oscillator 2
                float osc2Out = osc2.process(osc2Waveform) * osc2Level;

                oscOut = (osc1Out + osc2Out) * currentVelocity * recordLevel;
            }

            // ================================================================
            // TAPE LOOP - Read with wobble
            // ================================================================

            // Calculate wobbled read position (wow/flutter effect)
            wobblePhase += wobbleRate / sampleRate;
            if (wobblePhase >= 1.0f) wobblePhase -= 1.0f;

            float wobbleOffset = std::sin(wobblePhase * 6.283185f) * wobbleDepth * 100.0f;

            // Read position with wobble (fractional for interpolation)
            float readPosF = static_cast<float>(writePos) - wobbleOffset;
            if (readPosF < 0) readPosF += static_cast<float>(loopSamples);

            // Linear interpolation for smooth playback
            size_t readPos0 = static_cast<size_t>(readPosF) % loopSamples;
            size_t readPos1 = (readPos0 + 1) % loopSamples;
            float frac = readPosF - std::floor(readPosF);

            float tapeL = tapeBufferL[readPos0] * (1.0f - frac) + tapeBufferL[readPos1] * frac;
            float tapeR = tapeBufferR[readPos0] * (1.0f - frac) + tapeBufferR[readPos1] * frac;

            // ================================================================
            // TAPE DEGRADATION
            // ================================================================

            // Saturation (tanh soft clipping)
            float satAmount = saturation * 4.0f + 1.0f;
            tapeL = std::tanh(tapeL * satAmount) / std::tanh(satAmount);
            tapeR = std::tanh(tapeR * satAmount) / std::tanh(satAmount);

            // Age filter (lowpass that simulates high frequency loss)
            // Higher age = lower cutoff
            float ageCutoff = 1.0f - (tapeAge * 0.9f);  // 1.0 to 0.1
            float ageCoeff = ageCutoff * ageCutoff;      // More aggressive curve

            ageFilterStateL += ageCoeff * (tapeL - ageFilterStateL);
            ageFilterStateR += ageCoeff * (tapeR - ageFilterStateR);

            tapeL = ageFilterStateL;
            tapeR = ageFilterStateR;

            // Tape hiss (filtered noise)
            float noise = noiseDist(rng) * tapeHiss * 0.02f;
            tapeL += noise;
            tapeR += noise;

            // ================================================================
            // TAPE LOOP - Write (overdub with feedback)
            // ================================================================

            // Mix feedback and new input
            float newL = tapeBufferL[writePos] * loopFeedback + oscOut;
            float newR = tapeBufferR[writePos] * loopFeedback + oscOut;

            // Soft limit to prevent runaway
            newL = std::tanh(newL);
            newR = std::tanh(newR);

            tapeBufferL[writePos] = newL;
            tapeBufferR[writePos] = newR;

            // Advance write position
            writePos = (writePos + 1) % loopSamples;

            // ================================================================
            // OUTPUT MIX
            // ================================================================

            float dryL = oscOut * dryLevel;
            float dryR = oscOut * dryLevel;

            float wetL = tapeL * loopOutputLevel;
            float wetR = tapeR * loopOutputLevel;

            outputL[i] = (dryL + wetL) * masterLevel;
            outputR[i] = (dryR + wetR) * masterLevel;
        }
    }

    //==========================================================================
    // Parameter Setters
    //==========================================================================

    // Oscillator 1
    void setOsc1Waveform(int waveform) { osc1Waveform = waveform; }
    void setOsc1Tune(float semitones) { osc1Tune = semitones; updateOscillatorFrequencies(baseFrequency); }
    void setOsc1Level(float level) { osc1Level = level; }

    // Oscillator 2
    void setOsc2Waveform(int waveform) { osc2Waveform = waveform; }
    void setOsc2Tune(float semitones) { osc2Tune = semitones; updateOscillatorFrequencies(baseFrequency); }
    void setOsc2Detune(float cents) { osc2Detune = cents; updateOscillatorFrequencies(baseFrequency); }
    void setOsc2Level(float level) { osc2Level = level; }

    // Tape Loop
    void setLoopLength(float seconds) { loopLength = std::clamp(seconds, 0.1f, MAX_LOOP_SECONDS); }
    void setLoopFeedback(float fb) { loopFeedback = std::clamp(fb, 0.0f, 0.99f); }
    void setRecordLevel(float level) { recordLevel = level; }

    // Tape Character
    void setSaturation(float sat) { saturation = sat; }
    void setWobbleRate(float rate) { wobbleRate = rate; }
    void setWobbleDepth(float depth) { wobbleDepth = depth; }

    // Tape Noise
    void setTapeHiss(float hiss) { tapeHiss = hiss; }
    void setTapeAge(float age) { tapeAge = age; }

    // Mix
    void setDryLevel(float level) { dryLevel = level; }
    void setLoopLevel(float level) { loopOutputLevel = level; }
    void setMasterLevel(float level) { masterLevel = level; }

private:
    //==========================================================================
    // Internal Helpers
    //==========================================================================

    void updateOscillatorFrequencies(float baseFreq)
    {
        baseFrequency = baseFreq;

        // Oscillator 1 with tune
        double freq1 = baseFreq * std::pow(2.0f, osc1Tune / 12.0f);
        osc1.setFrequency(freq1, sampleRate);

        // Oscillator 2 with tune and detune
        double freq2 = baseFreq * std::pow(2.0f, (osc2Tune + osc2Detune / 100.0f) / 12.0f);
        osc2.setFrequency(freq2, sampleRate);
    }

    //==========================================================================
    // Oscillators
    //==========================================================================

    SimpleOscillator osc1;
    SimpleOscillator osc2;

    //==========================================================================
    // Tape Buffer
    //==========================================================================

    std::vector<float> tapeBufferL;
    std::vector<float> tapeBufferR;
    size_t writePos = 0;
    size_t maxBufferSamples = 0;

    //==========================================================================
    // Wobble LFO
    //==========================================================================

    float wobblePhase = 0.0f;

    //==========================================================================
    // Age Filter State
    //==========================================================================

    float ageFilterStateL = 0.0f;
    float ageFilterStateR = 0.0f;

    //==========================================================================
    // Noise Generator
    //==========================================================================

    std::mt19937 rng;
    std::uniform_real_distribution<float> noiseDist;

    //==========================================================================
    // Engine State
    //==========================================================================

    float sampleRate = 44100.0f;
    float baseFrequency = 110.0f;
    bool isRecording = false;
    float currentVelocity = 0.0f;

    //==========================================================================
    // Parameters
    //==========================================================================

    // Oscillator 1
    int osc1Waveform = 0;
    float osc1Tune = 0.0f;
    float osc1Level = 0.7f;

    // Oscillator 2
    int osc2Waveform = 0;
    float osc2Tune = 0.0f;
    float osc2Detune = 7.0f;
    float osc2Level = 0.5f;

    // Tape Loop
    float loopLength = 4.0f;
    float loopFeedback = 0.85f;
    float recordLevel = 0.5f;

    // Tape Character
    float saturation = 0.3f;
    float wobbleRate = 0.5f;
    float wobbleDepth = 0.2f;

    // Tape Noise
    float tapeHiss = 0.1f;
    float tapeAge = 0.3f;

    // Mix
    float dryLevel = 0.3f;
    float loopOutputLevel = 0.7f;
    float masterLevel = 0.8f;
};
