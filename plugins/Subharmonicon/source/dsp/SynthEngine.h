/**
 * @file SynthEngine.h
 * @brief Subharmonicon Synth Engine with Polyrhythmic Sequencer
 *
 * The Subharmonicon's magic comes from its polyrhythmic sequencer:
 * - 2 four-step sequencers (one per VCO)
 * - 4 rhythm generators that can trigger steps at different divisions
 * - Each sequencer can be enabled/disabled independently
 *
 * Clock Architecture:
 *   Master Clock (tempo BPM)
 *      |
 *      +---> Rhythm 1 (1/16x to 64x) ---> triggers SEQ1 (if enabled)
 *      +---> Rhythm 2 (1/16x to 64x) ---> triggers SEQ1 (if enabled)
 *      +---> Rhythm 3 (1/16x to 64x) ---> triggers SEQ2 (if enabled)
 *      +---> Rhythm 4 (1/16x to 64x) ---> triggers SEQ2 (if enabled)
 *
 * When a rhythm generator fires, it advances its associated sequencer
 * by one step and triggers ONLY that voice's envelope.
 */

#pragma once

#include "Voice.h"
#include <array>
#include <algorithm>
#include <cmath>

/**
 * @brief Polyrhythmic Clock Divider with extended range
 *
 * Supports division values from 0.0625 (1/16x = 16 clocks per trigger)
 * to 64 (64x = trigger every 1/64th of a clock).
 *
 * Division interpretation:
 * - division < 1: Clock divider (trigger every N clocks where N = 1/division)
 * - division = 1: Trigger every clock
 * - division > 1: Clock multiplier (trigger N times per clock)
 */
class RhythmGenerator
{
public:
    void setDivision(float div)
    {
        division = std::clamp(div, 0.015625f, 64.0f);  // 1/64 to 64x
    }
    float getDivision() const { return division; }

    void reset()
    {
        accumulator = 0.0f;
    }

    /**
     * @brief Process a master clock pulse
     * @return Number of times this rhythm generator should fire (0, 1, or more for fast divisions)
     */
    int processClock()
    {
        accumulator += division;
        int triggers = 0;
        while (accumulator >= 1.0f)
        {
            accumulator -= 1.0f;
            triggers++;
        }
        return triggers;
    }

private:
    float division = 1.0f;
    float accumulator = 0.0f;
};

/**
 * @brief 4-step Sequencer with enable control
 *
 * Each step contains a pitch offset in semitones.
 * The sequencer cycles through steps when triggered by rhythm generators.
 */
class StepSequencer
{
public:
    static constexpr int NUM_STEPS = 4;

    void setEnabled(bool e) { enabled = e; }
    bool isEnabled() const { return enabled; }

    void setStep(int index, float semitones)
    {
        if (index >= 0 && index < NUM_STEPS)
            steps[index] = semitones;
    }

    float getStep(int index) const
    {
        if (index >= 0 && index < NUM_STEPS)
            return steps[index];
        return 0.0f;
    }

    void reset()
    {
        currentStep = 0;
    }

    /**
     * @brief Advance to next step (only if enabled)
     * @return The pitch offset of the new current step (0 if disabled)
     */
    float advance()
    {
        if (!enabled)
            return 0.0f;

        currentStep = (currentStep + 1) % NUM_STEPS;
        return steps[currentStep];
    }

    float getCurrentValue() const
    {
        if (!enabled)
            return 0.0f;
        return steps[currentStep];
    }

    int getCurrentStep() const { return currentStep; }

private:
    std::array<float, NUM_STEPS> steps = {0.0f, 0.0f, 0.0f, 0.0f};
    int currentStep = 0;
    bool enabled = true;
};

/**
 * @brief Subharmonicon Synth Engine
 *
 * Manages the 2-voice synth, sequencers, and rhythm generators.
 * Each voice has completely independent:
 * - Oscillators (VCO + 2 subs)
 * - Filter with envelope
 * - VCA with envelope
 * - Sequencer
 * - Rhythm generators
 */
