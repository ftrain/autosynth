/**
 * @file TapeDust.h
 * @brief Slew-dependent tape noise generator
 *
 * Ported from Airwindows TapeDust (MIT License)
 * Original: https://github.com/airwindows/airwindows
 * Copyright (c) Airwindows
 *
 * TapeDust generates tape-like noise that responds to the signal's rate of
 * change (slew rate). Unlike simple white noise, this creates authentic
 * "tape dust" that's more prominent during quiet or static passages.
 *
 * Algorithm:
 * - Tracks recent signal history (10 samples)
 * - Generates random noise scaled by user parameter
 * - Multiplies noise by slew rate: (1.0 - |current - previous|) * fuzz
 * - Blends multiple past samples with fractional gains for smoothing
 *
 * This creates noise that sounds like dust particles on magnetic tape,
 * particularly noticeable during quiet passages and tape stops.
 */

#pragma once

#include <cmath>
#include <cstring>
#include <cstdint>
#include <algorithm>
#include <random>

/**
 * @brief Slew-dependent tape noise generator
 *
 * Two parameters control the effect:
 *   Range (0-1): Amount of tape dust (squared to 0-5 internally)
 *   Mix (0-1): Dry/wet balance
 */
class TapeDust
{
public:
    TapeDust()
    {
        reset();
    }

    void prepare(double sr)
    {
        sampleRate = sr;
        reset();
    }

    void reset()
    {
        std::memset(bL, 0, sizeof(bL));
        std::memset(bR, 0, sizeof(bR));
        std::memset(fL, 0, sizeof(fL));
        std::memset(fR, 0, sizeof(fR));
        fpFlip = false;
        fpdL = 1;
        fpdR = 1;
    }

    void setRange(float r) { range = std::clamp(r, 0.0f, 1.0f); }
    void setMix(float m) { mix = std::clamp(m, 0.0f, 1.0f); }

    void process(float& left, float& right)
    {
        double inputSampleL = left;
        double inputSampleR = right;

        // Denormal protection
        if (std::fabs(inputSampleL) < 1.18e-23) inputSampleL = fpdL * 1.18e-17;
        if (std::fabs(inputSampleR) < 1.18e-23) inputSampleR = fpdR * 1.18e-17;

        double drySampleL = inputSampleL;
        double drySampleR = inputSampleR;

        // Compute slew-dependent noise parameters
        double rRange = std::pow(range, 2.0) * 5.0;
        double xfuzz = rRange * 0.002;
        double rOffset = (rRange * 0.4) + 1.0;

        // Shift buffer (store signal history)
        for (int count = 9; count > 0; count--) {
            bL[count] = bL[count-1];
            bR[count] = bR[count-1];
        }

        bL[0] = inputSampleL;
        bR[0] = inputSampleR;

        // Generate base random noise
        inputSampleL = static_cast<double>(std::rand()) / RAND_MAX;
        inputSampleR = static_cast<double>(std::rand()) / RAND_MAX;

        double rDepthL = (inputSampleL * rRange) + rOffset;
        double rDepthR = (inputSampleR * rRange) + rOffset;
        double gainL = rDepthL;
        double gainR = rDepthR;

        // Modulate noise by slew rate (key to tape dust character!)
        // Fast changes = less noise, slow/static = more dust
        inputSampleL *= ((1.0 - std::fabs(bL[0] - bL[1])) * xfuzz);
        inputSampleR *= ((1.0 - std::fabs(bR[0] - bR[1])) * xfuzz);

        // Flip phase every other sample for spectral shaping
        if (fpFlip) {
            inputSampleL = -inputSampleL;
            inputSampleR = -inputSampleR;
        }
        fpFlip = !fpFlip;

        // Fractional delay blend: spread noise across recent samples
        // with decreasing weights for smoothing
        for (int count = 0; count < 9; count++) {
            if (gainL > 1.0) {
                fL[count] = 1.0;
                gainL -= 1.0;
            } else {
                fL[count] = gainL;
                gainL = 0.0;
            }

            if (gainR > 1.0) {
                fR[count] = 1.0;
                gainR -= 1.0;
            } else {
                fR[count] = gainR;
                gainR = 0.0;
            }

            fL[count] /= rDepthL;
            fR[count] /= rDepthR;
            inputSampleL += (bL[count] * fL[count]);
            inputSampleR += (bR[count] * fR[count]);
        }

        // Wet/dry mix
        if (mix < 1.0) {
            inputSampleL = (inputSampleL * mix) + (drySampleL * (1.0 - mix));
            inputSampleR = (inputSampleR * mix) + (drySampleR * (1.0 - mix));
        }

        // Simple PRNG dither (Airwindows style)
        fpdL ^= fpdL << 13;
        fpdL ^= fpdL >> 17;
        fpdL ^= fpdL << 5;
        fpdR ^= fpdR << 13;
        fpdR ^= fpdR >> 17;
        fpdR ^= fpdR << 5;

        left = static_cast<float>(inputSampleL);
        right = static_cast<float>(inputSampleR);
    }

private:
    // Signal buffers (10 samples of history)
    double bL[11]{};
    double bR[11]{};

    // Fractional gains for smooth blending
    double fL[11]{};
    double fR[11]{};

    // Parameters
    float range = 0.3f;  // 0-1, amount of tape dust
    float mix = 0.5f;    // 0-1, dry/wet

    // State
    bool fpFlip = false;
    uint32_t fpdL = 1;   // PRNG state
    uint32_t fpdR = 1;

    double sampleRate = 44100.0;
};
