/**
 * @file SynthEngine.h
 * @brief Famdrum Synth Engine with 8-Step Sequencer
 *
 * Famdrum is a percussion synthesizer inspired by semi-modular designs.
 * Key features:
 * - 8-step sequencer with pitch and velocity per step
 * - 2 VCOs with FM modulation
 * - Noise generator
 * - Moog-style ladder filter
 * - 2 AD envelopes (pitch, VCF/VCA)
 * - Internal clock with tempo control
 */

#pragma once

#include "Voice.h"
#include <array>
#include <algorithm>
#include <cmath>

/**
 * @brief 8-step sequencer with pitch and velocity per step
 */
class DFAMSequencer
{
public:
    static constexpr int NUM_STEPS = 8;

    void reset()
    {
        currentStep = 0;
    }

    void setStepPitch(int step, float semitones)
    {
        if (step >= 0 && step < NUM_STEPS)
            pitches[step] = semitones;
    }

    void setStepVelocity(int step, float vel)
    {
        if (step >= 0 && step < NUM_STEPS)
            velocities[step] = std::clamp(vel, 0.0f, 1.0f);
    }

    float getStepPitch(int step) const
    {
        if (step >= 0 && step < NUM_STEPS)
            return pitches[step];
        return 0.0f;
    }

    float getStepVelocity(int step) const
    {
        if (step >= 0 && step < NUM_STEPS)
            return velocities[step];
        return 1.0f;
    }

    /**
     * @brief Advance to next step
     * @return Pair of (pitch, velocity) for new step
     */
    std::pair<float, float> advance()
    {
        currentStep = (currentStep + 1) % NUM_STEPS;
        return {pitches[currentStep], velocities[currentStep]};
    }

    float getCurrentPitch() const { return pitches[currentStep]; }
    float getCurrentVelocity() const { return velocities[currentStep]; }
    int getCurrentStep() const { return currentStep; }

private:
    std::array<float, NUM_STEPS> pitches = {0, 0, 0, 0, 0, 0, 0, 0};
    std::array<float, NUM_STEPS> velocities = {1, 1, 1, 1, 1, 1, 1, 1};
    int currentStep = 0;
};

/**
 * @brief DFAM Synth Engine
 */
class SynthEngine
{
public:
    SynthEngine() = default;
    ~SynthEngine() = default;

    void prepare(double sr, int samplesPerBlock)
    {
        sampleRate = sr;
        blockSize = samplesPerBlock;

        voice.prepare(sr);
        pitchLfo.prepare(sr);
        velocityLfo.prepare(sr);
        filterLfo.prepare(sr);

        // Effects
        delay.prepare(sr);
        reverb.prepare(sr);
        compressor.prepare(sr);

        updateClockRate();
        sequencer.reset();
    }

    void releaseResources()
    {
        running = false;
    }

    void renderBlock(float* outputL, float* outputR, int numSamples)
    {
        std::fill(outputL, outputL + numSamples, 0.0f);
        std::fill(outputR, outputR + numSamples, 0.0f);

        for (int i = 0; i < numSamples; ++i)
        {
            // Advance LFOs (free-running)
            pitchLfo.process();
            velocityLfo.process();
            float filterLfoValue = filterLfo.process();

            // Apply filter LFO modulation
            float modulatedCutoff = filterCutoffBase + filterLfoValue * filterLfoAmount * 5000.0f;
            modulatedCutoff = std::clamp(modulatedCutoff, 20.0f, 20000.0f);
            voice.setFilterCutoff(modulatedCutoff);

            // Process clock if running
            if (running)
            {
                clockAccumulator += 1.0;

                if (clockAccumulator >= samplesPerStep)
                {
                    clockAccumulator -= samplesPerStep;
                    processSequencerStep();
                }
            }

            // Render voice
            float outL = 0.0f;
            float outR = 0.0f;
            voice.render(&outL, &outR, 1);

            // Apply effects chain: Saturator -> Delay -> Reverb -> Compressor
            outL = saturator.process(outL);
            outR = saturator.process(outR);

            delay.process(outL, outR);
            reverb.process(outL, outR);
            compressor.process(outL, outR);

            outputL[i] = outL * masterGain;
            outputR[i] = outR * masterGain;
        }
    }