class SubharmoniconEngine
{
public:
    SubharmoniconEngine() = default;
    ~SubharmoniconEngine() = default;

    void prepare(double sampleRate, int samplesPerBlock)
    {
        this->sampleRate = sampleRate;
        this->blockSize = samplesPerBlock;

        voice.prepare(sampleRate);

        // Calculate samples per clock tick
        updateClockRate();

        // Reset sequencers and rhythm generators
        seq1.reset();
        seq2.reset();
        for (auto& rg : rhythmGenerators)
            rg.reset();
    }

    void releaseResources()
    {
        // Nothing to release
    }

    /**
     * @brief Render a block of audio
     */
    void renderBlock(float* outputL, float* outputR, int numSamples)
    {
        // Clear output
        std::fill(outputL, outputL + numSamples, 0.0f);
        std::fill(outputR, outputR + numSamples, 0.0f);

        // Process sample by sample for accurate clock timing
        for (int i = 0; i < numSamples; ++i)
        {
            // Process clock if running
            if (running)
            {
                clockAccumulator += 1.0;

                if (clockAccumulator >= samplesPerClock)
                {
                    clockAccumulator -= samplesPerClock;
                    processMasterClock();
                }
            }

            // Render voice (always running in drone mode)
            float outL = 0.0f;
            float outR = 0.0f;
            voice.render(&outL, &outR, 1);

            outputL[i] = outL;
            outputR[i] = outR;
        }
    }

    // =========================================================================
    // Transport Controls
    // =========================================================================

    void setRunning(bool run)
    {
        if (run && !running)
        {
            // Starting - reset everything
            clockAccumulator = 0.0;
            for (auto& rg : rhythmGenerators)
                rg.reset();
            seq1.reset();
            seq2.reset();

            // Clear pitch offsets when starting
            voice.setVCO1PitchOffset(0.0f);
            voice.setVCO2PitchOffset(0.0f);
        }
        else if (!run && running)
        {
            // Stopping - reset pitch offsets and silence envelopes
            voice.setVCO1PitchOffset(0.0f);
            voice.setVCO2PitchOffset(0.0f);
        }
        running = run;
    }

    bool isRunning() const { return running; }

    void setTempo(float bpm)
    {
        tempo = std::clamp(bpm, 20.0f, 300.0f);
        updateClockRate();
    }

    // =========================================================================
    // Sequencer Enable Controls
    // =========================================================================

    void setSeq1Enabled(bool enabled)
    {
        seq1.setEnabled(enabled);
        if (!enabled)
        {
            voice.setVCO1PitchOffset(0.0f);  // Reset pitch when disabled
        }
    }

    void setSeq2Enabled(bool enabled)
    {
        seq2.setEnabled(enabled);
        if (!enabled)
        {
            voice.setVCO2PitchOffset(0.0f);  // Reset pitch when disabled
        }
    }

    bool isSeq1Enabled() const { return seq1.isEnabled(); }
    bool isSeq2Enabled() const { return seq2.isEnabled(); }

    // =========================================================================
    // Rhythm Generator Settings (extended range: 0.0625 to 64)
    // =========================================================================

    void setRhythm1Division(float div) { rhythmGenerators[0].setDivision(div); }
    void setRhythm2Division(float div) { rhythmGenerators[1].setDivision(div); }
    void setRhythm3Division(float div) { rhythmGenerators[2].setDivision(div); }
    void setRhythm4Division(float div) { rhythmGenerators[3].setDivision(div); }

    // Legacy int interface (maps 1-8 to float)
    void setRhythm1Division(int div) { setRhythm1Division(static_cast<float>(div)); }
    void setRhythm2Division(int div) { setRhythm2Division(static_cast<float>(div)); }
    void setRhythm3Division(int div) { setRhythm3Division(static_cast<float>(div)); }
    void setRhythm4Division(int div) { setRhythm4Division(static_cast<float>(div)); }

    // =========================================================================
    // Sequencer Settings
    // =========================================================================

