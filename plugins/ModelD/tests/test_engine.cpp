/**
 * @file test_engine.cpp
 * @brief Unit tests for the Model D SynthEngine class
 *
 * Tests:
 * - Engine initialization
 * - Polyphony and voice allocation
 * - Voice stealing
 * - Audio output
 * - Parameter routing
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <cmath>
#include <array>

#include "../source/dsp/SynthEngine.h"

using Catch::Approx;

// ============================================================================
// Test Utilities
// ============================================================================
namespace {

bool isBufferSilent(const float* buffer, int numSamples, float threshold = 1e-6f)
{
    for (int i = 0; i < numSamples; ++i)
    {
        if (std::abs(buffer[i]) > threshold)
            return false;
    }
    return true;
}

bool isBufferValid(const float* buffer, int numSamples)
{
    for (int i = 0; i < numSamples; ++i)
    {
        if (std::isnan(buffer[i]) || std::isinf(buffer[i]))
            return false;
    }
    return true;
}

float calculateRMS(const float* buffer, int numSamples)
{
    float sum = 0.0f;
    for (int i = 0; i < numSamples; ++i)
    {
        sum += buffer[i] * buffer[i];
    }
    return std::sqrt(sum / numSamples);
}

void clearBuffer(float* buffer, int numSamples)
{
    for (int i = 0; i < numSamples; ++i)
        buffer[i] = 0.0f;
}

} // anonymous namespace

// ============================================================================
// SynthEngine Tests
// ============================================================================

TEST_CASE("SynthEngine initialization", "[engine]")
{
    SynthEngine engine;

    SECTION("Engine can be prepared")
    {
        engine.prepare(48000.0, 512);
        REQUIRE(engine.getActiveVoiceCount() == 0);
    }
}

TEST_CASE("SynthEngine voice allocation", "[engine][voices]")
{
    SynthEngine engine;
    engine.prepare(48000.0, 512);

    SECTION("Note on allocates voice")
    {
        engine.noteOn(60, 0.8f);
        REQUIRE(engine.getActiveVoiceCount() == 1);
    }

    SECTION("Multiple notes allocate multiple voices")
    {
        engine.noteOn(60, 0.8f);
        engine.noteOn(64, 0.8f);
        engine.noteOn(67, 0.8f);
        REQUIRE(engine.getActiveVoiceCount() == 3);
    }

    SECTION("Note off triggers release (voice still active)")
    {
        engine.noteOn(60, 0.8f);
        engine.noteOff(60);
        // Voice should still be active (in release phase)
        REQUIRE(engine.getActiveVoiceCount() == 1);
    }

    SECTION("All notes off kills all voices")
    {
        engine.noteOn(60, 0.8f);
        engine.noteOn(64, 0.8f);
        engine.noteOn(67, 0.8f);
        engine.allNotesOff();
        REQUIRE(engine.getActiveVoiceCount() == 0);
    }
}

TEST_CASE("SynthEngine voice stealing", "[engine][voices]")
{
    SynthEngine engine;
    engine.prepare(48000.0, 512);

    SECTION("Voice stealing when pool exhausted")
    {
        // Play MAX_VOICES + 1 notes
        for (int i = 0; i < SynthEngine::MAX_VOICES + 1; ++i)
        {
            engine.noteOn(48 + i, 0.8f);
        }

        // Should not exceed MAX_VOICES
        REQUIRE(engine.getActiveVoiceCount() <= SynthEngine::MAX_VOICES);
    }
}

TEST_CASE("SynthEngine audio rendering", "[engine][audio]")
{
    SynthEngine engine;
    constexpr int bufferSize = 512;
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    engine.prepare(sampleRate, bufferSize);

    SECTION("Silent output when no notes")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

        REQUIRE(isBufferSilent(leftBuffer.data(), bufferSize));
        REQUIRE(isBufferSilent(rightBuffer.data(), bufferSize));
    }

    SECTION("Produces output when playing")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        engine.noteOn(60, 1.0f);
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // Should have some audio
        REQUIRE_FALSE(isBufferSilent(leftBuffer.data(), bufferSize));
    }

    SECTION("Output is valid (no NaN/Inf)")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        engine.noteOn(60, 1.0f);
        engine.noteOn(64, 1.0f);
        engine.noteOn(67, 1.0f);
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

        REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        REQUIRE(isBufferValid(rightBuffer.data(), bufferSize));
    }

    SECTION("Master volume affects output")
    {
        // Render with default volume (-6dB)
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        engine.noteOn(60, 1.0f);
        engine.setMasterVolume(-6.0f);
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);
        float rmsDefault = calculateRMS(leftBuffer.data(), bufferSize);

        // Kill and restart
        engine.allNotesOff();

        // Render with reduced volume
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        engine.noteOn(60, 1.0f);
        engine.setMasterVolume(-24.0f);  // -24dB
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);
        float rmsQuiet = calculateRMS(leftBuffer.data(), bufferSize);

        REQUIRE(rmsQuiet < rmsDefault);
    }
}

TEST_CASE("SynthEngine parameter update", "[engine][params]")
{
    SynthEngine engine;
    engine.prepare(48000.0, 512);

    SECTION("Oscillator parameters can be updated")
    {
        // These should not crash
        engine.setOsc1Waveform(0);  // Saw
        engine.setOsc1Octave(-1);
        engine.setOsc1Level(0.8f);

        engine.setOsc2Waveform(1);  // Triangle
        engine.setOsc2Octave(0);
        engine.setOsc2Detune(5.0f);
        engine.setOsc2Level(0.7f);
        engine.setOsc2Sync(true);

        engine.setOsc3Waveform(2);  // Pulse
        engine.setOsc3Octave(1);
        engine.setOsc3Detune(-3.0f);
        engine.setOsc3Level(0.5f);

        engine.setNoiseLevel(0.1f);

        REQUIRE(true);  // No crash
    }

    SECTION("Filter parameters can be updated")
    {
        engine.setFilterCutoff(1000.0f);
        engine.setFilterResonance(0.5f);
        engine.setFilterEnvAmount(0.7f);
        engine.setFilterKeyboardTracking(0.5f);

        REQUIRE(true);  // No crash
    }

    SECTION("Envelope parameters can be updated")
    {
        engine.setAmpEnvelope(0.01f, 0.1f, 0.7f, 0.3f);
        engine.setFilterEnvelope(0.05f, 0.2f, 0.5f, 0.4f);

        REQUIRE(true);  // No crash
    }

    SECTION("Parameters are passed to voices")
    {
        constexpr int bufferSize = 512;
        std::array<float, bufferSize> leftBuffer{};
        std::array<float, bufferSize> rightBuffer{};

        // Set extreme filter cutoff
        engine.setFilterCutoff(200.0f);  // Low cutoff
        engine.setFilterEnvAmount(0.0f);  // No envelope

        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        engine.noteOn(60, 1.0f);
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

        float rmsLow = calculateRMS(leftBuffer.data(), bufferSize);

        engine.allNotesOff();

        // Set high filter cutoff
        engine.setFilterCutoff(15000.0f);

        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        engine.noteOn(60, 1.0f);
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

        float rmsHigh = calculateRMS(leftBuffer.data(), bufferSize);

        // Higher cutoff should produce more energy
        REQUIRE(rmsHigh > rmsLow);
    }

    SECTION("Pitch bend can be set")
    {
        engine.noteOn(60, 1.0f);
        engine.setPitchBend(1.0f);   // Full pitch bend up
        engine.setPitchBend(-1.0f);  // Full pitch bend down
        engine.setPitchBend(0.0f);   // Center

        REQUIRE(true);  // No crash
    }
}

TEST_CASE("SynthEngine polyphony", "[engine][poly]")
{
    SynthEngine engine;
    constexpr int bufferSize = 512;
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    engine.prepare(sampleRate, bufferSize);

    SECTION("Chord produces valid output")
    {
        // Play a C major chord
        engine.noteOn(60, 0.8f);  // C4
        engine.noteOn(64, 0.8f);  // E4
        engine.noteOn(67, 0.8f);  // G4

        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);
        engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

        REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        REQUIRE_FALSE(isBufferSilent(leftBuffer.data(), bufferSize));
        REQUIRE(engine.getActiveVoiceCount() == 3);
    }

    SECTION("Releasing notes reduces voice count over time")
    {
        engine.noteOn(60, 0.8f);
        engine.noteOn(64, 0.8f);
        engine.noteOn(67, 0.8f);

        // Release all notes
        engine.noteOff(60);
        engine.noteOff(64);
        engine.noteOff(67);

        // Set fast release
        engine.setAmpEnvelope(0.001f, 0.001f, 0.5f, 0.05f);

        // Render until voices die
        int iterations = 0;
        while (engine.getActiveVoiceCount() > 0 && iterations < 1000)
        {
            clearBuffer(leftBuffer.data(), bufferSize);
            clearBuffer(rightBuffer.data(), bufferSize);
            engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);
            iterations++;
        }

        // All voices should eventually become inactive
        REQUIRE(engine.getActiveVoiceCount() == 0);
    }
}

TEST_CASE("SynthEngine stress test", "[engine][stress]")
{
    SynthEngine engine;
    constexpr int bufferSize = 512;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    engine.prepare(48000.0, bufferSize);

    SECTION("Rapid note on/off does not crash")
    {
        for (int i = 0; i < 1000; ++i)
        {
            int note = 48 + (i % 36);
            if (i % 2 == 0)
            {
                engine.noteOn(note, 0.8f);
            }
            else
            {
                engine.noteOff(note);
            }

            clearBuffer(leftBuffer.data(), bufferSize);
            clearBuffer(rightBuffer.data(), bufferSize);
            engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

            REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        }
    }

    SECTION("Long rendering does not accumulate errors")
    {
        engine.noteOn(60, 0.8f);

        // Render 10 seconds of audio
        for (int i = 0; i < 10 * 48000 / bufferSize; ++i)
        {
            clearBuffer(leftBuffer.data(), bufferSize);
            clearBuffer(rightBuffer.data(), bufferSize);
            engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

            REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        }
    }

    SECTION("Rapid parameter changes during playback")
    {
        engine.noteOn(60, 0.8f);

        for (int i = 0; i < 100; ++i)
        {
            // Vary parameters
            engine.setFilterCutoff(100.0f + i * 100.0f);
            engine.setFilterResonance(static_cast<float>(i % 100) / 100.0f);
            engine.setOsc1Level(0.5f + static_cast<float>(i % 50) / 100.0f);

            clearBuffer(leftBuffer.data(), bufferSize);
            clearBuffer(rightBuffer.data(), bufferSize);
            engine.renderBlock(leftBuffer.data(), rightBuffer.data(), bufferSize);

            REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        }
    }
}
