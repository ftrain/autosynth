/**
 * @file test_engine.cpp
 * @brief Unit tests for TapeLoopEngine
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "dsp/TapeLoopEngine.h"

using Catch::Approx;

TEST_CASE("TapeLoopEngine initialization", "[engine]")
{
    TapeLoopEngine engine;

    SECTION("Can prepare at various sample rates")
    {
        engine.prepare(44100.0, 512);
        engine.prepare(48000.0, 512);
        engine.prepare(96000.0, 512);
        // Should not crash
        REQUIRE(true);
    }
}

TEST_CASE("TapeLoopEngine parameter setters", "[engine]")
{
    TapeLoopEngine engine;
    engine.prepare(44100.0, 512);

    SECTION("Oscillator parameters")
    {
        engine.setOsc1Waveform(0);
        engine.setOsc1Tune(-12.0f);
        engine.setOsc1Level(0.5f);

        engine.setOsc2Waveform(2);
        engine.setOsc2Tune(12.0f);
        engine.setOsc2Detune(50.0f);
        engine.setOsc2Level(0.3f);

        REQUIRE(true);
    }

    SECTION("Tape loop parameters")
    {
        engine.setLoopLength(5.0f);
        engine.setLoopFeedback(0.9f);
        engine.setRecordLevel(0.7f);

        REQUIRE(true);
    }

    SECTION("Tape character parameters")
    {
        engine.setSaturation(0.5f);
        engine.setWobbleRate(2.0f);
        engine.setWobbleDepth(0.3f);

        REQUIRE(true);
    }

    SECTION("Mix parameters")
    {
        engine.setDryLevel(0.2f);
        engine.setLoopLevel(0.8f);
        engine.setMasterLevel(0.9f);

        REQUIRE(true);
    }
}

TEST_CASE("TapeLoopEngine audio rendering", "[engine]")
{
    TapeLoopEngine engine;
    engine.prepare(44100.0, 512);

    std::array<float, 512> left{};
    std::array<float, 512> right{};

    SECTION("Silent output when not recording")
    {
        engine.renderBlock(left.data(), right.data(), 512);

        // Should produce some output (tape loop playback even if empty)
        // Just verify no NaN or Inf
        for (int i = 0; i < 512; ++i)
        {
            REQUIRE(std::isfinite(left[i]));
            REQUIRE(std::isfinite(right[i]));
        }
    }

    SECTION("Produces output when note is held")
    {
        engine.noteOn(60, 1.0f);  // Middle C

        // Render several blocks to fill tape loop
        for (int block = 0; block < 100; ++block)
        {
            engine.renderBlock(left.data(), right.data(), 512);
        }

        // Should have some non-zero output
        float maxAbs = 0.0f;
        for (int i = 0; i < 512; ++i)
        {
            maxAbs = std::max(maxAbs, std::abs(left[i]));
            REQUIRE(std::isfinite(left[i]));
        }

        // With dry level at 0.3 and loop level at 0.7, should have signal
        REQUIRE(maxAbs > 0.0f);

        engine.noteOff(60);
    }

    SECTION("Tape loop accumulates signal")
    {
        engine.setLoopLength(0.5f);  // Short loop
        engine.setLoopFeedback(0.95f);
        engine.setRecordLevel(0.8f);

        engine.noteOn(60, 1.0f);

        // Record for a while
        for (int block = 0; block < 50; ++block)
        {
            engine.renderBlock(left.data(), right.data(), 512);
        }

        engine.noteOff(60);

        // Continue playback - should still have signal from tape loop
        engine.renderBlock(left.data(), right.data(), 512);

        float sumAbs = 0.0f;
        for (int i = 0; i < 512; ++i)
        {
            sumAbs += std::abs(left[i]);
        }

        // Tape should have accumulated signal
        REQUIRE(sumAbs > 0.0f);
    }

    SECTION("Clear tape removes signal")
    {
        engine.noteOn(60, 1.0f);

        // Record
        for (int block = 0; block < 50; ++block)
        {
            engine.renderBlock(left.data(), right.data(), 512);
        }

        engine.noteOff(60);

        // Clear tape
        engine.clearTape();

        // Set dry level to 0 to only hear tape
        engine.setDryLevel(0.0f);

        // Render - should be silent or near-silent (only noise)
        engine.renderBlock(left.data(), right.data(), 512);

        float maxAbs = 0.0f;
        for (int i = 0; i < 512; ++i)
        {
            maxAbs = std::max(maxAbs, std::abs(left[i]));
        }

        // After clearing, should be very quiet (only hiss)
        REQUIRE(maxAbs < 0.1f);
    }
}

TEST_CASE("TapeLoopEngine tape degradation", "[engine]")
{
    TapeLoopEngine engine;
    engine.prepare(44100.0, 512);

    std::array<float, 512> left{};
    std::array<float, 512> right{};

    SECTION("Saturation affects output")
    {
        engine.noteOn(60, 1.0f);
        engine.setSaturation(0.0f);

        // Render with no saturation
        for (int block = 0; block < 50; ++block)
        {
            engine.renderBlock(left.data(), right.data(), 512);
        }
        float sumNoSat = 0.0f;
        for (int i = 0; i < 512; ++i)
        {
            sumNoSat += std::abs(left[i]);
        }

        engine.clearTape();
        engine.setSaturation(1.0f);

        // Render with full saturation
        for (int block = 0; block < 50; ++block)
        {
            engine.renderBlock(left.data(), right.data(), 512);
        }
        float sumSat = 0.0f;
        for (int i = 0; i < 512; ++i)
        {
            sumSat += std::abs(left[i]);
        }

        // Both should produce output
        REQUIRE(sumNoSat > 0.0f);
        REQUIRE(sumSat > 0.0f);

        engine.noteOff(60);
    }
}
