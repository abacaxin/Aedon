import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ImagePlus, Pencil, RotateCcw } from "lucide-react";
import type { EditableElement, ElementLayout } from "@/lib/editor/layout";

type LayoutPatch = Partial<ElementLayout>;
type Handle = "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

function computedColor(element: HTMLElement | null) {
  if (!element) return "#ffffff";
  const components = element.ownerDocument.defaultView?.getComputedStyle(element).color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3);
  if (!components || components.length !== 3) return "#ffffff";
  return `#${components.map((component) => Math.round(Number(component)).toString(16).padStart(2, "0")).join("")}`;
}

interface Props {
  root: HTMLDivElement | null;
  element: EditableElement;
  layout: ElementLayout;
  onLayoutChange: (patch: LayoutPatch) => void;
  onInteractionStart: () => void;
  onInteractionEnd: (changed: boolean) => void;
  onReset: () => void;
  onEditText: () => void;
  onImageChange: (previous: string, next: string) => void;
}

export function ElementSelection({ root, element, layout, onLayoutChange, onInteractionStart, onInteractionEnd, onReset, onEditText, onImageChange }: Props) {
  const [bounds, setBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const resizeRef = useRef<{
    pointerId: number;
    handle: Handle;
    x: number;
    y: number;
    width: number;
    height: number;
    widthPercent: number;
    layoutX: number;
    layoutY: number;
    changed: boolean;
  } | null>(null);

  const target = root?.querySelector<HTMLElement>(element.selector) ?? null;
  const tag = target?.tagName.toLowerCase();
  const image = tag === "img" ? target : Array.from(target?.children ?? []).find((child) => child.tagName === "IMG") as HTMLImageElement | undefined;
  const isImage = !!image;
  const canEditText = !isImage && !!tag && ["h1", "h2", "h3", "p", "a", "button", "blockquote", "figcaption", "li"].includes(tag);
  const canResizeHeight = isImage || tag === "div";
  const imageSource = image?.getAttribute("src") ?? "";
  const displayedColor = layout.color || computedColor(target);

  useLayoutEffect(() => {
    if (!root || !target) return;
    const measure = () => {
      const box = target.getBoundingClientRect();
      const parent = root.getBoundingClientRect();
      setBounds({ left: box.left - parent.left, top: box.top - parent.top, width: box.width, height: box.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(target);
    const frameWindow = root.ownerDocument.defaultView;
    frameWindow?.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      frameWindow?.removeEventListener("resize", measure);
    };
  }, [root, target, layout.x, layout.y, layout.width, layout.height, layout.scale]);

  if (!root || !target || !bounds) return null;

  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>, handle: Handle) => {
    event.preventDefault();
    event.stopPropagation();
    onInteractionStart();
    resizeRef.current = {
      pointerId: event.pointerId,
      handle,
      x: event.clientX,
      y: event.clientY,
      width: target.getBoundingClientRect().width,
      height: target.getBoundingClientRect().height,
      widthPercent: layout.width,
      layoutX: layout.x,
      layoutY: layout.y,
      changed: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = resizeRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) < 2) return;
    const canvasScale = root.getBoundingClientRect().width / root.offsetWidth || 1;
    start.changed = true;
    const left = start.handle.includes("left");
    const right = start.handle.includes("right");
    const top = start.handle.includes("top");
    const bottom = start.handle.includes("bottom");
    const patch: LayoutPatch = {};
    if (left || right) {
      const nextWidth = Math.max(24, start.width + (left ? -dx : dx));
      // Percentage width is relative to the element's grid/flex area, which may
      // be much narrower than its parent (for example a two-column hero).
      patch.width = Math.max(5, Math.min(100, Math.round(start.widthPercent * nextWidth / start.width)));
      if (left) patch.x = Math.max(-360, Math.min(360, Math.round(start.layoutX + dx / canvasScale)));
    }
    if (canResizeHeight && (top || bottom)) {
      patch.height = Math.max(40, Math.min(1600, Math.round((start.height + (top ? -dy : dy)) / canvasScale)));
      if (top) patch.y = Math.max(-360, Math.min(360, Math.round(start.layoutY + dy / canvasScale)));
    }
    if (Object.keys(patch).length) onLayoutChange(patch);
  };

  const handles: { name: Handle; style: string }[] = canResizeHeight
    ? [
        { name: "top-left", style: "-left-2 -top-2" },
        { name: "top-right", style: "-right-2 -top-2" },
        { name: "bottom-left", style: "-bottom-2 -left-2" },
        { name: "bottom-right", style: "-bottom-2 -right-2" },
        { name: "left", style: "-left-2 top-1/2 -translate-y-1/2" },
        { name: "right", style: "-right-2 top-1/2 -translate-y-1/2" },
        { name: "top", style: "-top-2 left-1/2 -translate-x-1/2" },
        { name: "bottom", style: "-bottom-2 left-1/2 -translate-x-1/2" },
      ]
    : [
        { name: "left", style: "-left-2 top-1/2 -translate-y-1/2" },
        { name: "right", style: "-right-2 top-1/2 -translate-y-1/2" },
      ];

  return (
    <div data-editor-control className="pointer-events-none absolute z-40 border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.8)]" style={{ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }} onClick={(event) => event.stopPropagation()}>
      <div className={`editor-float-in pointer-events-auto absolute z-50 flex min-h-11 items-center gap-1 rounded-xl border border-white/20 bg-[#171717] p-1 shadow-2xl ${bounds.top < 54 ? "top-[calc(100%+10px)]" : "bottom-[calc(100%+10px)]"}`} style={{ left: Math.max(-bounds.left, Math.min(0, root.clientWidth - bounds.left - 260)) }} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
        <span className="max-w-32 truncate px-2 text-xs font-semibold text-white" title={element.label}>{element.label}</span>
        {canEditText && <button type="button" onClick={onEditText} className="flex h-9 items-center gap-1 rounded-lg px-2 text-xs text-white/85 hover:bg-white/15" title="Editar texto"><Pencil className="h-3.5 w-3.5" /> Editar</button>}
        {isImage && <button type="button" onClick={() => setImageOpen((open) => !open)} className="flex h-9 items-center gap-1 rounded-lg px-2 text-xs text-white/85 hover:bg-white/15" title="Trocar imagem"><ImagePlus className="h-3.5 w-3.5" /> Imagem</button>}
        {!isImage && <label className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15" title="Cor deste elemento"><span className="sr-only">Cor deste elemento</span><input aria-label="Cor deste elemento" type="color" value={displayedColor} onChange={(event) => onLayoutChange({ color: event.target.value })} className="h-7 w-7 cursor-pointer rounded border border-white/40 bg-transparent p-0" /></label>}
        <button type="button" onClick={onReset} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/75 hover:bg-white/15 hover:text-white" title="Redefinir ajustes deste elemento" aria-label="Redefinir ajustes deste elemento"><RotateCcw className="h-3.5 w-3.5" /></button>
        {imageOpen && <input aria-label="URL da imagem" type="url" defaultValue={imageSource} onBlur={(event) => { if (imageSource && event.target.value && event.target.value !== imageSource) onImageChange(imageSource, event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className="absolute left-0 top-12 w-72 rounded-lg border border-white/20 bg-[#171717] px-3 py-2 text-sm text-white outline-none focus:border-white/60" placeholder="Cole a URL da imagem" />}
      </div>
      {handles.map(({ name, style }) => (
        <button key={name} type="button" aria-label={`Redimensionar ${name}`} title="Arraste para redimensionar" className={`pointer-events-auto absolute h-4 w-4 rounded-md border-2 border-[#111] bg-white shadow-lg touch-none ${style}`} onPointerDown={(event) => beginResize(event, name)} onPointerMove={resize} onPointerUp={(event) => { if (resizeRef.current?.pointerId === event.pointerId) { onInteractionEnd(resizeRef.current.changed); resizeRef.current = null; } }} onPointerCancel={() => { onInteractionEnd(resizeRef.current?.changed ?? false); resizeRef.current = null; }} />
      ))}
    </div>
  );
}
