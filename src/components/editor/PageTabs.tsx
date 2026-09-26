import { useState } from "react";
import type { Page } from "@/lib/editor/types";
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight, Check, X, Pencil } from "lucide-react";

interface Props {
  pages: Page[];
  activePageId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export function PageTabs({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
  onMove,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (p: Page) => {
    setEditingId(p.id);
    setDraft(p.name);
  };
  const commitEdit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft.trim());
    setEditingId(null);
  };

  return (
    <nav className="flex h-13 shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-card px-3 scrollbar-thin" aria-label="Páginas do projeto">
      <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Páginas</span>
      {pages.map((p, i) => {
        const active = p.id === activePageId;
        const editing = editingId === p.id;
        return (
          <div
            key={p.id}
            className={`group flex h-9 shrink-0 items-center gap-1 rounded-lg border pl-1 pr-1 text-xs whitespace-nowrap transition-all ${
              active
                ? "border-foreground/30 bg-foreground/10 text-foreground"
                : "border-border bg-background/50 text-muted-foreground hover:border-foreground/25 hover:bg-white/5"
            }`}
          >
            {editing ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  aria-label="Nome da página"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-24 bg-transparent px-2 text-sm text-foreground outline-none"
                />
                <button
                  onClick={commitEdit}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 hover:text-foreground"
                  title="Salvar"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 hover:text-foreground"
                  title="Cancelar"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelect(p.id)}
                  onDoubleClick={() => startEdit(p)}
                  className="flex min-h-8 items-center rounded-md px-2 text-sm font-medium hover:text-foreground"
                  aria-current={active ? "page" : undefined}
                >
                  {p.name}
                </button>
                <div className={`flex items-center gap-0.5 transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
                  <TabIcon
                    onClick={() => onMove(p.id, -1)}
                    disabled={i === 0}
                    title="Mover para a esquerda"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </TabIcon>
                  <TabIcon
                    onClick={() => onMove(p.id, 1)}
                    disabled={i === pages.length - 1}
                    title="Mover para a direita"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </TabIcon>
                  <TabIcon onClick={() => startEdit(p)} title="Renomear">
                    <Pencil className="w-3 h-3" />
                  </TabIcon>
                  <TabIcon onClick={() => onDuplicate(p.id)} title="Duplicar página">
                    <Copy className="w-3 h-3" />
                  </TabIcon>
                  <TabIcon
                    onClick={() => {
                      if (pages.length > 1 && confirm(`Excluir a página "${p.name}"?`))
                        onDelete(p.id);
                    }}
                    disabled={pages.length <= 1}
                    title="Excluir página"
                  >
                    <Trash2 className="w-3 h-3" />
                  </TabIcon>
                </div>
              </>
            )}
          </div>
        );
      })}
      <button
        onClick={() => onAdd()}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/35 hover:bg-white/5 hover:text-foreground"
        title="Nova página"
      >
        <Plus className="w-4 h-4" /> Nova página
      </button>
    </nav>
  );
}

function TabIcon({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25"
    >
      {children}
    </button>
  );
}
