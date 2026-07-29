import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // `scripts/` entrou junto porque o pipeline de arte mora lá: o SVGO é
    // devDependency e não pode ser importado de `src/`, que vai para o
    // navegador. Sem isto o teste existe e nunca roda.
    include: ["src/**/__tests__/**/*.test.ts", "scripts/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
});
