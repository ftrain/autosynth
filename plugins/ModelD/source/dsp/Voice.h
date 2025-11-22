/**
 * @file Voice.h
 * @brief Model D Voice - Minimoog-inspired synthesizer voice
 *
 * Signal Flow (based on Minimoog Model D):
 *   OSC1 ─┬─> Mixer ──> Ladder Filter ──> VCA ──> Output
 *   OSC2 ─┤            (24dB/oct LPF)    (Amp Env)
 *   OSC3 ─┤
 *   Noise─┘
 *           Filter Env ─> Filter Cutoff Modulation
 *
 * Features:
 *   - 3 oscillators with saw, triangle, pulse waveforms
 *   - Oscillator sync (OSC2 synced to OSC1)
 *   - 4-pole ladder filter with resonance
 *   - Filter and Amplitude ADSR envelopes
 *   - Filter keyboard tracking
 */

#pragma once

#include <cmath>
#include <array>
#include <algorithm>

// Constants
static constexpr float PI = 3.14159265358979323846f;
static constexpr float TWO_PI = 2.0f * PI;

/**
 * @brief Simple ADSR Envelope Generator
 */
class ADSREnvelope
{
public:
    enum class Stage { Idle, Attack, Decay, Sustain, Release };

    void setSampleRate(float sr) { sampleRate = sr; }

    void setADSR(float a, float d, float s, float r)
    {
        // Convert times to rates (seconds to samples)
        attackRate = 1.0f / std::max(0.001f, a * sampleRate);
        decayRate = 1.0f / std::max(0.001f, d * sampleRate);
        sustainLevel = std::clamp(s, 0.0f, 1.0f);
        releaseRate = 1.0f / std::max(0.001f, r * sampleRate);
    }

    void trigger()
    {
        stage = Stage::Attack;
        // Don't reset level for legato-style retriggering
    }

    void release()
    {
        if (stage != Stage::Idle)
            stage = Stage::Release;
    }

    void reset()
    {
        stage = Stage::Idle;
        level = 0.0f;
    }

    float process()
    {
        switch (stage)
        {
        case Stage::Attack:
            level += attackRate;
            if (level >= 1.0f)
            {
                level = 1.0f;
                stage = Stage::Decay;
            }
            break;

        case Stage::Decay:
            level -= decayRate;
            if (level <= sustainLevel)
            {
                level = sustainLevel;
                stage = Stage::Sustain;
            }
            break;

        case Stage::Sustain:
            level = sustainLevel;
            break;

        case Stage::Release:
            level -= releaseRate;
            if (level <= 0.0f)
            {
                level = 0.0f;
                stage = Stage::Idle;
            }
            break;

        case Stage::Idle:
        default:
            level = 0.0f;
            break;
        }

        return level;
    }

    bool isActive() const { return stage != Stage::Idle; }
    float getLevel() const { return level; }
    Stage getStage() const { return stage; }

private:
    float sampleRate = 44100.0f;
    float attackRate = 0.001f;
    float decayRate = 0.001f;
    float sustainLevel = 0.7f;
    float releaseRate = 0.001f;
    float level = 0.0f;
    Stage stage = Stage::Idle;
};

/**
 * @brief Oscillator with multiple waveforms
 */
class Oscillator
{
public:
    enum class Waveform { Saw, Triangle, Pulse, Sine };

    void setSampleRate(float sr) { sampleRate = sr; }

    void setFrequency(float freq)
    {
        frequency = freq;
        phaseIncrement = frequency / sampleRate;
    }

    void setWaveform(Waveform wf) { waveform = wf; }
    void setPulseWidth(float pw) { pulseWidth = std::clamp(pw, 0.1f, 0.9f); }
    void setLevel(float l) { level = l; }

    void reset() { phase = 0.0f; }

    // Sync to another oscillator (hard sync)
    void sync() { phase = 0.0f; }

