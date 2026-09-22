import type { PropMap } from "@/lib/editor/types";
import { str, headingStyle, textVars } from "./_shared";

type P = { props: PropMap };

export function TextManifesto({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  return (
    <section className="py-20 sm:py-32" style={{ background: bg, ...textVars(textColor) }}>
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        {str(props, "eyebrow") && (
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--tc-60)]">
            {str(props, "eyebrow")}
          </p>
        )}
        <h2 className="text-4xl font-bold leading-[0.98] text-[color:var(--tc)] sm:text-6xl md:text-7xl" style={headingStyle}>
          {str(props, "title")}
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[color:var(--tc-70)] sm:text-lg">
          {str(props, "body")}
        </p>
      </div>
    </section>
  );
}

export function TextEditorial({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  return (
    <section className="border-y border-white/5 py-16 sm:py-24" style={{ background: bg, ...textVars(textColor) }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--tc-60)]">{str(props, "eyebrow")}</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight text-[color:var(--tc)] sm:text-5xl" style={headingStyle}>
            {str(props, "title")}
          </h2>
        </div>
        <div className="border-l border-white/10 pl-5 sm:pl-8">
          <p className="text-base leading-8 text-[color:var(--tc-80)] sm:text-lg">{str(props, "body")}</p>
          {str(props, "caption") && <p className="mt-6 text-sm text-[color:var(--tc-50)]">{str(props, "caption")}</p>}
        </div>
      </div>
    </section>
  );
}

export function TextQuote({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  return (
    <section className="py-16 sm:py-24" style={{ background: bg, ...textVars(textColor) }}>
      <figure className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span className="text-6xl leading-none text-[color:var(--tc-40)]" aria-hidden>“</span>
        <blockquote className="mt-1 text-3xl font-semibold leading-tight text-[color:var(--tc)] sm:text-5xl" style={headingStyle}>
          {str(props, "quote")}
        </blockquote>
        <figcaption className="mt-7 text-sm text-[color:var(--tc-60)]">{str(props, "author")}</figcaption>
      </figure>
    </section>
  );
}
