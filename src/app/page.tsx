"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ────────────────────────────────────────────
   SVG Icons for method cards
   ──────────────────────────────────────────── */
function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconSwords({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2-2" />
      <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" /><path d="M11 19l-6-6" /><path d="M8 16l-4 4" /><path d="M5 21l-2-2" />
    </svg>
  );
}
function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8" /><path d="M8 11h6" />
    </svg>
  );
}
function IconCrown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" /><path d="M4 17l2-12 4 5 2-6 2 6 4-5 2 12" />
    </svg>
  );
}
function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
    </svg>
  );
}

/* ────────────────────────────────────────────
   Data
   ──────────────────────────────────────────── */
const methodFeatures = [
  {
    icon: IconTarget,
    title: "Missões Diárias",
    description: "Ordens do dia que mantêm seu progresso constante. Pequenas conquistas que se acumulam em grandes vitórias.",
  },
  {
    icon: IconSwords,
    title: "Duelos com Bots",
    description: "Enfrente adversários calibrados ao seu nível. Cada bot é um novo desafio, do Peão Preguiçoso ao Rei Implacável.",
  },
  {
    icon: IconBook,
    title: "Trilhas de Formação",
    description: "Conteúdo organizado em treinamentos progressivos. Aprenda tática, estratégia e finais de forma estruturada.",
  },
  {
    icon: IconCrown,
    title: "Sistema de Patentes",
    description: "Evolua de Recruta a Mestre. Cada patente desbloqueia novos desafios, bots e reconhecimento.",
  },
];

const journeyStages = [
  {
    num: "01",
    badge: "Fase Inicial",
    name: "Acampamento dos Recrutas",
    description: "Seu ponto de partida. Aprenda os fundamentos, conheça as peças e dê seus primeiros passos no tabuleiro.",
  },
  {
    num: "02",
    badge: "Tática Básica",
    name: "Vila dos Soldados",
    description: "Domine táticas básicas, enfrente os primeiros bots e conquiste suas primeiras vitórias.",
  },
  {
    num: "03",
    badge: "Estratégia",
    name: "Fortaleza dos Estrategistas",
    description: "Aprenda aberturas, meio-jogo e estratégias mais elaboradas. Os desafios se intensificam.",
  },
  {
    num: "04",
    badge: "Comando",
    name: "Cidade dos Generais",
    description: "Domine finais, cálculos avançados e preparação para competição. Lidere o campo de batalha.",
  },
  {
    num: "05",
    badge: "Maestria",
    name: "Cidadela dos Mestres",
    description: "O topo da campanha. Refinamento máximo, desafios de elite e o prestígio de quem domina o tabuleiro.",
  },
];

