/**
 * @file SynthEngine.h
 * @brief Polyphonic synthesizer engine for A111-5 Mini Synthesizer Voice clone
 *
 * Manages 4-voice polyphony with voice stealing.
 * Based on Doepfer A-111-5 architecture with VCO, VCF, VCA, dual LFOs, and ADSR.
 */

#pragma once

#include <array>
#include <algorithm>
#include "Voice.h"

/**
 * @brief Main synthesizer engine
 */
class SynthEngine
{
public:
    static constexpr int MAX_VOICES = 4;
    static constexpr int BLOCK_SIZE = 64;

    SynthEngine() = default;
    ~SynthEngine() = default;

    //==========================================================================
    // Lifecycle
    //==========================================================================

    void prepare(double sampleRate, int maxBlockSize)
    {
        this->sampleRate = sampleRate;
        this->maxBlockSize = maxBlockSize;

        for (auto& voice : voices)
        {
            voice.prepare(sampleRate);
        }

        std::fill(mixBufferL.begin(), mixBufferL.end(), 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.end(), 0.0f);
    }

    void releaseResources()
    {
        allNotesOff();
    }

    //==========================================================================
    // MIDI Handling
    //==========================================================================

    void noteOn(int note, float velocity, int sampleOffset = 0)
    {
        (void)sampleOffset;

        if (velocity <= 0.0f)
        {
            noteOff(note, sampleOffset);
            return;
        }

        if (monoMode)
        {
            // Mono mode: always use voice 0, track held notes
            bool isLegato = numHeldNotes > 0;  // Legato if we already have held notes
            heldNotes[numHeldNotes++ % 16] = note;
            applyParametersToVoice(voices[0]);
            voices[0].noteOn(note, velocity, isLegato);
        }
        else
        {
            // Poly mode: find a free voice
            Voice* voice = findFreeVoice(note);
            if (voice)
            {
                applyParametersToVoice(*voice);
                voice->noteOn(note, velocity);
            }
        }
    }

    void noteOff(int note, int sampleOffset = 0)
    {
        (void)sampleOffset;

        if (monoMode)
        {
            // Remove note from held notes
            for (int i = 0; i < numHeldNotes; ++i)
            {
                if (heldNotes[i] == note)
                {
                    // Shift remaining notes
                    for (int j = i; j < numHeldNotes - 1; ++j)
                        heldNotes[j] = heldNotes[j + 1];
                    --numHeldNotes;
                    break;
                }
            }

            // If there are still held notes, glide to the last one (legato)
            if (numHeldNotes > 0)
            {
                int lastNote = heldNotes[numHeldNotes - 1];
                applyParametersToVoice(voices[0]);
                voices[0].noteOn(lastNote, voices[0].getVelocity(), true);  // true = legato
            }
            else
            {
                // No more held notes - release
                voices[0].noteOff();
            }
        }
        else
        {
            // Poly mode: release matching voice
            for (auto& voice : voices)
            {
                if (voice.isActive() && voice.getNote() == note && !voice.isReleasing())
                {
                    voice.noteOff();
                }
            }
        }
    }

    void allNotesOff()
    {
        for (auto& voice : voices)
        {
            voice.kill();
        }
    }

    void setPitchBend(float bend)
    {
        pitchBend = bend;
    }

    //==========================================================================
    // Audio Rendering
    //==========================================================================

    void renderBlock(float* outputL, float* outputR, int numSamples)
    {
        std::fill(mixBufferL.begin(), mixBufferL.begin() + numSamples, 0.0f);
        std::fill(mixBufferR.begin(), mixBufferR.begin() + numSamples, 0.0f);

        for (auto& voice : voices)
        {
            if (voice.isActive())
            {
                applyParametersToVoice(voice);
                voice.render(mixBufferL.data(), mixBufferR.data(), numSamples);
            }
        }

        float gain = masterGain;
        for (int i = 0; i < numSamples; ++i)
        {
            outputL[i] = mixBufferL[static_cast<size_t>(i)] * gain;
            outputR[i] = mixBufferR[static_cast<size_t>(i)] * gain;
        }
    }

    //==========================================================================
    // VCO Parameter Setters
    //==========================================================================

    void setWaveform(int wf) { waveform = wf; }
    void setTune(float semitones) { tune = semitones; }
    void setFine(float cents) { fine = cents; }
    void setPulseWidth(float pw) { pulseWidth = pw; }
    void setSubLevel(float level) { subLevel = level; }
    void setGlideTime(float seconds) { glideTime = seconds; }
    void setMonoMode(bool mono) { monoMode = mono; }

    // VCO Modulation
    void setVCOFMSource(int src) { vcoFMSource = src; }
    void setVCOFMAmount(float amt) { vcoFMAmount = amt; }
    void setVCOPWMSource(int src) { vcoPWMSource = src; }
    void setVCOPWMAmount(float amt) { vcoPWMAmount = amt; }

    //==========================================================================
    // VCF Parameter Setters
    //==========================================================================

    void setVCFCutoff(float freq) { vcfCutoff = freq; }
    void setVCFResonance(float res) { vcfResonance = res; }
    void setVCFTracking(int track) { vcfTracking = track; }
    void setVCFModSource(int src) { vcfModSource = src; }
    void setVCFModAmount(float amt) { vcfModAmount = amt; }
    void setVCFLFMAmount(float amt) { vcfLFMAmount = amt; }

    //==========================================================================
    // VCA Parameter Setters
    //==========================================================================

    void setVCAModSource(int src) { vcaModSource = src; }
    void setVCAInitialLevel(float level) { vcaInitialLevel = level; }
    void setMasterLevel(float level) { masterLevel = level; }
    void setMasterVolume(float volumeLinear) { masterGain = volumeLinear; }

