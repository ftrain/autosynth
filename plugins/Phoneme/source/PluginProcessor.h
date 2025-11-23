/**
 * @file PluginProcessor.h
 * @brief Main audio processor for Phoneme formant synthesizer
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/SynthEngine.h"

/**
 * @brief Main audio processor class for Phoneme
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
    // Cached Parameters
    //==========================================================================

    std::atomic<float>* oscWaveformParam = nullptr;
    std::atomic<float>* oscTuneParam = nullptr;
    std::atomic<float>* oscPwParam = nullptr;
    std::atomic<float>* vowelParam = nullptr;
    std::atomic<float>* formantShiftParam = nullptr;
    std::atomic<float>* formantSpreadParam = nullptr;
    std::atomic<float>* vibratoRateParam = nullptr;
    std::atomic<float>* vibratoDepthParam = nullptr;
    std::atomic<float>* vowelLfoRateParam = nullptr;
    std::atomic<float>* vowelLfoDepthParam = nullptr;
    std::atomic<float>* ampAttackParam = nullptr;
    std::atomic<float>* ampDecayParam = nullptr;
    std::atomic<float>* ampSustainParam = nullptr;
    std::atomic<float>* ampReleaseParam = nullptr;
    std::atomic<float>* masterLevelParam = nullptr;

    //==========================================================================
    // State
    //==========================================================================

    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;
    std::array<float, 512> visualizationBuffer{};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
