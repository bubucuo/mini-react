import {defineConfig} from "vite";

const rollupOptions = {
  external: ["shared/utils"],
  output: {
    globals: {},
  },
};

export const config = {
  plugins: [],
  build: {
    rollupOptions,
    // minify: `terser`, // boolean | 'terser' | 'esbuild'
    sourcemap: true, // 输出单独 source文件
    brotliSize: true, // 生成压缩大小报告
    lib: {
      entry: "./index.ts",
      name: "scheduler",
      fileName: "scheduler",
      formats: ["esm", "umd", "iife"], // 导出模块类型
    },
    outDir: "./dist",
  },

  test: {},
};

// https://vitejs.dev/config/
export default defineConfig(config as any);