    //==========================================================================
    // LFO1 Parameter Setters
    //==========================================================================

    void setLFO1Frequency(float freq) { lfo1Frequency = freq; }
    void setLFO1Waveform(int wf) { lfo1Waveform = wf; }
    void setLFO1Range(int r) { lfo1Range = r; }

    //==========================================================================
    // LFO2 Parameter Setters
    //==========================================================================

    void setLFO2Frequency(float freq) { lfo2Frequency = freq; }
    void setLFO2Waveform(int wf) { lfo2Waveform = wf; }
    void setLFO2Range(int r) { lfo2Range = r; }

    //==========================================================================
    // ADSR Parameter Setters
    //==========================================================================

    void setAttack(float seconds) { attack = seconds; }
    void setDecay(float seconds) { decay = seconds; }
    void setSustain(float level) { sustain = level; }
    void setRelease(float seconds) { release = seconds; }

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

    Voice* findFreeVoice(int /* note */)
    {
        // First, look for an inactive voice
        for (auto& voice : voices)
        {
            if (!voice.isActive())
            {
                return &voice;
            }
        }

        // Steal oldest voice in release phase
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

        // Steal oldest playing voice
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

    void applyParametersToVoice(Voice& voice)
    {
        // VCO
        voice.setWaveform(waveform);
        voice.setTune(tune);
        voice.setFine(fine);
        voice.setPulseWidth(pulseWidth);
        voice.setSubLevel(subLevel);
        voice.setGlideTime(glideTime);
        voice.setMonoMode(monoMode);
        voice.setVCOFMSource(vcoFMSource);
        voice.setVCOFMAmount(vcoFMAmount);
        voice.setVCOPWMSource(vcoPWMSource);
        voice.setVCOPWMAmount(vcoPWMAmount);

        // VCF
        voice.setVCFCutoff(vcfCutoff);
        voice.setVCFResonance(vcfResonance);
        voice.setVCFTracking(vcfTracking);
        voice.setVCFModSource(vcfModSource);
        voice.setVCFModAmount(vcfModAmount);
        voice.setVCFLFMAmount(vcfLFMAmount);

        // VCA
        voice.setVCAModSource(vcaModSource);
        voice.setVCAInitialLevel(vcaInitialLevel);
        voice.setMasterLevel(masterLevel);

        // LFO1
        voice.setLFO1Frequency(lfo1Frequency);
        voice.setLFO1Waveform(lfo1Waveform);
        voice.setLFO1Range(lfo1Range);

        // LFO2
        voice.setLFO2Frequency(lfo2Frequency);
        voice.setLFO2Waveform(lfo2Waveform);
        voice.setLFO2Range(lfo2Range);

        // ADSR
        voice.setAttack(attack);
        voice.setDecay(decay);
        voice.setSustain(sustain);
        voice.setRelease(release);
    }

    //==========================================================================
    // Voice Pool
    //==========================================================================

    std::array<Voice, MAX_VOICES> voices;

    //==========================================================================
    // Mix Buffers
    //==========================================================================

    std::array<float, 8192> mixBufferL{};
    std::array<float, 8192> mixBufferR{};

    //==========================================================================
    // Engine State
    //==========================================================================

    double sampleRate = 44100.0;
    int maxBlockSize = 512;
    float pitchBend = 0.0f;
    float masterGain = 0.8f;

    // Mono mode note tracking
    std::array<int, 16> heldNotes{};
    int numHeldNotes = 0;

    //==========================================================================
    // VCO Parameters
    //==========================================================================

    int waveform = 1;        // Default: Saw (Triangle=0, Saw=1, Pulse=2)
    float tune = 0.0f;       // semitones
    float fine = 0.0f;       // cents
    float pulseWidth = 0.5f;
    float subLevel = 0.0f;   // Sub oscillator level
    float glideTime = 0.0f;  // Glide time in seconds
    bool monoMode = false;   // Mono mode for single voice with legato
    int vcoFMSource = 0;     // 0=Off, 1=LFO1, 2=ADSR
    float vcoFMAmount = 0.0f;
    int vcoPWMSource = 0;    // 0=Off, 1=LFO2, 2=ADSR
    float vcoPWMAmount = 0.0f;

    //==========================================================================
    // VCF Parameters
    //==========================================================================

    float vcfCutoff = 5000.0f;
    float vcfResonance = 0.0f;
    int vcfTracking = 0;     // 0=Off, 1=Half, 2=Full
    int vcfModSource = 2;    // 0=Off, 1=LFO2, 2=ADSR
    float vcfModAmount = 0.5f;
    float vcfLFMAmount = 0.0f;

    //==========================================================================
    // VCA Parameters
    //==========================================================================

    int vcaModSource = 2;    // 0=Off, 1=LFO1, 2=ADSR
    float vcaInitialLevel = 0.0f;
    float masterLevel = 0.8f;

    //==========================================================================
    // LFO1 Parameters
    //==========================================================================

    float lfo1Frequency = 0.5f;  // 0-1 normalized within range
    int lfo1Waveform = 0;        // 0=Triangle, 1=Pulse, 2=Off
    int lfo1Range = 0;           // 0=Low, 1=Medium, 2=High

    //==========================================================================
    // LFO2 Parameters
    //==========================================================================

    float lfo2Frequency = 0.5f;
    int lfo2Waveform = 0;
    int lfo2Range = 0;

    //==========================================================================
    // ADSR Parameters
    //==========================================================================

    float attack = 0.01f;
    float decay = 0.1f;
    float sustain = 0.7f;
    float release = 0.3f;
};
