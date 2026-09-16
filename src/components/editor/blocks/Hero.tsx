import type { PropMap } from "@/lib/editor/types";
import { str, bool, list, headingStyle, SiteLink, SmartImage, textVars } from "./_shared";

type P = { props: PropMap };

export function HeroGradient({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const accent = str(props, "accent", "#D4D4D8");
  const stats = list(props, "stats");
  const showStats = bool(props, "showStats");
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: bg, ...textVars(textColor) }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accent} 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, ${accent}55 0%, transparent 60%)`,
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-32 text-center">
        {bool(props, "showEyebrow", true) && str(props, "eyebrow") && (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[color:var(--tc-70)] mb-6 sm:mb-8">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: accent }}
            />
            {str(props, "eyebrow")}
          </div>
        )}
        <h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-[color:var(--tc)] leading-[1.05]"
          style={headingStyle}
        >
          {str(props, "title")}
        </h1>
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[color:var(--tc-60)] max-w-2xl mx-auto">
          {str(props, "subtitle")}
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SiteLink
            link={str(props, "ctaLink")}
            className="w-full sm:w-auto inline-flex items-center justify-center text-black font-medium px-6 py-3 rounded-full transition-transform hover:scale-105 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${accent}66, ${accent})`,
              boxShadow: `0 0 40px -8px ${accent}`,
            }}
          >
            {str(props, "cta")}
          </SiteLink>
          {bool(props, "showSecondaryCta", true) && str(props, "ctaSecondary") && (
            <SiteLink
              link={str(props, "ctaSecondaryLink")}
              className="w-full sm:w-auto inline-flex items-center justify-center text-[color:var(--tc-80)] hover:text-[color:var(--tc)] font-medium px-6 py-3 rounded-full border border-white/10 hover:border-white/30 transition-all cursor-pointer"
            >
              {str(props, "ctaSecondary")}
            </SiteLink>
          )}
        </div>
        {showStats && stats.length > 0 && (
          <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {stats.map((s) => (
              <div key={s._id} className="text-center">
                <div
                  className="text-3xl sm:text-4xl font-bold text-[color:var(--tc)]"
                  style={headingStyle}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-[color:var(--tc-50)]">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroSplit({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const accent = str(props, "accent", "#D4D4D8");
  const showImage = bool(props, "showImage", true);
  return (
    <section className="py-16 sm:py-24" style={{ background: bg, ...textVars(textColor) }}>
      <div
        className={`mx-auto max-w-6xl px-4 sm:px-6 grid gap-8 md:gap-12 items-center ${showImage ? "md:grid-cols-2" : "md:grid-cols-1 max-w-3xl text-center"}`}
      >
        <div>
          {bool(props, "showBadge") && str(props, "badge") && (
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white mb-4"
              style={{ background: `${accent}22`, border: `1px solid ${accent}55` }}
            >
              {str(props, "badge")}
            </div>
          )}
          <h1
            className="text-3xl sm:text-4xl md:text-6xl font-bold text-[color:var(--tc)] leading-tight"
            style={headingStyle}
          >
            {str(props, "title")}
          </h1>
          <p
            className={`mt-4 sm:mt-5 text-[color:var(--tc-60)] text-base sm:text-lg ${showImage ? "" : "mx-auto max-w-xl"}`}
          >
            {str(props, "subtitle")}
          </p>
          <div
            className={`mt-6 sm:mt-8 flex flex-wrap items-center gap-3 ${showImage ? "" : "justify-center"}`}
          >
            <SiteLink
              link={str(props, "ctaLink")}
              className="inline-flex items-center justify-center text-black font-medium px-6 py-3 rounded-full cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${accent}66, ${accent})` }}
            >
              {str(props, "cta")}
            </SiteLink>
            {bool(props, "showSecondaryCta") && str(props, "ctaSecondary") && (
              <SiteLink
                link={str(props, "ctaSecondaryLink")}
                className="inline-flex items-center justify-center text-[color:var(--tc-80)] hover:text-[color:var(--tc)] font-medium px-6 py-3 rounded-full border border-white/10 hover:border-white/30 transition-all cursor-pointer"
              >
                {str(props, "ctaSecondary")}
              </SiteLink>
            )}
          </div>
        </div>
        {showImage && (
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-white/10">
            <SmartImage value={str(props, "image")} />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6))" }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
