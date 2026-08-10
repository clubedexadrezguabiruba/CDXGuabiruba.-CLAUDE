"use client";

/**
 * A CRIAÇÃO DO RECRUTA — as três escolhas do avatar kokeshi.
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
  type CabeloDoCatalogo,
} from "@/components/avatar/EditorDeAparencia";
import Card from "@/components/ui/Card";

export default function CriarPersonagemClient({
  nivel,
  inicial,
  catalogo,
}: {
  nivel: number;
  inicial: Aparencia;
  catalogo: CabeloDoCatalogo[];
}) {
  const router = useRouter();
  const [aparencia, setAparencia] = useState<Aparencia>(inicial);

  return (
    <div className="min-h-screen bg-warm-ivory font-sans text-ink">
      <FaixaDeComando
        supertitulo="Reino das 64 Casas"
        titulo="Criação do Recruta"
        saudacao="Monte o seu boneco. Dá para trocar depois, no seu perfil."
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
            catalogo={catalogo}
            nivel={nivel}
            rotuloAcao="Confirmar"
            aoSalvar={() => router.push("/dashboard")}
          />
        </Card>
      </div>
    </div>
  );
}
