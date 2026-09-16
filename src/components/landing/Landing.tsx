import { Link } from "@tanstack/react-router";
import { LayoutTemplate, MousePointerClick, CloudUpload, Code2, ArrowRight } from "lucide-react";
import { AedonMark } from "@/components/editor/AedonMark";
import { BASE_PLAN, FEATURES, formatBRL } from "@/lib/pricing/catalog";

const STEPS = [
  {
    icon: LayoutTemplate,
    title: "Escolha as seções",
    body: "Navegue por uma biblioteca de seções prontas — hero, features, depoimentos, preços, FAQ — cada uma com variações visuais.",
  },
  {
    icon: MousePointerClick,
    title: "Monte e ajuste",
    body: "Arraste para reordenar, edite textos direto no lugar e ajuste cores, tipografia e imagens pelo painel de propriedades.",
  },
  {
    icon: CloudUpload,
    title: "Publique",
    body: "Seu projeto fica salvo na nuvem automaticamente. Quando estiver pronto, publique ou exporte o HTML.",
  },
];

const FEATURE_LIST = [
  "Editor visual com preview em tempo real, sem escrever código",
  "Múltiplas páginas por projeto, com navegação entre elas",
  "Biblioteca de seções e componentes reutilizáveis",
  "Tipografia e paleta de cores configuráveis por projeto",
  "Sincronização automática na nuvem — retome de onde parou",
  "Exportação do HTML gerado a qualquer momento",
];

export function Landing() {
  const extraFeatures = FEATURES.filter((f) => f.kind === "toggle").slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="mx-auto max-w-5xl h-16 px-6 flex items-center justify-between">
          <div className="group flex items-center gap-2.5">
            <AedonMark className="w-5 h-5 text-foreground transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="text-sm font-medium tracking-[0.2em]">AEDON</span>
          </div>
          <Link
            to="/build"
            className="h-9 px-4 rounded-full text-sm font-medium bg-primary text-primary-foreground flex items-center transition-transform duration-200 hover:bg-primary/90 hover:-translate-y-px active:translate-y-0"
          >
            Abrir editor
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 border-b border-border overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 60% at 30% 20%, black, transparent)",
          }}
        />
        <div className="relative max-w-2xl">
          <p className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-5">
            Construtor visual de sites
          </p>
          <h1 className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both text-4xl sm:text-5xl font-display font-medium leading-[1.1] tracking-tight">
            Monte um site inteiro combinando seções, sem escrever código.
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200 fill-mode-both mt-6 text-base text-muted-foreground leading-relaxed max-w-lg">
            Aedon é um editor de sites baseado em componentes: você escolhe seções prontas,
            ajusta texto, cores e tipografia, e publica — tudo com preview em tempo real.
          </p>
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both mt-9 flex items-center gap-4">
            <Link
              to="/build"
              className="group h-11 px-6 rounded-full text-sm font-medium bg-primary text-primary-foreground flex items-center gap-2 transition-transform duration-200 hover:bg-primary/90 hover:-translate-y-px active:translate-y-0"
            >
              Começar a construir
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#como-funciona"
              className="h-11 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              Como funciona
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="mx-auto max-w-5xl px-6 py-20 border-b border-border">
        <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-10">
          Como funciona
        </h2>
        <div className="grid sm:grid-cols-3 gap-10">
          {STEPS.map((step) => (
            <div key={step.title} className="group">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono text-muted-foreground">
                  {String(STEPS.indexOf(step) + 1).padStart(2, "0")}
                </span>
                <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center transition-colors duration-200 group-hover:border-foreground/40 group-hover:bg-foreground/5">
                  <step.icon className="w-4 h-4 text-foreground" />
                </div>
              </div>
              <h3 className="text-sm font-medium mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20 border-b border-border grid sm:grid-cols-2 gap-x-16 gap-y-12">
        <div>
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
            O que vem incluído
          </h2>
          <ul className="space-y-3">
            {FEATURE_LIST.map((f) => (
              <li
                key={f}
                className="group text-sm text-foreground/90 leading-relaxed pl-4 relative"
              >
                <span className="absolute left-0 top-[0.6em] w-1.5 h-px bg-foreground/40 transition-all duration-200 group-hover:w-2.5 group-hover:bg-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
            Exportação sem trava
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O site que você monta no Aedon não fica preso ao editor. A qualquer momento, exporte
            o HTML da página atual e leve para onde quiser hospedar.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2.5 w-fit transition-colors duration-200 hover:border-foreground/30 hover:text-foreground">
            <Code2 className="w-3.5 h-3.5" />
            Exportar HTML — disponível direto no editor
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-5xl px-6 py-20 border-b border-border">
        <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-10">
          Preço
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-medium">
                {formatBRL(BASE_PLAN.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {BASE_PLAN.description} Adicione páginas, componentes premium e recursos como
              domínio próprio ou analytics sob demanda.
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground shrink-0">
            {extraFeatures.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-6">
                <span>{f.label}</span>
                <span className="font-mono text-xs">+{formatBRL(f.unitPriceCents)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-medium tracking-tight">
          Comece com uma página em branco.
        </h2>
        <Link
          to="/build"
          className="group mt-8 inline-flex h-11 px-6 rounded-full text-sm font-medium bg-primary text-primary-foreground items-center gap-2 transition-transform duration-200 hover:bg-primary/90 hover:-translate-y-px active:translate-y-0"
        >
          Abrir o editor
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between text-xs text-muted-foreground">
          <span>AEDON</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
