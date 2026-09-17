/**
 * Local-only (localStorage) multi-project directory. Mirrors the shape of the
 * cloud `projects` table (lib/supabase/projects.ts) so the dashboard can render
 * the same way whether or not Supabase is configured.
 */
import type { ProjectState } from "./types";
import { uuid } from "./id";
import { DEFAULT_TYPOGRAPHY } from "./typography";
import { createInstance } from "./sections";

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string; // ISO timestamp
}

const INDEX_KEY = "aedon.projects.index.v1";
const projectKey = (id: string) => `aedon.project.${id}`;

// Pre-B0 single-project key, migrated into the index on first read.
const LEGACY_KEYS = ["sangre.project.v3", "sangre.project.v2"];

function readIndex(): ProjectSummary[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw) as ProjectSummary[];
  } catch {
    /* ignore malformed storage */
  }
  return [];
}

function writeIndex(list: ProjectSummary[]) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function starterSections() {
  return [
    createInstance("navbar.modern"),
    createInstance("hero.gradient"),
    createInstance("features.grid"),
    createInstance("testimonials.cards"),
    createInstance("cta.banner"),
    createInstance("footer.dark"),
  ];
}

export function blankProject(name: string): ProjectState {
  return {
    name,
    typography: { ...DEFAULT_TYPOGRAPHY },
    pages: [{ id: uuid(), name: "Home", slug: "home", sections: starterSections() }],
    billing: { addons: {} },
  };
}

/** One-time migration: a pre-multi-project save becomes the first entry in the index. */
function migrateLegacyIfNeeded(): ProjectSummary[] {
  let index = readIndex();
  if (index.length > 0) return index;
  if (localStorage.getItem(INDEX_KEY) !== null) return index; // already initialized, just empty

  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw) as ProjectState;
      const id = uuid();
      localStorage.setItem(projectKey(id), JSON.stringify(data));
      index = [{ id, name: data.name || "Meu site", updatedAt: new Date().toISOString() }];
      writeIndex(index);
      return index;
    } catch {
      /* ignore malformed legacy data */
    }
  }
  writeIndex([]); // mark as initialized so we don't re-check legacy keys every call
  return [];
}

export function listLocalProjects(): ProjectSummary[] {
  const index = migrateLegacyIfNeeded();
  return [...index].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadLocalProject(id: string): ProjectState | null {
  try {
    const raw = localStorage.getItem(projectKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as ProjectState;
  } catch {
    return null;
  }
}

export function saveLocalProject(id: string, state: ProjectState) {
  try {
    localStorage.setItem(projectKey(id), JSON.stringify(state));
  } catch {
    return;
  }
  const index = readIndex();
  const now = new Date().toISOString();
  const existing = index.find((p) => p.id === id);
  if (existing) {
    existing.name = state.name;
    existing.updatedAt = now;
  } else {
    index.push({ id, name: state.name, updatedAt: now });
  }
  writeIndex(index);
}

export function createLocalProject(name = "Novo projeto"): string {
  const id = uuid();
  saveLocalProject(id, blankProject(name));
  return id;
}

export function duplicateLocalProject(id: string): string | null {
  const src = loadLocalProject(id);
  if (!src) return null;
  const newId = uuid();
  saveLocalProject(newId, { ...src, name: `${src.name} (cópia)` });
  return newId;
}

export function renameLocalProject(id: string, name: string) {
  const state = loadLocalProject(id);
  if (!state) return;
  saveLocalProject(id, { ...state, name });
}

export function deleteLocalProject(id: string) {
  try {
    localStorage.removeItem(projectKey(id));
  } catch {
    /* ignore */
  }
  writeIndex(readIndex().filter((p) => p.id !== id));
}
