/**
 * @file PluginProcessor.h
 * @brief Subharmonicon - Main audio processor
 *
 * Moog Subharmonicon clone with polyrhythmic sequencer
 * and subharmonic oscillator generation.
 *
 * TRUE 2-VOICE ARCHITECTURE:
 * - Voice 1: VCO1 + SUB1A + SUB1B -> Filter1 -> VCA1
 * - Voice 2: VCO2 + SUB2A + SUB2B -> Filter2 -> VCA2
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/SynthEngine.h"

class PluginProcessor : public juce::AudioProcessor
{
public:
    PluginProcessor();
    ~PluginProcessor() override;

    //==========================================================================
    // AudioProcessor overrides
    //==========================================================================
    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    //==========================================================================
    // Standard boilerplate
    //==========================================================================
    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 2.0; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    //==========================================================================
    // Parameter access
    //==========================================================================

    juce::AudioProcessorValueTreeState apvts;

    /** Get current audio output for visualization */
    const std::array<float, 512>& getVisualizationBuffer() const { return visualizationBuffer; }

    /** Get sequencer state for UI feedback */
    SubharmoniconEngine::SequencerState getSequencerState() const { return synthEngine.getSequencerState(); }

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    //==========================================================================
    // DSP Engine
    //==========================================================================

    SubharmoniconEngine synthEngine;

    //==========================================================================
    // Cached Parameter Pointers (lock-free audio thread access)
    //==========================================================================

    // VCO 1
    std::atomic<float>* osc1FreqParam = nullptr;
    std::atomic<float>* osc1LevelParam = nullptr;
    std::atomic<float>* osc1WaveParam = nullptr;
    std::atomic<float>* sub1aDivParam = nullptr;
    std::atomic<float>* sub1aLevelParam = nullptr;
    std::atomic<float>* sub1bDivParam = nullptr;
    std::atomic<float>* sub1bLevelParam = nullptr;

    // VCO 2
    std::atomic<float>* osc2FreqParam = nullptr;
    std::atomic<float>* osc2LevelParam = nullptr;
    std::atomic<float>* osc2WaveParam = nullptr;
    std::atomic<float>* sub2aDivParam = nullptr;
    std::atomic<float>* sub2aLevelParam = nullptr;
    std::atomic<float>* sub2bDivParam = nullptr;
    std::atomic<float>* sub2bLevelParam = nullptr;

    // Voice 1 Filter & Envelopes
    std::atomic<float>* filter1CutoffParam = nullptr;
    std::atomic<float>* filter1ResoParam = nullptr;
    std::atomic<float>* filter1EnvAmtParam = nullptr;
    std::atomic<float>* vcf1AttackParam = nullptr;
    std::atomic<float>* vcf1DecayParam = nullptr;
    std::atomic<float>* vca1AttackParam = nullptr;
    std::atomic<float>* vca1DecayParam = nullptr;

    // Voice 2 Filter & Envelopes
    std::atomic<float>* filter2CutoffParam = nullptr;
    std::atomic<float>* filter2ResoParam = nullptr;
    std::atomic<float>* filter2EnvAmtParam = nullptr;
    std::atomic<float>* vcf2AttackParam = nullptr;
    std::atomic<float>* vcf2DecayParam = nullptr;
    std::atomic<float>* vca2AttackParam = nullptr;
    std::atomic<float>* vca2DecayParam = nullptr;

    // Sequencer
    std::atomic<float>* tempoParam = nullptr;
    std::atomic<float>* rhythm1DivParam = nullptr;
    std::atomic<float>* rhythm2DivParam = nullptr;
    std::atomic<float>* rhythm3DivParam = nullptr;
    std::atomic<float>* rhythm4DivParam = nullptr;

    std::atomic<float>* seq1EnableParam = nullptr;
    std::atomic<float>* seq1Step1Param = nullptr;
    std::atomic<float>* seq1Step2Param = nullptr;
    std::atomic<float>* seq1Step3Param = nullptr;
    std::atomic<float>* seq1Step4Param = nullptr;

    std::atomic<float>* seq2EnableParam = nullptr;
    std::atomic<float>* seq2Step1Param = nullptr;
    std::atomic<float>* seq2Step2Param = nullptr;
    std::atomic<float>* seq2Step3Param = nullptr;
    std::atomic<float>* seq2Step4Param = nullptr;

    std::atomic<float>* seqRunParam = nullptr;

    // Master
    std::atomic<float>* masterVolumeParam = nullptr;

    //==========================================================================
    // State
    //==========================================================================

    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;

    std::array<float, 512> visualizationBuffer{};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
