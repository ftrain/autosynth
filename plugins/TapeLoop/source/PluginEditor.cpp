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
    setResizeLimits(500, 400, 1200, 900);

#if JUCE_WEB_BROWSER
    auto options = juce::WebBrowserComponent::Options{}
        .withNativeIntegrationEnabled()
        .withResourceProvider(
            [this](const juce::String& url) -> std::optional<juce::WebBrowserComponent::Resource>
            {
                return getResource(url);
            }
        )
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
        .withNativeFunction("consoleLog",
            [](const juce::Array<juce::var>& args, juce::WebBrowserComponent::NativeFunctionCompletion completion)
            {
                juce::String message;
                for (const auto& arg : args)
                    message += arg.toString() + " ";
                DBG("WebView console: " + message);
                completion({});
            });

    webView = std::make_unique<juce::WebBrowserComponent>(options);
    addAndMakeVisible(*webView);

#ifdef HAS_UI_RESOURCES
    webView->goToURL(juce::WebBrowserComponent::getResourceProviderRoot());
#else
    webView->goToURL("http://localhost:5173");
#endif

    juce::Timer::callAfterDelay(100, [this]() {
        if (webView)
        {
            auto bounds = getLocalBounds();
            webView->setBounds(0, 0, 0, 0);
            webView->setBounds(bounds);
            repaint();
        }
    });
#endif

    paramListener = std::make_unique<ParameterListener>(*this);
    for (auto* param : processorRef.apvts.processor.getParameters())
    {
        if (auto* paramWithID = dynamic_cast<juce::AudioProcessorParameterWithID*>(param))
        {
            processorRef.apvts.addParameterListener(paramWithID->getParameterID(), paramListener.get());
        }
    }

    startTimerHz(30);
}

PluginEditor::~PluginEditor()
{
    stopTimer();

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
        param->setValueNotifyingHost(value);
    }

    ignoreParameterCallbacks = false;
}

void PluginEditor::handleNoteFromWebView(int note, float velocity, bool isNoteOn)
{
    juce::ignoreUnused(note, velocity, isNoteOn);
}

std::optional<juce::WebBrowserComponent::Resource> PluginEditor::getResource(const juce::String& url)
{
    DBG("Resource request: " + url);

#ifdef HAS_UI_RESOURCES
    juce::String path = url;

    auto root = juce::WebBrowserComponent::getResourceProviderRoot();
    if (path.startsWith(root))
        path = path.substring(root.length());

    if (path.isEmpty() || path == "/" || path == "index.html")
    {
        juce::WebBrowserComponent::Resource resource;
        resource.data = std::vector<std::byte>(
            reinterpret_cast<const std::byte*>(UIResources::index_html),
            reinterpret_cast<const std::byte*>(UIResources::index_html) + UIResources::index_htmlSize
        );
        resource.mimeType = "text/html";
        DBG("Serving index.html, size: " + juce::String(UIResources::index_htmlSize));
        return resource;
    }

    DBG("Resource not found: " + path);
#else
    juce::ignoreUnused(url);
#endif

    return std::nullopt;
}
