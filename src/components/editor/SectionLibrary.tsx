import { useEffect, useMemo, useRef, useState } from "react";
import { VARIANTS, RENDERERS, CATEGORY_ORDER, getVariant } from "@/lib/editor/sections";
import type { PropMap, SectionInstance, SectionVariant, LibraryCategory } from "@/lib/editor/types";
import type { useLibraryPrefs } from "@/hooks/use-library-prefs";
import type { DragState } from "@/hooks/use-canvas-drag";
import { PAGE_PRESETS, type PagePreset } from "@/lib/editor/presets";

type LibraryPrefs = ReturnType<typeof useLibraryPrefs>;
type DragStart = Pick<DragState, "start">;
import {
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
  Layers,
  LibraryBig,
  GripVertical,
  Search,
  Star,
  Sparkles,
  Clock,
  X,
  PanelTop,
  Rocket,
  LayoutGrid,
  Megaphone,
  PanelBottom,
  type LucideIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  open: boolean;
  onToggle: () => void;
  onAdd: (variantId: string) => void;
  onInsertPreset: (preset: PagePreset, destination: "current" | "new") => void;
  sections: SectionInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReorder: (fromId: string, toId: string) => void;
  prefs: LibraryPrefs;
  drag: DragStart;
  overlay?: boolean;
  onClose?: () => void;
}

