/**
 * Vite 构建配置
 * 用于构建 Chrome 扩展（Manifest V3）
 *
 * @author Half open flowers
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
  },

  // 构建配置
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,

    rollupOptions: {
      input: {
        // Service Worker（Manifest V3 后台脚本）
        background: resolve(__dirname, 'src/background/service-worker.ts'),

        // Popup 界面
        popup: resolve(__dirname, 'src/ui/popup/popup.html'),

        // Options 页面
        options: resolve(__dirname, 'src/ui/options/options.html'),
      },

      output: {
        // 输出目录结构
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background/service-worker.js';
          }
          return '[name]/[name].js';
        },

        chunkFileNames: 'chunks/[name]-[hash].js',

        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';

          if (name.endsWith('.html')) {
            // 从完整路径中提取文件名（不含扩展名）
            // 例如: "src/ui/popup/popup.html" -> "popup"
            const pathParts = name.replace(/\\/g, '/').split('/');
            const filename = pathParts[pathParts.length - 1];
            const basename = filename.replace('.html', '');

            // 将HTML文件输出到对应的目录
            // popup.html -> popup/popup.html
            // options.html -> options/options.html
            return `${basename}/${basename}.html`;
          }

          return 'assets/[name]-[hash][extname]';
        },

        // Service Worker 需要 ESM 格式
        format: 'es',
      },
    },

    // 针对 Chrome 扩展优化
    target: 'esnext',
    minify: 'esbuild',
  },

  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@types': resolve(__dirname, 'src/types'),
      '@core': resolve(__dirname, 'src/core'),
      '@storage': resolve(__dirname, 'src/storage'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },

  // 插件
  plugins: [
    // 复制静态文件到 dist
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.',
        },
        {
          src: 'public/icons/*',
          dest: 'icons',
        },
      ],
    }),

    // 自定义插件：移动 HTML 文件到正确位置
    {
      name: 'move-html-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');

        // 移动 popup.html
        const popupSrc = path.join(distDir, 'src/ui/popup/popup.html');
        const popupDest = path.join(distDir, 'popup/popup.html');
        if (fs.existsSync(popupSrc)) {
          fs.mkdirSync(path.dirname(popupDest), { recursive: true });
          fs.copyFileSync(popupSrc, popupDest);
          console.log(`Moved popup.html to ${popupDest}`);
        }

        // 移动 options.html
        const optionsSrc = path.join(distDir, 'src/ui/options/options.html');
        const optionsDest = path.join(distDir, 'options/options.html');
        if (fs.existsSync(optionsSrc)) {
          fs.mkdirSync(path.dirname(optionsDest), { recursive: true });
          fs.copyFileSync(optionsSrc, optionsDest);
          console.log(`Moved options.html to ${optionsDest}`);
        }

        // 删除 src 目录（清理）
        const srcDir = path.join(distDir, 'src');
        if (fs.existsSync(srcDir)) {
          fs.rmSync(srcDir, { recursive: true, force: true });
          console.log('Cleaned up src directory');
        }
      },
    },
  ],

  // 优化依赖预构建
  optimizeDeps: {
    include: ['dompurify'],
  },
});
