/**
 * @file test_engine.cpp
 * @brief Unit tests for Phoneme SynthEngine
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "dsp/SynthEngine.h"

using Catch::Approx;

TEST_CASE("SynthEngine initializes correctly", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    REQUIRE(engine.getActiveVoiceCount() == 0);
}

TEST_CASE("SynthEngine handles note on", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    engine.noteOn(60, 1.0f);

    REQUIRE(engine.getActiveVoiceCount() == 1);
}

TEST_CASE("SynthEngine handles multiple notes", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    engine.noteOn(60, 1.0f);
    engine.noteOn(64, 0.8f);
    engine.noteOn(67, 0.6f);
    engine.noteOn(72, 0.4f);

    REQUIRE(engine.getActiveVoiceCount() == 4);
}

TEST_CASE("SynthEngine handles note off", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);
    engine.setRelease(0.001f);  // Very short release

    engine.noteOn(60, 1.0f);
    engine.noteOff(60);

    // Voice should still be active (in release)
    REQUIRE(engine.getActiveVoiceCount() == 1);

    // Render enough to complete release
    std::array<float, 512> bufferL{}, bufferR{};
    for (int i = 0; i < 10; ++i)
    {
        engine.renderBlock(bufferL.data(), bufferR.data(), 512);
    }

    // Voice should be finished
    REQUIRE(engine.getActiveVoiceCount() == 0);
}

TEST_CASE("SynthEngine all notes off", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    engine.noteOn(60, 1.0f);
    engine.noteOn(64, 0.8f);
    engine.noteOn(67, 0.6f);

    engine.allNotesOff();

    REQUIRE(engine.getActiveVoiceCount() == 0);
}

TEST_CASE("SynthEngine voice stealing", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    // Play more notes than MAX_VOICES
    engine.noteOn(60, 1.0f);
    engine.noteOn(64, 1.0f);
    engine.noteOn(67, 1.0f);
    engine.noteOn(72, 1.0f);
    engine.noteOn(76, 1.0f);  // Should steal a voice

    REQUIRE(engine.getActiveVoiceCount() == 4);  // Still max 4
}

TEST_CASE("SynthEngine renders audio", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    // Configure engine
    engine.setWaveform(0);  // Saw
    engine.setVowel(0.0f);  // A
    engine.setAttack(0.001f);
    engine.setDecay(0.1f);
    engine.setSustain(0.7f);
    engine.setRelease(0.1f);
    engine.setMasterLevel(1.0f);

    engine.noteOn(60, 1.0f);

    std::array<float, 512> bufferL{}, bufferR{};
    engine.renderBlock(bufferL.data(), bufferR.data(), 512);

    // Should have produced non-zero output
    float maxSample = 0.0f;
    for (int i = 0; i < 512; ++i)
    {
        maxSample = std::max(maxSample, std::abs(bufferL[i]));
    }

    REQUIRE(maxSample > 0.0f);
}

TEST_CASE("SynthEngine parameter changes apply to voices", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    // Start with one vowel
    engine.setVowel(0.0f);  // A
    engine.noteOn(60, 1.0f);

    std::array<float, 256> bufferA_L{}, bufferA_R{};
    engine.renderBlock(bufferA_L.data(), bufferA_R.data(), 256);

    // Kill and restart with different vowel
    engine.allNotesOff();
    engine.setVowel(2.0f);  // I
    engine.noteOn(60, 1.0f);

    std::array<float, 256> bufferI_L{}, bufferI_R{};
    engine.renderBlock(bufferI_L.data(), bufferI_R.data(), 256);

    // Output should be different due to different formants
    float diff = 0.0f;
    for (int i = 0; i < 256; ++i)
    {
        diff += std::abs(bufferA_L[i] - bufferI_L[i]);
    }

    REQUIRE(diff > 0.0f);
}

TEST_CASE("SynthEngine stereo output", "[engine]")
{
    SynthEngine engine;
    engine.prepare(44100.0, 512);

    engine.setWaveform(0);
    engine.setAttack(0.001f);
    engine.noteOn(60, 1.0f);

    std::array<float, 256> bufferL{}, bufferR{};
    engine.renderBlock(bufferL.data(), bufferR.data(), 256);

    // Left and right should be identical (mono synth)
    for (int i = 0; i < 256; ++i)
    {
        REQUIRE(bufferL[i] == Approx(bufferR[i]));
    }
}
