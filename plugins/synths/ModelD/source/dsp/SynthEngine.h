/**
 * @file SynthEngine.h
 * @brief Polyphonic synthesizer engine managing multiple voices
 *
 * The SynthEngine is the top-level DSP orchestrator. It:
 * - Manages a pool of voices for polyphony
 * - Handles voice allocation and stealing
 * - Routes MIDI to voices
 * - Applies global effects
 * - Provides parameters to voices
 *
 * Signal Flow:
 *   MIDI -> Voice Manager -> [Voice Pool] -> [Mix] -> [Effects] -> Output
 *
 * @note This class is called from the audio thread - no allocations allowed
 */

#pragma once

#include <array>
#include <algorithm>
#include "Voice.h"

// SST Effects (uncomment when needed)
// #include "sst/effects/Reverb.h"
// #include "sst/effects/Delay.h"
// #include "sst/effects/Chorus.h"

/**
 * @brief Main synthesizer engine
 *
 * Manages polyphony, voice stealing, and global effects.
 */
class SynthEngine
{
public:
    //==========================================================================
    // Configuration
    //==========================================================================

    /** Maximum number of simultaneous voices */
    static constexpr int MAX_VOICES = 16;

    /** Block size for internal processing */
    static constexpr int BLOCK_SIZE = 64;

    SynthEngine() = default;
    ~SynthEngine() = default;

    //==========================================================================
    // Lifecycle
    //==========================================================================

    /**
     * @brief Prepare the engine for playback
     * @param sampleRate Sample rate in Hz
     * @param maxBlockSize Maximum expected block size
     */
    void prepare(double sampleRate, int maxBlockSize)
    {
        this->sampleRate = sampleRate;
        this->maxBlockSize = maxBlockSize;

        // Prepare all voices
        for (auto& voice : voices)
        {
            voice.prepare(sampleRate);
        }

        // TODO: Prepare effects
        // Example:
        // reverb.prepare(sampleRate, maxBlockSize);
        // delay.prepare(sampleRate, maxBlockSize);

        // Clear buffers
        std::fill(mixBufferL.begin(), mixBufferL.end(), 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.end(), 0.0f);
    }

    /**
     * @brief Release resources
     */
    void releaseResources()
    {
        allNotesOff();
    }

    //==========================================================================
    // MIDI Handling
    //==========================================================================

    /**
     * @brief Handle MIDI note on
     * @param note MIDI note number (0-127)
     * @param velocity Note velocity (0.0-1.0)
     * @param sampleOffset Sample offset within current block
     */
    void noteOn(int note, float velocity, int sampleOffset = 0)
    {
        (void)sampleOffset; // TODO: Implement sample-accurate timing

        if (velocity <= 0.0f)
        {
            noteOff(note, sampleOffset);
            return;
        }

        Voice* voice = findFreeVoice(note);
        if (voice)
        {
            voice->noteOn(note, velocity);
        }
    }

    /**
     * @brief Handle MIDI note off
     * @param note MIDI note number (0-127)
     * @param sampleOffset Sample offset within current block
     */
    void noteOff(int note, int sampleOffset = 0)
    {
        (void)sampleOffset;

        for (auto& voice : voices)
        {
            if (voice.isActive() && voice.getNote() == note && !voice.isReleasing())
            {
                voice.noteOff();
                // Don't break - release all voices playing this note
            }
        }
    }

    /**
     * @brief Stop all notes immediately
     */
    void allNotesOff()
    {
        for (auto& voice : voices)
        {
            voice.kill();
        }
    }

