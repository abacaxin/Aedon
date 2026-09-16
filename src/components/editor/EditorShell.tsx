import { useCallback, useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useProject } from "@/lib/editor/store";
import { getVariant, RENDERERS } from "@/lib/editor/sections";
import { downloadHTML } from "@/lib/editor/export";
import {
  decodeLink,
  resolveHref,
  findPageOfSection,
  sectionAnchorId,
  type LinkOptions,
} from "@/lib/editor/links";
import { SectionLibrary } from "./SectionLibrary";
import { PropertiesPanel } from "./PropertiesPanel";
import { Canvas } from "./Canvas";
import { PageTabs } from "./PageTabs";
import { FontLoader } from "./FontLoader";
import { useLibraryPrefs } from "@/hooks/use-library-prefs";
import { useCanvasDrag } from "@/hooks/use-canvas-drag";
import { useCloudSync, type SyncStatus } from "@/lib/supabase/sync";
import { signOut } from "@/lib/supabase/auth";
import type { User } from "@supabase/supabase-js";
import type { LinkResolver } from "./blocks/_link";
import type { Device } from "@/lib/editor/types";
import {
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Rocket,
  Download,
  Menu,
  Settings2,
  Eye,
  Home,
  Pencil,
  GripVertical,
  LogOut,
} from "lucide-react";
import { AedonMark } from "./AedonMark";

/**
 * Scroll the outer canvas container so the given section (rendered inside the preview
 * iframe) comes into view. The iframe is full-height and doesn't scroll internally.
 */
function scrollCanvasToSection(sectionId: string) {
  const iframe = document.querySelector("iframe");
  const main = iframe?.closest("main");
  const el = iframe?.contentDocument?.getElementById(sectionAnchorId(sectionId));
  if (!iframe || !main || !el) return;
  const iframeTop = iframe.getBoundingClientRect().top;
  const mainTop = main.getBoundingClientRect().top;
  const elTop = el.getBoundingClientRect().top; // relative to the (unscrolled) iframe viewport
  // Instant, not smooth: smooth scrolling on this container is unreliable while the
  // iframe is being re-measured, and silently no-ops in some engines.
  main.scrollTop = main.scrollTop + (iframeTop - mainTop) + elTop - 12;
}

