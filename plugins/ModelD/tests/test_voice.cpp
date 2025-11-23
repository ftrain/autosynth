/**
 * @file test_voice.cpp
 * @brief Unit tests for the Model D Voice class
 *
 * Tests:
 * - Voice initialization
 * - Note on/off behavior
 * - Audio output validity
 * - Envelope behavior
 * - Oscillator waveforms
 * - Filter behavior
 */

#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <cmath>
#include <array>

#include "../source/dsp/Voice.h"

using Catch::Approx;

// ============================================================================
// Test Utilities
// ============================================================================
namespace {

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

/**
 * Clear buffer
 */
void clearBuffer(float* buffer, int numSamples)
{
    for (int i = 0; i < numSamples; ++i)
        buffer[i] = 0.0f;
}

} // anonymous namespace

// ============================================================================
// Voice Tests
// ============================================================================

TEST_CASE("Voice initialization", "[voice]")
{
    Voice voice;

    SECTION("Voice starts inactive")
    {
        REQUIRE_FALSE(voice.isActive());
        REQUIRE(voice.getNote() == -1);
    }

    SECTION("Voice can be prepared")
    {
        voice.prepare(48000.0);
        REQUIRE_FALSE(voice.isActive());
    }
}

TEST_CASE("Voice note on/off", "[voice]")
{
    Voice voice;
    voice.prepare(48000.0);

    SECTION("Note on activates voice")
    {
        voice.noteOn(60, 0.8f);  // C4 at 80% velocity
        REQUIRE(voice.isActive());
        REQUIRE(voice.getNote() == 60);
        REQUIRE(voice.getVelocity() == Approx(0.8f));
    }

    SECTION("Note off enters release")
    {
        voice.noteOn(60, 0.8f);
        voice.noteOff();
        REQUIRE(voice.isActive());  // Still active during release
        REQUIRE(voice.isReleasing());
    }

    SECTION("Kill stops voice immediately")
    {
        voice.noteOn(60, 0.8f);
        voice.kill();
        REQUIRE_FALSE(voice.isActive());
    }
}

TEST_CASE("Voice audio output", "[voice]")
{
    Voice voice;
    constexpr int bufferSize = 512;
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    voice.prepare(sampleRate);

    SECTION("Silent when inactive")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // All samples should still be zero
        for (int i = 0; i < bufferSize; ++i)
        {
            REQUIRE(leftBuffer[i] == 0.0f);
            REQUIRE(rightBuffer[i] == 0.0f);
        }
    }

    SECTION("Produces audio when active")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // Should have non-zero RMS
        float rms = calculateRMS(leftBuffer.data(), bufferSize);
        REQUIRE(rms > 0.0f);
    }

    SECTION("Output is valid (no NaN/Inf)")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        REQUIRE(isBufferValid(rightBuffer.data(), bufferSize));
    }

    SECTION("Output is within reasonable range")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // Output might be slightly above 1.0 due to multiple oscillators
        // but should not be extreme
        for (int i = 0; i < bufferSize; ++i)
        {
            REQUIRE(leftBuffer[i] >= -5.0f);
            REQUIRE(leftBuffer[i] <= 5.0f);
        }
    }
}

TEST_CASE("Voice oscillator waveforms", "[voice][oscillator]")
{
    Voice voice;
    constexpr int bufferSize = 4800; // 100ms at 48kHz
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    voice.prepare(sampleRate);
    voice.setOsc1Level(1.0f);
    voice.setOsc2Level(0.0f);  // Disable osc2 and osc3 for testing
    voice.setOsc3Level(0.0f);
    voice.setNoiseLevel(0.0f);

    SECTION("Saw waveform produces audio")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.setOsc1Waveform(Oscillator::Waveform::Saw);
        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        float rms = calculateRMS(leftBuffer.data(), bufferSize);
        REQUIRE(rms > 0.0f);
    }

    SECTION("Triangle waveform produces audio")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.setOsc1Waveform(Oscillator::Waveform::Triangle);
        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        float rms = calculateRMS(leftBuffer.data(), bufferSize);
        REQUIRE(rms > 0.0f);
    }

    SECTION("Pulse waveform produces audio")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.setOsc1Waveform(Oscillator::Waveform::Pulse);
        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        float rms = calculateRMS(leftBuffer.data(), bufferSize);
        REQUIRE(rms > 0.0f);
    }

    SECTION("Sine waveform produces audio")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.setOsc1Waveform(Oscillator::Waveform::Sine);
        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        float rms = calculateRMS(leftBuffer.data(), bufferSize);
        REQUIRE(rms > 0.0f);
    }
}

