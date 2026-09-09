"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { AdminWorkspace } from "@/components/admin/admin-workspace";
import type { AdminSession } from "@/components/admin/admin-gate";
import { slugify } from "@/lib/content/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl, uploadPublicImage } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type GalleryRow = Database["public"]["Tables"]["galleries"]["Row"];
type GalleryImageRow = Database["public"]["Tables"]["gallery_images"]["Row"];

interface GalleryDraft {
  category: string;
  coverPath: string | null;
  description: string;
  id: string | null;
  isPublished: boolean;
  slug: string;
  title: string;
}

const emptyDraft: GalleryDraft = {
  id: null,
  title: "",
  slug: "",
  category: "",
  description: "",
  coverPath: null,
  isPublished: false,
};

function toDraft(gallery: GalleryRow): GalleryDraft {
  return {
    id: gallery.id,
    title: gallery.title,
    slug: gallery.slug,
    category: gallery.category ?? "",
    description: gallery.description ?? "",
    coverPath: gallery.cover_path,
    isPublished: gallery.is_published,
  };
}

function numericOrder(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

interface ImageEditorProps {
  image: GalleryImageRow;
  isAdmin: boolean;
  onDeleted: (imageId: string) => void;
  onUpdated: (image: GalleryImageRow) => void;
  publicUrl: string;
}

function GalleryImageEditor({ image, isAdmin, onDeleted, onUpdated, publicUrl }: ImageEditorProps) {
  const [altText, setAltText] = useState(image.alt_text);
  const [caption, setCaption] = useState(image.caption ?? "");
  const [displayOrder, setDisplayOrder] = useState(String(image.display_order));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAltText(image.alt_text);
    setCaption(image.caption ?? "");
    setDisplayOrder(String(image.display_order));
  }, [image]);

  async function saveImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAlt = altText.trim();
    if (!trimmedAlt) {
      setError("Descreva a imagem para leitores de tela.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setIsSaving(true);
    const { data, error: updateError } = await supabase
      .from("gallery_images")
      .update({ alt_text: trimmedAlt, caption: caption.trim() || null, display_order: numericOrder(displayOrder) })
      .eq("id", image.id)
      .select()
      .single();
    setIsSaving(false);

    if (updateError || !data) {
      setError("Não foi possível atualizar os dados da imagem.");
      return;
    }

    onUpdated(data);
  }

  async function deleteImage() {
    if (!isAdmin || !window.confirm("Excluir esta imagem da galeria?")) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setIsSaving(true);
    const { error: deleteRecordError } = await supabase
      .from("gallery_images")
      .delete()
      .eq("id", image.id);

    if (deleteRecordError) {
      setIsSaving(false);
      setError("Não foi possível excluir a imagem.");
      return;
    }

    const { error: removeFileError } = await supabase.storage
      .from("gallery")
      .remove([image.storage_path]);
    setIsSaving(false);

    onDeleted(image.id);
    if (removeFileError) {
      setError("A imagem saiu da galeria, mas o arquivo não pôde ser removido do acervo.");
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-[#020817]/34 p-4">
      <img alt={image.alt_text} className="aspect-[4/3] w-full rounded-xl border border-white/10 object-cover" src={publicUrl} />
      <form className="mt-4 grid gap-3" onSubmit={saveImage}>
        <label className="grid gap-2 text-sm font-bold text-white" htmlFor={`image-alt-${image.id}`}>Texto alternativo<input className="admin-input" id={`image-alt-${image.id}`} onChange={(event) => setAltText(event.target.value)} required value={altText} /></label>
        <label className="grid gap-2 text-sm font-bold text-white" htmlFor={`image-caption-${image.id}`}>Legenda<input className="admin-input" id={`image-caption-${image.id}`} onChange={(event) => setCaption(event.target.value)} value={caption} /></label>
        <div className="flex flex-wrap items-end gap-3"><label className="grid max-w-34 gap-2 text-sm font-bold text-white" htmlFor={`image-order-${image.id}`}>Ordem<input className="admin-input" id={`image-order-${image.id}`} min="0" onChange={(event) => setDisplayOrder(event.target.value)} type="number" value={displayOrder} /></label><button className="button-secondary min-h-11 px-4" disabled={isSaving} type="submit">Salvar</button>{isAdmin ? <button className="min-h-11 rounded-full border border-red-200/20 px-4 text-sm font-bold text-red-100" disabled={isSaving} onClick={deleteImage} type="button">Excluir</button> : null}</div>
        {error ? <p className="text-sm leading-6 text-red-100" role="alert">{error}</p> : null}
      </form>
    </article>
  );
}

interface GalleryManagerProps {
  session: AdminSession;
}

export function GalleryManager({ session }: GalleryManagerProps) {
  const [galleries, setGalleries] = useState<GalleryRow[]>([]);
  const [images, setImages] = useState<GalleryImageRow[]>([]);
  const [draft, setDraft] = useState<GalleryDraft>(emptyDraft);
  const [imageAltText, setImageAltText] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageOrder, setImageOrder] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session.role === "admin";
  const browserClient = createSupabaseBrowserClient();
  const coverUrl = browserClient ? getPublicImageUrl(browserClient, "gallery", draft.coverPath) : null;

  const loadGalleries = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A conexão com o Supabase não está disponível neste ambiente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: loadError } = await supabase
      .from("galleries")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Não foi possível carregar os álbuns.");
    } else {
      setGalleries(data ?? []);
    }
    setIsLoading(false);
  }, []);

  const loadImages = useCallback(async (galleryId: string) => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const { data, error: loadError } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("display_order")
      .order("created_at");

    if (loadError) {
      setError("Não foi possível carregar as imagens deste álbum.");
      return;
    }
    setImages(data ?? []);
  }, []);

  useEffect(() => {
    void loadGalleries();
  }, [loadGalleries]);

  useEffect(() => {
    if (draft.id) {
      void loadImages(draft.id);
    } else {
      setImages([]);
    }
  }, [draft.id, loadImages]);

  function updateTitle(title: string) {
    setDraft((current) => ({
      ...current,
      title,
      slug: current.slug === slugify(current.title) ? slugify(title) : current.slug,
    }));
  }

  async function saveGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;

    const title = draft.title.trim();
    const slug = slugify(draft.slug);
    if (!title || !slug) {
      setError("Preencha título e endereço do álbum antes de salvar.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsSaving(true);
    setError(null);
    setFeedback(null);
    const payload = {
      title,
      slug,
      category: draft.category.trim() || null,
      description: draft.description.trim() || null,
      cover_path: draft.coverPath,
      is_published: draft.isPublished,
    };
    const result = draft.id
      ? await supabase.from("galleries").update(payload).eq("id", draft.id).select().single()
      : await supabase.from("galleries").insert(payload).select().single();
    setIsSaving(false);

    if (result.error || !result.data) {
      setError(result.error?.code === "23505" ? "Esse endereço de álbum já está em uso." : "Não foi possível salvar o álbum.");
      return;
    }

    setDraft(toDraft(result.data));
    setFeedback(draft.id ? "Álbum atualizado." : "Álbum criado. Agora você pode enviar imagens.");
    await loadGalleries();
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !draft.id) return;
    const altText = imageAltText.trim();

    if (!altText) {
      setError("Informe um texto alternativo antes de enviar a imagem.");
      event.target.value = "";
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setFeedback(null);
    setIsImageLoading(true);

    try {
      const path = await uploadPublicImage(supabase, "gallery", `albums/${draft.id}`, file);
      const { data, error: insertError } = await supabase
        .from("gallery_images")
        .insert({
          gallery_id: draft.id,
          storage_bucket: "gallery",
          storage_path: path,
          alt_text: altText,
          caption: imageCaption.trim() || null,
          display_order: numericOrder(imageOrder),
        })
        .select()
        .single();

      if (insertError || !data) throw insertError ?? new Error("Não foi possível salvar a imagem.");

      if (!draft.coverPath && isAdmin) {
        const { data: updatedGallery, error: coverError } = await supabase
          .from("galleries")
          .update({ cover_path: path })
          .eq("id", draft.id)
          .select()
          .single();

        if (!coverError && updatedGallery) {
          setDraft(toDraft(updatedGallery));
        }
      }

      setImages((current) => [...current, data].sort((a, b) => a.display_order - b.display_order));
      setImageAltText("");
      setImageCaption("");
      setImageOrder(String(numericOrder(imageOrder) + 1));
      setFeedback("Imagem adicionada ao álbum.");
      await loadGalleries();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    } finally {
      setIsImageLoading(false);
      event.target.value = "";
    }
  }

  async function deleteGallery() {
    if (!draft.id || !isAdmin || !window.confirm("Excluir este álbum e seus registros de imagens?")) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsSaving(true);
    setError(null);
    const { data: storedImages } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("gallery_id", draft.id);
    const { error: deleteError } = await supabase
      .from("galleries")
      .delete()
      .eq("id", draft.id);
    setIsSaving(false);

    if (deleteError) {
      setError("Não foi possível excluir o álbum.");
      return;
    }

    const paths = (storedImages ?? []).filter((image) => image.storage_bucket === "gallery").map((image) => image.storage_path);
    const { error: removeError } = paths.length ? await supabase.storage.from("gallery").remove(paths) : { error: null };
    setDraft(emptyDraft);
    setImages([]);
    setFeedback(removeError ? "Álbum excluído. Alguns arquivos podem permanecer no acervo de mídia." : "Álbum e imagens excluídos.");
    await loadGalleries();
  }

  return (
    <AdminWorkspace
      description="Crie álbuns, envie imagens com descrição acessível e publique a galeria no site. Editoras e editores podem organizar imagens de álbuns existentes."
      section="galeria"
      session={session}
      title="Gerenciar galeria"
    >
      <div className="mt-10 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="glass-panel h-fit rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-lg font-bold text-white">Álbuns</p><p className="mt-1 text-sm text-acrux-muted">{galleries.length} registro(s)</p></div>{isAdmin ? <button className="button-secondary min-h-10 px-4" onClick={() => { setDraft(emptyDraft); setError(null); setFeedback(null); }} type="button">Novo</button> : null}</div>
          <div className="mt-5 grid gap-2">{isLoading ? <p className="text-sm text-acrux-muted">Carregando álbuns…</p> : null}{!isLoading && galleries.length === 0 ? <p className="rounded-2xl border border-dashed border-cyan-200/16 p-4 text-sm leading-6 text-acrux-muted">Nenhum álbum cadastrado ainda.</p> : null}{galleries.map((gallery) => <button className={draft.id === gallery.id ? "rounded-2xl border border-cyan-200/32 bg-cyan-300/9 p-4 text-left" : "rounded-2xl border border-white/8 bg-[#020817]/30 p-4 text-left transition-colors hover:border-cyan-200/22"} key={gallery.id} onClick={() => { setDraft(toDraft(gallery)); setError(null); setFeedback(null); }} type="button"><div className="flex items-start justify-between gap-3"><p className="font-bold text-white">{gallery.title}</p><span className="text-xs font-bold text-acrux-cyan-bright">{gallery.is_published ? "Público" : "Rascunho"}</span></div><p className="mt-2 text-sm text-acrux-muted">{gallery.category || "Sem categoria"}</p></button>)}</div>
        </aside>

        <div className="grid gap-6">
          {isAdmin ? <form className="glass-panel rounded-3xl p-5 sm:p-7" onSubmit={saveGallery}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-lg font-bold text-white">{draft.id ? "Editar álbum" : "Novo álbum"}</p><p className="mt-1 text-sm text-acrux-muted">Salve o álbum antes de enviar imagens.</p></div>{draft.id ? <button className="rounded-full border border-red-200/20 px-4 py-2 text-sm font-bold text-red-100" disabled={isSaving} onClick={deleteGallery} type="button">Excluir</button> : null}</div>
            <div className="mt-7 grid gap-5"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-title">Título<input className="admin-input" id="gallery-title" onChange={(event) => updateTitle(event.target.value)} required value={draft.title} /></label><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-slug">Endereço do álbum<input className="admin-input" id="gallery-slug" onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} required value={draft.slug} /></label><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-category">Categoria<input className="admin-input" id="gallery-category" onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Ex.: competição, bastidores, projeto" value={draft.category} /></label><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-description">Descrição<textarea className="admin-input min-h-25 resize-y" id="gallery-description" onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} value={draft.description} /></label><label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-[#020817]/45 px-4 text-sm font-bold text-white"><input checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} type="checkbox" />Publicar álbum</label>{coverUrl ? <img alt="Capa atual do álbum" className="max-h-68 w-full rounded-2xl border border-white/10 object-cover" src={coverUrl} /> : null}</div>
            <button className="button-primary mt-7" disabled={isSaving} type="submit">{isSaving ? "Salvando…" : draft.id ? "Salvar alterações" : "Criar álbum"}</button>
          </form> : <div className="glass-panel rounded-3xl p-6 sm:p-8"><p className="text-lg font-bold text-white">Envio de imagens</p><p className="mt-3 text-base leading-7 text-acrux-muted">Selecione um álbum existente para enviar ou organizar as imagens. Criar e publicar álbuns exige uma conta administradora.</p></div>}

          {draft.id ? <section className="glass-panel rounded-3xl p-5 sm:p-7"><div><p className="text-lg font-bold text-white">Imagens de “{draft.title}”</p><p className="mt-1 text-sm text-acrux-muted">Cada imagem precisa de uma descrição para permanecer acessível.</p></div><div className="mt-6 rounded-2xl border border-white/10 bg-[#020817]/28 p-4"><div className="grid gap-4"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-image-alt">Texto alternativo<input className="admin-input" id="gallery-image-alt" onChange={(event) => setImageAltText(event.target.value)} placeholder="Descreva o que aparece na imagem" value={imageAltText} /></label><div className="grid gap-4 sm:grid-cols-[1fr_9rem]"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-image-caption">Legenda<input className="admin-input" id="gallery-image-caption" onChange={(event) => setImageCaption(event.target.value)} value={imageCaption} /></label><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-image-order">Ordem<input className="admin-input" id="gallery-image-order" min="0" onChange={(event) => setImageOrder(event.target.value)} type="number" value={imageOrder} /></label></div><label className="grid gap-2 text-sm font-bold text-white" htmlFor="gallery-image-file">Arquivo<input accept="image/avif,image/gif,image/jpeg,image/png,image/webp" className="admin-file-input" disabled={isImageLoading} id="gallery-image-file" onChange={uploadImage} type="file" /></label></div></div><div className="mt-6 grid gap-4 md:grid-cols-2">{images.map((image) => { const imageUrl = browserClient ? getPublicImageUrl(browserClient, "gallery", image.storage_path) : null; return imageUrl ? <GalleryImageEditor image={image} isAdmin={isAdmin} key={image.id} onDeleted={(imageId) => setImages((current) => current.filter((item) => item.id !== imageId))} onUpdated={(updated) => setImages((current) => current.map((item) => item.id === updated.id ? updated : item).sort((a, b) => a.display_order - b.display_order))} publicUrl={imageUrl} /> : null; })}</div>{images.length === 0 ? <p className="mt-6 text-sm text-acrux-muted">Nenhuma imagem adicionada a este álbum.</p> : null}</section> : null}
        </div>
      </div>
      {error ? <p className="mt-6 rounded-2xl border border-red-300/22 bg-red-950/24 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}{feedback ? <p className="mt-6 rounded-2xl border border-cyan-200/18 bg-cyan-300/8 px-4 py-3 text-sm text-acrux-cyan-bright" role="status">{feedback}</p> : null}
    </AdminWorkspace>
  );
}