    // =========================================================================
    // Transport Controls
    // =========================================================================

    void setRunning(bool run)
    {
        if (run && !running)
        {
            clockAccumulator = 0.0;
            sequencer.reset();
            // Trigger first step immediately
            processSequencerStep();
        }
        running = run;
    }

    bool isRunning() const { return running; }

    void setTempo(float bpm)
    {
        tempo = std::clamp(bpm, 20.0f, 300.0f);
        updateClockRate();
    }

    float getTempo() const { return tempo; }

    /**
     * @brief Set sequencer clock divider
     * @param divider Clock divider value (0.0625 = 1/16x to 16 = 16x)
     *
     * Clock divider values (musical divisions):
     * 1/16, 1/12, 1/8, 1/6, 1/5, 1/4, 1/3, 1/2, 1x, 3/2, 2x, 3x, 4x, 5x, 6x, 8x, 12x, 16x
     */
    void setClockDivider(float divider)
    {
        float newDivider = std::clamp(divider, 0.0625f, 16.0f);
        if (std::abs(newDivider - clockDivider) > 0.0001f)
        {
            clockDivider = newDivider;
            updateClockRate();
        }
    }

    float getClockDivider() const { return clockDivider; }

    // =========================================================================
    // Sequencer Settings
    // =========================================================================

    void setStepPitch(int step, float semitones)
    {
        sequencer.setStepPitch(step, semitones);
    }

    void setStepVelocity(int step, float velocity)
    {
        sequencer.setStepVelocity(step, velocity);
    }

    int getCurrentStep() const { return sequencer.getCurrentStep(); }

    // =========================================================================
    // VCO Parameters
    // =========================================================================

    void setVCO1Frequency(float freq) { voice.setVCO1Frequency(freq); }
    void setVCO2Frequency(float freq) { voice.setVCO2Frequency(freq); }
    void setVCO1Level(float level) { voice.setVCO1Level(level); }
    void setVCO2Level(float level) { voice.setVCO2Level(level); }
    void setVCO1Waveform(int w) { voice.setVCO1Waveform(w); }
    void setVCO2Waveform(int w) { voice.setVCO2Waveform(w); }
    void setFMAmount(float amount) { voice.setFMAmount(amount); }

    // =========================================================================
    // Noise & Modulation
    // =========================================================================

    void setNoiseLevel(float level) { voice.setNoiseLevel(level); }
    void setPitchToNoiseAmount(float amount) { voice.setPitchToNoiseAmount(amount); }
    void setPitchToDecayAmount(float amount) { voice.setPitchToDecayAmount(amount); }

    // =========================================================================
    // LFO Parameters (with clock sync support)
    // =========================================================================

    void setPitchLfoRate(float hz) { pitchLfo.setRate(hz); }
    void setPitchLfoClockSync(float divider) { pitchLfo.setClockSyncRate(tempo, divider); }
    void setPitchLfoAmount(float semitones) { pitchLfoAmount = semitones; }
    void setPitchLfoWaveform(int w) { pitchLfo.setWaveform(w); }

    void setVelocityLfoRate(float hz) { velocityLfo.setRate(hz); }
    void setVelocityLfoClockSync(float divider) { velocityLfo.setClockSyncRate(tempo, divider); }
    void setVelocityLfoAmount(float amount) { velocityLfoAmount = std::clamp(amount, 0.0f, 1.0f); }
    void setVelocityLfoWaveform(int w) { velocityLfo.setWaveform(w); }

    void setStepPitchLfoEnabled(int step, bool enabled)
    {
        if (step >= 0 && step < 8)
            pitchLfoEnabled[static_cast<size_t>(step)] = enabled;
    }

