# Designer Guide for Audio Component Design

## Creating Intuitive Interfaces for Synthesizers and Audio Effects

**For**: UI/UX Designers, Product Designers
**Prerequisite**: Basic understanding of music and audio concepts
**Version**: 1.0

---

## Table of Contents

1. [Understanding Audio Parameters](#1-understanding-audio-parameters)
2. [The Synthesizer Mental Model](#2-the-synthesizer-mental-model)
3. [Parameter Types and Their Controls](#3-parameter-types-and-their-controls)
4. [Visual Feedback Patterns](#4-visual-feedback-patterns)
5. [Layout Principles](#5-layout-principles)
6. [Component Specification Format](#6-component-specification-format)
7. [Accessibility Considerations](#7-accessibility-considerations)
8. [Working with the Team](#8-working-with-the-team)

---

## 1. Understanding Audio Parameters

### What is a Parameter?

A parameter is any value that controls how a synthesizer sounds. When a user turns a knob or moves a slider, they're changing a parameter that affects the audio in real-time.

### The Three Parameter Characteristics

Every audio parameter has these characteristics:

| Characteristic | Description | Example |
|----------------|-------------|---------|
| **Range** | Min/max values | Frequency: 20 Hz to 20,000 Hz |
| **Default** | Starting value | Volume: 0 dB (unity gain) |
| **Response** | How changes feel | Linear, logarithmic, exponential |

### Common Parameter Categories

```
┌─────────────────────────────────────────────────────────┐
│                    SYNTHESIZER                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐ │
│  │ SOURCE  │ → │ FILTER  │ → │   AMP   │ → │ EFFECTS│ │
│  │         │   │         │   │         │   │        │ │
│  │ Pitch   │   │ Cutoff  │   │ Volume  │   │ Mix    │ │
│  │ Shape   │   │ Reso    │   │ Pan     │   │ Decay  │ │
│  │ Detune  │   │ Type    │   │ Env     │   │ Time   │ │
│  └─────────┘   └─────────┘   └─────────┘   └────────┘ │
│       ▲             ▲             ▲             ▲      │
│       │             │             │             │      │
│  ┌────┴─────────────┴─────────────┴─────────────┴───┐ │
│  │              MODULATION (LFOs, Envelopes)        │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. The Synthesizer Mental Model

### Signal Flow: Left to Right

Users expect audio to flow from **left to right**:

```
Sound Source → Processing → Output
(Oscillator)    (Filter)    (Amp/FX)
```

Design your layouts to follow this mental model.

### Control Flow: Cause and Effect

Users expect immediate feedback:
- **Turn knob** → **Hear change** (< 10ms)
- **Visual feedback** confirms the change
- **Value display** shows precise setting

### The "Sweet Spot" Concept

Most parameters have a "sweet spot" where they're most useful:
- **Filter Cutoff**: 200 Hz - 5,000 Hz (where most music lives)
- **Attack Time**: 1 ms - 100 ms (perceivable difference)
- **Resonance**: 0% - 75% (beyond = self-oscillation)

Design controls to make sweet spots easy to access.

---

## 3. Parameter Types and Their Controls

### Continuous Parameters

**What they are**: Smooth, continuous values (frequency, volume, time)

**Best controls**:
| Control | Best For | Example |
|---------|----------|---------|
| **Knob** | Compact, familiar | Filter cutoff, resonance |
| **Slider** | Visual range | Volume fader, mix |
| **XY Pad** | Two related params | Filter cutoff + resonance |

**Design considerations**:
- Use logarithmic scaling for frequency (Hz) parameters
- Show value on hover/drag
- Provide fine-tune mode (Shift+drag)

```
┌──────────────────────────────────────┐
│           KNOB ANATOMY               │
│                                      │
│            ┌───────┐                 │
│           /    •    \   ← Indicator  │
│          │           │               │
│          │     ●     │   ← Center    │
│          │           │               │
│           \         /                │
│            └───────┘                 │
│                                      │
│          "Cutoff"    ← Label         │
│          "2.4 kHz"   ← Value         │
└──────────────────────────────────────┘
```

### Discrete Parameters

**What they are**: Specific choices (waveform type, filter mode)

**Best controls**:
| Control | Best For | Example |
|---------|----------|---------|
| **Segmented Button** | 2-4 options | Waveform selector |
| **Dropdown** | Many options | Preset selection |
| **Radio Group** | Exclusive choice | Filter type |

**Design considerations**:
- Use icons when possible (waveform shapes)
- Show current selection clearly
- Group related options

```
┌──────────────────────────────────────┐
│        WAVEFORM SELECTOR             │
│                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ ∿  │ │ △  │ │ ▢  │ │ ⊿  │       │
│  │    │ │    │ │ ██ │ │    │       │
│  │Sine│ │Tri │ │Sqr │ │Saw │       │
│  └────┘ └────┘ └────┘ └────┘       │
│     ↑                               │
│  Selected (highlighted)             │
└──────────────────────────────────────┘
```

### Toggle Parameters

**What they are**: On/off states (bypass, sync, mute)

**Best controls**:
- **Toggle Switch**: Clear on/off
- **LED Button**: Compact, status indicator
- **Checkbox**: Standard form element

```
┌──────────────────────────────────────┐
│        TOGGLE VARIATIONS             │
│                                      │
│  Switch:   ○━━━●    (ON)            │
│                                      │
│  LED:      ● SYNC   (lit = on)      │
│                                      │
│  Button:  [ BYPASS ] (pressed = on) │
└──────────────────────────────────────┘
```

### Envelope Parameters

**What they are**: Time-based curves (ADSR, DAHDSR)

**Best control**: Visual envelope editor

```
┌──────────────────────────────────────┐
│           ADSR ENVELOPE              │
│                                      │
│     A   D        S         R         │
│     │   │        │         │         │
│  ┌──┤   │────────│─────────│         │
│  │  │\  │        │         │\        │
│  │  │ \ │        │         │ \       │
│  │  │  \│________│_________|  \      │
│  │  │   │        │         │   \     │
│  └──┴───┴────────┴─────────┴────┘    │
│                                      │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│  │ A │ │ D │ │ S │ │ R │            │
│  └───┘ └───┘ └───┘ └───┘            │
│  10ms  200ms  70%  500ms            │
└──────────────────────────────────────┘
```

**Design considerations**:
- Show the curve visually
- Allow direct manipulation (drag points)
- Display time/level values
- Support common preset shapes (pluck, pad, etc.)

---

## 4. Visual Feedback Patterns

### Real-Time Visualization

| Visualization | Purpose | Update Rate |
|---------------|---------|-------------|
| **Oscilloscope** | Show waveform shape | 60 fps |
| **Spectrum Analyzer** | Show frequency content | 30-60 fps |
| **VU Meter** | Show signal level | 60 fps |
| **Phase Meter** | Show stereo image | 30 fps |

### State Indicators

```
┌──────────────────────────────────────┐
│        INDICATOR PATTERNS            │
│                                      │
│  Active:     ● (filled, colored)     │
│  Inactive:   ○ (outline only)        │
│  Warning:    ● (orange/yellow)       │
│  Clipping:   ● (red, flashing)       │
│  Modulated:  ◐ (animated/pulsing)    │
│  Automated:  ▪ (different shape)     │
└──────────────────────────────────────┘
```

### Modulation Visualization

When a parameter is being modulated by an LFO or envelope:

```
┌──────────────────────────────────────┐
│     MODULATION RING PATTERN          │
│                                      │
│            ┌───────┐                 │
│           /  ╱ •    \                │
│          │  ╱       │  ← Mod depth   │
│          │ ╱   ●    │    (arc shows  │
│          │╱         │     range)     │
│           \         /                │
│            └───────┘                 │
│                                      │
│  Base value: ●                       │
│  Mod range:  ╱ (animated arc)        │
└──────────────────────────────────────┘
```

### Value Display Formats

| Parameter Type | Display Format | Example |
|----------------|----------------|---------|
| Frequency | Hz / kHz | "440 Hz", "2.4 kHz" |
| Time | ms / s | "100 ms", "1.5 s" |
| Volume | dB | "-6.0 dB", "+3.0 dB" |
| Percentage | % | "75%", "100%" |
| Ratio | x:1 | "4:1", "∞:1" |
| Note | Musical | "A4", "C#3" |
| Tempo | BPM / Division | "120 BPM", "1/4" |

---

## 5. Layout Principles

### The Module Pattern

Group related parameters into visual modules:

```
┌──────────────────────────────────────────────────────────┐
│                     OSCILLATOR 1                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │   SHAPE    │  │   PITCH    │  │   LEVEL    │         │
│  │    ◉       │  │    ◉       │  │    ◉       │         │
│  │   Saw      │  │   +0 st    │  │   -6 dB    │         │
│  └────────────┘  └────────────┘  └────────────┘         │
│                                                          │
│  [ ∿ ] [ △ ] [ ▢ ] [ ⊿ ]    Fine: ○━━━●━━━○            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Visual Hierarchy

```
LEVEL 1: Section headers (OSCILLATORS, FILTER, etc.)
    │
    ├── LEVEL 2: Module titles (OSC 1, OSC 2)
    │       │
    │       ├── LEVEL 3: Parameter labels (Cutoff, Reso)
    │       │       │
    │       │       └── LEVEL 4: Values (2.4 kHz, 50%)
```

### Spacing Guidelines

| Element | Spacing | Purpose |
|---------|---------|---------|
| Sections | 32-48px | Clear separation |
| Modules | 16-24px | Visual grouping |
| Parameters | 8-16px | Related items |
| Label-Control | 4-8px | Direct association |

### Responsive Considerations

```
┌─────────────────────────────────────────────────────────┐
│ DESKTOP (1200px+)                                        │
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┐    │
│ │  OSC    │ FILTER  │   AMP   │  MOD    │   FX    │    │
│ └─────────┴─────────┴─────────┴─────────┴─────────┘    │
└─────────────────────────────────────────────────────────┘

┌───────────────────────────────┐
│ TABLET (768px-1199px)         │
│ ┌─────────┬─────────┐         │
│ │  OSC    │ FILTER  │         │
│ ├─────────┼─────────┤         │
│ │   AMP   │  MOD    │         │
│ ├─────────┴─────────┤         │
│ │        FX         │         │
│ └───────────────────┘         │
└───────────────────────────────┘

┌───────────────┐
│ MOBILE (< 768)│
│ ┌───────────┐ │
│ │    OSC    │ │
│ ├───────────┤ │
│ │  FILTER   │ │
│ ├───────────┤ │
│ │    AMP    │ │
│ └───────────┘ │
│  [tabs/swipe] │
└───────────────┘
```

---

## 6. Component Specification Format

When handing off a component design, use this format:

### Component Spec Template

```markdown
# Component: [Name]

## Overview
- **Purpose**: What does this component control?
- **Category**: Which section does it belong to?
- **Priority**: How important is this parameter?

## Parameters Controlled
| ID | Name | Type | Range | Default | Unit |
|----|------|------|-------|---------|------|
| filter_cutoff | Cutoff | float | 20-20000 | 1000 | Hz |
| filter_reso | Resonance | float | 0-1 | 0 | % |

## Visual Design

### States
- Default (idle)
- Hover
- Active (dragging)
- Disabled
- Modulated

### Dimensions
- Width: [value]
- Height: [value]
- Touch target: minimum 44x44px

### Colors
- Background: [token]
- Accent: [token]
- Text: [token]
- Value: [token]

## Interaction

### Mouse
- Click + drag: Change value
- Double-click: Reset to default
- Shift + drag: Fine control
- Right-click: Context menu

### Touch
- Drag: Change value
- Long press: Fine control mode
- Double-tap: Reset

### Keyboard
- Arrow keys: Increment/decrement
- Page Up/Down: Large steps
- Home/End: Min/max

## Accessibility
- ARIA role: slider
- Announce: "{label} {value} {unit}"
- Focus indicator: [description]

## Animation
- Value change: 100ms ease-out
- State transition: 150ms ease-in-out
- Modulation ring: continuous, 60fps

## Assets Needed
- [ ] Icon set
- [ ] Knob texture (if skeuomorphic)
- [ ] Custom cursor
```

### Example: Filter Cutoff Knob

```markdown
# Component: Filter Cutoff Knob

## Overview
- **Purpose**: Controls the filter cutoff frequency
- **Category**: Filter
- **Priority**: High (primary filter control)

## Parameters Controlled
| ID | Name | Type | Range | Default | Unit |
|----|------|------|-------|---------|------|
| filter_cutoff | Cutoff | float | 20-20000 | 1000 | Hz |

## Visual Design

### States
- Default: Gray knob, white indicator line
- Hover: Slight glow, show value tooltip
- Active: Bright accent color on indicator
- Disabled: 50% opacity, no interaction
- Modulated: Animated arc showing mod range

### Dimensions
- Knob diameter: 48px (medium), 64px (large)
- Touch target: 64x64px minimum
- Value label height: 16px

### Colors (using theme tokens)
- Background: --surface-secondary
- Indicator: --accent-primary
- Label: --text-secondary
- Value: --text-primary
- Mod ring: --accent-secondary (50% opacity)

## Interaction

### Mouse
- Vertical drag: 200px = full range
- Shift + drag: 800px = full range (4x precision)
- Double-click: Reset to 1000 Hz
- Scroll: ±1% per tick

### Value Display
- Below 1000 Hz: "XXX Hz"
- 1000 Hz and above: "X.XX kHz"
- Show 2 decimal places for kHz

## Animation
- Knob rotation: CSS transform, 60fps capable
- Value fade: 200ms on change
- Modulation ring: requestAnimationFrame loop
```

---

## 7. Accessibility Considerations

### Color Independence

Never rely on color alone:
```
BAD:  Red = stop, Green = go
GOOD: Red + ■ = stop, Green + ▶ = go
```

### Contrast Requirements

| Element | Minimum Contrast | WCAG Level |
|---------|------------------|------------|
| Text | 4.5:1 | AA |
| Large text | 3:1 | AA |
| UI components | 3:1 | AA |
| Focus indicators | 3:1 | AA |

### Motion Sensitivity

- Provide option to reduce motion
- Avoid rapid flashing (< 3 per second)
- Make visualizations optional

### Screen Reader Support

Every control needs:
```html
<div
  role="slider"
  aria-label="Filter Cutoff"
  aria-valuenow="1000"
  aria-valuemin="20"
  aria-valuemax="20000"
  aria-valuetext="1000 Hertz"
>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next control |
| Shift+Tab | Move to previous control |
| Arrow Up/Right | Increase value |
| Arrow Down/Left | Decrease value |
| Home | Set to minimum |
| End | Set to maximum |
| Enter/Space | Toggle (for buttons) |

---

## 8. Working with the Team

### Your Workflow

```
1. RECEIVE SPEC      Sound Designer provides sonic requirements
       │
       ▼
2. DESIGN            Create visual design + interaction spec
       │
       ▼
3. REVIEW            Get feedback from DSP Engineer (feasibility)
       │              + Sound Designer (musical usability)
       ▼
4. HANDOFF           Provide spec to TypeScript Developer
       │
       ▼
5. ITERATE           Review implementation, refine
```

### Key Collaborators

| Role | You Provide | They Provide |
|------|-------------|--------------|
| **Sound Designer** | Visual mockups, UX feedback | Sonic goals, parameter importance |
| **DSP Engineer** | Feasibility questions | Parameter constraints, technical limits |
| **TypeScript Dev** | Design specs, assets | Implementation questions, prototypes |
| **QA Engineer** | Test criteria | Usability feedback, edge cases |

### Communication Tips

1. **With Sound Designers**:
   - Ask: "Which parameters are most important?"
   - Ask: "What's the typical workflow?"
   - Show: Mockups for interaction feedback

2. **With DSP Engineers**:
   - Ask: "What's the actual parameter range?"
   - Ask: "Are there any performance constraints?"
   - Confirm: Value update rates

3. **With TypeScript Developers**:
   - Provide: Complete specs (use template above)
   - Provide: All visual states
   - Specify: Animation timing and easing

### Design System Integration

Use the established design tokens:

```css
/* Color tokens */
--accent-primary: #00ff88;
--accent-secondary: #0088ff;
--surface-primary: #1a1a1a;
--surface-secondary: #2a2a2a;
--text-primary: #ffffff;
--text-secondary: #888888;

/* Spacing tokens */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* Typography tokens */
--font-label: 11px/1.2 system-ui;
--font-value: 13px/1.2 'JetBrains Mono', monospace;
--font-heading: 14px/1.2 system-ui;
```

---

## Quick Reference

### Parameter → Control Mapping

| Parameter Type | Recommended Control |
|----------------|---------------------|
| Frequency (Hz) | Knob (log scale) |
| Time (ms/s) | Knob (log scale) |
| Level (dB) | Vertical slider |
| Percentage (%) | Knob (linear) |
| Pan (L/R) | Horizontal slider (bipolar) |
| Waveform | Segmented buttons |
| Filter type | Dropdown or tabs |
| On/Off | Toggle switch or LED |
| Envelope | Visual editor |
| Sequence | Step grid |

### Knob Size Guide

| Size | Diameter | Use Case |
|------|----------|----------|
| Small | 32px | Secondary parameters |
| Medium | 48px | Standard parameters |
| Large | 64px | Primary controls (master volume) |

### Common Mistakes to Avoid

1. **Too many knobs** - Group into expandable sections
2. **Tiny touch targets** - Minimum 44x44px
3. **No value display** - Always show current value
4. **Color-only feedback** - Add icons/text
5. **Ignoring keyboard** - Full keyboard support
6. **Fixed layouts** - Design for multiple sizes

---

**Document Version**: 1.0
**For**: Studio Design System
**Maintained by**: Design Team
