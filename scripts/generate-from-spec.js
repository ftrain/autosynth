#!/usr/bin/env node
/**
 * @file generate-from-spec.js
 * @brief Generates Voice.h, parameters, and UI from synth-spec.json
 *
 * Usage: node generate-from-spec.js <spec.json> <output-dir>
 *
 * This is the key efficiency win: instead of TODO comments that agents
 * must interpret, we generate working code from a validated spec.
 */

const fs = require('fs');
const path = require('path');

// SST include mappings
const SST_INCLUDES = {
  // Oscillators
  DPWSawOscillator: 'sst/basic-blocks/dsp/DPWSawOscillator.h',
  SinOscillator: 'sst/basic-blocks/dsp/SinOscillator.h',
  PulseOscillator: 'sst/basic-blocks/dsp/PulseOscillator.h',
  CorrelatedNoise: 'sst/basic-blocks/dsp/CorrelatedNoise.h',
  WavetableOscillator: 'sst/basic-blocks/dsp/WavetableOscillator.h',
  // Filters
  CytomicSVF: 'sst/filters/CytomicSVF.h',
  VintageLadder: 'sst/filters/VintageLadder.h',
  K35Filter: 'sst/filters/K35Filter.h',
  NonlinearFeedback: 'sst/filters/NonlinearFeedback.h',
  DiodeLadder: 'sst/filters/DiodeLadder.h',
  CombFilter: 'sst/filters/CombFilter.h',
  // Modulators
  ADSREnvelope: 'sst/basic-blocks/modulators/ADSREnvelope.h',
  DAHDSREnvelope: 'sst/basic-blocks/modulators/DAHDSREnvelope.h',
  SimpleLFO: 'sst/basic-blocks/modulators/SimpleLFO.h',
  // Effects
  Delay: 'sst/effects/Delay.h',
  Reverb: 'sst/effects/Reverb.h',
  Chorus: 'sst/effects/Chorus.h',
  Phaser: 'sst/effects/Phaser.h',
  Flanger: 'sst/effects/Flanger.h',
  Distortion: 'sst/waveshapers/Waveshaper.h'
};

// SST namespace mappings
const SST_NAMESPACES = {
  DPWSawOscillator: 'sst::basic_blocks::dsp::DPWSawOscillator',
  SinOscillator: 'sst::basic_blocks::dsp::SinOscillator',
  PulseOscillator: 'sst::basic_blocks::dsp::PulseOscillator',
  CorrelatedNoise: 'sst::basic_blocks::dsp::CorrelatedNoise',
  VintageLadder: 'sst::filters::VintageLadder<float, 1>',
  CytomicSVF: 'sst::filters::CytomicSVF',
  K35Filter: 'sst::filters::K35Filter',
  ADSREnvelope: 'sst::basic_blocks::modulators::ADSREnvelope',
  DAHDSREnvelope: 'sst::basic_blocks::modulators::DAHDSREnvelope',
  SimpleLFO: 'sst::basic_blocks::modulators::SimpleLFO'
};

function loadSpec(specPath) {
  const content = fs.readFileSync(specPath, 'utf8');
  return JSON.parse(content);
}

function collectIncludes(spec) {
  const includes = new Set();

  // Oscillators
  spec.voice.oscillators.forEach(osc => {
    if (SST_INCLUDES[osc.sst]) includes.add(SST_INCLUDES[osc.sst]);
    if (osc.preFx) {
      osc.preFx.forEach(fx => {
        if (SST_INCLUDES[fx.sst]) includes.add(SST_INCLUDES[fx.sst]);
      });
    }
  });

  // Filters
  spec.voice.filters?.forEach(filter => {
    if (SST_INCLUDES[filter.sst]) includes.add(SST_INCLUDES[filter.sst]);
  });

  // Always need envelopes and LFOs
  includes.add(SST_INCLUDES.ADSREnvelope);
  if (spec.voice.lfos?.length > 0) {
    includes.add(SST_INCLUDES.SimpleLFO);
  }

  // Effects
  spec.effects?.forEach(fx => {
    if (SST_INCLUDES[fx.sst]) includes.add(SST_INCLUDES[fx.sst]);
  });

  return Array.from(includes);
}

