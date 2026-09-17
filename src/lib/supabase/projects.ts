import type { ProjectState } from "@/lib/editor/types";
import { blankProject } from "@/lib/editor/projects";
import { supabase } from "./client";

export interface CloudProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

/** Lists the signed-in user's projects, newest first. Throws on a Supabase error. */
export async function listCloudProjects(userId: string): Promise<CloudProjectSummary[]> {
  const sb = supabase;
  if (!sb) return [];
  const { data, error } = await sb
    .from("projects")
    .select("id, name, updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, updatedAt: r.updated_at }));
}

export async function createCloudProject(userId: string, name = "Novo projeto"): Promise<string> {
  const sb = supabase;
  if (!sb) throw new Error("Supabase não configurado");
  const { data, error } = await sb
    .from("projects")
    .insert({ owner_id: userId, name, data: blankProject(name) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function duplicateCloudProject(userId: string, id: string): Promise<string> {
  const sb = supabase;
  if (!sb) throw new Error("Supabase não configurado");
  const { data: src, error: readError } = await sb
    .from("projects")
    .select("name, data")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  if (readError) throw readError;
  const copy: ProjectState = { ...(src.data as ProjectState), name: `${src.name} (cópia)` };
  const { data, error } = await sb
    .from("projects")
    .insert({ owner_id: userId, name: copy.name, data: copy })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function renameCloudProject(userId: string, id: string, name: string) {
  const sb = supabase;
  if (!sb) return;
  const { data: row, error: readError } = await sb
    .from("projects")
    .select("data")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  if (readError) throw readError;
  const nextData = { ...(row.data as ProjectState), name };
  const { error } = await sb
    .from("projects")
    .update({ name, data: nextData })
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw error;
}

export async function deleteCloudProject(userId: string, id: string) {
  const sb = supabase;
  if (!sb) return;
  const { error } = await sb.from("projects").delete().eq("id", id).eq("owner_id", userId);
  if (error) throw error;
}
