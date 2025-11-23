/**
 * @file PluginEditor.cpp
 * @brief WebView-based editor implementation for DFAM
 */

#include "PluginEditor.h"

#ifdef HAS_UI_RESOURCES
#include "UIResources.h"
#endif

namespace
{
    juce::String getMimeType(const juce::String& path)
    {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js"))   return "application/javascript";
        if (path.endsWith(".css"))  return "text/css";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".png"))  return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".svg"))  return "image/svg+xml";
        if (path.endsWith(".woff")) return "font/woff";
        if (path.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }
}

PluginEditor::PluginEditor(PluginProcessor& p)
    : AudioProcessorEditor(&p)
    , processorRef(p)
{
    setSize(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    setResizable(true, true);
    setResizeLimits(400, 300, 1600, 1200);

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

    paramListener = std::make_unique<ParameterListener>(*this);
    for (auto* param : processorRef.apvts.processor.getParameters())
    {
        if (auto* paramWithID = dynamic_cast<juce::AudioProcessorParameterWithID*>(param))
        {
            processorRef.apvts.addParameterListener(paramWithID->getParameterID(), paramListener.get());
        }
    }

    startTimerHz(30);

    // Force a resize after a short delay to fix GTK WebView sizing
    juce::Timer::callAfterDelay(100, [this]() {
        if (webView)
        {
            auto bounds = getLocalBounds();
            webView->setBounds(0, 0, 0, 0);
            webView->setBounds(bounds);
            repaint();
        }
    });
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

void PluginEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colours::black);
}

void PluginEditor::resized()
{
    if (webView)
        webView->setBounds(getLocalBounds());
}

void PluginEditor::timerCallback()
{
    sendAudioDataToWebView();
}

void PluginEditor::sendParameterToWebView(const juce::String& paramId, float value)
{
    if (ignoreParameterCallbacks || !webView)
        return;

    juce::String script = "if (window.onParameterUpdate) window.onParameterUpdate('"
                        + paramId + "', " + juce::String(value) + ");";
    webView->evaluateJavascript(script, nullptr);
}

void PluginEditor::sendAllParametersToWebView()
{
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
}

void PluginEditor::sendAudioDataToWebView()
{
    if (!webView)
        return;

    const auto& audioData = processorRef.getVisualizationBuffer();

    juce::Array<juce::var> samples;
    samples.ensureStorageAllocated(128);

    for (int i = 0; i < 128; ++i)
    {
        int srcIndex = (i * static_cast<int>(audioData.size())) / 128;
        samples.add(audioData[static_cast<size_t>(srcIndex)]);
    }

    juce::var samplesVar(samples);
    juce::String json = juce::JSON::toString(samplesVar);
    juce::String script = "if (window.onAudioData) window.onAudioData(" + json + ");";
    webView->evaluateJavascript(script, nullptr);
}

void PluginEditor::handleParameterFromWebView(const juce::String& paramId, float value)
{
    ignoreParameterCallbacks = true;

    if (auto* param = processorRef.apvts.getParameter(paramId))
        param->setValueNotifyingHost(value);

    ignoreParameterCallbacks = false;
}

void PluginEditor::handleNoteFromWebView(int note, float velocity, bool isNoteOn)
{
    juce::ignoreUnused(note, velocity, isNoteOn);
}
