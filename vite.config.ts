import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: isLib
      ? {
          // 库模式配置
          lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'LiveMixerWeb',
            formats: ['es', 'umd'],
            fileName: (format) => `livemixer-web.${format}.js`,
          },
          rollupOptions: {
            // 确保外部化处理不想打包进库的依赖
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
              // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'react/jsx-runtime': 'jsxRuntime',
              },
              // 提取 CSS 和资源文件到单独文件
              assetFileNames: (assetInfo) => {
                // CSS 文件直接放在根目录，不带 hash
                if (assetInfo.name?.endsWith('.css')) {
                  return 'livemixer-web.css';
                }
                // SVG 和其他资源文件保持原名
                if (assetInfo.name?.endsWith('.svg')) {
                  return '[name][extname]';
                }
                return 'assets/[name]-[hash][extname]';
              },
            },
          },
          // 生成类型声明文件
          outDir: 'dist-lib',
          emptyOutDir: true,
          // 确保 CSS 被提取
          cssCodeSplit: false,
        }
      : {
          // 应用模式配置（开发和预览）
          outDir: 'dist',
        },
  };
});
