import { PATENTES } from "../../../scripts/avatar/patentes";
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
            <Badge>Aprendiz</Badge>
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
