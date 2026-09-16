import type { PropMap } from "@/lib/editor/types";
import { str, bool, list, headingStyle, SiteLink, textVars } from "./_shared";

type P = { props: PropMap };

export function NavbarModern({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const accent = str(props, "accent", "#D4D4D8");
  const links = list(props, "links");
  return (
    <header
      className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/5"
      style={{ background: `color-mix(in oklab, ${bg} 70%, transparent)`, ...textVars(textColor) }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div
          className="font-bold tracking-tight text-[color:var(--tc)] text-base sm:text-lg truncate"
          style={headingStyle}
        >
          {str(props, "brand")}
        </div>
        {links.length > 0 && (
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-[color:var(--tc-70)]">
            {links.map((l) => (
              <SiteLink
                key={l._id}
                link={l.link}
                className="hover:text-[color:var(--tc)] transition-colors cursor-pointer"
              >
                {l.label}
              </SiteLink>
            ))}
          </nav>
        )}
        {bool(props, "showCta", true) && (
          <SiteLink
            link={str(props, "ctaLink")}
            className="shrink-0 inline-flex items-center text-sm font-medium text-black px-3 sm:px-4 py-2 rounded-full transition-all cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${accent}88, ${accent})` }}
          >
            {str(props, "ctaText")}
          </SiteLink>
        )}
      </div>
    </header>
  );
}

export function NavbarMinimal({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  return (
    <header className="border-b border-white/5" style={{ background: bg, ...textVars(textColor) }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="font-semibold text-[color:var(--tc)] truncate" style={headingStyle}>
          {str(props, "brand")}
        </div>
        <SiteLink
          link={str(props, "ctaLink")}
          className="text-sm text-[color:var(--tc-70)] hover:text-[color:var(--tc)] transition-colors shrink-0 cursor-pointer"
        >
          {str(props, "ctaText")}
        </SiteLink>
      </div>
    </header>
  );
}
