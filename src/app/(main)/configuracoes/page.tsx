"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { soundManager } from "@/lib/sounds/soundManager";

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-zinc-800">{label}</div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-green-600" : "bg-zinc-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { profile, loading } = useUser();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [premoveEnabled, setPremoveEnabled] = useState(true);
  const [autoQueen, setAutoQueen] = useState(true);
  const [rankingVisible, setRankingVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sync local state with profile on load
  useEffect(() => {
    if (profile) {
      setSoundEnabled(!profile.sound_muted);
      setPremoveEnabled(profile.premove_enabled);
      setAutoQueen(profile.auto_queen);
      setRankingVisible(profile.ranking_visible);
    }
  }, [profile]);

  async function updatePreference(field: string, value: boolean) {
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("users")
        .update({ [field]: value })
        .eq("id", profile.id);
    } catch (e) {
      console.error("Erro ao salvar preferência:", e);
    } finally {
      setSaving(false);
    }
  }

  function handleSoundToggle(enabled: boolean) {
    setSoundEnabled(enabled);
    soundManager.setMuted(!enabled);
    updatePreference("sound_muted", !enabled);
  }

  function handlePremoveToggle(enabled: boolean) {
    setPremoveEnabled(enabled);
    updatePreference("premove_enabled", enabled);
  }

  function handleAutoQueenToggle(enabled: boolean) {
    setAutoQueen(enabled);
    updatePreference("auto_queen", enabled);
  }

  function handleRankingToggle(enabled: boolean) {
    setRankingVisible(enabled);
    updatePreference("ranking_visible", enabled);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center text-sm text-zinc-400">Carregando...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center text-sm text-zinc-400">
          Faça login para acessar as configurações.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-zinc-900">Configurações</h1>

      <div className="space-y-3">
        <Toggle
          label="Som"
          description="Sons de movimento, captura e check"
          checked={soundEnabled}
          onChange={handleSoundToggle}
          disabled={saving}
        />

        <Toggle
          label="Pre-move"
          description="Permite definir o próximo lance durante a vez do oponente"
          checked={premoveEnabled}
          onChange={handlePremoveToggle}
          disabled={saving}
        />

        <Toggle
          label="Dama automática"
          description="Promoção sempre para dama, sem perguntar (essencial para pre-moves)"
          checked={autoQueen}
          onChange={handleAutoQueenToggle}
          disabled={saving}
        />

        <Toggle
          label="Visibilidade no Quadro de Honra"
          description="Aparecer nos rankings globais. Professor sempre vê você no ranking da turma."
          checked={rankingVisible}
          onChange={handleRankingToggle}
          disabled={saving}
        />
      </div>
    </div>
  );
}
