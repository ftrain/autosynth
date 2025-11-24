/**
 * @file Voice.h
 * @brief Single synthesizer voice for A111-5 Mini Synthesizer Voice clone
 *
 * Doepfer A-111-5 features (based on manual):
 * - VCO: Triangle, Sawtooth, Pulse waveforms with PWM
 * - VCF: Multimode filter with exponential/linear FM, resonance, key tracking
 * - VCA: Amplitude control with ADSR and LFO1 modulation
 * - LFO1: Modulates VCO pitch (FM) and VCA (AM)
 * - LFO2: Modulates VCO pulse width (PWM) and VCF cutoff
 * - ADSR: Controls VCA and can modulate VCF
 *
 * Signal Flow (per A-111-5 diagram):
 *   VCO (with LFO1 FM, LFO2 PWM) -> VCF (with LFO2/ADSR mod) -> VCA (with ADSR, LFO1 AM) -> Output
 */

#pragma once

#include <cmath>
#include <array>
#include <algorithm>

// Pi constant
static constexpr float PI_F = 3.14159265359f;
static constexpr float TWO_PI_F = 6.28318530718f;

/**
 * @brief Waveform types for the main oscillator
 * A-111-5 has Triangle, Sawtooth (rising), and Pulse
 */
enum class Waveform
{
    Triangle = 0,
    Saw = 1,
    Pulse = 2
};

/**
 * @brief LFO waveform types
 * A-111-5 LFOs have Triangle and Pulse (square)
 */
enum class LFOWaveform
{
    Triangle = 0,
    Pulse = 1,
    Off = 2  // Performance feature to disable LFO
};

/**
 * @brief LFO frequency range
 * A-111-5 has low/medium/high ranges, with high reaching audio rate (~5kHz)
 */
enum class LFORange
{
    Low = 0,     // 0.05 - 5 Hz
    Medium = 1,  // 0.5 - 50 Hz
    High = 2     // 5 - 5000 Hz (audio rate!)
};

/**
 * @brief Modulation source selection for VCO FM
 */
enum class VCOFMSource
{
    Off = 0,
    LFO1 = 1,
    ADSR = 2
};

/**
 * @brief Modulation source selection for VCO PWM
 */
enum class VCOPWMSource
{
    Off = 0,
    LFO2 = 1,
    ADSR = 2
};

/**
 * @brief Modulation source selection for VCF
 */
enum class VCFModSource
{
    Off = 0,
    LFO2 = 1,
    ADSR = 2
};

/**
 * @brief Modulation source selection for VCA
 */
enum class VCAModSource
{
    Off = 0,
    LFO1 = 1,
    ADSR = 2
};

/**
 * @brief VCF keyboard tracking amount
 */
enum class VCFTracking
{
    Off = 0,
    Half = 1,
    Full = 2
};

/**
 * @brief Simple LFO class
 */
class LFO
{
public:
    void prepare(double sr) { sampleRate = sr; }

    void setFrequency(float freq) { frequency = freq; }
    void setWaveform(LFOWaveform wf) { waveform = wf; }
    void setRange(LFORange r) { range = r; }

    // Get frequency adjusted for range
    float getActualFrequency() const
    {
        float minFreq, maxFreq;
        switch (range)
        {
            case LFORange::Low:    minFreq = 0.05f; maxFreq = 5.0f; break;
            case LFORange::Medium: minFreq = 0.5f;  maxFreq = 50.0f; break;
            case LFORange::High:   minFreq = 5.0f;  maxFreq = 5000.0f; break;
            default:               minFreq = 0.05f; maxFreq = 5.0f; break;
        }
        return minFreq + frequency * (maxFreq - minFreq);
    }

    float process()
    {
        if (waveform == LFOWaveform::Off)
            return 0.0f;

        float actualFreq = getActualFrequency();
        float phaseInc = actualFreq / static_cast<float>(sampleRate);

        float output = 0.0f;
        switch (waveform)
        {
            case LFOWaveform::Triangle:
                // Triangle: -1 to +1
                output = 4.0f * std::abs(phase - 0.5f) - 1.0f;
                break;

            case LFOWaveform::Pulse:
                // Square/Pulse: -1 or +1
                output = phase < 0.5f ? 1.0f : -1.0f;
                break;

            default:
                output = 0.0f;
                break;
        }

        phase += phaseInc;
        if (phase >= 1.0f)
            phase -= 1.0f;

        return output;
    }

