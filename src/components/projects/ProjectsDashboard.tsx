import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Plus, Copy, Trash2, Pencil, LogOut, FileText } from "lucide-react";
import { AedonMark } from "@/components/editor/AedonMark";
import { isSupabaseEnabled } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth";
import { signOut } from "@/lib/supabase/auth";
import { AuthScreen } from "@/components/editor/AuthScreen";
import {
  listLocalProjects,
  createLocalProject,
  duplicateLocalProject,
  renameLocalProject,
  deleteLocalProject,
  type ProjectSummary,
} from "@/lib/editor/projects";
import {
  listCloudProjects,
  createCloudProject,
  duplicateCloudProject,
  renameCloudProject,
  deleteCloudProject,
} from "@/lib/supabase/projects";

export function ProjectsDashboard() {
  const { user, loading } = useAuth();

  if (isSupabaseEnabled) {
    if (loading) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!user) return <AuthScreen />;
    return <Dashboard mode="cloud" userId={user.id} userEmail={user.email ?? ""} />;
  }

  return <Dashboard mode="local" userId={null} userEmail={null} />;
}

function Dashboard({
  mode,
  userId,
  userEmail,
}: {
  mode: "local" | "cloud";
  userId: string | null;
  userEmail: string | null;
}) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (mode === "local") {
      setProjects(listLocalProjects());
    } else if (userId) {
      setProjects(await listCloudProjects(userId));
    }
  }, [mode, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openProject = (id: string) => navigate({ to: "/build/$projectId", params: { projectId: id } });

  const handleCreate = async () => {
    setBusy(true);
    try {
      const id =
        mode === "local" ? createLocalProject() : await createCloudProject(userId as string);
      openProject(id);
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusy(true);
    try {
      const newId =
        mode === "local" ? duplicateLocalProject(id) : await duplicateCloudProject(userId as string, id);
      if (newId) await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id: string, name: string) => {
    if (mode === "local") renameLocalProject(id, name);
    else await renameCloudProject(userId as string, id, name);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este projeto? Essa ação não pode ser desfeita.")) return;
    setBusy(true);
    try {
      if (mode === "local") deleteLocalProject(id);
      else await deleteCloudProject(userId as string, id);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <AedonMark className="w-5 h-5" />
            <span className="text-sm font-medium tracking-[0.2em]">AEDON</span>
          </Link>
          {mode === "cloud" && userEmail && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">{userEmail}</span>
              <button
                onClick={signOut}
                title="Sair"
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-display font-medium">Meus projetos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projects === null
                ? "Carregando…"
                : projects.length === 0
                  ? "Nenhum projeto ainda."
                  : `${projects.length} projeto${projects.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={busy}
            className="h-10 px-4 rounded-full text-sm font-medium bg-primary text-primary-foreground flex items-center gap-2 transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            Novo projeto
          </button>
        </div>

        {projects === null ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <button
            onClick={handleCreate}
            disabled={busy}
            className="w-full rounded-2xl border border-dashed border-white/15 hover:border-foreground/30 hover:bg-white/[0.02] py-16 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-all"
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm font-medium">Criar seu primeiro projeto</span>
          </button>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => openProject(p.id)}
                onRename={(name) => handleRename(p.id, name)}
                onDuplicate={() => handleDuplicate(p.id)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  project: ProjectSummary;
  onOpen: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);

  const commitRename = () => {
    setEditing(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== project.name) onRename(trimmed);
    else setName(project.name);
  };

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:border-foreground/30 transition-colors overflow-hidden">
      <button
        onClick={onOpen}
        className="w-full aspect-[4/3] bg-black flex items-center justify-center border-b border-white/5"
      >
        <AedonMark className="w-8 h-8 opacity-30 group-hover:opacity-50 transition-opacity" />
      </button>
      <div className="p-3">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setName(project.name);
                setEditing(false);
              }
            }}
            className="w-full text-sm font-medium bg-input/60 border border-border rounded px-2 py-1 outline-none focus:border-foreground/40"
          />
        ) : (
          <button
            onClick={onOpen}
            className="text-sm font-medium text-left truncate block w-full hover:underline"
            title={project.name}
          >
            {project.name}
          </button>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: ptBR })}
          </span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconBtn title="Renomear" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" />
            </IconBtn>
            <IconBtn title="Duplicar" onClick={onDuplicate}>
              <Copy className="w-3 h-3" />
            </IconBtn>
            <IconBtn title="Excluir" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6 h-6 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
    >
      {children}
    </button>
  );
}
