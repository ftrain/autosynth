/**
 * @file PluginProcessor.h
 * @brief Tape Loop synthesizer audio processor
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <array>
#include "dsp/TapeLoopEngine.h"

/**
 * @brief Main audio processor for the Tape Loop synthesizer
 */
class PluginProcessor : public juce::AudioProcessor
{
public:
    //==========================================================================
    // Lifecycle
    //==========================================================================

    PluginProcessor();
    ~PluginProcessor() override;

    //==========================================================================
    // Audio Processing
    //==========================================================================

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    //==========================================================================
    // Editor
    //==========================================================================

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    //==========================================================================
    // Plugin Info
    //==========================================================================

    const juce::String getName() const override { return JucePlugin_Name; }

    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    //==========================================================================
    // Programs (not used)
    //==========================================================================

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    //==========================================================================
    // State
    //==========================================================================

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    //==========================================================================
    // Parameters
    //==========================================================================

    juce::AudioProcessorValueTreeState apvts;
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    //==========================================================================
    // Visualization
    //==========================================================================

    const std::array<float, 512>& getVisualizationBuffer() const { return visualizationBuffer; }

private:
    //==========================================================================
    // DSP Engine
    //==========================================================================

    TapeLoopEngine engine;

    //==========================================================================
    // Parameter Pointers (for lock-free audio thread access)
    //==========================================================================

    std::atomic<float>* osc1WaveformParam = nullptr;
    std::atomic<float>* osc1TuneParam = nullptr;
    std::atomic<float>* osc1LevelParam = nullptr;

    std::atomic<float>* osc2WaveformParam = nullptr;
    std::atomic<float>* osc2TuneParam = nullptr;
    std::atomic<float>* osc2DetuneParam = nullptr;
    std::atomic<float>* osc2LevelParam = nullptr;

    std::atomic<float>* loopLengthParam = nullptr;
    std::atomic<float>* loopFeedbackParam = nullptr;
    std::atomic<float>* recordLevelParam = nullptr;

    std::atomic<float>* tapeSaturationParam = nullptr;
    std::atomic<float>* tapeWobbleRateParam = nullptr;
    std::atomic<float>* tapeWobbleDepthParam = nullptr;

    std::atomic<float>* tapeHissParam = nullptr;
    std::atomic<float>* tapeAgeParam = nullptr;
    std::atomic<float>* tapeDegradeParam = nullptr;
    std::atomic<float>* tapeModelParam = nullptr;
    std::atomic<float>* tapeDriveParam = nullptr;
    std::atomic<float>* tapeBumpParam = nullptr;

    std::atomic<float>* recAttackParam = nullptr;
    std::atomic<float>* recDecayParam = nullptr;

    std::atomic<float>* fmAmountParam = nullptr;

    std::atomic<float>* lfoRateParam = nullptr;
    std::atomic<float>* lfoDepthParam = nullptr;
    std::atomic<float>* lfoWaveformParam = nullptr;
    std::atomic<float>* lfoTargetParam = nullptr;

    std::atomic<float>* dryLevelParam = nullptr;
    std::atomic<float>* loopLevelParam = nullptr;
    std::atomic<float>* masterLevelParam = nullptr;

    // Effects
    std::atomic<float>* delayTimeParam = nullptr;
    std::atomic<float>* delayFeedbackParam = nullptr;
    std::atomic<float>* delayMixParam = nullptr;

    std::atomic<float>* reverbReplaceParam = nullptr;
    std::atomic<float>* reverbBrightnessParam = nullptr;
    std::atomic<float>* reverbDetuneParam = nullptr;
    std::atomic<float>* reverbBignessParam = nullptr;
    std::atomic<float>* reverbSizeParam = nullptr;
    std::atomic<float>* reverbMixParam = nullptr;

    std::atomic<float>* compThresholdParam = nullptr;
    std::atomic<float>* compRatioParam = nullptr;
    std::atomic<float>* compMixParam = nullptr;

    // Sequencers (dual)
    std::atomic<float>* seqEnabledParam = nullptr;
    std::atomic<float>* seqBPMParam = nullptr;

    // Sequencer 1 (Osc 1)
    std::atomic<float>* seq1DivisionParam = nullptr;
    std::atomic<float>* seq1Pitch1Param = nullptr;
    std::atomic<float>* seq1Pitch2Param = nullptr;
    std::atomic<float>* seq1Pitch3Param = nullptr;
    std::atomic<float>* seq1Pitch4Param = nullptr;
    std::atomic<float>* seq1Gate1Param = nullptr;
    std::atomic<float>* seq1Gate2Param = nullptr;
    std::atomic<float>* seq1Gate3Param = nullptr;
    std::atomic<float>* seq1Gate4Param = nullptr;

    // Sequencer 2 (Osc 2)
    std::atomic<float>* seq2DivisionParam = nullptr;
    std::atomic<float>* seq2Pitch1Param = nullptr;
    std::atomic<float>* seq2Pitch2Param = nullptr;
    std::atomic<float>* seq2Pitch3Param = nullptr;
    std::atomic<float>* seq2Pitch4Param = nullptr;
    std::atomic<float>* seq2Gate1Param = nullptr;
    std::atomic<float>* seq2Gate2Param = nullptr;
    std::atomic<float>* seq2Gate3Param = nullptr;
    std::atomic<float>* seq2Gate4Param = nullptr;

    // Voice to Loop FM
    std::atomic<float>* voiceLoopFMParam = nullptr;

    // ADSR Envelopes (per oscillator)
    std::atomic<float>* osc1AttackParam = nullptr;
    std::atomic<float>* osc1DecayParam = nullptr;
    std::atomic<float>* osc1SustainParam = nullptr;
    std::atomic<float>* osc1ReleaseParam = nullptr;

    std::atomic<float>* osc2AttackParam = nullptr;
    std::atomic<float>* osc2DecayParam = nullptr;
    std::atomic<float>* osc2SustainParam = nullptr;
    std::atomic<float>* osc2ReleaseParam = nullptr;

    // Pan LFO
    std::atomic<float>* panSpeedParam = nullptr;
    std::atomic<float>* panDepthParam = nullptr;

    //==========================================================================
    // State
    //==========================================================================

    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;
    std::array<float, 512> visualizationBuffer{};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
