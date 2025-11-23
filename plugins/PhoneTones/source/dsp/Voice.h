/**
 * @file Voice.h
 * @brief Phone Tones synthesizer voice - DTMF, dial tones, and telephone sounds
 *
 * Features:
 * - Dual sine oscillators for DTMF/dial tones
 * - Noise generator for line static
 * - Bandpass filter for telephone frequency response (300-3400 Hz)
 * - Pattern generator for automated tone sequences
 *
 * Signal Flow:
 *   [Osc1 + Osc2 + Noise] -> Bandpass Filter -> Drive -> Amp Envelope -> Output
 */

#pragma once

#include <cmath>
#include <array>
#include <algorithm>
#include <random>

/**
 * @brief Tone mode presets
 */
enum class ToneMode
{
    Dial = 0,      // US dial tone (350 + 440 Hz)
    Busy = 1,      // Busy signal (480 + 620 Hz)
    Ring = 2,      // Ring tone (440 + 480 Hz)
    DTMF = 3,      // DTMF (custom frequencies)
    Modem = 4,     // Modem-like (sweep)
    Custom = 5     // User-defined frequencies
};

/**
 * @brief DTMF frequency lookup tables
 */
namespace DTMFFrequencies
{
    // Low frequency group
    constexpr float LOW_697  = 697.0f;
    constexpr float LOW_770  = 770.0f;
    constexpr float LOW_852  = 852.0f;
    constexpr float LOW_941  = 941.0f;

    // High frequency group
    constexpr float HIGH_1209 = 1209.0f;
    constexpr float HIGH_1336 = 1336.0f;
    constexpr float HIGH_1477 = 1477.0f;
    constexpr float HIGH_1633 = 1633.0f;
}

/**
 * @brief Single synthesizer voice for Phone Tones
 */
class Voice
{
public:
    static constexpr int BLOCK_SIZE = 32;
    static constexpr float PI = 3.14159265359f;
    static constexpr float TWO_PI = 6.28318530718f;

    Voice() : rng(std::random_device{}()) {}
    ~Voice() = default;

    //==========================================================================
    // Initialization
    //==========================================================================

    void prepare(double sr)
    {
        sampleRate = sr;
        phase1 = 0.0f;
        phase2 = 0.0f;
        patternPhase = 0.0f;
        envLevel = 0.0f;
        envStage = EnvStage::Idle;

        // Initialize filter coefficients for telephone bandpass
        updateFilterCoefficients();
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

        // Reset oscillator phases
        phase1 = 0.0f;
        phase2 = 0.0f;
        patternPhase = 0.0f;

        // Modem mode: start sweep
        modemSweepPhase = 0.0f;

        // Start envelope
        envStage = EnvStage::Attack;
        envLevel = 0.0f;
    }

    void noteOff()
    {
        releasing = true;
        envStage = EnvStage::Release;
    }

