/**
 * @file PluginEditor.h
 * @brief WebView-based editor for Tape Loop synthesizer
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
    //==========================================================================
    // Lifecycle
    //==========================================================================

    explicit PluginEditor(PluginProcessor&);
    ~PluginEditor() override;

    //==========================================================================
    // Component
    //==========================================================================

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    //==========================================================================
    // Timer
    //==========================================================================

    void timerCallback() override;

    //==========================================================================
    // WebView Bridge
    //==========================================================================

    void sendParameterToWebView(const juce::String& paramId, float value);
    void sendAllParametersToWebView();
    void sendAudioDataToWebView();
    void handleParameterFromWebView(const juce::String& paramId, float value);
    void handleNoteFromWebView(int note, float velocity, bool isNoteOn);
    std::optional<juce::WebBrowserComponent::Resource> getResource(const juce::String& url);

    //==========================================================================
    // Parameter Listener
    //==========================================================================

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

    //==========================================================================
    // Members
    //==========================================================================

    PluginProcessor& processorRef;

#if JUCE_WEB_BROWSER
    std::unique_ptr<juce::WebBrowserComponent> webView;
#endif

    std::unique_ptr<ParameterListener> paramListener;
    bool ignoreParameterCallbacks = false;

    //==========================================================================
    // Dimensions
    //==========================================================================

    static constexpr int DEFAULT_WIDTH = 700;
    static constexpr int DEFAULT_HEIGHT = 500;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginEditor)
};
