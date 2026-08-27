"use client";

/**
 * O EDITOR DE OCLUSÃO — a mão do Doug sobre a região que o chapéu esconde.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE EXISTE
 * ---------------------------------------------------------------------------
 *
 * A esteira propõe a região medindo o alfa da peça, e a proposta fecha os
 * vazamentos: escape médio de 5,62% para 0,09% nos 171 pares. O que ela **não**
 * resolve é forma — no extremo em x do chapéu a região sobe reta, e cabelo que
 * passa ali sai cortado numa vertical. Duas construções alternativas foram medidas
 * e caíram (`oclusao-do-chapeu.ts` guarda os números). A terceira seria escolher
 * forma pela régua; o que resolve é o olho, e é para ele que este editor serve.
 *
 * ---------------------------------------------------------------------------
 * TRÊS DECISÕES QUE FAZEM ELE VALER
 * ---------------------------------------------------------------------------
 *
 * **1. Pinta-se o CHAPÉU, nunca o par.** A região é do chapéu e erra igual nos 19
 * cabelos. São 9 edições e acabou, e todo cabelo novo herda de graça — contra 171
 * máscaras mais 9 a cada peça nova.
 *
 * **2. A prévia é o PRODUTO, não uma aproximação.** Quem traça é o `potrace` da
 * esteira, na rota `/api/dev/oclusao`, e o `d` que volta é caractere a caractere o
 * que `npm run arte:chapeus` escreveria. Traçar no navegador com outro algoritmo
 * faria julgar uma coisa e desenhar outra — o defeito nº 1 desta rota de arte.
 *
 * **3. A tira dos 19 fica em TAMANHO REAL enquanto se pinta ampliado.** A lupa
 * responde *"onde está o defeito"*; só o tamanho real responde *"alguém vê"*. Uma
 * janela ampliada engana nos dois sentidos: mostra como grave um degrau de 2 px, e
 * esconde que uma reta de 19 px atravessa a silhueta inteira.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CHAPEUS } from "@/lib/avatar/catalogo";
import { CABELOS, type ModeloCabelo } from "@/lib/avatar/estilo/cabelo";
import { ancoraDaFigura, compor, ESCALA_PADRAO } from "@/lib/avatar/estilo/compositor";
import { CAIXA_DA_ARTE, VIEWBOX } from "@/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "@/lib/avatar/palette";
import type { PecaDeChapeu } from "@/lib/avatar/estilo/tipos";

import { medirSobra, RASTER, tintaDoChapeu, ZONAS, type Sobra, type Zona } from "./sobra";

/** As duas cores do vocabulário. Verde esconde, vermelho mostra — como no doc. */
const TINTA = {
  esconder: "rgba(0,255,0,1)",
  mostrar: "rgba(255,0,0,1)",
} as const;

const ZOOMS = [1, 2, 3, 4, 6, 8] as const;

/**
 * Os apertos da bancada — quanto o chapéu achata o cabelo, em x.
 *
 * Medido na folha de 2026-08-26: `0,95×` fecha `chanel`+`bone` e `elvis`+`touca`;
 * `0,90×` fecha `cachos-anjo`+`boina`; `0,85×` é onde o penteado começa a perder
 * volume (o bob encosta no olho, as cordas do `dreadlocks` afinam 57%).
 *
 * ⚠️ **`0,92` e `0,87` entraram porque o olho do Doug caiu ENTRE dois degraus.**
 * A escada de 5 em 5 centésimos era minha, não medida: com 4 valores, penteado
 * demais ficava mal nos dois vizinhos. A escada agora é de ~2,5 centésimos na faixa
 * onde a decisão acontece, e o valor final é POR PAR — cada cabelo tem o seu debaixo
 * de cada chapéu, e quem decide é ele olhando.
 */
const APERTOS = [
  1, 0.98, 0.97, 0.96, 0.95, 0.94, 0.93, 0.92, 0.91, 0.9, 0.89, 0.88, 0.87, 0.86, 0.85, 0.84,
] as const;

