/**
 * @file PluginProcessor.cpp
 * @brief Subharmonicon - Main audio processor implementation
 *
 * TRUE 2-VOICE ARCHITECTURE with independent filters and envelopes per voice.
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

    // VCO 1
    osc1FreqParam = apvts.getRawParameterValue("osc1_freq");
    osc1LevelParam = apvts.getRawParameterValue("osc1_level");
    osc1WaveParam = apvts.getRawParameterValue("osc1_wave");
    sub1aDivParam = apvts.getRawParameterValue("sub1a_div");
    sub1aLevelParam = apvts.getRawParameterValue("sub1a_level");
    sub1bDivParam = apvts.getRawParameterValue("sub1b_div");
    sub1bLevelParam = apvts.getRawParameterValue("sub1b_level");

    // VCO 2
    osc2FreqParam = apvts.getRawParameterValue("osc2_freq");
    osc2LevelParam = apvts.getRawParameterValue("osc2_level");
    osc2WaveParam = apvts.getRawParameterValue("osc2_wave");
    sub2aDivParam = apvts.getRawParameterValue("sub2a_div");
    sub2aLevelParam = apvts.getRawParameterValue("sub2a_level");
    sub2bDivParam = apvts.getRawParameterValue("sub2b_div");
    sub2bLevelParam = apvts.getRawParameterValue("sub2b_level");

    // Voice 1 Filter & Envelopes
    filter1CutoffParam = apvts.getRawParameterValue("filter1_cutoff");
    filter1ResoParam = apvts.getRawParameterValue("filter1_reso");
    filter1EnvAmtParam = apvts.getRawParameterValue("filter1_env_amt");
    vcf1AttackParam = apvts.getRawParameterValue("vcf1_attack");
    vcf1DecayParam = apvts.getRawParameterValue("vcf1_decay");
    vca1AttackParam = apvts.getRawParameterValue("vca1_attack");
    vca1DecayParam = apvts.getRawParameterValue("vca1_decay");

    // Voice 2 Filter & Envelopes
    filter2CutoffParam = apvts.getRawParameterValue("filter2_cutoff");
    filter2ResoParam = apvts.getRawParameterValue("filter2_reso");
    filter2EnvAmtParam = apvts.getRawParameterValue("filter2_env_amt");
    vcf2AttackParam = apvts.getRawParameterValue("vcf2_attack");
    vcf2DecayParam = apvts.getRawParameterValue("vcf2_decay");
    vca2AttackParam = apvts.getRawParameterValue("vca2_attack");
    vca2DecayParam = apvts.getRawParameterValue("vca2_decay");

    // Sequencer
    tempoParam = apvts.getRawParameterValue("tempo");
    rhythm1DivParam = apvts.getRawParameterValue("rhythm1_div");
    rhythm2DivParam = apvts.getRawParameterValue("rhythm2_div");
    rhythm3DivParam = apvts.getRawParameterValue("rhythm3_div");
    rhythm4DivParam = apvts.getRawParameterValue("rhythm4_div");

    seq1EnableParam = apvts.getRawParameterValue("seq1_enable");
    seq1Step1Param = apvts.getRawParameterValue("seq1_step1");
    seq1Step2Param = apvts.getRawParameterValue("seq1_step2");
    seq1Step3Param = apvts.getRawParameterValue("seq1_step3");
    seq1Step4Param = apvts.getRawParameterValue("seq1_step4");

    seq2EnableParam = apvts.getRawParameterValue("seq2_enable");
    seq2Step1Param = apvts.getRawParameterValue("seq2_step1");
    seq2Step2Param = apvts.getRawParameterValue("seq2_step2");
    seq2Step3Param = apvts.getRawParameterValue("seq2_step3");
    seq2Step4Param = apvts.getRawParameterValue("seq2_step4");

    seqRunParam = apvts.getRawParameterValue("seq_run");

    // Master
    masterVolumeParam = apvts.getRawParameterValue("master_volume");
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
    // VCO 1 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_freq", 1},
        "VCO1 Frequency",
        juce::NormalisableRange<float>(20.0f, 2000.0f, 1.0f, 0.3f),
        220.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc1_level", 1},
        "VCO1 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.8f
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"osc1_wave", 1},
        "VCO1 Waveform",
        0, 3, 0  // 0=Saw, 1=Square, 2=Triangle, 3=Sine
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"sub1a_div", 1},
        "Sub1A Division",
        1, 16, 2
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sub1a_level", 1},
        "Sub1A Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"sub1b_div", 1},
        "Sub1B Division",
        1, 16, 3
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sub1b_level", 1},
        "Sub1B Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // VCO 2 PARAMETERS
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_freq", 1},
        "VCO2 Frequency",
        juce::NormalisableRange<float>(20.0f, 2000.0f, 1.0f, 0.3f),
        220.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"osc2_level", 1},
        "VCO2 Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.8f
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"osc2_wave", 1},
        "VCO2 Waveform",
        0, 3, 0  // 0=Saw, 1=Square, 2=Triangle, 3=Sine
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"sub2a_div", 1},
        "Sub2A Division",
        1, 16, 4
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sub2a_level", 1},
        "Sub2A Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    params.push_back(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID{"sub2b_div", 1},
        "Sub2B Division",
        1, 16, 5
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"sub2b_level", 1},
        "Sub2B Level",
        juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f),
        0.5f
    ));

    // =========================================================================
    // VOICE 1 FILTER & ENVELOPES
    // =========================================================================

    auto filterRange = juce::NormalisableRange<float>(20.0f, 20000.0f, 1.0f, 0.3f);
    auto resoRange = juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f);
    auto envAmtRange = juce::NormalisableRange<float>(-1.0f, 1.0f, 0.01f);
    auto timeRange = juce::NormalisableRange<float>(0.001f, 5.0f, 0.001f);

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter1_cutoff", 1}, "Filter 1 Cutoff", filterRange, 2000.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter1_reso", 1}, "Filter 1 Resonance", resoRange, 0.3f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter1_env_amt", 1}, "VCF1 EG Amount", envAmtRange, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf1_attack", 1}, "VCF1 Attack", timeRange, 0.01f,
        juce::AudioParameterFloatAttributes().withLabel("s")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf1_decay", 1}, "VCF1 Decay", timeRange, 0.5f,
        juce::AudioParameterFloatAttributes().withLabel("s")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vca1_attack", 1}, "VCA1 Attack", timeRange, 0.01f,
        juce::AudioParameterFloatAttributes().withLabel("s")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vca1_decay", 1}, "VCA1 Decay", timeRange, 0.5f,
        juce::AudioParameterFloatAttributes().withLabel("s")));

    // =========================================================================
    // VOICE 2 FILTER & ENVELOPES
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter2_cutoff", 1}, "Filter 2 Cutoff", filterRange, 2000.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter2_reso", 1}, "Filter 2 Resonance", resoRange, 0.3f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"filter2_env_amt", 1}, "VCF2 EG Amount", envAmtRange, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf2_attack", 1}, "VCF2 Attack", timeRange, 0.01f,
        juce::AudioParameterFloatAttributes().withLabel("s")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vcf2_decay", 1}, "VCF2 Decay", timeRange, 0.5f,
        juce::AudioParameterFloatAttributes().withLabel("s")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vca2_attack", 1}, "VCA2 Attack", timeRange, 0.01f,
        juce::AudioParameterFloatAttributes().withLabel("s")));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"vca2_decay", 1}, "VCA2 Decay", timeRange, 0.5f,
        juce::AudioParameterFloatAttributes().withLabel("s")));

    // =========================================================================
    // POLYRHYTHMIC SEQUENCER - CLOCK
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"tempo", 1},
        "Tempo",
        juce::NormalisableRange<float>(20.0f, 300.0f, 1.0f),
        120.0f,
        juce::AudioParameterFloatAttributes().withLabel("BPM")
    ));

    // =========================================================================
    // RHYTHM GENERATORS (extended range: 1/64 to 64x)
    // =========================================================================
    // Rhythm divisions - index 0-12 mapping to preset values:
    // 0=1/64, 1=1/32, 2=1/16, 3=1/8, 4=1/4, 5=1/2, 6=1x, 7=2x, 8=4x, 9=8x, 10=16x, 11=32x, 12=64x

    auto rhythmRange = juce::NormalisableRange<float>(0.0f, 12.0f, 1.0f);

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"rhythm1_div", 1},
        "Rhythm 1",
        rhythmRange,
        6.0f  // Default: 1x
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"rhythm2_div", 1},
        "Rhythm 2",
        rhythmRange,
        7.0f  // Default: 2x
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"rhythm3_div", 1},
        "Rhythm 3",
        rhythmRange,
        6.0f  // Default: 1x
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"rhythm4_div", 1},
        "Rhythm 4",
        rhythmRange,
        7.0f  // Default: 2x
    ));

    // =========================================================================
    // SEQUENCER 1 (for VCO1)
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq1_enable", 1},
        "Seq1 Enable",
        true
    ));

    auto pitchRange = juce::NormalisableRange<float>(-24.0f, 24.0f, 1.0f);

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq1_step1", 1},
        "Seq1 Step 1",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq1_step2", 1},
        "Seq1 Step 2",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq1_step3", 1},
        "Seq1 Step 3",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq1_step4", 1},
        "Seq1 Step 4",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    // =========================================================================
    // SEQUENCER 2 (for VCO2)
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq2_enable", 1},
        "Seq2 Enable",
        true
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq2_step1", 1},
        "Seq2 Step 1",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq2_step2", 1},
        "Seq2 Step 2",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq2_step3", 1},
        "Seq2 Step 3",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"seq2_step4", 1},
        "Seq2 Step 4",
        pitchRange,
        0.0f,
        juce::AudioParameterFloatAttributes().withLabel("st")
    ));

    // =========================================================================
    // TRANSPORT
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID{"seq_run", 1},
        "Sequencer Run",
        false
    ));

    // =========================================================================
    // MASTER
    // =========================================================================

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_volume", 1},
        "Master Volume",
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

    // Read all parameters (lock-free via atomics)

    // VCO 1
    float osc1Freq = osc1FreqParam->load();
    float osc1Level = osc1LevelParam->load();
    int osc1Wave = static_cast<int>(osc1WaveParam->load());
    int sub1aDiv = static_cast<int>(sub1aDivParam->load());
    float sub1aLevel = sub1aLevelParam->load();
    int sub1bDiv = static_cast<int>(sub1bDivParam->load());
    float sub1bLevel = sub1bLevelParam->load();

    // VCO 2
    float osc2Freq = osc2FreqParam->load();
    float osc2Level = osc2LevelParam->load();
    int osc2Wave = static_cast<int>(osc2WaveParam->load());
    int sub2aDiv = static_cast<int>(sub2aDivParam->load());
    float sub2aLevel = sub2aLevelParam->load();
    int sub2bDiv = static_cast<int>(sub2bDivParam->load());
    float sub2bLevel = sub2bLevelParam->load();

    // Voice 1 Filter & Envelopes
    float filter1Cutoff = filter1CutoffParam->load();
    float filter1Reso = filter1ResoParam->load();
    float filter1EnvAmt = filter1EnvAmtParam->load();
    float vcf1Attack = vcf1AttackParam->load();
    float vcf1Decay = vcf1DecayParam->load();
    float vca1Attack = vca1AttackParam->load();
    float vca1Decay = vca1DecayParam->load();

    // Voice 2 Filter & Envelopes
    float filter2Cutoff = filter2CutoffParam->load();
    float filter2Reso = filter2ResoParam->load();
    float filter2EnvAmt = filter2EnvAmtParam->load();
    float vcf2Attack = vcf2AttackParam->load();
    float vcf2Decay = vcf2DecayParam->load();
    float vca2Attack = vca2AttackParam->load();
    float vca2Decay = vca2DecayParam->load();

    // Sequencer
    float tempo = tempoParam->load();

    // Rhythm preset values: 0=1/64, 1=1/32, 2=1/16, 3=1/8, 4=1/4, 5=1/2, 6=1x, 7=2x, 8=4x, 9=8x, 10=16x, 11=32x, 12=64x
    static const float rhythmPresets[] = {0.015625f, 0.03125f, 0.0625f, 0.125f, 0.25f, 0.5f, 1.0f, 2.0f, 4.0f, 8.0f, 16.0f, 32.0f, 64.0f};

    int rhythm1Idx = juce::jlimit(0, 12, static_cast<int>(rhythm1DivParam->load()));
    int rhythm2Idx = juce::jlimit(0, 12, static_cast<int>(rhythm2DivParam->load()));
    int rhythm3Idx = juce::jlimit(0, 12, static_cast<int>(rhythm3DivParam->load()));
    int rhythm4Idx = juce::jlimit(0, 12, static_cast<int>(rhythm4DivParam->load()));

    float rhythm1Div = rhythmPresets[rhythm1Idx];
    float rhythm2Div = rhythmPresets[rhythm2Idx];
    float rhythm3Div = rhythmPresets[rhythm3Idx];
    float rhythm4Div = rhythmPresets[rhythm4Idx];

    bool seq1Enable = seq1EnableParam->load() > 0.5f;
    float seq1Step1 = seq1Step1Param->load();
    float seq1Step2 = seq1Step2Param->load();
    float seq1Step3 = seq1Step3Param->load();
    float seq1Step4 = seq1Step4Param->load();

    bool seq2Enable = seq2EnableParam->load() > 0.5f;
    float seq2Step1 = seq2Step1Param->load();
    float seq2Step2 = seq2Step2Param->load();
    float seq2Step3 = seq2Step3Param->load();
    float seq2Step4 = seq2Step4Param->load();

    bool seqRun = seqRunParam->load() > 0.5f;

    // Master
    float masterVolume = masterVolumeParam->load();

    // Handle MIDI messages (for external triggering)
    for (const auto metadata : midiMessages)
    {
        auto message = metadata.getMessage();

        if (message.isNoteOn())
        {
            // MIDI note on triggers the envelope
            synthEngine.setRunning(true);
        }
        else if (message.isAllNotesOff())
        {
            synthEngine.setRunning(false);
        }
    }

    // Update synth engine parameters

    // VCO 1
    synthEngine.setVCO1Frequency(osc1Freq);
    synthEngine.setVCO1Level(osc1Level);
    synthEngine.setVCO1Waveform(osc1Wave);
    synthEngine.setSub1ADivision(sub1aDiv);
    synthEngine.setSub1ALevel(sub1aLevel);
    synthEngine.setSub1BDivision(sub1bDiv);
    synthEngine.setSub1BLevel(sub1bLevel);

    // VCO 2
    synthEngine.setVCO2Frequency(osc2Freq);
    synthEngine.setVCO2Level(osc2Level);
    synthEngine.setVCO2Waveform(osc2Wave);
    synthEngine.setSub2ADivision(sub2aDiv);
    synthEngine.setSub2ALevel(sub2aLevel);
    synthEngine.setSub2BDivision(sub2bDiv);
    synthEngine.setSub2BLevel(sub2bLevel);

    // Voice 1 Filter & Envelopes
    synthEngine.setFilter1Cutoff(filter1Cutoff);
    synthEngine.setFilter1Resonance(filter1Reso);
    synthEngine.setFilter1EnvAmount(filter1EnvAmt);
    synthEngine.setVCF1Attack(vcf1Attack);
    synthEngine.setVCF1Decay(vcf1Decay);
    synthEngine.setVCA1Attack(vca1Attack);
    synthEngine.setVCA1Decay(vca1Decay);

    // Voice 2 Filter & Envelopes
    synthEngine.setFilter2Cutoff(filter2Cutoff);
    synthEngine.setFilter2Resonance(filter2Reso);
    synthEngine.setFilter2EnvAmount(filter2EnvAmt);
    synthEngine.setVCF2Attack(vcf2Attack);
    synthEngine.setVCF2Decay(vcf2Decay);
    synthEngine.setVCA2Attack(vca2Attack);
    synthEngine.setVCA2Decay(vca2Decay);

    // Sequencer
    synthEngine.setTempo(tempo);
    synthEngine.setRhythm1Division(rhythm1Div);
    synthEngine.setRhythm2Division(rhythm2Div);
    synthEngine.setRhythm3Division(rhythm3Div);
    synthEngine.setRhythm4Division(rhythm4Div);

    synthEngine.setSeq1Enabled(seq1Enable);
    synthEngine.setSeq1Step(0, seq1Step1);
    synthEngine.setSeq1Step(1, seq1Step2);
    synthEngine.setSeq1Step(2, seq1Step3);
    synthEngine.setSeq1Step(3, seq1Step4);

    synthEngine.setSeq2Enabled(seq2Enable);
    synthEngine.setSeq2Step(0, seq2Step1);
    synthEngine.setSeq2Step(1, seq2Step2);
    synthEngine.setSeq2Step(2, seq2Step3);
    synthEngine.setSeq2Step(3, seq2Step4);

    synthEngine.setRunning(seqRun);

    // Master
    synthEngine.setMasterVolume(masterVolume);

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
