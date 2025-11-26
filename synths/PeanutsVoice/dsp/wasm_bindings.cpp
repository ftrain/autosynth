#include "Engine.h"
#include <emscripten/emscripten.h>

/**
 * WASM Bindings for Peanuts Voice
 *
 * These extern "C" exports provide the interface between JavaScript AudioWorklet
 * and the C++ DSP engine.
 *
 * CRITICAL: Keep this interface simple with C types only (no C++ classes/STL).
 * All processing must be real-time safe (no allocations).
 */

// Global engine instance
static Engine* g_engine = nullptr;

extern "C" {
    /**
     * Initialize the DSP engine
     * Called once when AudioWorklet loads
     *
     * @param sampleRate The audio context sample rate (typically 48000)
     */
    EMSCRIPTEN_KEEPALIVE
    void init(int sampleRate) {
        if (g_engine) {
            delete g_engine;
        }
        g_engine = new Engine();
        g_engine->prepare(static_cast<float>(sampleRate));
    }

    /**
     * Process one audio block
     * Called on every AudioWorklet quantum (typically 128 samples)
     *
     * CRITICAL: Must be real-time safe - no allocations, no locks, no I/O
     *
     * @param outputL Left channel output buffer
     * @param outputR Right channel output buffer
     * @param numSamples Number of samples to process (typically 128)
     */
    EMSCRIPTEN_KEEPALIVE
    void process(float* outputL, float* outputR, int numSamples) {
        if (!g_engine) {
            // Engine not initialized, output silence
            for (int i = 0; i < numSamples; i++) {
                outputL[i] = 0.0f;
                outputR[i] = 0.0f;
            }
            return;
        }

        g_engine->renderBlock(outputL, outputR, numSamples);
    }

    /**
     * Set a parameter value
     * Called from UI when user changes a control
     *
     * @param id Parameter ID (0-127)
     * @param value Normalized value (typically 0-1, but can be any float)
     */
    EMSCRIPTEN_KEEPALIVE
    void setParameter(int id, float value) {
        if (!g_engine) return;
        g_engine->setParam(id, value);
    }

    /**
     * Get a parameter value
     * Used for UI synchronization
     *
     * @param id Parameter ID (0-127)
     * @return Current parameter value
     */
    EMSCRIPTEN_KEEPALIVE
    float getParameter(int id) {
        if (!g_engine) return 0.0f;
        return g_engine->getParam(id);
    }

    /**
     * Trigger a note on
     * Called from MIDI input or virtual keyboard
     *
     * @param note MIDI note number (0-127)
     * @param velocity Note velocity (0.0-1.0)
     */
    EMSCRIPTEN_KEEPALIVE
    void noteOn(int note, float velocity) {
        if (!g_engine) return;
        g_engine->noteOn(note, velocity);
    }

    /**
     * Trigger a note off
     * Called from MIDI input or virtual keyboard
     *
     * @param note MIDI note number (0-127)
     */
    EMSCRIPTEN_KEEPALIVE
    void noteOff(int note) {
        if (!g_engine) return;
        g_engine->noteOff(note);
    }

    /**
     * Handle MIDI CC message
     * Optional: implement if you need MIDI CC parameter control
     *
     * @param cc MIDI CC number (0-127)
     * @param value CC value (0-127)
     */
    EMSCRIPTEN_KEEPALIVE
    void midiCC(int cc, int value) {
        if (!g_engine) return;
        // Map MIDI CC to parameters
        // Example: g_engine->setParam(cc, value / 127.0f);
    }

    /**
     * Handle pitch bend
     * Optional: implement if you need pitch bend support
     *
     * @param value Pitch bend value (-1.0 to +1.0)
     */
    EMSCRIPTEN_KEEPALIVE
    void pitchBend(float value) {
        if (!g_engine) return;
        // Implement pitch bend handling
    }

    /**
     * Clean up and release resources
     * Called when AudioWorklet is destroyed
     */
    EMSCRIPTEN_KEEPALIVE
    void shutdown() {
        if (g_engine) {
            delete g_engine;
            g_engine = nullptr;
        }
    }

    /**
     * Get engine info (for debugging)
     * Returns a version string
     */
    EMSCRIPTEN_KEEPALIVE
    const char* getVersion() {
        return "Peanuts Voice v1.0.0";
    }
}
