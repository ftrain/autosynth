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
 * @brief Full ADSR envelope with sustain stage
 */
class ADSREnvelope
{
public:
    enum Stage { IDLE, ATTACK, DECAY, SUSTAIN, RELEASE };

    void setSampleRate(float sr) { sampleRate = sr; updateCoefficients(); }
    void setAttack(float ms) { attackTime = std::max(1.0f, ms) / 1000.0f; updateCoefficients(); }
    void setDecay(float ms) { decayTime = std::max(1.0f, ms) / 1000.0f; updateCoefficients(); }
    void setSustain(float level) { sustainLevel = std::clamp(level, 0.0f, 1.0f); }
    void setRelease(float ms) { releaseTime = std::max(1.0f, ms) / 1000.0f; updateCoefficients(); }

    void trigger()
    {
        stage = ATTACK;
        // Don't reset level - continue from current for click-free retrigger
    }

    void release()
    {
        if (stage != IDLE)
            stage = RELEASE;
    }

    float process()
    {
        switch (stage)
        {
            case ATTACK:
                currentLevel += attackIncrement;
                if (currentLevel >= 1.0f)
                {
                    currentLevel = 1.0f;
                    stage = DECAY;
                }
                break;

            case DECAY:
                currentLevel += decayIncrement * (sustainLevel - currentLevel);
                if (currentLevel <= sustainLevel + 0.001f)
                {
                    currentLevel = sustainLevel;
                    stage = SUSTAIN;
                }
                break;

            case SUSTAIN:
                currentLevel = sustainLevel;
                break;

            case RELEASE:
                currentLevel *= releaseCoef;
                if (currentLevel < 0.0001f)
                {
                    currentLevel = 0.0f;
                    stage = IDLE;
                }
                break;

            case IDLE:
            default:
                currentLevel = 0.0f;
                break;
        }
        return currentLevel;
    }

    bool isActive() const { return stage != IDLE || currentLevel > 0.0001f; }
    float getLevel() const { return currentLevel; }
    Stage getStage() const { return stage; }

private:
    void updateCoefficients()
    {
        float attackSamples = attackTime * sampleRate;
        attackIncrement = 1.0f / std::max(1.0f, attackSamples);

        float decaySamples = decayTime * sampleRate;
        decayIncrement = 4.0f / std::max(1.0f, decaySamples);

        float releaseSamples = releaseTime * sampleRate;
        releaseCoef = std::exp(-4.0f / std::max(1.0f, releaseSamples));
    }

    float sampleRate = 44100.0f;
    float attackTime = 0.01f;
    float decayTime = 0.1f;
    float sustainLevel = 0.7f;
    float releaseTime = 0.3f;
    float attackIncrement = 0.001f;
    float decayIncrement = 0.01f;
    float releaseCoef = 0.999f;
    float currentLevel = 0.0f;
    Stage stage = IDLE;
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

// Forward declare Galactic3Reverb (defined in separate header)
#include "Galactic3Reverb.h"

// TapeDust for authentic slew-dependent tape hiss
#include "TapeDust.h"

// Airwindows Tape for saturation and head bump
#include "AirwindowsTape.h"

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
 * @brief 4-step sequencer with clock division, MIDI pitch and gate
 *
 * Each step has a MIDI pitch (note number) and gate (on/off).
 * Clock divides from 1/128 to 1 (whole note).
 * Used to sequence oscillator pitches in the TapeLoopEngine.
 */
class StepSequencer
{
public:
    static constexpr int NUM_STEPS = 4;
    static constexpr int NUM_DIVISIONS = 16;  // Extended to include slower divisions

    void setSampleRate(float sr) { sampleRate = sr; }
    void setBPM(float bpm) { this->bpm = bpm; }
    void setDivisionIndex(int idx) { divisionIndex = std::clamp(idx, 0, NUM_DIVISIONS - 1); }

    void setStepPitch(int step, int midiNote)
    {
        if (step >= 0 && step < NUM_STEPS)
            stepPitches[step] = std::clamp(midiNote, 0, 127);
    }

    void setStepGate(int step, bool gate)
    {
        if (step >= 0 && step < NUM_STEPS)
            stepGates[step] = gate;
    }