export function EditorShell({ user }: { user: User | null }) {
  const store = useProject();
  const syncStatus = useCloudSync({
    userId: user?.id ?? null,
    project: store.project,
    onLoad: store.replaceProject,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [previewMode, setPreviewMode] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [propsOpen, setPropsOpen] = useState(true);

  const sections = store.activePage.sections;
  const libraryPrefs = useLibraryPrefs();

  // Adding a component: from a click/tap/keyboard (append) or a drag-drop (at an index).
  const activateVariant = useCallback(
    (variantId: string) => {
      store.addSection(variantId);
      libraryPrefs.pushRecent(variantId);
      if (isNarrow) setLibraryOpen(false);
    },
    [store, libraryPrefs, isNarrow],
  );

  const canvasDrag = useCanvasDrag({
    getIframe: () => document.querySelector("iframe"),
    onDrop: (variantId, index) => {
      store.addSection(variantId, index);
      libraryPrefs.pushRecent(variantId);
    },
    onTap: activateVariant,
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setIsNarrow(mq.matches);
      if (mq.matches) {
        setLibraryOpen(false);
        setPropsOpen(false);
      } else {
        setLibraryOpen(true);
        setPropsOpen(true);
      }
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const selected = useMemo(
    () => sections.find((s) => s.id === selectedId) ?? null,
    [sections, selectedId],
  );

  // Selection is per-page; clear it when the active page changes.
  useEffect(() => {
    setSelectedId(null);
  }, [store.activePageId]);

  // Auto-open properties on narrow when a section is selected
  useEffect(() => {
    if (isNarrow && selected) setPropsOpen(true);
  }, [selected, isNarrow]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        store.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  const linkOptions = useMemo<LinkOptions>(
    () => ({
      pages: store.project.pages.map((p) => ({ id: p.id, name: p.name })),
      sections: store.project.pages.flatMap((p) =>
        p.sections.map((s) => ({
          id: s.id,
          label: `${p.name} · ${getVariant(s.variantId)?.name ?? s.variantId}`,
        })),
      ),
    }),
    [store.project.pages],
  );

  // Resolve link targets. In edit mode links are inert (returns null → clicks select).
  const resolveLink = useCallback<LinkResolver>(
    (encoded) => {
      if (!previewMode) return null;
      const target = decodeLink(encoded);
      if (target.kind === "none") return null;
      const href = resolveHref(store.project, store.activePageId, target);
      return {
        href,
        navigate: (e) => {
          e.preventDefault();
          if (target.kind === "url") {
            if (target.url) window.open(target.url, "_blank", "noopener,noreferrer");
            return;
          }
          if (target.kind === "page") {
            store.setActivePage(target.pageId);
            const main = document.querySelector("main");
            if (main) main.scrollTop = 0;
            return;
          }
          // section: the iframe renders at full content height and does not scroll
          // internally, so scroll the outer canvas container to bring the target in view.
          const page = findPageOfSection(store.project.pages, target.sectionId);
          if (!page) return;
          if (page.id !== store.activePageId) {
            store.setActivePage(page.id);
            setTimeout(() => scrollCanvasToSection(target.sectionId), 90);
          } else {
            scrollCanvasToSection(target.sectionId);
          }
        },
      };
    },
    [previewMode, store],
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      <FontLoader typography={store.project.typography} />
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-2 sm:px-4 gap-2 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {isNarrow && (
            <button
              onClick={() => setLibraryOpen((v) => !v)}
              className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center shrink-0"
              title="Biblioteca / camadas"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <Link
            to="/"
            title="Voltar para a home"
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-white/5 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <AedonMark className="w-4 h-4 text-foreground shrink-0" />
            <div>
              <div className="text-sm font-medium font-display leading-tight tracking-[0.15em]">
                AEDON
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                Website Builder
              </div>
            </div>
          </div>
          <div className="hidden sm:block mx-2 h-6 w-px bg-border" />
          <input
            value={store.project.name}
            onChange={(e) => store.renameProject(e.target.value)}
            className="bg-transparent text-sm font-medium px-2 py-1 rounded hover:bg-white/5 focus:bg-white/5 outline-none min-w-0 w-24 sm:w-40"
          />
        </div>

        <div className="flex items-center gap-1 bg-secondary rounded-full p-1 shrink-0">
          <DeviceBtn
            active={device === "desktop"}
            onClick={() => setDevice("desktop")}
            Icon={Monitor}
          />
          <DeviceBtn
            active={device === "tablet"}
            onClick={() => setDevice("tablet")}
            Icon={Tablet}
          />
          <DeviceBtn
            active={device === "mobile"}
            onClick={() => setDevice("mobile")}
            Icon={Smartphone}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setPreviewMode((v) => !v)}
            className={`h-9 px-3 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors border ${
              previewMode
                ? "bg-foreground/10 border-foreground/30 text-foreground"
                : "border-white/10 hover:border-white/30 hover:bg-white/5 text-foreground"
            }`}
            title={previewMode ? "Voltar à edição" : "Pré-visualizar (links navegam)"}
          >
            {previewMode ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{previewMode ? "Editar" : "Prévia"}</span>
          </button>
          <button
            onClick={store.undo}
            className="hidden sm:flex w-8 h-8 rounded-lg hover:bg-white/5 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Desfazer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={store.redo}
            className="hidden sm:flex w-8 h-8 rounded-lg hover:bg-white/5 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Refazer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => downloadHTML(store.project, store.activePageId)}
            className="h-9 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium border border-white/10 hover:border-white/30 hover:bg-white/5 text-foreground flex items-center gap-2 transition-colors"
            title="Exportar HTML da página atual"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button className="h-9 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium bg-primary text-primary-foreground flex items-center gap-2 transition-colors hover:bg-primary/90">
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Publicar</span>
          </button>
          {user && (
            <AccountBadge email={user.email ?? ""} status={syncStatus} onSignOut={signOut} />
          )}
          {isNarrow && (
            <button
              onClick={() => setPropsOpen((v) => !v)}
              className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center"
              title="Propriedades"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <PageTabs
        pages={store.project.pages}
        activePageId={store.activePageId}
        onSelect={store.setActivePage}
        onAdd={store.addPage}
        onRename={store.renamePage}
        onDuplicate={store.duplicatePage}
        onDelete={store.removePage}
        onMove={store.movePage}
      />

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {!previewMode && (!isNarrow || libraryOpen) && (
          <SectionLibrary
            open={libraryOpen}
            onToggle={() => setLibraryOpen((v) => !v)}
            onAdd={activateVariant}
            sections={sections}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRemove={store.removeSection}
            onDuplicate={store.duplicateSection}
            onToggleHidden={store.toggleHidden}
            onMove={store.moveSection}
            onReorder={store.reorderSections}
            prefs={libraryPrefs}
            drag={{ start: canvasDrag.start }}
            overlay={isNarrow}
            onClose={() => setLibraryOpen(false)}
          />
        )}

        <Canvas
          device={device}
          sections={sections}
          selectedId={selectedId}
          onSelect={setSelectedId}
          renderers={RENDERERS}
          typography={store.project.typography}
          previewMode={previewMode}
          resolveLink={resolveLink}
          dropIndex={canvasDrag.dropIndex}
          dragging={canvasDrag.variantId !== null}
        />

        {!previewMode && (!isNarrow || propsOpen) && (
          <PropertiesPanel
            instance={selected}
            variant={selected ? (getVariant(selected.variantId) ?? null) : null}
            typography={store.project.typography}
            linkOptions={linkOptions}
            project={store.project}
            onToggleBillingAddon={store.toggleBillingAddon}
            onChange={(k, v) => selected && store.updateProp(selected.id, k, v)}
            onApplyColorsToAll={() => selected && store.applyColorsToAllSections(selected.id)}
            canApplyColorsToAll={sections.length > 1}
            onListAdd={(k) => selected && store.addListItem(selected.id, k)}
            onListRemove={(k, itemId) => selected && store.removeListItem(selected.id, k, itemId)}
            onListChange={(k, itemId, field, value) =>
              selected && store.updateListItem(selected.id, k, itemId, field, value)
            }
            onListMove={(k, itemId, dir) =>
              selected && store.moveListItem(selected.id, k, itemId, dir)
            }
            onTypographyChange={store.updateTypography}
            open={propsOpen}
            onToggle={() => setPropsOpen((v) => !v)}
            overlay={isNarrow}
            onClose={() => setPropsOpen(false)}
          />
        )}
      </div>

      {canvasDrag.variantId && canvasDrag.point && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-2xl backdrop-blur"
          style={{ left: canvasDrag.point.x + 14, top: canvasDrag.point.y + 14 }}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          {getVariant(canvasDrag.variantId)?.name ?? "Componente"}
        </div>
      )}
    </div>
  );
}

function AccountBadge({
  email,
  status,
  onSignOut,
}: {
  email: string;
  status: SyncStatus;
  onSignOut: () => void;
}) {
  const label: Record<SyncStatus, string> = {
    idle: "",
    loading: "Carregando…",
    saving: "Salvando…",
    saved: "Salvo na nuvem",
    error: "Erro ao salvar",
  };
  const dot =
    status === "error"
      ? "bg-destructive"
      : status === "saving" || status === "loading"
        ? "bg-yellow-400 animate-pulse"
        : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-border">
      <div className="hidden md:flex items-center gap-1.5" title={label[status]}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-[11px] text-muted-foreground max-w-[140px] truncate">{email}</span>
      </div>
      <button
        onClick={onSignOut}
        className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        title={`${email} · Sair`}
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

function DeviceBtn({
  active,
  onClick,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
