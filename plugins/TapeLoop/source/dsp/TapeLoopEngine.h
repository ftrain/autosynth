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
 * @brief Simple AD (Attack-Decay) envelope with smooth linear attack
 *
 * Prevents clicks by smoothly ramping amplitude on note on/off.
 * Uses linear attack for click-free starts, exponential decay for natural release.
 */
class ADEnvelope
{
public:
    ADEnvelope() = default;

    void setSampleRate(float sr) { sampleRate = sr; updateCoefficients(); }
    void setAttack(float seconds) { attackTime = std::max(0.005f, seconds); updateCoefficients(); }
    void setDecay(float seconds) { decayTime = std::max(0.01f, seconds); updateCoefficients(); }

    void trigger()
    {
        inAttack = true;
        inDecay = false;
        // Anti-click: DON'T reset level - continue from where we are
    }

    void release()
    {
        inAttack = false;
        inDecay = true;
    }

    float process()
    {
        if (inAttack)
        {
            // Linear attack for click-free starts (more predictable than exponential)
            currentLevel += attackIncrement;
            if (currentLevel >= 1.0f)
            {
                currentLevel = 1.0f;
                inAttack = false;
            }
        }
        else if (inDecay)
        {
            // Exponential decay toward 0
            currentLevel *= decayCoef;
            if (currentLevel < 0.0001f)
            {
                currentLevel = 0.0f;
                inDecay = false;
            }
        }
        return currentLevel;
    }

    bool isActive() const { return inAttack || inDecay || currentLevel > 0.0001f; }
    float getLevel() const { return currentLevel; }

private:
    void updateCoefficients()
    {
        // Linear attack increment
        float attackSamples = attackTime * sampleRate;
        attackIncrement = 1.0f / attackSamples;

        // Exponential decay coefficient
        float decaySamples = decayTime * sampleRate;
        decayCoef = std::exp(-4.0f / decaySamples);
    }

    float sampleRate = 44100.0f;
    float attackTime = 0.01f;
    float decayTime = 0.5f;
    float attackIncrement = 0.001f;
    float decayCoef = 0.99f;
    float currentLevel = 0.0f;
    bool inAttack = false;
    bool inDecay = false;
};

/**
 * @brief Simple LFO with multiple waveforms
 */
class SimpleLFO
{
public:
    SimpleLFO() = default;

    void setSampleRate(float sr) { sampleRate = sr; }
    void setRate(float hz) { rate = std::clamp(hz, 0.01f, 50.0f); }
    void setWaveform(int wf) { waveform = wf; }

    void reset() { phase = 0.0f; }

    float process()
    {
        float output = 0.0f;

        switch (waveform)
        {
            case 0: // Sine
                output = std::sin(phase * 6.283185f);
                break;
            case 1: // Triangle
                output = 4.0f * std::abs(phase - 0.5f) - 1.0f;
                break;
            case 2: // Saw up
                output = 2.0f * phase - 1.0f;
                break;
            case 3: // Square
                output = phase < 0.5f ? 1.0f : -1.0f;
                break;
            default:
                output = std::sin(phase * 6.283185f);
        }

        phase += rate / sampleRate;
        if (phase >= 1.0f) phase -= 1.0f;

        return output;
    }

private:
    float phase = 0.0f;
    float rate = 1.0f;
    int waveform = 0;
    float sampleRate = 44100.0f;
};

/**
 * @brief Stereo delay with feedback
 */
class StereoDelay
{
public:
    void prepare(double sr)
    {
        sampleRate = sr;
        bufferSize = static_cast<size_t>(sr * 4.0);  // 4 seconds max
        bufferL.resize(bufferSize, 0.0f);
        bufferR.resize(bufferSize, 0.0f);
        writePos = 0;
    }

    void setTime(float seconds)
    {
        delayTime = std::clamp(seconds, 0.001f, 4.0f);
        updateDelaySamples();
    }

