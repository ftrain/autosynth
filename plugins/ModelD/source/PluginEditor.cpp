/**
 * @file PluginEditor.cpp
 * @brief WebView-based editor implementation
 */

#include "PluginEditor.h"

#ifdef HAS_UI_RESOURCES
#include "UIResources.h"
#endif

namespace
{
    // Get MIME type from file extension
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
    setResizeLimits(600, 400, 1400, 900);

    // Build WebView options with resource provider
    // On Linux: uses juce://juce.backend/ scheme
    // On Windows: uses https://juce.backend/ scheme
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

    // Navigate to the resource provider root (which serves index.html for "/")
#ifdef HAS_UI_RESOURCES
    // Use JUCE's built-in resource provider URL scheme
    webView->goToURL(juce::WebBrowserComponent::getResourceProviderRoot());
#else
    // Development: use Vite dev server or HTTP server
    webView->goToURL("http://localhost:8080");
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

    startTimerHz(30);

    // Force a resize after a short delay to fix GTK WebView sizing
    juce::Timer::callAfterDelay(100, [this]() {
        if (webView)
        {
            auto bounds = getLocalBounds();
            webView->setBounds(0, 0, 0, 0);  // Reset
            webView->setBounds(bounds);       // Set correct size
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
    // Parse the URL path
    juce::String path = url;

    // Remove the JUCE resource provider root if present
    // On Linux: juce://juce.backend/
    // On Windows: https://juce.backend/
    auto root = juce::WebBrowserComponent::getResourceProviderRoot();
    if (path.startsWith(root))
        path = path.substring(root.length());

    // Handle root path - serve index.html
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
