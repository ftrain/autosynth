/**
 * @file PluginProcessor.cpp
 * @brief DFAM - Drum From Another Machine
 *
 * A clone of the Moog DFAM percussion synthesizer.
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
    // TRANSPORT
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tempo", 1},
        "Tempo",
        juce::NormalisableRange<float>(20.0f, 300.0f, 1.0f),
        120.0f,
        juce::AudioParameterFloatAttributes().withLabel("BPM")
    ));

    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"running", 1},
        "Running",
        false
    ));

    // =========================================================================
    // VCO1 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vco1_freq", 1},
        "VCO1 Frequency",
        juce::NormalisableRange<float>(20.0f, 2000.0f, 1.0f, 0.3f),
        110.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vco1_wave", 1},
        "VCO1 Waveform",
        juce::StringArray{"Saw", "Square", "Triangle", "Sine"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vco1_level", 1},
        "VCO1 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // VCO2 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vco2_freq", 1},
        "VCO2 Frequency",
        juce::NormalisableRange<float>(20.0f, 2000.0f, 1.0f, 0.3f),
        110.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vco2_wave", 1},
        "VCO2 Waveform",
        juce::StringArray{"Saw", "Square", "Triangle", "Sine"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vco2_level", 1},
        "VCO2 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // FM
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"fm_amount", 1},
        "FM Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // NOISE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"noise_level", 1},
        "Noise Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // FILTER PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_cutoff", 1},
        "Filter Cutoff",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 1.0f, 0.3f),
        5000.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_reso", 1},
        "Filter Resonance",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_env_amount", 1},
        "Filter Env Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // PITCH ENVELOPE (VCO)
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pitch_env_attack", 1},
        "Pitch Env Attack",
        juce::NormalisableRange<float>(0.001f, 2.0f, 0.001f),
        0.001f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pitch_env_decay", 1},
        "Pitch Env Decay",
        juce::NormalisableRange<float>(0.001f, 2.0f, 0.001f),
        0.3f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pitch_env_amount", 1},
        "Pitch Env Amount",
        juce::NormalisableRange<float>(0.0f, 48.0f, 0.1f),
        24.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    // =========================================================================
    // VCF/VCA ENVELOPE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf_vca_attack", 1},
        "VCF/VCA Attack",
        juce::NormalisableRange<float>(0.001f, 2.0f, 0.001f),
        0.001f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf_vca_decay", 1},
        "VCF/VCA Decay",
        juce::NormalisableRange<float>(0.001f, 2.0f, 0.001f),
        0.5f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    // =========================================================================
    // SEQUENCER STEP PITCHES (8 steps)
    // =========================================================================

    for (int i = 0; i < 8; ++i)
    {
        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{"seq_pitch_" + juce::String(i), 1},
            "Step " + juce::String(i + 1) + " Pitch",
            juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
            0.0f,
            juce::AudioParameterFloatAttributes().withLabel("st")
        ));
    }

    // =========================================================================
    // SEQUENCER STEP VELOCITIES (8 steps)
    // =========================================================================

    for (int i = 0; i < 8; ++i)
    {
        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID{"seq_vel_" + juce::String(i), 1},
            "Step " + juce::String(i + 1) + " Velocity",
            juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
            1.0f
        ));
    }

    // =========================================================================
    // MASTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_volume", 1},
        "Master Volume",
        juce::NormalisableRange<float>(-60.0f, 0.0f, 0.1f),
        -6.0f,
        juce::AudioParameterFloatAttributes().withLabel("dB")
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
    float tempo = *apvts.getRawParameterValue("tempo");
    bool running = *apvts.getRawParameterValue("running") > 0.5f;

    float vco1Freq = *apvts.getRawParameterValue("vco1_freq");
    int vco1Wave = static_cast<int>(*apvts.getRawParameterValue("vco1_wave"));
    float vco1Level = *apvts.getRawParameterValue("vco1_level");

    float vco2Freq = *apvts.getRawParameterValue("vco2_freq");
    int vco2Wave = static_cast<int>(*apvts.getRawParameterValue("vco2_wave"));
    float vco2Level = *apvts.getRawParameterValue("vco2_level");

    float fmAmount = *apvts.getRawParameterValue("fm_amount");
    float noiseLevel = *apvts.getRawParameterValue("noise_level");

    float filterCutoff = *apvts.getRawParameterValue("filter_cutoff");
    float filterReso = *apvts.getRawParameterValue("filter_reso");
    float filterEnvAmount = *apvts.getRawParameterValue("filter_env_amount");

    float pitchEnvAttack = *apvts.getRawParameterValue("pitch_env_attack");
    float pitchEnvDecay = *apvts.getRawParameterValue("pitch_env_decay");
    float pitchEnvAmount = *apvts.getRawParameterValue("pitch_env_amount");

    float vcfVcaAttack = *apvts.getRawParameterValue("vcf_vca_attack");
    float vcfVcaDecay = *apvts.getRawParameterValue("vcf_vca_decay");

    float masterVolume = *apvts.getRawParameterValue("master_volume");

    // Update synth engine parameters
    synthEngine.setTempo(tempo);
    synthEngine.setRunning(running);

    synthEngine.setVCO1Frequency(vco1Freq);
    synthEngine.setVCO1Waveform(vco1Wave);
    synthEngine.setVCO1Level(vco1Level);

    synthEngine.setVCO2Frequency(vco2Freq);
    synthEngine.setVCO2Waveform(vco2Wave);
    synthEngine.setVCO2Level(vco2Level);

    synthEngine.setFMAmount(fmAmount);
    synthEngine.setNoiseLevel(noiseLevel);

    synthEngine.setFilterCutoff(filterCutoff);
    synthEngine.setFilterResonance(filterReso);
    synthEngine.setFilterEnvAmount(filterEnvAmount);

    synthEngine.setPitchEnvAttack(pitchEnvAttack);
    synthEngine.setPitchEnvDecay(pitchEnvDecay);
    synthEngine.setPitchEnvAmount(pitchEnvAmount);

    synthEngine.setVCFVCAEnvAttack(vcfVcaAttack);
    synthEngine.setVCFVCAEnvDecay(vcfVcaDecay);

    synthEngine.setMasterVolume(masterVolume);

    // Update sequencer steps
    for (int i = 0; i < 8; ++i)
    {
        float pitch = *apvts.getRawParameterValue("seq_pitch_" + juce::String(i));
        float velocity = *apvts.getRawParameterValue("seq_vel_" + juce::String(i));
        synthEngine.setStepPitch(i, pitch);
        synthEngine.setStepVelocity(i, velocity);
    }

    // Handle MIDI messages (for manual triggering)
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