    void setFeedback(float fb) { feedback = std::clamp(fb, 0.0f, 0.95f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    void process(float& left, float& right)
    {
        size_t readPos = (writePos + bufferSize - delaySamples) % bufferSize;

        float delayedL = bufferL[readPos];
        float delayedR = bufferR[readPos];

        bufferL[writePos] = left + delayedL * feedback;
        bufferR[writePos] = right + delayedR * feedback;

        left = left * (1.0f - mix) + delayedL * mix;
        right = right * (1.0f - mix) + delayedR * mix;

        writePos = (writePos + 1) % bufferSize;
    }

private:
    void updateDelaySamples()
    {
        delaySamples = static_cast<size_t>(delayTime * sampleRate);
        if (delaySamples >= bufferSize)
            delaySamples = bufferSize - 1;
    }

    double sampleRate = 44100.0;
    std::vector<float> bufferL;
    std::vector<float> bufferR;
    size_t bufferSize = 176400;
    size_t writePos = 0;
    size_t delaySamples = 22050;
    float delayTime = 0.5f;
    float feedback = 0.3f;
    float mix = 0.0f;
};

/**
 * @brief Schroeder-style reverb with allpass diffusion and comb filters
 */
class AmbisonicReverb
{
public:
    void prepare(double sr)
    {
        sampleRate = sr;

        // Allpass delays for diffusion
        for (int i = 0; i < 4; ++i)
        {
            apDelays[i].resize(static_cast<size_t>(sr * apTimes[i]), 0.0f);
            apPos[i] = 0;
        }

        // Comb filters for reverb tail
        for (int i = 0; i < 8; ++i)
        {
            combDelays[i].resize(static_cast<size_t>(sr * combTimes[i]), 0.0f);
            combPos[i] = 0;
            combFilters[i] = 0.0f;
        }
    }

    void setDecay(float d) { decay = std::clamp(d, 0.1f, 10.0f); }
    void setMix(float m)
    {
        float linearMix = std::clamp(m, 0.0f, 1.0f);
        // 4th power curve for gradual onset
        mix = linearMix * linearMix * linearMix * linearMix;
    }
    void setDamping(float d) { damping = std::clamp(d, 0.0f, 1.0f); }

    void process(float& left, float& right)
    {
        float input = (left + right) * 0.5f;

        // Allpass diffusion
        float diffused = input;
        for (int i = 0; i < 4; ++i)
            diffused = processAllpass(i, diffused);

        // Parallel comb filters
        float reverbL = 0.0f;
        float reverbR = 0.0f;
        float combGain = std::pow(0.001f, 1.0f / (decay * static_cast<float>(sampleRate)));

        for (int i = 0; i < 4; ++i)
            reverbL += processComb(i, diffused, combGain);
        for (int i = 4; i < 8; ++i)
            reverbR += processComb(i, diffused, combGain);

        reverbL *= 0.25f;
        reverbR *= 0.25f;

        left = left * (1.0f - mix) + reverbL * mix;
        right = right * (1.0f - mix) + reverbR * mix;
    }

private:
    float processAllpass(int idx, float input)
    {
        float delayed = apDelays[idx][apPos[idx]];
        float output = -input + delayed;
        apDelays[idx][apPos[idx]] = input + delayed * 0.5f;
        apPos[idx] = (apPos[idx] + 1) % apDelays[idx].size();
        return output;
    }

    float processComb(int idx, float input, float gain)
    {
        float delayed = combDelays[idx][combPos[idx]];
        combFilters[idx] = delayed * (1.0f - damping) + combFilters[idx] * damping;
        combDelays[idx][combPos[idx]] = input + combFilters[idx] * gain;
        combPos[idx] = (combPos[idx] + 1) % combDelays[idx].size();
        return delayed;
    }

    double sampleRate = 44100.0;
    float decay = 2.0f;
    float mix = 0.0f;
    float damping = 0.5f;

    float apTimes[4] = {0.0051f, 0.0076f, 0.01f, 0.0123f};
    std::vector<float> apDelays[4];
    size_t apPos[4] = {0, 0, 0, 0};

    float combTimes[8] = {0.0297f, 0.0371f, 0.0411f, 0.0437f,
                          0.0299f, 0.0373f, 0.0413f, 0.0439f};
    std::vector<float> combDelays[8];
    size_t combPos[8] = {0, 0, 0, 0, 0, 0, 0, 0};
    float combFilters[8] = {0, 0, 0, 0, 0, 0, 0, 0};
};

/**
 * @brief Simple compressor with dry/wet mix
 */
class Compressor
{
public:
    void prepare(double sr)
    {
        sampleRate = sr;
        updateCoefficients();
    }

    void setThreshold(float db) { threshold = db; }
    void setRatio(float r) { ratio = std::clamp(r, 1.0f, 20.0f); }
    void setAttack(float ms) { attackMs = std::clamp(ms, 0.1f, 100.0f); updateCoefficients(); }
    void setRelease(float ms) { releaseMs = std::clamp(ms, 10.0f, 1000.0f); updateCoefficients(); }
    void setMakeupGain(float db) { makeupGain = std::pow(10.0f, db / 20.0f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    void process(float& left, float& right)
    {
        float dryL = left;
        float dryR = right;

        float inputLevel = std::max(std::abs(left), std::abs(right));
        float inputDb = 20.0f * std::log10(inputLevel + 1e-6f);

        float gainReduction = 0.0f;
        if (inputDb > threshold)
            gainReduction = (inputDb - threshold) * (1.0f - 1.0f / ratio);

        float targetGain = std::pow(10.0f, -gainReduction / 20.0f);
        if (targetGain < envelope)
            envelope = attackCoef * envelope + (1.0f - attackCoef) * targetGain;
        else
            envelope = releaseCoef * envelope + (1.0f - releaseCoef) * targetGain;

        float gain = envelope * makeupGain;
        float wetL = left * gain;
        float wetR = right * gain;

        left = dryL * (1.0f - mix) + wetL * mix;
        right = dryR * (1.0f - mix) + wetR * mix;
    }

private:
    void updateCoefficients()
    {
        attackCoef = std::exp(-1.0f / (attackMs * 0.001f * static_cast<float>(sampleRate)));
        releaseCoef = std::exp(-1.0f / (releaseMs * 0.001f * static_cast<float>(sampleRate)));
    }

    double sampleRate = 44100.0;
    float threshold = -10.0f;
    float ratio = 4.0f;
    float attackMs = 10.0f;
    float releaseMs = 100.0f;
    float makeupGain = 1.0f;
    float attackCoef = 0.0f;
    float releaseCoef = 0.0f;
    float envelope = 1.0f;
    float mix = 1.0f;
};

/**
 * @brief Simple band-limited oscillator using PolyBLEP
 *
 * Generates saw, triangle, and sine waveforms with minimal aliasing.
 * Supports FM modulation input.
 */
class SimpleOscillator
{
public:
    SimpleOscillator() = default;

    void setFrequency(double freqHz, double sr)
    {
        frequency = freqHz;
        sampleRate = sr;
        basePhaseIncrement = frequency / sampleRate;
        phaseIncrement = basePhaseIncrement;
    }

    void reset() { phase = 0.0; }
    void resetPhase() { phase = 0.0; }

    /**
     * @brief Generate next sample
     * @param waveform 0=sine, 1=triangle, 2=saw
     * @param fmMod FM modulation amount (adds to phase increment)
     */
    float process(int waveform, float fmMod = 0.0f)
    {
        float output = 0.0f;

        // Apply FM modulation to phase increment
        phaseIncrement = basePhaseIncrement + static_cast<double>(fmMod);
        phaseIncrement = std::max(0.0, std::min(phaseIncrement, 0.5)); // Limit to Nyquist

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
        if (phase < 0.0)
            phase += 1.0;

        return output;
    }

private:
    /**
     * @brief PolyBLEP anti-aliasing correction
     */
    double polyBLEP(double t) const
    {
        double dt = phaseIncrement;
        if (dt < 0.0001) return 0.0;

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
    double basePhaseIncrement = 0.0;
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
    static constexpr float MAX_LOOP_SECONDS = 60.0f;

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

        // Initialize envelope
        recordEnvelope.setSampleRate(sampleRate);

        // Initialize tape character LFO
        tapeCharLFO.setSampleRate(sampleRate);

        // Calculate buffer size for current sample rate
        maxBufferSamples = static_cast<size_t>(MAX_LOOP_SECONDS * sampleRate);

        // Reset read/write positions
        writePos = 0;

        // Initialize wobble LFO phase
        wobblePhase = 0.0f;

        // Initialize age filter state
        ageFilterStateL = 0.0f;
        ageFilterStateR = 0.0f;

        // Initialize degradation filter state
        degradeFilterStateL = 0.0f;
        degradeFilterStateR = 0.0f;

        // Initialize effects
        delay.prepare(sr);
        reverb.prepare(sr);
        compressor.prepare(sr);

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
     *
     * For drone synth: NEVER reset oscillator phase - this causes clicks.
     * Oscillators run continuously; we just modulate their amplitude with envelope.
     */
    void noteOn(int note, float velocity)
    {
        bool wasRecording = isRecording;
        isRecording = true;
        currentVelocity = velocity;

        // Only trigger envelope on first note (not while already playing)
        // NEVER reset oscillator phase - that causes clicks!
        if (!wasRecording)
        {
            recordEnvelope.trigger();
        }

        // Always update frequency for pitch changes
        float baseFreq = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
        updateOscillatorFrequencies(baseFreq);

        // Track active note for legato
        activeNote = note;
    }

    /**
     * @brief Stop recording
     * Only release if this is the note that's currently playing
     */
    void noteOff(int note)
    {
        // Only release if this was the active note (legato behavior)
        if (note == activeNote)
        {
            isRecording = false;
            recordEnvelope.release();
            activeNote = -1;
        }
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
            // TAPE CHARACTER LFO
            // ================================================================
            float lfoValue = tapeCharLFO.process();
            float lfoMod = lfoValue * lfoDepth;

            // Apply LFO to selected target
            float modulatedSaturation = saturation;
            float modulatedAge = tapeAge;
            float modulatedWobbleDepth = wobbleDepth;
            float modulatedDegrade = tapeDegrade;

            switch (lfoTarget)
            {
                case 0: // Saturation
                    modulatedSaturation = std::clamp(saturation + lfoMod * 0.5f, 0.0f, 1.0f);
                    break;
                case 1: // Age
                    modulatedAge = std::clamp(tapeAge + lfoMod * 0.5f, 0.0f, 1.0f);
                    break;
                case 2: // Wobble
                    modulatedWobbleDepth = std::clamp(wobbleDepth + lfoMod * 0.5f, 0.0f, 1.0f);
                    break;
                case 3: // Degrade
                    modulatedDegrade = std::clamp(tapeDegrade + lfoMod * 0.5f, 0.0f, 1.0f);
                    break;
            }

            // ================================================================
            // ENVELOPE
            // ================================================================
            float envLevel = recordEnvelope.process();

            // ================================================================
            // OSCILLATORS (source material) with FM
            // ================================================================
            float oscOut = 0.0f;

            if (isRecording || recordEnvelope.isActive())
            {
                // Generate oscillator 1 (carrier or modulator depending on FM)
                float osc1Out = osc1.process(osc1Waveform) * osc1Level;

                // Calculate FM modulation from osc1 to osc2
                float fmMod = osc1Out * fmAmount * 0.1f;  // Scale FM index

                // Generate oscillator 2 with FM modulation
                float osc2Out = osc2.process(osc2Waveform, fmMod) * osc2Level;

                oscOut = (osc1Out + osc2Out) * currentVelocity * recordLevel * envLevel;
            }

            // ================================================================
            // TAPE LOOP - Read with wobble
            // ================================================================

            // Calculate wobbled read position (wow/flutter effect)
            wobblePhase += wobbleRate / sampleRate;
            if (wobblePhase >= 1.0f) wobblePhase -= 1.0f;

            float wobbleOffset = std::sin(wobblePhase * 6.283185f) * modulatedWobbleDepth * 100.0f;

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
            float satAmount = modulatedSaturation * 4.0f + 1.0f;
            tapeL = std::tanh(tapeL * satAmount) / std::tanh(satAmount);
            tapeR = std::tanh(tapeR * satAmount) / std::tanh(satAmount);

            // Age filter (lowpass that simulates high frequency loss)
            // Higher age = lower cutoff
            float ageCutoff = 1.0f - (modulatedAge * 0.9f);  // 1.0 to 0.1
            float ageCoeff = ageCutoff * ageCutoff;          // More aggressive curve

            ageFilterStateL += ageCoeff * (tapeL - ageFilterStateL);
            ageFilterStateR += ageCoeff * (tapeR - ageFilterStateR);

            tapeL = ageFilterStateL;
            tapeR = ageFilterStateR;

            // Tape hiss (filtered noise)
            float noise = noiseDist(rng) * tapeHiss * 0.02f;
            tapeL += noise;
            tapeR += noise;

            // ================================================================
            // SELF-RE-RECORDING DEGRADATION
            // ================================================================
            // Simulate tape continuously re-recording itself:
            // - Each pass loses high frequencies
            // - Each pass adds subtle saturation
            // - Higher degrade = faster quality loss

            if (modulatedDegrade > 0.0f)
            {
                // Progressive lowpass - simulates magnetic medium losing highs
                float degradeCoeff = 1.0f - (modulatedDegrade * 0.3f);  // 1.0 to 0.7
                degradeFilterStateL += degradeCoeff * (tapeL - degradeFilterStateL);
                degradeFilterStateR += degradeCoeff * (tapeR - degradeFilterStateR);

                // Blend degraded signal based on degrade amount
                float degradeMix = modulatedDegrade * 0.5f;
                tapeL = tapeL * (1.0f - degradeMix) + degradeFilterStateL * degradeMix;
                tapeR = tapeR * (1.0f - degradeMix) + degradeFilterStateR * degradeMix;

                // Add subtle noise accumulation (tape noise floor rises)
                float degradeNoise = noiseDist(rng) * modulatedDegrade * 0.005f;
                tapeL += degradeNoise;
                tapeR += degradeNoise;
            }

            // ================================================================
            // TAPE LOOP - Write (overdub with feedback)
            // ================================================================

            // Reduce feedback based on degradation (tape wears out)
            float effectiveFeedback = loopFeedback * (1.0f - modulatedDegrade * 0.15f);

            // Mix feedback and new input
            float newL = tapeBufferL[writePos] * effectiveFeedback + oscOut;
            float newR = tapeBufferR[writePos] * effectiveFeedback + oscOut;

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

            float outL = (dryL + wetL) * masterLevel;
            float outR = (dryR + wetR) * masterLevel;

            // ================================================================
            // EFFECTS CHAIN: Delay -> Reverb -> Compressor
            // ================================================================

            delay.process(outL, outR);
            reverb.process(outL, outR);
            compressor.process(outL, outR);

            outputL[i] = outL;
            outputR[i] = outR;
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

    // Recording Envelope
    void setRecAttack(float seconds) { recordEnvelope.setAttack(seconds); }
    void setRecDecay(float seconds) { recordEnvelope.setDecay(seconds); }

    // FM Modulation
    void setFMAmount(float amount) { fmAmount = std::clamp(amount, 0.0f, 1.0f); }

    // Tape Degradation
    void setTapeDegrade(float degrade) { tapeDegrade = std::clamp(degrade, 0.0f, 1.0f); }

    // Tape Character LFO
    void setLFORate(float hz) { tapeCharLFO.setRate(hz); }
    void setLFODepth(float depth) { lfoDepth = std::clamp(depth, 0.0f, 1.0f); }
    void setLFOWaveform(int wf) { tapeCharLFO.setWaveform(wf); }
    void setLFOTarget(int target) { lfoTarget = std::clamp(target, 0, 3); }

    // Delay
    void setDelayTime(float seconds) { delay.setTime(seconds); }
    void setDelayFeedback(float fb) { delay.setFeedback(fb); }
    void setDelayMix(float m) { delay.setMix(m); }

    // Reverb
    void setReverbDecay(float d) { reverb.setDecay(d); }
    void setReverbMix(float m) { reverb.setMix(m); }
    void setReverbDamping(float d) { reverb.setDamping(d); }

    // Compressor
    void setCompThreshold(float db) { compressor.setThreshold(db); }
    void setCompRatio(float r) { compressor.setRatio(r); }
    void setCompAttack(float ms) { compressor.setAttack(ms); }
    void setCompRelease(float ms) { compressor.setRelease(ms); }
    void setCompMakeup(float db) { compressor.setMakeupGain(db); }
    void setCompMix(float m) { compressor.setMix(m); }

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
    int activeNote = -1;  // For legato/drone behavior

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

    // FM Modulation
    float fmAmount = 0.0f;

    // Recording Envelope
    ADEnvelope recordEnvelope;

    // Tape Degradation (self-re-recording)
    float tapeDegrade = 0.0f;
    float degradeFilterStateL = 0.0f;
    float degradeFilterStateR = 0.0f;

    // Tape Character LFO
    SimpleLFO tapeCharLFO;
    float lfoDepth = 0.0f;
    int lfoTarget = 0;  // 0=saturation, 1=age, 2=wobble, 3=degrade

    //==========================================================================
    // Effects
    //==========================================================================

    StereoDelay delay;
    AmbisonicReverb reverb;
    Compressor compressor;
};
