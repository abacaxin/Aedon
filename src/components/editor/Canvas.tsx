import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import type { Device, PropMap, SectionInstance, Typography } from "@/lib/editor/types";
import { typographyVars } from "@/lib/editor/typography";
import { sectionAnchorId } from "@/lib/editor/links";
import { entryAnimation, scrollEffect, sectionBackground } from "@/lib/editor/effects";
import { elementLayout, parseElementLayout, type EditableElement } from "@/lib/editor/layout";
import { LinkProvider, type LinkResolver } from "./blocks/_link";
import { CustomElements } from "./blocks/CustomElements";
import { DeviceFrame } from "./DeviceFrame";
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";

interface Props {
  device: Device;
  sections: SectionInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  layoutMode: boolean;
  selectedElement: EditableElement | null;
  onElementSelect: (element: EditableElement | null) => void;
  onElementLayoutChange: (sectionId: string, selector: string, patch: { x: number; y: number }) => void;
  renderers: Record<string, ComponentType<{ props: PropMap }>>;
  typography: Typography;
  previewMode: boolean;
  resolveLink: LinkResolver;
  /** Index where a dragged component would be inserted, or null when not dragging over the canvas. */
  dropIndex: number | null;
  /** True while a library component is being dragged (disables iframe interaction). */
  dragging: boolean;
}

const EDITABLE_SELECTOR = "div, h1, h2, h3, p, a, img, blockquote, figcaption, li, details";

function elementSelector(element: HTMLElement, root: HTMLElement) {
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) return null;
    const tag = current.tagName.toLowerCase();
    const sameTag = Array.from(parent.children).filter((child: Element) => child.tagName.toLowerCase() === tag);
    parts.unshift(`${tag}:nth-of-type(${sameTag.indexOf(current) + 1})`);
    current = parent;
  }
  return current === root ? parts.join(" > ") : null;
}

function elementLabel(element: HTMLElement) {
  const type: Record<string, string> = { div: "Container", h1: "Título", h2: "Título", h3: "Título", p: "Texto", a: "Botão ou link", img: "Imagem", blockquote: "Citação", figcaption: "Legenda", li: "Item", details: "Bloco" };
  const preview = (element.textContent || element.getAttribute("alt") || "").trim().replace(/\s+/g, " ").slice(0, 32);
  return preview ? `${type[element.tagName.toLowerCase()] ?? "Elemento"} · ${preview}` : type[element.tagName.toLowerCase()] ?? "Elemento";
}

function SectionLayout({
  props,
  enabled,
  selected,
  onSelect,
  onLayoutChange,
  children,
}: {
  props: PropMap;
  enabled: boolean;
  selected: EditableElement | null;
  onSelect: (element: EditableElement | null) => void;
  onLayoutChange: (selector: string, patch: { x: number; y: number }) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; selector: string; startX: number; startY: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const layout = parseElementLayout(props.elementLayout);
    const originals = new Map<HTMLElement, { translate: string; width: string; scale: string; position: string; outline: string; outlineOffset: string; cursor: string }>();
    root.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR).forEach((element) => {
      const selector = elementSelector(element, root);
      if (!selector) return;
      const style = layout[selector];
      const active = enabled && selected?.selector === selector;
      originals.set(element, { translate: element.style.translate, width: element.style.width, scale: element.style.scale, position: element.style.position, outline: element.style.outline, outlineOffset: element.style.outlineOffset, cursor: element.style.cursor });
      if (style) {
        element.style.position = "relative";
        element.style.translate = `${style.x}px ${style.y}px`;
        element.style.width = `${style.width}%`;
        element.style.scale = `${style.scale / 100}`;
      }
      if (enabled) element.style.cursor = "crosshair";
      if (active) {
        element.style.outline = "2px solid rgba(255,255,255,.85)";
        element.style.outlineOffset = "4px";
      }
    });
    return () => originals.forEach((style, element) => Object.assign(element.style, style));
  }, [props.elementLayout, enabled, selected?.selector]);

  return (
    <div
      ref={ref}
      onPointerDownCapture={(event) => {
        if (!enabled) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>(EDITABLE_SELECTOR);
        if (!target || !ref.current?.contains(target)) return;
        const selector = elementSelector(target, ref.current);
        if (!selector) return;
        const layout = elementLayout(parseElementLayout(props.elementLayout), selector);
        dragRef.current = { pointerId: event.pointerId, selector, startX: event.clientX, startY: event.clientY, x: layout.x, y: layout.y };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMoveCapture={(event) => {
        const drag = dragRef.current;
        if (!enabled || !drag || drag.pointerId !== event.pointerId) return;
        onLayoutChange(drag.selector, {
          x: Math.max(-360, Math.min(360, drag.x + Math.round(event.clientX - drag.startX))),
          y: Math.max(-360, Math.min(360, drag.y + Math.round(event.clientY - drag.startY))),
        });
      }}
      onPointerUpCapture={(event) => {
        if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
      }}
      onClickCapture={(event) => {
        if (!enabled) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>(EDITABLE_SELECTOR);
        const root = ref.current;
        if (!target || !root?.contains(target)) return;
        event.preventDefault();
        event.stopPropagation();
        const selector = elementSelector(target, root);
        if (selector) onSelect({ selector, label: elementLabel(target) });
      }}
    >
      {children}
    </div>
  );
}

const WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };
const FRAME_PADDING = 24; // px, on every side of the scaled frame

