const sharp = require('sharp');
const path = require('path');

class ImageService {

  static async applyWatermark(inputPath) {

    const logoPath = path.resolve(__dirname, '../assets/watermark.png');

    const image = sharp(inputPath).rotate();
    const metadata = await image.metadata();

    const isLandscape = metadata.width > metadata.height;

    let logoWidth = Math.round(metadata.width * 0.18);

    if (isLandscape) {
      logoWidth = Math.round(logoWidth * 0.72);
    }


    const logo = await sharp(logoPath)
      .resize({ width: logoWidth })
      .png()
      .toBuffer();

    const left = Math.round(metadata.width * 0.05); // 20% esquerda
    const top = 0;

    const parsed = path.parse(inputPath);
    const outputPath = path.join(parsed.dir, `${parsed.name}_wm.jpg`);

    await image
      .composite([{
        input: logo,
        left: left,
        top: top,
        blend: 'over'
      }])
      .jpeg({ quality: 92 })
      .toFile(outputPath);

    return outputPath;
  }
}

module.exports = ImageService;