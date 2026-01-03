import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  return {
    plugins: [react()],
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
          },
        },
        // 生成类型声明文件
        emptyOutDir: true,
      }
      : {
        // 应用模式配置（开发和预览）
        outDir: 'dist',
      },
  }
})
