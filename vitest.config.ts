/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// 仅用于单元测试的最小配置，不与 vite.config.ts 的构建配置耦合
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: false,
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        // 排除 node_modules、构建产物与库模式构建产物
        exclude: ['node_modules', 'dist', 'dist-lib'],
        // 默认隔离每个测试文件，避免共享单例污染
        isolate: true,
    },
});
