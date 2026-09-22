import type { PropMap } from "./types";
import { bool, str } from "./props";

export type EntryAnimation = "none" | "fade" | "slide-up" | "slide-left" | "zoom";
export type ScrollEffect = "none" | "parallax" | "fade";

export function sectionBackground(props: PropMap): string {
  const base = str(props, "bg", "#000000");
  if (!bool(props, "gradientEnabled")) return base;
  const from = str(props, "gradientFrom", base);
  const to = str(props, "gradientTo", str(props, "accent", "#D4D4D8"));
  const direction = str(props, "gradientDirection", "135deg");
  return `linear-gradient(${direction}, ${from}, ${to})`;
}

export function entryAnimation(props: PropMap): EntryAnimation {
  const value = str(props, "entryAnimation", "none");
  return value === "fade" || value === "slide-up" || value === "slide-left" || value === "zoom"
    ? value
    : "none";
}

export function scrollEffect(props: PropMap): ScrollEffect {
  const value = str(props, "scrollEffect", "none");
  return value === "parallax" || value === "fade" ? value : "none";
}
