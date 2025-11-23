/**
 * @file PluginProcessor.cpp
 * @brief Implementation of the Phoneme formant synthesizer processor
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
    oscWaveformParam = apvts.getRawParameterValue("osc_waveform");
    oscTuneParam = apvts.getRawParameterValue("osc_tune");
    oscPwParam = apvts.getRawParameterValue("osc_pw");
    vowelParam = apvts.getRawParameterValue("vowel");
    formantShiftParam = apvts.getRawParameterValue("formant_shift");
    formantSpreadParam = apvts.getRawParameterValue("formant_spread");
    vibratoRateParam = apvts.getRawParameterValue("vibrato_rate");
    vibratoDepthParam = apvts.getRawParameterValue("vibrato_depth");
    vowelLfoRateParam = apvts.getRawParameterValue("vowel_lfo_rate");
    vowelLfoDepthParam = apvts.getRawParameterValue("vowel_lfo_depth");
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
    // SOURCE PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc_waveform", 1},
        "Waveform",
        juce::StringArray{"Saw", "Pulse"},
        0  // Default: Saw
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc_tune", 1},
        "Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc_pw", 1},
        "Pulse Width",
        juce::NormalisableRange<float>(0.05f, 0.95f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // FORMANT PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vowel", 1},
        "Vowel",
        juce::StringArray{"A", "E", "I", "O", "U"},
        0  // Default: A
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"formant_shift", 1},
        "Formant Shift",
        juce::NormalisableRange<float>(-12.0f, 12.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"formant_spread", 1},
        "Spread",
        juce::NormalisableRange<float>(0.5f, 2.0f, 0.01f),
        1.0f
    ));

    // =========================================================================
    // VIBRATO PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vibrato_rate", 1},
        "Vibrato Rate",
        juce::NormalisableRange<float>(0.1f, 10.0f, 0.01f),
        5.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vibrato_depth", 1},
        "Vibrato Depth",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // VOWEL LFO PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vowel_lfo_rate", 1},
        "Vowel LFO Rate",
        juce::NormalisableRange<float>(0.01f, 5.0f, 0.01f),
        0.5f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vowel_lfo_depth", 1},
        "Vowel LFO Depth",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // AMPLITUDE ENVELOPE
    // =========================================================================

    auto timeRange = juce::NormalisableRange<float>(0.001f, 5.0f, 0.001f);

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_attack", 1},
        "Attack",
        timeRange,
        0.01f,
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
        0.7f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"amp_release", 1},
        "Release",
        timeRange,
        0.3f,
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
    int waveform = static_cast<int>(oscWaveformParam->load());
    float tune = oscTuneParam->load();
    float pulseWidth = oscPwParam->load();
    float vowel = vowelParam->load();
    float formantShift = formantShiftParam->load();
    float formantSpread = formantSpreadParam->load();
    float vibratoRate = vibratoRateParam->load();
    float vibratoDepth = vibratoDepthParam->load();
    float vowelLfoRate = vowelLfoRateParam->load();
    float vowelLfoDepth = vowelLfoDepthParam->load();
    float attack = ampAttackParam->load();
    float decay = ampDecayParam->load();
    float sustain = ampSustainParam->load();
    float release = ampReleaseParam->load();
    float masterLevel = masterLevelParam->load();

    // Update synth engine parameters
    synthEngine.setWaveform(waveform);
    synthEngine.setTune(tune);
    synthEngine.setPulseWidth(pulseWidth);
    synthEngine.setVowel(vowel);
    synthEngine.setFormantShift(formantShift);
    synthEngine.setFormantSpread(formantSpread);
    synthEngine.setVibratoRate(vibratoRate);
    synthEngine.setVibratoDepth(vibratoDepth);
    synthEngine.setVowelLfoRate(vowelLfoRate);
    synthEngine.setVowelLfoDepth(vowelLfoDepth);
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
        else if (message.isPitchWheel())
        {
            float pitchBend = (message.getPitchWheelValue() - 8192) / 8192.0f;
            synthEngine.setPitchBend(pitchBend);
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
