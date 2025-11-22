# [SYNTH NAME] Sonic Goals Document

> **Status**: Draft | In Review | Approved
> **Author**: [sound-designer]
> **Date**: [YYYY-MM-DD]

## 1. Sonic Identity

### 1.1 Overall Character
<!-- Describe the overall sonic personality in musical terms -->

**In one sentence**: [This synth sounds like...]

**Character descriptors** (check all that apply):
- [ ] Warm
- [ ] Bright
- [ ] Aggressive
- [ ] Smooth
- [ ] Vintage
- [ ] Modern
- [ ] Clean
- [ ] Gritty
- [ ] Fat
- [ ] Thin
- [ ] Evolving
- [ ] Static
- [ ] Organic
- [ ] Digital
- [ ] Lush
- [ ] Sparse

### 1.2 Reference Sounds
<!-- Link to audio examples that capture the target sound -->

| Reference | What to capture | Link/Description |
|-----------|-----------------|------------------|
| [Artist - Track] | [Specific element] | [URL or timestamp] |
| [Synth Demo] | [Sound quality] | [URL] |
| | | |

### 1.3 Target Use Cases

**Primary uses**:
1. [Use case 1, e.g., "Deep house bass lines"]
2. [Use case 2, e.g., "Evolving ambient pads"]
3. [Use case 3, e.g., "Aggressive lead synths"]

**Not suited for**:
- [What this synth shouldn't be used for]

---

## 2. Sound Categories

### 2.1 Bass Sounds
<!-- Describe the bass character -->

**Target qualities**:
- Weight/Sub content: [Heavy / Medium / Light]
- Attack character: [Punchy / Soft / Plucky]
- Harmonic content: [Rich / Focused / Minimal]

**Reference patches to create**:
1. [Patch name]: [Description]
2. [Patch name]: [Description]

### 2.2 Lead Sounds
<!-- Describe the lead character -->

**Target qualities**:
- Presence: [Cutting / Smooth / Aggressive]
- Sustain behavior: [Stable / Evolving / Decaying]
- Vibrato character: [None / Subtle / Expressive]

**Reference patches to create**:
1. [Patch name]: [Description]
2. [Patch name]: [Description]

### 2.3 Pad Sounds
<!-- Describe the pad character -->

**Target qualities**:
- Movement: [Static / Subtle / Dramatic]
- Stereo width: [Mono / Moderate / Wide]
- Attack/release: [Instant / Soft / Very slow]

**Reference patches to create**:
1. [Patch name]: [Description]
2. [Patch name]: [Description]

### 2.4 Key/Pluck Sounds
<!-- Describe percussive sounds -->

**Target qualities**:
- Attack transient: [Sharp / Soft / Variable]
- Decay character: [Natural / Gated / Ringy]
- Body: [Hollow / Full / Resonant]

**Reference patches to create**:
1. [Patch name]: [Description]
2. [Patch name]: [Description]

### 2.5 FX/Texture Sounds
<!-- Describe special effect sounds -->

**Target qualities**:
- Complexity: [Simple / Layered / Chaotic]
- Pitch behavior: [Stable / Drifting / Random]
- Rhythmic: [None / Pulsing / Complex]

**Reference patches to create**:
1. [Patch name]: [Description]
2. [Patch name]: [Description]

---

## 3. Technical Sound Requirements

### 3.1 Frequency Response

| Band | Requirement | Notes |
|------|-------------|-------|
| Sub (20-60Hz) | [Strong / Present / Minimal] | |
| Bass (60-250Hz) | [Full / Tight / Controlled] | |
| Low-Mid (250-500Hz) | [Warm / Clean / Scooped] | |
| Mid (500-2kHz) | [Present / Recessed / Aggressive] | |
| Upper-Mid (2-6kHz) | [Bright / Smooth / Cutting] | |
| High (6-20kHz) | [Airy / Dark / Crisp] | |

### 3.2 Dynamic Response

**Velocity response**:
- [ ] Should significantly affect brightness
- [ ] Should significantly affect volume
- [ ] Should affect attack character
- [ ] Minimal velocity response needed

**Envelope behavior**:
- Attack range needed: [Instant to X seconds]
- Release range needed: [X ms to X seconds]
- Special envelope behaviors: [e.g., "Punchy decay into sustain"]

### 3.3 Modulation Character

**LFO requirements**:
- Vibrato depth range: [Subtle to extreme]
- Filter sweep speed: [Slow to fast]
- Tempo sync: [Essential / Nice to have / Not needed]

**Envelope modulation**:
- Filter envelope impact: [Subtle / Moderate / Dramatic]
- Typical envelope shapes: [Snappy / Slow / Percussive]

---

## 4. Effects Requirements

### 4.1 Essential Effects

| Effect | Purpose | Character |
|--------|---------|-----------|
| [e.g., Chorus] | [e.g., Width and movement] | [e.g., Subtle, vintage] |
| [e.g., Reverb] | [e.g., Space and depth] | [e.g., Short room to long hall] |
| [e.g., Saturation] | [e.g., Warmth and presence] | [e.g., Tape-like, not harsh] |

### 4.2 Effect Character Notes
<!-- Detailed notes on how effects should sound -->

---

## 5. Factory Preset Plan

### 5.1 Preset Categories

| Category | Count | Priority |
|----------|-------|----------|
| Bass | | High |
| Lead | | High |
| Pad | | Medium |
| Keys/Pluck | | Medium |
| FX/Texture | | Low |
| Templates | | Low |

### 5.2 Must-Have Presets
<!-- List specific presets that must be included -->

1. **[Preset Name]**: [Description and use case]
2. **[Preset Name]**: [Description and use case]
3. **[Preset Name]**: [Description and use case]

### 5.3 Preset Naming Convention

Format: `[Category] - [Name]`

Examples:
- `Bass - Deep Sub`
- `Lead - Screaming Saw`
- `Pad - Evolving Dream`

---

## 6. Sound Quality Checklist

### 6.1 Before Release
- [ ] All presets are musically useful
- [ ] No preset has excessive volume
- [ ] Filter doesn't produce harsh resonance
- [ ] Envelopes are smooth (no clicks)
- [ ] Effects enhance rather than dominate
- [ ] Sound is consistent across octave range
- [ ] Velocity response feels natural

### 6.2 A/B Testing
<!-- List synths to compare against -->

Compare against:
1. [Reference synth 1]: Focus on [aspect]
2. [Reference synth 2]: Focus on [aspect]

---

## 7. Sound Designer Notes

### 7.1 DSP Feedback
<!-- Notes for the DSP engineer based on sound testing -->

### 7.2 UI Feedback
<!-- Suggestions for UI based on sound design workflow -->

### 7.3 Known Limitations
<!-- What this synth can't do (and that's OK) -->

---

## 8. Approval

| Role | Name | Date | Notes |
|------|------|------|-------|
| Sound Designer | | | |
| Architect | | | |

---

*Document generated from template. Work with synth-architect for implementation.*
