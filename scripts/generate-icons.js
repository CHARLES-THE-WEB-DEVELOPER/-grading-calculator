const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'server', 'public', 'icons');
const svg192 = path.join(iconsDir, 'icon-192.svg');
const svg512 = path.join(iconsDir, 'icon-512.svg');

if (!fs.existsSync(iconsDir)) {
  console.error('Icons directory missing:', iconsDir);
  process.exit(1);
}

async function gen(svgPath, sizes) {
  for (const size of sizes) {
    const out = svgPath.replace('.svg', `-${size}.png`).replace('icon-512', 'icon');
    try {
      await sharp(svgPath).resize(size, size).png().toFile(out);
      console.log('Generated', out);
    } catch (err) {
      console.error('Failed to generate', out, err);
    }
  }
}

(async () => {
  await gen(svg192, [192]);
  await gen(svg512, [256, 512]);
  console.log('Icon generation complete.');
})();
