/**
 * @file test_voice.cpp
 * @brief Unit tests for the Voice class
 *
 * Tests:
 * - Voice initialization
 * - Note on/off behavior
 * - Audio output validity
 * - Envelope behavior
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <cmath>
#include <array>

// TODO: Include your voice implementation
// #include "dsp/Voice.h"

using Catch::Approx;

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Check if buffer contains no NaN or Inf values
 */
bool isBufferValid(const float* buffer, int numSamples)
{
    for (int i = 0; i < numSamples; ++i)
    {
        if (std::isnan(buffer[i]) || std::isinf(buffer[i]))
            return false;
    }
    return true;
}

/**
 * Calculate RMS level of buffer
 */
float calculateRMS(const float* buffer, int numSamples)
{
    float sum = 0.0f;
    for (int i = 0; i < numSamples; ++i)
    {
        sum += buffer[i] * buffer[i];
    }
    return std::sqrt(sum / numSamples);
}

/**
 * Count zero crossings (for frequency estimation)
 */
int countZeroCrossings(const float* buffer, int numSamples)
{
    int crossings = 0;
    for (int i = 1; i < numSamples; ++i)
    {
        if (buffer[i - 1] < 0 && buffer[i] >= 0)
            crossings++;
    }
    return crossings;
}

// ============================================================================
// Voice Tests
// ============================================================================

TEST_CASE("Voice initialization", "[voice]")
{
    // TODO: Replace with your voice implementation
    // Voice voice;

    SECTION("Voice starts inactive")
    {
        // REQUIRE_FALSE(voice.isActive());
        // REQUIRE(voice.getNote() == -1);
        REQUIRE(true); // Placeholder
    }

    SECTION("Voice can be prepared")
    {
        // voice.prepare(48000.0);
        // REQUIRE_FALSE(voice.isActive());
        REQUIRE(true); // Placeholder
    }
}

TEST_CASE("Voice note on/off", "[voice]")
{
    // TODO: Replace with your voice implementation
    // Voice voice;
    // voice.prepare(48000.0);

    SECTION("Note on activates voice")
    {
        // voice.noteOn(60, 0.8f);  // C4 at 80% velocity
        // REQUIRE(voice.isActive());
        // REQUIRE(voice.getNote() == 60);
        // REQUIRE(voice.getVelocity() == Approx(0.8f));
        REQUIRE(true); // Placeholder
    }

    SECTION("Note off enters release")
    {
        // voice.noteOn(60, 0.8f);
        // voice.noteOff();
        // REQUIRE(voice.isActive());  // Still active during release
        // REQUIRE(voice.isReleasing());
        REQUIRE(true); // Placeholder
    }

    SECTION("Kill stops voice immediately")
    {
        // voice.noteOn(60, 0.8f);
        // voice.kill();
        // REQUIRE_FALSE(voice.isActive());
        REQUIRE(true); // Placeholder
    }
}

TEST_CASE("Voice audio output", "[voice]")
{
    // TODO: Replace with your voice implementation
    // Voice voice;
    constexpr int bufferSize = 512;
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    // voice.prepare(sampleRate);

    SECTION("Silent when inactive")
    {
        // voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // All samples should be zero
        for (int i = 0; i < bufferSize; ++i)
        {
            REQUIRE(leftBuffer[i] == 0.0f);
            REQUIRE(rightBuffer[i] == 0.0f);
        }
    }

    SECTION("Produces audio when active")
    {
        // voice.noteOn(60, 1.0f);
        // voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // Should have non-zero RMS
        // float rms = calculateRMS(leftBuffer.data(), bufferSize);
        // REQUIRE(rms > 0.0f);
        REQUIRE(true); // Placeholder
    }

    SECTION("Output is valid (no NaN/Inf)")
    {
        // voice.noteOn(60, 1.0f);
        // voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        // REQUIRE(isBufferValid(rightBuffer.data(), bufferSize));
        REQUIRE(true); // Placeholder
    }

    SECTION("Output is within range [-1, 1]")
    {
        // voice.noteOn(60, 1.0f);
        // voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        for (int i = 0; i < bufferSize; ++i)
        {
            REQUIRE(leftBuffer[i] >= -1.0f);
            REQUIRE(leftBuffer[i] <= 1.0f);
        }
    }
}

TEST_CASE("Voice frequency accuracy", "[voice][dsp]")
{
    // TODO: Replace with your voice implementation
    // Voice voice;
    constexpr double sampleRate = 48000.0;
    constexpr int numSamples = 48000; // 1 second

    std::array<float, 48000> buffer{};

    // voice.prepare(sampleRate);

    SECTION("A4 (440 Hz) produces correct frequency")
    {
        // voice.noteOn(69, 1.0f);  // A4 = MIDI note 69

        // Render 1 second of audio
        // Note: render adds to buffer, so we need separate L/R
        // voice.render(buffer.data(), buffer.data(), numSamples);

        // Count zero crossings
        // int crossings = countZeroCrossings(buffer.data(), numSamples);

        // Should be approximately 440 cycles
        // REQUIRE(crossings == Approx(440).margin(5));
        REQUIRE(true); // Placeholder
    }
}

TEST_CASE("Voice envelope behavior", "[voice][envelope]")
{
    // TODO: Replace with your voice implementation
    // Voice voice;
    constexpr double sampleRate = 48000.0;
    constexpr int blockSize = 512;

    std::array<float, 512> leftBuffer{};
    std::array<float, 512> rightBuffer{};

    // voice.prepare(sampleRate);

    SECTION("Attack starts at zero")
    {
        // voice.noteOn(60, 1.0f);
        // voice.render(leftBuffer.data(), rightBuffer.data(), blockSize);

        // First sample should be near zero (or very quiet)
        // REQUIRE(std::abs(leftBuffer[0]) < 0.01f);
        REQUIRE(true); // Placeholder
    }

    SECTION("Release decays to silence")
    {
        // voice.noteOn(60, 1.0f);

        // Let attack/decay settle
        // for (int i = 0; i < 100; ++i) {
        //     voice.render(leftBuffer.data(), rightBuffer.data(), blockSize);
        // }

        // Trigger release
        // voice.noteOff();

        // Render until voice dies
        // int releaseBlocks = 0;
        // while (voice.isActive() && releaseBlocks < 1000) {
        //     voice.render(leftBuffer.data(), rightBuffer.data(), blockSize);
        //     releaseBlocks++;
        // }

        // Voice should eventually become inactive
        // REQUIRE_FALSE(voice.isActive());
        REQUIRE(true); // Placeholder
    }
}
