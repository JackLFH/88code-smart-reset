/**
 * 图标生成脚本
 * 从 SVG 生成多种尺寸的 PNG 图标
 *
 * @author Half open flowers
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_SIZES = [16, 32, 48, 128];
const SVG_PATH = resolve(__dirname, '../public/icons/icon.svg');
const OUTPUT_DIR = resolve(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 开始生成图标...\n');

  // 确保输出目录存在
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 检查 SVG 是否存在
  if (!existsSync(SVG_PATH)) {
    console.error(`❌ SVG 文件不存在: ${SVG_PATH}`);
    process.exit(1);
  }

  // 生成各种尺寸的 PNG
  for (const size of ICON_SIZES) {
    const outputPath = resolve(OUTPUT_DIR, `icon-${size}.png`);

    try {
      await sharp(SVG_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明背景
        })
        .png({
          compressionLevel: 9, // 最高压缩
          quality: 100,
        })
        .toFile(outputPath);

      console.log(`✅ 生成: icon-${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`❌ 生成 ${size}x${size} 失败:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 所有图标生成完成！');
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
}

// 执行
generateIcons().catch((error) => {
  console.error('❌ 生成失败:', error);
  process.exit(1);
});
