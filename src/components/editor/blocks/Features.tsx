import {
  Zap,
  Shield,
  Rocket,
  Sparkles,
  Star,
  Heart,
  Gauge,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { PropMap } from "@/lib/editor/types";
import { str, list, headingStyle, textVars } from "./_shared";

type P = { props: PropMap };

const ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  shield: Shield,
  rocket: Rocket,
  sparkles: Sparkles,
  star: Star,
  heart: Heart,
  gauge: Gauge,
  lock: Lock,
};

const COLS: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 md:grid-cols-3",
  "4": "sm:grid-cols-2 md:grid-cols-4",
};

export function FeaturesGrid({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const accent = str(props, "accent", "#D4D4D8");
  const items = list(props, "items");
  const cols = COLS[str(props, "columns", "3")] ?? COLS["3"];
  return (
    <section
      className="py-16 sm:py-24 border-t border-white/5"
      style={{ background: bg, ...textVars(textColor) }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl md:text-5xl font-bold text-[color:var(--tc)] text-center mb-10 sm:mb-16"
          style={headingStyle}
        >
          {str(props, "title")}
        </h2>
        <div className={`grid gap-4 sm:gap-6 ${cols}`}>
          {items.map((it) => {
            const Icon = ICONS[it.icon] ?? Sparkles;
            return (
              <div
                key={it._id}
                className="group p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent transition-all"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `linear-gradient(135deg, ${accent}55, ${accent})` }}
                >
                  <Icon className="w-5 h-5 text-black" />
                </div>
                <h3 className="font-semibold text-[color:var(--tc)] text-lg" style={headingStyle}>
                  {it.title}
                </h3>
                <p className="mt-2 text-[color:var(--tc-60)] text-sm leading-relaxed">{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FeaturesList({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const accent = str(props, "accent", "#D4D4D8");
  const items = list(props, "items");
  return (
    <section
      className="py-16 sm:py-24 border-t border-white/5"
      style={{ background: bg, ...textVars(textColor) }}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-[color:var(--tc)] mb-8 sm:mb-10"
          style={headingStyle}
        >
          {str(props, "title")}
        </h2>
        <ul className="space-y-3 sm:space-y-4">
          {items.map((it) => (
            <li
              key={it._id}
              className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]"
            >
              <div
                className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
              />
              <span className="text-[color:var(--tc-90)]">{it.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
