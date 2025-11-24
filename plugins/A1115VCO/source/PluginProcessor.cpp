/**
 * @file PluginProcessor.cpp
 * @brief Implementation of the A111-5 Mini Synthesizer Voice plugin processor
 *
 * Based on Doepfer A-111-5 with VCO, VCF, VCA, dual LFOs, and ADSR.
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
    // VCO
    oscWaveformParam = apvts.getRawParameterValue("osc_waveform");
    oscTuneParam = apvts.getRawParameterValue("osc_tune");
    oscFineParam = apvts.getRawParameterValue("osc_fine");
    pulseWidthParam = apvts.getRawParameterValue("pulse_width");
    subLevelParam = apvts.getRawParameterValue("sub_level");
    glideTimeParam = apvts.getRawParameterValue("glide_time");
    monoModeParam = apvts.getRawParameterValue("mono_mode");
    vcoFMSourceParam = apvts.getRawParameterValue("vco_fm_source");
    vcoFMAmountParam = apvts.getRawParameterValue("vco_fm_amount");
    vcoPWMSourceParam = apvts.getRawParameterValue("vco_pwm_source");
    vcoPWMAmountParam = apvts.getRawParameterValue("vco_pwm_amount");

    // VCF
    vcfCutoffParam = apvts.getRawParameterValue("vcf_cutoff");
    vcfResonanceParam = apvts.getRawParameterValue("vcf_resonance");
    vcfTrackingParam = apvts.getRawParameterValue("vcf_tracking");
    vcfModSourceParam = apvts.getRawParameterValue("vcf_mod_source");
    vcfModAmountParam = apvts.getRawParameterValue("vcf_mod_amount");
    vcfLFMAmountParam = apvts.getRawParameterValue("vcf_lfm_amount");

    // VCA
    vcaModSourceParam = apvts.getRawParameterValue("vca_mod_source");
    vcaInitialLevelParam = apvts.getRawParameterValue("vca_initial_level");
    masterLevelParam = apvts.getRawParameterValue("master_level");

    // LFO1
    lfo1FrequencyParam = apvts.getRawParameterValue("lfo1_frequency");
    lfo1WaveformParam = apvts.getRawParameterValue("lfo1_waveform");
    lfo1RangeParam = apvts.getRawParameterValue("lfo1_range");

    // LFO2
    lfo2FrequencyParam = apvts.getRawParameterValue("lfo2_frequency");
    lfo2WaveformParam = apvts.getRawParameterValue("lfo2_waveform");
    lfo2RangeParam = apvts.getRawParameterValue("lfo2_range");

    // ADSR
    ampAttackParam = apvts.getRawParameterValue("amp_attack");
    ampDecayParam = apvts.getRawParameterValue("amp_decay");
    ampSustainParam = apvts.getRawParameterValue("amp_sustain");
    ampReleaseParam = apvts.getRawParameterValue("amp_release");
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
    // VCO PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc_waveform", 1},
        "Waveform",
        juce::StringArray{"Triangle", "Saw", "Pulse"},
        1  // Default: Saw
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc_tune", 1},
        "Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc_fine", 1},
        "Fine",
        juce::NormalisableRange<float>(-100.0f, 100.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("cents")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pulse_width", 1},
        "Pulse Width",
        juce::NormalisableRange<float>(0.05f, 0.95f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sub_level", 1},
        "Sub Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"glide_time", 1},
        "Glide",
        juce::NormalisableRange<float>(0.0f, 2.0f, 0.001f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"mono_mode", 1},
        "Mono",
        false
    ));

    // VCO FM (modulated by LFO1 or ADSR)
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vco_fm_source", 1},
        "VCO FM Source",
        juce::StringArray{"Off", "LFO1", "ADSR"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vco_fm_amount", 1},
        "VCO FM Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // VCO PWM (modulated by LFO2 or ADSR)
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vco_pwm_source", 1},
        "VCO PWM Source",
        juce::StringArray{"Off", "LFO2", "ADSR"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vco_pwm_amount", 1},
        "VCO PWM Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // VCF PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf_cutoff", 1},
        "VCF Cutoff",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 1.0f, 0.3f),  // Skew for better low-end control
        5000.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf_resonance", 1},
        "VCF Resonance",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vcf_tracking", 1},
        "VCF Tracking",
        juce::StringArray{"Off", "Half", "Full"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vcf_mod_source", 1},
        "VCF Mod Source",
        juce::StringArray{"Off", "LFO2", "ADSR"},
        2  // Default: ADSR
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf_mod_amount", 1},
        "VCF Mod Amount",
        juce::NormalisableRange<float>(-1.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf_lfm_amount", 1},
        "VCF Linear FM",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // VCA PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vca_mod_source", 1},
        "VCA Mod Source",
        juce::StringArray{"Off", "LFO1", "ADSR"},
        2  // Default: ADSR
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vca_initial_level", 1},
        "VCA Initial Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_level", 1},
        "Master Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.8f
    ));

    // =========================================================================
    // LFO1 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"lfo1_frequency", 1},
        "LFO1 Frequency",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"lfo1_waveform", 1},
        "LFO1 Waveform",
        juce::StringArray{"Triangle", "Pulse", "Off"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"lfo1_range", 1},
        "LFO1 Range",
        juce::StringArray{"Low", "Medium", "High"},
        0
    ));

    // =========================================================================
    // LFO2 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"lfo2_frequency", 1},
        "LFO2 Frequency",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"lfo2_waveform", 1},
        "LFO2 Waveform",
        juce::StringArray{"Triangle", "Pulse", "Off"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"lfo2_range", 1},
        "LFO2 Range",
        juce::StringArray{"Low", "Medium", "High"},
        0
    ));

    // =========================================================================
    // ADSR PARAMETERS
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

    // Read VCO parameters
    int waveform = static_cast<int>(oscWaveformParam->load());
    float tune = oscTuneParam->load();
    float fine = oscFineParam->load();
    float pulseWidth = pulseWidthParam->load();
    float subLevel = subLevelParam->load();
    float glideTime = glideTimeParam->load();
    bool monoMode = monoModeParam->load() > 0.5f;
    int vcoFMSource = static_cast<int>(vcoFMSourceParam->load());
    float vcoFMAmount = vcoFMAmountParam->load();
    int vcoPWMSource = static_cast<int>(vcoPWMSourceParam->load());
    float vcoPWMAmount = vcoPWMAmountParam->load();

    // Read VCF parameters
    float vcfCutoff = vcfCutoffParam->load();
    float vcfResonance = vcfResonanceParam->load();
    int vcfTracking = static_cast<int>(vcfTrackingParam->load());
    int vcfModSource = static_cast<int>(vcfModSourceParam->load());
    float vcfModAmount = vcfModAmountParam->load();
    float vcfLFMAmount = vcfLFMAmountParam->load();

    // Read VCA parameters
    int vcaModSource = static_cast<int>(vcaModSourceParam->load());
    float vcaInitialLevel = vcaInitialLevelParam->load();
    float masterLevel = masterLevelParam->load();

    // Read LFO1 parameters
    float lfo1Frequency = lfo1FrequencyParam->load();
    int lfo1Waveform = static_cast<int>(lfo1WaveformParam->load());
    int lfo1Range = static_cast<int>(lfo1RangeParam->load());

    // Read LFO2 parameters
    float lfo2Frequency = lfo2FrequencyParam->load();
    int lfo2Waveform = static_cast<int>(lfo2WaveformParam->load());
    int lfo2Range = static_cast<int>(lfo2RangeParam->load());

    // Read ADSR parameters
    float attack = ampAttackParam->load();
    float decay = ampDecayParam->load();
    float sustain = ampSustainParam->load();
    float release = ampReleaseParam->load();

    // Update synth engine - VCO
    synthEngine.setWaveform(waveform);
    synthEngine.setTune(tune);
    synthEngine.setFine(fine);
    synthEngine.setPulseWidth(pulseWidth);
    synthEngine.setSubLevel(subLevel);
    synthEngine.setGlideTime(glideTime);
    synthEngine.setMonoMode(monoMode);
    synthEngine.setVCOFMSource(vcoFMSource);
    synthEngine.setVCOFMAmount(vcoFMAmount);
    synthEngine.setVCOPWMSource(vcoPWMSource);
    synthEngine.setVCOPWMAmount(vcoPWMAmount);

    // Update synth engine - VCF
    synthEngine.setVCFCutoff(vcfCutoff);
    synthEngine.setVCFResonance(vcfResonance);
    synthEngine.setVCFTracking(vcfTracking);
    synthEngine.setVCFModSource(vcfModSource);
    synthEngine.setVCFModAmount(vcfModAmount);
    synthEngine.setVCFLFMAmount(vcfLFMAmount);

    // Update synth engine - VCA
    synthEngine.setVCAModSource(vcaModSource);
    synthEngine.setVCAInitialLevel(vcaInitialLevel);
    synthEngine.setMasterLevel(masterLevel);

    // Update synth engine - LFO1
    synthEngine.setLFO1Frequency(lfo1Frequency);
    synthEngine.setLFO1Waveform(lfo1Waveform);
    synthEngine.setLFO1Range(lfo1Range);

    // Update synth engine - LFO2
    synthEngine.setLFO2Frequency(lfo2Frequency);
    synthEngine.setLFO2Waveform(lfo2Waveform);
    synthEngine.setLFO2Range(lfo2Range);

    // Update synth engine - ADSR
    synthEngine.setAttack(attack);
    synthEngine.setDecay(decay);
    synthEngine.setSustain(sustain);
    synthEngine.setRelease(release);

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
        visualizationBuffer[static_cast<size_t>(i)] = leftChannel[i];
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