    float process()
    {
        float output = 0.0f;

        switch (waveform)
        {
        case Waveform::Saw:
            // Polyblep sawtooth for reduced aliasing
            output = 2.0f * phase - 1.0f;
            output -= polyBlep(phase, phaseIncrement);
            break;

        case Waveform::Triangle:
            // Triangle from integrated square
            output = phase < 0.5f
                ? 4.0f * phase - 1.0f
                : 3.0f - 4.0f * phase;
            break;

        case Waveform::Pulse:
            // Polyblep pulse wave
            output = phase < pulseWidth ? 1.0f : -1.0f;
            output += polyBlep(phase, phaseIncrement);
            output -= polyBlep(std::fmod(phase + 1.0f - pulseWidth, 1.0f), phaseIncrement);
            break;

        case Waveform::Sine:
            output = std::sin(TWO_PI * phase);
            break;
        }

        // Advance phase
        phase += phaseIncrement;
        if (phase >= 1.0f)
            phase -= 1.0f;

        return output * level;
    }

    float getPhase() const { return phase; }

private:
    // PolyBLEP to reduce aliasing
    float polyBlep(float t, float dt)
    {
        if (t < dt)
        {
            t /= dt;
            return t + t - t * t - 1.0f;
        }
        else if (t > 1.0f - dt)
        {
            t = (t - 1.0f) / dt;
            return t * t + t + t + 1.0f;
        }
        return 0.0f;
    }

    float sampleRate = 44100.0f;
    float frequency = 440.0f;
    float phase = 0.0f;
    float phaseIncrement = 0.01f;
    float pulseWidth = 0.5f;
    float level = 1.0f;
    Waveform waveform = Waveform::Saw;
};

/**
 * @brief Moog-style 4-pole ladder filter (24dB/octave)
 *
 * Based on the classic transistor ladder topology with
 * 4 cascaded 1-pole filters and feedback for resonance.
 */
class LadderFilter
{
public:
    void setSampleRate(float sr)
    {
        sampleRate = sr;
        // Reset state
        std::fill(stage.begin(), stage.end(), 0.0f);
    }

    void setCutoff(float freq)
    {
        // Clamp to safe range
        cutoffFreq = std::clamp(freq, 20.0f, sampleRate * 0.45f);

        // Calculate coefficient using tan approximation for stability
        float wc = TWO_PI * cutoffFreq / sampleRate;
        g = 0.9892f * wc - 0.4342f * wc * wc + 0.1381f * wc * wc * wc - 0.0202f * wc * wc * wc * wc;
        g = std::clamp(g, 0.0f, 1.0f);
    }

    void setResonance(float res)
    {
        // Resonance 0-1 maps to feedback 0-4
        // Self-oscillation starts around 3.8
        resonance = std::clamp(res, 0.0f, 1.0f);
        k = 4.0f * resonance;
    }

    float process(float input)
    {
        // Feedback from output (4th stage)
        float feedback = k * stage[3];

        // Input with feedback subtracted (inverted ladder topology)
        float u = input - feedback;

        // Soft clip the input to prevent runaway with high resonance
        u = std::tanh(u);

        // Four cascaded 1-pole lowpass stages
        for (int i = 0; i < 4; ++i)
        {
            float v = (u - stage[i]) * g;
            float y = v + stage[i];
            stage[i] = y + v;  // Trapezoidal integration
            u = y;
        }

        return stage[3];
    }

    void reset()
    {
        std::fill(stage.begin(), stage.end(), 0.0f);
    }

private:
    float sampleRate = 44100.0f;
    float cutoffFreq = 5000.0f;
    float resonance = 0.0f;
    float g = 0.5f;  // Filter coefficient
    float k = 0.0f;  // Feedback amount

    std::array<float, 4> stage{};  // 4 filter stages
};

/**
 * @brief Model D Voice - Complete Minimoog-inspired voice
 */
class Voice
{
public:
    static constexpr int NUM_OSCILLATORS = 3;

    Voice() = default;
    ~Voice() = default;