    void kill()
    {
        active = false;
        releasing = false;
        currentNote = -1;
        envStage = EnvStage::Idle;
        envLevel = 0.0f;
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

    void setToneMode(int mode) { toneMode = static_cast<ToneMode>(std::clamp(mode, 0, 5)); }
    void setTone1Freq(float freq) { tone1Freq = std::clamp(freq, 200.0f, 2000.0f); }
    void setTone2Freq(float freq) { tone2Freq = std::clamp(freq, 200.0f, 2000.0f); }
    void setToneMix(float mix) { toneMix = std::clamp(mix, 0.0f, 1.0f); }
    void setFilterLow(float freq) { filterLowFreq = std::clamp(freq, 200.0f, 500.0f); updateFilterCoefficients(); }
    void setFilterHigh(float freq) { filterHighFreq = std::clamp(freq, 2500.0f, 4000.0f); updateFilterCoefficients(); }
    void setFilterDrive(float drv) { filterDrive = std::clamp(drv, 0.0f, 1.0f); }
    void setNoiseLevel(float level) { noiseLevel = std::clamp(level, 0.0f, 1.0f); }
    void setNoiseCrackle(float crackle) { noiseCrackle = std::clamp(crackle, 0.0f, 1.0f); }
    void setPatternRate(float rate) { patternRate = std::clamp(rate, 0.1f, 10.0f); }
    void setPatternDuty(float duty) { patternDuty = std::clamp(duty, 0.0f, 1.0f); }
    void setAttack(float seconds) { attackTime = std::max(0.001f, seconds); }
    void setDecay(float seconds) { decayTime = std::max(0.001f, seconds); }
    void setSustain(float level) { sustainLevel = std::clamp(level, 0.0f, 1.0f); }
    void setRelease(float seconds) { releaseTime = std::max(0.001f, seconds); }
    void setMasterLevel(float level) { masterLevel = level; }

private:
    //==========================================================================
    // Envelope Stages
    //==========================================================================

    enum class EnvStage
    {
        Idle,
        Attack,
        Decay,
        Sustain,
        Release
    };

    //==========================================================================
    // Get frequencies based on tone mode
    //==========================================================================

    void getFrequencies(float& freq1, float& freq2)
    {
        switch (toneMode)
        {
            case ToneMode::Dial:
                // US dial tone
                freq1 = 350.0f;
                freq2 = 440.0f;
                break;
            case ToneMode::Busy:
                // US busy signal
                freq1 = 480.0f;
                freq2 = 620.0f;
                break;
            case ToneMode::Ring:
                // US ring tone
                freq1 = 440.0f;
                freq2 = 480.0f;
                break;
            case ToneMode::DTMF:
                // Use DTMF frequencies based on note
                getDTMFFrequencies(freq1, freq2);
                break;
            case ToneMode::Modem:
                // Modem-like sweep
                freq1 = 300.0f + modemSweepPhase * 2000.0f;
                freq2 = freq1 * 1.5f;
                break;
            case ToneMode::Custom:
            default:
                freq1 = tone1Freq;
                freq2 = tone2Freq;
                break;
        }
    }

    void getDTMFFrequencies(float& freq1, float& freq2)
    {
        // Map MIDI notes to DTMF tones (starting at C3 = note 48)
        int dtmfKey = (currentNote - 48) % 16;

        // Low frequency (rows)
        const float lowFreqs[] = {
            DTMFFrequencies::LOW_697, DTMFFrequencies::LOW_697, DTMFFrequencies::LOW_697, DTMFFrequencies::LOW_697,
            DTMFFrequencies::LOW_770, DTMFFrequencies::LOW_770, DTMFFrequencies::LOW_770, DTMFFrequencies::LOW_770,
            DTMFFrequencies::LOW_852, DTMFFrequencies::LOW_852, DTMFFrequencies::LOW_852, DTMFFrequencies::LOW_852,
            DTMFFrequencies::LOW_941, DTMFFrequencies::LOW_941, DTMFFrequencies::LOW_941, DTMFFrequencies::LOW_941
        };

        // High frequency (columns)
        const float highFreqs[] = {
            DTMFFrequencies::HIGH_1209, DTMFFrequencies::HIGH_1336, DTMFFrequencies::HIGH_1477, DTMFFrequencies::HIGH_1633,
            DTMFFrequencies::HIGH_1209, DTMFFrequencies::HIGH_1336, DTMFFrequencies::HIGH_1477, DTMFFrequencies::HIGH_1633,
            DTMFFrequencies::HIGH_1209, DTMFFrequencies::HIGH_1336, DTMFFrequencies::HIGH_1477, DTMFFrequencies::HIGH_1633,
            DTMFFrequencies::HIGH_1209, DTMFFrequencies::HIGH_1336, DTMFFrequencies::HIGH_1477, DTMFFrequencies::HIGH_1633
        };

        int index = std::clamp(dtmfKey, 0, 15);
        freq1 = lowFreqs[index];
        freq2 = highFreqs[index];
    }

    //==========================================================================
    // Block Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        float freq1, freq2;
        getFrequencies(freq1, freq2);

        float phaseInc1 = freq1 / static_cast<float>(sampleRate);
        float phaseInc2 = freq2 / static_cast<float>(sampleRate);
        float patternInc = patternRate / static_cast<float>(sampleRate);

        for (int i = 0; i < blockSize; ++i)
        {
            // ================================================================
            // PATTERN GENERATOR (for busy/ring cadence)
            // ================================================================
            float patternGate = 1.0f;
            if (toneMode == ToneMode::Busy || toneMode == ToneMode::Ring)
            {
                patternGate = (patternPhase < patternDuty) ? 1.0f : 0.0f;
                patternPhase += patternInc;
                if (patternPhase >= 1.0f)
                    patternPhase -= 1.0f;
            }

            // ================================================================
            // DUAL SINE OSCILLATORS
            // ================================================================
            float osc1 = std::sin(phase1 * TWO_PI);
            float osc2 = std::sin(phase2 * TWO_PI);

            phase1 += phaseInc1;
            phase2 += phaseInc2;

            if (phase1 >= 1.0f) phase1 -= 1.0f;
            if (phase2 >= 1.0f) phase2 -= 1.0f;

            // Mix oscillators based on toneMix
            float toneOut = osc1 * (1.0f - toneMix) + osc2 * toneMix;
            toneOut *= patternGate;

            // ================================================================
            // NOISE GENERATOR (line static)
            // ================================================================
            float noise = 0.0f;
            if (noiseLevel > 0.0f)
            {
                // Base white noise
                float whiteNoise = noiseDist(rng);

                // Crackle: occasional pops
                float crackle = 0.0f;
                if (noiseCrackle > 0.0f)
                {
                    float crackleProb = noiseCrackle * 0.001f;
                    if (crackleDist(rng) < crackleProb)
                    {
                        crackle = (crackleDist(rng) > 0.5f ? 1.0f : -1.0f) * 0.5f;
                    }
                }

                noise = (whiteNoise * 0.1f + crackle) * noiseLevel;
            }

            // ================================================================
            // MIX TONES AND NOISE
            // ================================================================
            float mixOut = toneOut * 0.7f + noise;

            // ================================================================
            // TELEPHONE BANDPASS FILTER (simple 2-pole approximation)
            // ================================================================
            float filtered = processBandpassFilter(mixOut);

            // ================================================================
            // DRIVE / SOFT SATURATION
            // ================================================================
            if (filterDrive > 0.0f)
            {
                float driveAmount = 1.0f + filterDrive * 3.0f;
                filtered = std::tanh(filtered * driveAmount) / driveAmount;
            }

            // ================================================================
            // MODEM SWEEP (update sweep phase)
            // ================================================================
            if (toneMode == ToneMode::Modem)
            {
                modemSweepPhase += 0.00001f; // Slow sweep
                if (modemSweepPhase >= 1.0f)
                    modemSweepPhase = 0.0f;
            }

            // ================================================================
            // AMPLITUDE ENVELOPE (ADSR)
            // ================================================================
            float envOut = processEnvelope();

            if (envOut <= 0.0f && envStage == EnvStage::Idle)
            {
                active = false;
                return;
            }

            // ================================================================
            // OUTPUT
            // ================================================================
            float output = filtered * envOut * velocity * masterLevel;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    //==========================================================================
    // Bandpass Filter (simple biquad approximation)
    //==========================================================================

    void updateFilterCoefficients()
    {
        // Calculate center frequency and bandwidth
        float centerFreq = std::sqrt(filterLowFreq * filterHighFreq);
        float bandwidth = filterHighFreq - filterLowFreq;
        float Q = centerFreq / bandwidth;

        // Biquad bandpass coefficients
        float omega = TWO_PI * centerFreq / static_cast<float>(sampleRate);
        float sinOmega = std::sin(omega);
        float cosOmega = std::cos(omega);
        float alpha = sinOmega / (2.0f * Q);

        float a0 = 1.0f + alpha;
        bpB0 = alpha / a0;
        bpB1 = 0.0f;
        bpB2 = -alpha / a0;
        bpA1 = -2.0f * cosOmega / a0;
        bpA2 = (1.0f - alpha) / a0;
    }

    float processBandpassFilter(float input)
    {
        float output = bpB0 * input + bpB1 * bpX1 + bpB2 * bpX2 - bpA1 * bpY1 - bpA2 * bpY2;

        bpX2 = bpX1;
        bpX1 = input;
        bpY2 = bpY1;
        bpY1 = output;

        return output;
    }

    //==========================================================================
    // ADSR Envelope
    //==========================================================================

    float processEnvelope()
    {
        float rate = 1.0f / static_cast<float>(sampleRate);

        switch (envStage)
        {
            case EnvStage::Attack:
            {
                float attackRate = rate / attackTime;
                envLevel += attackRate;
                if (envLevel >= 1.0f)
                {
                    envLevel = 1.0f;
                    envStage = EnvStage::Decay;
                }
                break;
            }

            case EnvStage::Decay:
            {
                float decayRate = rate / decayTime;
                envLevel -= decayRate;
                if (envLevel <= sustainLevel)
                {
                    envLevel = sustainLevel;
                    envStage = EnvStage::Sustain;
                }
                break;
            }

            case EnvStage::Sustain:
                envLevel = sustainLevel;
                break;

            case EnvStage::Release:
            {
                float releaseRate = rate / releaseTime;
                envLevel -= releaseRate;
                if (envLevel <= 0.0f)
                {
                    envLevel = 0.0f;
                    envStage = EnvStage::Idle;
                    active = false;
                }
                break;
            }

            case EnvStage::Idle:
            default:
                envLevel = 0.0f;
                break;
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
    int age = 0;

    //==========================================================================
    // DSP State
    //==========================================================================

    double sampleRate = 44100.0;

    // Oscillator phases
    float phase1 = 0.0f;
    float phase2 = 0.0f;
    float patternPhase = 0.0f;
    float modemSweepPhase = 0.0f;

    // Envelope state
    EnvStage envStage = EnvStage::Idle;
    float envLevel = 0.0f;

    // Bandpass filter state
    float bpX1 = 0.0f, bpX2 = 0.0f;
    float bpY1 = 0.0f, bpY2 = 0.0f;
    float bpB0 = 0.0f, bpB1 = 0.0f, bpB2 = 0.0f;
    float bpA1 = 0.0f, bpA2 = 0.0f;

    // Random number generator for noise
    std::mt19937 rng;
    std::uniform_real_distribution<float> noiseDist{-1.0f, 1.0f};
    std::uniform_real_distribution<float> crackleDist{0.0f, 1.0f};

    //==========================================================================
    // Parameters
    //==========================================================================

    ToneMode toneMode = ToneMode::Dial;
    float tone1Freq = 440.0f;
    float tone2Freq = 480.0f;
    float toneMix = 0.5f;
    float filterLowFreq = 300.0f;
    float filterHighFreq = 3400.0f;
    float filterDrive = 0.2f;
    float noiseLevel = 0.1f;
    float noiseCrackle = 0.1f;
    float patternRate = 2.0f;
    float patternDuty = 0.5f;

    // ADSR parameters
    float attackTime = 0.005f;
    float decayTime = 0.1f;
    float sustainLevel = 1.0f;
    float releaseTime = 0.05f;

    float masterLevel = 0.8f;
};
