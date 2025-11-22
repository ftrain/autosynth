/**
 * @file PluginEditor.h
 * @brief WebView-based editor for the synthesizer UI
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include "PluginProcessor.h"

/**
 * @brief WebView-based plugin editor
 */
class PluginEditor : public juce::AudioProcessorEditor,
                     private juce::Timer
{
public:
    explicit PluginEditor(PluginProcessor& processor);
    ~PluginEditor() override;

    void paint(juce::Graphics& g) override;
    void resized() override;

private:
    void timerCallback() override;

    void sendParameterToWebView(const juce::String& paramId, float value);
    void sendAllParametersToWebView();
    void sendAudioDataToWebView();
    void handleParameterFromWebView(const juce::String& paramId, float value);
    void handleNoteFromWebView(int note, float velocity, bool isNoteOn);

    PluginProcessor& processorRef;

    std::unique_ptr<juce::WebBrowserComponent> webView;

    struct ParameterListener : public juce::AudioProcessorValueTreeState::Listener
    {
        PluginEditor& editor;
        explicit ParameterListener(PluginEditor& e) : editor(e) {}
        void parameterChanged(const juce::String& paramId, float newValue) override
        {
            editor.sendParameterToWebView(paramId, newValue);
        }
    };
    std::unique_ptr<ParameterListener> paramListener;

    bool ignoreParameterCallbacks = false;

    static constexpr int DEFAULT_WIDTH = 900;
    static constexpr int DEFAULT_HEIGHT = 600;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginEditor)
};