    void prepare(double sr)
    {
        sampleRate = static_cast<float>(sr);

        for (auto& osc : oscillators)
            osc.setSampleRate(sampleRate);

        filter.setSampleRate(sampleRate);
        ampEnv.setSampleRate(sampleRate);
        filterEnv.setSampleRate(sampleRate);

        // Default envelope settings (Minimoog-like)
        ampEnv.setADSR(0.01f, 0.1f, 0.7f, 0.3f);
        filterEnv.setADSR(0.01f, 0.2f, 0.5f, 0.3f);
    }

    void noteOn(int note, float vel)
    {
        currentNote = note;
        velocity = vel;
        active = true;
        releasing = false;
        age = 0;

        // Calculate base frequency from MIDI note
        float baseFreq = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);

        // Set oscillator frequencies with octave/detune
        oscillators[0].setFrequency(baseFreq * osc1OctaveMultiplier);
        oscillators[1].setFrequency(baseFreq * osc2OctaveMultiplier * osc2Detune);
        oscillators[2].setFrequency(baseFreq * osc3OctaveMultiplier * osc3Detune);

        // Calculate keyboard tracking for filter
        keyboardTrackingFreq = baseFreq;

        // Trigger envelopes
        ampEnv.trigger();
        filterEnv.trigger();

        // Reset oscillator phases for consistent attack
        for (auto& osc : oscillators)
            osc.reset();

