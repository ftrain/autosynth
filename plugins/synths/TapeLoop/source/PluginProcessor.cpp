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

    reverbReplaceParam = apvts.getRawParameterValue("reverb_replace");
    reverbBrightnessParam = apvts.getRawParameterValue("reverb_brightness");
    reverbDetuneParam = apvts.getRawParameterValue("reverb_detune");
    reverbBignessParam = apvts.getRawParameterValue("reverb_bigness");
    reverbSizeParam = apvts.getRawParameterValue("reverb_size");
    reverbMixParam = apvts.getRawParameterValue("reverb_mix");

    compThresholdParam = apvts.getRawParameterValue("comp_threshold");
    compRatioParam = apvts.getRawParameterValue("comp_ratio");
    compMixParam = apvts.getRawParameterValue("comp_mix");

    // Sequencers (dual)
    seqEnabledParam = apvts.getRawParameterValue("seq_enabled");
    seqBPMParam = apvts.getRawParameterValue("seq_bpm");

    // Sequencer 1
    seq1DivisionParam = apvts.getRawParameterValue("seq1_division");
    seq1Pitch1Param = apvts.getRawParameterValue("seq1_pitch1");
    seq1Pitch2Param = apvts.getRawParameterValue("seq1_pitch2");
    seq1Pitch3Param = apvts.getRawParameterValue("seq1_pitch3");
    seq1Pitch4Param = apvts.getRawParameterValue("seq1_pitch4");
    seq1Gate1Param = apvts.getRawParameterValue("seq1_gate1");
    seq1Gate2Param = apvts.getRawParameterValue("seq1_gate2");
    seq1Gate3Param = apvts.getRawParameterValue("seq1_gate3");
    seq1Gate4Param = apvts.getRawParameterValue("seq1_gate4");

    // Sequencer 2
    seq2DivisionParam = apvts.getRawParameterValue("seq2_division");
    seq2Pitch1Param = apvts.getRawParameterValue("seq2_pitch1");
    seq2Pitch2Param = apvts.getRawParameterValue("seq2_pitch2");
    seq2Pitch3Param = apvts.getRawParameterValue("seq2_pitch3");
    seq2Pitch4Param = apvts.getRawParameterValue("seq2_pitch4");
    seq2Gate1Param = apvts.getRawParameterValue("seq2_gate1");
    seq2Gate2Param = apvts.getRawParameterValue("seq2_gate2");
    seq2Gate3Param = apvts.getRawParameterValue("seq2_gate3");
    seq2Gate4Param = apvts.getRawParameterValue("seq2_gate4");

    // Voice to Loop FM
    voiceLoopFMParam = apvts.getRawParameterValue("voice_loop_fm");

    // ADSR Envelopes (per oscillator)
    osc1AttackParam = apvts.getRawParameterValue("osc1_attack");
    osc1DecayParam = apvts.getRawParameterValue("osc1_decay");
    osc1SustainParam = apvts.getRawParameterValue("osc1_sustain");
    osc1ReleaseParam = apvts.getRawParameterValue("osc1_release");

    osc2AttackParam = apvts.getRawParameterValue("osc2_attack");
    osc2DecayParam = apvts.getRawParameterValue("osc2_decay");
    osc2SustainParam = apvts.getRawParameterValue("osc2_sustain");
    osc2ReleaseParam = apvts.getRawParameterValue("osc2_release");

    // Pan LFO
    panSpeedParam = apvts.getRawParameterValue("pan_speed");
    panDepthParam = apvts.getRawParameterValue("pan_depth");
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
    // REVERB (Airwindows Galactic3)
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_replace", 1},
        "Reverb Replace",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_brightness", 1},
        "Reverb Brightness",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_detune", 1},
        "Reverb Detune",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.2f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_bigness", 1},
        "Reverb Bigness",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_size", 1},
        "Reverb Size",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_mix", 1},
        "Reverb Mix",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
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

    // =========================================================================
    // SEQUENCERS (dual - one per oscillator)
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq_enabled", 1},
        "Sequencer",
        false
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq_bpm", 1},
        "BPM",
        juce::NormalisableRange<float>(30.0f, 300.0f, 1.0f),
        120.0f
    ));

    // Sequencer 1 (Osc 1) - Clock Division (extended to 256 bars)
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"seq1_division", 1},
        "Seq 1 Div",
        juce::StringArray{"1/128", "1/64", "1/32", "1/16", "1/8", "1/4", "1/2", "1",
                          "2 bar", "4 bar", "8 bar", "16 bar", "32 bar", "64 bar", "128 bar", "256 bar"},
        4  // Default: 1/8
    ));

    // Sequencer 1 - Pitch (MIDI notes, 4 steps)
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq1_pitch1", 1}, "Seq1 Pitch 1", 36, 84, 60));
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq1_pitch2", 1}, "Seq1 Pitch 2", 36, 84, 60));
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq1_pitch3", 1}, "Seq1 Pitch 3", 36, 84, 60));
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq1_pitch4", 1}, "Seq1 Pitch 4", 36, 84, 60));

    // Sequencer 1 - Gates (4 steps)
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq1_gate1", 1}, "Seq1 Gate 1", true));
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq1_gate2", 1}, "Seq1 Gate 2", true));
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq1_gate3", 1}, "Seq1 Gate 3", true));
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq1_gate4", 1}, "Seq1 Gate 4", true));

    // Sequencer 2 (Osc 2) - Clock Division (extended to 256 bars)
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"seq2_division", 1},
        "Seq 2 Div",
        juce::StringArray{"1/128", "1/64", "1/32", "1/16", "1/8", "1/4", "1/2", "1",
                          "2 bar", "4 bar", "8 bar", "16 bar", "32 bar", "64 bar", "128 bar", "256 bar"},
        4  // Default: 1/8
    ));

    // Sequencer 2 - Pitch (MIDI notes, 4 steps)
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq2_pitch1", 1}, "Seq2 Pitch 1", 36, 84, 60));
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq2_pitch2", 1}, "Seq2 Pitch 2", 36, 84, 60));
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq2_pitch3", 1}, "Seq2 Pitch 3", 36, 84, 60));
    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"seq2_pitch4", 1}, "Seq2 Pitch 4", 36, 84, 60));

    // Sequencer 2 - Gates (4 steps)
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq2_gate1", 1}, "Seq2 Gate 1", true));
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq2_gate2", 1}, "Seq2 Gate 2", true));
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq2_gate3", 1}, "Seq2 Gate 3", true));
    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq2_gate4", 1}, "Seq2 Gate 4", true));

    // =========================================================================
    // VOICE TO LOOP FM
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"voice_loop_fm", 1},
        "Voice->Loop FM",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // ADSR ENVELOPES (per oscillator)
    // =========================================================================

    // Osc 1 ADSR
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_attack", 1},
        "Osc1 Attack",
        juce::NormalisableRange<float>(1.0f, 5000.0f, 1.0f),
        10.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_decay", 1},
        "Osc1 Decay",
        juce::NormalisableRange<float>(1.0f, 5000.0f, 1.0f),
        100.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_sustain", 1},
        "Osc1 Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.7f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_release", 1},
        "Osc1 Release",
        juce::NormalisableRange<float>(1.0f, 10000.0f, 1.0f),
        300.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    // Osc 2 ADSR
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_attack", 1},
        "Osc2 Attack",
        juce::NormalisableRange<float>(1.0f, 5000.0f, 1.0f),
        10.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_decay", 1},
        "Osc2 Decay",
        juce::NormalisableRange<float>(1.0f, 5000.0f, 1.0f),
        100.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_sustain", 1},
        "Osc2 Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.7f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_release", 1},
        "Osc2 Release",
        juce::NormalisableRange<float>(1.0f, 10000.0f, 1.0f),
        300.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    // =========================================================================
    // PAN LFO
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pan_speed", 1},
        "Pan Speed",
        juce::NormalisableRange<float>(0.01f, 10.0f, 0.01f),
        0.5f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pan_depth", 1},
        "Pan Depth",
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

    engine.setReverbReplace(reverbReplaceParam->load());
    engine.setReverbBrightness(reverbBrightnessParam->load());
    engine.setReverbDetune(reverbDetuneParam->load());
    engine.setReverbBigness(reverbBignessParam->load());
    engine.setReverbSize(reverbSizeParam->load());
    engine.setReverbMix(reverbMixParam->load());

    engine.setCompThreshold(compThresholdParam->load());
    engine.setCompRatio(compRatioParam->load());
    engine.setCompMix(compMixParam->load());

    // Sequencers (dual)
    engine.setSeqEnabled(seqEnabledParam->load() > 0.5f);
    engine.setSeqBPM(seqBPMParam->load());

    // Sequencer 1 (Osc 1)
    engine.setSeq1Division(static_cast<int>(seq1DivisionParam->load()));
    engine.setSeq1StepPitch(0, static_cast<int>(seq1Pitch1Param->load()));
    engine.setSeq1StepPitch(1, static_cast<int>(seq1Pitch2Param->load()));
    engine.setSeq1StepPitch(2, static_cast<int>(seq1Pitch3Param->load()));
    engine.setSeq1StepPitch(3, static_cast<int>(seq1Pitch4Param->load()));
    engine.setSeq1StepGate(0, seq1Gate1Param->load() > 0.5f);
    engine.setSeq1StepGate(1, seq1Gate2Param->load() > 0.5f);
    engine.setSeq1StepGate(2, seq1Gate3Param->load() > 0.5f);
    engine.setSeq1StepGate(3, seq1Gate4Param->load() > 0.5f);

    // Sequencer 2 (Osc 2)
    engine.setSeq2Division(static_cast<int>(seq2DivisionParam->load()));
    engine.setSeq2StepPitch(0, static_cast<int>(seq2Pitch1Param->load()));
    engine.setSeq2StepPitch(1, static_cast<int>(seq2Pitch2Param->load()));
    engine.setSeq2StepPitch(2, static_cast<int>(seq2Pitch3Param->load()));
    engine.setSeq2StepPitch(3, static_cast<int>(seq2Pitch4Param->load()));
    engine.setSeq2StepGate(0, seq2Gate1Param->load() > 0.5f);
    engine.setSeq2StepGate(1, seq2Gate2Param->load() > 0.5f);
    engine.setSeq2StepGate(2, seq2Gate3Param->load() > 0.5f);
    engine.setSeq2StepGate(3, seq2Gate4Param->load() > 0.5f);

    // Voice to Loop FM
    engine.setVoiceLoopFM(voiceLoopFMParam->load());

    // ADSR Envelopes (per oscillator)
    engine.setOsc1Attack(osc1AttackParam->load());
    engine.setOsc1Decay(osc1DecayParam->load());
    engine.setOsc1Sustain(osc1SustainParam->load());
    engine.setOsc1Release(osc1ReleaseParam->load());

    engine.setOsc2Attack(osc2AttackParam->load());
    engine.setOsc2Decay(osc2DecayParam->load());
    engine.setOsc2Sustain(osc2SustainParam->load());
    engine.setOsc2Release(osc2ReleaseParam->load());

    // Pan LFO
    engine.setPanSpeed(panSpeedParam->load());
    engine.setPanDepth(panDepthParam->load());

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
