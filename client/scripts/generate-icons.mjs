import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = join(__dirname, '../public/icons/icon.svg');
const outputDir = join(__dirname, '../public/icons');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

// Read SVG file
const svgBuffer = readFileSync(inputSvg);

console.log('Generating PWA icons...');

for (const size of sizes) {
  const outputPath = join(outputDir, `icon-${size}x${size}.png`);

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`Generated: icon-${size}x${size}.png`);
}

// Also generate favicon.ico (16x16 and 32x32)
const favicon16 = join(outputDir, 'favicon-16x16.png');
const favicon32 = join(outputDir, 'favicon-32x32.png');

await sharp(svgBuffer).resize(16, 16).png().toFile(favicon16);
console.log('Generated: favicon-16x16.png');

await sharp(svgBuffer).resize(32, 32).png().toFile(favicon32);
console.log('Generated: favicon-32x32.png');

console.log('\nAll icons generated successfully!');