    void setStepVelocityLfoEnabled(int step, bool enabled)
    {
        if (step >= 0 && step < 8)
            velocityLfoEnabled[static_cast<size_t>(step)] = enabled;
    }

    bool getStepPitchLfoEnabled(int step) const
    {
        if (step >= 0 && step < 8)
            return pitchLfoEnabled[static_cast<size_t>(step)];
        return false;
    }

    bool getStepVelocityLfoEnabled(int step) const
    {
        if (step >= 0 && step < 8)
            return velocityLfoEnabled[static_cast<size_t>(step)];
        return false;
    }

    // =========================================================================
    // Filter Parameters
    // =========================================================================

    void setFilterCutoff(float freq)
    {
        filterCutoffBase = freq;
        voice.setFilterCutoff(freq);
    }
    void setFilterResonance(float res) { voice.setFilterResonance(res); }
    void setFilterEnvAmount(float amount) { voice.setFilterEnvAmount(amount); }
    void setFilterMode(int mode) { voice.setFilterMode(mode); }

    // =========================================================================
    // Filter LFO (with clock sync support)
    // =========================================================================

    void setFilterLfoRate(float hz) { filterLfo.setRate(hz); }
    void setFilterLfoClockSync(float divider) { filterLfo.setClockSyncRate(tempo, divider); }
    void setFilterLfoAmount(float amount) { filterLfoAmount = std::clamp(amount, 0.0f, 1.0f); }
    void setFilterLfoWaveform(int w) { filterLfo.setWaveform(w); }

    // =========================================================================
    // Effects - Saturator/Drive
    // =========================================================================

    void setSaturatorDrive(float drive) { saturator.setDrive(drive); }
    void setSaturatorMix(float mix) { saturator.setMix(mix); }

    // =========================================================================
    // Effects - Delay (with clock sync support)
    // =========================================================================

    void setDelayTime(float seconds) { delay.setTime(seconds); }
    void setDelayClockSync(float divider) { delay.setClockSyncTime(tempo, divider); }
    void setDelayFeedback(float fb) { delay.setFeedback(fb); }
    void setDelayMix(float mix) { delay.setMix(mix); }

    // =========================================================================
    // Effects - Reverb
    // =========================================================================

    void setReverbDecay(float decay) { reverb.setDecay(decay); }
    void setReverbDamping(float damping) { reverb.setDamping(damping); }
    void setReverbMix(float mix) { reverb.setMix(mix); }

    // =========================================================================
    // Effects - Compressor
    // =========================================================================

    void setCompThreshold(float db) { compressor.setThreshold(db); }
    void setCompRatio(float ratio) { compressor.setRatio(ratio); }
    void setCompAttack(float ms) { compressor.setAttack(ms); }
    void setCompRelease(float ms) { compressor.setRelease(ms); }
    void setCompMakeup(float db) { compressor.setMakeupGain(db); }
    void setCompMix(float mix) { compressor.setMix(mix); }

    // =========================================================================
    // Pitch Envelope
    // =========================================================================

    void setPitchEnvAttack(float t) { voice.setPitchEnvAttack(t); }
    void setPitchEnvDecay(float t) { voice.setPitchEnvDecay(t); }
    void setPitchEnvAmount(float semitones) { voice.setPitchEnvAmount(semitones); }

    // =========================================================================
    // VCF/VCA Envelope
    // =========================================================================

    void setVCFVCAEnvAttack(float t) { voice.setVCFVCAEnvAttack(t); }
    void setVCFVCAEnvDecay(float t) { voice.setVCFVCAEnvDecay(t); }

    // =========================================================================
    // Master
    // =========================================================================

    void setMasterVolume(float volumeDb)
    {
        masterGain = std::pow(10.0f, volumeDb / 20.0f);
    }

    // =========================================================================
    // MIDI (for external triggering)
    // =========================================================================

