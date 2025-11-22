# Synth UI Components v2.0

**Professional TypeScript synthesizer UI component library** with theming, accessibility, and JUCE integration.

## 🚀 What's New in v2.0

### Major Changes

✅ **TypeScript Throughout** - 100% type-safe with strict mode
✅ **No More YAML** - Pure TSX components for better DX and LLM interaction
✅ **Design Token System** - Complete theming via CSS custom properties
✅ **6 Built-in Themes** - Vintage, Cyberpunk, Analog, Minimal, Nord, Solarized
✅ **LLM-Friendly** - Easy for AI to customize and generate themes
✅ **Accessible** - ARIA labels, keyboard navigation, screen reader support
✅ **Responsive** - Scales down to 50% on mobile devices
✅ **Type-Safe JUCE Bridge** - Proper TypeScript definitions for WebView communication
✅ **React Hooks** - useParameters, useJUCEBridge for clean state management

### What Was Removed

❌ YAML UI Builder system
❌ js-yaml dependency
❌ Inline style duplication (moved to design tokens)
❌ Vanilla JavaScript files

---

## 📁 New Project Structure

```
/components        # UI primitives (SynthKnob, SynthToggle, etc.)
/layout            # Layout components (Row, Column, ParameterGroup, SynthLayout)
/presets           # Full synth UIs (MinimalSynth, LeadSynth, etc.)
/hooks             # React hooks (useParameters, useJUCEBridge)
/types             # TypeScript type definitions
/themes            # Theme system (presets, schema, generator)
/styles            # Design tokens (tokens.css, shared.ts)
/utils             # Utilities (juce-bridge.ts)
parameters.ts      # Centralized parameter definitions
App.tsx            # Main entry point
```

---

## 🎨 Theming System

### Using Built-in Themes

```tsx
import { applyTheme } from './themes/schema';
import { THEME_PRESETS } from './themes/presets';

// Apply a theme
applyTheme(THEME_PRESETS.cyberpunk);
```

### Available Themes

- **vintage** - Classic black and white (default)
- **cyberpunk** - Neon green on dark purple
- **analog** - Warm browns and oranges
- **minimal** - Clean light theme
- **nord** - Arctic, north-bluish palette
- **solarized** - Popular Solarized Dark colors

### Creating Custom Themes

#### Method 1: From a Color (LLM-Friendly)

```tsx
import { generateThemeFromColor } from './themes/generator';
import { applyTheme } from './themes/schema';

const myTheme = generateThemeFromColor('#ff6b35', {
  id: 'sunset',
  name: 'Sunset Synth',
  style: 'dark',
});

applyTheme(myTheme);
```

#### Method 2: Edit CSS Tokens Directly (Easiest for LLMs)

Edit `styles/tokens.css`:

```css
:root {
  --synth-bg-darkest: #0a0015;  /* Change this */
  --synth-accent-primary: #00ff9f;  /* And this */
  /* All UI updates instantly! */
}
```

---

## 🔧 Creating Synth Presets

### Simple Example

```tsx
import React from 'react';
import { SynthComponentProps } from '../types/parameters';
import { SynthLayout } from '../layout/SynthLayout';
import { ParameterGroup } from '../layout/ParameterGroup';
import { Row } from '../layout/Row';
import { SynthKnob } from '../components/SynthKnob';
import { parameters } from '../parameters';
import { denormalize, normalize } from '../types/parameters';

export const MyCustomSynth: React.FC<SynthComponentProps> = ({
  paramValues,
  onChange,
  parameters: params = parameters,
}) => {
  // Helper to create knob props
  const knobProps = (paramId: string) => {
    const param = params[paramId]!;
    const normalizedValue = paramValues[paramId] ?? 0.5;
    const actualValue = denormalize(paramId, normalizedValue, params);

    return {
      label: param.name.toUpperCase(),
      min: param.min,
      max: param.max,
      value: actualValue,
      onChange: (v: number) => onChange(paramId, normalize(paramId, v, params)),
      defaultValue: param.default,
    };
  };

  return (
    <SynthLayout>
      <ParameterGroup title="Oscillators">
        <Row gap={16} wrap>
          <SynthKnob {...knobProps('saw_level')} />
          <SynthKnob {...knobProps('pulse_level')} />
          <SynthKnob {...knobProps('filter_cutoff')} />
        </Row>
      </ParameterGroup>
    </SynthLayout>
  );
};
```

---

## 🎹 Using Hooks

### useParameters Hook

```tsx
const {
  paramValues,        // Current values (0-1 normalized)
  handleChange,       // Update a parameter
  resetToDefaults,    // Reset all to defaults
  isJUCE,             // Running in JUCE WebView?
} = useParameters({
  parameters,
  syncWithJUCE: true,
  batchUpdates: true,
});
```

### useJUCEBridge Hook

```tsx
const {
  isJUCE,            // Running in JUCE?
  audioData,         // Latest audio samples
  presets,           // Available presets
  loadPreset,        // Load a preset
  savePreset,        // Save current state
} = useJUCEBridge({
  enableAudioData: true,
  enablePresets: true,
});
```

---

## 🤖 LLM Integration Guide

### Why This Architecture is LLM-Friendly

1. **Single File Theming** - Edit `styles/tokens.css` to change entire UI
2. **Type-Safe** - TypeScript catches errors before runtime
3. **No DSL** - Pure React/TSX that LLMs already understand
4. **Composable** - Mix and match primitives like Lego blocks
5. **Well-Documented** - TSDoc comments on every function

### How LLMs Should Customize Themes

**Option 1: Direct CSS Token Editing (Easiest)**

```css
/* Edit styles/tokens.css */
:root {
  --synth-bg-darkest: #1a0f00;  /* Warm brown */
  --synth-accent-primary: #ff6b35;  /* Orange */
}
/* Done! Entire UI is now warm/analog themed. */
```

**Option 2: Generate Theme Object**

```tsx
import { generateThemeFromDescription } from './themes/generator';
import { applyTheme } from './themes/schema';

const customTheme = generateThemeFromDescription({
  colors: {
    primary: '#d4af37',  // Gold
    background: 'dark',
  },
  style: 'retro',
  name: 'Prophet-5 Inspired',
});

applyTheme(customTheme);
```

---

## 🏗️ Development

```bash
npm install        # Install dependencies
npm run dev        # Run development server
npm run build      # Build for production
npm run typecheck  # Type check
npm test           # Run tests
```

---

## 📊 Comparison: Old vs New

| Feature | Old (v1) | New (v2) |
|---------|----------|----------|
| **Language** | JavaScript | TypeScript (strict) |
| **UI Definition** | YAML strings | TSX components |
| **Theming** | Hardcoded inline styles | CSS tokens + theme objects |
| **Type Safety** | None | 100% type-checked |
| **LLM Friendliness** | Medium (custom DSL) | High (standard React) |
| **Accessibility** | None | Full ARIA + keyboard |
| **Responsive** | No | Yes (50% scaling) |
| **Bundle Size** | ~5000 LOC | ~3500 LOC (30% smaller) |

---

## 📚 API Reference

See the `types/` directory for complete TypeScript definitions.

---

## 📄 License

MIT

---

## Legacy Components (v1.0)

The old YAML-based system is documented in `MIGRATION.md`. All original components (FMSynthUI, SpeechSynthUI, etc.) can be migrated to the new architecture.