TEST_CASE("Voice filter behavior", "[voice][filter]")
{
    Voice voice;
    constexpr int bufferSize = 4800;
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBufferLow{};
    std::array<float, bufferSize> rightBufferLow{};
    std::array<float, bufferSize> leftBufferHigh{};
    std::array<float, bufferSize> rightBufferHigh{};

    SECTION("Low cutoff produces quieter output than high cutoff")
    {
        // Test with low cutoff
        Voice voiceLow;
        voiceLow.prepare(sampleRate);
        voiceLow.setOsc1Level(1.0f);
        voiceLow.setOsc2Level(0.0f);
        voiceLow.setOsc3Level(0.0f);
        voiceLow.setFilterCutoff(200.0f);  // Very low cutoff
        voiceLow.setFilterEnvAmount(0.0f);  // No envelope modulation

        clearBuffer(leftBufferLow.data(), bufferSize);
        clearBuffer(rightBufferLow.data(), bufferSize);
        voiceLow.noteOn(60, 1.0f);
        voiceLow.render(leftBufferLow.data(), rightBufferLow.data(), bufferSize);

        // Test with high cutoff
        Voice voiceHigh;
        voiceHigh.prepare(sampleRate);
        voiceHigh.setOsc1Level(1.0f);
        voiceHigh.setOsc2Level(0.0f);
        voiceHigh.setOsc3Level(0.0f);
        voiceHigh.setFilterCutoff(10000.0f);  // High cutoff
        voiceHigh.setFilterEnvAmount(0.0f);

        clearBuffer(leftBufferHigh.data(), bufferSize);
        clearBuffer(rightBufferHigh.data(), bufferSize);
        voiceHigh.noteOn(60, 1.0f);
        voiceHigh.render(leftBufferHigh.data(), rightBufferHigh.data(), bufferSize);

        float rmsLow = calculateRMS(leftBufferLow.data(), bufferSize);
        float rmsHigh = calculateRMS(leftBufferHigh.data(), bufferSize);

        // Low cutoff should produce less energy (filter removes harmonics)
        REQUIRE(rmsLow < rmsHigh);
    }
}

TEST_CASE("Voice envelope behavior", "[voice][envelope]")
{
    Voice voice;
    constexpr double sampleRate = 48000.0;
    constexpr int blockSize = 512;

    std::array<float, blockSize> leftBuffer{};
    std::array<float, blockSize> rightBuffer{};

    voice.prepare(sampleRate);

    SECTION("Attack starts quiet and builds up")
    {
        // Set a relatively slow attack
        voice.setAmpAttack(0.1f);  // 100ms attack
        voice.setAmpDecay(0.1f);
        voice.setAmpSustain(1.0f);
        voice.setAmpRelease(0.1f);

        clearBuffer(leftBuffer.data(), blockSize);
        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), blockSize);

        float rmsFirst = calculateRMS(leftBuffer.data(), blockSize / 4);

        // Render more blocks to let attack develop
        for (int i = 0; i < 10; ++i)
        {
            clearBuffer(leftBuffer.data(), blockSize);
            voice.render(leftBuffer.data(), rightBuffer.data(), blockSize);
        }

        float rmsLater = calculateRMS(leftBuffer.data(), blockSize);

        // Later should be louder (attack has developed)
        REQUIRE(rmsLater > rmsFirst);
    }

    SECTION("Release decays to silence")
    {
        voice.setAmpAttack(0.001f);  // Fast attack
        voice.setAmpDecay(0.001f);
        voice.setAmpSustain(1.0f);
        voice.setAmpRelease(0.1f);  // 100ms release

        voice.noteOn(60, 1.0f);

        // Let attack/decay settle
        for (int i = 0; i < 10; ++i)
        {
            clearBuffer(leftBuffer.data(), blockSize);
            voice.render(leftBuffer.data(), rightBuffer.data(), blockSize);
        }

        // Trigger release
        voice.noteOff();

        // Render until voice dies
        int releaseBlocks = 0;
        while (voice.isActive() && releaseBlocks < 1000)
        {
            clearBuffer(leftBuffer.data(), blockSize);
            voice.render(leftBuffer.data(), rightBuffer.data(), blockSize);
            releaseBlocks++;
        }

        // Voice should eventually become inactive
        REQUIRE_FALSE(voice.isActive());
    }
}

TEST_CASE("Voice parameter setters", "[voice][params]")
{
    Voice voice;
    voice.prepare(48000.0);

    SECTION("Oscillator setters do not crash")
    {
        voice.setOsc1Waveform(Oscillator::Waveform::Saw);
        voice.setOsc1Octave(-1);
        voice.setOsc1Level(0.5f);

        voice.setOsc2Waveform(Oscillator::Waveform::Triangle);
        voice.setOsc2Octave(1);
        voice.setOsc2Detune(5.0f);
        voice.setOsc2Level(0.7f);
        voice.setOsc2Sync(true);

        voice.setOsc3Waveform(Oscillator::Waveform::Sine);
        voice.setOsc3Octave(-2);
        voice.setOsc3Detune(-10.0f);
        voice.setOsc3Level(0.3f);

        voice.setNoiseLevel(0.1f);

        REQUIRE(true);  // No crash
    }

    SECTION("Filter setters do not crash")
    {
        voice.setFilterCutoff(1000.0f);
        voice.setFilterResonance(0.7f);
        voice.setFilterEnvAmount(-0.5f);
        voice.setFilterKeyboardTracking(0.5f);

        REQUIRE(true);  // No crash
    }

    SECTION("Envelope setters do not crash")
    {
        voice.setAmpAttack(0.5f);
        voice.setAmpDecay(0.3f);
        voice.setAmpSustain(0.6f);
        voice.setAmpRelease(0.8f);

        voice.setFilterAttack(0.1f);
        voice.setFilterDecay(0.2f);
        voice.setFilterSustain(0.4f);
        voice.setFilterRelease(0.5f);

        REQUIRE(true);  // No crash
    }
}