    void setSeq1Step(int step, float semitones) { seq1.setStep(step, semitones); }
    void setSeq2Step(int step, float semitones) { seq2.setStep(step, semitones); }

    int getSeq1CurrentStep() const { return seq1.getCurrentStep(); }
    int getSeq2CurrentStep() const { return seq2.getCurrentStep(); }

    // =========================================================================
    // VCO Parameters (delegated to voice)
    // =========================================================================

    void setVCO1Frequency(float freq) { voice.setVCO1Frequency(freq); }
    void setVCO2Frequency(float freq) { voice.setVCO2Frequency(freq); }
    void setVCO1Level(float l) { voice.setVCO1Level(l); }
    void setVCO2Level(float l) { voice.setVCO2Level(l); }
    void setVCO1Waveform(int w) { voice.setVCO1Waveform(w); }
    void setVCO2Waveform(int w) { voice.setVCO2Waveform(w); }

    // =========================================================================
    // Subharmonic Parameters
    // =========================================================================

    void setSub1ADivision(int div) { voice.setSub1ADivision(div); }
    void setSub1BDivision(int div) { voice.setSub1BDivision(div); }
    void setSub2ADivision(int div) { voice.setSub2ADivision(div); }
    void setSub2BDivision(int div) { voice.setSub2BDivision(div); }

    void setSub1ALevel(float l) { voice.setSub1ALevel(l); }
    void setSub1BLevel(float l) { voice.setSub1BLevel(l); }
    void setSub2ALevel(float l) { voice.setSub2ALevel(l); }
    void setSub2BLevel(float l) { voice.setSub2BLevel(l); }

    // =========================================================================
    // Filter Parameters (per-voice)
    // =========================================================================

    // Voice 1 filter
    void setFilter1Cutoff(float freq) { voice.setFilter1Cutoff(freq); }
    void setFilter1Resonance(float res) { voice.setFilter1Resonance(res); }
    void setFilter1EnvAmount(float amt) { voice.setFilter1EnvAmount(amt); }

    // Voice 2 filter
    void setFilter2Cutoff(float freq) { voice.setFilter2Cutoff(freq); }
    void setFilter2Resonance(float res) { voice.setFilter2Resonance(res); }
    void setFilter2EnvAmount(float amt) { voice.setFilter2EnvAmount(amt); }

    // Legacy: set both filters at once (for backward compatibility)
    void setFilterCutoff(float freq) { voice.setFilterCutoff(freq); }
    void setFilterResonance(float res) { voice.setFilterResonance(res); }
    void setFilterEnvAmount(float amt) { voice.setVCFEnvAmount(amt); }

    // =========================================================================
    // Envelope Parameters (per-voice)
    // =========================================================================

    // Voice 1 envelopes
    void setVCF1Attack(float t) { voice.setVCF1Attack(t); }
    void setVCF1Decay(float t) { voice.setVCF1Decay(t); }
    void setVCA1Attack(float t) { voice.setVCA1Attack(t); }
    void setVCA1Decay(float t) { voice.setVCA1Decay(t); }

    // Voice 2 envelopes
    void setVCF2Attack(float t) { voice.setVCF2Attack(t); }
    void setVCF2Decay(float t) { voice.setVCF2Decay(t); }
    void setVCA2Attack(float t) { voice.setVCA2Attack(t); }
    void setVCA2Decay(float t) { voice.setVCA2Decay(t); }

    // Legacy: set both voices at once
    void setVCFAttack(float t) { voice.setVCFAttack(t); }
    void setVCFDecay(float t) { voice.setVCFDecay(t); }
    void setVCAAttack(float t) { voice.setVCAAttack(t); }
    void setVCADecay(float t) { voice.setVCADecay(t); }

    // =========================================================================
    // Master Volume
    // =========================================================================

    void setMasterVolume(float vol) { voice.setMasterLevel(vol); }

    // =========================================================================
    // State for UI feedback
    // =========================================================================

