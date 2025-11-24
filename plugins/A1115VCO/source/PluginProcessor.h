/**
 * @file PluginProcessor.h
 * @brief Main audio processor for A111-5 Mini Synthesizer Voice plugin
 *
 * Based on Doepfer A-111-5 with VCO, VCF, VCA, dual LFOs, and ADSR.
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/SynthEngine.h"

/**
 * @brief Main audio processor class for A111-5 VCO
 */
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
    const std::array<float, 512>& getVisualizationBuffer() const { return visualizationBuffer; }

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    //==========================================================================
    // DSP Engine
    //==========================================================================

    SynthEngine synthEngine;

    //==========================================================================
    // Cached Parameters - VCO
    //==========================================================================

    std::atomic<float>* oscWaveformParam = nullptr;
    std::atomic<float>* oscTuneParam = nullptr;
    std::atomic<float>* oscFineParam = nullptr;
    std::atomic<float>* pulseWidthParam = nullptr;
    std::atomic<float>* subLevelParam = nullptr;
    std::atomic<float>* glideTimeParam = nullptr;
    std::atomic<float>* monoModeParam = nullptr;
    std::atomic<float>* vcoFMSourceParam = nullptr;
    std::atomic<float>* vcoFMAmountParam = nullptr;
    std::atomic<float>* vcoPWMSourceParam = nullptr;
    std::atomic<float>* vcoPWMAmountParam = nullptr;

    //==========================================================================
    // Cached Parameters - VCF
    //==========================================================================

    std::atomic<float>* vcfCutoffParam = nullptr;
    std::atomic<float>* vcfResonanceParam = nullptr;
    std::atomic<float>* vcfTrackingParam = nullptr;
    std::atomic<float>* vcfModSourceParam = nullptr;
    std::atomic<float>* vcfModAmountParam = nullptr;
    std::atomic<float>* vcfLFMAmountParam = nullptr;

    //==========================================================================
    // Cached Parameters - VCA
    //==========================================================================

    std::atomic<float>* vcaModSourceParam = nullptr;
    std::atomic<float>* vcaInitialLevelParam = nullptr;
    std::atomic<float>* masterLevelParam = nullptr;

    //==========================================================================
    // Cached Parameters - LFO1
    //==========================================================================

    std::atomic<float>* lfo1FrequencyParam = nullptr;
    std::atomic<float>* lfo1WaveformParam = nullptr;
    std::atomic<float>* lfo1RangeParam = nullptr;

    //==========================================================================
    // Cached Parameters - LFO2
    //==========================================================================

    std::atomic<float>* lfo2FrequencyParam = nullptr;
    std::atomic<float>* lfo2WaveformParam = nullptr;
    std::atomic<float>* lfo2RangeParam = nullptr;

    //==========================================================================
    // Cached Parameters - ADSR
    //==========================================================================

    std::atomic<float>* ampAttackParam = nullptr;
    std::atomic<float>* ampDecayParam = nullptr;
    std::atomic<float>* ampSustainParam = nullptr;
    std::atomic<float>* ampReleaseParam = nullptr;

    //==========================================================================
    // State
    //==========================================================================

    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;
    std::array<float, 512> visualizationBuffer{};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
