/**
 * @file PluginProcessor.cpp
 * @brief SID Wave audio processor implementation
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
    osc1WaveParam = apvts.getRawParameterValue("osc1_wave");
    osc1TuneParam = apvts.getRawParameterValue("osc1_tune");
    osc1PWParam = apvts.getRawParameterValue("osc1_pw");
    osc1LevelParam = apvts.getRawParameterValue("osc1_level");

    osc2WaveParam = apvts.getRawParameterValue("osc2_wave");
    osc2TuneParam = apvts.getRawParameterValue("osc2_tune");
    osc2PWParam = apvts.getRawParameterValue("osc2_pw");
    osc2LevelParam = apvts.getRawParameterValue("osc2_level");
    osc2RingParam = apvts.getRawParameterValue("osc2_ring");

    osc3WaveParam = apvts.getRawParameterValue("osc3_wave");
    osc3TuneParam = apvts.getRawParameterValue("osc3_tune");
    osc3LevelParam = apvts.getRawParameterValue("osc3_level");

    bitDepthParam = apvts.getRawParameterValue("bit_depth");
    sampleRateParam = apvts.getRawParameterValue("sample_rate");

    filterCutoffParam = apvts.getRawParameterValue("filter_cutoff");
    filterResoParam = apvts.getRawParameterValue("filter_reso");
    filterTypeParam = apvts.getRawParameterValue("filter_type");

    ampAttackParam = apvts.getRawParameterValue("amp_attack");
    ampDecayParam = apvts.getRawParameterValue("amp_decay");
    ampSustainParam = apvts.getRawParameterValue("amp_sustain");
    ampReleaseParam = apvts.getRawParameterValue("amp_release");

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

    // =========================================================================
    // OSCILLATOR 1
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc1_wave", 1},
        "Osc 1 Wave",
        juce::StringArray{"Pulse", "Saw", "Triangle", "Noise"},
        1  // Default: Saw
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_tune", 1},
        "Osc 1 Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_pw", 1},
        "Osc 1 PW",
        juce::NormalisableRange<float>(0.05f, 0.95f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_level", 1},
        "Osc 1 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.8f
    ));

    // =========================================================================
    // OSCILLATOR 2
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc2_wave", 1},
        "Osc 2 Wave",
        juce::StringArray{"Pulse", "Saw", "Triangle", "Noise"},
        0  // Default: Pulse
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_tune", 1},
        "Osc 2 Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_pw", 1},
        "Osc 2 PW",
        juce::NormalisableRange<float>(0.05f, 0.95f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_level", 1},
        "Osc 2 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_ring", 1},
        "Osc 2 Ring",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // OSCILLATOR 3
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc3_wave", 1},
        "Osc 3 Wave",
        juce::StringArray{"Pulse", "Saw", "Triangle", "Noise"},
        2  // Default: Triangle
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc3_tune", 1},
        "Osc 3 Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc3_level", 1},
        "Osc 3 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.3f
    ));

    // =========================================================================
    // LO-FI (8-BIT CHARACTER)
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"bit_depth", 1},
        "Bit Depth",
        juce::NormalisableRange<float>(4.0f, 16.0f, 1.0f),
        8.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sample_rate", 1},
        "Sample Rate",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        1.0f  // Full rate by default
    ));

    // =========================================================================
    // FILTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_cutoff", 1},
        "Filter Cutoff",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 1.0f, 0.3f),  // Log skew
        8000.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_reso", 1},
        "Filter Resonance",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.2f
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"filter_type", 1},
        "Filter Type",
        juce::StringArray{"LP", "BP", "HP"},
        0  // Default: LP
    ));

    // =========================================================================
    // AMPLITUDE ENVELOPE
    // =========================================================================

    auto timeRange = juce::NormalisableRange<float>(0.001f, 2.0f, 0.001f);

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_attack", 1},
        "Amp Attack",
        timeRange,
        0.01f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_decay", 1},
        "Amp Decay",
        timeRange,
        0.2f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_sustain", 1},
        "Amp Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.7f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_release", 1},
        "Amp Release",
        timeRange,
        0.3f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    // =========================================================================
    // MASTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_level", 1},
        "Master Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.8f
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

    synthEngine.prepare(sampleRate, samplesPerBlock);

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
    juce::ScopedNoDenormals noDenormals;

    buffer.clear();

    auto* leftChannel = buffer.getWritePointer(0);
    auto* rightChannel = buffer.getWritePointer(1);
    const int numSamples = buffer.getNumSamples();

    // Read parameters
    int osc1Wave = static_cast<int>(osc1WaveParam->load());
    float osc1Tune = osc1TuneParam->load();
    float osc1PW = osc1PWParam->load();
    float osc1Level = osc1LevelParam->load();

    int osc2Wave = static_cast<int>(osc2WaveParam->load());
    float osc2Tune = osc2TuneParam->load();
    float osc2PW = osc2PWParam->load();
    float osc2Level = osc2LevelParam->load();
    float osc2Ring = osc2RingParam->load();

    int osc3Wave = static_cast<int>(osc3WaveParam->load());
    float osc3Tune = osc3TuneParam->load();
    float osc3Level = osc3LevelParam->load();

    int bitDepth = static_cast<int>(bitDepthParam->load());
    float sampleRate = sampleRateParam->load();

    float filterCutoff = filterCutoffParam->load();
    float filterReso = filterResoParam->load();
    int filterType = static_cast<int>(filterTypeParam->load());

    float ampAttack = ampAttackParam->load();
    float ampDecay = ampDecayParam->load();
    float ampSustain = ampSustainParam->load();
    float ampRelease = ampReleaseParam->load();

    float masterLevel = masterLevelParam->load();

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

    // Update synth engine parameters
    synthEngine.setOsc1Wave(osc1Wave);
    synthEngine.setOsc1Tune(osc1Tune);
    synthEngine.setOsc1PW(osc1PW);
    synthEngine.setOsc1Level(osc1Level);

    synthEngine.setOsc2Wave(osc2Wave);
    synthEngine.setOsc2Tune(osc2Tune);
    synthEngine.setOsc2PW(osc2PW);
    synthEngine.setOsc2Level(osc2Level);
    synthEngine.setOsc2Ring(osc2Ring);

    synthEngine.setOsc3Wave(osc3Wave);
    synthEngine.setOsc3Tune(osc3Tune);
    synthEngine.setOsc3Level(osc3Level);

    synthEngine.setBitDepth(bitDepth);
    synthEngine.setSampleRate(sampleRate);

    synthEngine.setFilterCutoff(filterCutoff);
    synthEngine.setFilterReso(filterReso);
    synthEngine.setFilterType(filterType);

    synthEngine.setAmpAttack(ampAttack);
    synthEngine.setAmpDecay(ampDecay);
    synthEngine.setAmpSustain(ampSustain);
    synthEngine.setAmpRelease(ampRelease);

    synthEngine.setMasterLevel(masterLevel);

    // Render audio
    synthEngine.renderBlock(leftChannel, rightChannel, numSamples);

    // Copy to visualization buffer
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
