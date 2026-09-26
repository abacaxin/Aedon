export type ElementLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  color: string;
};

export type ElementLayoutMap = Record<string, ElementLayout>;

export type EditableElement = {
  selector: string;
  label: string;
};

export const DEFAULT_ELEMENT_LAYOUT: ElementLayout = { x: 0, y: 0, width: 100, height: 0, scale: 100, color: "" };

export function parseElementLayout(value: unknown): ElementLayoutMap {
  if (typeof value !== "string" || !value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, Partial<ElementLayout>>;
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([key, item]) => key && item && typeof item === "object")
        .map(([key, item]) => [
          key,
          {
            x: clampNumber(item.x, -360, 360, 0),
            y: clampNumber(item.y, -360, 360, 0),
            width: clampNumber(item.width, 5, 100, 100),
            height: clampNumber(item.height, 0, 1600, 0),
            scale: clampNumber(item.scale, 25, 200, 100),
            color: typeof item.color === "string" && /^#[0-9a-fA-F]{6}$/.test(item.color) ? item.color : "",
          },
        ]),
    );
  } catch {
    return {};
  }
}

export function encodeElementLayout(layout: ElementLayoutMap): string {
  return JSON.stringify(layout);
}

export function elementLayout(map: ElementLayoutMap, selector: string): ElementLayout {
  return map[selector] ?? DEFAULT_ELEMENT_LAYOUT;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
