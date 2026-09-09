"use client";

import { useEffect, useMemo, useState } from "react";

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
      if (event.key === "Escape") {
        setActiveGalleryId(null);
        setActiveImageIndex(0);
      }
      if (event.key === "ArrowLeft" && activeImages.length) {
        setActiveImageIndex((current) => (current - 1 + activeImages.length) % activeImages.length);
      }
      if (event.key === "ArrowRight" && activeImages.length) {
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

        {categories.length > 1 ? <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar álbuns por categoria">{categories.map((category) => <button aria-pressed={activeCategory === category} className={activeCategory === category ? "rounded-full border border-cyan-200/36 bg-cyan-300/13 px-3 py-2 text-sm font-bold text-acrux-cyan-bright" : "rounded-full border border-white/12 bg-white/3 px-3 py-2 text-sm font-bold text-acrux-muted transition-colors hover:border-cyan-200/28 hover:text-white"} key={category} onClick={() => setActiveCategory(category)} type="button">{category}</button>)}</div> : null}
        {isLoading ? <div className="glass-panel mt-10 rounded-3xl p-7 text-acrux-muted" aria-live="polite">Carregando a galeria…</div> : null}
        {loadError ? <div className="mt-10 rounded-3xl border border-red-300/20 bg-red-950/22 p-6 text-red-100" role="alert">{loadError}</div> : null}

        {!isLoading && !loadError && visibleGalleries.length ? <section aria-label="Álbuns publicados" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleGalleries.map((gallery) => {
          const images = imagesByGallery.get(gallery.id) ?? [];
          const coverPath = gallery.cover_path ?? images[0]?.storage_path ?? null;
          const coverUrl = browserClient ? getPublicImageUrl(browserClient, "gallery", coverPath) : null;
          return <article className="glass-panel card-hover overflow-hidden rounded-2xl" key={gallery.id}>{coverUrl ? <img alt="" className="aspect-[4/3] w-full object-cover" src={coverUrl} /> : <PlaceholderMedia className="aspect-[4/3] min-h-0 border-x-0 border-t-0" label={`Capa de ${gallery.title} pendente`} />}<div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{gallery.category ?? "ACRUX"}</p><h2 className="mt-3 text-xl font-bold text-white">{gallery.title}</h2>{gallery.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-acrux-muted">{gallery.description}</p> : null}<div className="mt-5 flex items-center justify-between gap-3"><p className="text-sm text-acrux-muted">{images.length} imagem(ns)</p><button className="text-sm font-bold text-acrux-cyan-bright hover:text-white" onClick={() => openGallery(gallery.id)} type="button">Abrir álbum →</button></div></div></article>;
        })}</section> : null}
        {!isLoading && !loadError && visibleGalleries.length === 0 ? <div className="glass-panel mt-10 rounded-3xl p-7"><p className="text-xl font-bold text-white">Nenhum álbum publicado ainda.</p><p className="mt-3 max-w-xl text-sm leading-6 text-acrux-muted">A ACRUX ainda não adicionou registros visuais públicos a esta área.</p></div> : null}

        {activeGallery ? <div aria-label={`Álbum ${activeGallery.title}`} aria-modal="true" className="fixed inset-0 z-[100] grid place-items-center bg-[#020817]/86 p-4 backdrop-blur-sm" onClick={closeGallery} role="dialog"><div className="glass-panel max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl p-5 sm:p-7" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{activeGallery.category ?? "Galeria"}</p><h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{activeGallery.title}</h2></div><button aria-label="Fechar álbum" className="rounded-full border border-white/14 px-3 py-2 text-sm font-bold text-white hover:border-cyan-200/30" onClick={closeGallery} type="button">Fechar</button></div>{activeImage ? <div className="mt-6"><img alt={activeImage.alt_text} className="max-h-[58vh] w-full rounded-2xl bg-[#020817] object-contain" src={browserClient ? getPublicImageUrl(browserClient, "gallery", activeImage.storage_path) ?? "" : ""} />{activeImage.caption ? <p className="mt-3 text-center text-sm text-acrux-muted">{activeImage.caption}</p> : null}<div className="mt-5 flex items-center justify-center gap-3"><button aria-label="Imagem anterior" className="button-secondary min-h-11 px-4" disabled={activeImages.length < 2} onClick={() => moveImage(-1)} type="button">←</button><p className="text-sm text-acrux-muted">{activeImageIndex + 1} de {activeImages.length}</p><button aria-label="Próxima imagem" className="button-secondary min-h-11 px-4" disabled={activeImages.length < 2} onClick={() => moveImage(1)} type="button">→</button></div></div> : <p className="mt-8 rounded-2xl border border-dashed border-cyan-200/16 p-5 text-acrux-muted">Este álbum ainda não possui imagens.</p>}</div></div> : null}
        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}
