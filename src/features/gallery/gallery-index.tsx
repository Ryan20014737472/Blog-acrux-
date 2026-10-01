"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type GalleryRow = Database["public"]["Tables"]["galleries"]["Row"];
type GalleryImageRow = Database["public"]["Tables"]["gallery_images"]["Row"];

export function GalleryIndex() {
  const [galleries, setGalleries] = useState<GalleryRow[]>([]);
  const [imagesByGallery, setImagesByGallery] = useState<Map<string, GalleryImageRow[]>>(new Map());
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const browserClient = createSupabaseBrowserClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!activeGalleryId) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog?.close();
    };
  }, [activeGalleryId]);

  useEffect(() => {
    async function loadGallery() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setLoadError("A galeria ainda não está conectada ao acervo visual.");
        setIsLoading(false);
        return;
      }

      const { data: galleryData, error: galleryError } = await supabase
        .from("galleries")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (galleryError) {
        setLoadError("Não foi possível carregar os álbuns publicados agora.");
        setIsLoading(false);
        return;
      }

      const publishedGalleries = galleryData ?? [];
      setGalleries(publishedGalleries);

      if (publishedGalleries.length) {
        const { data: imageData, error: imagesError } = await supabase
          .from("gallery_images")
          .select("*")
          .in("gallery_id", publishedGalleries.map((gallery) => gallery.id))
          .order("display_order")
          .order("created_at");

        if (imagesError) {
          setLoadError("Não foi possível carregar as imagens da galeria agora.");
          setIsLoading(false);
          return;
        }

        const nextImagesByGallery = new Map<string, GalleryImageRow[]>();
        for (const image of imageData ?? []) {
          const images = nextImagesByGallery.get(image.gallery_id) ?? [];
          images.push(image);
          nextImagesByGallery.set(image.gallery_id, images);
        }
        setImagesByGallery(nextImagesByGallery);
      }

      setIsLoading(false);
    }

    void loadGallery();
  }, []);

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(galleries.map((gallery) => gallery.category).filter((category): category is string => Boolean(category))))],
    [galleries],
  );
  const visibleGalleries = galleries.filter((gallery) => activeCategory === "Todos" || gallery.category === activeCategory);
  const activeGallery = galleries.find((gallery) => gallery.id === activeGalleryId) ?? null;
  const activeImages = activeGallery ? imagesByGallery.get(activeGallery.id) ?? [] : [];
  const activeImage = activeImages[activeImageIndex] ?? null;

  function openGallery(galleryId: string) {
    setActiveGalleryId(galleryId);
    setActiveImageIndex(0);
  }

  function closeGallery() {
    dialogRef.current?.close();
    setActiveGalleryId(null);
    setActiveImageIndex(0);
  }

  function moveImage(direction: -1 | 1) {
    if (!activeImages.length) return;
    setActiveImageIndex((current) => (current + direction + activeImages.length) % activeImages.length);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!activeGalleryId) return;
      if (event.key === "ArrowLeft" && activeImages.length) {
        event.preventDefault();
        setActiveImageIndex((current) => (current - 1 + activeImages.length) % activeImages.length);
      }
      if (event.key === "ArrowRight" && activeImages.length) {
        event.preventDefault();
        setActiveImageIndex((current) => (current + 1) % activeImages.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGalleryId, activeImages.length]);

  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Galeria</p>
        <h1 className="display-heading mt-5">Um acervo visual para a história da equipe.</h1>
        <p className="body-copy mt-6">Registros de temporadas, eventos, campeonatos e projetos publicados pela ACRUX.</p>

        {categories.length > 1 ? <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar álbuns por categoria">{categories.map((category) => <button aria-pressed={activeCategory === category} className={activeCategory === category ? "min-h-11 max-w-full break-words rounded-full border border-cyan-200/36 bg-cyan-300/13 px-4 py-2 text-sm font-bold text-acrux-cyan-bright" : "min-h-11 max-w-full break-words rounded-full border border-white/12 bg-white/3 px-4 py-2 text-sm font-bold text-acrux-muted transition-colors hover:border-cyan-200/28 hover:text-white"} key={category} onClick={() => setActiveCategory(category)} type="button">{category}</button>)}</div> : null}
        {isLoading ? <div className="glass-panel mt-10 rounded-3xl p-7 text-acrux-muted" aria-live="polite">Carregando a galeria…</div> : null}
        {loadError ? <div className="mt-10 rounded-3xl border border-red-300/20 bg-red-950/22 p-6 text-red-100" role="alert">{loadError}</div> : null}

        {!isLoading && !loadError && visibleGalleries.length ? <section aria-label="Álbuns publicados" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleGalleries.map((gallery) => {
          const images = imagesByGallery.get(gallery.id) ?? [];
          const coverPath = gallery.cover_path ?? images[0]?.storage_path ?? null;
          const coverUrl = browserClient ? getPublicImageUrl(browserClient, "gallery", coverPath) : null;
          return <article className="glass-panel card-hover min-w-0 break-words overflow-hidden rounded-2xl" key={gallery.id}>{coverUrl ? <img alt="" className="aspect-[4/3] w-full object-cover" decoding="async" loading="lazy" src={coverUrl} /> : <PlaceholderMedia className="aspect-[4/3] min-h-0 border-x-0 border-t-0" label={`Capa de ${gallery.title} pendente`} />}<div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{gallery.category ?? "ACRUX"}</p><h2 className="mt-3 text-xl font-bold text-white">{gallery.title}</h2>{gallery.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-acrux-muted">{gallery.description}</p> : null}<div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><p className="text-sm text-acrux-muted">{images.length} imagem(ns)</p><button className="inline-flex min-h-11 items-center py-2 text-sm font-bold text-acrux-cyan-bright hover:text-white" onClick={() => openGallery(gallery.id)} type="button">Abrir álbum →</button></div></div></article>;
        })}</section> : null}
        {!isLoading && !loadError && visibleGalleries.length === 0 ? <div className="glass-panel mt-10 rounded-3xl p-7"><p className="text-xl font-bold text-white">Nenhum álbum publicado ainda.</p><p className="mt-3 max-w-xl text-sm leading-6 text-acrux-muted">A ACRUX ainda não adicionou registros visuais públicos a esta área.</p></div> : null}

        {activeGallery ? (
          <dialog
            aria-labelledby="gallery-dialog-title"
            className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-[#020817]/86 p-0 text-white backdrop:bg-[#020817]/86 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center sm:p-6"
            onCancel={(event) => { event.preventDefault(); closeGallery(); }}
            onClick={(event) => { if (event.target === event.currentTarget) closeGallery(); }}
            ref={dialogRef}
          >
            <div className="glass-panel flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden border-0 sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl sm:border">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] sm:p-6 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pt-[max(1.5rem,env(safe-area-inset-top))]">
                <div className="min-w-0 break-words">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{activeGallery.category ?? "Galeria"}</p>
                  <h2 className="mt-2 max-h-[25dvh] overflow-y-auto overscroll-contain text-xl font-bold sm:text-3xl" id="gallery-dialog-title" tabIndex={0}>{activeGallery.title}</h2>
                </div>
                <button aria-label="Fechar álbum" autoFocus className="min-h-11 shrink-0 rounded-full border border-white/14 px-4 py-2 text-sm font-bold hover:border-cyan-200/30" onClick={closeGallery} type="button">Fechar</button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
                {activeImage ? (
                  <>
                    <img
                      alt={activeImage.alt_text}
                      className="mx-auto max-h-[60dvh] w-full touch-pan-y rounded-2xl bg-[#020817] object-contain"
                      onTouchEnd={(event) => {
                        const start = touchStartRef.current;
                        const end = event.changedTouches[0];
                        touchStartRef.current = null;
                        if (!start || !end) return;
                        const horizontal = end.clientX - start.x;
                        const vertical = end.clientY - start.y;
                        if (Math.abs(horizontal) > 50 && Math.abs(horizontal) > Math.abs(vertical) * 1.5) moveImage(horizontal < 0 ? 1 : -1);
                      }}
                      onTouchStart={(event) => {
                        const touch = event.touches[0];
                        touchStartRef.current = event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
                      }}
                      onTouchCancel={() => { touchStartRef.current = null; }}
                      src={browserClient ? getPublicImageUrl(browserClient, "gallery", activeImage.storage_path) ?? "" : ""}
                    />
                    {activeImage.caption ? <p className="mt-4 break-words text-center text-sm leading-6 text-acrux-muted">{activeImage.caption}</p> : null}
                  </>
                ) : <p className="rounded-2xl border border-dashed border-cyan-200/16 p-5 text-acrux-muted">Este álbum ainda não possui imagens.</p>}
              </div>
              {activeImage ? <div className="flex shrink-0 items-center justify-center gap-4 border-t border-white/10 bg-acrux-navy/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
                <button aria-label="Imagem anterior" className="button-secondary min-h-11 min-w-11 px-4" disabled={activeImages.length < 2} onClick={() => moveImage(-1)} type="button">←</button>
                <p aria-live="polite" aria-atomic="true" className="text-sm text-acrux-muted">{activeImageIndex + 1} de {activeImages.length}</p>
                <button aria-label="Próxima imagem" className="button-secondary min-h-11 min-w-11 px-4" disabled={activeImages.length < 2} onClick={() => moveImage(1)} type="button">→</button>
              </div> : null}
            </div>
          </dialog>
        ) : null}
        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}
