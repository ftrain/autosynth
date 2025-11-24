/**
 * @file Galactic3Reverb.h
 * @brief Standalone Galactic3 reverb from Airwindows
 *
 * Ported from Airwindows Galactic3 (MIT License)
 * Original: https://github.com/airwindows/airwindows
 * Copyright (c) Airwindows
 *
 * Designed for ultimate deep space ambient music with vibrato modulation,
 * multi-stage delay networks, and Bezier curve interpolation.
 */

#pragma once

#include <cmath>
#include <cstring>
#include <cstdint>
#include <algorithm>

/**
 * @brief Galactic3 - Deep space ambient reverb
 *
 * Six parameters control the effect:
 *   Replace (A): Regeneration/feedback amount (0-1)
 *   Brightness (B): Lowpass filter cutoff (0-1)
 *   Detune (C): Vibrato/drift amount (0-1)
 *   Bigness (D): Undersampling/derezing (0-1)
 *   Size (E): Delay network scaling (0-1)
 *   Mix (F): Dry/wet balance (0-1)
 */
class Galactic3Reverb
{
public:
    Galactic3Reverb()
    {
        // Initialize all buffers to zero
        std::memset(aIL, 0, sizeof(aIL));
        std::memset(aJL, 0, sizeof(aJL));
        std::memset(aKL, 0, sizeof(aKL));
        std::memset(aLL, 0, sizeof(aLL));
        std::memset(aAL, 0, sizeof(aAL));
        std::memset(aBL, 0, sizeof(aBL));
        std::memset(aCL, 0, sizeof(aCL));
        std::memset(aDL, 0, sizeof(aDL));
        std::memset(aEL, 0, sizeof(aEL));
        std::memset(aFL, 0, sizeof(aFL));
        std::memset(aGL, 0, sizeof(aGL));
        std::memset(aHL, 0, sizeof(aHL));
        std::memset(aML, 0, sizeof(aML));

        std::memset(aIR, 0, sizeof(aIR));
        std::memset(aJR, 0, sizeof(aJR));
        std::memset(aKR, 0, sizeof(aKR));
        std::memset(aLR, 0, sizeof(aLR));
        std::memset(aAR, 0, sizeof(aAR));
        std::memset(aBR, 0, sizeof(aBR));
        std::memset(aCR, 0, sizeof(aCR));
        std::memset(aDR, 0, sizeof(aDR));
        std::memset(aER, 0, sizeof(aER));
        std::memset(aFR, 0, sizeof(aFR));
        std::memset(aGR, 0, sizeof(aGR));
        std::memset(aHR, 0, sizeof(aHR));
        std::memset(aMR, 0, sizeof(aMR));

        std::memset(bez, 0, sizeof(bez));

        // Initialize filters and feedback
        iirAL = iirBL = 0.0;
        iirAR = iirBR = 0.0;
        feedbackAL = feedbackBL = feedbackCL = feedbackDL = 0.0;
        feedbackAR = feedbackBR = feedbackCR = feedbackDR = 0.0;

        // Initialize counters
        countA = countB = countC = countD = 0;
        countE = countF = countG = countH = 0;
        countI = countJ = countK = countL = 0;
        countM = 0;

        // Initialize vibrato
        vibM = 0.0;
        oldfpd = 0.4294967295;

        // Initialize random state
        fpdL = 1.0;
        fpdR = 1.0;

        // Default parameters
        replace = 0.5f;      // A
        brightness = 0.5f;   // B
        detune = 0.5f;       // C
        bigness = 0.5f;      // D
        size = 0.5f;         // E
        mix = 0.5f;          // F
    }

    void prepare(double sr)
    {
        sampleRate = sr;
    }

    void setReplace(float value) { replace = std::clamp(value, 0.0f, 1.0f); }
    void setBrightness(float value) { brightness = std::clamp(value, 0.0f, 1.0f); }
    void setDetune(float value) { detune = std::clamp(value, 0.0f, 1.0f); }
    void setBigness(float value) { bigness = std::clamp(value, 0.0f, 1.0f); }
    void setSize(float value) { size = std::clamp(value, 0.0f, 1.0f); }
    void setMix(float value) { mix = std::clamp(value, 0.0f, 1.0f); }