    void reset() { phase = 0.0f; }

private:
    double sampleRate = 44100.0;
    float frequency = 0.5f;  // 0-1 normalized within range
    float phase = 0.0f;
    LFOWaveform waveform = LFOWaveform::Triangle;
    LFORange range = LFORange::Low;
};

/**
 * @brief Simple state-variable filter (SVF) for VCF section
 * More versatile than pure ladder, commonly used in Doepfer modules
 */
class SVFilter
{
public:
    void prepare(double sr) { sampleRate = sr; }

    void setCutoff(float freq)
    {
        cutoffFreq = std::clamp(freq, 20.0f, 20000.0f);
        updateCoefficients();
    }

    void setResonance(float res)
    {
        resonance = std::clamp(res, 0.0f, 1.0f);
        updateCoefficients();
    }

    float processLowpass(float input)
    {
        // State-variable filter
        float hp = input - low - q * band;
        band += f * hp;
        low += f * band;
        return low;
    }

    void reset()
    {
        low = 0.0f;
        band = 0.0f;
    }

private:
    void updateCoefficients()
    {
        // Compute filter coefficient (simplified)
        f = 2.0f * std::sin(PI_F * cutoffFreq / static_cast<float>(sampleRate));
        f = std::clamp(f, 0.0f, 1.0f);

        // Q from resonance (0-1 maps to Q of 0.5 to 20)
        float qVal = 0.5f + resonance * 19.5f;
        q = 1.0f / qVal;
    }

    double sampleRate = 44100.0;
    float cutoffFreq = 1000.0f;
    float resonance = 0.0f;

    // Filter state
    float low = 0.0f;
    float band = 0.0f;
    float f = 0.1f;
    float q = 2.0f;
};

