# FM Drums

Classic FM percussion synthesizer - punchy kicks, snappy snares, metallic hats. Each drum voice uses FM synthesis with fast envelopes.

## Features

- **4 Drum Channels**: KICK, SNARE, HAT, PERC
- **FM Synthesis**: 2-operator FM per channel
- **Fast Pitch Envelopes**: Classic drum sweep sounds
- **Noise Mix**: For snare and hi-hat character
- **React WebView UI**: Modern, responsive interface

## MIDI Mapping

| Note | Drum |
|------|------|
| C1 (36) | Kick |
| D1 (38) | Snare |
| F#1 (42) | Hat (closed) |
| A#1 (46) | Hat (open) |
| Others | Perc |

## Parameters

### Kick
- **Freq**: Carrier frequency (20-200 Hz)
- **Mod Ratio**: Modulator frequency ratio (0.5-16x)
- **FM Depth**: Modulation intensity (0-1)
- **Pitch Decay**: Pitch envelope decay (1-500 ms)
- **Pitch Amount**: Pitch sweep amount (0-1)
- **Amp Decay**: Amplitude decay (1-2000 ms)
- **Level**: Output level (0-1)

### Snare
- **Freq**: Carrier frequency (80-500 Hz)
- **Mod Ratio**: Modulator frequency ratio
- **FM Depth**: Modulation intensity
- **Noise**: White noise mix (0-1)
- **Pitch Decay**: Pitch envelope decay (1-200 ms)
- **Amp Decay**: Amplitude decay (1-1000 ms)
- **Level**: Output level

### Hat
- **Freq**: Carrier frequency (200-2000 Hz)
- **Mod Ratio**: High ratio for metallic tones (default: 7.1)
- **FM Depth**: Modulation intensity
- **Noise**: Noise mix for character
- **Amp Decay**: Amplitude decay (1-500 ms)
- **Level**: Output level

### Perc
- **Freq**: Carrier frequency (100-1000 Hz)
- **Mod Ratio**: Modulator frequency ratio
- **FM Depth**: Modulation intensity
- **Pitch Decay**: Pitch envelope decay (1-300 ms)
- **Amp Decay**: Amplitude decay (1-1000 ms)
- **Level**: Output level

### Global
- **Master Level**: Master output level (0-1)

## Building

```bash
# Build UI first
cd ui
npm install
npm run build
cd ..

# Build plugin
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

## Architecture

```
Trigger (MIDI Note) -> FM Voice
                          |
        Pitch Envelope -> Carrier Freq
                          |
        Modulator (sine) -> FM -> Carrier (sine)
                                      |
                                + Noise (optional)
                                      |
                          Amp Envelope -> Output
```

## License

MIT License
