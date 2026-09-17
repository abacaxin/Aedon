import { useEffect, useRef, useState } from "react";
import type { ProjectState } from "@/lib/editor/types";
import { supabase } from "./client";

export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";

/**
 * Loads one project (by id) from Postgres on mount and saves changes back
 * (debounced). When Supabase is disabled or nobody is signed in, this is a no-op and
 * the editor keeps using localStorage.
 */
export function useCloudSync({
  userId,
  projectId,
  project,
  onLoad,
}: {
  userId: string | null;
  projectId: string | null;
  project: ProjectState;
  onLoad: (state: ProjectState) => void;
}): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const readyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // Load the project row when the user/project changes.
  useEffect(() => {
    readyRef.current = false;
    const sb = supabase;
    if (!sb || !userId || !projectId) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    (async () => {
      const { data, error } = await sb
        .from("projects")
        .select("data")
        .eq("id", projectId)
        .eq("owner_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      if (data?.data) onLoad(data.data as ProjectState);
      readyRef.current = true;
      setStatus("saved");
    })();
    return () => {
      cancelled = true;
    };
    // project is intentionally excluded — we only load once per project switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, projectId]);

  // Debounced save on every change, once the initial load has completed.
  useEffect(() => {
    const sb = supabase;
    if (!sb || !userId || !projectId || !readyRef.current) return;
    setStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const { error } = await sb
        .from("projects")
        .update({ name: project.name, data: project })
        .eq("id", projectId)
        .eq("owner_id", userId);
      setStatus(error ? "error" : "saved");
    }, 800);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [project, userId, projectId]);

  return status;
}
