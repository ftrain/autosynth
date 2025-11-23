/**
 * @file PluginProcessor.cpp
 * @brief FM Drone audio processor implementation
 */

#include "PluginProcessor.h"
#include "PluginEditor.h"

//==============================================================================
// Constructor / Destructor
//==============================================================================

PluginProcessor::PluginProcessor()
    : AudioProcessor(BusesProperties()
                     .withOutput("Output", juce::AudioChannelSet::stereo(), true))
    , apvts(*this, nullptr, "Parameters", createParameterLayout())
{
    // Cache parameter pointers for lock-free audio thread access
    carrierRatioParam = apvts.getRawParameterValue("carrier_ratio");
    carrierLevelParam = apvts.getRawParameterValue("carrier_level");
    modRatioParam = apvts.getRawParameterValue("mod_ratio");
    modDepthParam = apvts.getRawParameterValue("mod_depth");
    modFeedbackParam = apvts.getRawParameterValue("mod_feedback");
    modAttackParam = apvts.getRawParameterValue("mod_attack");
    modDecayParam = apvts.getRawParameterValue("mod_decay");
    modSustainParam = apvts.getRawParameterValue("mod_sustain");
    modReleaseParam = apvts.getRawParameterValue("mod_release");
    ampAttackParam = apvts.getRawParameterValue("amp_attack");
    ampDecayParam = apvts.getRawParameterValue("amp_decay");
    ampSustainParam = apvts.getRawParameterValue("amp_sustain");
    ampReleaseParam = apvts.getRawParameterValue("amp_release");
    driftRateParam = apvts.getRawParameterValue("drift_rate");
    driftAmountParam = apvts.getRawParameterValue("drift_amount");
    masterLevelParam = apvts.getRawParameterValue("master_level");
}

PluginProcessor::~PluginProcessor()
{
}

//==============================================================================
// Parameter Layout
//==============================================================================

juce::AudioProcessorValueTreeState::ParameterLayout PluginProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // Long envelope time range (up to 30 seconds for drones)
    auto timeRange = juce::NormalisableRange<float>(0.001f, 30.0f, 0.001f);

    // =========================================================================
    // CARRIER PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"carrier_ratio", 1},
        "Carrier Ratio",
        juce::NormalisableRange<float>(0.5f, 8.0f, 0.01f),
        1.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"carrier_level", 1},
        "Carrier Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.8f
    ));

    // =========================================================================
    // MODULATOR PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"mod_ratio", 1},
        "Mod Ratio",
        juce::NormalisableRange<float>(0.5f, 16.0f, 0.01f),
        2.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"mod_depth", 1},
        "Mod Depth",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.3f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"mod_feedback", 1},
        "Feedback",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // MODULATOR ENVELOPE (FM Envelope)
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"mod_attack", 1},
        "FM Attack",
        timeRange,
        5.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"mod_decay", 1},
        "FM Decay",
        timeRange,
        10.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"mod_sustain", 1},
        "FM Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.7f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"mod_release", 1},
        "FM Release",
        timeRange,
        8.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    // =========================================================================
    // AMPLITUDE ENVELOPE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_attack", 1},
        "Amp Attack",
        timeRange,
        3.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_decay", 1},
        "Amp Decay",
        timeRange,
        5.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_sustain", 1},
        "Amp Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.9f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_release", 1},
        "Amp Release",
        timeRange,
        10.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    // =========================================================================
    // DRIFT PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"drift_rate", 1},
        "Drift Rate",
        juce::NormalisableRange<float>(0.01f, 2.0f, 0.01f),
        0.1f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"drift_amount", 1},
        "Drift Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.2f
    ));

    // =========================================================================
    // MASTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_level", 1},
        "Master Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.7f
    ));

    return { params.begin(), params.end() };
}

//==============================================================================
// Prepare / Release
//==============================================================================

void PluginProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    currentSampleRate = sampleRate;
    currentBlockSize = samplesPerBlock;

    // Prepare synth engine
    synthEngine.prepare(sampleRate, samplesPerBlock);

    // Clear visualization buffer
    std::fill(visualizationBuffer.begin(), visualizationBuffer.end(), 0.0f);
}

void PluginProcessor::releaseResources()
{
    synthEngine.releaseResources();
}

//==============================================================================
// Process Block
//==============================================================================

void PluginProcessor::processBlock(juce::AudioBuffer<float>& buffer,
                                    juce::MidiBuffer& midiMessages)
{
    // CRITICAL: Suppress denormals for performance
    juce::ScopedNoDenormals noDenormals;

    // Clear output buffer
    buffer.clear();

    auto* leftChannel = buffer.getWritePointer(0);
    auto* rightChannel = buffer.getWritePointer(1);
    const int numSamples = buffer.getNumSamples();

    // Read parameters (lock-free via atomics)
    synthEngine.setCarrierRatio(carrierRatioParam->load());
    synthEngine.setCarrierLevel(carrierLevelParam->load());
    synthEngine.setModRatio(modRatioParam->load());
    synthEngine.setModDepth(modDepthParam->load());
    synthEngine.setModFeedback(modFeedbackParam->load());
    synthEngine.setModAttack(modAttackParam->load());
    synthEngine.setModDecay(modDecayParam->load());
    synthEngine.setModSustain(modSustainParam->load());
    synthEngine.setModRelease(modReleaseParam->load());
    synthEngine.setAmpAttack(ampAttackParam->load());
    synthEngine.setAmpDecay(ampDecayParam->load());
    synthEngine.setAmpSustain(ampSustainParam->load());
    synthEngine.setAmpRelease(ampReleaseParam->load());
    synthEngine.setDriftRate(driftRateParam->load());
    synthEngine.setDriftAmount(driftAmountParam->load());
    synthEngine.setMasterLevel(masterLevelParam->load());

    // Handle MIDI messages
    for (const auto metadata : midiMessages)
    {
        auto message = metadata.getMessage();
        int samplePosition = metadata.samplePosition;

        if (message.isNoteOn())
        {
            synthEngine.noteOn(message.getNoteNumber(),
                              message.getFloatVelocity(),
                              samplePosition);
        }
        else if (message.isNoteOff())
        {
            synthEngine.noteOff(message.getNoteNumber(), samplePosition);
        }
        else if (message.isAllNotesOff())
        {
            synthEngine.allNotesOff();
        }
        else if (message.isPitchWheel())
        {
            float pitchBend = (message.getPitchWheelValue() - 8192) / 8192.0f;
            synthEngine.setPitchBend(pitchBend);
        }
    }

    // Render audio
    synthEngine.renderBlock(leftChannel, rightChannel, numSamples);

    // Copy to visualization buffer (for UI oscilloscope)
    int copySize = std::min(numSamples, static_cast<int>(visualizationBuffer.size()));
    for (int i = 0; i < copySize; ++i)
    {
        visualizationBuffer[i] = leftChannel[i];
    }
}

//==============================================================================
// Editor
//==============================================================================

juce::AudioProcessorEditor* PluginProcessor::createEditor()
{
    return new PluginEditor(*this);
}

//==============================================================================
// State Save/Load
//==============================================================================

void PluginProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void PluginProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml(getXmlFromBinary(data, sizeInBytes));
    if (xml != nullptr && xml->hasTagName(apvts.state.getType()))
    {
        apvts.replaceState(juce::ValueTree::fromXml(*xml));
    }
}

//==============================================================================
// Plugin Instantiation
//==============================================================================

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new PluginProcessor();
}
