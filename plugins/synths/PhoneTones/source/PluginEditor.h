/**
 * @file PluginEditor.h
 * @brief Phone Tones WebView-based editor
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include "PluginProcessor.h"

class PluginEditor : public juce::AudioProcessorEditor,
                     private juce::Timer
{
public:
    static constexpr int DEFAULT_WIDTH = 600;
    static constexpr int DEFAULT_HEIGHT = 500;

    explicit PluginEditor(PluginProcessor&);
    ~PluginEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override;

    // WebView bridge methods
    void sendParameterToWebView(const juce::String& paramId, float value);
    void sendAllParametersToWebView();
    void sendAudioDataToWebView();
    void handleParameterFromWebView(const juce::String& paramId, float value);
    void handleNoteFromWebView(int note, float velocity, bool isNoteOn);
    std::optional<juce::WebBrowserComponent::Resource> getResource(const juce::String& url);

    PluginProcessor& processorRef;

#if JUCE_WEB_BROWSER
    std::unique_ptr<juce::WebBrowserComponent> webView;
#endif

    // Parameter listener for host -> UI updates
    class ParameterListener : public juce::AudioProcessorValueTreeState::Listener
    {
    public:
        explicit ParameterListener(PluginEditor& e) : editor(e) {}
        void parameterChanged(const juce::String& paramId, float newValue) override
        {
            editor.sendParameterToWebView(paramId, newValue);
        }
    private:
        PluginEditor& editor;
    };

    std::unique_ptr<ParameterListener> paramListener;
    bool ignoreParameterCallbacks = false;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginEditor)
};
