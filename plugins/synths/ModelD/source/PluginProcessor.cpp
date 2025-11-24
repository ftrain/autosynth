/**
 * @file PluginProcessor.cpp
 * @brief Implementation of the main audio processor
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

    // Oscillator 1
    osc1WaveformParam = apvts.getRawParameterValue("osc1_waveform");
    osc1OctaveParam = apvts.getRawParameterValue("osc1_octave");
    osc1LevelParam = apvts.getRawParameterValue("osc1_level");

    // Oscillator 2
    osc2WaveformParam = apvts.getRawParameterValue("osc2_waveform");
    osc2OctaveParam = apvts.getRawParameterValue("osc2_octave");
    osc2DetuneParam = apvts.getRawParameterValue("osc2_detune");
    osc2LevelParam = apvts.getRawParameterValue("osc2_level");
    osc2SyncParam = apvts.getRawParameterValue("osc2_sync");

    // Oscillator 3
    osc3WaveformParam = apvts.getRawParameterValue("osc3_waveform");
    osc3OctaveParam = apvts.getRawParameterValue("osc3_octave");
    osc3DetuneParam = apvts.getRawParameterValue("osc3_detune");
    osc3LevelParam = apvts.getRawParameterValue("osc3_level");

    // Noise
    noiseLevelParam = apvts.getRawParameterValue("noise_level");

    // Filter
    filterCutoffParam = apvts.getRawParameterValue("filter_cutoff");
    filterResoParam = apvts.getRawParameterValue("filter_reso");
    filterEnvAmountParam = apvts.getRawParameterValue("filter_env_amount");
    filterKbdTrackParam = apvts.getRawParameterValue("filter_kbd_track");

    // Amp Envelope
    ampAttackParam = apvts.getRawParameterValue("amp_attack");
    ampDecayParam = apvts.getRawParameterValue("amp_decay");
    ampSustainParam = apvts.getRawParameterValue("amp_sustain");
    ampReleaseParam = apvts.getRawParameterValue("amp_release");

    // Filter Envelope
    filterAttackParam = apvts.getRawParameterValue("filter_attack");
    filterDecayParam = apvts.getRawParameterValue("filter_decay");
    filterSustainParam = apvts.getRawParameterValue("filter_sustain");
    filterReleaseParam = apvts.getRawParameterValue("filter_release");

    // Master
    masterVolumeParam = apvts.getRawParameterValue("master_volume");

    // LFO
    lfoRateParam = apvts.getRawParameterValue("lfo_rate");
    lfoWaveformParam = apvts.getRawParameterValue("lfo_waveform");
    lfoPitchAmountParam = apvts.getRawParameterValue("lfo_pitch_amount");
    lfoFilterAmountParam = apvts.getRawParameterValue("lfo_filter_amount");
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
    // OSCILLATOR 1 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc1_waveform", 1},
        "Osc 1 Waveform",
        juce::StringArray{"Saw", "Triangle", "Pulse", "Sine"},
        0  // Default: Saw
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"osc1_octave", 1},
        "Osc 1 Octave",
        -2, 2, 0  // -2 to +2 octaves
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_level", 1},
        "Osc 1 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        1.0f
    ));

    // =========================================================================
    // OSCILLATOR 2 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc2_waveform", 1},
        "Osc 2 Waveform",
        juce::StringArray{"Saw", "Triangle", "Pulse", "Sine"},
        0  // Default: Saw
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"osc2_octave", 1},
        "Osc 2 Octave",
        -2, 2, 0
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_detune", 1},
        "Osc 2 Detune",
        juce::NormalisableRange<float>(-1200.0f, 1200.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("cents")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_level", 1},
        "Osc 2 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        1.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"osc2_sync", 1},
        "Osc 2 Sync",
        false
    ));

    // =========================================================================
    // OSCILLATOR 3 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc3_waveform", 1},
        "Osc 3 Waveform",
        juce::StringArray{"Saw", "Triangle", "Pulse", "Sine"},
        0  // Default: Saw
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"osc3_octave", 1},
        "Osc 3 Octave",
        -2, 2, 0
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc3_detune", 1},
        "Osc 3 Detune",
        juce::NormalisableRange<float>(-1200.0f, 1200.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("cents")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc3_level", 1},
        "Osc 3 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f  // Off by default
    ));

    // =========================================================================
    // NOISE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"noise_level", 1},
        "Noise Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f  // Off by default
    ));

    // =========================================================================
    // FILTER PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_cutoff", 1},
        "Filter Cutoff",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 1.0f, 0.3f),  // skew=0.3 for log
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
        juce::NormalisableRange<float>(-1.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_kbd_track", 1},
        "Filter Keyboard Tracking",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // AMPLITUDE ENVELOPE
    // =========================================================================

    // Linear time range - no skew factor so UI ms values match actual times
    auto timeRange = juce::NormalisableRange<float>(0.001f, 5.0f, 0.001f);

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
        0.1f,
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
    // FILTER ENVELOPE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_attack", 1},
        "Filter Attack",
        timeRange,
        0.01f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_decay", 1},
        "Filter Decay",
        timeRange,
        0.2f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_sustain", 1},
        "Filter Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_release", 1},
        "Filter Release",
        timeRange,
        0.3f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

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

    // =========================================================================
    // LFO PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"lfo_rate", 1},
        "LFO Rate",
        juce::NormalisableRange<float>(0.01f, 50.0f, 0.01f, 0.4f),  // skew for better low-end control
        2.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"lfo_waveform", 1},
        "LFO Waveform",
        juce::StringArray{"Sine", "Triangle", "Saw", "Square", "S&H"},
        0  // Default: Sine
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"lfo_pitch_amount", 1},
        "LFO Pitch Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"lfo_filter_amount", 1},
        "LFO Filter Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
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
    // Oscillator 1
    int osc1Waveform = static_cast<int>(osc1WaveformParam->load());
    int osc1Octave = static_cast<int>(osc1OctaveParam->load());
    float osc1Level = osc1LevelParam->load();

    // Oscillator 2
    int osc2Waveform = static_cast<int>(osc2WaveformParam->load());
    int osc2Octave = static_cast<int>(osc2OctaveParam->load());
    float osc2Detune = osc2DetuneParam->load();
    float osc2Level = osc2LevelParam->load();
    bool osc2Sync = osc2SyncParam->load() > 0.5f;

    // Oscillator 3
    int osc3Waveform = static_cast<int>(osc3WaveformParam->load());
    int osc3Octave = static_cast<int>(osc3OctaveParam->load());
    float osc3Detune = osc3DetuneParam->load();
    float osc3Level = osc3LevelParam->load();

    // Noise
    float noiseLevel = noiseLevelParam->load();

    // Filter
    float filterCutoff = filterCutoffParam->load();
    float filterReso = filterResoParam->load();
    float filterEnvAmount = filterEnvAmountParam->load();
    float filterKbdTrack = filterKbdTrackParam->load();

    // Amp Envelope
    float ampAttack = ampAttackParam->load();
    float ampDecay = ampDecayParam->load();
    float ampSustain = ampSustainParam->load();
    float ampRelease = ampReleaseParam->load();

    // Filter Envelope
    float filterAttack = filterAttackParam->load();
    float filterDecay = filterDecayParam->load();
    float filterSustain = filterSustainParam->load();
    float filterRelease = filterReleaseParam->load();

    // Master
    float masterVolume = masterVolumeParam->load();

    // LFO
    float lfoRate = lfoRateParam->load();
    int lfoWaveform = static_cast<int>(lfoWaveformParam->load());
    float lfoPitchAmount = lfoPitchAmountParam->load();
    float lfoFilterAmount = lfoFilterAmountParam->load();

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
    // Oscillator 1
    synthEngine.setOsc1Waveform(osc1Waveform);
    synthEngine.setOsc1Octave(osc1Octave);
    synthEngine.setOsc1Level(osc1Level);

    // Oscillator 2
    synthEngine.setOsc2Waveform(osc2Waveform);
    synthEngine.setOsc2Octave(osc2Octave);
    synthEngine.setOsc2Detune(osc2Detune);
    synthEngine.setOsc2Level(osc2Level);
    synthEngine.setOsc2Sync(osc2Sync);

    // Oscillator 3
    synthEngine.setOsc3Waveform(osc3Waveform);
    synthEngine.setOsc3Octave(osc3Octave);
    synthEngine.setOsc3Detune(osc3Detune);
    synthEngine.setOsc3Level(osc3Level);

    // Noise
    synthEngine.setNoiseLevel(noiseLevel);

    // Filter
    synthEngine.setFilterCutoff(filterCutoff);
    synthEngine.setFilterResonance(filterReso);
    synthEngine.setFilterEnvAmount(filterEnvAmount);
    synthEngine.setFilterKeyboardTracking(filterKbdTrack);

    // Amp Envelope
    synthEngine.setAmpEnvelope(ampAttack, ampDecay, ampSustain, ampRelease);

    // Filter Envelope
    synthEngine.setFilterEnvelope(filterAttack, filterDecay, filterSustain, filterRelease);

    // LFO
    synthEngine.setLFORate(lfoRate);
    synthEngine.setLFOWaveform(lfoWaveform);
    synthEngine.setLFOPitchAmount(lfoPitchAmount);
    synthEngine.setLFOFilterAmount(lfoFilterAmount);

    // Master
    synthEngine.setMasterVolume(masterVolume);

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