    int getStepPitch(int step) const
    {
        return (step >= 0 && step < NUM_STEPS) ? stepPitches[step] : 60;
    }

    bool getStepGate(int step) const
    {
        return (step >= 0 && step < NUM_STEPS) ? stepGates[step] : true;
    }

    int getCurrentStep() const { return currentStep; }

    void reset()
    {
        phase = 0.0f;
        currentStep = 0;
    }

    /**
     * @brief Process one sample and advance sequencer
     * @param outMidiNote Output: MIDI note for current step
     * @param outGate Output: gate state for current step
     * @return true if step just changed (trigger point)
     */
    bool process(int& outMidiNote, bool& outGate)
    {
        bool stepped = false;

        // Clock division values: 1/128 (fast) to 1/64 (very slow, 64 bars)
        static constexpr float CLOCK_DIVISIONS[] = {
            128.0f,   // 1/128 note
            64.0f,    // 1/64 note
            32.0f,    // 1/32 note
            16.0f,    // 1/16 note
            8.0f,     // 1/8 note
            4.0f,     // 1/4 (quarter)
            2.0f,     // 1/2 (half)
            1.0f,     // 1 (whole = 1 bar)
            0.5f,     // 2 bars
            0.25f,    // 4 bars
            0.125f,   // 8 bars
            0.0625f,  // 16 bars
            0.03125f, // 32 bars
            0.015625f,// 64 bars
            0.0078125f,// 128 bars (very slow)
            0.00390625f // 256 bars (glacial)
        };

        // Calculate step duration in samples
        float beatsPerSecond = bpm / 60.0f;
        float stepsPerSecond = beatsPerSecond * CLOCK_DIVISIONS[divisionIndex] / 4.0f;
        float phaseIncrement = stepsPerSecond / sampleRate;

        phase += phaseIncrement;

        if (phase >= 1.0f)
        {
            phase -= 1.0f;
            currentStep = (currentStep + 1) % NUM_STEPS;
            stepped = true;
        }

        outMidiNote = stepPitches[currentStep];
        outGate = stepGates[currentStep];
        return stepped;
    }

