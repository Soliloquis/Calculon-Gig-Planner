import fs from 'fs';
import path from 'path';

const distPath = path.resolve('dist/index.html');
const rootDestPath = path.resolve('Calculon_Planner.html');

if (fs.existsSync(distPath)) {
  let content = fs.readFileSync(distPath, 'utf8');
  
  // Replace the script tag type="module" with a standard script tag
  // Browsers block type="module" locally on file:// but allow standard scripts
  content = content.replace('<script type="module" crossorigin>', '<script>');
  
  // Remove any modulepreload link tags (which fail under file:// CORS)
  content = content.replace(/<link rel="modulepreload"[^>]*>/g, '');
  
  // Move the script tag to the bottom of <body> so the DOM is fully parsed.
  // We use a callback function in .replace() to prevent the JS engine from
  // parsing "$" characters (e.g. $$typeof) inside the minified React code.
  const scriptRegex = /<script>([\s\S]*?)<\/script>/;
  const match = content.match(scriptRegex);
  if (match) {
    const scriptTag = match[0];
    content = content.replace(scriptTag, () => '');
    content = content.replace('</body>', () => `${scriptTag}</body>`);
    console.log('✓ Successfully relocated script block to the bottom of <body> using safe replacement callback.');
  } else {
    console.warn('Warning: No inline script tag found to relocate.');
  }
  
  fs.writeFileSync(distPath, content, 'utf8');
  console.log('🎉 Offline Patch Successful: Configured script tag for local file:/// support.');
  
  // Copy to root directory for easy double-clicking
  fs.copyFileSync(distPath, rootDestPath);
  console.log(`📦 Copied self-contained app to: ${rootDestPath}`);
} else {
  console.error('Error: dist/index.html not found!');
}
