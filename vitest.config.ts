// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // ✅ 启用全局 API
    environment: "jsdom", // ✅ 使用 jsdom 环境
  },
});
