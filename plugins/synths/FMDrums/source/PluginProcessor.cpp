/**
 * @file PluginProcessor.cpp
 * @brief Implementation of FM Drums audio processor
 */

#include "PluginProcessor.h"
#include "PluginEditor.h"

PluginProcessor::PluginProcessor()
    : AudioProcessor(BusesProperties()
                     .withOutput("Output", juce::AudioChannelSet::stereo(), true))
    , apvts(*this, nullptr, "Parameters", createParameterLayout())
{
    // Cache parameter pointers for lock-free access
    kickCarrierFreq = apvts.getRawParameterValue("kick_carrier_freq");
    kickModRatio = apvts.getRawParameterValue("kick_mod_ratio");
    kickModDepth = apvts.getRawParameterValue("kick_mod_depth");
    kickPitchDecay = apvts.getRawParameterValue("kick_pitch_decay");
    kickPitchAmount = apvts.getRawParameterValue("kick_pitch_amount");
    kickAmpDecay = apvts.getRawParameterValue("kick_amp_decay");
    kickLevel = apvts.getRawParameterValue("kick_level");

    snareCarrierFreq = apvts.getRawParameterValue("snare_carrier_freq");
    snareModRatio = apvts.getRawParameterValue("snare_mod_ratio");
    snareModDepth = apvts.getRawParameterValue("snare_mod_depth");
    snarePitchDecay = apvts.getRawParameterValue("snare_pitch_decay");
    snareAmpDecay = apvts.getRawParameterValue("snare_amp_decay");
    snareNoise = apvts.getRawParameterValue("snare_noise");
    snareLevel = apvts.getRawParameterValue("snare_level");

    hatCarrierFreq = apvts.getRawParameterValue("hat_carrier_freq");
    hatModRatio = apvts.getRawParameterValue("hat_mod_ratio");
    hatModDepth = apvts.getRawParameterValue("hat_mod_depth");
    hatAmpDecay = apvts.getRawParameterValue("hat_amp_decay");
    hatNoise = apvts.getRawParameterValue("hat_noise");
    hatLevel = apvts.getRawParameterValue("hat_level");

    percCarrierFreq = apvts.getRawParameterValue("perc_carrier_freq");
    percModRatio = apvts.getRawParameterValue("perc_mod_ratio");
    percModDepth = apvts.getRawParameterValue("perc_mod_depth");
    percPitchDecay = apvts.getRawParameterValue("perc_pitch_decay");
    percAmpDecay = apvts.getRawParameterValue("perc_amp_decay");
    percLevel = apvts.getRawParameterValue("perc_level");

    masterLevel = apvts.getRawParameterValue("master_level");
}

PluginProcessor::~PluginProcessor()
{
}

juce::AudioProcessorValueTreeState::ParameterLayout PluginProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // Log range for frequencies
    auto freqRangeKick = juce::NormalisableRange<float>(20.0f, 200.0f, 1.0f, 0.5f);
    auto freqRangeSnare = juce::NormalisableRange<float>(80.0f, 500.0f, 1.0f, 0.5f);
    auto freqRangeHat = juce::NormalisableRange<float>(200.0f, 2000.0f, 1.0f, 0.5f);
    auto freqRangePerc = juce::NormalisableRange<float>(100.0f, 1000.0f, 1.0f, 0.5f);
    auto ratioRange = juce::NormalisableRange<float>(0.5f, 16.0f, 0.1f, 0.5f);
    auto linearRange = juce::NormalisableRange<float>(0.0f, 1.0f, 0.01f);

    // KICK
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"kick_carrier_freq", 1}, "Kick Freq", freqRangeKick, 60.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"kick_mod_ratio", 1}, "Kick Mod Ratio", ratioRange, 1.0f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"kick_mod_depth", 1}, "Kick FM Depth", linearRange, 0.5f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"kick_pitch_decay", 1}, "Kick Pitch Decay",
        juce::NormalisableRange<float>(1.0f, 500.0f, 1.0f, 0.5f), 50.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"kick_pitch_amount", 1}, "Kick Pitch Amt", linearRange, 0.8f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"kick_amp_decay", 1}, "Kick Amp Decay",
        juce::NormalisableRange<float>(1.0f, 2000.0f, 1.0f, 0.5f), 400.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"kick_level", 1}, "Kick Level", linearRange, 0.8f));

    // SNARE
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"snare_carrier_freq", 1}, "Snare Freq", freqRangeSnare, 180.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"snare_mod_ratio", 1}, "Snare Mod Ratio", ratioRange, 2.4f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"snare_mod_depth", 1}, "Snare FM Depth", linearRange, 0.6f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"snare_noise", 1}, "Snare Noise", linearRange, 0.5f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"snare_pitch_decay", 1}, "Snare Pitch Decay",
        juce::NormalisableRange<float>(1.0f, 200.0f, 1.0f, 0.5f), 20.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"snare_amp_decay", 1}, "Snare Amp Decay",
        juce::NormalisableRange<float>(1.0f, 1000.0f, 1.0f, 0.5f), 200.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"snare_level", 1}, "Snare Level", linearRange, 0.8f));

    // HAT
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"hat_carrier_freq", 1}, "Hat Freq", freqRangeHat, 800.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"hat_mod_ratio", 1}, "Hat Mod Ratio", ratioRange, 7.1f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"hat_mod_depth", 1}, "Hat FM Depth", linearRange, 0.8f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"hat_noise", 1}, "Hat Noise", linearRange, 0.7f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"hat_amp_decay", 1}, "Hat Amp Decay",
        juce::NormalisableRange<float>(1.0f, 500.0f, 1.0f, 0.5f), 80.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"hat_level", 1}, "Hat Level", linearRange, 0.7f));

    // PERC
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"perc_carrier_freq", 1}, "Perc Freq", freqRangePerc, 400.0f,
        juce::AudioParameterFloatAttributes().withLabel("Hz")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"perc_mod_ratio", 1}, "Perc Mod Ratio", ratioRange, 3.5f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"perc_mod_depth", 1}, "Perc FM Depth", linearRange, 0.4f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"perc_pitch_decay", 1}, "Perc Pitch Decay",
        juce::NormalisableRange<float>(1.0f, 300.0f, 1.0f, 0.5f), 30.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"perc_amp_decay", 1}, "Perc Amp Decay",
        juce::NormalisableRange<float>(1.0f, 1000.0f, 1.0f, 0.5f), 250.0f,
        juce::AudioParameterFloatAttributes().withLabel("ms")));

    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"perc_level", 1}, "Perc Level", linearRange, 0.7f));

    // MASTER
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID{"master_level", 1}, "Master Level", linearRange, 0.8f));

    return { params.begin(), params.end() };
}

void PluginProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    currentSampleRate = sampleRate;
    drumEngine.prepare(sampleRate, samplesPerBlock);
    std::fill(visualizationBuffer.begin(), visualizationBuffer.end(), 0.0f);
}

void PluginProcessor::releaseResources()
{
    drumEngine.releaseResources();
}

void PluginProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;

    buffer.clear();

    auto* leftChannel = buffer.getWritePointer(0);
    auto* rightChannel = buffer.getWritePointer(1);
    const int numSamples = buffer.getNumSamples();

    // Update parameters
    drumEngine.setKickCarrierFreq(kickCarrierFreq->load());
    drumEngine.setKickModRatio(kickModRatio->load());
    drumEngine.setKickModDepth(kickModDepth->load());
    drumEngine.setKickPitchDecay(kickPitchDecay->load());
    drumEngine.setKickPitchAmount(kickPitchAmount->load());
    drumEngine.setKickAmpDecay(kickAmpDecay->load());
    drumEngine.setKickLevel(kickLevel->load());

    drumEngine.setSnareCarrierFreq(snareCarrierFreq->load());
    drumEngine.setSnareModRatio(snareModRatio->load());
    drumEngine.setSnareModDepth(snareModDepth->load());
    drumEngine.setSnarePitchDecay(snarePitchDecay->load());
    drumEngine.setSnareAmpDecay(snareAmpDecay->load());
    drumEngine.setSnareNoise(snareNoise->load());
    drumEngine.setSnareLevel(snareLevel->load());

    drumEngine.setHatCarrierFreq(hatCarrierFreq->load());
    drumEngine.setHatModRatio(hatModRatio->load());
    drumEngine.setHatModDepth(hatModDepth->load());
    drumEngine.setHatAmpDecay(hatAmpDecay->load());
    drumEngine.setHatNoise(hatNoise->load());
    drumEngine.setHatLevel(hatLevel->load());

    drumEngine.setPercCarrierFreq(percCarrierFreq->load());
    drumEngine.setPercModRatio(percModRatio->load());
    drumEngine.setPercModDepth(percModDepth->load());
    drumEngine.setPercPitchDecay(percPitchDecay->load());
    drumEngine.setPercAmpDecay(percAmpDecay->load());
    drumEngine.setPercLevel(percLevel->load());

    drumEngine.setMasterLevel(masterLevel->load());

    // Handle MIDI
    for (const auto metadata : midiMessages)
    {
        auto message = metadata.getMessage();
        int samplePosition = metadata.samplePosition;

        if (message.isNoteOn())
        {
            drumEngine.noteOn(message.getNoteNumber(),
                             message.getFloatVelocity(),
                             samplePosition);
        }
    }

    // Render audio
    drumEngine.renderBlock(leftChannel, rightChannel, numSamples);

    // Copy to visualization buffer
    int copySize = std::min(numSamples, static_cast<int>(visualizationBuffer.size()));
    for (int i = 0; i < copySize; ++i)
    {
        visualizationBuffer[i] = leftChannel[i];
    }
}

juce::AudioProcessorEditor* PluginProcessor::createEditor()
{
    return new PluginEditor(*this);
}

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

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new PluginProcessor();
}
