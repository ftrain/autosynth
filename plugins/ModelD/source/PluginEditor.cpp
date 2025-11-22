/**
 * @file PluginEditor.cpp
 * @brief Implementation of the WebView-based editor
 */

#include "PluginEditor.h"

#ifdef HAS_UI_RESOURCES
#include "UIResources.h"
#endif

//==============================================================================
// Constructor / Destructor
//==============================================================================

PluginEditor::PluginEditor(PluginProcessor& p)
    : AudioProcessorEditor(&p)
    , processorRef(p)
{
    setSize(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    setResizable(true, true);
    setResizeLimits(400, 300, 1600, 1200);

#if JUCE_WEB_BROWSER
    // Create WebView with native functions registered in Options
    auto options = juce::WebBrowserComponent::Options{}
        .withBackend(juce::WebBrowserComponent::Options::Backend::webview2)
        .withNativeIntegrationEnabled()
        .withNativeFunction("setParameter",
            [this](const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion completion)
            {
                if (args.size() >= 2)
                {
                    juce::String paramId = args[0].toString();
                    float value = static_cast<float>(args[1]);
                    handleParameterFromWebView(paramId, value);
                }
                completion({});
            })
        .withNativeFunction("noteOn",
            [this](const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion completion)
            {
                if (args.size() >= 2)
                {
                    int note = static_cast<int>(args[0]);
                    float velocity = static_cast<float>(args[1]);
                    handleNoteFromWebView(note, velocity, true);
                }
                completion({});
            })
        .withNativeFunction("noteOff",
            [this](const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion completion)
            {
                if (args.size() >= 1)
                {
                    int note = static_cast<int>(args[0]);
                    handleNoteFromWebView(note, 0.0f, false);
                }
                completion({});
            })
        .withNativeFunction("requestState",
            [this](const juce::Array<juce::var>&, juce::WebBrowserComponent::NativeFunctionCompletion completion)
            {
                sendAllParametersToWebView();
                completion({});
            })
        .withResourceProvider([](const juce::String& url)
            -> std::optional<juce::WebBrowserComponent::Resource>
        {
            // Serve embedded UI resources
            #ifdef HAS_UI_RESOURCES
            if (url.contains("index.html") || url == "/" || url.isEmpty())
            {
                auto data = UIResources::index_html;
                auto size = UIResources::index_htmlSize;
                return juce::WebBrowserComponent::Resource{
                    std::vector<std::byte>(
                        reinterpret_cast<const std::byte*>(data),
                        reinterpret_cast<const std::byte*>(data) + size
                    ),
                    "text/html"
                };
            }
            #endif
            return std::nullopt;
        });

    webView = std::make_unique<juce::WebBrowserComponent>(options);
    addAndMakeVisible(*webView);

    // Load UI
    #ifdef HAS_UI_RESOURCES
    webView->goToURL("resource://index.html");
    #else
    // Development mode - load from local dev server
    webView->goToURL("http://localhost:5173");
    #endif
#endif

    // Setup parameter listener
    paramListener = std::make_unique<ParameterListener>(*this);
    for (auto* param : processorRef.apvts.processor.getParameters())
    {
        if (auto* paramWithID = dynamic_cast<juce::AudioProcessorParameterWithID*>(param))
        {
            processorRef.apvts.addParameterListener(paramWithID->getParameterID(), paramListener.get());
        }
    }

    // Start timer for audio visualization updates
    startTimerHz(30); // 30fps for visualization
}

PluginEditor::~PluginEditor()
{
    stopTimer();

    // Remove parameter listeners
    for (auto* param : processorRef.apvts.processor.getParameters())
    {
        if (auto* paramWithID = dynamic_cast<juce::AudioProcessorParameterWithID*>(param))
        {
            processorRef.apvts.removeParameterListener(paramWithID->getParameterID(), paramListener.get());
        }
    }
}

//==============================================================================
// Component
//==============================================================================

void PluginEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colours::black);
}

void PluginEditor::resized()
{
#if JUCE_WEB_BROWSER
    if (webView)
    {
        webView->setBounds(getLocalBounds());
    }
#endif
}

//==============================================================================
// Timer
//==============================================================================

void PluginEditor::timerCallback()
{
    sendAudioDataToWebView();
}

//==============================================================================
// WebView Bridge
//==============================================================================

void PluginEditor::sendParameterToWebView(const juce::String& paramId, float value)
{
    if (ignoreParameterCallbacks)
        return;

#if JUCE_WEB_BROWSER
    if (webView)
    {
        juce::String script = "if (window.onParameterUpdate) window.onParameterUpdate('"
                            + paramId + "', " + juce::String(value) + ");";
        webView->evaluateJavascript(script, nullptr);
    }
#endif
}

void PluginEditor::sendAllParametersToWebView()
{
#if JUCE_WEB_BROWSER
    if (!webView)
        return;

    juce::DynamicObject::Ptr params = new juce::DynamicObject();

    for (auto* param : processorRef.apvts.processor.getParameters())
    {
        if (auto* paramWithID = dynamic_cast<juce::AudioProcessorParameterWithID*>(param))
        {
            // Get normalized value (0-1)
            float normalizedValue = param->getValue();
            params->setProperty(paramWithID->getParameterID(), normalizedValue);
        }
    }

    juce::var paramsVar(params.get());
    juce::String json = juce::JSON::toString(paramsVar);
    juce::String script = "if (window.onStateUpdate) window.onStateUpdate(" + json + ");";
    webView->evaluateJavascript(script, nullptr);
#endif
}

void PluginEditor::sendAudioDataToWebView()
{
#if JUCE_WEB_BROWSER
    if (!webView)
        return;

    const auto& audioData = processorRef.getVisualizationBuffer();

    // Downsample to 128 samples for efficiency
    juce::Array<juce::var> samples;
    samples.ensureStorageAllocated(128);

    for (int i = 0; i < 128; ++i)
    {
        int srcIndex = (i * audioData.size()) / 128;
        samples.add(audioData[srcIndex]);
    }

    juce::var samplesVar(samples);
    juce::String json = juce::JSON::toString(samplesVar);
    juce::String script = "if (window.onAudioData) window.onAudioData(" + json + ");";
    webView->evaluateJavascript(script, nullptr);
#endif
}

void PluginEditor::handleParameterFromWebView(const juce::String& paramId, float value)
{
    ignoreParameterCallbacks = true;

    if (auto* param = processorRef.apvts.getParameter(paramId))
    {
        // Value from WebView is already normalized 0-1
        param->setValueNotifyingHost(value);
    }

    ignoreParameterCallbacks = false;
}

void PluginEditor::handleNoteFromWebView(int note, float velocity, bool isNoteOn)
{
    // TODO: Implement MIDI injection if needed for on-screen keyboard
    juce::ignoreUnused(note, velocity, isNoteOn);
}
