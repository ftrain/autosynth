/**
 * @file test_drum_voice.cpp
 * @brief Unit tests for FM drum voice
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "dsp/DrumVoice.h"
#include "dsp/DrumEngine.h"

TEST_CASE("DrumVoice initializes correctly", "[DrumVoice]")
{
    DrumVoice voice;
    voice.prepare(44100.0);

    REQUIRE_FALSE(voice.isActive());
}

TEST_CASE("DrumVoice triggers and decays", "[DrumVoice]")
{
    DrumVoice voice;
    voice.prepare(44100.0);
    voice.setCarrierFreq(60.0f);
    voice.setModRatio(1.0f);
    voice.setModDepth(0.5f);
    voice.setAmpDecay(100.0f);
    voice.setPitchDecay(50.0f);
    voice.setPitchAmount(0.8f);
    voice.setLevel(1.0f);

    REQUIRE_FALSE(voice.isActive());

    voice.trigger(1.0f);
    REQUIRE(voice.isActive());

    // Render some audio
    std::array<float, 512> left{}, right{};
    voice.render(left.data(), right.data(), 512);

    // Should produce output
    float maxSample = 0.0f;
    for (int i = 0; i < 512; ++i)
    {
        maxSample = std::max(maxSample, std::abs(left[i]));
    }
    REQUIRE(maxSample > 0.01f);
}

TEST_CASE("DrumEngine handles MIDI notes", "[DrumEngine]")
{
    DrumEngine engine;
    engine.prepare(44100.0, 512);

    // Trigger kick
    engine.noteOn(DrumEngine::NOTE_KICK, 1.0f, 0);

    std::array<float, 512> left{}, right{};
    engine.renderBlock(left.data(), right.data(), 512);

    // Should produce output
    float maxSample = 0.0f;
    for (int i = 0; i < 512; ++i)
    {
        maxSample = std::max(maxSample, std::abs(left[i]));
    }
    REQUIRE(maxSample > 0.01f);
}

TEST_CASE("DrumEngine produces stereo output", "[DrumEngine]")
{
    DrumEngine engine;
    engine.prepare(44100.0, 512);

    engine.noteOn(DrumEngine::NOTE_SNARE, 1.0f, 0);

    std::array<float, 512> left{}, right{};
    engine.renderBlock(left.data(), right.data(), 512);

    // Both channels should have output
    float maxLeft = 0.0f, maxRight = 0.0f;
    for (int i = 0; i < 512; ++i)
    {
        maxLeft = std::max(maxLeft, std::abs(left[i]));
        maxRight = std::max(maxRight, std::abs(right[i]));
    }
    REQUIRE(maxLeft > 0.01f);
    REQUIRE(maxRight > 0.01f);
}
