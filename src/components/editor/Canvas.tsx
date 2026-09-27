import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import type { Device, PropMap, SectionInstance, Typography } from "@/lib/editor/types";
import { typographyVars } from "@/lib/editor/typography";
import { sectionAnchorId } from "@/lib/editor/links";
import { entryAnimation, scrollEffect, sectionBackground } from "@/lib/editor/effects";
import { elementLayout, parseElementLayout, type EditableElement, type ElementLayout } from "@/lib/editor/layout";
import { LinkProvider, type LinkResolver } from "./blocks/_link";
import { CustomElements } from "./blocks/CustomElements";
import { DeviceFrame } from "./DeviceFrame";
import { ElementSelection } from "./ElementSelection";
import { ChevronDown, ChevronUp, Copy, Image, Minus, MoreHorizontal, Plus, RotateCcw, Square, Trash2, Type } from "lucide-react";

interface Props {
  device: Device;
  sections: SectionInstance[];
  selectedId: string | null;
  onSelect: (id: string, focus?: "section" | "element") => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  selectedElement: EditableElement | null;
  onElementSelect: (element: EditableElement | null) => void;
  onElementLayoutChange: (sectionId: string, selector: string, patch: Partial<ElementLayout>) => void;
  onInteractionStart: () => void;
  onInteractionEnd: (changed: boolean) => void;
  onResetLayout: (sectionId: string) => void;
  onAddElement: (sectionId: string, type: "text" | "button" | "image" | "divider" | "box") => void;
  onInlineTextChange: (sectionId: string, previous: string, next: string) => void;
  onImageChange: (sectionId: string, previous: string, next: string) => void;
  onBackgroundChange: (sectionId: string, color: string) => void;
  onSectionPropChange: (sectionId: string, key: string, value: string | boolean) => void;
  renderers: Record<string, ComponentType<{ props: PropMap }>>;
  typography: Typography;
  previewMode: boolean;
  resolveLink: LinkResolver;
  /** Index where a dragged component would be inserted, or null when not dragging over the canvas. */
  dropIndex: number | null;
  /** True while a library component is being dragged (disables iframe interaction). */
  dragging: boolean;
}

const EDITABLE_SELECTOR = "div, h1, h2, h3, p, a, button, img, blockquote, figcaption, li, details";
const INLINE_TEXT_SELECTOR = "h1, h2, h3, p, a, blockquote, figcaption, li, summary";

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
  if (element.tagName === "IMG" || Array.from(element.children).some((child) => child.tagName === "IMG")) return "Imagem";
  const type: Record<string, string> = { div: "Container", h1: "Título", h2: "Título", h3: "Título", p: "Texto", a: "Botão ou link", button: "Botão", img: "Imagem", blockquote: "Citação", figcaption: "Legenda", li: "Item", details: "Bloco" };
  const preview = (element.textContent || element.getAttribute("alt") || "").trim().replace(/\s+/g, " ").slice(0, 32);
  return preview ? `${type[element.tagName.toLowerCase()] ?? "Elemento"} · ${preview}` : type[element.tagName.toLowerCase()] ?? "Elemento";
}

function editableTarget(clicked: HTMLElement, root: HTMLElement) {
  const image = clicked.closest("img");
  if (image && root.contains(image) && image.parentElement && image.parentElement !== root) {
    return image.parentElement;
  }
  const target = clicked.closest<HTMLElement>(EDITABLE_SELECTOR);
  return target && root.contains(target) ? target : null;
}

