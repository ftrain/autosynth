/**
 * @file PluginProcessor.h
 * @brief FM Drone audio processor
 *
 * 2-operator FM synthesizer optimized for drones and ambient textures.
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/SynthEngine.h"

/**
 * @brief FM Drone audio processor
 *
 * Parameters are exposed via AudioProcessorValueTreeState for
 * automation and state persistence.
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
    double getTailLengthSeconds() const override { return 10.0; } // Long for drone releases
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    //==========================================================================
    // Parameter access
    //==========================================================================

    /** Audio parameter value tree state - use for UI binding */
    juce::AudioProcessorValueTreeState apvts;

    /** Get current audio output for visualization */
    const std::array<float, 512>& getVisualizationBuffer() const { return visualizationBuffer; }

private:
    /** Create the parameter layout - called once in constructor */
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    //==========================================================================
    // DSP Engine
    //==========================================================================

    SynthEngine synthEngine;

    //==========================================================================
    // Cached Parameters (lock-free audio thread access)
    //==========================================================================

    // Carrier
    std::atomic<float>* carrierRatioParam = nullptr;
    std::atomic<float>* carrierLevelParam = nullptr;

    // Modulator
    std::atomic<float>* modRatioParam = nullptr;
    std::atomic<float>* modDepthParam = nullptr;
    std::atomic<float>* modFeedbackParam = nullptr;

    // Modulator envelope
    std::atomic<float>* modAttackParam = nullptr;
    std::atomic<float>* modDecayParam = nullptr;
    std::atomic<float>* modSustainParam = nullptr;
    std::atomic<float>* modReleaseParam = nullptr;

    // Amp envelope
    std::atomic<float>* ampAttackParam = nullptr;
    std::atomic<float>* ampDecayParam = nullptr;
    std::atomic<float>* ampSustainParam = nullptr;
    std::atomic<float>* ampReleaseParam = nullptr;

    // Drift
    std::atomic<float>* driftRateParam = nullptr;
    std::atomic<float>* driftAmountParam = nullptr;

    // Master
    std::atomic<float>* masterLevelParam = nullptr;

    //==========================================================================
    // State
    //==========================================================================

    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;

    /** Buffer for UI visualization */
    std::array<float, 512> visualizationBuffer{};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
