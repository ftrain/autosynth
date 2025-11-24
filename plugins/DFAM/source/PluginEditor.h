/**
 * @file PluginEditor.h
 * @brief WebView-based editor for the synthesizer UI
 *
 * This editor hosts a React WebView interface. The actual UI is built
 * with React components from the shared component library.
 *
 * Communication between JUCE and React happens via the WebView bridge:
 * - JUCE -> React: Parameter updates, audio data
 * - React -> JUCE: Parameter changes, MIDI events
 */

#pragma once

#include <optional>
#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include "PluginProcessor.h"

/**
 * @brief WebView-based plugin editor
 *
 * Hosts the React UI in a WebBrowserComponent and manages
 * bi-directional communication with the processor.
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

    /** Send parameter update to WebView */
    void sendParameterToWebView(const juce::String& paramId, float value);

    /** Send all parameters to WebView (for initial sync) */
    void sendAllParametersToWebView();

    /** Send audio data to WebView for visualization */
    void sendAudioDataToWebView();

    /** Send sequencer state to WebView for step highlighting */
    void sendSequencerStateToWebView();

    /** Handle parameter change from WebView */
    void handleParameterFromWebView(const juce::String& paramId, float value);

    /** Handle MIDI note from WebView keyboard */
    void handleNoteFromWebView(int note, float velocity, bool isNoteOn);

    /** Get embedded resource for WebView */
    std::optional<juce::WebBrowserComponent::Resource> getResource(const juce::String& url);

    //==========================================================================
    // Members
    //==========================================================================

    PluginProcessor& processorRef;

    std::unique_ptr<juce::WebBrowserComponent> webView;

    /** Parameter listener for automation */
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

    /** Flag to prevent feedback loops */
    bool ignoreParameterCallbacks = false;

    //==========================================================================
    // Constants
    //==========================================================================
    static constexpr int DEFAULT_WIDTH = 800;
    static constexpr int DEFAULT_HEIGHT = 600;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginEditor)
};