        filter.reset();
    }

    void noteOff()
    {
        releasing = true;
        ampEnv.release();
        filterEnv.release();
    }

    void kill()
    {
        active = false;
        releasing = false;
        currentNote = -1;
        ampEnv.reset();
        filterEnv.reset();
    }

    void render(float* outputL, float* outputR, int numSamples)
    {
        if (!active)
            return;

        ++age;

        for (int i = 0; i < numSamples; ++i)
        {
            // Process oscillators
            float osc1Out = oscillators[0].process();
            float osc2Out = oscillators[1].process();
            float osc3Out = oscillators[2].process();

            // OSC2 sync to OSC1 (optional)
            if (osc2Sync && oscillators[0].getPhase() < 0.01f)
                oscillators[1].sync();

            // Mix oscillators + noise
            float mix = osc1Out * osc1Level
                      + osc2Out * osc2Level
                      + osc3Out * osc3Level
                      + noise() * noiseLevel;

            // Filter envelope modulation
            float filterEnvOut = filterEnv.process();
            float modCutoff;

            if (filterEnvAmount >= 0.0f) {
                // Positive: envelope opens filter (sweep up from base)
                modCutoff = filterCutoff + filterEnvAmount * filterEnvOut * 10000.0f;
            } else {
                // Negative: inverted - filter starts open, closes at envelope peak
                // At env=0: cutoff = base + |amt| * 10000 (bright)
                // At env=1: cutoff = base (dark)
                modCutoff = filterCutoff + std::abs(filterEnvAmount) * (1.0f - filterEnvOut) * 10000.0f;
            }

            // Keyboard tracking
            if (filterKeyboardTracking > 0.0f)
            {
                modCutoff += (keyboardTrackingFreq - 261.63f) * filterKeyboardTracking;
            }

            filter.setCutoff(modCutoff);
            filter.setResonance(filterResonance);

            // Apply filter
            float filtered = filter.process(mix);

            // Amp envelope
            float ampEnvOut = ampEnv.process();

            // Check if voice has finished
            if (!ampEnv.isActive())
            {
                active = false;
                return;
            }

            // Final output
            float output = filtered * ampEnvOut * velocity * masterLevel;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    // State accessors
    bool isActive() const { return active; }
    bool isReleasing() const { return releasing; }
    int getNote() const { return currentNote; }
    float getVelocity() const { return velocity; }
    int getAge() const { return age; }

    // =========================================================================
    // Parameter Setters
    // =========================================================================

    // Oscillator 1
    void setOsc1Waveform(Oscillator::Waveform wf) { oscillators[0].setWaveform(wf); }
    void setOsc1Octave(int oct) { osc1OctaveMultiplier = std::pow(2.0f, oct); }
    void setOsc1Level(float l) { osc1Level = l; }

    // Oscillator 2
    void setOsc2Waveform(Oscillator::Waveform wf) { oscillators[1].setWaveform(wf); }
    void setOsc2Octave(int oct) { osc2OctaveMultiplier = std::pow(2.0f, oct); }
    void setOsc2Detune(float cents) { osc2Detune = std::pow(2.0f, cents / 1200.0f); }
    void setOsc2Level(float l) { osc2Level = l; }
    void setOsc2Sync(bool sync) { osc2Sync = sync; }

    // Oscillator 3
    void setOsc3Waveform(Oscillator::Waveform wf) { oscillators[2].setWaveform(wf); }
    void setOsc3Octave(int oct) { osc3OctaveMultiplier = std::pow(2.0f, oct); }
    void setOsc3Detune(float cents) { osc3Detune = std::pow(2.0f, cents / 1200.0f); }
    void setOsc3Level(float l) { osc3Level = l; }

    // Noise
    void setNoiseLevel(float l) { noiseLevel = l; }

    // Filter
    void setFilterCutoff(float freq) { filterCutoff = freq; }
    void setFilterResonance(float res) { filterResonance = res; }
    void setFilterEnvAmount(float amt) { filterEnvAmount = amt; }
    void setFilterKeyboardTracking(float amt) { filterKeyboardTracking = amt; }

    // Amp Envelope
    void setAmpAttack(float t) { ampAttack = t; updateAmpEnv(); }
    void setAmpDecay(float t) { ampDecay = t; updateAmpEnv(); }
    void setAmpSustain(float l) { ampSustain = l; updateAmpEnv(); }
    void setAmpRelease(float t) { ampRelease = t; updateAmpEnv(); }

    // Filter Envelope
    void setFilterAttack(float t) { filterAttackTime = t; updateFilterEnv(); }
    void setFilterDecay(float t) { filterDecayTime = t; updateFilterEnv(); }
    void setFilterSustain(float l) { filterSustainLevel = l; updateFilterEnv(); }
    void setFilterRelease(float t) { filterReleaseTime = t; updateFilterEnv(); }

    // Master
    void setMasterLevel(float l) { masterLevel = l; }

private:
    void updateAmpEnv()
    {
        ampEnv.setADSR(ampAttack, ampDecay, ampSustain, ampRelease);
    }

    void updateFilterEnv()
    {
        filterEnv.setADSR(filterAttackTime, filterDecayTime, filterSustainLevel, filterReleaseTime);
    }

    float noise()
    {
        // Simple white noise generator
        noiseState = noiseState * 1664525u + 1013904223u;
        return (static_cast<float>(noiseState) / 2147483648.0f) - 1.0f;
    }

    // Voice state
    bool active = false;
    bool releasing = false;
    int currentNote = -1;
    float velocity = 0.0f;
    int age = 0;

    float sampleRate = 44100.0f;

    // Oscillators
    std::array<Oscillator, NUM_OSCILLATORS> oscillators;

    // Oscillator parameters
    float osc1OctaveMultiplier = 1.0f;
    float osc1Level = 1.0f;

    float osc2OctaveMultiplier = 1.0f;
    float osc2Detune = 1.0f;
    float osc2Level = 1.0f;
    bool osc2Sync = false;

    float osc3OctaveMultiplier = 1.0f;
    float osc3Detune = 1.0f;
    float osc3Level = 0.0f;

    float noiseLevel = 0.0f;
    uint32_t noiseState = 12345;

    // Filter
    LadderFilter filter;
    float filterCutoff = 5000.0f;
    float filterResonance = 0.0f;
    float filterEnvAmount = 0.5f;
    float filterKeyboardTracking = 0.0f;
    float keyboardTrackingFreq = 261.63f;

    // Envelopes
    ADSREnvelope ampEnv;
    ADSREnvelope filterEnv;

    // Envelope parameters
    float ampAttack = 0.01f;
    float ampDecay = 0.1f;
    float ampSustain = 0.7f;
    float ampRelease = 0.3f;

    float filterAttackTime = 0.01f;
    float filterDecayTime = 0.2f;
    float filterSustainLevel = 0.5f;
    float filterReleaseTime = 0.3f;

    float masterLevel = 0.5f;
};
