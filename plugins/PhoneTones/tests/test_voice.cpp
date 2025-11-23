/**
 * @file test_voice.cpp
 * @brief Unit tests for Phone Tones voice
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "dsp/Voice.h"
#include <vector>
#include <cmath>

TEST_CASE("Voice initializes correctly", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    REQUIRE_FALSE(voice.isActive());
    REQUIRE_FALSE(voice.isReleasing());
    REQUIRE(voice.getNote() == -1);
}

TEST_CASE("Voice activates on note on", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    voice.noteOn(60, 1.0f);

    REQUIRE(voice.isActive());
    REQUIRE_FALSE(voice.isReleasing());
    REQUIRE(voice.getNote() == 60);
    REQUIRE(voice.getVelocity() == Catch::Approx(1.0f));
}

TEST_CASE("Voice releases on note off", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    voice.noteOn(60, 1.0f);
    voice.noteOff();

    REQUIRE(voice.isActive()); // Still active during release
    REQUIRE(voice.isReleasing());
}

TEST_CASE("Voice renders audio", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);
    voice.setMasterLevel(1.0f);
    voice.setToneMode(0); // Dial tone

    voice.noteOn(60, 1.0f);

    std::vector<float> left(512, 0.0f);
    std::vector<float> right(512, 0.0f);

    voice.render(left.data(), right.data(), 512);

    // Check that some audio was generated
    float maxSample = 0.0f;
    for (int i = 0; i < 512; ++i)
    {
        maxSample = std::max(maxSample, std::abs(left[i]));
    }

    REQUIRE(maxSample > 0.0f);
}

TEST_CASE("Voice kills correctly", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);

    voice.noteOn(60, 1.0f);
    REQUIRE(voice.isActive());

    voice.kill();

    REQUIRE_FALSE(voice.isActive());
    REQUIRE(voice.getNote() == -1);
}

TEST_CASE("DTMF mode generates different frequencies per note", "[voice]")
{
    Voice voice;
    voice.prepare(44100.0);
    voice.setToneMode(3); // DTMF mode
    voice.setMasterLevel(1.0f);

    // Test two different DTMF tones
    std::vector<float> left1(1024, 0.0f);
    std::vector<float> right1(1024, 0.0f);

    voice.noteOn(48, 1.0f); // C3 - first DTMF key
    voice.render(left1.data(), right1.data(), 1024);
    voice.kill();

    std::vector<float> left2(1024, 0.0f);
    std::vector<float> right2(1024, 0.0f);

    voice.noteOn(49, 1.0f); // C#3 - second DTMF key
    voice.render(left2.data(), right2.data(), 1024);

    // The waveforms should be different (different frequencies)
    bool different = false;
    for (int i = 100; i < 200; ++i) // Check after attack transient
    {
        if (std::abs(left1[i] - left2[i]) > 0.01f)
        {
            different = true;
            break;
        }
    }

    REQUIRE(different);
}