    /**
     * @brief Get frequency in Hz for a MIDI note
     */
    static float midiToFrequency(int midiNote)
    {
        return 440.0f * std::pow(2.0f, (midiNote - 69) / 12.0f);
    }

private:
    float sampleRate = 44100.0f;
    float bpm = 120.0f;
    int divisionIndex = 4;  // Default: 1/8 note
    float phase = 0.0f;
    int currentStep = 0;
    int stepPitches[NUM_STEPS] = {60, 60, 60, 60};  // MIDI notes (C4 default)
    bool stepGates[NUM_STEPS] = {true, true, true, true};  // Gates on by default
};

/**
 * @brief Tape loop drone synthesizer engine
 *
 * Generates layered drone textures through a tape loop mechanism.
 * Two oscillators provide source material that gets recorded into
 * a circular buffer with tape-style degradation on each pass.
 *
 * NEW: 4-step sequencer drives oscillator pitch, and oscillator output
 * can FM-modulate the tape loop read position for wild effects.
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

        // Initialize sequencers (one per oscillator)
        sequencer1.setSampleRate(sampleRate);
        sequencer2.setSampleRate(sampleRate);

        // Initialize ADSR envelopes (one per oscillator)
        osc1ADSR.setSampleRate(sampleRate);
        osc2ADSR.setSampleRate(sampleRate);

        // Initialize pan LFO
        panLFO.setSampleRate(sampleRate);
        panLFO.setWaveform(0);  // Sine wave for smooth panning

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
        tapeDust.prepare(sr);
        airwindowsTape.prepare(sr);

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
            osc1ADSR.trigger();
            osc2ADSR.trigger();
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
            osc1ADSR.release();
            osc2ADSR.release();
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
            // SEQUENCERS (one per oscillator)
            // ================================================================
            int seq1MidiNote = 60, seq2MidiNote = 60;
            bool seq1Gate = true, seq2Gate = true;

            if (seqEnabled)
            {
                // Process sequencers - they return current step's pitch/gate
                sequencer1.process(seq1MidiNote, seq1Gate);
                sequencer2.process(seq2MidiNote, seq2Gate);

                // Set oscillator frequencies from sequencer
                float freq1 = StepSequencer::midiToFrequency(seq1MidiNote);
                freq1 *= std::pow(2.0f, osc1Tune / 12.0f);
                osc1.setFrequency(freq1, sampleRate);

                float freq2 = StepSequencer::midiToFrequency(seq2MidiNote);
                freq2 *= std::pow(2.0f, (osc2Tune + osc2Detune / 100.0f) / 12.0f);
                osc2.setFrequency(freq2, sampleRate);
            }

            // ================================================================
            // ENVELOPES
            // ================================================================
            float envLevel = recordEnvelope.process();
            float osc1EnvLevel = osc1ADSR.process();
            float osc2EnvLevel = osc2ADSR.process();

            // ================================================================
            // PAN LFO (for stereo loop recording)
            // ================================================================
            float panLFOValue = panLFO.process();  // -1 to +1
            float panAmount = panLFOValue * panDepth;  // Scale by depth
            // Calculate stereo pan gains (constant power panning approximation)
            float panLeft = std::sqrt(0.5f * (1.0f - panAmount));
            float panRight = std::sqrt(0.5f * (1.0f + panAmount));

            // ================================================================
            // OSCILLATORS (source material) with FM and ADSR
            // ================================================================
            float oscOutL = 0.0f;
            float oscOutR = 0.0f;
            float osc1Out = 0.0f;
            float osc2Out = 0.0f;

            // Sequencer plays automatically when enabled (no MIDI required)
            // MIDI input still works for manual playing
            bool shouldPlay = seqEnabled || isRecording || recordEnvelope.isActive() ||
                              osc1ADSR.isActive() || osc2ADSR.isActive();

            if (shouldPlay)
            {
                // Apply sequencer gates (if sequencer enabled)
                float osc1GateLevel = (!seqEnabled || seq1Gate) ? 1.0f : 0.0f;
                float osc2GateLevel = (!seqEnabled || seq2Gate) ? 1.0f : 0.0f;

                // Apply ADSR envelopes to oscillators
                // When sequencer is enabled, use gate level; otherwise use ADSR
                float osc1AmpMod = seqEnabled ? osc1GateLevel : (osc1GateLevel * osc1EnvLevel);
                float osc2AmpMod = seqEnabled ? osc2GateLevel : (osc2GateLevel * osc2EnvLevel);

                // Generate oscillator 1 (carrier or modulator depending on FM)
                osc1Out = osc1.process(osc1Waveform) * osc1Level * osc1AmpMod;

                // Calculate FM modulation from osc1 to osc2
                float fmMod = osc1Out * fmAmount * 0.1f;  // Scale FM index

                // Generate oscillator 2 with FM modulation
                osc2Out = osc2.process(osc2Waveform, fmMod) * osc2Level * osc2AmpMod;

                // When sequencer is playing, use full level; otherwise use envelope
                float levelMod = seqEnabled ? recordLevel : (currentVelocity * recordLevel * envLevel);
                float oscMono = (osc1Out + osc2Out) * levelMod;

                // Apply pan LFO to create stereo output for recording
                oscOutL = oscMono * panLeft;
                oscOutR = oscMono * panRight;
            }

            // ================================================================
            // TAPE LOOP - Read with wobble + VOICE FM
            // ================================================================

            // Calculate wobbled read position (wow/flutter effect)
            wobblePhase += wobbleRate / sampleRate;
            if (wobblePhase >= 1.0f) wobblePhase -= 1.0f;

            float wobbleOffset = std::sin(wobblePhase * 6.283185f) * modulatedWobbleDepth * 100.0f;

            // VOICE FM TO LOOP: oscillator output modulates tape read position
            // This creates wild pitch-shifting effects - the voice "plays" the tape
            // voiceLoopFM scales the oscillator output to samples offset (up to ~1000 samples)
            float oscMono = (oscOutL + oscOutR) * 0.5f;  // Use mono for FM calculation
            float voiceFMOffset = oscMono * voiceLoopFM * 1000.0f;

            // Read position with wobble + voice FM (fractional for interpolation)
            float readPosF = static_cast<float>(writePos) - wobbleOffset - voiceFMOffset;
            while (readPosF < 0) readPosF += static_cast<float>(loopSamples);
            while (readPosF >= static_cast<float>(loopSamples)) readPosF -= static_cast<float>(loopSamples);

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

            // ================================================================
            // TAPE MODEL PROCESSING
            // ================================================================
            // 0 = Bypass, 1 = TapeDust only, 2 = Airwindows only, 3 = Both

            if (tapeModel == 1 || tapeModel == 3)  // TapeDust
            {
                tapeDust.setRange(tapeHiss);
                tapeDust.setMix(tapeHiss * 0.3f);
                tapeDust.process(tapeL, tapeR);
            }

            if (tapeModel == 2 || tapeModel == 3)  // Airwindows Tape
            {
                airwindowsTape.process(tapeL, tapeR);
            }

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
            // TAPE LOOP - Write (overdub with feedback + voice FM + pan)
            // ================================================================

            // Reduce feedback based on degradation (tape wears out)
            float effectiveFeedback = loopFeedback * (1.0f - modulatedDegrade * 0.15f);

            // Read current tape content WITH voice FM offset (so FM gets "baked in")
            // This creates the effect where playing modulates what gets recorded
            float fmReadL = tapeBufferL[readPos0] * (1.0f - frac) + tapeBufferL[readPos1] * frac;
            float fmReadR = tapeBufferR[readPos0] * (1.0f - frac) + tapeBufferR[readPos1] * frac;

            // Mix feedback (from FM-modulated read position) and new stereo input with pan
            float newL = fmReadL * effectiveFeedback + oscOutL;
            float newR = fmReadR * effectiveFeedback + oscOutR;

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

            float dryL = oscOutL * dryLevel;
            float dryR = oscOutR * dryLevel;

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

    // Tape Model Selection
    void setTapeModel(int model) { tapeModel = std::clamp(model, 0, 3); }
    void setTapeDrive(float drive) { tapeDrive = std::clamp(drive, 0.0f, 1.0f); airwindowsTape.setInputGain(drive); }
    void setTapeBump(float bump) { tapeBump = std::clamp(bump, 0.0f, 1.0f); airwindowsTape.setHeadBump(bump); }

    // Tape Character LFO
    void setLFORate(float hz) { tapeCharLFO.setRate(hz); }
    void setLFODepth(float depth) { lfoDepth = std::clamp(depth, 0.0f, 1.0f); }
    void setLFOWaveform(int wf) { tapeCharLFO.setWaveform(wf); }
    void setLFOTarget(int target) { lfoTarget = std::clamp(target, 0, 3); }

    // Delay
    void setDelayTime(float seconds) { delay.setTime(seconds); }
    void setDelayFeedback(float fb) { delay.setFeedback(fb); }
    void setDelayMix(float m) { delay.setMix(m); }

    // Reverb (Galactic3 parameters)
    void setReverbReplace(float r) { reverb.setReplace(r); }      // Replace (regeneration/feedback)
    void setReverbBrightness(float b) { reverb.setBrightness(b); } // Brightness (lowpass filter)
    void setReverbDetune(float d) { reverb.setDetune(d); }        // Detune (vibrato/drift)
    void setReverbBigness(float b) { reverb.setBigness(b); }      // Bigness (undersampling)
    void setReverbSize(float s) { reverb.setSize(s); }            // Size (delay network scaling)
    void setReverbMix(float m) { reverb.setMix(m); }              // Mix (dry/wet)

    // Compressor
    void setCompThreshold(float db) { compressor.setThreshold(db); }
    void setCompRatio(float r) { compressor.setRatio(r); }
    void setCompAttack(float ms) { compressor.setAttack(ms); }
    void setCompRelease(float ms) { compressor.setRelease(ms); }
    void setCompMakeup(float db) { compressor.setMakeupGain(db); }
    void setCompMix(float m) { compressor.setMix(m); }

    // Sequencers (dual - one per oscillator)
    void setSeqEnabled(bool enabled) { seqEnabled = enabled; }
    void setSeqBPM(float bpm) { sequencer1.setBPM(bpm); sequencer2.setBPM(bpm); }

    // Sequencer 1 (controls Osc 1)
    void setSeq1Division(int divIdx) { sequencer1.setDivisionIndex(divIdx); }
    void setSeq1StepPitch(int step, int midiNote) { sequencer1.setStepPitch(step, midiNote); }
    void setSeq1StepGate(int step, bool gate) { sequencer1.setStepGate(step, gate); }
    int getSeq1CurrentStep() const { return sequencer1.getCurrentStep(); }
    int getSeq1StepPitch(int step) const { return sequencer1.getStepPitch(step); }
    bool getSeq1StepGate(int step) const { return sequencer1.getStepGate(step); }

    // Sequencer 2 (controls Osc 2)
    void setSeq2Division(int divIdx) { sequencer2.setDivisionIndex(divIdx); }
    void setSeq2StepPitch(int step, int midiNote) { sequencer2.setStepPitch(step, midiNote); }
    void setSeq2StepGate(int step, bool gate) { sequencer2.setStepGate(step, gate); }
    int getSeq2CurrentStep() const { return sequencer2.getCurrentStep(); }
    int getSeq2StepPitch(int step) const { return sequencer2.getStepPitch(step); }
    bool getSeq2StepGate(int step) const { return sequencer2.getStepGate(step); }

    // Voice to Loop FM
    void setVoiceLoopFM(float amount) { voiceLoopFM = std::clamp(amount, 0.0f, 1.0f); }

    // ADSR Envelopes (per oscillator)
    void setOsc1Attack(float ms) { osc1Attack = ms; osc1ADSR.setAttack(ms); }
    void setOsc1Decay(float ms) { osc1Decay = ms; osc1ADSR.setDecay(ms); }
    void setOsc1Sustain(float level) { osc1Sustain = level; osc1ADSR.setSustain(level); }
    void setOsc1Release(float ms) { osc1Release = ms; osc1ADSR.setRelease(ms); }

    void setOsc2Attack(float ms) { osc2Attack = ms; osc2ADSR.setAttack(ms); }
    void setOsc2Decay(float ms) { osc2Decay = ms; osc2ADSR.setDecay(ms); }
    void setOsc2Sustain(float level) { osc2Sustain = level; osc2ADSR.setSustain(level); }
    void setOsc2Release(float ms) { osc2Release = ms; osc2ADSR.setRelease(ms); }

    // Pan LFO
    void setPanSpeed(float hz) { panSpeed = hz; panLFO.setRate(hz); }
    void setPanDepth(float depth) { panDepth = std::clamp(depth, 0.0f, 1.0f); }

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

    // Tape Model Selection
    int tapeModel = 3;  // 0=bypass, 1=TapeDust, 2=Airwindows, 3=both
    float tapeDrive = 0.5f;  // Airwindows input gain (0.5 = 0dB)
    float tapeBump = 0.0f;   // Airwindows head bump

    // Tape Character LFO
    SimpleLFO tapeCharLFO;
    float lfoDepth = 0.0f;
    int lfoTarget = 0;  // 0=saturation, 1=age, 2=wobble, 3=degrade

    //==========================================================================
    // Sequencers (dual - one per oscillator)
    //==========================================================================

    StepSequencer sequencer1;  // Controls Osc 1
    StepSequencer sequencer2;  // Controls Osc 2
    bool seqEnabled = false;

    //==========================================================================
    // ADSR Envelopes (one per oscillator)
    //==========================================================================

    ADSREnvelope osc1ADSR;
    ADSREnvelope osc2ADSR;

    // ADSR parameters (in ms)
    float osc1Attack = 10.0f;
    float osc1Decay = 100.0f;
    float osc1Sustain = 0.7f;
    float osc1Release = 300.0f;

    float osc2Attack = 10.0f;
    float osc2Decay = 100.0f;
    float osc2Sustain = 0.7f;
    float osc2Release = 300.0f;

    //==========================================================================
    // Pan LFO (for stereo loop recording)
    //==========================================================================

    SimpleLFO panLFO;
    float panSpeed = 0.5f;    // Hz
    float panDepth = 0.0f;    // 0-1

    //==========================================================================
    // Voice to Loop FM
    //==========================================================================

    float voiceLoopFM = 0.0f;  // Amount of oscillator->loop FM modulation

    //==========================================================================
    // Effects
    //==========================================================================

    StereoDelay delay;
    Galactic3Reverb reverb;
    Compressor compressor;
    TapeDust tapeDust;  // Slew-dependent tape hiss
    AirwindowsTape airwindowsTape;  // Tape saturation and head bump
};
