"use client";

/**
 * O seletor. Uma variante por vez, em tamanho grande, com troca instantânea.
 *
 * **Uma por vez, e não as três lado a lado, de propósito.** A folha de contato já
 * mostra as três juntas, e é lá que se compara. O que ela não consegue mostrar é
 * como UMA delas se sustenta sozinha, ocupando a tela, que é como o aluno vai ver
 * o próprio boneco. Peça que só se defende ao lado das concorrentes não é escolha,
 * é a menos ruim de três.
 *
 * Trocar sem recarregar importa pelo mesmo motivo que uma folha de contato importa:
 * o olho compara o que está no mesmo lugar. Duas imagens no mesmo pixel, alternadas,
 * revelam diferença que duas imagens lado a lado escondem.
 */

import { useEffect, useState } from "react";
import { CABELO, PELE } from "@/lib/avatar/palette";

interface Variante {
  nome: string;
  eixo: string;
  formas: number;
  bytes: number;
  svg: string;
}

interface Folha {
  selo: string;
  variantes: Variante[];
}

/** Os fundos feios não são decoração — ver a lista do que conferir, abaixo. */
const FUNDOS = ["#EFEAE2", "#FF00FF", "#1B1B1F", "#FFFFFF"] as const;

export default function AvatarVariantesClient() {
  const [folha, setFolha] = useState<Folha | null>(null);
  const [erro, setErro] = useState(false);
  const [i, setI] = useState(0);
  const [fundo, setFundo] = useState<string>(FUNDOS[0]);
  const [altura, setAltura] = useState(420);

  useEffect(() => {
    fetch("/dev/variantes.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("sem arquivo"))))
      .then(setFolha)
      .catch(() => setErro(true));
  }, []);

  if (erro) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-zinc-700">
        <h1 className="text-lg font-semibold text-zinc-900">Nenhuma variante gerada ainda</h1>
        <p className="mt-2 text-zinc-500">
          Esta tela lê <code>public/dev/variantes.json</code>, que sai de:
        </p>
        <pre className="mt-3 rounded bg-zinc-900 p-3 text-xs text-zinc-100">
          npm run avatar:variantes
        </pre>
        <p className="mt-3 text-zinc-500">
          Ele lê as candidatas de <code>.scratch/variantes.ts</code> e só publica aqui se elas
          passarem nas amarras e se distinguirem entre si a 56&nbsp;px.
        </p>
      </main>
    );
  }

  if (!folha) return <main className="p-8 text-sm text-zinc-500">carregando…</main>;

  const v = folha.variantes[i];
  const dimensionado = v.svg.replace(
    "<svg ",
    `<svg width="${Math.round((altura * 500) / 700)}" height="${altura}" `,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-sm text-zinc-700">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold text-zinc-900">
          Variantes — {folha.variantes.length} candidatas
        </h1>
        <span className="rounded border border-amber-600/60 px-2 py-1 font-mono text-xs tracking-[0.18em] text-zinc-900">
          {folha.selo}
        </span>
      </div>
      <p className="mt-1 text-zinc-500">
        Nenhuma está marcada como favorita, e isso é a regra: a escolha é sua. O que a régua
        garante é que as {folha.variantes.length} passam nas amarras e que são desenhos
        diferentes de verdade — não três tons da mesma ideia.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {folha.variantes.map((c, k) => (
            <button
              key={c.nome}
              type="button"
              onClick={() => setI(k)}
              className={`rounded border px-3 py-1.5 text-xs font-medium ${
                k === i
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-500"
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">fundo:</span>
          {FUNDOS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFundo(f)}
              aria-label={f}
              className={`h-6 w-6 rounded border-2 ${
                f === fundo ? "border-zinc-900" : "border-zinc-300"
              }`}
              style={{ background: f }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-zinc-500">tamanho</span>
          <input
            type="range"
            min={56}
            max={560}
            step={4}
            value={altura}
            onChange={(e) => setAltura(Number(e.target.value))}
          />
          <span className="w-12 tabular-nums text-zinc-500">{altura} px</span>
        </label>
      </div>

      <p className="mt-5 text-zinc-500">
        <b className="text-zinc-900">{v.nome}</b> — {v.eixo}
      </p>

      <div
        className="mt-2 flex min-h-[600px] items-center justify-center rounded-lg p-6"
        style={{ background: fundo }}
      >
        <span dangerouslySetInnerHTML={{ __html: dimensionado }} />
      </div>

      <p className="mt-2 text-xs text-zinc-400">
        {v.formas} formas · {v.bytes.toLocaleString("pt-BR")} bytes
      </p>

      <h2 className="mt-8 font-semibold text-zinc-900">O que conferir aqui</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600">
        <li>
          <b>Arraste o tamanho até 56 px e alterne entre as candidatas.</b> É o tamanho do
          ranking, e pela regra 8 da §7 <b>o que manda é o menor</b>. Uma peça que só se
          distingue grande perdeu.
        </li>
        <li>
          <b>Fundo magenta e preto</b> revelam furo e halo que o fundo claro esconde. Se
          aparecer magenta entre a peça e o contorno, alguém passou a declarar silhueta em
          dois lugares.
        </li>
        <li>
          <b>Alterne no mesmo lugar em vez de comparar lado a lado.</b> Duas imagens no mesmo
          pixel revelam diferença que duas imagens vizinhas escondem.
        </li>
        <li>
          <b>Nomeie o que a forma lê como</b>, não se ela é boa. &ldquo;Lê como boina&rdquo; é
          resposta útil; &ldquo;ficou legal&rdquo; não muda desenho nenhum.
        </li>
      </ul>
    </main>
  );
}