    void process(float& left, float& right)
    {
        double overallscale = 1.0;
        overallscale /= 44100.0;
        overallscale *= sampleRate;

        double regen = 0.0625 + ((1.0 - replace) * 0.0625);
        double attenuate = (1.0 - (regen / 0.125)) * 1.333;
        double lowpass = std::pow(1.00001 - (1.0 - brightness), 2.0) / std::sqrt(overallscale);
        double drift = std::pow(detune, 3.0) * 0.001;
        double derez = bigness / overallscale;
        if (derez < 0.0005) derez = 0.0005;
        if (derez > 1.0) derez = 1.0;
        derez = 1.0 / (static_cast<int>(1.0 / derez));
        double sizeParam = (size * 1.77) + 0.1;
        double wet = 1.0 - std::pow(1.0 - mix, 3.0);

        delayI = static_cast<int>(3407.0 * sizeParam);
        delayJ = static_cast<int>(1823.0 * sizeParam);
        delayK = static_cast<int>(859.0 * sizeParam);
        delayL = static_cast<int>(331.0 * sizeParam);
        delayA = static_cast<int>(4801.0 * sizeParam);
        delayB = static_cast<int>(2909.0 * sizeParam);
        delayC = static_cast<int>(1153.0 * sizeParam);
        delayD = static_cast<int>(461.0 * sizeParam);
        delayE = static_cast<int>(7607.0 * sizeParam);
        delayF = static_cast<int>(4217.0 * sizeParam);
        delayG = static_cast<int>(2269.0 * sizeParam);
        delayH = static_cast<int>(1597.0 * sizeParam);
        delayM = 256;

        double inputSampleL = left;
        double inputSampleR = right;
        if (std::fabs(inputSampleL) < 1.18e-23) inputSampleL = fpdL * 1.18e-17;
        if (std::fabs(inputSampleR) < 1.18e-23) inputSampleR = fpdR * 1.18e-17;
        double drySampleL = inputSampleL;
        double drySampleR = inputSampleR;

        vibM += (oldfpd * drift);
        if (vibM > (3.141592653589793238 * 2.0)) {
            vibM = 0.0;
            oldfpd = 0.4294967295 + (fpdL * 0.0000000000618);
        }

        aML[countM] = inputSampleL * attenuate;
        aMR[countM] = inputSampleR * attenuate;
        countM++;
        if (countM < 0 || countM > delayM) countM = 0;

        double offsetML = (std::sin(vibM) + 1.0) * 127;
        double offsetMR = (std::sin(vibM + (3.141592653589793238 / 2.0)) + 1.0) * 127;
        int workingML = countM + static_cast<int>(offsetML);
        int workingMR = countM + static_cast<int>(offsetMR);
        double interpolML = (aML[workingML - ((workingML > delayM) ? delayM + 1 : 0)] * (1 - (offsetML - std::floor(offsetML))));
        interpolML += (aML[workingML + 1 - ((workingML + 1 > delayM) ? delayM + 1 : 0)] * ((offsetML - std::floor(offsetML))));
        double interpolMR = (aMR[workingMR - ((workingMR > delayM) ? delayM + 1 : 0)] * (1 - (offsetMR - std::floor(offsetMR))));
        interpolMR += (aMR[workingMR + 1 - ((workingMR + 1 > delayM) ? delayM + 1 : 0)] * ((offsetMR - std::floor(offsetMR))));
        inputSampleL = interpolML;
        inputSampleR = interpolMR;

        iirAL = (iirAL * (1.0 - lowpass)) + (inputSampleL * lowpass);
        inputSampleL = iirAL;
        iirAR = (iirAR * (1.0 - lowpass)) + (inputSampleR * lowpass);
        inputSampleR = iirAR;

        bez[bez_cycle] += derez;
        bez[bez_SampL] += ((inputSampleL + bez[bez_InL]) * derez);
        bez[bez_SampR] += ((inputSampleR + bez[bez_InR]) * derez);
        bez[bez_InL] = inputSampleL;
        bez[bez_InR] = inputSampleR;

        if (bez[bez_cycle] > 1.0) {
            bez[bez_cycle] = 0.0;

            aIL[countI] = (bez[bez_SampL] + bez[bez_UnInL]) + (feedbackAR * regen);
            aJL[countJ] = (bez[bez_SampL] + bez[bez_UnInL]) + (feedbackBR * regen);
            aKL[countK] = (bez[bez_SampL] + bez[bez_UnInL]) + (feedbackCR * regen);
            aLL[countL] = (bez[bez_SampL] + bez[bez_UnInL]) + (feedbackDR * regen);
            bez[bez_UnInL] = bez[bez_SampL];

            aIR[countI] = (bez[bez_SampR] + bez[bez_UnInR]) + (feedbackAL * regen);
            aJR[countJ] = (bez[bez_SampR] + bez[bez_UnInR]) + (feedbackBL * regen);
            aKR[countK] = (bez[bez_SampR] + bez[bez_UnInR]) + (feedbackCL * regen);
            aLR[countL] = (bez[bez_SampR] + bez[bez_UnInR]) + (feedbackDL * regen);
            bez[bez_UnInR] = bez[bez_SampR];

            countI++;
            if (countI < 0 || countI > delayI) countI = 0;
            countJ++;
            if (countJ < 0 || countJ > delayJ) countJ = 0;
            countK++;
            if (countK < 0 || countK > delayK) countK = 0;
            countL++;
            if (countL < 0 || countL > delayL) countL = 0;

            double outIL = aIL[countI - ((countI > delayI) ? delayI + 1 : 0)];
            double outJL = aJL[countJ - ((countJ > delayJ) ? delayJ + 1 : 0)];
            double outKL = aKL[countK - ((countK > delayK) ? delayK + 1 : 0)];
            double outLL = aLL[countL - ((countL > delayL) ? delayL + 1 : 0)];
            double outIR = aIR[countI - ((countI > delayI) ? delayI + 1 : 0)];
            double outJR = aJR[countJ - ((countJ > delayJ) ? delayJ + 1 : 0)];
            double outKR = aKR[countK - ((countK > delayK) ? delayK + 1 : 0)];
            double outLR = aLR[countL - ((countL > delayL) ? delayL + 1 : 0)];

            aAL[countA] = (outIL - (outJL + outKL + outLL));
            aBL[countB] = (outJL - (outIL + outKL + outLL));
            aCL[countC] = (outKL - (outIL + outJL + outLL));
            aDL[countD] = (outLL - (outIL + outJL + outKL));
            aAR[countA] = (outIR - (outJR + outKR + outLR));
            aBR[countB] = (outJR - (outIR + outKR + outLR));
            aCR[countC] = (outKR - (outIR + outJR + outLR));
            aDR[countD] = (outLR - (outIR + outJR + outKR));

            countA++;
            if (countA < 0 || countA > delayA) countA = 0;
            countB++;
            if (countB < 0 || countB > delayB) countB = 0;
            countC++;
            if (countC < 0 || countC > delayC) countC = 0;
            countD++;
            if (countD < 0 || countD > delayD) countD = 0;

            double outAL = aAL[countA - ((countA > delayA) ? delayA + 1 : 0)];
            double outBL = aBL[countB - ((countB > delayB) ? delayB + 1 : 0)];
            double outCL = aCL[countC - ((countC > delayC) ? delayC + 1 : 0)];
            double outDL = aDL[countD - ((countD > delayD) ? delayD + 1 : 0)];
            double outAR = aAR[countA - ((countA > delayA) ? delayA + 1 : 0)];
            double outBR = aBR[countB - ((countB > delayB) ? delayB + 1 : 0)];
            double outCR = aCR[countC - ((countC > delayC) ? delayC + 1 : 0)];
            double outDR = aDR[countD - ((countD > delayD) ? delayD + 1 : 0)];

            aEL[countE] = (outAL - (outBL + outCL + outDL));
            aFL[countF] = (outBL - (outAL + outCL + outDL));
            aGL[countG] = (outCL - (outAL + outBL + outDL));
            aHL[countH] = (outDL - (outAL + outBL + outCL));
            aER[countE] = (outAR - (outBR + outCR + outDR));
            aFR[countF] = (outBR - (outAR + outCR + outDR));
            aGR[countG] = (outCR - (outAR + outBR + outDR));
            aHR[countH] = (outDR - (outAR + outBR + outCR));

            countE++;
            if (countE < 0 || countE > delayE) countE = 0;
            countF++;
            if (countF < 0 || countF > delayF) countF = 0;
            countG++;
            if (countG < 0 || countG > delayG) countG = 0;
            countH++;
            if (countH < 0 || countH > delayH) countH = 0;

            double outEL = aEL[countE - ((countE > delayE) ? delayE + 1 : 0)];
            double outFL = aFL[countF - ((countF > delayF) ? delayF + 1 : 0)];
            double outGL = aGL[countG - ((countG > delayG) ? delayG + 1 : 0)];
            double outHL = aHL[countH - ((countH > delayH) ? delayH + 1 : 0)];
            double outER = aER[countE - ((countE > delayE) ? delayE + 1 : 0)];
            double outFR = aFR[countF - ((countF > delayF) ? delayF + 1 : 0)];
            double outGR = aGR[countG - ((countG > delayG) ? delayG + 1 : 0)];
            double outHR = aHR[countH - ((countH > delayH) ? delayH + 1 : 0)];

            feedbackAL = (outEL - (outFL + outGL + outHL));
            feedbackBL = (outFL - (outEL + outGL + outHL));
            feedbackCL = (outGL - (outEL + outFL + outHL));
            feedbackDL = (outHL - (outEL + outFL + outGL));
            feedbackAR = (outER - (outFR + outGR + outHR));
            feedbackBR = (outFR - (outER + outGR + outHR));
            feedbackCR = (outGR - (outER + outFR + outHR));
            feedbackDR = (outHR - (outER + outFR + outGR));

            inputSampleL = (outEL + outFL + outGL + outHL) / 8.0;
            inputSampleR = (outER + outFR + outGR + outHR) / 8.0;

            bez[bez_CL] = bez[bez_BL];
            bez[bez_BL] = bez[bez_AL];
            bez[bez_AL] = inputSampleL;
            bez[bez_SampL] = 0.0;

            bez[bez_CR] = bez[bez_BR];
            bez[bez_BR] = bez[bez_AR];
            bez[bez_AR] = inputSampleR;
            bez[bez_SampR] = 0.0;
        }

        double CBL = (bez[bez_CL] * (1.0 - bez[bez_cycle])) + (bez[bez_BL] * bez[bez_cycle]);
        double CBR = (bez[bez_CR] * (1.0 - bez[bez_cycle])) + (bez[bez_BR] * bez[bez_cycle]);
        double BAL = (bez[bez_BL] * (1.0 - bez[bez_cycle])) + (bez[bez_AL] * bez[bez_cycle]);
        double BAR = (bez[bez_BR] * (1.0 - bez[bez_cycle])) + (bez[bez_AR] * bez[bez_cycle]);
        double CBAL = (bez[bez_BL] + (CBL * (1.0 - bez[bez_cycle])) + (BAL * bez[bez_cycle])) * 0.125;
        double CBAR = (bez[bez_BR] + (CBR * (1.0 - bez[bez_cycle])) + (BAR * bez[bez_cycle])) * 0.125;
        inputSampleL = CBAL;
        inputSampleR = CBAR;

        iirBL = (iirBL * (1.0 - lowpass)) + (inputSampleL * lowpass);
        inputSampleL = iirBL;
        iirBR = (iirBR * (1.0 - lowpass)) + (inputSampleR * lowpass);
        inputSampleR = iirBR;

        if (wet < 1.0) {
            inputSampleL = (inputSampleL * wet) + (drySampleL * (1.0 - wet));
            inputSampleR = (inputSampleR * wet) + (drySampleR * (1.0 - wet));
        }

        // Simple dither
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
    // Bezier interpolation indices
    enum {
        bez_AL, bez_AR,
        bez_BL, bez_BR,
        bez_CL, bez_CR,
        bez_InL, bez_InR,
        bez_UnInL, bez_UnInR,
        bez_SampL, bez_SampR,
        bez_cycle,
        bez_total
    };

    // Parameters (0-1)
    float replace, brightness, detune, bigness, size, mix;

    // Sample rate
    double sampleRate = 44100.0;

    // Filters
    double iirAL, iirBL, iirAR, iirBR;

    // Delay buffers (left channel)
    double aIL[6480], aJL[3660], aKL[1720], aLL[680];
    double aAL[9700], aBL[6000], aCL[2320], aDL[940];
    double aEL[15220], aFL[8460], aGL[4540], aHL[3200];
    double aML[3111];

    // Delay buffers (right channel)
    double aIR[6480], aJR[3660], aKR[1720], aLR[680];
    double aAR[9700], aBR[6000], aCR[2320], aDR[940];
    double aER[15220], aFR[8460], aGR[4540], aHR[3200];
    double aMR[3111];

    // Feedback
    double feedbackAL, feedbackBL, feedbackCL, feedbackDL;
    double feedbackAR, feedbackBR, feedbackCR, feedbackDR;

    // Counters and delays
    int countA, delayA, countB, delayB, countC, delayC, countD, delayD;
    int countE, delayE, countF, delayF, countG, delayG, countH, delayH;
    int countI, delayI, countJ, delayJ, countK, delayK, countL, delayL;
    int countM, delayM;

    // Vibrato
    double vibM, oldfpd;

    // Bezier reconstruction
    double bez[bez_total];

    // Random state
    uint32_t fpdL, fpdR;
};
