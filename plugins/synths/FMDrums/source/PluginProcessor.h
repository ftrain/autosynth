/**
 * @file PluginProcessor.h
 * @brief Main audio processor for FM Drums synthesizer
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/DrumEngine.h"

class PluginProcessor : public juce::AudioProcessor
{
public:
    PluginProcessor();
    ~PluginProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

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

    juce::AudioProcessorValueTreeState apvts;
    const std::array<float, 512>& getVisualizationBuffer() const { return visualizationBuffer; }

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    DrumEngine drumEngine;

    // Cached parameters
    std::atomic<float>* kickCarrierFreq = nullptr;
    std::atomic<float>* kickModRatio = nullptr;
    std::atomic<float>* kickModDepth = nullptr;
    std::atomic<float>* kickPitchDecay = nullptr;
    std::atomic<float>* kickPitchAmount = nullptr;
    std::atomic<float>* kickAmpDecay = nullptr;
    std::atomic<float>* kickLevel = nullptr;

    std::atomic<float>* snareCarrierFreq = nullptr;
    std::atomic<float>* snareModRatio = nullptr;
    std::atomic<float>* snareModDepth = nullptr;
    std::atomic<float>* snarePitchDecay = nullptr;
    std::atomic<float>* snareAmpDecay = nullptr;
    std::atomic<float>* snareNoise = nullptr;
    std::atomic<float>* snareLevel = nullptr;

    std::atomic<float>* hatCarrierFreq = nullptr;
    std::atomic<float>* hatModRatio = nullptr;
    std::atomic<float>* hatModDepth = nullptr;
    std::atomic<float>* hatAmpDecay = nullptr;
    std::atomic<float>* hatNoise = nullptr;
    std::atomic<float>* hatLevel = nullptr;

    std::atomic<float>* percCarrierFreq = nullptr;
    std::atomic<float>* percModRatio = nullptr;
    std::atomic<float>* percModDepth = nullptr;
    std::atomic<float>* percPitchDecay = nullptr;
    std::atomic<float>* percAmpDecay = nullptr;
    std::atomic<float>* percLevel = nullptr;

    std::atomic<float>* masterLevel = nullptr;

    double currentSampleRate = 44100.0;
    std::array<float, 512> visualizationBuffer{};

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
