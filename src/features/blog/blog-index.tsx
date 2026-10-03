"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";
import { PostImage } from "@/features/blog/post-image";
import { getPostImagePaths } from "@/features/blog/post-images";
import { publicUrl } from "@/lib/seo/public-metadata";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type PostCategoryRow = Database["public"]["Tables"]["post_categories"]["Row"];

interface PublicPost extends PostRow {
  categories: CategoryRow[];
}

function formatDate(value: string | null) {
  if (!value) return "Data em atualização";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(value));
}

function PostUrlState({ onChange }: { onChange: (slug: string | null) => void }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("post");

  useEffect(() => {
    onChange(slug);
  }, [onChange, slug]);

  return null;
}

export function BlogIndex() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [manualCopyUrl, setManualCopyUrl] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const browserClient = createSupabaseBrowserClient();
  const readingRef = useRef<HTMLElement>(null);
  const readingTriggerRef = useRef<HTMLButtonElement | null>(null);
  const searchResultsRef = useRef<HTMLParagraphElement>(null);
  const unavailablePostRef = useRef<HTMLElement>(null);
  const manualCopyInputRef = useRef<HTMLInputElement>(null);
  const previousReadingSlugRef = useRef<string | null>(null);
  const copyRequestRef = useRef(0);

  const resetCopyFeedback = useCallback(() => {
    copyRequestRef.current += 1;
    setCopyMessage("");
    setManualCopyUrl(null);
    setIsCopying(false);
  }, []);

  const readPostFromUrl = useCallback((slug: string | null) => {
    setSelectedPostSlug(slug);
    resetCopyFeedback();
  }, [resetCopyFeedback]);

  useEffect(() => () => {
    copyRequestRef.current += 1;
  }, []);

  function updatePostUrl(slug: string | null) {
    const url = new URL(window.location.href);
    if (slug === null) url.searchParams.delete("post");
    else url.searchParams.set("post", slug);
    url.hash = "";
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
    resetCopyFeedback();
  }

  function openPost(slug: string, trigger: HTMLButtonElement) {
    readingTriggerRef.current = trigger;
    if (selectedPostSlug === slug) {
      readingRef.current?.focus({ preventScroll: true });
      readingRef.current?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
    }
    updatePostUrl(slug);
  }

  function closePost() {
    updatePostUrl(null);
  }

  useEffect(() => {
    async function loadPosts() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setLoadError("O blog ainda não está conectado ao acervo de conteúdos.");
        setIsLoading(false);
        return;
      }

      const now = new Date().toISOString();
      const [postsResult, categoriesResult, linksResult] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .not("published_at", "is", null)
          .lte("published_at", now)
          .order("published_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("post_categories").select("*"),
      ]);

      if (postsResult.error || categoriesResult.error || linksResult.error) {
        setLoadError("Não foi possível carregar as postagens publicadas agora.");
        setIsLoading(false);
        return;
      }

      const categoriesById = new Map((categoriesResult.data ?? []).map((category) => [category.id, category]));
      const categoryIdsByPost = new Map<string, string[]>();
      for (const link of (linksResult.data ?? []) as PostCategoryRow[]) {
        const ids = categoryIdsByPost.get(link.post_id) ?? [];
        ids.push(link.category_id);
        categoryIdsByPost.set(link.post_id, ids);
      }

      setPosts(((postsResult.data ?? []) as PostRow[]).map((post) => ({
        ...post,
        categories: (categoryIdsByPost.get(post.id) ?? [])
          .map((categoryId) => categoriesById.get(categoryId))
          .filter((category): category is CategoryRow => Boolean(category)),
      })));
      setIsLoading(false);
    }

    void loadPosts();
  }, []);

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(posts.flatMap((post) => post.categories.map((category) => category.name))))],
    [posts],
  );
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "Todos" || post.categories.some((category) => category.name === activeCategory);
      const searchable = [
        post.title,
        post.excerpt,
        post.body,
        post.tags.join(" "),
        post.categories.map((category) => category.name).join(" "),
      ].join(" ").toLocaleLowerCase("pt-BR");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategory, posts, query]);
  const featuredPost = filteredPosts.find((post) => post.is_featured) ?? filteredPosts[0] ?? null;
  const recentPosts = filteredPosts.filter((post) => post.id !== featuredPost?.id);
  const selectedPost = posts.find((post) => post.slug === selectedPostSlug) ?? null;
  const selectedPostImagePaths = selectedPost ? getPostImagePaths(selectedPost) : [];

  useEffect(() => {
    const previousSlug = previousReadingSlugRef.current;
    previousReadingSlugRef.current = selectedPostSlug;
    if (selectedPostSlug === null) {
      if (previousSlug === null) return;
      const returnTarget = readingTriggerRef.current?.isConnected ? readingTriggerRef.current : document.getElementById("post-search");
      returnTarget?.focus({ preventScroll: true });
      returnTarget?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "center" });
      return;
    }
    if (isLoading || loadError) return;
    readingTriggerRef.current = document.querySelector<HTMLButtonElement>(`button[data-post-slug="${CSS.escape(selectedPostSlug)}"]`);
    const target = selectedPost ? readingRef.current : unavailablePostRef.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
  }, [isLoading, loadError, reduceMotion, selectedPost, selectedPostSlug]);

  useEffect(() => {
    if (!manualCopyUrl) return;
    manualCopyInputRef.current?.focus({ preventScroll: true });
    manualCopyInputRef.current?.select();
  }, [manualCopyUrl]);

  async function copyPostLink() {
    if (!selectedPost) return;
    const url = publicUrl(`/blog/?post=${encodeURIComponent(selectedPost.slug)}`);
    const request = ++copyRequestRef.current;
    setIsCopying(true);
    setCopyMessage("Copiando link…");
    setManualCopyUrl(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      if (request !== copyRequestRef.current) return;
      setCopyMessage("Link copiado.");
    } catch {
      if (request !== copyRequestRef.current) return;
      setManualCopyUrl(url);
      setCopyMessage("Não foi possível copiar automaticamente. Selecione e copie o link abaixo.");
    } finally {
      if (request === copyRequestRef.current) setIsCopying(false);
    }
  }

  return (
    <main className="section pt-34">
      <Suspense fallback={null}><PostUrlState onChange={readPostFromUrl} /></Suspense>
      <div className="shell">
        <p className="eyebrow">Blog oficial</p>
        <h1 className="display-heading mt-5">As histórias da ACRUX, em um só arquivo.</h1>
        <p className="body-copy mt-6">Notícias, competições, bastidores, projetos e aprendizados publicados pela própria equipe.</p>

        <section aria-label="Busca e filtros do blog" className="glass-panel mt-10 rounded-3xl p-5 sm:p-7">
          <label className="block text-sm font-bold text-white" htmlFor="post-search">Pesquisar no blog</label>
          <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => {
            event.preventDefault();
            searchResultsRef.current?.focus({ preventScroll: true });
            searchResultsRef.current?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
          }}>
            <input className="admin-input" id="post-search" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, tag ou conteúdo" type="search" value={query} />
            <button className="button-primary shrink-0" type="submit">Pesquisar</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {categories.map((category) => (
              <motion.button
                aria-pressed={activeCategory === category}
                className={activeCategory === category ? "min-h-11 max-w-full break-words rounded-full border border-cyan-200/36 bg-cyan-300/13 px-4 py-2 text-sm font-bold text-acrux-cyan-bright" : "min-h-11 max-w-full break-words rounded-full border border-white/12 bg-white/3 px-4 py-2 text-sm font-bold text-acrux-muted transition-colors hover:border-cyan-200/28 hover:text-white"}
                key={category}
                onClick={() => setActiveCategory(category)}
                tabIndex={0}
                type="button"
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </section>

        {isLoading ? <div className="glass-panel mt-10 rounded-3xl p-7 text-acrux-muted" aria-live="polite">{selectedPostSlug === null ? "Carregando postagens…" : "Carregando a postagem e o arquivo do blog…"}</div> : null}
        {loadError ? <div className="mt-10 rounded-3xl border border-red-300/20 bg-red-950/22 p-6 text-red-100" role="alert">{loadError}</div> : null}

        {!isLoading && !loadError ? <p aria-live="polite" aria-atomic="true" className="mt-8 scroll-mt-24 text-sm text-acrux-muted" ref={searchResultsRef} role="status" tabIndex={-1}>{filteredPosts.length} {filteredPosts.length === 1 ? "postagem encontrada" : "postagens encontradas"}.</p> : null}

        {!isLoading && !loadError && featuredPost ? (
          <section className={recentPosts.length ? "mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]" : "mt-10 max-w-4xl"} aria-label="Postagens">
            <article className="glass-panel min-w-0 break-words overflow-hidden rounded-3xl">
              {browserClient && featuredPost.cover_path ? (
                <PostImage alt="" src={getPublicImageUrl(browserClient, "blog", featuredPost.cover_path) ?? ""} />
              ) : (
                <div className="placeholder-media min-h-52"><span>Postagem em destaque</span></div>
              )}
              <div className="p-5 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Postagem em destaque</p>
                <p className="mt-4 text-sm text-acrux-muted">{formatDate(featuredPost.published_at)}</p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-white sm:text-3xl">{featuredPost.title}</h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-acrux-muted">{featuredPost.excerpt}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {featuredPost.categories.map((category) => <span className="min-w-0 max-w-full rounded-full border border-cyan-200/18 bg-cyan-300/7 px-3 py-1 text-xs font-bold text-acrux-cyan-bright [overflow-wrap:anywhere]" key={category.id}>{category.name}</span>)}
                </div>
                <button className="button-primary mt-7 w-full sm:w-auto" data-post-slug={featuredPost.slug} onClick={(event) => openPost(featuredPost.slug, event.currentTarget)} type="button">Ler postagem</button>
              </div>
            </article>
            {recentPosts.length ? <div className="grid min-w-0 content-start gap-4">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Posts recentes</p>
              {recentPosts.map((post) => (
                <article className="glass-panel min-w-0 break-words rounded-2xl p-5" key={post.id}>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-acrux-cyan-bright">{post.categories[0]?.name ?? "ACRUX"}</p>
                  <h2 className="mt-2 text-xl font-bold text-white">{post.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-acrux-muted">{post.excerpt}</p>
                  <button className="mt-3 inline-flex min-h-11 items-center py-2 text-sm font-bold text-acrux-cyan-bright hover:text-white" data-post-slug={post.slug} onClick={(event) => openPost(post.slug, event.currentTarget)} type="button">Ler postagem →</button>
                </article>
              ))}
            </div> : null}
          </section>
        ) : null}

        {!isLoading && !loadError && !featuredPost ? <div className="glass-panel mt-10 rounded-3xl p-7"><p className="font-bold text-white">Nenhuma postagem encontrada.</p><p className="mt-3 text-sm leading-6 text-acrux-muted">{query.trim() || activeCategory !== "Todos" ? "Tente outro termo ou filtro." : "A equipe ainda não publicou conteúdos no blog."}</p></div> : null}

        {!isLoading && !loadError && selectedPostSlug !== null && !selectedPost ? (
          <section aria-labelledby="unavailable-post-title" className="glass-panel mt-10 scroll-mt-24 rounded-3xl p-5 sm:p-9" id="post-not-found" ref={unavailablePostRef} tabIndex={-1}>
            <h2 className="text-2xl font-bold text-white" id="unavailable-post-title">Postagem não encontrada.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-acrux-muted">Confira o link. A postagem pode não estar disponível ou ainda não ter sido publicada.</p>
            <button className="button-secondary mt-5 w-full sm:w-auto" onClick={closePost} type="button">Voltar ao blog</button>
          </section>
        ) : null}

        {selectedPost ? (
          <article aria-labelledby="reading-title" className="glass-panel mt-10 min-w-0 scroll-mt-24 break-words rounded-3xl p-5 sm:p-9" id="post-content" ref={readingRef} tabIndex={-1}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button className="inline-flex min-h-11 items-center py-2 text-sm font-bold text-acrux-cyan-bright hover:text-white" onClick={closePost} type="button">← Fechar leitura</button>
              <button className="button-secondary w-full sm:w-auto" disabled={isCopying} onClick={() => void copyPostLink()} type="button">Copiar link</button>
            </div>
            <p aria-live="polite" aria-atomic="true" className={copyMessage ? "mt-3 text-sm leading-6 text-acrux-muted" : "sr-only"} role="status">{copyMessage}</p>
            {manualCopyUrl ? <div className="mt-3"><label className="block text-sm font-bold text-white" htmlFor="post-share-link">Link da postagem</label><input className="admin-input mt-2" id="post-share-link" onFocus={(event) => event.currentTarget.select()} readOnly ref={manualCopyInputRef} value={manualCopyUrl} /></div> : null}
            <p className="mt-7 text-sm text-acrux-muted">{formatDate(selectedPost.published_at)} · Equipe ACRUX</p>
            <h2 className="mt-3 max-w-4xl text-2xl font-black tracking-[-0.05em] text-white sm:text-5xl" id="reading-title">{selectedPost.title}</h2>
            {browserClient && selectedPostImagePaths[0] ? <PostImage alt="" className="mt-7" src={getPublicImageUrl(browserClient, "blog", selectedPostImagePaths[0]) ?? ""} variant="article" /> : null}
            <p className="mt-7 max-w-3xl text-base leading-7 text-acrux-muted sm:text-lg sm:leading-8">{selectedPost.excerpt}</p>
            <div className="mt-7 max-w-3xl whitespace-pre-wrap text-base leading-8 text-white/88 [overflow-wrap:anywhere]">{selectedPost.body}</div>
            {browserClient && selectedPostImagePaths.length > 1 ? (
              <section aria-label="Imagens da postagem" className="mt-8">
                <h3 className="text-lg font-bold text-white">Imagens da postagem</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedPostImagePaths.slice(1).map((path, index) => (
                    <PostImage
                      alt={`Imagem ${index + 2} da postagem ${selectedPost.title}`}
                      key={path}
                      src={getPublicImageUrl(browserClient, "blog", path) ?? ""}
                      variant="gallery"
                    />
                  ))}
                </div>
              </section>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-2">{selectedPost.tags.map((tag) => <span className="min-w-0 max-w-full rounded-full border border-white/12 px-3 py-1.5 text-xs font-bold text-acrux-muted [overflow-wrap:anywhere]" key={tag}>#{tag}</span>)}</div>
          </article>
        ) : null}

        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}
