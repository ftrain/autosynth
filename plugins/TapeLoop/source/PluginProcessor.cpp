/**
 * @file PluginProcessor.cpp
 * @brief Implementation of the Tape Loop audio processor
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
    osc1WaveformParam = apvts.getRawParameterValue("osc1_waveform");
    osc1TuneParam = apvts.getRawParameterValue("osc1_tune");
    osc1LevelParam = apvts.getRawParameterValue("osc1_level");

    osc2WaveformParam = apvts.getRawParameterValue("osc2_waveform");
    osc2TuneParam = apvts.getRawParameterValue("osc2_tune");
    osc2DetuneParam = apvts.getRawParameterValue("osc2_detune");
    osc2LevelParam = apvts.getRawParameterValue("osc2_level");

    loopLengthParam = apvts.getRawParameterValue("loop_length");
    loopFeedbackParam = apvts.getRawParameterValue("loop_feedback");
    recordLevelParam = apvts.getRawParameterValue("record_level");

    tapeSaturationParam = apvts.getRawParameterValue("tape_saturation");
    tapeWobbleRateParam = apvts.getRawParameterValue("tape_wobble_rate");
    tapeWobbleDepthParam = apvts.getRawParameterValue("tape_wobble_depth");

    tapeHissParam = apvts.getRawParameterValue("tape_hiss");
    tapeAgeParam = apvts.getRawParameterValue("tape_age");
    tapeDegradeParam = apvts.getRawParameterValue("tape_degrade");

    recAttackParam = apvts.getRawParameterValue("rec_attack");
    recDecayParam = apvts.getRawParameterValue("rec_decay");

    fmAmountParam = apvts.getRawParameterValue("fm_amount");

    lfoRateParam = apvts.getRawParameterValue("lfo_rate");
    lfoDepthParam = apvts.getRawParameterValue("lfo_depth");
    lfoWaveformParam = apvts.getRawParameterValue("lfo_waveform");
    lfoTargetParam = apvts.getRawParameterValue("lfo_target");

    dryLevelParam = apvts.getRawParameterValue("dry_level");
    loopLevelParam = apvts.getRawParameterValue("loop_level");
    masterLevelParam = apvts.getRawParameterValue("master_level");

    // Effects
    delayTimeParam = apvts.getRawParameterValue("delay_time");
    delayFeedbackParam = apvts.getRawParameterValue("delay_feedback");
    delayMixParam = apvts.getRawParameterValue("delay_mix");

    reverbDecayParam = apvts.getRawParameterValue("reverb_decay");
    reverbMixParam = apvts.getRawParameterValue("reverb_mix");
    reverbDampingParam = apvts.getRawParameterValue("reverb_damping");

    compThresholdParam = apvts.getRawParameterValue("comp_threshold");
    compRatioParam = apvts.getRawParameterValue("comp_ratio");
    compMixParam = apvts.getRawParameterValue("comp_mix");
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
        juce::ParameterID{"osc1_waveform", 1},
        "Osc 1 Wave",
        juce::StringArray{"Sine", "Tri", "Saw"},
        0  // Default: Sine
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_tune", 1},
        "Osc 1 Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_level", 1},
        "Osc 1 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.7f
    ));

    // =========================================================================
    // OSCILLATOR 2
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"osc2_waveform", 1},
        "Osc 2 Wave",
        juce::StringArray{"Sine", "Tri", "Saw"},
        0  // Default: Sine
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_tune", 1},
        "Osc 2 Tune",
        juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_detune", 1},
        "Osc 2 Detune",
        juce::NormalisableRange<float>(-100.0f, 100.0f, 1.0f),
        7.0f,
        juce::AudioParameterFloatAttributes().withLabel("ct")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_level", 1},
        "Osc 2 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // TAPE LOOP
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"loop_length", 1},
        "Loop Length",
        juce::NormalisableRange<float>(0.5f, 60.0f, 0.1f),
        4.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"loop_feedback", 1},
        "Loop Feedback",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.85f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"record_level", 1},
        "Record Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // TAPE CHARACTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tape_saturation", 1},
        "Saturation",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.3f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tape_wobble_rate", 1},
        "Wobble Rate",
        juce::NormalisableRange<float>(0.1f, 5.0f, 0.01f),
        0.5f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tape_wobble_depth", 1},
        "Wobble Depth",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.2f
    ));

    // =========================================================================
    // TAPE NOISE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tape_hiss", 1},
        "Tape Hiss",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.1f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tape_age", 1},
        "Tape Age",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.3f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tape_degrade", 1},
        "Tape Degrade",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // RECORDING ENVELOPE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"rec_attack", 1},
        "Rec Attack",
        juce::NormalisableRange<float>(0.005f, 0.5f, 0.001f),
        0.02f,  // 20ms default for click-free attack
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"rec_decay", 1},
        "Rec Decay",
        juce::NormalisableRange<float>(0.01f, 5.0f, 0.01f),
        0.5f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    // =========================================================================
    // FM MODULATION
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"fm_amount", 1},
        "FM Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // TAPE CHARACTER LFO
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"lfo_rate", 1},
        "LFO Rate",
        juce::NormalisableRange<float>(0.1f, 20.0f, 0.01f),
        1.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"lfo_depth", 1},
        "LFO Depth",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"lfo_waveform", 1},
        "LFO Wave",
        juce::StringArray{"Sine", "Tri", "Saw", "Square"},
        0
    ));

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"lfo_target", 1},
        "LFO Target",
        juce::StringArray{"Saturation", "Age", "Wobble", "Degrade"},
        0
    ));

    // =========================================================================
    // MIX
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"dry_level", 1},
        "Dry Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.3f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"loop_level", 1},
        "Loop Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.7f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_level", 1},
        "Master Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.8f
    ));

    // =========================================================================
    // DELAY
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"delay_time", 1},
        "Delay Time",
        juce::NormalisableRange<float>(0.01f, 2.0f, 0.01f),
        0.5f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"delay_feedback", 1},
        "Delay Feedback",
        juce::NormalisableRange<float>(0.0f, 0.95f, 0.01f),
        0.3f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"delay_mix", 1},
        "Delay Mix",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // REVERB
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_decay", 1},
        "Reverb Decay",
        juce::NormalisableRange<float>(0.1f, 10.0f, 0.1f),
        2.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_mix", 1},
        "Reverb Mix",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_damping", 1},
        "Reverb Damping",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // COMPRESSOR
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"comp_threshold", 1},
        "Comp Threshold",
        juce::NormalisableRange<float>(-40.0f, 0.0f, 0.1f),
        -10.0f,
        juce::AudioParameterFloatAttributes().withLabel("dB")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"comp_ratio", 1},
        "Comp Ratio",
        juce::NormalisableRange<float>(1.0f, 20.0f, 0.1f),
        4.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"comp_mix", 1},
        "Comp Mix",
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

    // Prepare tape loop engine
    engine.prepare(sampleRate, samplesPerBlock);

    // Clear visualization buffer
    std::fill(visualizationBuffer.begin(), visualizationBuffer.end(), 0.0f);
}

void PluginProcessor::releaseResources()
{
    engine.releaseResources();
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

    // Update engine parameters from APVTS
    engine.setOsc1Waveform(static_cast<int>(osc1WaveformParam->load()));
    engine.setOsc1Tune(osc1TuneParam->load());
    engine.setOsc1Level(osc1LevelParam->load());

    engine.setOsc2Waveform(static_cast<int>(osc2WaveformParam->load()));
    engine.setOsc2Tune(osc2TuneParam->load());
    engine.setOsc2Detune(osc2DetuneParam->load());
    engine.setOsc2Level(osc2LevelParam->load());

    engine.setLoopLength(loopLengthParam->load());
    engine.setLoopFeedback(loopFeedbackParam->load());
    engine.setRecordLevel(recordLevelParam->load());

    engine.setSaturation(tapeSaturationParam->load());
    engine.setWobbleRate(tapeWobbleRateParam->load());
    engine.setWobbleDepth(tapeWobbleDepthParam->load());

    engine.setTapeHiss(tapeHissParam->load());
    engine.setTapeAge(tapeAgeParam->load());
    engine.setTapeDegrade(tapeDegradeParam->load());

    engine.setRecAttack(recAttackParam->load());
    engine.setRecDecay(recDecayParam->load());

    engine.setFMAmount(fmAmountParam->load());

    engine.setLFORate(lfoRateParam->load());
    engine.setLFODepth(lfoDepthParam->load());
    engine.setLFOWaveform(static_cast<int>(lfoWaveformParam->load()));
    engine.setLFOTarget(static_cast<int>(lfoTargetParam->load()));

    engine.setDryLevel(dryLevelParam->load());
    engine.setLoopLevel(loopLevelParam->load());
    engine.setMasterLevel(masterLevelParam->load());

    // Effects
    engine.setDelayTime(delayTimeParam->load());
    engine.setDelayFeedback(delayFeedbackParam->load());
    engine.setDelayMix(delayMixParam->load());

    engine.setReverbDecay(reverbDecayParam->load());
    engine.setReverbMix(reverbMixParam->load());
    engine.setReverbDamping(reverbDampingParam->load());

    engine.setCompThreshold(compThresholdParam->load());
    engine.setCompRatio(compRatioParam->load());
    engine.setCompMix(compMixParam->load());

    // Handle MIDI messages
    for (const auto metadata : midiMessages)
    {
        auto message = metadata.getMessage();

        if (message.isNoteOn())
        {
            engine.noteOn(message.getNoteNumber(), message.getFloatVelocity());
        }
        else if (message.isNoteOff())
        {
            engine.noteOff(message.getNoteNumber());
        }
        else if (message.isAllNotesOff())
        {
            engine.allNotesOff();
        }
    }

    // Render audio
    engine.renderBlock(leftChannel, rightChannel, numSamples);

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
