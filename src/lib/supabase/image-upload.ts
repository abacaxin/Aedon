import { supabase } from "./client";

const BUCKET = "project-images";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_LOCAL_FILE_BYTES = 1_500_000;

function validateImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  if (file.size > MAX_FILE_BYTES) throw new Error("A imagem deve ter no máximo 5 MB.");
}

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  return file.type.split("/")[1]?.replace("+xml", "") || "jpg";
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/** Upload to Storage in cloud mode; use local browser storage when offline/local. */
export async function uploadProjectImage(file: File, userId: string | null) {
  validateImage(file);
  if (!supabase || !userId) {
    if (file.size > MAX_LOCAL_FILE_BYTES) {
      throw new Error("No modo local, use imagens de até 1,5 MB.");
    }
    return readAsDataUrl(file);
  }

  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Não foi possível enviar a imagem: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
