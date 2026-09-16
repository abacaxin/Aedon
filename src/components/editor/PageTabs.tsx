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
    <div className="h-10 shrink-0 border-b border-border bg-card/40 flex items-center gap-1 px-2 overflow-x-auto scrollbar-thin">
      {pages.map((p, i) => {
        const active = p.id === activePageId;
        const editing = editingId === p.id;
        return (
          <div
            key={p.id}
            className={`group flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-lg text-xs whitespace-nowrap transition-all ${
              active
                ? "bg-foreground/10 border border-foreground/40 text-foreground"
                : "border border-transparent hover:bg-white/5 text-muted-foreground"
            }`}
          >
            {editing ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="bg-transparent outline-none w-24 text-foreground"
                />
                <button
                  onClick={commitEdit}
                  className="w-5 h-5 flex items-center justify-center hover:text-foreground"
                  title="Salvar"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="w-5 h-5 flex items-center justify-center hover:text-foreground"
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
                  className="font-medium"
                >
                  {p.name}
                </button>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
        className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        title="Nova página"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
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
      className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}