    /**
     * @brief Set pitch bend amount
     * @param bend Pitch bend value (-1.0 to 1.0)
     */
    void setPitchBend(float bend)
    {
        pitchBend = bend;
        // TODO: Apply pitch bend to all active voices
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
        // Clear mix buffers
        std::fill(mixBufferL.begin(), mixBufferL.begin() + numSamples, 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.begin() + numSamples, 0.0f);

        // Render all active voices
        for (auto& voice : voices)
        {
            if (voice.isActive())
            {
                // Update voice parameters before rendering

                // Oscillator 1
                voice.setOsc1Waveform(static_cast<Oscillator::Waveform>(osc1Waveform));
                voice.setOsc1Octave(osc1Octave);
                voice.setOsc1Level(osc1Level);

                // Oscillator 2
                voice.setOsc2Waveform(static_cast<Oscillator::Waveform>(osc2Waveform));
                voice.setOsc2Octave(osc2Octave);
                voice.setOsc2Detune(osc2Detune);
                voice.setOsc2Level(osc2Level);
                voice.setOsc2Sync(osc2Sync);

                // Oscillator 3
                voice.setOsc3Waveform(static_cast<Oscillator::Waveform>(osc3Waveform));
                voice.setOsc3Octave(osc3Octave);
                voice.setOsc3Detune(osc3Detune);
                voice.setOsc3Level(osc3Level);

                // Noise
                voice.setNoiseLevel(noiseLevel);

                // Filter
                voice.setFilterCutoff(filterCutoff);
                voice.setFilterResonance(filterResonance);
                voice.setFilterEnvAmount(filterEnvAmount);
                voice.setFilterKeyboardTracking(filterKeyboardTracking);

                // Amp Envelope
                voice.setAmpAttack(ampAttack);
                voice.setAmpDecay(ampDecay);
                voice.setAmpSustain(ampSustain);
                voice.setAmpRelease(ampRelease);

                // Filter Envelope
                voice.setFilterAttack(filterAttack);
                voice.setFilterDecay(filterDecay);
                voice.setFilterSustain(filterSustain);
                voice.setFilterRelease(filterRelease);

                // LFO
                voice.setLFORate(lfoRate);
                voice.setLFOWaveform(static_cast<LFO::Waveform>(lfoWaveform));
                voice.setLFOPitchAmount(lfoPitchAmount);
                voice.setLFOFilterAmount(lfoFilterAmount);

                // Master level per voice
                voice.setMasterLevel(1.0f);

                voice.render(mixBufferL.data(), mixBufferR.data(), numSamples);
            }
        }

        // Apply master volume
        float gain = masterGain;
        for (int i = 0; i < numSamples; ++i)
        {
            outputL[i] = mixBufferL[i] * gain;
            outputR[i] = mixBufferR[i] * gain;
        }
    }

    //==========================================================================
    // Parameter Setters
    //==========================================================================

    // Master
    void setMasterVolume(float volumeDb)
    {
        // Convert dB to linear gain
        masterGain = std::pow(10.0f, volumeDb / 20.0f);
    }

    // Oscillator 1
    void setOsc1Waveform(int wf) { osc1Waveform = wf; }
    void setOsc1Octave(int oct) { osc1Octave = oct; }
    void setOsc1Level(float l) { osc1Level = l; }

    // Oscillator 2
    void setOsc2Waveform(int wf) { osc2Waveform = wf; }
    void setOsc2Octave(int oct) { osc2Octave = oct; }
    void setOsc2Detune(float cents) { osc2Detune = cents; }
    void setOsc2Level(float l) { osc2Level = l; }
    void setOsc2Sync(bool sync) { osc2Sync = sync; }

    // Oscillator 3
    void setOsc3Waveform(int wf) { osc3Waveform = wf; }
    void setOsc3Octave(int oct) { osc3Octave = oct; }
    void setOsc3Detune(float cents) { osc3Detune = cents; }
    void setOsc3Level(float l) { osc3Level = l; }

    // Noise
    void setNoiseLevel(float l) { noiseLevel = l; }

    // Filter
    void setFilterCutoff(float cutoffHz) { filterCutoff = cutoffHz; }
    void setFilterResonance(float reso) { filterResonance = reso; }
    void setFilterEnvAmount(float amt) { filterEnvAmount = amt; }
    void setFilterKeyboardTracking(float amt) { filterKeyboardTracking = amt; }

    // Amp Envelope
    void setAmpEnvelope(float a, float d, float s, float r)
    {
        ampAttack = a;
        ampDecay = d;
        ampSustain = s;
        ampRelease = r;
    }

    // Filter Envelope
    void setFilterEnvelope(float a, float d, float s, float r)
    {
        filterAttack = a;
        filterDecay = d;
        filterSustain = s;
        filterRelease = r;
    }

