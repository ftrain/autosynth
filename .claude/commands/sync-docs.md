# Sync Documentation

Update project documentation with learnings from the current session.

## Instructions

Review the conversation history and identify:

1. **New DSP patterns** - Anti-click techniques, envelope curves, clock sync, effect curves
2. **UI patterns** - WebView communication, parameter handling, component usage
3. **Build/infrastructure patterns** - CMake, JUCE configuration, dependencies
4. **Bug fixes** - What broke and how it was fixed

Then update these files as appropriate:

### CLAUDE.md
Add new patterns to the "DSP Implementation Notes" section. Include:
- Code examples
- Explanation of why the pattern is needed
- When to use it

### Agent Prompts
Update relevant agents in `.claude/agents/`:
- `dsp-engineer.md` - DSP patterns, SST usage, real-time safety
- `ui-developer.md` - React patterns, WebView bridge, component usage
- `systems-engineer.md` - Build system patterns, CI/CD
- `qa-engineer.md` - Testing patterns, validation

### Component Library
Update or add components in `templates/plugin-template/ui/src/components/`:

**When to update existing components:**
- Bug fixes or improvements discovered during development
- New props needed for common use cases
- Better default styling or behavior

**When to add new components:**
- A reusable UI element was created for a plugin that would benefit other synths
- Copy the component from the plugin's `ui/src/components/` to the template
- Ensure it has no plugin-specific dependencies
- Add Storybook stories if they don't exist

**Component checklist:**
- [ ] Props are well-typed with TypeScript
- [ ] Has sensible defaults
- [ ] Follows existing naming conventions (SynthKnob, SynthSlider, etc.)
- [ ] Uses CSS variables from global.css for theming
- [ ] Accessible (keyboard support, ARIA attributes)

### Focus on:
- Patterns that will be reused in future synths
- Solutions to common problems
- API usage that wasn't obvious
- Gotchas and workarounds

### Do NOT:
- Add trivial or one-off fixes
- Duplicate existing documentation
- Update README.md (it's user-facing, not developer-focused)

After updating, summarize what was added.
