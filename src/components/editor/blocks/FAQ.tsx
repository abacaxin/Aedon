import type { PropMap } from "@/lib/editor/types";
import { str, list, headingStyle, textVars } from "./_shared";

type P = { props: PropMap };

export function FAQAccordion({ props }: P) {
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
          className="text-2xl sm:text-3xl md:text-5xl font-bold text-[color:var(--tc)] text-center mb-10 sm:mb-12"
          style={headingStyle}
        >
          {str(props, "title")}
        </h2>
        <div className="space-y-3">
          {items.map((it) => (
            <details
              key={it._id}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[color:var(--tc)] font-medium">
                <span className="min-w-0">{it.q}</span>
                <span
                  className="text-xl leading-none shrink-0 transition-transform group-open:rotate-45"
                  style={{ color: accent }}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[color:var(--tc-60)] text-sm leading-relaxed">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