    // LFO
    void setLFORate(float hz) { lfoRate = hz; }
    void setLFOWaveform(int wf) { lfoWaveform = wf; }
    void setLFOPitchAmount(float amt) { lfoPitchAmount = amt; }
    void setLFOFilterAmount(float amt) { lfoFilterAmount = amt; }

    //==========================================================================
    // State Queries
    //==========================================================================

    int getActiveVoiceCount() const
    {
        int count = 0;
        for (const auto& voice : voices)
        {
            if (voice.isActive())
                ++count;
        }
        return count;
    }

private:
    //==========================================================================
    // Voice Management
    //==========================================================================

    /**
     * @brief Find a free voice or steal one
     * @param note The note to be played (used for note stealing priority)
     * @return Pointer to available voice, or nullptr if none available
     */
    Voice* findFreeVoice(int note)
    {
        // First, look for an inactive voice
        for (auto& voice : voices)
        {
            if (!voice.isActive())
            {
                return &voice;
            }
        }

        // No free voice - use voice stealing

        // Strategy 1: Steal oldest voice in release phase
        Voice* oldest = nullptr;
        int oldestAge = -1;

        for (auto& voice : voices)
        {
            if (voice.isReleasing() && voice.getAge() > oldestAge)
            {
                oldest = &voice;
                oldestAge = voice.getAge();
            }
        }

        if (oldest)
        {
            oldest->kill();
            return oldest;
        }

        // Strategy 2: Steal oldest playing voice
        for (auto& voice : voices)
        {
            if (voice.getAge() > oldestAge)
            {
                oldest = &voice;
                oldestAge = voice.getAge();
            }
        }

        if (oldest)
        {
            oldest->kill();
            return oldest;
        }

        return nullptr;
    }

    //==========================================================================
    // Voice Pool
    //==========================================================================

    std::array<Voice, MAX_VOICES> voices;

    //==========================================================================
    // Mix Buffers (pre-allocated for real-time safety)
    //==========================================================================

    std::array<float, 8192> mixBufferL{};
    std::array<float, 8192> mixBufferR{};

    //==========================================================================
    // Engine State
    //==========================================================================

    double sampleRate = 44100.0;
    int maxBlockSize = 512;
    float pitchBend = 0.0f;
    float masterGain = 0.5f;  // -6dB default

    //==========================================================================
    // Global Parameters
    //==========================================================================

    // Oscillator 1
    int osc1Waveform = 0;    // Saw
    int osc1Octave = 0;
    float osc1Level = 1.0f;

    // Oscillator 2
    int osc2Waveform = 0;    // Saw
    int osc2Octave = 0;
    float osc2Detune = 0.0f; // cents
    float osc2Level = 1.0f;
    bool osc2Sync = false;

    // Oscillator 3
    int osc3Waveform = 0;    // Saw
    int osc3Octave = 0;
    float osc3Detune = 0.0f; // cents
    float osc3Level = 0.0f;  // Off by default

    // Noise
    float noiseLevel = 0.0f;

    // Filter
    float filterCutoff = 5000.0f;
    float filterResonance = 0.0f;
    float filterEnvAmount = 0.5f;
    float filterKeyboardTracking = 0.0f;

    // Amp Envelope
    float ampAttack = 0.01f;
    float ampDecay = 0.1f;
    float ampSustain = 0.7f;
    float ampRelease = 0.3f;

    // Filter Envelope
    float filterAttack = 0.01f;
    float filterDecay = 0.2f;
    float filterSustain = 0.5f;
    float filterRelease = 0.3f;

    // LFO
    float lfoRate = 2.0f;        // Hz
    int lfoWaveform = 0;         // 0=Sine, 1=Triangle, 2=Saw, 3=Square, 4=S&H
    float lfoPitchAmount = 0.0f; // 0-1 range
    float lfoFilterAmount = 0.0f; // 0-1 range

    //==========================================================================
    // SST Effects
    // TODO: Uncomment and configure for your architecture
    //==========================================================================

    // sst::effects::Reverb reverb;
    // sst::effects::Delay delay;
    // sst::effects::Chorus chorus;
};
