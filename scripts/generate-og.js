import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// House icon path from favicon.svg
const housePath = 'M80-200v-360l160-160h40v-80h80v80h360l160 160v360H80Zm560-80h160v-247l-80-80-80 80v247Zm-480 0h400v-200H160v200Z';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#ff5733"/>
  <g transform="translate(480, 100) scale(0.25)">
    <svg viewBox="0 -960 960 960" width="960" height="960">
      <path d="${housePath}" fill="#000000"/>
    </svg>
  </g>
  <text x="600" y="480" text-anchor="middle"
    font-family="Google Sans Flex, sans-serif" font-weight="700"
    font-size="96" fill="#ffffff">Casa</text>
</svg>`;

const outputPath = join(__dirname, '..', 'public', 'og-image.png');

await sharp(Buffer.from(svg))
  .resize(1200, 630)
  .png()
  .toFile(outputPath);

console.log(`Generated ${outputPath}`);