function generateVoiceH(spec) {
  const includes = collectIncludes(spec);
  const className = `${spec.meta.id}Voice`;

  let code = `/**
 * @file Voice.h
 * @brief ${spec.meta.name} - Single voice implementation
 * @generated from synth-spec.json - DO NOT EDIT MANUALLY
 *
 * Synthesis Type: ${spec.meta.type}
 * Inspiration: ${spec.meta.inspiration?.join(', ') || 'Original'}
 */

#pragma once

#include <cmath>
#include <array>

// SST Library Includes (auto-generated from spec)
${includes.map(inc => `#include "${inc}"`).join('\n')}

class ${className}
{
public:
    static constexpr int BLOCK_SIZE = 32;

    ${className}() = default;
    ~${className}() = default;

    void prepare(double sampleRate)
    {
        this->sampleRate = sampleRate;

        // Initialize oscillators
${spec.voice.oscillators.map(osc => `        ${osc.id}.init();`).join('\n')}

        // Initialize filters
${spec.voice.filters?.map(f => `        ${f.id}.init();`) .join('\n') || '        // No filters'}

        // Initialize envelopes
${spec.voice.envelopes.map(env => `        ${env.id}.setSampleRate(sampleRate);`).join('\n')}

        // Initialize LFOs
${spec.voice.lfos?.map(lfo => `        ${lfo.id}.setSampleRate(sampleRate);`).join('\n') || '        // No LFOs'}
    }

    void noteOn(int note, float vel)
    {
        currentNote = note;
        velocity = vel;
        active = true;
        releasing = false;
        age = 0;

        float frequency = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);

        // Set oscillator frequencies
${spec.voice.oscillators.map(osc => `        ${osc.id}.setFrequency(frequency, sampleRate);`).join('\n')}

        // Trigger envelopes
${spec.voice.envelopes.map(env => `        ${env.id}.attack();`).join('\n')}
    }

    void noteOff()
    {
        releasing = true;

        // Release envelopes
${spec.voice.envelopes.map(env => `        ${env.id}.release();`).join('\n')}
    }

    void kill()
    {
        active = false;
        releasing = false;
        currentNote = -1;
    }

    void render(float* outputL, float* outputR, int numSamples)
    {
        if (!active)
            return;

        ++age;

        int samplesRemaining = numSamples;
        int offset = 0;

        while (samplesRemaining > 0)
        {
            int blockSize = std::min(samplesRemaining, BLOCK_SIZE);
            renderBlock(outputL + offset, outputR + offset, blockSize);
            offset += blockSize;
            samplesRemaining -= blockSize;
        }
    }

    bool isActive() const { return active; }
    bool isReleasing() const { return releasing; }
    int getNote() const { return currentNote; }
    float getVelocity() const { return velocity; }
    int getAge() const { return age; }

    // Parameter setters (generated from spec)
${spec.parameters.map(p => `    void set_${p.id}(float v) { param_${p.id} = v; }`).join('\n')}

private:
    void renderBlock(float* outputL, float* outputR, int blockSize)
    {
        for (int i = 0; i < blockSize; ++i)
        {
            // Process envelopes
${spec.voice.envelopes.map(env => `            float ${env.id}_out = ${env.id}.process();`).join('\n')}

            // Check if voice finished
            if (env1_out <= 0.0001f && releasing)
            {
                active = false;
                return;
            }

            // Mix oscillators
            float oscMix = 0.0f;
${spec.voice.oscillators.map(osc => {
  const levelParam = spec.parameters.find(p => p.id === `${osc.id}_level`);
  if (levelParam) {
    return `            oscMix += ${osc.id}.step() * param_${osc.id}_level;`;
  }
  return `            oscMix += ${osc.id}.step();`;
}).join('\n')}

${spec.voice.filters?.length > 0 ? `
            // Process filter
            float filterOut = ${spec.voice.filters[0].id}.process(oscMix);
` : `            float filterOut = oscMix;`}

            // Apply amp envelope and velocity
            float output = filterOut * env1_out * velocity;

            outputL[i] += output;
            outputR[i] += output;
        }
    }

    // Voice state
    bool active = false;
    bool releasing = false;
    int currentNote = -1;
    float velocity = 0.0f;
    int age = 0;
    double sampleRate = 44100.0;

    // SST Components (generated from spec)
${spec.voice.oscillators.map(osc => `    ${SST_NAMESPACES[osc.sst] || osc.sst} ${osc.id};`).join('\n')}
${spec.voice.filters?.map(f => `    ${SST_NAMESPACES[f.sst] || f.sst} ${f.id};`).join('\n') || ''}
${spec.voice.envelopes.map(env => `    ${SST_NAMESPACES.ADSREnvelope} ${env.id};`).join('\n')}
${spec.voice.lfos?.map(lfo => `    ${SST_NAMESPACES.SimpleLFO} ${lfo.id};`).join('\n') || ''}

    // Parameters (generated from spec)
${spec.parameters.map(p => `    float param_${p.id} = ${p.default}f;`).join('\n')}
};
`;

  return code;
}

function generateParametersTS(spec) {
  let code = `/**
 * @file parameters.ts
 * @brief ${spec.meta.name} parameter definitions
 * @generated from synth-spec.json - DO NOT EDIT MANUALLY
 */

