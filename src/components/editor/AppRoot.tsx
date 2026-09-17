import { Loader2 } from "lucide-react";
import { isSupabaseEnabled } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth";
import { EditorShell } from "./EditorShell";
import { AuthScreen } from "./AuthScreen";

/**
 * Chooses what to render based on auth state:
 * - Supabase not configured → the editor in local-only mode (localStorage).
 * - Configured + loading session → a splash.
 * - Configured + signed out → the auth screen.
 * - Configured + signed in → the editor wired to cloud sync.
 */
export function AppRoot({ projectId }: { projectId: string }) {
  const { user, loading } = useAuth();

  if (!isSupabaseEnabled) return <EditorShell user={null} projectId={projectId} />;
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <AuthScreen />;
  return <EditorShell user={user} projectId={projectId} />;
}
