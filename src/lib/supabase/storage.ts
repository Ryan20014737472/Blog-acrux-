import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const imageExtensions = new Set(["avif", "gif", "jpeg", "jpg", "png", "webp"]);

export type ContentBucket = "avatars" | "blog" | "gallery";

export function validateImageFile(file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("pt-BR") ?? "";

  if (!file.type.startsWith("image/") || !imageExtensions.has(extension)) {
    return "Envie uma imagem em JPG, PNG, WebP, GIF ou AVIF.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "A imagem precisa ter no máximo 10 MB.";
  }

  return null;
}

export function createStoragePath(prefix: string, file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("pt-BR") || "jpg";
  return `${prefix}/${crypto.randomUUID()}.${extension}`;
}

export async function uploadPublicImage(
  supabase: SupabaseClient<Database>,
  bucket: ContentBucket,
  prefix: string,
  file: File,
) {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const path = createStoragePath(prefix, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error("Não foi possível enviar a imagem. Tente novamente.");
  }

  return path;
}

export function getPublicImageUrl(
  supabase: SupabaseClient<Database>,
  bucket: ContentBucket,
  path: string | null,
) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
