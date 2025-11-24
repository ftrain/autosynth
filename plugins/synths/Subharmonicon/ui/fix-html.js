#!/usr/bin/env node
/**
 * Post-build script to fix HTML structure for WebView embedding
 * Wraps script in DOMContentLoaded to ensure DOM is ready
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, 'dist', 'index.html');

let html = readFileSync(htmlPath, 'utf-8');

// Find script tag with any attributes (handles type="module" crossorigin, etc.)
// Match: <script ...>CODE</script> where CODE is everything until </script>
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/;
const scriptMatch = html.match(scriptRegex);

if (!scriptMatch) {
  console.error('No script tag found');
  process.exit(1);
}

const scriptCode = scriptMatch[1];
const fullScriptTag = scriptMatch[0];

console.log('Found script tag:', fullScriptTag.substring(0, 50) + '...');

// Remove the original script tag
html = html.replace(fullScriptTag, '');

// Add script at end of body, wrapped in DOMContentLoaded
// Use plain <script> (no module, no crossorigin) for WebView compatibility
const wrappedScript = `<script>
document.addEventListener('DOMContentLoaded', function() {
${scriptCode}
});
</script>`;

html = html.replace('</body>', `${wrappedScript}\n</body>`);

writeFileSync(htmlPath, html);
console.log('Fixed HTML - script wrapped in DOMContentLoaded and moved to body');
