import type { ProjectState } from "@/lib/editor/types";
import { BASE_PLAN, FEATURES, formatBRL } from "@/lib/pricing/catalog";
import { calculatePrice, computeUsage } from "@/lib/pricing/calc";
import { Gauge, Sparkles } from "lucide-react";

interface Props {
  project: ProjectState;
  onToggleAddon: (key: string) => void;
}

export function PricingPanel({ project, onToggleAddon }: Props) {
  const usage = computeUsage(project);
  const breakdown = calculatePrice(project, project.billing.addons);
  const usageLines = breakdown.lines.filter(
    (l) => l.key === "pagina_extra" || l.key === "componente_premium",
  );
  const toggleFeatures = FEATURES.filter((f) => f.kind === "toggle");

  return (
    <div className="p-4 space-y-6">
      {/* Plan */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {BASE_PLAN.name}
        </div>
        <div className="text-sm font-semibold mt-0.5">{formatBRL(BASE_PLAN.priceCents)}/mês</div>
        <div className="text-xs text-muted-foreground mt-1">{BASE_PLAN.description}</div>
      </div>
      <div className="h-px bg-border" />

      {/* Auto-detected usage */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Gauge className="w-3 h-3" />
          Uso do projeto (automático)
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <UsageStat
            label="Páginas"
            value={`${usage.pages} / ${BASE_PLAN.limits.pages}`}
            over={usage.pages > BASE_PLAN.limits.pages}
          />
          <UsageStat
            label="Componentes premium"
            value={String(usage.premiumComponents)}
            over={usage.premiumComponents > 0}
          />
        </div>
        {usageLines.length > 0 ? (
          <div className="space-y-1.5">
            {usageLines.map((l) => (
              <PriceRow key={l.key} label={l.label} detail={l.detail} cents={l.totalCents} />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/70">
            Dentro do plano base — nenhuma cobrança extra por uso.
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Manual add-ons */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          Recursos adicionais
        </div>
        <div className="space-y-2">
          {toggleFeatures.map((f) => {
            const checked = !!project.billing.addons[f.key];
            return (
              <button
                key={f.key}
                onClick={() => onToggleAddon(f.key)}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-input/40 px-3 py-2.5 hover:border-white/20 transition-all text-left"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{f.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-white/70">
                    +{formatBRL(f.unitPriceCents)}
                  </span>
                  <span
                    className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-foreground" : "bg-white/15"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`}
                    />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Total */}
      <div className="rounded-xl border border-foreground/20 bg-foreground/5 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total estimado</span>
          <span className="text-lg font-semibold font-display">
            {formatBRL(breakdown.totalCents)}/mês
          </span>
        </div>
      </div>
    </div>
  );
}

function UsageStat({ label, value, over }: { label: string; value: string; over: boolean }) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 ${over ? "border-foreground/25 bg-foreground/5" : "border-white/10 bg-white/[0.02]"}`}
    >
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function PriceRow({ label, detail, cents }: { label: string; detail: string; cents: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="min-w-0">
        <div className="text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{detail}</div>
      </div>
      <div className="font-mono text-white/80 shrink-0">+{formatBRL(cents)}</div>
    </div>
  );
}