    struct SequencerState
    {
        int seq1Step;
        int seq2Step;
        bool seq1Enabled;
        bool seq2Enabled;
        bool rhythm1Active;
        bool rhythm2Active;
        bool rhythm3Active;
        bool rhythm4Active;
    };

    SequencerState getSequencerState() const
    {
        return {
            seq1.getCurrentStep(),
            seq2.getCurrentStep(),
            seq1.isEnabled(),
            seq2.isEnabled(),
            lastRhythm1Fired,
            lastRhythm2Fired,
            lastRhythm3Fired,
            lastRhythm4Fired
        };
    }

private:
    void updateClockRate()
    {
        // Clock rate: 4 pulses per beat (16th notes at tempo)
        // This gives good resolution for rhythm divisions
        float beatsPerSecond = tempo / 60.0f;
        float clocksPerSecond = beatsPerSecond * 4.0f;  // 4 clocks per beat
        samplesPerClock = sampleRate / clocksPerSecond;
    }

    void processMasterClock()
    {
        // Reset trigger indicators
        lastRhythm1Fired = false;
        lastRhythm2Fired = false;
        lastRhythm3Fired = false;
        lastRhythm4Fired = false;

        // Process rhythm generators
        // Rhythms 1 & 2 drive Sequencer 1 (VCO1) - but only if seq1 is enabled
        // Rhythms 3 & 4 drive Sequencer 2 (VCO2) - but only if seq2 is enabled

        int seq1Triggers = 0;
        int seq2Triggers = 0;

        // Voice 1 rhythm generators
        if (seq1.isEnabled())
        {
            int r1 = rhythmGenerators[0].processClock();
            int r2 = rhythmGenerators[1].processClock();

            if (r1 > 0) lastRhythm1Fired = true;
            if (r2 > 0) lastRhythm2Fired = true;

            // Total triggers for seq1 (can be multiple per clock at high divisions)
            seq1Triggers = r1 + r2;
        }
        else
        {
            // Still process clocks to keep them in sync, but don't trigger
            rhythmGenerators[0].processClock();
            rhythmGenerators[1].processClock();
        }

        // Voice 2 rhythm generators
        if (seq2.isEnabled())
        {
            int r3 = rhythmGenerators[2].processClock();
            int r4 = rhythmGenerators[3].processClock();

            if (r3 > 0) lastRhythm3Fired = true;
            if (r4 > 0) lastRhythm4Fired = true;

            // Total triggers for seq2
            seq2Triggers = r3 + r4;
        }
        else
        {
            // Still process clocks to keep them in sync, but don't trigger
            rhythmGenerators[2].processClock();
            rhythmGenerators[3].processClock();
        }

        // Advance sequencers for each trigger and trigger envelopes
        // Multiple triggers = multiple steps + retriggering (for fast divisions)
        for (int i = 0; i < seq1Triggers; ++i)
        {
            float pitchOffset = seq1.advance();
            voice.setVCO1PitchOffset(pitchOffset);
            voice.triggerVoice1();  // Trigger voice 1 envelope
        }

        for (int i = 0; i < seq2Triggers; ++i)
        {
            float pitchOffset = seq2.advance();
            voice.setVCO2PitchOffset(pitchOffset);
            voice.triggerVoice2();  // Trigger voice 2 envelope
        }
    }

    // Audio settings
    double sampleRate = 44100.0;
    int blockSize = 512;

    // Voice
    SubharmoniconVoice voice;

    // Transport
    bool running = false;
    float tempo = 120.0f;
    double samplesPerClock = 1000.0;
    double clockAccumulator = 0.0;

    // Rhythm generators (4 total)
    std::array<RhythmGenerator, 4> rhythmGenerators;

    // Sequencers (2 total, 4 steps each)
    StepSequencer seq1;
    StepSequencer seq2;

    // UI feedback state
    bool lastRhythm1Fired = false;
    bool lastRhythm2Fired = false;
    bool lastRhythm3Fired = false;
    bool lastRhythm4Fired = false;
};
