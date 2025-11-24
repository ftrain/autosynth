/**
 * @file PluginProcessor.h
 * @brief Phone Tones plugin processor - DTMF and telephone sound synthesizer
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <array>
#include <atomic>
#include "dsp/SynthEngine.h"

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

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    // Parameter management
    juce::AudioProcessorValueTreeState apvts;
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    // Visualization data
    const std::array<float, 512>& getVisualizationBuffer() const { return visualizationBuffer; }

private:
    SynthEngine synthEngine;
    std::array<float, 512> visualizationBuffer{};

    double currentSampleRate = 44100.0;
    int currentBlockSize = 512;

    // Cached parameter pointers for lock-free audio thread access
    std::atomic<float>* toneModeParam = nullptr;
    std::atomic<float>* tone1FreqParam = nullptr;
    std::atomic<float>* tone2FreqParam = nullptr;
    std::atomic<float>* toneMixParam = nullptr;
    std::atomic<float>* filterLowParam = nullptr;
    std::atomic<float>* filterHighParam = nullptr;
    std::atomic<float>* filterDriveParam = nullptr;
    std::atomic<float>* noiseLevelParam = nullptr;
    std::atomic<float>* noiseCrackleParam = nullptr;
    std::atomic<float>* patternRateParam = nullptr;
    std::atomic<float>* patternDutyParam = nullptr;
    std::atomic<float>* ampAttackParam = nullptr;
    std::atomic<float>* ampDecayParam = nullptr;
    std::atomic<float>* ampSustainParam = nullptr;
    std::atomic<float>* ampReleaseParam = nullptr;
    std::atomic<float>* masterLevelParam = nullptr;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginProcessor)
};