    void noteOn(int note, float velocity, int sampleOffset = 0)
    {
        juce::ignoreUnused(sampleOffset);
        // Manual trigger from MIDI
        float freq = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
        voice.setVCO1Frequency(freq);
        voice.setVCO2Frequency(freq);
        voice.trigger(velocity);
    }

    void noteOff(int note, int sampleOffset = 0)
    {
        juce::ignoreUnused(note, sampleOffset);
        // DFAM doesn't have sustain - just AD envelopes
    }

    void allNotesOff()
    {
        running = false;
    }

    void setPitchBend(float bend)
    {
        juce::ignoreUnused(bend);
    }

    // =========================================================================
    // State for UI
    // =========================================================================

    struct SequencerState
    {
        int currentStep;
        bool running;
        std::array<float, 8> pitches;
        std::array<float, 8> velocities;
    };

    SequencerState getSequencerState() const
    {
        SequencerState state;
        state.currentStep = sequencer.getCurrentStep();
        state.running = running;
        for (int i = 0; i < 8; ++i)
        {
            state.pitches[i] = sequencer.getStepPitch(i);
            state.velocities[i] = sequencer.getStepVelocity(i);
        }
        return state;
    }

private:
    void updateClockRate()
    {
        // Calculate samples per sequencer step
        // At 120 BPM with 16th notes: 120/60 * 4 = 8 steps per second
        // Clock divider multiplies/divides the step rate
        float stepsPerSecond = (tempo / 60.0f) * 4.0f * clockDivider;  // 16th notes * divider
        samplesPerStep = sampleRate / stepsPerSecond;
    }

    void processSequencerStep()
    {
        auto [pitch, velocity] = sequencer.advance();
        int step = sequencer.getCurrentStep();

        // Apply pitch LFO modulation if enabled for this step
        float modulatedPitch = pitch;
        if (pitchLfoEnabled[static_cast<size_t>(step)])
        {
            float lfoValue = pitchLfo.getValue();  // -1 to 1
            modulatedPitch += lfoValue * pitchLfoAmount;
        }

        // Apply velocity LFO modulation if enabled for this step
        float modulatedVelocity = velocity;
        if (velocityLfoEnabled[static_cast<size_t>(step)])
        {
            float lfoValue = velocityLfo.getValue();  // -1 to 1
            // Map -1 to 1 -> 0 to 1 for velocity scaling, then scale by amount
            float lfoScale = (lfoValue + 1.0f) * 0.5f;  // 0 to 1
            modulatedVelocity = velocity * (1.0f - velocityLfoAmount + lfoScale * velocityLfoAmount);
            modulatedVelocity = std::clamp(modulatedVelocity, 0.0f, 1.0f);
        }

        voice.setPitchOffset(modulatedPitch);
        voice.trigger(modulatedVelocity);
    }

    // Audio settings
    double sampleRate = 44100.0;
    int blockSize = 512;

    // Voice
    DFAMVoice voice;

    // Sequencer
    DFAMSequencer sequencer;

    // LFOs
    SimpleLFO pitchLfo;
    SimpleLFO velocityLfo;
    SimpleLFO filterLfo;
    float pitchLfoAmount = 12.0f;      // Semitones
    float velocityLfoAmount = 0.5f;    // 0-1 depth
    float filterLfoAmount = 0.5f;      // 0-1 depth
    float filterCutoffBase = 5000.0f;  // Base cutoff for LFO modulation
    std::array<bool, 8> pitchLfoEnabled = {false, false, false, false, false, false, false, false};
    std::array<bool, 8> velocityLfoEnabled = {false, false, false, false, false, false, false, false};

    // Effects chain
    Saturator saturator;
    StereoDelay delay;
    AmbisonicReverb reverb;
    Compressor compressor;

    // Transport
    bool running = false;
    float tempo = 120.0f;
    float clockDivider = 1.0f;  // 1/64x to 64x (0.015625 to 64.0)
    double samplesPerStep = 1000.0;
    double clockAccumulator = 0.0;

    // Master
    float masterGain = 0.5f;
};