TEST_CASE("Voice LFO behavior", "[voice][lfo]")
{
    Voice voice;
    constexpr int bufferSize = 4800; // 100ms at 48kHz
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    voice.prepare(sampleRate);

    SECTION("LFO setters do not crash")
    {
        voice.setLFORate(1.0f);
        voice.setLFOWaveform(LFO::Waveform::Sine);
        voice.setLFOPitchAmount(0.5f);
        voice.setLFOFilterAmount(0.5f);

        REQUIRE(true);  // No crash
    }

    SECTION("LFO pitch modulation produces valid output")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.setOsc1Level(1.0f);
        voice.setOsc2Level(0.0f);
        voice.setOsc3Level(0.0f);
        voice.setLFORate(5.0f);  // 5 Hz
        voice.setLFOWaveform(LFO::Waveform::Sine);
        voice.setLFOPitchAmount(0.5f);  // 6 semitone modulation
        voice.setLFOFilterAmount(0.0f);

        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // Should produce valid audio (no NaN/Inf)
        REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));

        // Should produce audio
        float rms = calculateRMS(leftBuffer.data(), bufferSize);
        REQUIRE(rms > 0.0f);
    }

    SECTION("LFO filter modulation produces valid output")
    {
        clearBuffer(leftBuffer.data(), bufferSize);
        clearBuffer(rightBuffer.data(), bufferSize);

        voice.setOsc1Level(1.0f);
        voice.setOsc2Level(0.0f);
        voice.setOsc3Level(0.0f);
        voice.setFilterCutoff(1000.0f);
        voice.setLFORate(5.0f);  // 5 Hz
        voice.setLFOWaveform(LFO::Waveform::Triangle);
        voice.setLFOPitchAmount(0.0f);
        voice.setLFOFilterAmount(0.5f);  // 4000 Hz modulation

        voice.noteOn(60, 1.0f);
        voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

        // Should produce valid audio (no NaN/Inf)
        REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));

        // Should produce audio
        float rms = calculateRMS(leftBuffer.data(), bufferSize);
        REQUIRE(rms > 0.0f);
    }

    SECTION("All LFO waveforms produce valid output")
    {
        voice.setOsc1Level(1.0f);
        voice.setOsc2Level(0.0f);
        voice.setOsc3Level(0.0f);
        voice.setLFORate(2.0f);
        voice.setLFOPitchAmount(0.25f);
        voice.setLFOFilterAmount(0.25f);

        // Test each waveform
        std::array<LFO::Waveform, 5> waveforms = {
            LFO::Waveform::Sine,
            LFO::Waveform::Triangle,
            LFO::Waveform::Saw,
            LFO::Waveform::Square,
            LFO::Waveform::SampleHold
        };

        for (auto wf : waveforms)
        {
            Voice testVoice;
            testVoice.prepare(sampleRate);
            testVoice.setOsc1Level(1.0f);
            testVoice.setOsc2Level(0.0f);
            testVoice.setOsc3Level(0.0f);
            testVoice.setLFORate(2.0f);
            testVoice.setLFOWaveform(wf);
            testVoice.setLFOPitchAmount(0.25f);
            testVoice.setLFOFilterAmount(0.25f);

            clearBuffer(leftBuffer.data(), bufferSize);
            clearBuffer(rightBuffer.data(), bufferSize);

            testVoice.noteOn(60, 1.0f);
            testVoice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

            REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        }
    }
}

TEST_CASE("Voice stress test", "[voice][stress]")
{
    Voice voice;
    constexpr int bufferSize = 512;
    constexpr double sampleRate = 48000.0;

    std::array<float, bufferSize> leftBuffer{};
    std::array<float, bufferSize> rightBuffer{};

    voice.prepare(sampleRate);

    SECTION("Long rendering does not accumulate errors")
    {
        voice.noteOn(60, 0.8f);

        // Render 5 seconds of audio
        for (int i = 0; i < 5 * 48000 / bufferSize; ++i)
        {
            clearBuffer(leftBuffer.data(), bufferSize);
            clearBuffer(rightBuffer.data(), bufferSize);
            voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);
            REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        }
    }

    SECTION("Rapid parameter changes do not cause instability")
    {
        voice.noteOn(60, 0.8f);

        for (int i = 0; i < 100; ++i)
        {
            voice.setFilterCutoff(100.0f + i * 100.0f);
            voice.setFilterResonance(static_cast<float>(i % 100) / 100.0f);

            clearBuffer(leftBuffer.data(), bufferSize);
            clearBuffer(rightBuffer.data(), bufferSize);
            voice.render(leftBuffer.data(), rightBuffer.data(), bufferSize);

            REQUIRE(isBufferValid(leftBuffer.data(), bufferSize));
        }
    }
}
