/**
 * @file AirwindowsTape.h
 * @brief Standalone wrapper for Airwindows Tape effect
 *
 * Ported from Airwindows "Tape" - simplified, all-purpose tape mojo
 * Original: https://www.airwindows.com/tape-redux/
 * License: MIT (Airwindows)
 *
 * Parameters:
 * - Input Gain: ±24dB input drive
 * - Head Bump: Low-frequency boost simulating playback head resonance
 *
 * Signal Flow:
 * Input -> Gain -> Softness Filter -> Head Bump -> Saturation -> Output
 */

#pragma once

#include <cmath>
#include <cstring>
#include <cstdint>
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

class AirwindowsTape
{
public:
    AirwindowsTape()
    {
        std::memset(iirMidRollerAL, 0, sizeof(double));
        std::memset(iirMidRollerBL, 0, sizeof(double));
        std::memset(iirHeadBumpAL, 0, sizeof(double));
        std::memset(iirHeadBumpBL, 0, sizeof(double));
        std::memset(iirMidRollerAR, 0, sizeof(double));
        std::memset(iirMidRollerBR, 0, sizeof(double));
        std::memset(iirHeadBumpAR, 0, sizeof(double));
        std::memset(iirHeadBumpBR, 0, sizeof(double));
        std::memset(biquadAL, 0, sizeof(biquadAL));
        std::memset(biquadBL, 0, sizeof(biquadBL));
        std::memset(biquadCL, 0, sizeof(biquadCL));
        std::memset(biquadDL, 0, sizeof(biquadDL));
        std::memset(biquadAR, 0, sizeof(biquadAR));
        std::memset(biquadBR, 0, sizeof(biquadBR));
        std::memset(biquadCR, 0, sizeof(biquadCR));
        std::memset(biquadDR, 0, sizeof(biquadDR));
        flip = false;
        lastSampleL = 0.0;
        lastSampleR = 0.0;
        fpdL = 1.0;
        fpdR = 1.0;
        inputGain = 0.5f;  // 0dB
        headBump = 0.0f;   // No head bump
    }

    void prepare(double sr)
    {
        sampleRate = sr;
        updateCoefficients();
    }

    /**
     * @brief Set input gain (drive)
     * @param gain 0-1 where 0.5 = 0dB, 0 = -24dB, 1 = +24dB
     */
    void setInputGain(float gain)
    {
        inputGain = std::clamp(gain, 0.0f, 1.0f);
    }

    /**
     * @brief Set head bump amount (bass boost)
     * @param bump 0-1
     */
    void setHeadBump(float bump)
    {
        headBump = std::clamp(bump, 0.0f, 1.0f);
    }

