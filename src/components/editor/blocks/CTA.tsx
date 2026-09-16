import type { PropMap } from "@/lib/editor/types";
import { str, bool, headingStyle, SiteLink, textVars } from "./_shared";

type P = { props: PropMap };

export function CTABanner({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const accent = str(props, "accent", "#D4D4D8");
  return (
    <section
      className="py-16 sm:py-24 border-t border-white/5"
      style={{ background: bg, ...textVars(textColor) }}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-16 text-center border"
          style={{
            background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
            borderColor: `${accent}55`,
          }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(circle at 50% 100%, ${accent}, transparent 60%)`,
            }}
          />
          <h2
            className="relative text-2xl sm:text-3xl md:text-5xl font-bold text-[color:var(--tc)]"
            style={headingStyle}
          >
            {str(props, "title")}
          </h2>
          {bool(props, "showSubtitle") && str(props, "subtitle") && (
            <p className="relative mt-4 text-[color:var(--tc-70)] text-base sm:text-lg max-w-xl mx-auto">
              {str(props, "subtitle")}
            </p>
          )}
          <SiteLink
            link={str(props, "ctaLink")}
            className="relative mt-6 sm:mt-8 inline-flex items-center justify-center text-black font-medium px-8 py-3 rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${accent}66, ${accent})`,
              boxShadow: `0 0 40px -8px ${accent}`,
            }}
          >
            {str(props, "cta")}
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