/* ────────────────────────────────────────────
   Landing Page
   ──────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen">
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-deep-navy/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-heading text-xl font-bold tracking-wide text-brand-cyan">
            CdxGuabiruba
          </Link>

          <div className="hidden items-center gap-8 sm:flex">
            <a href="#metodo" className="font-sans text-sm font-medium text-white/70 transition-colors hover:text-white">
              O Método
            </a>
            <a href="#jornada" className="font-sans text-sm font-medium text-white/70 transition-colors hover:text-white">
              A Jornada
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-gold px-5 py-2 font-sans text-sm font-semibold text-deep-navy transition-all hover:bg-gold-light hover:shadow-glow-gold"
            >
              Entrar
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-lg bg-gold px-4 py-2 font-sans text-sm font-semibold text-deep-navy sm:hidden"
          >
            Entrar
          </Link>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Hero background — video on desktop, static image on mobile */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/hero-camp.png"
          className="absolute inset-0 hidden h-full w-full object-cover sm:block"
        >
          <source src="/images/hero-camp.mp4" type="video/mp4" />
        </video>
        <img
          src="/images/hero-camp-mobile.png"
          alt="Acampamento dos Recrutas — O Reino das 64 Casas"
          className="absolute inset-0 h-full w-full object-cover sm:hidden"
        />

        {/* Stronger overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(6,15,24,0.85) 0%, rgba(6,15,24,0.5) 40%, rgba(6,15,24,0.4) 70%, rgba(6,15,24,0.5) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
          <p className="mb-6 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Bem-vindo ao Reino das 64 Casas
          </p>

          <h1
            className="font-heading text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
          >
            <span className="text-white">Entre como recruta.</span>
            <br />
            <span className="text-white">Evolua como estrategista.</span>
            <br />
            <span className="text-gold">Torne-se mestre.</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl font-sans text-base leading-relaxed text-white/70 sm:text-lg"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
          >
            Uma jornada imersiva pelo xadrez. Do primeiro movimento ao
            xeque-mate vitorioso, guiado por uma campanha que transforma
            iniciantes em jogadores completos.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-8 py-3.5 font-sans font-semibold text-deep-navy shadow-sm transition-all hover:bg-gold-light hover:shadow-glow-gold sm:w-auto"
            >
              Começar minha campanha
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#metodo"
              className="w-full rounded-lg border border-white/25 px-8 py-3.5 font-sans font-medium text-white transition-all hover:border-white/50 hover:bg-white/5 sm:w-auto"
            >
              Conhecer o método
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/40">
            <path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ═══════════ O MÉTODO ═══════════ */}
      <section id="metodo" className="bg-warm-ivory py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5">
          {/* Section header */}
          <div className="mb-14 text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-gold/30" />
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Formação estratégica
              </span>
              <span className="h-px w-12 bg-gold/30" />
            </div>

            <h2 className="font-heading text-2xl font-bold text-slate-800 sm:text-3xl">
              Uma campanha de verdade.
            </h2>
            <p className="mt-2 font-heading text-xl text-gold/80 sm:text-2xl">
              Do treino à maestria.
            </p>

            <p className="mx-auto mt-6 max-w-2xl font-sans text-base leading-relaxed text-slate-500">
              Não é só um curso. É uma jornada completa com missões, recompensas
              e evolução real.
            </p>
          </div>

          {/* Feature cards 2x2 */}
          <div className="grid gap-5 sm:grid-cols-2">
            {methodFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gold/10 bg-warm-stone p-6 transition-all duration-200 hover:border-gold/25 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15">
                  <feature.icon className="h-5 w-5 text-gold" />
                </div>

                <h3 className="font-heading text-base font-semibold text-slate-800">
                  {feature.title}
                </h3>

                <p className="mt-2 font-sans text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ A JORNADA — Timeline ═══════════ */}
      <section id="jornada" className="bg-deep-navy py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5">
          {/* Header */}
          <div className="mb-16 text-center">
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              A Jornada
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-white sm:text-3xl">
              A Campanha do Jovem Recruta
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-sans text-base text-slate-400">
              Cinco regiões, dezenas de missões, uma evolução real. Cada fase
              prepara você para a próxima.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical connector line — desktop only */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gold/20 lg:block" />

            <div className="space-y-10 lg:space-y-16">
              {journeyStages.map((stage, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div key={stage.num} className="relative flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:gap-0">
                    {/* Mobile: number + card stacked */}
                    {/* Desktop: alternating left/right */}

                    {/* Left content (desktop) */}
                    <div className={`hidden w-1/2 lg:block ${isLeft ? "pr-12 text-right" : ""}`}>
                      {isLeft && (
                        <div className="rounded-xl border border-gold/10 bg-white/5 p-6 backdrop-blur-sm">
                          <span className="inline-block rounded-full border border-gold/20 px-3 py-0.5 font-sans text-[11px] font-medium text-gold">
                            {stage.badge}
                          </span>
                          <h3 className="mt-3 font-heading text-lg font-bold text-white">
                            {stage.name}
                          </h3>
                          <p className="mt-2 font-sans text-sm leading-relaxed text-slate-400">
                            {stage.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Center number circle */}
                    <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold font-sans text-sm font-bold text-deep-navy shadow-glow-gold lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                      {stage.num}
                    </div>

                    {/* Right content (desktop) */}
                    <div className={`hidden w-1/2 lg:block ${!isLeft ? "pl-12" : ""}`}>
                      {!isLeft && (
                        <div className="rounded-xl border border-gold/10 bg-white/5 p-6 backdrop-blur-sm">
                          <span className="inline-block rounded-full border border-gold/20 px-3 py-0.5 font-sans text-[11px] font-medium text-gold">
                            {stage.badge}
                          </span>
                          <h3 className="mt-3 font-heading text-lg font-bold text-white">
                            {stage.name}
                          </h3>
                          <p className="mt-2 font-sans text-sm leading-relaxed text-slate-400">
                            {stage.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mobile card (always shown on mobile, hidden on desktop) */}
                    <div className="ml-5 flex-1 lg:hidden">
                      <div className="rounded-xl border border-gold/10 bg-white/5 p-5 backdrop-blur-sm">
                        <span className="inline-block rounded-full border border-gold/20 px-3 py-0.5 font-sans text-[11px] font-medium text-gold">
                          {stage.badge}
                        </span>
                        <h3 className="mt-3 font-heading text-base font-bold text-white">
                          {stage.name}
                        </h3>
                        <p className="mt-2 font-sans text-sm leading-relaxed text-slate-400">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="bg-dark-base py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2
            className="font-heading text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}
          >
            Todo mestre já foi{" "}
            <span className="text-gold">recruta</span> um dia.
          </h2>

          <p className="mx-auto mt-5 max-w-lg font-sans text-base leading-relaxed text-slate-400">
            O tabuleiro está pronto. As peças esperam seu comando. Sua campanha
            no Reino das 64 Casas começa agora.
          </p>

          <Link
            href="/registro"
            className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-gold px-8 py-3.5 font-sans font-semibold text-deep-navy shadow-sm transition-all hover:bg-gold-light hover:shadow-glow-gold"
          >
            Começar minha campanha
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <p className="mt-4 font-sans text-sm text-slate-500">
            Grátis para começar. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-slate-800/50 bg-dark-base py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 sm:flex-row sm:justify-between">
          {/* Logo */}
          <div>
            <p className="font-heading text-sm font-semibold tracking-wide text-brand-cyan/80">
              CdxGuabiruba
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#metodo" className="font-sans text-sm text-slate-500 transition-colors hover:text-slate-300">
              O Método
            </a>
            <a href="#jornada" className="font-sans text-sm text-slate-500 transition-colors hover:text-slate-300">
              A Jornada
            </a>
            <Link href="/login" className="font-sans text-sm text-slate-500 transition-colors hover:text-slate-300">
              Entrar
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mx-auto mt-8 max-w-6xl border-t border-slate-800/40 px-5 pt-6 text-center">
          <p className="font-sans text-xs text-slate-600">
            2026 CdxGuabiruba &middot; Clube de Xadrez Guabiruba &middot; O
            Reino das 64 Casas
          </p>
        </div>
      </footer>
    </main>
  );
}