export function SectionLibrary({
  open,
  onToggle,
  onAdd,
  onInsertPreset,
  sections,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
  onToggleHidden,
  onMove,
  onReorder,
  prefs,
  drag,
  overlay,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"layers" | "library" | "presets">("library");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!open) {
    return (
      <div className="w-12 border-r border-border bg-card flex flex-col items-center py-3 gap-2 shrink-0">
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-lg border border-border hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir biblioteca"
          aria-label="Abrir biblioteca"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  const asideCls = overlay
    ? "absolute inset-y-0 left-0 z-30 w-72 max-w-[92vw] border-r border-border bg-card shadow-2xl flex flex-col"
    : "w-72 shrink-0 border-r border-border bg-card flex flex-col";

  return (
    <>
      {overlay && <div className="absolute inset-0 z-20 bg-black/50" onClick={onClose} />}
      <aside className={`${asideCls} editor-library-in`} aria-label="Biblioteca e camadas">
        <div className="shrink-0 border-b border-border px-3 pb-3 pt-4">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">CONSTRUIR</p>
              <h2 className="text-base font-semibold leading-none text-foreground">Biblioteca</h2>
            </div>
            <button
              onClick={overlay ? onClose : onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              title="Fechar biblioteca"
              aria-label="Fechar biblioteca"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          <div role="tablist" aria-label="Biblioteca do editor" className="grid grid-cols-3 gap-1 text-[11px]">
            <button
              onClick={() => setTab("layers")}
              role="tab"
              aria-selected={tab === "layers"}
              className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 transition-all ${tab === "layers" ? "border-foreground/30 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <Layers className="w-3.5 h-3.5" /> Camadas
            </button>
            <button
              onClick={() => setTab("library")}
              role="tab"
              aria-selected={tab === "library"}
              className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 transition-all ${tab === "library" ? "border-foreground/30 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <LibraryBig className="w-3.5 h-3.5" /> Componentes
            </button>
            <button onClick={() => setTab("presets")} role="tab" aria-selected={tab === "presets"} className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 transition-all ${tab === "presets" ? "border-foreground/30 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
              <LayoutGrid className="w-3.5 h-3.5" /> Presets
            </button>
          </div>
        </div>

        <div role="tabpanel" className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {tab === "presets" ? (
            <PresetBrowser sections={sections} onInsert={onInsertPreset} />
          ) : tab === "layers" ? (
            <>
              {sections.length > 1 && (
                <div className="px-1 pb-2 text-[11px] text-muted-foreground">
                  Arraste <GripVertical className="inline w-3 h-3 -mt-0.5" /> para reordenar as
                  seções da página.
                </div>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {sections.map((s, i) => (
                      <SortableLayer
                        key={s.id}
                        s={s}
                        index={i}
                        total={sections.length}
                        active={s.id === selectedId}
                        onSelect={() => onSelect(s.id)}
                        onMove={onMove}
                        onToggleHidden={onToggleHidden}
                        onDuplicate={onDuplicate}
                        onRemove={onRemove}
                      />
                    ))}
                    {sections.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-8">
                        Adicione seções da biblioteca
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <LibraryBrowser prefs={prefs} drag={drag} onAdd={onAdd} />
          )}
        </div>
      </aside>
    </>
  );
}

function PresetBrowser({ sections, onInsert }: { sections: SectionInstance[]; onInsert: (preset: PagePreset, destination: "current" | "new") => void }) {
  const [active, setActive] = useState<PagePreset | null>(null);
  if (active) {
    return (
      <div className="space-y-3">
        <button onClick={() => setActive(null)} className="flex min-h-9 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Todos os presets</button>
        <div>
          <h3 className="text-sm font-semibold">{active.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{active.description}</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          {active.sectionIds.map((id) => <div key={id} className="h-[54px] overflow-hidden border-b border-black/10 last:border-0"><VariantPreview variantId={id} defaults={getVariant(id)?.defaults ?? {}} scale={0.18} height={54} /></div>)}
        </div>
        <p className="text-[11px] text-muted-foreground">{active.sectionIds.length} blocos editáveis, adicionados como seções comuns.</p>
        <div className="space-y-2 border-t border-border pt-3">
          <button onClick={() => onInsert(active, "new")} className="min-h-10 w-full rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Criar nova página</button>
          <button onClick={() => onInsert(active, "current")} className="min-h-10 w-full rounded-lg border border-border px-3 text-xs font-medium hover:bg-white/5">{sections.length ? "Adicionar à página atual" : "Usar nesta página vazia"}</button>
          {sections.length > 0 && <p className="text-center text-[10px] leading-relaxed text-muted-foreground">Adicionar à página atual preserva os blocos existentes e insere o preset ao final.</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="px-1"><p className="text-xs font-medium">Comece com uma composição</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Cada preset é feito de blocos independentes que você pode editar e reorganizar.</p></div>
      {PAGE_PRESETS.map((preset) => (
        <div key={preset.id} role="button" tabIndex={0} onClick={() => setActive(preset)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActive(preset); } }} className="group w-full cursor-pointer overflow-hidden rounded-lg border border-border text-left transition-colors hover:border-foreground/35 hover:bg-white/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground">
          <div className="h-[86px] overflow-hidden bg-white">
            {preset.sectionIds.slice(0, 3).map((id) => <div key={id} className="h-[30px] overflow-hidden border-b border-black/10"><VariantPreview variantId={id} defaults={getVariant(id)?.defaults ?? {}} scale={0.16} height={30} /></div>)}
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5"><div className="min-w-0 flex-1"><p className="text-xs font-medium">{preset.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{preset.sectionIds.length} blocos</p></div><ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" /></div>
        </div>
      ))}
    </div>
  );
}

const CATEGORY_ICON: Record<LibraryCategory, LucideIcon> = {
  Header: PanelTop,
  Hero: Rocket,
  Corpo: LayoutGrid,
  Conversão: Megaphone,
  Footer: PanelBottom,
};

type SectionKey = LibraryCategory | "__fav" | "__recent";
type HoverPreview = { variant: SectionVariant; left: number; top: number };

function LibraryBrowser({
  prefs,
  drag,
  onAdd,
}: {
  prefs: LibraryPrefs;
  drag: DragStart;
  onAdd: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const [previewing, setPreviewing] = useState<SectionVariant | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const q = query.trim().toLowerCase();

  const matches = (v: SectionVariant) =>
    !q ||
    v.name.toLowerCase().includes(q) ||
    v.description.toLowerCase().includes(q) ||
    (v.category ?? "").toLowerCase().includes(q);

  const resolve = (ids: string[]) =>
    ids.map((id) => getVariant(id)).filter((v): v is SectionVariant => !!v);

  // Unfiltered, just for the counts shown on each clickable row.
  const favoriteItems = useMemo(() => resolve(prefs.favorites), [prefs.favorites]);
  const recentItems = useMemo(() => resolve(prefs.recents), [prefs.recents]);
  const byCategory = useMemo(
    () => CATEGORY_ORDER.map((cat) => ({ cat, items: VARIANTS.filter((v) => v.category === cat) })),
    [],
  );

  const searchResults = q ? VARIANTS.filter(matches) : [];

  const searchBar = (
    <div className="sticky top-0 z-10 -mx-2 -mt-2 px-2 pt-2 pb-2 bg-card/95 backdrop-blur-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar componentes…"
          className="w-full text-sm bg-input/60 border border-border rounded-lg pl-8 pr-8 py-2 outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
            title="Limpar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const cardGrid = (items: SectionVariant[]) => (
    <div className="grid grid-cols-1 gap-2">
      {items.map((v) => (
        <VariantCard
          key={v.id}
          v={v}
          drag={drag}
          onAdd={onAdd}
          onPreview={setPreviewing}
          onHoverPreview={(variant, rect) => {
            if (!variant || !rect) {
              setHoverPreview(null);
              return;
            }
            const preferredLeft = rect.right + 12;
            const left =
              preferredLeft + 372 <= window.innerWidth
                ? preferredLeft
                : Math.max(12, rect.left - 372);
            setHoverPreview({
              variant,
              left,
              top: Math.max(12, Math.min(rect.top, window.innerHeight - 300)),
            });
          }}
          isFavorite={prefs.favorites.includes(v.id)}
          onToggleFavorite={() => prefs.toggleFavorite(v.id)}
        />
      ))}
    </div>
  );

  // Search overrides navigation entirely: flat results across every category.
  if (q) {
    return (
      <>
      <div>
        {searchBar}
        <div className="mb-2 px-1 text-[11px] text-muted-foreground">
          {searchResults.length} resultado{searchResults.length === 1 ? "" : "s"} para “{query}”
        </div>
        {searchResults.length > 0 ? (
          cardGrid(searchResults)
        ) : (
          <div className="text-xs text-muted-foreground text-center py-10">
            Nada encontrado para “{query}”.
          </div>
        )}
      </div>
      {hoverPreview && <HoverPreviewCard preview={hoverPreview} />}
      {previewing && <PreviewDialog variant={previewing} onClose={() => setPreviewing(null)} />}
      </>
    );
  }

  // Drilled into one section: show its components with a way back.
  if (openSection) {
    const isCat = openSection !== "__fav" && openSection !== "__recent";
    const items = isCat
      ? (byCategory.find((g) => g.cat === openSection)?.items ?? [])
      : openSection === "__fav"
        ? favoriteItems
        : recentItems;
    const label = isCat ? openSection : openSection === "__fav" ? "Favoritos" : "Recentes";
    const Icon = isCat ? CATEGORY_ICON[openSection] : openSection === "__fav" ? Star : Clock;

    return (
      <>
      <div>
        <button
          onClick={() => setOpenSection(null)}
          className="mb-3 flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Categorias
        </button>
        {searchBar}
        <div className="mb-3 flex items-center gap-2 px-1">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <span className="ml-auto text-[11px] text-muted-foreground">{items.length}</span>
        </div>
        {items.length > 0 ? (
          cardGrid(items)
        ) : (
          <div className="text-xs text-muted-foreground text-center py-10">
            {openSection === "__fav"
              ? "Toque na estrela de um componente para favoritá-lo."
              : "Os últimos componentes que você adicionar aparecem aqui."}
          </div>
        )}
      </div>
      {hoverPreview && <HoverPreviewCard preview={hoverPreview} />}
      {previewing && <PreviewDialog variant={previewing} onClose={() => setPreviewing(null)} />}
      </>
    );
  }

  // Default: the list of clickable sections (categories + favorites/recents).
  return (
    <>
    <div>
      {searchBar}
      <div className="mb-3 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">Adicione uma seção</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">Escolha uma categoria, clique em um componente para adicionar ou arraste para posicionar na página.</p>
      </div>
      <div className="space-y-1.5">
        {favoriteItems.length > 0 && (
          <SectionRow
            Icon={Star}
            label="Favoritos"
            count={favoriteItems.length}
            onClick={() => setOpenSection("__fav")}
          />
        )}
        {recentItems.length > 0 && (
          <SectionRow
            Icon={Clock}
            label="Recentes"
            count={recentItems.length}
            onClick={() => setOpenSection("__recent")}
          />
        )}
        {(favoriteItems.length > 0 || recentItems.length > 0) && (
          <div className="h-px bg-border my-2" />
        )}
        {byCategory.map(({ cat, items }) => (
          <SectionRow
            key={cat}
            Icon={CATEGORY_ICON[cat]}
            label={cat}
            count={items.length}
            onClick={() => setOpenSection(cat)}
          />
        ))}
      </div>
    </div>
    {hoverPreview && <HoverPreviewCard preview={hoverPreview} />}
    {previewing && <PreviewDialog variant={previewing} onClose={() => setPreviewing(null)} />}
    </>
  );
}

function SectionRow({
  Icon,
  label,
  count,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex min-h-[62px] items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/35 hover:bg-secondary/80 focus-visible:border-foreground/50"
    >
      <div className="w-9 h-9 rounded-lg bg-white/5 group-hover:bg-foreground/10 flex items-center justify-center shrink-0 transition-colors">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">
          {count} componente{count === 1 ? "" : "s"}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function VariantCard({
  v,
  drag,
  onAdd,
  onPreview,
  onHoverPreview,
  isFavorite,
  onToggleFavorite,
}: {
  v: SectionVariant;
  drag: DragStart;
  onAdd: (id: string) => void;
  onPreview: (variant: SectionVariant) => void;
  onHoverPreview: (variant: SectionVariant | null, rect?: DOMRect) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHoverPreview = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    onHoverPreview(null);
  };

  useEffect(() => () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  return (
    <div
      // Pointer press may become a drag-to-canvas or, if released in place, a plain add.
      onPointerDown={(e) => drag.start(v.id, e)}
      onMouseEnter={(event) => {
        const card = event.currentTarget;
        hoverTimer.current = setTimeout(() => {
          hoverTimer.current = null;
          onHoverPreview(v, card.getBoundingClientRect());
        }, 900);
      }}
      onMouseLeave={cancelHoverPreview}
      style={{ touchAction: "pan-y" }}
      className="group relative overflow-hidden rounded-xl border border-border bg-secondary/30 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/35 hover:shadow-lg cursor-grab active:cursor-grabbing select-none"
    >
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-1.5 left-1.5 z-10 w-8 h-8 rounded-md bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors"
        title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Star
          className={`w-3.5 h-3.5 ${isFavorite ? "fill-[#FFCC00] text-[#FFCC00]" : "text-white/60"}`}
        />
      </button>
      {v.premium && (
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 rounded-md bg-foreground text-background backdrop-blur px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
          <Sparkles className="w-2.5 h-2.5" /> Pro
        </div>
      )}
      <VariantPreview variantId={v.id} defaults={v.defaults} />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onPreview(v);
        }}
        className={`absolute right-1.5 ${v.premium ? "top-9" : "top-1.5"} z-10 h-8 rounded-md bg-black/60 px-2 text-xs font-medium text-white/85 backdrop-blur hover:bg-black/80 transition-colors flex items-center gap-1`}
        title={`Ver prévia de ${v.name}`}
      >
        <Eye className="w-3 h-3" /> Prévia
      </button>
      <div className="p-2.5 border-t border-white/5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{v.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{v.description}</div>
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(v.id);
            }}
            className="min-h-10 shrink-0 rounded-md border border-white/20 px-3 text-xs font-semibold text-foreground hover:bg-foreground hover:border-foreground hover:text-background transition-colors"
            title={`Adicionar ${v.name}`}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantPreview({
  variantId,
  defaults,
  scale = 0.2,
  height = 120,
}: {
  variantId: string;
  defaults: PropMap;
  scale?: number;
  height?: number;
}) {
  const R = RENDERERS[variantId];
  if (!R) return null;
  // Render at 1280px width, scale down to fit ~256px card width.
  return (
    <div
      className="relative w-full overflow-hidden bg-black pointer-events-none"
      style={{ height }}
      aria-hidden
    >
      <div
        style={{
          width: 1280,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <R props={defaults} />
      </div>
    </div>
  );
}

function PreviewDialog({ variant, onClose }: { variant: SectionVariant; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Prévia de ${variant.name}`}
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-card shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{variant.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{variant.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            title="Fechar prévia"
            aria-label="Fechar prévia"
          >
            <X className="mx-auto w-4 h-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-auto bg-black p-3">
          <div className="overflow-hidden rounded-lg border border-white/10">
            <VariantPreview variantId={variant.id} defaults={variant.defaults} scale={0.7} height={510} />
          </div>
        </div>
      </section>
    </div>
  );
}

function HoverPreviewCard({ preview }: { preview: HoverPreview }) {
  return (
    <div
      className="pointer-events-none fixed z-[60] w-[360px] overflow-hidden rounded-xl border border-white/15 bg-card shadow-2xl"
      style={{ left: preview.left, top: preview.top }}
      aria-hidden
    >
      <VariantPreview variantId={preview.variant.id} defaults={preview.variant.defaults} scale={0.28} height={230} />
      <div className="border-t border-white/10 px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">{preview.variant.name}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Use “Prévia” no cartão para ampliar</p>
      </div>
    </div>
  );
}

function SortableLayer({
  s,
  index,
  total,
  active,
  onSelect,
  onMove,
  onToggleHidden,
  onDuplicate,
  onRemove,
}: {
  s: SectionInstance;
  index: number;
  total: number;
  active: boolean;
  onSelect: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onToggleHidden: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const variant = VARIANTS.find((v) => v.id === s.variantId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: s.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group rounded-lg border transition-all cursor-pointer ${
        active
          ? "border-foreground/40 bg-foreground/10"
          : "border-transparent hover:border-white/10 hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-1.5 p-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
          title="Arrastar"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className={`text-xs font-medium truncate ${s.hidden ? "text-muted-foreground line-through" : "text-foreground"}`}
          >
            {variant?.name}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {(
              Object.values(s.props).find((v) => typeof v === "string" && v.trim()) as
                string | undefined
            )?.slice(0, 40) ?? ""}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              onMove(s.id, -1);
            }}
            disabled={index === 0}
            title="Mover para cima"
          >
            <ChevronUp className="w-3 h-3" />
          </IconBtn>
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              onMove(s.id, 1);
            }}
            disabled={index === total - 1}
            title="Mover para baixo"
          >
            <ChevronDown className="w-3 h-3" />
          </IconBtn>
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              onToggleHidden(s.id);
            }}
            title={s.hidden ? "Mostrar seção" : "Ocultar seção"}
          >
            {s.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </IconBtn>
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(s.id);
            }}
            title="Duplicar seção"
          >
            <Copy className="w-3 h-3" />
          </IconBtn>
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              onRemove(s.id);
            }}
            title="Remover seção"
          >
            <Trash2 className="w-3 h-3" />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

// Keep arrayMove import used to avoid tree-shaking removing it (utility re-export).
void arrayMove;

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors"
    >
      {children}
    </button>
  );
}
