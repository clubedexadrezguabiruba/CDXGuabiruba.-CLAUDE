"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AvatarOption = "male" | "female";

export default function CriarPersonagemClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<AvatarOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected || saving) return;
    setSaving(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("update_avatar_base", {
      p_base: selected,
    });

    // O erro precisa aparecer. Antes este bloco só fazia setSaving(false) e
    // return: o aluno clicava em "Confirmar", nada acontecia, e não havia nem
    // mensagem nem log — o mesmo defeito que o commit 47fdf2c corrigiu em
    // equipar/desequipar. Sem isso, um gate de avatar que falha é
    // indistinguível de um botão que não responde.
    if (error) {
      setSaving(false);
      setErro(
        `Não foi possível salvar seu avatar. ${error.message} — tente novamente.`
      );
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">
        Criação do Recruta
      </h1>
      <p className="mb-8 text-center text-sm text-zinc-500">
        Escolha a aparência base do seu avatar.
      </p>

      <div className="mb-8 flex gap-6">
        <AvatarCard
          label="Masculino"
          src="/items/base/avatar-base-male.png"
          isSelected={selected === "male"}
          onClick={() => setSelected("male")}
        />
        <AvatarCard
          label="Feminino"
          src="/items/base/avatar-base-female.png"
          isSelected={selected === "female"}
          onClick={() => setSelected("female")}
        />
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selected || saving}
        className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Confirmar"}
      </button>

      {erro && (
        <p
          role="alert"
          className="mt-4 max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
        >
          {erro}
        </p>
      )}
    </div>
  );
}

function AvatarCard({
  label,
  src,
  isSelected,
  onClick,
}: {
  label: string;
  src: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? "border-emerald-500 bg-emerald-50 shadow-md"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex h-56 w-40 items-center justify-center overflow-hidden rounded-lg bg-zinc-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className="h-full w-full object-contain"
        />
      </div>
      <span
        className={`text-sm font-medium ${
          isSelected ? "text-emerald-700" : "text-zinc-600"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