    void process(float& left, float& right)
    {
        double inputSampleL = static_cast<double>(left);
        double inputSampleR = static_cast<double>(right);

        // Denormal protection
        if (std::fabs(inputSampleL) < 1.18e-23) inputSampleL = fpdL * 1.18e-17;
        if (std::fabs(inputSampleR) < 1.18e-23) inputSampleR = fpdR * 1.18e-17;

        // Input gain (drive)
        double gain = std::pow(10.0, ((inputGain - 0.5) * 24.0) / 20.0);
        inputSampleL *= gain;
        inputSampleR *= gain;

        // Biquad coefficient calculation (frequency-dependent parameters)
        double overallscale = sampleRate / 44100.0;
        double bumpGain = headBump * 0.1;
        double HeadBumpFreq = 0.12 / overallscale;
        double softness = 0.618033988749894848204586;
        double RollAmount = (1.0 - softness) / overallscale;

        double HighsSampleL = 0.0;
        double HighsSampleR = 0.0;
        double NonHighsSampleL = 0.0;
        double NonHighsSampleR = 0.0;
        double tempSample;

        // Flip-flop filter (reduces aliasing)
        if (flip)
        {
            // Left channel processing
            iirMidRollerAL[0] = (iirMidRollerAL[0] * (1.0 - RollAmount)) + (inputSampleL * RollAmount);
            HighsSampleL = inputSampleL - iirMidRollerAL[0];
            NonHighsSampleL = iirMidRollerAL[0];

            // Head bump (bass resonance)
            iirHeadBumpAL[0] += (inputSampleL * 0.05);
            iirHeadBumpAL[0] -= (iirHeadBumpAL[0] * iirHeadBumpAL[0] * iirHeadBumpAL[0] * HeadBumpFreq);
            iirHeadBumpAL[0] = std::sin(iirHeadBumpAL[0]);

            // Biquad filter for head bump
            tempSample = (iirHeadBumpAL[0] * biquadAL[2]) + biquadAL[7];
            biquadAL[7] = (iirHeadBumpAL[0] * biquadAL[3]) - (tempSample * biquadAL[5]) + biquadAL[8];
            biquadAL[8] = (iirHeadBumpAL[0] * biquadAL[4]) - (tempSample * biquadAL[6]);
            iirHeadBumpAL[0] = tempSample;
            if (iirHeadBumpAL[0] > 1.0) iirHeadBumpAL[0] = 1.0;
            if (iirHeadBumpAL[0] < -1.0) iirHeadBumpAL[0] = -1.0;
            iirHeadBumpAL[0] = std::asin(iirHeadBumpAL[0]);

            // Main saturation
            inputSampleL = std::sin(inputSampleL);
            tempSample = (inputSampleL * biquadCL[2]) + biquadCL[7];
            biquadCL[7] = (inputSampleL * biquadCL[3]) - (tempSample * biquadCL[5]) + biquadCL[8];
            biquadCL[8] = (inputSampleL * biquadCL[4]) - (tempSample * biquadCL[6]);
            inputSampleL = tempSample;
            if (inputSampleL > 1.0) inputSampleL = 1.0;
            if (inputSampleL < -1.0) inputSampleL = -1.0;
            inputSampleL = std::asin(inputSampleL);

            // Right channel (mirror of left)
            iirMidRollerAR[0] = (iirMidRollerAR[0] * (1.0 - RollAmount)) + (inputSampleR * RollAmount);
            HighsSampleR = inputSampleR - iirMidRollerAR[0];
            NonHighsSampleR = iirMidRollerAR[0];

            iirHeadBumpAR[0] += (inputSampleR * 0.05);
            iirHeadBumpAR[0] -= (iirHeadBumpAR[0] * iirHeadBumpAR[0] * iirHeadBumpAR[0] * HeadBumpFreq);
            iirHeadBumpAR[0] = std::sin(iirHeadBumpAR[0]);

            tempSample = (iirHeadBumpAR[0] * biquadAR[2]) + biquadAR[7];
            biquadAR[7] = (iirHeadBumpAR[0] * biquadAR[3]) - (tempSample * biquadAR[5]) + biquadAR[8];
            biquadAR[8] = (iirHeadBumpAR[0] * biquadAR[4]) - (tempSample * biquadAR[6]);
            iirHeadBumpAR[0] = tempSample;
            if (iirHeadBumpAR[0] > 1.0) iirHeadBumpAR[0] = 1.0;
            if (iirHeadBumpAR[0] < -1.0) iirHeadBumpAR[0] = -1.0;
            iirHeadBumpAR[0] = std::asin(iirHeadBumpAR[0]);

            inputSampleR = std::sin(inputSampleR);
            tempSample = (inputSampleR * biquadCR[2]) + biquadCR[7];
            biquadCR[7] = (inputSampleR * biquadCR[3]) - (tempSample * biquadCR[5]) + biquadCR[8];
            biquadCR[8] = (inputSampleR * biquadCR[4]) - (tempSample * biquadCR[6]);
            inputSampleR = tempSample;
            if (inputSampleR > 1.0) inputSampleR = 1.0;
            if (inputSampleR < -1.0) inputSampleR = -1.0;
            inputSampleR = std::asin(inputSampleR);
        }
        else  // !flip
        {
            // Left channel (B filters)
            iirMidRollerBL[0] = (iirMidRollerBL[0] * (1.0 - RollAmount)) + (inputSampleL * RollAmount);
            HighsSampleL = inputSampleL - iirMidRollerBL[0];
            NonHighsSampleL = iirMidRollerBL[0];

            iirHeadBumpBL[0] += (inputSampleL * 0.05);
            iirHeadBumpBL[0] -= (iirHeadBumpBL[0] * iirHeadBumpBL[0] * iirHeadBumpBL[0] * HeadBumpFreq);
            iirHeadBumpBL[0] = std::sin(iirHeadBumpBL[0]);

            tempSample = (iirHeadBumpBL[0] * biquadBL[2]) + biquadBL[7];
            biquadBL[7] = (iirHeadBumpBL[0] * biquadBL[3]) - (tempSample * biquadBL[5]) + biquadBL[8];
            biquadBL[8] = (iirHeadBumpBL[0] * biquadBL[4]) - (tempSample * biquadBL[6]);
            iirHeadBumpBL[0] = tempSample;
            if (iirHeadBumpBL[0] > 1.0) iirHeadBumpBL[0] = 1.0;
            if (iirHeadBumpBL[0] < -1.0) iirHeadBumpBL[0] = -1.0;
            iirHeadBumpBL[0] = std::asin(iirHeadBumpBL[0]);

            inputSampleL = std::sin(inputSampleL);
            tempSample = (inputSampleL * biquadDL[2]) + biquadDL[7];
            biquadDL[7] = (inputSampleL * biquadDL[3]) - (tempSample * biquadDL[5]) + biquadDL[8];
            biquadDL[8] = (inputSampleL * biquadDL[4]) - (tempSample * biquadDL[6]);
            inputSampleL = tempSample;
            if (inputSampleL > 1.0) inputSampleL = 1.0;
            if (inputSampleL < -1.0) inputSampleL = -1.0;
            inputSampleL = std::asin(inputSampleL);

            // Right channel
            iirMidRollerBR[0] = (iirMidRollerBR[0] * (1.0 - RollAmount)) + (inputSampleR * RollAmount);
            HighsSampleR = inputSampleR - iirMidRollerBR[0];
            NonHighsSampleR = iirMidRollerBR[0];

            iirHeadBumpBR[0] += (inputSampleR * 0.05);
            iirHeadBumpBR[0] -= (iirHeadBumpBR[0] * iirHeadBumpBR[0] * iirHeadBumpBR[0] * HeadBumpFreq);
            iirHeadBumpBR[0] = std::sin(iirHeadBumpBR[0]);

            tempSample = (iirHeadBumpBR[0] * biquadBR[2]) + biquadBR[7];
            biquadBR[7] = (iirHeadBumpBR[0] * biquadBR[3]) - (tempSample * biquadBR[5]) + biquadBR[8];
            biquadBR[8] = (iirHeadBumpBR[0] * biquadBR[4]) - (tempSample * biquadBR[6]);
            iirHeadBumpBR[0] = tempSample;
            if (iirHeadBumpBR[0] > 1.0) iirHeadBumpBR[0] = 1.0;
            if (iirHeadBumpBR[0] < -1.0) iirHeadBumpBR[0] = -1.0;
            iirHeadBumpBR[0] = std::asin(iirHeadBumpBR[0]);

            inputSampleR = std::sin(inputSampleR);
            tempSample = (inputSampleR * biquadDR[2]) + biquadDR[7];
            biquadDR[7] = (inputSampleR * biquadDR[3]) - (tempSample * biquadDR[5]) + biquadDR[8];
            biquadDR[8] = (inputSampleR * biquadDR[4]) - (tempSample * biquadDR[6]);
            inputSampleR = tempSample;
            if (inputSampleR > 1.0) inputSampleR = 1.0;
            if (inputSampleR < -1.0) inputSampleR = -1.0;
            inputSampleR = std::asin(inputSampleR);
        }

        flip = !flip;

        // Mix in head bump
        inputSampleL = (inputSampleL * (1.0 - bumpGain)) + (iirHeadBumpAL[0] * bumpGain) + (iirHeadBumpBL[0] * bumpGain);
        inputSampleR = (inputSampleR * (1.0 - bumpGain)) + (iirHeadBumpAR[0] * bumpGain) + (iirHeadBumpBR[0] * bumpGain);

        // 32-bit dither
        int expon;
        frexpf(static_cast<float>(inputSampleL), &expon);
        fpdL ^= fpdL << 13; fpdL ^= fpdL >> 17; fpdL ^= fpdL << 5;
        inputSampleL += ((static_cast<double>(fpdL) - uint32_t(0x7fffffff)) * 5.5e-36l * std::pow(2, expon + 62));

        frexpf(static_cast<float>(inputSampleR), &expon);
        fpdR ^= fpdR << 13; fpdR ^= fpdR >> 17; fpdR ^= fpdR << 5;
        inputSampleR += ((static_cast<double>(fpdR) - uint32_t(0x7fffffff)) * 5.5e-36l * std::pow(2, expon + 62));

        left = static_cast<float>(inputSampleL);
        right = static_cast<float>(inputSampleR);
    }

private:
    void updateCoefficients()
    {
        double overallscale = sampleRate / 44100.0;

        // Biquad A/B (for head bump)
        biquadAL[0] = biquadBL[0] = biquadAR[0] = biquadBR[0] = 0.0072 / overallscale;
        biquadAL[1] = biquadBL[1] = biquadAR[1] = biquadBR[1] = 0.0009;
        double K = std::tan(M_PI * biquadBR[0]);
        double norm = 1.0 / (1.0 + K / biquadBR[1] + K * K);
        biquadAL[2] = biquadBL[2] = biquadAR[2] = biquadBR[2] = K / biquadBR[1] * norm;
        biquadAL[4] = biquadBL[4] = biquadAR[4] = biquadBR[4] = -biquadBR[2];
        biquadAL[5] = biquadBL[5] = biquadAR[5] = biquadBR[5] = 2.0 * (K * K - 1.0) * norm;
        biquadAL[6] = biquadBL[6] = biquadAR[6] = biquadBR[6] = (1.0 - K / biquadBR[1] + K * K) * norm;

        // Biquad C/D (for main saturation)
        biquadCL[0] = biquadDL[0] = biquadCR[0] = biquadDR[0] = 0.032 / overallscale;
        biquadCL[1] = biquadDL[1] = biquadCR[1] = biquadDR[1] = 0.0007;
        K = std::tan(M_PI * biquadDR[0]);
        norm = 1.0 / (1.0 + K / biquadDR[1] + K * K);
        biquadCL[2] = biquadDL[2] = biquadCR[2] = biquadDR[2] = K / biquadDR[1] * norm;
        biquadCL[4] = biquadDL[4] = biquadCR[4] = biquadDR[4] = -biquadDR[2];
        biquadCL[5] = biquadDL[5] = biquadCR[5] = biquadDR[5] = 2.0 * (K * K - 1.0) * norm;
        biquadCL[6] = biquadDL[6] = biquadCR[6] = biquadDR[6] = (1.0 - K / biquadDR[1] + K * K) * norm;
    }

    double sampleRate = 44100.0;

    // IIR state (dual-path for flip-flop anti-aliasing)
    double iirMidRollerAL[1]{}, iirMidRollerBL[1]{};
    double iirHeadBumpAL[1]{}, iirHeadBumpBL[1]{};
    double iirMidRollerAR[1]{}, iirMidRollerBR[1]{};
    double iirHeadBumpAR[1]{}, iirHeadBumpBR[1]{};

    // Biquad filter coefficients and state
    double biquadAL[9]{}, biquadBL[9]{}, biquadCL[9]{}, biquadDL[9]{};
    double biquadAR[9]{}, biquadBR[9]{}, biquadCR[9]{}, biquadDR[9]{};

    bool flip = false;
    double lastSampleL = 0.0, lastSampleR = 0.0;

    // Dither state
    uint32_t fpdL = 1, fpdR = 1;

    // Parameters
    float inputGain = 0.5f;  // 0-1 (0.5 = 0dB, full range is ±24dB)
    float headBump = 0.0f;   // 0-1
};
