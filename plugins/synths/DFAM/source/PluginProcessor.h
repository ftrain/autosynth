/**
 * @file PluginProcessor.h
 * @brief Main audio processor for the synthesizer plugin
 *
 * This is the entry point for all audio processing. It manages:
 * - Voice allocation and polyphony
 * - Parameter state (via APVTS)
 * - MIDI input handling
 * - Audio output rendering
 *
 * @note All DSP uses SST libraries - never write custom DSP algorithms
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/SynthEngine.h"

/**
 * @brief Main audio processor class
 *
 * Inherits from juce::AudioProcessor and manages the synth engine.
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
    double getTailLengthSeconds() const override { return 2.0; } // For reverb tails
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

    /** Get current sequencer state for UI */
    SynthEngine::SequencerState getSequencerState() const { return synthEngine.getSequencerState(); }

private:
    /** Create the parameter layout - called once in constructor */
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    //==========================================================================
    // DSP Engine
    //==========================================================================

    /** The synth engine that handles all audio processing */
    SynthEngine synthEngine;

    //==========================================================================
    // Cached Parameters (for lock-free audio thread access)
    //==========================================================================

    // TODO: Add cached parameter pointers
    // Example:
    // std::atomic<float>* filterCutoffParam = nullptr;
    // std::atomic<float>* filterResoParam = nullptr;

    //==========================================================================
    // State
    //==========================================================================

    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;

    /** Buffer for UI visualization */
    std::array<float, 512> visualizationBuffer{};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
