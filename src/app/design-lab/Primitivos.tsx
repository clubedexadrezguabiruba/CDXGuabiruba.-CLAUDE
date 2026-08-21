import { PATENTES } from "../../../scripts/avatar/patentes";
import { AvatarCabeca } from "@/components/avatar/AvatarCabeca";
import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import MolduraPatente from "@/components/avatar/MolduraPatente";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

/**
 * A folha de estados dos primitivos.
 *
 * Existe para o estado ser visto, não descrito. Foco e disabled são os que mais
 * escapam: o app tinha foco visível em 7 de 40 arquivos, e ninguém percebeu
 * porque ninguém navegou de teclado.
 */
export default function Primitivos() {
  return (
    <div className="min-h-full space-y-4 bg-warm-ivory p-4 font-sans text-ink">
      <Card>
        <CardTitle>Button</CardTitle>
        <div className="space-y-3">
          {(["primary", "secondary", "ghost"] as const).map((v) => (
            <div key={v} className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wide text-ink/45">{v}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={v}>Continuar</Button>
                <Button variant={v} disabled>
                  Desativado
                </Button>
              </div>
            </div>
          ))}
          <p className="pt-1 text-xs text-ink/55">
            Foco: navegue de Tab — o anel é ouro sobre marfim, e vem de graça em
            todo botão.
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>Badge</CardTitle>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>Calouro</Badge>
            <Badge tone="ouro">Novo</Badge>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink/45">
              a escada, importada da régua
            </p>
            <div className="flex flex-wrap gap-2">
              {PATENTES.map((p) => (
                <Badge key={p.patente} patente={p.patente}>
                  {p.patente}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>MolduraPatente</CardTitle>
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wide text-ink/45">
            os 7 degraus nos dois tamanhos de lista — 32 px e 40 px
          </p>
          {/*
            A tira existe para o Doug julgar o anel a olho, nos tamanhos em que ele
            de fato aparece. É a parada do bloco B3, e ela pede as duas coisas que
            número nenhum responde: o Calouro lê como "sem título" em vez de "erro"?
            E o anel do Mestre, que é prata clara, sobrevive ao marfim do card?

            O boneco é o mesmo em todos — o assunto aqui é a moldura, e trocar o
            cabelo de degrau para degrau daria a impressão de que o título veste.
          */}
          {([32, 40] as const).map((lado) => (
            <div key={lado} className="space-y-1.5">
              <p className="text-[11px] tabular-nums text-ink/45">{lado} px</p>
              <div className="flex flex-wrap items-end gap-3">
                {[0, ...PATENTES.map((p) => p.tier)].map((tier) => (
                  <div key={tier} className="space-y-1 text-center">
                    <MolduraPatente tier={tier}>
                      <AvatarCabeca skin={2} hair="chanel" hairColor={0} lado={lado} ns={`ml-${lado}-${tier}`} />
                    </MolduraPatente>
                    <p className="text-[10px] text-ink/45">
                      {PATENTES.find((p) => p.tier === tier)?.patente ?? "Calouro"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-1.5">
            <p className="text-[11px] tabular-nums text-ink/45">
              104 px, espessura 3 — o palco do perfil público
            </p>
            <div className="flex flex-wrap items-end gap-3">
              {[0, 1, 6].map((tier) => (
                <MolduraPatente key={tier} tier={tier} espessura={3}>
                  <span className="grid place-items-center bg-warm-stone px-2 py-2">
                    <AvatarKokeshi skin={2} hair="chanel" hairColor={0} altura={104} ns={`mlp-${tier}`} />
                  </span>
                </MolduraPatente>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>ProgressBar</CardTitle>
        <div className="space-y-3">
          {([0, 37, 100] as const).map((v) => (
            <div key={v} className="space-y-1">
              <p className="text-[11px] tabular-nums text-ink/45">navy · {v}%</p>
              <ProgressBar valor={v} total={100} rotulo={`Exemplo ${v}%`} />
            </div>
          ))}
          <div className="space-y-1 rounded-lg bg-deep-navy p-3">
            <p className="text-[11px] text-warm-ivory/55">ouro, sobre navy · 68%</p>
            <ProgressBar valor={68} total={100} tone="gold" rotulo="Exemplo ouro" />
          </div>
        </div>
      </Card>

      <Card className="rounded-xl p-5">
        <CardTitle>Card</CardTitle>
        <p className="text-sm text-ink/70">
          Fio de 1px, sem sombra, cantos de 8px. Este bloco usa a variação de
          seção: `rounded-xl p-5`.
        </p>
      </Card>
    </div>
  );
}
