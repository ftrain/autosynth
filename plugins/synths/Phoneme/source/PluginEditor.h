/**
 * @file PluginEditor.h
 * @brief WebView-based editor for Phoneme formant synthesizer
 */

#pragma once

#include <optional>
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

    //==========================================================================
    // Component overrides
    //==========================================================================
    void paint(juce::Graphics& g) override;
    void resized() override;

private:
    //==========================================================================
    // Timer callback for UI updates
    //==========================================================================
    void timerCallback() override;

    //==========================================================================
    // WebView bridge methods
    //==========================================================================

    void sendParameterToWebView(const juce::String& paramId, float value);
    void sendAllParametersToWebView();
    void sendAudioDataToWebView();
    void handleParameterFromWebView(const juce::String& paramId, float value);
    void handleNoteFromWebView(int note, float velocity, bool isNoteOn);
    std::optional<juce::WebBrowserComponent::Resource> getResource(const juce::String& url);

    //==========================================================================
    // Members
    //==========================================================================

    PluginProcessor& processorRef;

#if JUCE_WEB_BROWSER
    std::unique_ptr<juce::WebBrowserComponent> webView;
#endif

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

    //==========================================================================
    // Constants
    //==========================================================================
    static constexpr int DEFAULT_WIDTH = 800;
    static constexpr int DEFAULT_HEIGHT = 600;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginEditor)
};
