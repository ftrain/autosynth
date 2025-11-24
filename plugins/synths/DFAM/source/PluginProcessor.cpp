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

    // Clock divider for sequencer - musical divisions including triplets
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"clock_divider", 1},
        "Clock Divider",
        juce::StringArray{"1/16", "1/12", "1/8", "1/6", "1/5", "1/4", "1/3", "1/2", "1x", "3/2", "2x", "3x", "4x", "5x", "6x", "8x", "12x", "16x"},
        8  // default to 1x
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
    // NOISE & MODULATION
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"noise_level", 1},
        "Noise Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pitch_to_noise", 1},
        "Pitch→Noise",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pitch_to_decay", 1},
        "Pitch→Decay",
        juce::NormalisableRange<float>(-1.0f, 1.0f, 0.01f),
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
    // PITCH LFO (clock synced)
    // =========================================================================

    // Clock divider for pitch LFO - musical divisions including triplets
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"pitch_lfo_rate", 1},
        "Pitch LFO Rate",
        juce::StringArray{"1/16", "1/12", "1/8", "1/6", "1/5", "1/4", "1/3", "1/2", "1x", "3/2", "2x", "3x", "4x", "5x", "6x", "8x", "12x", "16x"},
        8  // default to 1x
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"pitch_lfo_amount", 1},
        "Pitch LFO Amount",
        juce::NormalisableRange<float>(0.0f, 24.0f, 0.1f),
        12.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    // Per-step pitch LFO enables
    for (int i = 0; i < 8; ++i)
    {
        params.push_back(std::make_unique<juce::AudioParameterBool>(
            juce::ParameterID{"pitch_lfo_en_" + juce::String(i), 1},
            "Step " + juce::String(i + 1) + " Pitch LFO",
            false
        ));
    }

    // =========================================================================
    // VELOCITY LFO (clock synced)
    // =========================================================================

    // Clock divider for velocity LFO - musical divisions including triplets
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"vel_lfo_rate", 1},
        "Velocity LFO Rate",
        juce::StringArray{"1/16", "1/12", "1/8", "1/6", "1/5", "1/4", "1/3", "1/2", "1x", "3/2", "2x", "3x", "4x", "5x", "6x", "8x", "12x", "16x"},
        8  // default to 1x
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vel_lfo_amount", 1},
        "Velocity LFO Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // Per-step velocity LFO enables
    for (int i = 0; i < 8; ++i)
    {
        params.push_back(std::make_unique<juce::AudioParameterBool>(
            juce::ParameterID{"vel_lfo_en_" + juce::String(i), 1},
            "Step " + juce::String(i + 1) + " Velocity LFO",
            false
        ));
    }

    // =========================================================================
    // FILTER LFO (clock synced)
    // =========================================================================

    // Clock divider for filter LFO - musical divisions including triplets
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"filter_lfo_rate", 1},
        "Filter LFO Rate",
        juce::StringArray{"1/16", "1/12", "1/8", "1/6", "1/5", "1/4", "1/3", "1/2", "1x", "3/2", "2x", "3x", "4x", "5x", "6x", "8x", "12x", "16x"},
        8  // default to 1x
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter_lfo_amount", 1},
        "Filter LFO Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // FILTER MODE
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"filter_mode", 1},
        "Filter Mode",
        juce::StringArray{"Low Pass", "High Pass"},
        0  // default to LP
    ));

    // =========================================================================
    // EFFECTS - SATURATOR
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sat_drive", 1},
        "Drive",
        juce::NormalisableRange<float>(1.0f, 20.0f, 0.1f),
        1.0f
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sat_mix", 1},
        "Drive Mix",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.0f
    ));

    // =========================================================================
    // EFFECTS - DELAY (clock synced)
    // =========================================================================

    // Clock divider for delay time - musical divisions including triplets
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID{"delay_time", 1},
        "Delay Time",
        juce::StringArray{"1/16", "1/12", "1/8", "1/6", "1/5", "1/4", "1/3", "1/2", "1x", "3/2", "2x", "3x", "4x", "5x", "6x", "8x", "12x", "16x"},
        5  // default to 1/4 (one bar)
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
    // EFFECTS - REVERB
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_decay", 1},
        "Reverb Decay",
        juce::NormalisableRange<float>(0.1f, 10.0f, 0.1f),
        2.0f,
        juce::AudioParameterFloatAttributes().withLabel("s")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"reverb_damping", 1},
        "Reverb Damping",
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
    // EFFECTS - COMPRESSOR
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"comp_threshold", 1},
        "Comp Threshold",
        juce::NormalisableRange<float>(-60.0f, 0.0f, 0.1f),
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
        juce::ParameterID{"comp_attack", 1},
        "Comp Attack",
        juce::NormalisableRange<float>(0.1f, 100.0f, 0.1f),
        10.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"comp_release", 1},
        "Comp Release",
        juce::NormalisableRange<float>(10.0f, 1000.0f, 1.0f),
        100.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"comp_makeup", 1},
        "Comp Makeup",
        juce::NormalisableRange<float>(0.0f, 24.0f, 0.1f),
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("dB")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"comp_mix", 1},
        "Comp Mix",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        1.0f  // Default to 100% wet (full compression)
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

    // Helper to convert clock divider index to multiplier value
    // Musical divisions including triplets, quintuplets, etc.
    // Slow -> Fast: 1/16, 1/12, 1/8, 1/6, 1/5, 1/4, 1/3, 1/2, 1x, 3/2, 2x, 3x, 4x, 5x, 6x, 8x, 12x, 16x
    static const float clockDividerValues[] = {
        0.0625f,    // 1/16 (4 bars)
        0.0833333f, // 1/12 (3 bars)
        0.125f,     // 1/8 (2 bars)
        0.1666667f, // 1/6 (1.5 bars)
        0.2f,       // 1/5
        0.25f,      // 1/4 (1 bar)
        0.3333333f, // 1/3
        0.5f,       // 1/2 (half note)
        1.0f,       // 1x (quarter note)
        1.5f,       // 3/2 (dotted quarter)
        2.0f,       // 2x (8th note)
        3.0f,       // 3x (8th triplet)
        4.0f,       // 4x (16th note)
        5.0f,       // 5x (16th quintuplet)
        6.0f,       // 6x (16th triplet)
        8.0f,       // 8x (32nd note)
        12.0f,      // 12x (32nd triplet)
        16.0f       // 16x (64th note)
    };
    auto getClockDivider = [&](int index) {
        return clockDividerValues[std::clamp(index, 0, 17)];
    };

    // Read parameters
    float tempo = *apvts.getRawParameterValue("tempo");
    bool running = *apvts.getRawParameterValue("running") > 0.5f;
    int clockDividerIdx = static_cast<int>(*apvts.getRawParameterValue("clock_divider"));

    float vco1Freq = *apvts.getRawParameterValue("vco1_freq");
    int vco1Wave = static_cast<int>(*apvts.getRawParameterValue("vco1_wave"));
    float vco1Level = *apvts.getRawParameterValue("vco1_level");

    float vco2Freq = *apvts.getRawParameterValue("vco2_freq");
    int vco2Wave = static_cast<int>(*apvts.getRawParameterValue("vco2_wave"));
    float vco2Level = *apvts.getRawParameterValue("vco2_level");

    float fmAmount = *apvts.getRawParameterValue("fm_amount");
    float noiseLevel = *apvts.getRawParameterValue("noise_level");
    float pitchToNoise = *apvts.getRawParameterValue("pitch_to_noise");
    float pitchToDecay = *apvts.getRawParameterValue("pitch_to_decay");

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
    synthEngine.setClockDivider(getClockDivider(clockDividerIdx));
    synthEngine.setRunning(running);

    synthEngine.setVCO1Frequency(vco1Freq);
    synthEngine.setVCO1Waveform(vco1Wave);
    synthEngine.setVCO1Level(vco1Level);

    synthEngine.setVCO2Frequency(vco2Freq);
    synthEngine.setVCO2Waveform(vco2Wave);
    synthEngine.setVCO2Level(vco2Level);

    synthEngine.setFMAmount(fmAmount);
    synthEngine.setNoiseLevel(noiseLevel);
    synthEngine.setPitchToNoiseAmount(pitchToNoise);
    synthEngine.setPitchToDecayAmount(pitchToDecay);

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

    // Update LFO parameters (clock synced)
    int pitchLfoRateIdx = static_cast<int>(*apvts.getRawParameterValue("pitch_lfo_rate"));
    float pitchLfoAmount = *apvts.getRawParameterValue("pitch_lfo_amount");
    int velLfoRateIdx = static_cast<int>(*apvts.getRawParameterValue("vel_lfo_rate"));
    float velLfoAmount = *apvts.getRawParameterValue("vel_lfo_amount");

    synthEngine.setPitchLfoClockSync(getClockDivider(pitchLfoRateIdx));
    synthEngine.setPitchLfoAmount(pitchLfoAmount);
    synthEngine.setVelocityLfoClockSync(getClockDivider(velLfoRateIdx));
    synthEngine.setVelocityLfoAmount(velLfoAmount);

    // Update per-step LFO enables
    for (int i = 0; i < 8; ++i)
    {
        bool pitchLfoEn = *apvts.getRawParameterValue("pitch_lfo_en_" + juce::String(i)) > 0.5f;
        bool velLfoEn = *apvts.getRawParameterValue("vel_lfo_en_" + juce::String(i)) > 0.5f;
        synthEngine.setStepPitchLfoEnabled(i, pitchLfoEn);
        synthEngine.setStepVelocityLfoEnabled(i, velLfoEn);
    }

    // Update filter LFO (clock synced)
    int filterLfoRateIdx = static_cast<int>(*apvts.getRawParameterValue("filter_lfo_rate"));
    float filterLfoAmount = *apvts.getRawParameterValue("filter_lfo_amount");
    synthEngine.setFilterLfoClockSync(getClockDivider(filterLfoRateIdx));
    synthEngine.setFilterLfoAmount(filterLfoAmount);

    // Update filter mode
    int filterMode = static_cast<int>(*apvts.getRawParameterValue("filter_mode"));
    synthEngine.setFilterMode(filterMode);

    // Update effects - Saturator
    float satDrive = *apvts.getRawParameterValue("sat_drive");
    float satMix = *apvts.getRawParameterValue("sat_mix");
    synthEngine.setSaturatorDrive(satDrive);
    synthEngine.setSaturatorMix(satMix);

    // Update effects - Delay (clock synced)
    int delayTimeIdx = static_cast<int>(*apvts.getRawParameterValue("delay_time"));
    float delayFeedback = *apvts.getRawParameterValue("delay_feedback");
    float delayMix = *apvts.getRawParameterValue("delay_mix");
    synthEngine.setDelayClockSync(getClockDivider(delayTimeIdx));
    synthEngine.setDelayFeedback(delayFeedback);
    synthEngine.setDelayMix(delayMix);

    // Update effects - Reverb
    float reverbDecay = *apvts.getRawParameterValue("reverb_decay");
    float reverbDamping = *apvts.getRawParameterValue("reverb_damping");
    float reverbMix = *apvts.getRawParameterValue("reverb_mix");
    synthEngine.setReverbDecay(reverbDecay);
    synthEngine.setReverbDamping(reverbDamping);
    synthEngine.setReverbMix(reverbMix);

    // Update effects - Compressor
    float compThreshold = *apvts.getRawParameterValue("comp_threshold");
    float compRatio = *apvts.getRawParameterValue("comp_ratio");
    float compAttack = *apvts.getRawParameterValue("comp_attack");
    float compRelease = *apvts.getRawParameterValue("comp_release");
    float compMakeup = *apvts.getRawParameterValue("comp_makeup");
    float compMix = *apvts.getRawParameterValue("comp_mix");
    synthEngine.setCompThreshold(compThreshold);
    synthEngine.setCompRatio(compRatio);
    synthEngine.setCompAttack(compAttack);
    synthEngine.setCompRelease(compRelease);
    synthEngine.setCompMakeup(compMakeup);
    synthEngine.setCompMix(compMix);

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
