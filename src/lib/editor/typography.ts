import type { Typography } from "./types";

export interface FontDef {
  /** Family name as used in CSS and in the Google Fonts API. */
  name: string;
  /** Generic fallback appended to the CSS stack. */
  category: "sans-serif" | "serif" | "display" | "monospace";
  /** Weights we request from Google Fonts. */
  weights: number[];
  /** true for the system fonts that don't need a Google Fonts request. */
  system?: boolean;
}

export const FONTS: FontDef[] = [
  { name: "Inter Tight", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  { name: "Inter", category: "sans-serif", weights: [400, 500, 600, 700] },
  { name: "Space Grotesk", category: "sans-serif", weights: [400, 500, 600, 700] },
  { name: "Sora", category: "sans-serif", weights: [400, 600, 700, 800] },
  { name: "Plus Jakarta Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  { name: "Manrope", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  { name: "Poppins", category: "sans-serif", weights: [400, 500, 600, 700] },
  { name: "Montserrat", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  { name: "DM Sans", category: "sans-serif", weights: [400, 500, 700] },
  { name: "Outfit", category: "sans-serif", weights: [400, 500, 600, 700] },
  { name: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800] },
  { name: "Fraunces", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Instrument Serif", category: "serif", weights: [400] },
  { name: "Spectral", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Clash Display", category: "display", weights: [400, 500, 600, 700] },
  { name: "Bricolage Grotesque", category: "display", weights: [400, 500, 600, 700, 800] },
  { name: "Syne", category: "display", weights: [400, 600, 700, 800] },
  { name: "JetBrains Mono", category: "monospace", weights: [400, 500, 700] },
  { name: "System UI", category: "sans-serif", weights: [400, 500, 600, 700], system: true },
];

const GENERIC_FALLBACK: Record<FontDef["category"], string> = {
  "sans-serif": "ui-sans-serif, system-ui, -apple-system, sans-serif",
  serif: "ui-serif, Georgia, serif",
  display: "ui-sans-serif, system-ui, sans-serif",
  monospace: "ui-monospace, SFMono-Regular, monospace",
};

export function getFont(name: string): FontDef | undefined {
  return FONTS.find((f) => f.name === name);
}

/** Full CSS font stack for a family, including a sensible generic fallback. */
export function fontStack(name: string): string {
  const f = getFont(name);
  if (!f || f.system) return GENERIC_FALLBACK["sans-serif"];
  return `"${f.name}", ${GENERIC_FALLBACK[f.category]}`;
}

/** Curated heading + body pairings. */
export interface Pairing {
  id: string;
  label: string;
  heading: string;
  body: string;
}

export const PAIRINGS: Pairing[] = [
  { id: "default", label: "Aedon (padrão)", heading: "Inter Tight", body: "Inter" },
  { id: "editorial", label: "Editorial", heading: "Playfair Display", body: "Inter" },
  { id: "modern", label: "Moderno", heading: "Space Grotesk", body: "Inter" },
  { id: "bold", label: "Impacto", heading: "Syne", body: "Manrope" },
  { id: "warm", label: "Acolhedor", heading: "Fraunces", body: "DM Sans" },
  { id: "geometric", label: "Geométrico", heading: "Sora", body: "Plus Jakarta Sans" },
  { id: "classic", label: "Clássico", heading: "Instrument Serif", body: "Lora" },
  { id: "tech", label: "Tech", heading: "Bricolage Grotesque", body: "Inter" },
];

export const DEFAULT_TYPOGRAPHY: Typography = {
  headingFont: "Inter Tight",
  bodyFont: "Inter",
  headingWeight: 700,
  bodyWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 0,
  baseSize: 16,
};

/** All families actually used by a typography config, for font loading. */
export function activeFonts(t: Typography): string[] {
  return Array.from(new Set([t.headingFont, t.bodyFont]));
}

/**
 * Build the Google Fonts stylesheet href for the given families.
 * Returns null when every family is a system font (nothing to load).
 */
export function googleFontsHref(families: string[]): string | null {
  const parts: string[] = [];
  for (const name of families) {
    const f = getFont(name);
    if (!f || f.system) continue;
    const family = f.name.replace(/ /g, "+");
    parts.push(`family=${family}:wght@${f.weights.join(";")}`);
  }
  if (parts.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

/** CSS custom properties that blocks read to apply the active typography. */
export function typographyVars(t: Typography): Record<string, string> {
  return {
    "--site-heading-font": fontStack(t.headingFont),
    "--site-body-font": fontStack(t.bodyFont),
    "--site-heading-weight": String(t.headingWeight),
    "--site-body-weight": String(t.bodyWeight),
    "--site-line-height": String(t.lineHeight),
    "--site-letter-spacing": `${t.letterSpacing}em`,
    "--site-base-size": `${t.baseSize}px`,
  };
}
