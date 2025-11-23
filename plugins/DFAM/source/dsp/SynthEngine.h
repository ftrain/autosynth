/**
 * @file SynthEngine.h
 * @brief DFAM Synth Engine with 8-Step Sequencer
 *
 * The DFAM is a semi-modular analog percussion synthesizer.
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
    // Noise
    // =========================================================================

    void setNoiseLevel(float level) { voice.setNoiseLevel(level); }

    // =========================================================================
    // Filter Parameters
    // =========================================================================

    void setFilterCutoff(float freq) { voice.setFilterCutoff(freq); }
    void setFilterResonance(float res) { voice.setFilterResonance(res); }
    void setFilterEnvAmount(float amount) { voice.setFilterEnvAmount(amount); }

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
        float stepsPerSecond = (tempo / 60.0f) * 4.0f;  // 16th notes
        samplesPerStep = sampleRate / stepsPerSecond;
    }

    void processSequencerStep()
    {
        auto [pitch, velocity] = sequencer.advance();
        voice.setPitchOffset(pitch);
        voice.trigger(velocity);
    }

    // Audio settings
    double sampleRate = 44100.0;
    int blockSize = 512;

    // Voice
    DFAMVoice voice;

    // Sequencer
    DFAMSequencer sequencer;

    // Transport
    bool running = false;
    float tempo = 120.0f;
    double samplesPerStep = 1000.0;
    double clockAccumulator = 0.0;

    // Master
    float masterGain = 0.5f;
};
