"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AvatarOption = "male" | "female";

export default function CriarPersonagemClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<AvatarOption | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!selected || saving) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("update_avatar_base", {
      p_base: selected,
    });

    if (error) {
      setSaving(false);
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
