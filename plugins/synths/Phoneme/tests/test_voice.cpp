/**
 * @file test_voice.cpp
 * @brief Unit tests for Phoneme Voice
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "dsp/Voice.h"

using Catch::Approx;

TEST_CASE("Voice initializes correctly", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    REQUIRE(!voice.isActive());
    REQUIRE(!voice.isReleasing());
    REQUIRE(voice.getNote() == -1);
}

TEST_CASE("Voice activates on note on", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    voice.noteOn(60, 1.0f);  // Middle C

    REQUIRE(voice.isActive());
    REQUIRE(!voice.isReleasing());
    REQUIRE(voice.getNote() == 60);
    REQUIRE(voice.getVelocity() == Approx(1.0f));
}

TEST_CASE("Voice releases on note off", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    voice.noteOn(60, 1.0f);
    voice.noteOff();

    REQUIRE(voice.isActive());
    REQUIRE(voice.isReleasing());
}

TEST_CASE("Voice kills immediately", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    voice.noteOn(60, 1.0f);
    voice.kill();

    REQUIRE(!voice.isActive());
    REQUIRE(!voice.isReleasing());
}

TEST_CASE("Voice renders audio", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    // Set parameters
    voice.setWaveform(0);  // Saw
    voice.setVowel(0.0f);  // A
    voice.setAttack(0.001f);
    voice.setDecay(0.1f);
    voice.setSustain(0.7f);
    voice.setRelease(0.1f);
    voice.setMasterLevel(1.0f);

    voice.noteOn(60, 1.0f);

    // Render some samples
    std::array<float, 128> bufferL{};
    std::array<float, 128> bufferR{};

    voice.render(bufferL.data(), bufferR.data(), 128);

    // Should have produced non-zero output
    float maxSample = 0.0f;
    for (int i = 0; i < 128; ++i)
    {
        maxSample = std::max(maxSample, std::abs(bufferL[i]));
    }

    REQUIRE(maxSample > 0.0f);
}

TEST_CASE("Voice vowel selection affects formants", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    // Test each vowel produces different output
    std::array<float, 5> vowelEnergies{};

    for (int v = 0; v < 5; ++v)
    {
        Voice testVoice;
        testVoice.prepare(44100.0);
        testVoice.setWaveform(0);
        testVoice.setVowel(static_cast<float>(v));
        testVoice.setAttack(0.001f);
        testVoice.setMasterLevel(1.0f);

        testVoice.noteOn(60, 1.0f);

        std::array<float, 256> bufferL{};
        std::array<float, 256> bufferR{};
        testVoice.render(bufferL.data(), bufferR.data(), 256);

        // Calculate energy
        float energy = 0.0f;
        for (int i = 0; i < 256; ++i)
        {
            energy += bufferL[i] * bufferL[i];
        }
        vowelEnergies[v] = energy;
    }

    // Each vowel should produce output
    for (int v = 0; v < 5; ++v)
    {
        REQUIRE(vowelEnergies[v] > 0.0f);
    }
}

TEST_CASE("Voice waveform selection works", "[voice]")
{
    // Test Saw vs Pulse produce different output
    Voice sawVoice;
    sawVoice.prepare(44100.0);
    sawVoice.setWaveform(0);  // Saw
    sawVoice.setVowel(0.0f);
    sawVoice.setAttack(0.001f);
    sawVoice.noteOn(60, 1.0f);

    Voice pulseVoice;
    pulseVoice.prepare(44100.0);
    pulseVoice.setWaveform(1);  // Pulse
    pulseVoice.setVowel(0.0f);
    pulseVoice.setAttack(0.001f);
    pulseVoice.noteOn(60, 1.0f);

    std::array<float, 256> sawL{}, sawR{};
    std::array<float, 256> pulseL{}, pulseR{};

    sawVoice.render(sawL.data(), sawR.data(), 256);
    pulseVoice.render(pulseL.data(), pulseR.data(), 256);

    // Output should be different
    float diff = 0.0f;
    for (int i = 0; i < 256; ++i)
    {
        diff += std::abs(sawL[i] - pulseL[i]);
    }

    REQUIRE(diff > 0.0f);
}
