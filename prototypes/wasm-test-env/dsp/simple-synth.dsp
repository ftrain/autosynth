import("stdfaust.lib");

// Simple synth with oscillator and filter for WebAssembly testing

// Parameters
freq = hslider("frequency[unit:Hz]", 440, 20, 5000, 1);
filterCutoff = hslider("filterCutoff[unit:Hz]", 2000, 20, 20000, 1);
resonance = hslider("resonance", 1, 1, 20, 0.1);
volume = hslider("volume", 0.5, 0, 1, 0.01);
waveform = nentry("waveform", 0, 0, 2, 1);  // 0=sine, 1=saw, 2=square

// Oscillators
osc = ba.selectn(3, waveform, os.osc(freq), os.sawtooth(freq), os.square(freq));

// Filter (Moog-style ladder)
filter = ve.moog_vcf(resonance, filterCutoff);

// Process: oscillator -> filter -> volume
process = osc : filter * volume <: _, _;
