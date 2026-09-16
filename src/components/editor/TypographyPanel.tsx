import type { Typography } from "@/lib/editor/types";
import { FONTS, PAIRINGS, getFont, fontStack } from "@/lib/editor/typography";
import { Type } from "lucide-react";

interface Props {
  typography: Typography;
  onChange: (patch: Partial<Typography>) => void;
}

const WEIGHT_LABEL: Record<number, string> = {
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

export function TypographyPanel({ typography: t, onChange }: Props) {
  const headingWeights = getFont(t.headingFont)?.weights ?? [400, 700];
  const bodyWeights = getFont(t.bodyFont)?.weights ?? [400, 700];
  const activePairing = PAIRINGS.find((p) => p.heading === t.headingFont && p.body === t.bodyFont);

  return (
    <div className="p-4 space-y-6">
      {/* Live preview */}
      <div
        className="rounded-xl border border-white/10 bg-black p-5"
        style={{
          fontFamily: fontStack(t.bodyFont),
          fontWeight: t.bodyWeight,
          lineHeight: t.lineHeight,
          letterSpacing: `${t.letterSpacing}em`,
        }}
      >
        <div
          className="text-2xl text-white leading-tight"
          style={{ fontFamily: fontStack(t.headingFont), fontWeight: t.headingWeight }}
        >
          Design cinematográfico
        </div>
        <p className="mt-2 text-sm text-white/55">
          A raposa marrom salta sobre o cão preguiçoso enquanto o preview atualiza em tempo real.
        </p>
      </div>

      {/* Pairings */}
      <Group label="Combinações">
        <div className="grid grid-cols-2 gap-2">
          {PAIRINGS.map((p) => {
            const active = activePairing?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onChange({ headingFont: p.heading, bodyFont: p.body })}
                className={`text-left rounded-lg border px-3 py-2 transition-all ${
                  active
                    ? "border-foreground/40 bg-foreground/10"
                    : "border-white/10 hover:border-white/25 bg-white/[0.02]"
                }`}
              >
                <div
                  className="text-xs font-medium text-white truncate"
                  style={{ fontFamily: fontStack(p.heading) }}
                >
                  {p.label}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {p.heading} · {p.body}
                </div>
              </button>
            );
          })}
        </div>
      </Group>

      {/* Fonts */}
      <Group label="Fontes" icon>
        <FontSelect
          label="Títulos"
          value={t.headingFont}
          onChange={(v) => onChange({ headingFont: v })}
        />
        <WeightSelect
          label="Peso dos títulos"
          value={t.headingWeight}
          weights={headingWeights}
          onChange={(v) => onChange({ headingWeight: v })}
        />
        <FontSelect
          label="Corpo do texto"
          value={t.bodyFont}
          onChange={(v) => onChange({ bodyFont: v })}
        />
        <WeightSelect
          label="Peso do corpo"
          value={t.bodyWeight}
          weights={bodyWeights}
          onChange={(v) => onChange({ bodyWeight: v })}
        />
      </Group>

      {/* Rhythm */}
      <Group label="Ritmo">
        <Slider
          label="Tamanho base"
          value={t.baseSize}
          min={14}
          max={20}
          step={1}
          suffix="px"
          onChange={(v) => onChange({ baseSize: v })}
        />
        <Slider
          label="Altura da linha"
          value={t.lineHeight}
          min={1}
          max={2}
          step={0.05}
          onChange={(v) => onChange({ lineHeight: v })}
        />
        <Slider
          label="Espaçamento"
          value={t.letterSpacing}
          min={-0.05}
          max={0.1}
          step={0.005}
          suffix="em"
          onChange={(v) => onChange({ letterSpacing: v })}
        />
      </Group>
    </div>
  );
}

function Group({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon && <Type className="w-3 h-3" />}
        {label}
      </div>
      {children}
    </div>
  );
}

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground font-medium mb-1.5 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm bg-input/60 border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40 transition-all"
      >
        {FONTS.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name} — {catLabel(f.category)}
          </option>
        ))}
      </select>
    </label>
  );
}

function WeightSelect({
  label,
  value,
  weights,
  onChange,
}: {
  label: string;
  value: number;
  weights: number[];
  onChange: (v: number) => void;
}) {
  // Snap to nearest available weight if the current one isn't offered by the font.
  const effective = weights.includes(value)
    ? value
    : weights.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a));
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground font-medium mb-1.5 block">{label}</span>
      <select
        value={effective}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-sm bg-input/60 border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40 transition-all"
      >
        {weights.map((w) => (
          <option key={w} value={w}>
            {w} · {WEIGHT_LABEL[w] ?? w}
          </option>
        ))}
      </select>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        <span className="text-[11px] font-mono text-white/70">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground cursor-pointer"
      />
    </label>
  );
}

function catLabel(c: string) {
  return c === "sans-serif"
    ? "Sans"
    : c === "serif"
      ? "Serif"
      : c === "display"
        ? "Display"
        : "Mono";
}