function DropIndicator() {
  return (
    <div className="my-1.5 h-1 rounded-full bg-foreground animate-pulse" />
  );
}

function SectionToolbar({
  onDuplicate,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const button = "h-8 w-8 rounded-md text-white/75 hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-30 flex items-center justify-center transition-colors";
  return (
    <div
      className="absolute right-3 top-3 z-20 flex items-center rounded-lg border border-white/15 bg-black/75 p-1 shadow-xl backdrop-blur"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={() => onMove(-1)} disabled={!canMoveUp} className={button} title="Mover seção para cima">
        <ChevronUp className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={!canMoveDown} className={button} title="Mover seção para baixo">
        <ChevronDown className="h-4 w-4" />
      </button>
      <span className="mx-1 h-4 w-px bg-white/15" />
      <button type="button" onClick={onDuplicate} className={button} title="Duplicar seção">
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onRemove} className={`${button} hover:bg-destructive/80`} title="Excluir seção">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SectionMotion({ props, children }: { props: PropMap; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const animation = entryAnimation(props);
  const effect = scrollEffect(props);
  const [visible, setVisible] = useState(animation === "none");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const parentWin = win.parent;
    const frame = win.frameElement as HTMLElement | null;
    const scrollRoot = frame && parentWin !== win ? parentWin.document.querySelector("main") : null;

    const update = () => {
      const sectionRect = el.getBoundingClientRect();
      const frameRect = frame?.getBoundingClientRect();
      const rootRect = scrollRoot?.getBoundingClientRect();
      const viewportTop = rootRect?.top ?? 0;
      const viewportHeight = scrollRoot?.clientHeight ?? win.innerHeight;
      const top = (frameRect?.top ?? 0) + sectionRect.top;
      const centerDelta = (viewportTop + viewportHeight / 2 - (top + sectionRect.height / 2)) / viewportHeight;
      const inView = top + sectionRect.height > viewportTop + 40 && top < viewportTop + viewportHeight - 40;
      setVisible((wasVisible) => wasVisible || inView);
      setOffset(Math.max(-1, Math.min(1, centerDelta)));
    };

    update();
    scrollRoot?.addEventListener("scroll", update, { passive: true });
    win.addEventListener("scroll", update, { passive: true });
    win.addEventListener("resize", update);
    return () => {
      scrollRoot?.removeEventListener("scroll", update);
      win.removeEventListener("scroll", update);
      win.removeEventListener("resize", update);
    };
  }, []);

  const entryTransform = !visible
    ? animation === "slide-up"
      ? "translateY(28px)"
      : animation === "slide-left"
        ? "translateX(-28px)"
        : animation === "zoom"
          ? "scale(0.96)"
          : "none"
    : "none";
  const parallaxTransform = effect === "parallax" ? `translateY(${Math.round(offset * 22)}px)` : "none";
  const opacity = !visible && animation !== "none" ? 0 : effect === "fade" ? 1 - Math.abs(offset) * 0.25 : 1;

  return (
    <div
      ref={ref}
      style={{
        opacity,
        transform: `${entryTransform} ${parallaxTransform}`,
        transition: "opacity 650ms cubic-bezier(.2,.8,.2,1), transform 650ms cubic-bezier(.2,.8,.2,1)",
        willChange: animation !== "none" || effect !== "none" ? "transform, opacity" : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function Canvas({
  device,
  sections,
  selectedId,
  onSelect,
  onDuplicate,
  onRemove,
  onMove,
  layoutMode,
  selectedElement,
  onElementSelect,
  onElementLayoutChange,
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
                <SectionMotion props={s.props}>
                  <SectionLayout
                    props={s.props}
                    enabled={active && layoutMode}
                    selected={active ? selectedElement : null}
                    onSelect={onElementSelect}
                    onLayoutChange={(selector, patch) => onElementLayoutChange(s.id, selector, patch)}
                  >
                    <R props={{ ...s.props, bg: sectionBackground(s.props) }} />
                    <CustomElements props={s.props} />
                  </SectionLayout>
                </SectionMotion>
                {active && (
                  <SectionToolbar
                    onDuplicate={() => onDuplicate(s.id)}
                    onRemove={() => onRemove(s.id)}
                    onMove={(direction) => onMove(s.id, direction)}
                    canMoveUp={i > 0}
                    canMoveDown={i < visible.length - 1}
                  />
                )}
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
