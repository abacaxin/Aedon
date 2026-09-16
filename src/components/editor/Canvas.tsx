import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import type { Device, PropMap, SectionInstance, Typography } from "@/lib/editor/types";
import { typographyVars } from "@/lib/editor/typography";
import { sectionAnchorId } from "@/lib/editor/links";
import { LinkProvider, type LinkResolver } from "./blocks/_link";
import { DeviceFrame } from "./DeviceFrame";

interface Props {
  device: Device;
  sections: SectionInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderers: Record<string, ComponentType<{ props: PropMap }>>;
  typography: Typography;
  previewMode: boolean;
  resolveLink: LinkResolver;
  /** Index where a dragged component would be inserted, or null when not dragging over the canvas. */
  dropIndex: number | null;
  /** True while a library component is being dragged (disables iframe interaction). */
  dragging: boolean;
}

const WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };
const FRAME_PADDING = 24; // px, on every side of the scaled frame

function DropIndicator() {
  return (
    <div className="my-1.5 h-1 rounded-full bg-foreground animate-pulse" />
  );
}

export function Canvas({
  device,
  sections,
  selectedId,
  onSelect,
  renderers,
  typography,
  previewMode,
  resolveLink,
  dropIndex,
  dragging,
}: Props) {
  const width = WIDTHS[device];
  const visible = sections.filter((s) => !s.hidden && renderers[s.variantId]);

  const mainRef = useRef<HTMLElement>(null);
  const [availableWidth, setAvailableWidth] = useState(width);
  const [frameHeight, setFrameHeight] = useState(600);

  // Track how much horizontal room the canvas viewport actually has, so the frame can
  // be scaled to fit instead of overflowing — a fixed-width frame wider than the
  // container gets clipped unreachably on typical laptop screens (justify-content:
  // center pushes half the overflow off-screen to the left, past scrollLeft: 0).
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const measure = () => setAvailableWidth(Math.max(0, el.clientWidth - FRAME_PADDING * 2));
    // The sidebars' open/closed state (EditorShell's isNarrow check) settles via its own
    // effect after mount, so `main`'s real width isn't final on the very first paint —
    // re-measure a few times to catch that settle instead of freezing on a transient value.
    measure();
    const t1 = window.requestAnimationFrame(measure);
    const t2 = window.setTimeout(measure, 150);
    const t3 = window.setTimeout(measure, 500);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      window.cancelAnimationFrame(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      ro.disconnect();
    };
  }, []);

  const scale = Math.min(1, availableWidth / width);
  const siteStyle: CSSProperties = {
    ...typographyVars(typography),
    fontFamily: "var(--site-body-font)",
    fontWeight: "var(--site-body-weight, 400)",
    lineHeight: "var(--site-line-height, 1.5)",
    letterSpacing: "var(--site-letter-spacing, 0)",
    fontSize: "var(--site-base-size, 16px)",
    background: "#000",
    minHeight: "100vh",
  };

  const content = (
    <LinkProvider value={resolveLink}>
      <div style={siteStyle}>
        {visible.length === 0 && (
          <div
            className={`m-6 rounded-2xl border-2 border-dashed p-20 text-center text-sm transition-colors ${
              dragging && dropIndex === 0
                ? "border-foreground text-white/70 bg-foreground/5"
                : "border-white/10 text-white/40"
            }`}
          >
            Arraste ou adicione seções da biblioteca para começar.
          </div>
        )}
        {visible.map((s, i) => {
          const R = renderers[s.variantId]!;
          const active = !previewMode && s.id === selectedId;
          return (
            <div key={s.id}>
              {dragging && dropIndex === i && <DropIndicator />}
              <div
                id={sectionAnchorId(s.id)}
                onClick={
                  previewMode
                    ? undefined
                    : (e) => {
                        e.stopPropagation();
                        onSelect(s.id);
                      }
                }
                className={`relative transition-all ${
                  previewMode
                    ? ""
                    : `cursor-pointer ${
                        active
                          ? "ring-2 ring-foreground ring-inset"
                          : "hover:ring-1 hover:ring-white/20 hover:ring-inset"
                      }`
                }`}
              >
                <R props={s.props} />
              </div>
            </div>
          );
        })}
        {dragging && dropIndex === visible.length && visible.length > 0 && <DropIndicator />}
      </div>
    </LinkProvider>
  );

  return (
    <main
      ref={mainRef}
      className="flex-1 min-w-0 overflow-auto scrollbar-none bg-[#050505]"
      style={{ padding: FRAME_PADDING }}
    >
      <div className="min-h-full flex justify-center items-start">
        {/* Reserves the true scaled-down footprint so centering never overflows the
            viewport — the frame inside renders at full device width and is scaled
            visually with a CSS transform, keeping breakpoints accurate. */}
        <div className="shrink-0" style={{ width: width * scale, height: frameHeight * scale }}>
          <div
            className="transition-transform duration-200 ease-out origin-top-left"
            style={{
              width,
              transform: `scale(${scale})`,
              boxShadow: "0 30px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)",
              borderRadius: device === "desktop" ? 16 : 24,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <DeviceFrame width={width} interactive={!dragging} onHeightChange={setFrameHeight}>
              {content}
            </DeviceFrame>
          </div>
        </div>
      </div>
    </main>
  );
}
