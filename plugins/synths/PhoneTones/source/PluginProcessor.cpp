/**
 * @file PluginProcessor.cpp
 * @brief Implementation of the Phone Tones plugin processor
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
    toneModeParam = apvts.getRawParameterValue("tone_mode");
    tone1FreqParam = apvts.getRawParameterValue("tone1_freq");
    tone2FreqParam = apvts.getRawParameterValue("tone2_freq");
    toneMixParam = apvts.getRawParameterValue("tone_mix");
    filterLowParam = apvts.getRawParameterValue("filter_low");
    filterHighParam = apvts.getRawParameterValue("filter_high");
    filterDriveParam = apvts.getRawParameterValue("filter_drive");
    noiseLevelParam = apvts.getRawParameterValue("noise_level");
    noiseCrackleParam = apvts.getRawParameterValue("noise_crackle");
    patternRateParam = apvts.getRawParameterValue("pattern_rate");
    patternDutyParam = apvts.getRawParameterValue("pattern_duty");
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
    // TONE MODE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"tone_mode", 1},
        "Tone Mode",
        juce::StringArray{"Dial", "Busy", "Ring", "DTMF", "Modem", "Custom"},
        0  // Default: Dial
    ));

    // =========================================================================
    // TONE FREQUENCIES
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tone1_freq", 1},
        "Tone 1 Freq",
        juce::NormalisableRange<float>(200.0f, 2000.0f, 1.0f, 0.5f),
        440.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tone2_freq", 1},
        "Tone 2 Freq",
        juce::NormalisableRange<float>(200.0f, 2000.0f, 1.0f, 0.5f),
        480.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tone_mix", 1},
        "Tone Mix",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // TELEPHONE FILTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_low", 1},
        "Filter Low",
        juce::NormalisableRange<float>(200.0f, 500.0f, 1.0f),
        300.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_high", 1},
        "Filter High",
        juce::NormalisableRange<float>(2500.0f, 4000.0f, 1.0f),
        3400.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_drive", 1},
        "Drive",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.2f
    ));

    // =========================================================================
    // NOISE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"noise_level", 1},
        "Noise Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.1f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"noise_crackle", 1},
        "Crackle",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.1f
    ));

    // =========================================================================
    // PATTERN
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pattern_rate", 1},
        "Pattern Rate",
        juce::NormalisableRange<float>(0.1f, 10.0f, 0.01f, 0.5f),
        2.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pattern_duty", 1},
        "Duty Cycle",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // AMPLITUDE ENVELOPE
    // =========================================================================

    auto timeRange = juce::NormalisableRange<float>(0.001f, 2.0f, 0.001f);

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_attack", 1},
        "Attack",
        timeRange,
        0.005f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_decay", 1},
        "Decay",
        timeRange,
        0.1f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_sustain", 1},
        "Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        1.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_release", 1},
        "Release",
        timeRange,
        0.05f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    // =========================================================================
    // MASTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_level", 1},
        "Level",
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

    // Read parameters (lock-free via atomics)
    int toneMode = static_cast<int>(toneModeParam->load());
    float tone1Freq = tone1FreqParam->load();
    float tone2Freq = tone2FreqParam->load();
    float toneMix = toneMixParam->load();
    float filterLow = filterLowParam->load();
    float filterHigh = filterHighParam->load();
    float filterDrive = filterDriveParam->load();
    float noiseLevel = noiseLevelParam->load();
    float noiseCrackle = noiseCrackleParam->load();
    float patternRate = patternRateParam->load();
    float patternDuty = patternDutyParam->load();
    float attack = ampAttackParam->load();
    float decay = ampDecayParam->load();
    float sustain = ampSustainParam->load();
    float release = ampReleaseParam->load();
    float masterLevel = masterLevelParam->load();

    // Update synth engine parameters
    synthEngine.setToneMode(toneMode);
    synthEngine.setTone1Freq(tone1Freq);
    synthEngine.setTone2Freq(tone2Freq);
    synthEngine.setToneMix(toneMix);
    synthEngine.setFilterLow(filterLow);
    synthEngine.setFilterHigh(filterHigh);
    synthEngine.setFilterDrive(filterDrive);
    synthEngine.setNoiseLevel(noiseLevel);
    synthEngine.setNoiseCrackle(noiseCrackle);
    synthEngine.setPatternRate(patternRate);
    synthEngine.setPatternDuty(patternDuty);
    synthEngine.setAttack(attack);
    synthEngine.setDecay(decay);
    synthEngine.setSustain(sustain);
    synthEngine.setRelease(release);
    synthEngine.setMasterLevel(masterLevel);

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
    }

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