/**
 * @brief Single synthesizer voice - A-111-5 complete architecture
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
        phase = 0.0f;
        envLevel = 0.0f;
        envStage = EnvStage::Idle;

        lfo1.prepare(sr);
        lfo2.prepare(sr);
        filter.prepare(sr);
    }

    //==========================================================================
    // Note Events
    //==========================================================================

    void noteOn(int note, float vel, bool legato = false)
    {
        currentNote = note;
        velocity = vel;
        releasing = false;
        age = 0;

        // Calculate target frequency
        float targetFrequency = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);

        // Handle glide
        if (glideTime > 0.001f && baseFrequency > 0.0f)
        {
            // Glide from current frequency to target
            glideStartFreq = currentFrequency > 0.0f ? currentFrequency : targetFrequency;
            glideTargetFreq = targetFrequency;
            glideProgress = 0.0f;
        }
        else
        {
            // No glide - jump to target
            glideStartFreq = targetFrequency;
            glideTargetFreq = targetFrequency;
            glideProgress = 1.0f;
            currentFrequency = targetFrequency;
        }
        baseFrequency = targetFrequency;

        // For legato notes in mono mode when not in release, don't reset anything - just change pitch
        if (legato && monoMode && active && envStage != EnvStage::Release && envStage != EnvStage::Idle)
        {
            // Keep envelope running, keep phase, keep filter state
            return;
        }

        // If we're in release or idle, retrigger envelope from current level (no click)
        if (legato && monoMode && (envStage == EnvStage::Release || envStage == EnvStage::Idle))
        {
            // Restart attack from current level - smooth retrigger
            envStage = EnvStage::Attack;
            // envLevel stays at current value, attack will rise from there
            active = true;
            releasing = false;
            return;
        }

        // Not legato - full note trigger
        active = true;

        // Reset phase for clean attack
        phase = 0.0f;
        subPhase = 0.0f;

        // Start envelope from current level for smoother retrigger
        envStage = EnvStage::Attack;
        // Don't reset envLevel to 0 - let it rise from current position
        // This prevents clicks on fast retriggering

        // Reset filter
        filter.reset();
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
    // VCO Parameter Setters
    //==========================================================================

    void setWaveform(int wf) { waveform = static_cast<Waveform>(std::clamp(wf, 0, 2)); }
    void setTune(float semitones) { tuneOffset = semitones; }
    void setFine(float cents) { fineOffset = cents; }
    void setPulseWidth(float pw) { pulseWidth = std::clamp(pw, 0.05f, 0.95f); }
    void setSubLevel(float level) { subLevel = std::clamp(level, 0.0f, 1.0f); }
    void setGlideTime(float seconds) { glideTime = std::max(0.0f, seconds); }
    void setMonoMode(bool mono) { monoMode = mono; }

    // VCO modulation
    void setVCOFMSource(int src) { vcoFMSource = static_cast<VCOFMSource>(std::clamp(src, 0, 2)); }
    void setVCOFMAmount(float amt) { vcoFMAmount = std::clamp(amt, 0.0f, 1.0f); }
    void setVCOPWMSource(int src) { vcoPWMSource = static_cast<VCOPWMSource>(std::clamp(src, 0, 2)); }
    void setVCOPWMAmount(float amt) { vcoPWMAmount = std::clamp(amt, 0.0f, 1.0f); }

    //==========================================================================
    // VCF Parameter Setters
    //==========================================================================

    void setVCFCutoff(float freq) { vcfCutoff = std::clamp(freq, 20.0f, 20000.0f); }
    void setVCFResonance(float res) { vcfResonance = std::clamp(res, 0.0f, 1.0f); }
    void setVCFTracking(int track) { vcfTracking = static_cast<VCFTracking>(std::clamp(track, 0, 2)); }
    void setVCFModSource(int src) { vcfModSource = static_cast<VCFModSource>(std::clamp(src, 0, 2)); }
    void setVCFModAmount(float amt) { vcfModAmount = amt; }  // Can be negative for inverted envelope
    void setVCFLFMAmount(float amt) { vcfLFMAmount = std::clamp(amt, 0.0f, 1.0f); }  // Linear FM from VCO triangle

    //==========================================================================
    // VCA Parameter Setters
    //==========================================================================

    void setVCAModSource(int src) { vcaModSource = static_cast<VCAModSource>(std::clamp(src, 0, 2)); }
    void setVCAInitialLevel(float level) { vcaInitialLevel = std::clamp(level, 0.0f, 1.0f); }
    void setMasterLevel(float level) { masterLevel = std::clamp(level, 0.0f, 1.0f); }

    //==========================================================================
    // LFO Parameter Setters
    //==========================================================================

    void setLFO1Frequency(float freq) { lfo1.setFrequency(freq); }
    void setLFO1Waveform(int wf) { lfo1.setWaveform(static_cast<LFOWaveform>(std::clamp(wf, 0, 2))); }
    void setLFO1Range(int r) { lfo1.setRange(static_cast<LFORange>(std::clamp(r, 0, 2))); }

    void setLFO2Frequency(float freq) { lfo2.setFrequency(freq); }
    void setLFO2Waveform(int wf) { lfo2.setWaveform(static_cast<LFOWaveform>(std::clamp(wf, 0, 2))); }
    void setLFO2Range(int r) { lfo2.setRange(static_cast<LFORange>(std::clamp(r, 0, 2))); }

    //==========================================================================
    // ADSR Parameter Setters
    //==========================================================================

    void setAttack(float seconds) { attackTime = std::max(0.001f, seconds); }
    void setDecay(float seconds) { decayTime = std::max(0.001f, seconds); }
    void setSustain(float level) { sustainLevel = std::clamp(level, 0.0f, 1.0f); }
    void setRelease(float seconds) { releaseTime = std::max(0.001f, seconds); }

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
    // Block Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        for (int i = 0; i < blockSize; ++i)
        {
            // ================================================================
            // LFO PROCESSING
            // ================================================================
            float lfo1Out = lfo1.process();
            float lfo2Out = lfo2.process();

            // ================================================================
            // ENVELOPE PROCESSING
            // ================================================================
            float envOut = processEnvelope();

            // Check if voice has finished
            if (envOut <= 0.0f && envStage == EnvStage::Idle)
            {
                active = false;
                return;
            }

            // ================================================================
            // GLIDE PROCESSING
            // ================================================================
            if (glideProgress < 1.0f && glideTime > 0.001f)
            {
                float glideIncrement = 1.0f / (glideTime * static_cast<float>(sampleRate));
                glideProgress = std::min(1.0f, glideProgress + glideIncrement);
                // Exponential glide for more musical feel
                currentFrequency = glideStartFreq * std::pow(glideTargetFreq / glideStartFreq, glideProgress);
            }
            else
            {
                currentFrequency = glideTargetFreq;
            }

            // ================================================================
            // VCO FREQUENCY MODULATION
            // ================================================================
            float fmMod = 0.0f;
            switch (vcoFMSource)
            {
                case VCOFMSource::LFO1:
                    fmMod = lfo1Out * vcoFMAmount;
                    break;
                case VCOFMSource::ADSR:
                    fmMod = envOut * vcoFMAmount;
                    break;
                default:
                    break;
            }

            // Calculate frequency with tuning and FM (use currentFrequency for glide)
            // FM modulation in semitones (up to 24 semitones at full amount)
            float tunedFreq = currentFrequency * std::pow(2.0f,
                (tuneOffset + fineOffset / 100.0f + fmMod * 24.0f) / 12.0f);
            float phaseInc = tunedFreq / static_cast<float>(sampleRate);

            // ================================================================
            // VCO PULSE WIDTH MODULATION
            // ================================================================
            float modulatedPW = pulseWidth;
            switch (vcoPWMSource)
            {
                case VCOPWMSource::LFO2:
                    modulatedPW = pulseWidth + lfo2Out * vcoPWMAmount * 0.4f;
                    break;
                case VCOPWMSource::ADSR:
                    modulatedPW = pulseWidth + envOut * vcoPWMAmount * 0.4f;
                    break;
                default:
                    break;
            }
            modulatedPW = std::clamp(modulatedPW, 0.05f, 0.95f);

            // ================================================================
            // VCO WAVEFORM GENERATION
            // ================================================================
            float oscOut = 0.0f;
            float triOut = 0.0f;  // Always compute triangle for VCF linear FM

            // Triangle (always computed for linear FM)
            triOut = 4.0f * std::abs(phase - 0.5f) - 1.0f;

            switch (waveform)
            {
                case Waveform::Triangle:
                    oscOut = triOut;
                    break;

                case Waveform::Saw:
                    oscOut = polyBlepSaw(phase, phaseInc);
                    break;

                case Waveform::Pulse:
                    oscOut = polyBlepPulse(phase, phaseInc, modulatedPW);
                    break;
            }

            // Advance phase
            phase += phaseInc;
            if (phase >= 1.0f)
                phase -= 1.0f;

            // ================================================================
            // SUB OSCILLATOR (one octave down)
            // ================================================================
            float subPhaseInc = phaseInc * 0.5f;  // One octave down
            float subOut = std::sin(subPhase * TWO_PI_F) * subLevel;
            subPhase += subPhaseInc;
            if (subPhase >= 1.0f)
                subPhase -= 1.0f;

            // Mix main osc with sub
            float mixOut = oscOut + subOut;

            // ================================================================
            // VCF PROCESSING
            // ================================================================

            // Key tracking
            float trackingMod = 0.0f;
            switch (vcfTracking)
            {
                case VCFTracking::Half:
                    trackingMod = (currentNote - 60) * 50.0f;  // ~50Hz per semitone from middle C
                    break;
                case VCFTracking::Full:
                    trackingMod = (currentNote - 60) * 100.0f;  // ~100Hz per semitone
                    break;
                default:
                    break;
            }

            // Exponential FM modulation
            float vcfMod = 0.0f;
            switch (vcfModSource)
            {
                case VCFModSource::LFO2:
                    vcfMod = lfo2Out * vcfModAmount * 5000.0f;
                    break;
                case VCFModSource::ADSR:
                    if (vcfModAmount >= 0.0f)
                    {
                        vcfMod = envOut * vcfModAmount * 10000.0f;
                    }
                    else
                    {
                        // Negative: inverted envelope
                        vcfMod = std::abs(vcfModAmount) * (1.0f - envOut) * 10000.0f;
                    }
                    break;
                default:
                    break;
            }

            // Linear FM from VCO triangle
            float vcfLFM = triOut * vcfLFMAmount * 2000.0f;

            // Compute final cutoff
            float finalCutoff = vcfCutoff + trackingMod + vcfMod + vcfLFM;
            finalCutoff = std::clamp(finalCutoff, 20.0f, 20000.0f);

            filter.setCutoff(finalCutoff);
            filter.setResonance(vcfResonance);

            float filteredOut = filter.processLowpass(mixOut);

            // ================================================================
            // VCA PROCESSING
            // ================================================================
            float vcaGain = vcaInitialLevel;

            switch (vcaModSource)
            {
                case VCAModSource::LFO1:
                    // AM modulation - scale LFO to 0-1 range for tremolo
                    vcaGain = vcaInitialLevel * (0.5f + 0.5f * lfo1Out);
                    break;
                case VCAModSource::ADSR:
                    vcaGain = envOut;
                    break;
                default:
                    // When off, VCA is controlled only by initial level (for drones)
                    break;
            }

            // If ADSR is the source, silence without note
            if (vcaModSource == VCAModSource::ADSR && envOut <= 0.0f)
                vcaGain = 0.0f;

            // ================================================================
            // OUTPUT
            // ================================================================
            float output = filteredOut * vcaGain * velocity * masterLevel;
            outputL[i] += output;
            outputR[i] += output;
        }
    }

    //==========================================================================
    // PolyBLEP Anti-aliasing
    //==========================================================================

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

    float polyBlepSaw(float ph, float dt)
    {
        float value = 2.0f * ph - 1.0f;
        value -= polyBlep(ph, dt);
        return value;
    }

    float polyBlepPulse(float ph, float dt, float pw)
    {
        float value = ph < pw ? 1.0f : -1.0f;
        value += polyBlep(ph, dt);
        value -= polyBlep(std::fmod(ph + 1.0f - pw, 1.0f), dt);
        return value;
    }

    //==========================================================================
    // ADSR Envelope (exponential curves to prevent clicks)
    //==========================================================================

    float processEnvelope()
    {
        switch (envStage)
        {
            case EnvStage::Attack:
            {
                // Exponential attack
                float attackCoef = 1.0f - std::exp(-4.0f / (attackTime * static_cast<float>(sampleRate)));
                envLevel += attackCoef * (1.0f - envLevel);
                if (envLevel >= 0.999f)
                {
                    envLevel = 1.0f;
                    envStage = EnvStage::Decay;
                }
                break;
            }

            case EnvStage::Decay:
            {
                // Exponential decay
                float decayCoef = std::exp(-4.0f / (decayTime * static_cast<float>(sampleRate)));
                envLevel = sustainLevel + (envLevel - sustainLevel) * decayCoef;
                if (envLevel <= sustainLevel + 0.001f)
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
                // Exponential release
                float releaseCoef = std::exp(-4.0f / (releaseTime * static_cast<float>(sampleRate)));
                envLevel *= releaseCoef;
                if (envLevel <= 0.001f)
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
    float baseFrequency = 440.0f;
    float phase = 0.0f;

    // Envelope state
    EnvStage envStage = EnvStage::Idle;
    float envLevel = 0.0f;

    // LFOs
    LFO lfo1;
    LFO lfo2;

    // Filter
    SVFilter filter;

    //==========================================================================
    // VCO Parameters
    //==========================================================================

    Waveform waveform = Waveform::Saw;
    float tuneOffset = 0.0f;      // semitones (-24 to +24)
    float fineOffset = 0.0f;      // cents (-100 to +100)
    float pulseWidth = 0.5f;      // 0.05 - 0.95
    float subLevel = 0.0f;        // Sub oscillator level
    float subPhase = 0.0f;        // Sub oscillator phase

    // Glide/Portamento
    float glideTime = 0.0f;       // Glide time in seconds
    float glideStartFreq = 0.0f;
    float glideTargetFreq = 0.0f;
    float glideProgress = 1.0f;
    float currentFrequency = 0.0f;
    bool monoMode = false;

    // VCO Modulation
    VCOFMSource vcoFMSource = VCOFMSource::Off;
    float vcoFMAmount = 0.0f;
    VCOPWMSource vcoPWMSource = VCOPWMSource::Off;
    float vcoPWMAmount = 0.0f;

    //==========================================================================
    // VCF Parameters
    //==========================================================================

    float vcfCutoff = 5000.0f;      // Hz
    float vcfResonance = 0.0f;       // 0-1
    VCFTracking vcfTracking = VCFTracking::Off;
    VCFModSource vcfModSource = VCFModSource::ADSR;
    float vcfModAmount = 0.5f;       // Can be negative
    float vcfLFMAmount = 0.0f;       // Linear FM from VCO triangle

    //==========================================================================
    // VCA Parameters
    //==========================================================================

    VCAModSource vcaModSource = VCAModSource::ADSR;
    float vcaInitialLevel = 0.0f;    // For drones when VCA mod is off
    float masterLevel = 0.8f;

    //==========================================================================
    // ADSR Parameters
    //==========================================================================

    float attackTime = 0.01f;
    float decayTime = 0.1f;
    float sustainLevel = 0.7f;
    float releaseTime = 0.3f;
};
