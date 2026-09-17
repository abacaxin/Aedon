import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Page, ProjectState, PropValue, SectionInstance, Typography } from "./types";
import { createInstance, cloneProps, getVariant } from "./sections";
import { DEFAULT_TYPOGRAPHY } from "./typography";
import { uuid } from "./id";
import { blankProject, loadLocalProject, saveLocalProject } from "./projects";

const MAX_HISTORY = 50;

function slugify(name: string): string {
  // Coerced: a stray non-string (e.g. an event handler arg) must never crash the editor.
  return (
    String(name ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "pagina"
  );
}

function uniqueSlug(base: string, taken: string[]): string {
  let slug = base;
  let n = 2;
  while (taken.includes(slug)) slug = `${base}-${n++}`;
  return slug;
}

/** Tolerate older/partial saved shapes (incl. the pre-multi-page shape) so a load never crashes. */
function normalize(raw: unknown): ProjectState {
  const base = blankProject("Meu site");
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<ProjectState> & { sections?: SectionInstance[] };

  const cleanSections = (arr: unknown): SectionInstance[] =>
    Array.isArray(arr) ? (arr as SectionInstance[]).filter((s) => getVariant(s.variantId)) : [];

  let pages: Page[];
  if (Array.isArray(p.pages) && p.pages.length > 0) {
    pages = p.pages.map((pg, i) => ({
      id: pg.id || uuid(),
      name: pg.name || `Página ${i + 1}`,
      slug: pg.slug || slugify(pg.name || `pagina-${i + 1}`),
      sections: cleanSections(pg.sections),
    }));
  } else if (Array.isArray(p.sections)) {
    // Migrate the old single-page project into a "Home" page.
    pages = [{ id: uuid(), name: "Home", slug: "home", sections: cleanSections(p.sections) }];
  } else {
    pages = base.pages;
  }

  return {
    name: typeof p.name === "string" ? p.name : base.name,
    typography: { ...DEFAULT_TYPOGRAPHY, ...(p.typography ?? {}) },
    pages,
    billing: { addons: { ...(p.billing?.addons ?? {}) } },
  };
}

/** Generate a new list item from the variant's declared item defaults. */
function newListItem(variantId: string, key: string) {
  const field = getVariant(variantId)?.schema.find((f) => f.key === key);
  return { _id: uuid(), ...(field?.itemDefaults ?? {}) };
}

/** Manages a single project's editing state (undo history, active page, autosave).
 *  `projectId` selects which project this instance owns — the caller (route) should
 *  remount when it changes rather than expect a live re-target. */
export function useProject(projectId: string) {
  const [project, setProject] = useState<ProjectState>(() => blankProject("Meu site"));
  const [activePageId, setActivePageId] = useState<string>(() => project.pages[0].id);
  const [hydrated, setHydrated] = useState(false);
  const history = useRef<ProjectState[]>([]);
  const future = useRef<ProjectState[]>([]);

  // Keep active page id readable inside stable callbacks without stale closures.
  const activeRef = useRef(activePageId);
  activeRef.current = activePageId;

  // Load this project from localStorage on mount (or when switching projects).
  useEffect(() => {
    setHydrated(false);
    const loaded = loadLocalProject(projectId);
    const next = loaded ? normalize(loaded) : blankProject("Meu site");
    setProject(next);
    setActivePageId(next.pages[0].id);
    history.current = [];
    future.current = [];
    setHydrated(true);
  }, [projectId]);

  // Clamp active page if it no longer exists (e.g. after undo/redo/delete).
  useEffect(() => {
    if (!project.pages.some((p) => p.id === activePageId)) {
      setActivePageId(project.pages[0]?.id);
    }
  }, [project.pages, activePageId]);

  // Autosave
  useEffect(() => {
    if (!hydrated) return;
    saveLocalProject(projectId, project);
  }, [project, hydrated, projectId]);

  const commit = useCallback((updater: (prev: ProjectState) => ProjectState) => {
    setProject((prev) => {
      history.current.push(prev);
      if (history.current.length > MAX_HISTORY) history.current.shift();
      future.current = [];
      return updater(prev);
    });
  }, []);

  /** Apply a transform to the currently active page's section list. */
  const editActivePage = useCallback(
    (fn: (sections: SectionInstance[], page: Page) => SectionInstance[]) =>
      commit((p) => ({
        ...p,
        pages: p.pages.map((pg) =>
          pg.id === activeRef.current ? { ...pg, sections: fn(pg.sections, pg) } : pg,
        ),
      })),
    [commit],
  );

  // --- Section operations (scoped to the active page) -----------------------

  const addSection = useCallback(
    (variantId: string, atIndex?: number) =>
      editActivePage((sections) => {
        const inst = createInstance(variantId);
        const next = [...sections];
        if (atIndex === undefined) next.push(inst);
        else next.splice(atIndex, 0, inst);
        return next;
      }),
    [editActivePage],
  );

  const removeSection = useCallback(
    (id: string) => editActivePage((sections) => sections.filter((s) => s.id !== id)),
    [editActivePage],
  );

  const duplicateSection = useCallback(
    (id: string) =>
      editActivePage((sections) => {
        const idx = sections.findIndex((s) => s.id === id);
        if (idx < 0) return sections;
        const src = sections[idx];
        const copy = { ...src, id: uuid(), props: cloneProps(src.props) };
        const next = [...sections];
        next.splice(idx + 1, 0, copy);
        return next;
      }),
    [editActivePage],
  );

  const toggleHidden = useCallback(
    (id: string) =>
      editActivePage((sections) =>
        sections.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)),
      ),
    [editActivePage],
  );

  const moveSection = useCallback(
    (id: string, dir: -1 | 1) =>
      editActivePage((sections) => {
        const idx = sections.findIndex((s) => s.id === id);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= sections.length) return sections;
        const next = [...sections];
        [next[idx], next[target]] = [next[target], next[idx]];
        return next;
      }),
    [editActivePage],
  );

  const reorderSections = useCallback(
    (fromId: string, toId: string) =>
      editActivePage((sections) => {
        const from = sections.findIndex((s) => s.id === fromId);
        const to = sections.findIndex((s) => s.id === toId);
        if (from < 0 || to < 0 || from === to) return sections;
        const next = [...sections];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      }),
    [editActivePage],
  );

  const updateProp = useCallback(
    (id: string, key: string, value: PropValue) =>
      editActivePage((sections) =>
        sections.map((s) => (s.id === id ? { ...s, props: { ...s.props, [key]: value } } : s)),
      ),
    [editActivePage],
  );

  /** Copy bg/textColor/accent from one section onto every other section of the active page. */
  const applyColorsToAllSections = useCallback(
    (id: string) =>
      editActivePage((sections) => {
        const source = sections.find((s) => s.id === id);
        if (!source) return sections;
        const { bg, textColor, accent } = source.props;
        return sections.map((s) =>
          s.id === id ? s : { ...s, props: { ...s.props, bg, textColor, accent } },
        );
      }),
    [editActivePage],
  );

  // --- List (structural) operations -----------------------------------------

  const editSectionList = useCallback(
    (id: string, key: string, fn: (items: Record<string, string>[]) => Record<string, string>[]) =>
      editActivePage((sections) =>
        sections.map((s) => {
          if (s.id !== id) return s;
          const cur = Array.isArray(s.props[key]) ? (s.props[key] as Record<string, string>[]) : [];
          return { ...s, props: { ...s.props, [key]: fn(cur) as PropValue } };
        }),
      ),
    [editActivePage],
  );

  const addListItem = useCallback(
    (id: string, key: string) => {
      const page = project.pages.find((p) => p.id === activeRef.current);
      const section = page?.sections.find((s) => s.id === id);
      if (!section) return;
      editSectionList(id, key, (items) => [...items, newListItem(section.variantId, key)]);
    },
    [project.pages, editSectionList],
  );

  const removeListItem = useCallback(
    (id: string, key: string, itemId: string) =>
      editSectionList(id, key, (items) => items.filter((it) => it._id !== itemId)),
    [editSectionList],
  );

  const updateListItem = useCallback(
    (id: string, key: string, itemId: string, field: string, value: string) =>
      editSectionList(id, key, (items) =>
        items.map((it) => (it._id === itemId ? { ...it, [field]: value } : it)),
      ),
    [editSectionList],
  );

  const moveListItem = useCallback(
    (id: string, key: string, itemId: string, dir: -1 | 1) =>
      editSectionList(id, key, (items) => {
        const idx = items.findIndex((it) => it._id === itemId);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= items.length) return items;
        const next = [...items];
        [next[idx], next[target]] = [next[target], next[idx]];
        return next;
      }),
    [editSectionList],
  );

  // --- Page operations -------------------------------------------------------

  const addPage = useCallback(
    (name = "Nova página") => {
      const id = uuid();
      commit((p) => {
        const slug = uniqueSlug(
          slugify(name),
          p.pages.map((pg) => pg.slug),
        );
        return { ...p, pages: [...p.pages, { id, name, slug, sections: [] }] };
      });
      setActivePageId(id);
    },
    [commit],
  );

  const duplicatePage = useCallback(
    (id: string) => {
      const newId = uuid();
      commit((p) => {
        const idx = p.pages.findIndex((pg) => pg.id === id);
        if (idx < 0) return p;
        const src = p.pages[idx];
        const slug = uniqueSlug(
          slugify(`${src.name} copia`),
          p.pages.map((pg) => pg.slug),
        );
        const copy: Page = {
          id: newId,
          name: `${src.name} (cópia)`,
          slug,
          sections: src.sections.map((s) => ({
            ...s,
            id: uuid(),
            props: cloneProps(s.props),
          })),
        };
        const pages = [...p.pages];
        pages.splice(idx + 1, 0, copy);
        return { ...p, pages };
      });
      setActivePageId(newId);
    },
    [commit],
  );

  const removePage = useCallback(
    (id: string) =>
      commit((p) => {
        if (p.pages.length <= 1) return p; // always keep at least one page
        return { ...p, pages: p.pages.filter((pg) => pg.id !== id) };
      }),
    [commit],
  );

  const renamePage = useCallback(
    (id: string, name: string) =>
      commit((p) => {
        const others = p.pages.filter((pg) => pg.id !== id).map((pg) => pg.slug);
        return {
          ...p,
          pages: p.pages.map((pg) =>
            pg.id === id ? { ...pg, name, slug: uniqueSlug(slugify(name), others) } : pg,
          ),
        };
      }),
    [commit],
  );

  const movePage = useCallback(
    (id: string, dir: -1 | 1) =>
      commit((p) => {
        const idx = p.pages.findIndex((pg) => pg.id === id);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= p.pages.length) return p;
        const pages = [...p.pages];
        [pages[idx], pages[target]] = [pages[target], pages[idx]];
        return { ...p, pages };
      }),
    [commit],
  );

  // --- Typography ------------------------------------------------------------

  const updateTypography = useCallback(
    (patch: Partial<Typography>) =>
      commit((p) => ({ ...p, typography: { ...p.typography, ...patch } })),
    [commit],
  );

  const renameProject = useCallback((name: string) => commit((p) => ({ ...p, name })), [commit]);

  // --- Billing -----------------------------------------------------------------

  const toggleBillingAddon = useCallback(
    (key: string) =>
      commit((p) => ({
        ...p,
        billing: { ...p.billing, addons: { ...p.billing.addons, [key]: !p.billing.addons[key] } },
      })),
    [commit],
  );

  /** Replace the whole project (e.g. loading it from the cloud). Clears undo history. */
  const replaceProject = useCallback((next: ProjectState) => {
    const normalized = normalize(next);
    history.current = [];
    future.current = [];
    setProject(normalized);
    setActivePageId(normalized.pages[0].id);
  }, []);

  const undo = useCallback(() => {
    setProject((prev) => {
      const last = history.current.pop();
      if (!last) return prev;
      future.current.push(prev);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setProject((prev) => {
      const next = future.current.pop();
      if (!next) return prev;
      history.current.push(prev);
      return next;
    });
  }, []);

  const activePage = useMemo(
    () => project.pages.find((p) => p.id === activePageId) ?? project.pages[0],
    [project.pages, activePageId],
  );

  return {
    project,
    hydrated,
    activePage,
    activePageId: activePage.id,
    setActivePage: setActivePageId,
    addSection,
    removeSection,
    duplicateSection,
    toggleHidden,
    moveSection,
    reorderSections,
    updateProp,
    applyColorsToAllSections,
    addListItem,
    removeListItem,
    updateListItem,
    moveListItem,
    addPage,
    duplicatePage,
    removePage,
    renamePage,
    movePage,
    updateTypography,
    toggleBillingAddon,
    renameProject,
    replaceProject,
    undo,
    redo,
    canUndo: history.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
