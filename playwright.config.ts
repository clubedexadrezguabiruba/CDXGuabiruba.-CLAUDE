import { defineConfig } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

// Carrega .env.local para disponibilizar vars nos testes
const __dir = typeof __dirname !== "undefined"
  ? __dirname
  : resolve(fileURLToPath(import.meta.url), "..");

try {
  const envPath = resolve(__dir, ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("postgresql://") ||
      trimmed.startsWith("postgres://")
    )
      continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // .env.local não encontrado — testes que precisam de env vão skipar
}

export default defineConfig({
  testDir: "./e2e",
  // 30 s cobre os testes normais; os poucos fluxos longos declaram o seu próprio
  // orçamento com test.setTimeout (ver aulas.spec.ts F2 e puzzles.spec.ts D3).
  //
  // Subir este valor globalmente foi tentado e PIOROU o run completo: cada falha
  // passa a consumir o dobro antes de morrer, e numa suíte de 149 testes com um
  // worker só isso estrangula o resto. Quando muitos testes estouram o tempo, a
  // causa costuma ser a máquina — o servidor `npm run dev` deixado de pé entre
  // vários runs chegou a 1,9 GB de RAM e derrubou dezenas de testes que passam
  // sozinhos em 3-12 s. Reinicie o servidor dev antes de medir, não o timeout.
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  // 1 retry.
  //
  // Esta suíte é ligada por rede ao Supabase de PRODUÇÃO: cada teste faz login
  // de verdade. Depois de corrigidos os problemas reais, o resíduo que sobra são
  // logins que demoram mais que o orçamento — o snapshot da falha mostra o
  // dashboard renderizado, só que tarde demais.
  //
  // Um retry separa isso de defeito: o que falha duas vezes continua vermelho, e
  // o que passa na segunda é reportado como "flaky" — aparece no relatório, não
  // é varrido para baixo do tapete. Não confundir com o test.skip(true, …) que
  // esta sessão removeu do bots-ui-audit: aquele sumia do relatório.
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    // "on-first-retry" com retries: 0 significa trace NUNCA — foi por isso que as
    // falhas de julho/2026 só deixaram um snapshot de DOM em test-results/, sem
    // rede, sem console, sem passo a passo. "retain-on-failure" grava só quando
    // falha, então não custa nada nos runs verdes.
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