export interface Parameter {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
  unit: string;
  scale: 'linear' | 'log' | 'exp' | 'discrete';
  category: string;
  cc?: number;
}

export const PARAMETERS: Record<string, Parameter> = {
${spec.parameters.map(p => `  ${p.id}: {
    id: '${p.id}',
    name: '${p.name}',
    min: ${p.min},
    max: ${p.max},
    default: ${p.default},
    unit: '${p.unit || ''}',
    scale: '${p.scale || 'linear'}',
    category: '${p.category}'${p.cc ? `,\n    cc: ${p.cc}` : ''}
  }`).join(',\n')}
};

export const PARAMETER_IDS = [
${spec.parameters.map(p => `  '${p.id}'`).join(',\n')}
] as const;

export type ParameterId = typeof PARAMETER_IDS[number];

// UI Layout (generated from spec)
export const UI_LAYOUT = ${JSON.stringify(spec.ui?.layout || [], null, 2)};
`;

  return code;
}

function generateParametersCpp(spec) {
  let code = `/**
 * @file Parameters.h
 * @brief ${spec.meta.name} JUCE parameter definitions
 * @generated from synth-spec.json - DO NOT EDIT MANUALLY
 */

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>

namespace ${spec.meta.id}Params
{
    // Parameter IDs
${spec.parameters.map(p => `    inline constexpr const char* ${p.id.toUpperCase()} = "${p.id}";`).join('\n')}

    inline juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout()
    {
        std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

${spec.parameters.map(p => {
  const skew = p.scale === 'log' ? ', 0.3f' : '';
  return `        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            juce::ParameterID("${p.id}", 1),
            "${p.name}",
            juce::NormalisableRange<float>(${p.min}f, ${p.max}f${skew}),
            ${p.default}f));`;
}).join('\n\n')}

        return { params.begin(), params.end() };
    }
}
`;

  return code;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node generate-from-spec.js <spec.json> <output-dir>');
    console.log('');
    console.log('Generates:');
    console.log('  - source/dsp/Voice.h');
    console.log('  - source/Parameters.h');
    console.log('  - ui/src/types/parameters.ts');
    process.exit(1);
  }

  const [specPath, outputDir] = args;

  console.log(`Loading spec from ${specPath}...`);
  const spec = loadSpec(specPath);

  console.log(`Generating code for ${spec.meta.name}...`);

  // Ensure directories exist
  const dirs = [
    path.join(outputDir, 'source', 'dsp'),
    path.join(outputDir, 'source'),
    path.join(outputDir, 'ui', 'src', 'types')
  ];
  dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

  // Generate files
  const voiceH = generateVoiceH(spec);
  fs.writeFileSync(path.join(outputDir, 'source', 'dsp', 'Voice.h'), voiceH);
  console.log('  Generated: source/dsp/Voice.h');

  const paramsH = generateParametersCpp(spec);
  fs.writeFileSync(path.join(outputDir, 'source', 'Parameters.h'), paramsH);
  console.log('  Generated: source/Parameters.h');

  const paramsTS = generateParametersTS(spec);
  fs.writeFileSync(path.join(outputDir, 'ui', 'src', 'types', 'parameters.ts'), paramsTS);
  console.log('  Generated: ui/src/types/parameters.ts');

  console.log('');
  console.log('Code generation complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review generated Voice.h and add custom DSP logic');
  console.log('  2. Build with: cmake -B build && cmake --build build');
  console.log('  3. Test with: ctest --test-dir build');
}

main();
