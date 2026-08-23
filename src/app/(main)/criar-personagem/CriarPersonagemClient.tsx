"use client";

/**
 * A MATRÍCULA — as três escolhas do avatar kokeshi.
 *
 * Substitui a tela do avatar v2, que oferecia macho/fêmea em dois PNGs e gravava
 * pela `update_avatar_base` (deprecada no Bloco C). Aqui a identidade é
 * **pele + cabelo + cor**, e quem grava é `update_avatar_identity`.
 *
 * O boneco fica em cima e os controles embaixo, em coluna única: em 375px o aluno
 * vê a criança inteira e o que está escolhendo sem rolar entre uma coisa e a
 * outra. O palco vive nesta tela e não dentro do editor — ver o docstring de
 * `EditorDeAparencia`.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import FaixaDeComando from "@/components/layout/FaixaDeComando";
import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import EditorDeAparencia, {
  type Aparencia,
  type PecaDoCatalogo,
  type SlotDaVitrine,
} from "@/components/avatar/EditorDeAparencia";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";

export default function CriarPersonagemClient({
  nivel,
  inicial,
  catalogoCabelo,
  catalogoTraje,
  catalogoRosto,
  trajeInicial,
  rostoInicial,
}: {
  nivel: number;
  inicial: Aparencia;
  /** `avatar_catalogo` do slot cabelo, com `possui` já resolvido no servidor. */
  catalogoCabelo: PecaDoCatalogo[];
  /** `avatar_catalogo` do slot traje, com `possui` já resolvido no servidor. */
  catalogoTraje: PecaDoCatalogo[];
  /** `avatar_catalogo` do slot rosto, com `possui` já resolvido no servidor. */
  catalogoRosto: PecaDoCatalogo[];
  /** `users.avatar_traje` — NULL na criação, que é o macacão de treino. */
  trajeInicial: string | null;
  /** `users.avatar_rosto` — NULL na criação. */
  rostoInicial: string | null;
}) {
  const router = useRouter();
  const [aparencia, setAparencia] = useState<Aparencia>(inicial);
  const [traje, setTraje] = useState<string | null>(trajeInicial);
  const [rosto, setRosto] = useState<string | null>(rostoInicial);

  /**
   * A criança veste o boneco NA CRIAÇÃO, e não só depois da primeira promoção.
   *
   * Duas RPCs em sequência, e elas são independentes de propósito: `equipar_peca`
   * grava na hora, `update_avatar_identity` no Confirmar. **Falha parcial não
   * deixa boneco errado, deixa boneco padrão** — se a peça não gravar, o aluno
   * fica sem ela, e "sem traje" e "careca" são estados legítimos.
   *
   * ⚠️ **O CABELO PASSOU A GRAVAR ANTES DO "CONFIRMAR"** em 2026-08-23, e isto é a
   * única mudança de comportamento desta tela. Antes ele subia junto com as cores,
   * no botão. Agora é peça de baú e veste como o traje — que já era assim desde o
   * B5. `avatar_chosen` continua com dono único: `update_avatar_identity`, no
   * Confirmar. Quem chega aqui, escolhe cabelo e vai embora sem confirmar volta a
   * cair nesta tela, agora com o cabelo já escolhido — que é o mesmo que já
   * acontecia com o traje.
   */
  async function trocarPeca(
    slot: SlotDaVitrine,
    slug: string | null,
  ): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.rpc("equipar_peca", { p_slot: slot, p_slug: slug });
    if (error) return `Não foi possível vestir essa peça. ${error.message}`;
    if (slot === "traje") setTraje(slug);
    else if (slot === "rosto") setRosto(slug);
    else setAparencia((a) => ({ ...a, hair: slug }));
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-ivory font-sans text-ink">
      {/*
        A saudação carrega o tom de embarque: é o momento em que o aluno entra
        na Academia, e a curva de tom da Bíblia §8 pede acolhimento aqui — tirar
        o medo antes de qualquer coisa. A segunda frase é a que faz isso: ela
        diz que nada aqui é definitivo.
      */}
      <FaixaDeComando
        supertitulo="Academia 64"
        titulo="Matrícula"
        saudacao="Sua aventura começa pelo espelho. Monte o seu boneco — dá para trocar quando quiser, no seu perfil."
      />

      <div className="mx-auto max-w-2xl px-5 py-6">
        {/* O palco. Marfim quente atrás do boneco: o contorno preto do kokeshi é
            arte de avatar e precisa de fundo claro — sobre o navy da faixa ele
            perderia a silhueta. */}
        <div className="grid place-items-center rounded-xl border border-ink/10 bg-warm-stone py-5">
          <AvatarKokeshi
            skin={aparencia.skin}
            hair={aparencia.hair}
            hairColor={aparencia.hairColor}
            traje={traje}
            rosto={rosto}
            altura={210}
            animado
            ns="palco"
            rotulo="Prévia do seu avatar"
          />
        </div>

        <Card className="mt-4 p-5">
          <EditorDeAparencia
            valor={aparencia}
            aoMudar={setAparencia}
            cabelos={catalogoCabelo}
            trajes={catalogoTraje}
            traje={traje}
            rostos={catalogoRosto}
            rosto={rosto}
            aoTrocarPeca={trocarPeca}
            nivel={nivel}
            rotuloAcao="Confirmar"
            aoSalvar={() => router.push("/dashboard")}
          />
        </Card>
      </div>
    </div>
  );
}