function SectionLayout({
  props,
  background,
  canCanvasEdit,
  selected,
  onSelect,
  onLayoutChange,
  onInteractionStart,
  onInteractionEnd,
  onInlineTextChange,
  onImageChange,
  onBackgroundChange,
  onPropChange,
  children,
}: {
  props: PropMap;
  /** The section surface owns the background so it expands with every module. */
  background: string;
  canCanvasEdit: boolean;
  selected: EditableElement | null;
  onSelect: (element: EditableElement | null) => void;
  onLayoutChange: (selector: string, patch: Partial<ElementLayout>) => void;
  onInteractionStart: () => void;
  onInteractionEnd: (changed: boolean) => void;
  onInlineTextChange: (previous: string, next: string) => void;
  onImageChange: (previous: string, next: string) => void;
  onBackgroundChange: (color: string) => void;
  onPropChange: (key: string, value: string | boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; selector: string; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [backgroundPicker, setBackgroundPicker] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const layout = parseElementLayout(props.elementLayout);
    const originals = new Map<HTMLElement, { translate: string; width: string; height: string; scale: string; color: string; position: string; cursor: string; userSelect: string }>();
    root.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR).forEach((element) => {
      if (element.closest("[data-editor-control]")) return;
      const selector = elementSelector(element, root);
      if (!selector) return;
      const style = layout[selector];
      originals.set(element, { translate: element.style.translate, width: element.style.width, height: element.style.height, scale: element.style.scale, color: element.style.color, position: element.style.position, cursor: element.style.cursor, userSelect: element.style.userSelect });
      if (style) {
        if (style.x || style.y) {
          element.style.position = "relative";
          element.style.translate = `${style.x}px ${style.y}px`;
        }
        if (style.width !== 100) element.style.width = `${style.width}%`;
        if (style.height) element.style.height = `${style.height}px`;
        if (style.scale !== 100) element.style.scale = `${style.scale / 100}`;
        if (style.color) element.style.color = style.color;
      }
      if (canCanvasEdit) {
        element.style.cursor = selected?.selector === selector ? "grab" : "pointer";
        if (!element.isContentEditable) element.style.userSelect = "none";
      }
    });
    return () => originals.forEach((style, element) => Object.assign(element.style, style));
  }, [props.elementLayout, canCanvasEdit, selected?.selector]);

  const startInlineEdit = (target: HTMLElement) => {
    const previous = target.textContent?.trim() ?? "";
    if (!previous) return;
    target.contentEditable = "true";
    target.style.userSelect = "text";
    target.spellcheck = true;
    target.style.outline = "2px solid rgba(255,255,255,.85)";
    target.style.outlineOffset = "4px";
    target.focus();
    const range = target.ownerDocument.createRange();
    range.selectNodeContents(target);
    const selection = target.ownerDocument.defaultView?.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    target.onblur = () => {
      const next = target.textContent?.trim() ?? "";
      target.contentEditable = "false";
      target.style.userSelect = "none";
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.onblur = null;
      if (next && next !== previous) onInlineTextChange(previous, next);
    };
  };

  return (
    <div
      ref={ref}
      onPointerDownCapture={(event) => {
        if (!canCanvasEdit || event.button !== 0 || event.detail > 1) return;
        if ((event.target as HTMLElement).closest("[data-editor-control]")) return;
        if ((event.target as HTMLElement).isContentEditable) return;
        const root = ref.current;
        if (!root) return;
        const target = editableTarget(event.target as HTMLElement, root);
        if (!target) return;
        const selector = elementSelector(target, root);
        if (!selector || selected?.selector !== selector) return;
        const layout = elementLayout(parseElementLayout(props.elementLayout), selector);
        dragRef.current = { pointerId: event.pointerId, selector, startX: event.clientX, startY: event.clientY, x: layout.x, y: layout.y, moved: false };
        onInteractionStart();
      }}
      onPointerMoveCapture={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
        drag.moved = true;
        event.preventDefault();
        const canvasScale = event.currentTarget.getBoundingClientRect().width / event.currentTarget.offsetWidth || 1;
        onLayoutChange(drag.selector, {
          x: Math.max(-360, Math.min(360, drag.x + Math.round(dx / canvasScale))),
          y: Math.max(-360, Math.min(360, drag.y + Math.round(dy / canvasScale))),
        });
      }}
      onPointerUpCapture={(event) => {
        if (dragRef.current?.pointerId === event.pointerId) {
          suppressClickRef.current = dragRef.current.moved;
          if (dragRef.current.moved) window.setTimeout(() => { suppressClickRef.current = false; }, 0);
          onInteractionEnd(dragRef.current.moved);
          dragRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancelCapture={() => {
        if (dragRef.current) onInteractionEnd(dragRef.current.moved);
        dragRef.current = null;
      }}
      onClickCapture={(event) => {
        if (!canCanvasEdit) return;
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        const clicked = event.target as HTMLElement;
        // Floating editor controls live inside this section. Let their own handlers
        // receive clicks instead of selecting the button/input as page content.
        if (clicked.closest("[data-editor-control]")) return;
        const root = ref.current;
        const target = root ? editableTarget(clicked, root) : null;
        // Only empty section space opens the background picker. Nested containers
        // are editable elements in their own right.
        if (!target || target === root) {
          event.preventDefault();
          event.stopPropagation();
          onSelect(null);
          setBackgroundPicker(true);
          return;
        }
        if (!target || !root?.contains(target)) {
          if (root?.contains(clicked)) {
            event.preventDefault();
            event.stopPropagation();
            onSelect(null);
            setBackgroundPicker(true);
          }
          return;
        }
        if (clicked.isContentEditable) return;
        event.preventDefault();
        event.stopPropagation();
        setBackgroundPicker(false);
        const selector = elementSelector(target, root);
        if (selector) onSelect({ selector, label: elementLabel(target) });
      }}
      onDoubleClickCapture={(event) => {
        if (!canCanvasEdit) return;
        if ((event.target as HTMLElement).closest("[data-editor-control]")) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>(INLINE_TEXT_SELECTOR);
        const root = ref.current;
        if (!target || !root?.contains(target)) return;
        dragRef.current = null;
        event.preventDefault();
        event.stopPropagation();
        startInlineEdit(target);
      }}
      className="relative"
      style={{ background }}
    >
      {children}
      {selected && (
        <ElementSelection
          root={ref.current}
          element={selected}
          layout={elementLayout(parseElementLayout(props.elementLayout), selected.selector)}
          onLayoutChange={(patch) => onLayoutChange(selected.selector, patch)}
          onInteractionStart={onInteractionStart}
          onInteractionEnd={onInteractionEnd}
          onReset={() => {
            const layout = parseElementLayout(props.elementLayout);
            delete layout[selected.selector];
            onPropChange("elementLayout", JSON.stringify(layout));
          }}
          onEditText={() => {
            const target = ref.current?.querySelector<HTMLElement>(selected.selector);
            if (target) startInlineEdit(target);
          }}
          onImageChange={onImageChange}
        />
      )}
      {backgroundPicker && (
        <div data-editor-control className="editor-float-in absolute right-3 top-3 z-50 w-52 space-y-2 rounded-lg border border-white/15 bg-black/90 p-3 shadow-xl backdrop-blur" onClick={(event) => event.stopPropagation()}>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-white/70">Fundo da seção</span>
          <label className="flex items-center justify-between gap-2 text-[10px] text-white/70">Cor
          <input
            type="color"
            value={typeof props.bg === "string" ? props.bg : "#000000"}
            onChange={(event) => onBackgroundChange(event.target.value)}
            className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            title="Cor de fundo da seção"
          />
          </label>
          <button type="button" onClick={() => onPropChange("gradientEnabled", !props.gradientEnabled)} className="flex w-full items-center justify-between rounded-md bg-white/10 px-2 py-1.5 text-[10px] text-white/80">Gradiente <span>{props.gradientEnabled ? "Ligado" : "Desligado"}</span></button>
          {props.gradientEnabled === true && <div className="grid grid-cols-2 gap-2"><input type="color" aria-label="Início do gradiente" value={typeof props.gradientFrom === "string" ? props.gradientFrom : typeof props.bg === "string" ? props.bg : "#000000"} onChange={(event) => onPropChange("gradientFrom", event.target.value)} className="h-7 w-full cursor-pointer rounded bg-transparent" /><input type="color" aria-label="Fim do gradiente" value={typeof props.gradientTo === "string" ? props.gradientTo : typeof props.accent === "string" ? props.accent : "#ffffff"} onChange={(event) => onPropChange("gradientTo", event.target.value)} className="h-7 w-full cursor-pointer rounded bg-transparent" /><select aria-label="Direção do gradiente" value={typeof props.gradientDirection === "string" ? props.gradientDirection : "135deg"} onChange={(event) => onPropChange("gradientDirection", event.target.value)} className="col-span-2 rounded bg-white/10 px-2 py-1.5 text-[10px] text-white"><option value="135deg">Diagonal</option><option value="180deg">Vertical</option><option value="90deg">Horizontal</option><option value="45deg">Diagonal inversa</option></select></div>}
          <button type="button" onClick={() => setBackgroundPicker(false)} className="w-full rounded-md py-1 text-[10px] text-white/60 hover:bg-white/10 hover:text-white">Concluído</button>
        </div>
      )}
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
  onResetLayout,
  onAddElement,
  canMoveUp,
  canMoveDown,
}: {
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onResetLayout: () => void;
  onAddElement: (type: "text" | "button" | "image" | "divider" | "box") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionClass = "flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div
      className="editor-float-in absolute right-3 top-3 z-20 flex items-center gap-1 rounded-xl border border-white/20 bg-black/90 p-1.5 shadow-xl backdrop-blur"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="hidden md:inline px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Seção</span>
      <div className="relative">
        <button type="button" onClick={() => { setAddOpen((open) => !open); setActionsOpen(false); }} className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors ${addOpen ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/15 hover:text-white"}`} title="Adicionar elemento" aria-expanded={addOpen}>
          <Plus className="h-3.5 w-3.5" /> Elemento
        </button>
        {addOpen && (
          <div className="editor-float-in absolute right-0 top-11 z-30 flex w-40 flex-col gap-0.5 rounded-xl border border-white/20 bg-black/95 p-1.5 shadow-xl backdrop-blur">
            {[["text", "Texto", Type], ["button", "Botão", Square], ["image", "Imagem", Image], ["divider", "Divisor", Minus], ["box", "Div", Square]].map(([type, label, Icon]) => (
              <button key={type as string} type="button" onClick={() => { onAddElement(type as "text" | "button" | "image" | "divider" | "box"); setAddOpen(false); }} className={actionClass}>
                {(() => { const C = Icon as typeof Type; return <C className="h-3 w-3" />; })()} {label as string}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <button type="button" onClick={() => { setActionsOpen((open) => !open); setAddOpen(false); }} className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors ${actionsOpen ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/15 hover:text-white"}`} title="Ações da seção" aria-expanded={actionsOpen}>
          <MoreHorizontal className="h-3.5 w-3.5" /> Ações
        </button>
        {actionsOpen && (
          <div className="editor-float-in absolute right-0 top-11 z-30 flex w-44 flex-col gap-0.5 rounded-xl border border-white/20 bg-black/95 p-1.5 shadow-xl backdrop-blur">
            <button type="button" onClick={() => { onMove(-1); setActionsOpen(false); }} disabled={!canMoveUp} className={actionClass}><ChevronUp className="h-3.5 w-3.5" /> Subir seção</button>
            <button type="button" onClick={() => { onMove(1); setActionsOpen(false); }} disabled={!canMoveDown} className={actionClass}><ChevronDown className="h-3.5 w-3.5" /> Descer seção</button>
            <button type="button" onClick={() => { onDuplicate(); setActionsOpen(false); }} className={actionClass}><Copy className="h-3.5 w-3.5" /> Duplicar</button>
            <button type="button" onClick={() => { onResetLayout(); setActionsOpen(false); }} className={actionClass}><RotateCcw className="h-3.5 w-3.5" /> Redefinir layout</button>
            <div className="my-1 h-px bg-white/10" />
            <button type="button" onClick={() => { onRemove(); setActionsOpen(false); }} className={`${actionClass} hover:bg-destructive/25 hover:text-red-200`}><Trash2 className="h-3.5 w-3.5" /> Excluir seção</button>
          </div>
        )}
      </div>
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
  selectedElement,
  onElementSelect,
  onElementLayoutChange,
  onInteractionStart,
  onInteractionEnd,
  onResetLayout,
  onAddElement,
  onInlineTextChange,
  onImageChange,
  onBackgroundChange,
  onSectionPropChange,
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
  const [zoom, setZoom] = useState<"fit" | number>("fit");

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

  const fitScale = Math.min(1, availableWidth / width);
  const scale = zoom === "fit" ? fitScale : zoom;
  const changeZoom = (step: number) => {
    const current = zoom === "fit" ? fitScale : zoom;
    setZoom(Math.max(0.35, Math.min(1.5, Math.round((current + step) * 10) / 10)));
  };
  const siteStyle: CSSProperties = {
    ...typographyVars(typography),
    fontFamily: "var(--site-body-font)",
    fontWeight: "var(--site-body-weight, 400)",
    lineHeight: "var(--site-line-height, 1.5)",
    letterSpacing: "var(--site-letter-spacing, 0)",
    fontSize: "var(--site-base-size, 16px)",
    background: "#000",
    // The preview iframe is sized from its content. Using 100vh here feeds its
    // current height back into the next measurement and grows it indefinitely.
    minHeight: 600,
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
            Sua página está vazia. Escolha um preset completo ou adicione um bloco pela biblioteca.
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
                className={`relative transition-all ${!previewMode ? "editor-canvas-section" : ""} ${
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
                    background={sectionBackground(s.props)}
                    canCanvasEdit={!previewMode}
                    selected={active ? selectedElement : null}
                    onSelect={(element) => {
                      onSelect(s.id, element ? "element" : "section");
                      onElementSelect(element);
                    }}
                    onLayoutChange={(selector, patch) => onElementLayoutChange(s.id, selector, patch)}
                    onInteractionStart={onInteractionStart}
                    onInteractionEnd={onInteractionEnd}
                    onInlineTextChange={(previous, next) => onInlineTextChange(s.id, previous, next)}
                    onImageChange={(previous, next) => onImageChange(s.id, previous, next)}
                    onBackgroundChange={(color) => onBackgroundChange(s.id, color)}
                    onPropChange={(key, value) => onSectionPropChange(s.id, key, value)}
                  >
                    {/* The surface above owns the fill. Keeping children transparent means
                        a newly added module extends the same background naturally. */}
                    <R props={{ ...s.props, bg: "transparent" }} />
                    <CustomElements props={s.props} />
                  </SectionLayout>
                </SectionMotion>
                {active && (
                  <SectionToolbar
                    onDuplicate={() => onDuplicate(s.id)}
                    onRemove={() => onRemove(s.id)}
                    onMove={(direction) => onMove(s.id, direction)}
                    onResetLayout={() => onResetLayout(s.id)}
                    onAddElement={(type) => onAddElement(s.id, type)}
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
      className="flex-1 min-w-0 overflow-auto scrollbar-thin bg-[#050505]"
      style={{ padding: FRAME_PADDING }}
    >
      <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        {!previewMode ? (
          <div className="flex items-center gap-2 text-xs text-white/65" role="status">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/65" />
            {selectedElement
              ? `${selectedElement.label} selecionado · arraste ou use as alças e a barra sobre ele`
              : selectedId
                ? "Clique em um elemento para ver as opções sobre ele"
                : visible.length > 0
                  ? "Clique em um elemento do site para editar · biblioteca à esquerda para adicionar"
                  : "Escolha um componente na biblioteca para começar"}
          </div>
        ) : <span className="text-xs text-white/65">Prévia interativa</span>}
        <div role="group" aria-label="Zoom do canvas" className="flex items-center rounded-lg border border-white/15 bg-white/[0.04] p-1 text-xs text-white/80">
          <button type="button" onClick={() => changeZoom(-0.1)} aria-label="Diminuir zoom" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10">−</button>
          <span className="min-w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => changeZoom(0.1)} aria-label="Aumentar zoom" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10">+</button>
          <button type="button" onClick={() => setZoom("fit")} aria-pressed={zoom === "fit"} className={`ml-1 min-h-8 rounded-md px-2 ${zoom === "fit" ? "bg-white/15 text-white" : "hover:bg-white/10"}`}>Ajustar</button>
        </div>
      </div>
      <div className={`min-h-full flex items-start ${width * scale > availableWidth ? "justify-start" : "justify-center"}`}>
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