/** O passo do `−`/`+`, para o valor que não estiver na escada acima. */
const PASSO = 0.01;
const APERTO_MIN = 0.75;

type Pincel = keyof typeof TINTA;

const SLUGS = Object.keys(CHAPEUS);
const CABELOS_TONAIS = Object.keys(CABELOS).filter(
  (c) => (CABELOS as Record<string, { tonal?: unknown }>)[c].tonal,
) as ModeloCabelo[];

function Boneco({
  modelo,
  chapeu,
  h,
  ns,
  aperto,
}: {
  modelo: ModeloCabelo | undefined;
  chapeu: PecaDeChapeu | undefined;
  h: number;
  ns: string;
  aperto: number;
}) {
  const svg = compor({
    pele: PELE[2],
    cabelo: CABELO[1],
    modeloCabelo: modelo,
    chapeu,
    apertoDoCabelo: aperto,
    ns,
  }).replace("<svg ", `<svg width="${Math.round((h * VIEWBOX.w) / VIEWBOX.h)}" height="${h}" `);
  return <span dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function OclusaoClient() {
  const [slug, setSlug] = useState(SLUGS[0]);
  const [pincel, setPincel] = useState<Pincel>("mostrar");
  const [grossura, setGrossura] = useState(18);
  // ⚠️ **ABRE EM 1×, e isso não é gosto.** Em 2× o boneco não cabe nos 430 px do
  // quadro, e quem chega na tela vê um pedaço ampliado de peça sem saber que está
  // olhando a lupa. A lupa responde *onde está o defeito*; o tamanho real responde
  // *alguém vê* — e é a segunda pergunta que se faz primeiro.
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mostrarRegiao, setMostrarRegiao] = useState(true);
  const [cabeloDeProva, setCabeloDeProva] = useState<ModeloCabelo>("dreadlocks");
  const [d, setD] = useState<string | undefined>(undefined);
  const [mao, setMao] = useState({ escondeu: 0, mostrou: 0 });
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [mostrarSobra, setMostrarSobra] = useState(true);
  /** Quanto o chapéu achata o cabelo. 1 = como estava antes de 2026-08-26. */
  const [aperto, setAperto] = useState(1);
  /**
   * A TABELA GRAVADA — o aperto de cada par, como está no disco.
   *
   * Ela é a fonte da verdade do que o produto usaria; o botão `aperto` acima é só o
   * valor EM PROVA do par que está na mesa. Os 19 da tira desenham com o valor
   * gravado de cada um, e só o escolhido usa o valor em prova — é assim que dá para
   * ver a peça em ajuste dentro do conjunto já decidido.
   */
  const [tabela, setTabela] = useState<Record<string, number>>({});
  const [sobra, setSobra] = useState<Sobra | null>(null);

  /** O que a mão pintou. Fonte da verdade do editor; o resto é derivado dela. */
  const correcao = useRef<HTMLCanvasElement | null>(null);
  /** O que sobra do cabelo, pintado por zona. Só leitura: nada daqui vira arquivo. */
  const overlay = useRef<HTMLCanvasElement | null>(null);
  /** Pilha de desfazer: um `ImageData` por pincelada terminada. */
  const historico = useRef<ImageData[]>([]);
  const pintando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const arrastando = useRef<{ x: number; y: number } | null>(null);

  /**
   * A GEOMETRIA DO QUADRO, DERIVADA — nenhum número cravado.
   *
   * Três sistemas convivem aqui e é onde um editor erra: unidade INTERNA (onde vive
   * a arte e a `CAIXA_DA_ARTE`), unidade de VIEWBOX (onde `compor()` desenha, depois
   * da âncora e da escala) e PIXEL de tela. Escrever a conversão à mão seria a
   * segunda descrição de `naTela()`, e ela sairia desalinhada em algum zoom.
   */
  const ALTURA = 430;
  const k = ALTURA / VIEWBOX.h; // px de tela por unidade de viewBox
  const larguraDoQuadro = Math.round(VIEWBOX.w * k);
  const ancora = ancoraDaFigura();
  const caixa = {
    left: (ancora.x + ESCALA_PADRAO * CAIXA_DA_ARTE.x) * k,
    top: (ancora.y + ESCALA_PADRAO * CAIXA_DA_ARTE.y) * k,
    width: CAIXA_DA_ARTE.w * ESCALA_PADRAO * k,
    height: CAIXA_DA_ARTE.h * ESCALA_PADRAO * k,
  };
  /** A peça com a linha do EDITOR, não a do catálogo — é o que a prévia desenha. */
  const pecaEmEdicao: PecaDeChapeu | undefined = useMemo(() => {
    const base = CHAPEUS[slug];
    if (!base) return undefined;
    return { id: base.id, nome: base.nome, arte: base.arte!, escondeCabelo: d };
  }, [slug, d]);

  const ctx = () => correcao.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const chaveDoPar = (chapeu: string, cabelo: string) => `${chapeu}|${cabelo}`;
  const apertoGravado = (cabelo: string) => tabela[chaveDoPar(slug, cabelo)] ?? 1;

  /** A tabela do disco, uma vez. Falha alto: tela sem tabela mentiria calada. */
  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const r = await fetch("/api/dev/aperto");
        if (!r.ok) throw new Error(`a rota respondeu ${r.status}`);
        const j = (await r.json()) as { tabela: Record<string, number> };
        if (vivo) setTabela(j.tabela);
      } catch (e) {
        if (vivo) setAviso(`não consegui ler a tabela de aperto: ${(e as Error).message}`);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  /** Trocar de par põe na mesa o valor JÁ DECIDIDO dele — nunca o do par anterior. */
  useEffect(() => {
    setAperto(tabela[chaveDoPar(slug, cabeloDeProva)] ?? 1);
    // `tabela` de propósito fora: gravar não pode reposicionar o botão embaixo da mão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, cabeloDeProva]);

  /** Grava o par que está na mesa. `1` apaga a linha — "este não aperta". */
  const gravarAperto = useCallback(async () => {
    setOcupado(true);
    try {
      const r = await fetch("/api/dev/aperto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chapeu: slug, cabelo: cabeloDeProva, valor: aperto }),
      });
      if (!r.ok) throw new Error(`a rota respondeu ${r.status}`);
      const j = (await r.json()) as { tabela: Record<string, number> };
      setTabela(j.tabela);
      setAviso(null);
    } catch (e) {
      setAviso(`não consegui gravar o aperto: ${(e as Error).message}`);
    } finally {
      setOcupado(false);
    }
  }, [slug, cabeloDeProva, aperto]);

  /** Manda a pincelada para a esteira e recebe o `d` que o produto usaria. */
  const tracar = useCallback(
    async (salvar = false) => {
      const c = correcao.current;
      if (!c) return;
      setOcupado(true);
      setAviso(null);
      try {
        // "Vazio" se lê do CANVAS, nunca do estado: o estado pode estar uma
        // pincelada atrás, e salvar vazio APAGA o arquivo do disco.
        const px = c.getContext("2d")!.getImageData(0, 0, RASTER.w, RASTER.h).data;
        let vazio = true;
        for (let i = 3; i < px.length && vazio; i += 4) if (px[i] > 8) vazio = false;
        const r = await fetch("/api/dev/oclusao", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            slug,
            correcao: vazio ? null : c.toDataURL("image/png"),
            salvar,
          }),
        });
        if (!r.ok) throw new Error(`a rota respondeu ${r.status}`);
        // Sem `d`, o que a tela mostra não é o produto — e isso tem de aparecer.
        const j = (await r.json()) as { d?: string; mao: typeof mao; salvo: boolean };
        setD(j.d);
        setMao(j.mao);
        if (j.salvo) setAviso("gravado — rode `npm run arte:chapeus` para o catálogo pegar");
      } catch (e) {
        setAviso(`falhou: ${(e as Error).message} — veja o terminal do \`next dev\``);
      } finally {
        setOcupado(false);
      }
    },
    [slug],
  );

  /** Troca de chapéu: zera a mão, busca a correção do disco e a linha de hoje. */
  useEffect(() => {
    let vivo = true;
    historico.current = [];
    const c = correcao.current;
    if (c) {
      const g = c.getContext("2d");
      g?.clearRect(0, 0, RASTER.w, RASTER.h);
    }
    (async () => {
      // ⚠️ **O GET NÃO PODE FALHAR CALADO.** A primeira versão fazia `if (!r.ok)
      // return;`, e quando a rota respondeu 500 (o `sharp`/`potrace` empacotados
      // pelo Turbopack) a tela abriu sem `d`: o chapéu parecia certo, o cabelo
      // escapava, e nada na interface dizia que a linha não tinha chegado. Um
      // editor que engole o erro do próprio motor mente com cara de funcionando.
      let r: Response;
      try {
        r = await fetch(`/api/dev/oclusao?slug=${encodeURIComponent(slug)}`);
      } catch (e) {
        if (vivo) setAviso(`não consegui falar com a rota: ${(e as Error).message}`);
        return;
      }
      if (!vivo) return;
      if (!r.ok) {
        setD(undefined);
        setAviso(
          `a rota respondeu ${r.status} ao buscar a linha — o que está na tela NÃO tem oclusão. ` +
            `Veja o terminal do \`next dev\`.`,
        );
        return;
      }
      const j = (await r.json()) as { correcao: string | null; d?: string; mao: typeof mao };
      setAviso(null);
      setD(j.d);
      setMao(j.mao);
      if (j.correcao && correcao.current) {
        const img = new Image();
        img.onload = () => correcao.current?.getContext("2d")?.drawImage(img, 0, 0);
        img.src = j.correcao;
      }
    })();
    return () => {
      vivo = false;
    };
  }, [slug]);

  /**
   * O OVERLAY DO QUE SOBRA — recontado a cada pincelada, a cada troca de peça.
   *
   * Ele não depende da régua nem da rota: as três máscaras saem do que está na tela
   * (as `formas` do cabelo, o `d` que a rota devolveu, o `.svg` do chapéu). Por isso
   * responde na mesma hora e por isso não mente sobre o que o produto mostraria.
   */
  useEffect(() => {
    let vivo = true;
    const tela = overlay.current;
    if (!tela) return;
    const g = tela.getContext("2d");
    if (!mostrarSobra) {
      g?.clearRect(0, 0, RASTER.w, RASTER.h);
      setSobra(null);
      return;
    }
    const arte = CHAPEUS[slug]?.arte;
    if (!arte) return;
    void (async () => {
      try {
        const tinta = await tintaDoChapeu(arte);
        if (!vivo) return;
        const s = medirSobra(cabeloDeProva, tinta, d, aperto);
        g?.putImageData(s.pintura, 0, 0);
        setSobra(s);
      } catch (e) {
        if (vivo) setAviso(`o overlay falhou: ${(e as Error).message}`);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [slug, d, cabeloDeProva, mostrarSobra, aperto]);

  /**
   * Ponteiro -> pixel do raster da correção, DESFAZENDO as duas transformações.
   *
   * O quadro tem `translate(pan) scale(zoom)` com origem no canto; dentro dele o
   * canvas ocupa só a `caixa`, que é a `CAIXA_DA_ARTE` posta na escala da figura.
   * Ignorar a caixa e dividir pelo quadro inteiro — que foi a primeira versão —
   * desloca a pincelada e a espicha, e o erro cresce com o zoom.
   */
  const noRaster = (ev: React.PointerEvent<HTMLDivElement>) => {
    const alvo = ev.currentTarget.getBoundingClientRect();
    const qx = (ev.clientX - alvo.left - pan.x) / zoom;
    const qy = (ev.clientY - alvo.top - pan.y) / zoom;
    return {
      x: ((qx - caixa.left) / caixa.width) * RASTER.w,
      y: ((qy - caixa.top) / caixa.height) * RASTER.h,
    };
  };

  const risca = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const g = ctx();
    if (!g) return;
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = TINTA[pincel];
    g.lineWidth = grossura;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
  };

  const desfazer = () => {
    const g = ctx();
    const anterior = historico.current.pop();
    if (!g) return;
    if (anterior) g.putImageData(anterior, 0, 0);
    else g.clearRect(0, 0, RASTER.w, RASTER.h);
    void tracar();
  };

  const limpar = () => {
    const g = ctx();
    if (!g) return;
    historico.current = [];
    g.clearRect(0, 0, RASTER.w, RASTER.h);
    void tracar();
  };



  return (
    <main className="mx-auto max-w-[1500px] px-4 py-4 text-sm text-zinc-700">
      {/* CABEÇALHO COMPACTO — a mesa de pintura tem de caber na primeira tela.
          A primeira versão gastava ~150 px de altura em título e parágrafo e
          empurrava o quadro para baixo da dobra: o Doug abriu e viu o rodapé. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-base font-semibold text-zinc-900">Oclusão do chapéu</h1>
        <p className="text-xs text-zinc-500">
          <b className="text-emerald-700">verde</b> é o que o chapéu esconde. Pinte{" "}
          <b className="text-red-600">mostrar</b> para devolver cabelo e <b>esconder</b> para
          engolir o que sobrou — você pinta o <b>chapéu</b>, e a região vale para os{" "}
          {CABELOS_TONAIS.length}.
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {SLUGS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSlug(s)}
            className={`rounded border px-2 py-0.5 text-xs ${
              slug === s
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white hover:border-zinc-400"
            }`}
          >
            {CHAPEUS[s].nome}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-5">
        {/* A MESA ------------------------------------------------------- */}
        <div style={{ width: larguraDoQuadro }}>
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {(["mostrar", "esconder"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPincel(p)}
                className={`rounded border px-2.5 py-1 font-semibold ${
                  pincel === p
                    ? p === "mostrar"
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-zinc-300 bg-white text-zinc-500"
                }`}
              >
                {p}
              </button>
            ))}
            <input
              type="range"
              min={2}
              max={80}
              value={grossura}
              onChange={(e) => setGrossura(Number(e.target.value))}
              className="w-20"
              title="grossura do pincel"
            />
            <span className="w-6 tabular-nums text-zinc-500">{grossura}</span>
            <span className="ml-1 text-zinc-400">lupa</span>
            {ZOOMS.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => {
                  setZoom(z);
                  if (z === 1) setPan({ x: 0, y: 0 });
                }}
                className={`rounded border px-1.5 py-0.5 ${
                  zoom === z ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"
                }`}
              >
                {z}×
              </button>
            ))}
            <label className="ml-1 flex items-center gap-1 text-zinc-500">
              <input
                type="checkbox"
                checked={mostrarRegiao}
                onChange={(e) => setMostrarRegiao(e.target.checked)}
              />
              região
            </label>
            <label className="flex items-center gap-1 text-zinc-500">
              <input
                type="checkbox"
                checked={mostrarSobra}
                onChange={(e) => setMostrarSobra(e.target.checked)}
              />
              o que sobra
            </label>

          </div>

          {/* O APERTO — o chapéu achatando o cabelo. Linha própria porque a escada é
              longa de propósito: o Doug decide POR PAR, e duas vezes o olho dele caiu
              entre dois degraus meus. Vale ao mesmo tempo para a mesa, para os 19 da
              tira e para o de 150 px — é a mesma peça composta. */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1 text-xs">
            <span className="text-zinc-400">aperto do cabelo</span>
            <button
              type="button"
              onClick={() => setAperto((v) => Math.max(APERTO_MIN, Math.round((v - PASSO) * 100) / 100))}
              className="rounded border border-zinc-300 bg-white px-1.5 py-0.5"
              title={`aperta mais ${PASSO}`}
            >
              −
            </button>
            <span className="w-10 text-center font-semibold tabular-nums text-zinc-900">
              {aperto.toFixed(2).replace(".", ",")}
            </span>
            <button
              type="button"
              onClick={() => setAperto((v) => Math.min(1, Math.round((v + PASSO) * 100) / 100))}
              className="rounded border border-zinc-300 bg-white px-1.5 py-0.5"
              title={`solta ${PASSO}`}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => void gravarAperto()}
              disabled={ocupado}
              className="rounded border border-emerald-700 bg-emerald-700 px-2 py-0.5 font-semibold text-white disabled:opacity-40"
              title="grava este valor para o par que está na mesa"
            >
              gravar par
            </button>
            <span className="text-zinc-400">
              {cabeloDeProva} + {slug.replace("chapeu-", "")}
              {apertoGravado(cabeloDeProva) !== aperto && <b className="ml-1 text-amber-600">• não gravado</b>}
            </span>
            <span className="mx-1 text-zinc-300">|</span>
            {APERTOS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAperto(a)}
                title={a === 1 ? "sem aperto — o cabelo como foi desenhado" : `cabelo a ${Math.round(a * 100)}% da largura`}
                className={`rounded border px-1.5 py-0.5 tabular-nums ${
                  aperto === a ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"
                }`}
              >
                {a === 1 ? "1,00" : a.toFixed(2).replace(".", ",")}
              </button>
            ))}
          </div>

          <div
            className="relative overflow-hidden rounded-lg border border-zinc-300 bg-[#FBF8F5]"
            style={{
              width: larguraDoQuadro,
              height: ALTURA,
              touchAction: "none",
              cursor: "crosshair",
            }}
            onPointerDown={(ev) => {
              ev.currentTarget.setPointerCapture(ev.pointerId);
              if (ev.button === 1) {
                arrastando.current = { x: ev.clientX - pan.x, y: ev.clientY - pan.y };
                return;
              }
              const g = ctx();
              if (g) historico.current.push(g.getImageData(0, 0, RASTER.w, RASTER.h));
              if (historico.current.length > 40) historico.current.shift();
              pintando.current = true;
              ultimo.current = noRaster(ev);
              risca(ultimo.current, ultimo.current);
            }}
            onPointerMove={(ev) => {
              if (arrastando.current) {
                setPan({
                  x: ev.clientX - arrastando.current.x,
                  y: ev.clientY - arrastando.current.y,
                });
                return;
              }
              if (!pintando.current || !ultimo.current) return;
              const p = noRaster(ev);
              risca(ultimo.current, p);
              ultimo.current = p;
            }}
            onPointerUp={() => {
              arrastando.current = null;
              if (!pintando.current) return;
              pintando.current = false;
              ultimo.current = null;
              void tracar();
            }}
            onPointerLeave={() => {
              arrastando.current = null;
              if (!pintando.current) return;
              pintando.current = false;
              ultimo.current = null;
              void tracar();
            }}
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: larguraDoQuadro,
                height: ALTURA,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                imageRendering: "pixelated",
              }}
            >
              <div className="absolute left-0 top-0">
                <Boneco modelo={cabeloDeProva} chapeu={pecaEmEdicao} h={ALTURA} ns="ed" aperto={aperto} />
              </div>
              {mostrarRegiao && d && (
                <svg
                  className="pointer-events-none absolute left-0 top-0"
                  width={larguraDoQuadro}
                  height={ALTURA}
                  viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
                >
                  <g transform={`translate(${ancora.x} ${ancora.y}) scale(${ESCALA_PADRAO})`}>
                    <path d={d} fill="rgba(16,185,129,0.26)" stroke="#10b981" strokeWidth={2} />
                  </g>
                </svg>
              )}
              <canvas
                ref={overlay}
                width={RASTER.w}
                height={RASTER.h}
                className="pointer-events-none absolute"
                style={{ ...caixa, imageRendering: "pixelated", display: mostrarSobra ? undefined : "none" }}
              />
              <canvas
                ref={correcao}
                width={RASTER.w}
                height={RASTER.h}
                className="pointer-events-none absolute opacity-45"
                style={{ ...caixa, imageRendering: "pixelated" }}
              />
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={desfazer}
              className="rounded border border-zinc-300 bg-white px-2 py-1"
            >
              desfazer
            </button>
            <button
              type="button"
              onClick={limpar}
              className="rounded border border-zinc-300 bg-white px-2 py-1"
            >
              limpar
            </button>
            <button
              type="button"
              onClick={() => setPan({ x: 0, y: 0 })}
              className="rounded border border-zinc-300 bg-white px-2 py-1"
            >
              centralizar
            </button>
            <button
              type="button"
              onClick={() => void tracar(true)}
              disabled={ocupado}
              className="rounded border border-emerald-700 bg-emerald-700 px-3 py-1 font-semibold text-white disabled:opacity-40"
            >
              salvar na arte
            </button>
            <span className="tabular-nums text-zinc-500">
              +{mao.escondeu.toLocaleString("pt-BR")} escondidos / −
              {mao.mostrou.toLocaleString("pt-BR")} mostrados
            </span>
            {ocupado && <span className="text-zinc-400">traçando…</span>}
          </div>

          {/* O QUE SOBRA, EM NÚMERO — e partido por LADO, que é o que faltava.
              A régua contava só a primeira linha desta tabela; a segunda é o balde
              que ela nunca leu, e é 139× maior somada nos 171 pares. */}
          {mostrarSobra && sobra && (
            <div className="mt-1.5 rounded border border-zinc-200 bg-white px-2 py-1.5">
              <table className="w-full text-[11px] tabular-nums">
                <thead className="text-zinc-400">
                  <tr>
                    <th className="text-left font-normal">o que sobra de {cabeloDeProva}</th>
                    <th className="w-16 text-right font-normal">esquerda</th>
                    <th className="w-16 text-right font-normal">direita</th>
                    <th className="w-14 text-right font-normal">da peça</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(ZONAS) as Zona[]).map((z) => {
                    const [e, dt] = sobra.zonas[z];
                    const cor = `rgb(${ZONAS[z].cor.join(",")})`;
                    return (
                      <tr key={z} className={e + dt === 0 ? "text-zinc-300" : "text-zinc-700"}>
                        <td className="py-px">
                          <span
                            className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle"
                            style={{ background: cor }}
                          />
                          <span title={ZONAS[z].ajuda}>{ZONAS[z].nome}</span>
                        </td>
                        <td className="text-right">{e.toLocaleString("pt-BR")}</td>
                        <td className="text-right">{dt.toLocaleString("pt-BR")}</td>
                        <td className="text-right">
                          {sobra.massa ? (((e + dt) / sobra.massa) * 100).toFixed(1) : "0.0"}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-1 text-[10px] leading-snug text-zinc-400">
                esquerda é a de <b>quem olha</b>. A linha <b>ao lado, no alto</b> é cabelo mais largo
                que o chapéu — é o que a régua do par não via, e o que o pincel{" "}
                <b>esconder</b> come.
              </p>
            </div>
          )}

          {aviso && (
            <p className="mt-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
              {aviso}
            </p>
          )}
          {!d && !aviso && (
            <p className="mt-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800">
              este chapéu está <b>sem linha de oclusão</b> — o que aparece aí não tem corte nenhum.
            </p>
          )}
        </div>

        {/* OS 19, EM TAMANHO REAL --------------------------------------- */}
        <div className="min-w-[300px] flex-1">
          <div className="mb-1.5 text-xs text-zinc-500">
            os {CABELOS_TONAIS.length} a <b>56 px</b> — o tamanho do ranking, que é o que manda.
            Clique para levar um à mesa.
          </div>
          <div className="flex flex-wrap gap-1">
            {CABELOS_TONAIS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCabeloDeProva(c)}
                title={c}
                className={`rounded border bg-[#FBF8F5] p-0.5 ${
                  cabeloDeProva === c ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                }`}
              >
                <Boneco
                  modelo={c}
                  chapeu={pecaEmEdicao}
                  h={56}
                  ns={`s${c}`}
                  aperto={c === cabeloDeProva ? aperto : apertoGravado(c)}
                />
              </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            <b>{cabeloDeProva}</b> a 150 px — o tamanho do perfil
          </div>
          <div className="mt-1 inline-block rounded border border-zinc-200 bg-[#FBF8F5] p-1">
            <Boneco modelo={cabeloDeProva} chapeu={pecaEmEdicao} h={150} ns="grande" aperto={aperto} />
          </div>

          <p className="mt-2 max-w-[380px] text-[11px] leading-snug text-zinc-400">
            A lupa diz <i>onde está o defeito</i>; só o tamanho real diz <i>se alguém vê</i>. Uma
            janela ampliada engana nos dois sentidos — mostra como grave um degrau de 2 px, e
            esconde que uma reta de 19 px atravessa a silhueta inteira.
          </p>

          {/* A TABELA — uma célula por par, e ela é o que vira catálogo.
              Clicar numa célula leva o par para a mesa: a tabela é navegação e
              registro ao mesmo tempo, e é por isso que ela não é um arquivo à parte
              que alguém teria de manter em fase com a tela. */}
          <div className="mt-4">
            <div className="mb-1 flex items-baseline gap-2 text-xs">
              <b className="text-zinc-700">o aperto de cada par</b>
              <span className="text-zinc-400">
                {Object.keys(tabela).length} de {SLUGS.length * CABELOS_TONAIS.length} decididos ·
                <b> — = ninguém olhou</b>, e o <code>verify:arte</code> reprova · clique para levar à mesa
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-0 text-[10px] tabular-nums">
                <thead>
                  <tr className="text-zinc-400">
                    <th className="sticky left-0 z-10 bg-white pr-1 text-left font-normal">chapéu</th>
                    {CABELOS_TONAIS.map((c) => (
                      <th
                        key={c}
                        title={c}
                        className="h-16 w-6 whitespace-nowrap px-0 font-normal align-bottom"
                      >
                        <span className="block origin-bottom-left translate-x-3 -rotate-90 text-left">
                          {c}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLUGS.map((sl) => (
                    <tr key={sl}>
                      <th className="sticky left-0 z-10 bg-white pr-1 text-left font-normal text-zinc-600">
                        {CHAPEUS[sl].nome}
                      </th>
                      {CABELOS_TONAIS.map((c) => {
                        const v = tabela[chaveDoPar(sl, c)];
                        const naMesa = sl === slug && c === cabeloDeProva;
                        return (
                          <td key={c} className="p-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSlug(sl);
                                setCabeloDeProva(c);
                              }}
                              title={`${c} + ${sl.replace("chapeu-", "")}`}
                              className={`h-5 w-6 border text-[10px] ${
                                naMesa
                                  ? "border-zinc-900 bg-zinc-900 font-semibold text-white"
                                  : v === undefined
                                    ? "border-amber-300 bg-amber-50 text-amber-700"
                                    : v === 1
                                      ? "border-zinc-200 bg-white text-zinc-500"
                                      : "border-zinc-200 bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {v === undefined ? "—" : v === 1 ? "1,0" : v.toFixed(2).slice(1).replace(".", ",")}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-zinc-400">
              Gravado em <code>scripts/avatar/arte/aperto.json</code>. Apagar o arquivo devolve
              tudo a 1,00 — é entrada da esteira, como a correção de oclusão.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
