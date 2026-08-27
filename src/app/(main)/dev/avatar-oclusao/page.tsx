/**
 * A página do editor de oclusão. Só de desenvolvimento — a rota que ela usa
 * (`/api/dev/oclusao`) devolve 404 fora do `next dev`, então em produção esta tela
 * abre e não consegue fazer nada.
 */
import OclusaoClient from "./OclusaoClient";

export const metadata = { title: "Oclusão do chapéu — dev" };

export default function Page() {
  return <OclusaoClient />;
}
