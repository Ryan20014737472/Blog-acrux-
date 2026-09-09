"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";
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

export function BlogIndex() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const browserClient = createSupabaseBrowserClient();

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
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;

  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Blog oficial</p>
        <h1 className="display-heading mt-5">As histórias da ACRUX, em um só arquivo.</h1>
        <p className="body-copy mt-6">Notícias, competições, bastidores, projetos e aprendizados publicados pela própria equipe.</p>

        <section aria-label="Busca e filtros do blog" className="glass-panel mt-10 rounded-3xl p-5 sm:p-7">
          <label className="block text-sm font-bold text-white" htmlFor="post-search">Pesquisar no blog</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input className="admin-input" id="post-search" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, tag ou conteúdo" type="search" value={query} />
            <button className="button-primary shrink-0" type="button">Pesquisar</button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {categories.map((category) => (
              <motion.button
                aria-pressed={activeCategory === category}
                className={activeCategory === category ? "rounded-full border border-cyan-200/36 bg-cyan-300/13 px-3 py-2 text-sm font-bold text-acrux-cyan-bright" : "rounded-full border border-white/12 bg-white/3 px-3 py-2 text-sm font-bold text-acrux-muted transition-colors hover:border-cyan-200/28 hover:text-white"}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </section>

        {isLoading ? <div className="glass-panel mt-10 rounded-3xl p-7 text-acrux-muted" aria-live="polite">Carregando postagens…</div> : null}
        {loadError ? <div className="mt-10 rounded-3xl border border-red-300/20 bg-red-950/22 p-6 text-red-100" role="alert">{loadError}</div> : null}

        {!isLoading && !loadError && featuredPost ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]" aria-label="Postagens">
            <article className="glass-panel overflow-hidden rounded-3xl">
              {browserClient && featuredPost.cover_path ? (
                <img alt="" className="h-64 w-full object-cover sm:h-80" src={getPublicImageUrl(browserClient, "blog", featuredPost.cover_path) ?? ""} />
              ) : (
                <div className="placeholder-media min-h-52"><span>Postagem em destaque</span></div>
              )}
              <div className="p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Postagem em destaque</p>
                <p className="mt-4 text-sm text-acrux-muted">{formatDate(featuredPost.published_at)}</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">{featuredPost.title}</h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-acrux-muted">{featuredPost.excerpt}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {featuredPost.categories.map((category) => <span className="rounded-full border border-cyan-200/18 bg-cyan-300/7 px-3 py-1 text-xs font-bold text-acrux-cyan-bright" key={category.id}>{category.name}</span>)}
                </div>
                <button className="button-primary mt-7" onClick={() => setSelectedPostId(featuredPost.id)} type="button">Ler postagem</button>
              </div>
            </article>
            <div className="grid content-start gap-4">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-acrux-cyan-bright">Posts recentes</p>
              {recentPosts.slice(0, 4).map((post) => (
                <article className="glass-panel rounded-2xl p-5" key={post.id}>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-acrux-cyan-bright">{post.categories[0]?.name ?? "ACRUX"}</p>
                  <h2 className="mt-2 text-xl font-bold text-white">{post.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-acrux-muted">{post.excerpt}</p>
                  <button className="mt-4 text-sm font-bold text-acrux-cyan-bright hover:text-white" onClick={() => setSelectedPostId(post.id)} type="button">Ler postagem →</button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && !loadError && !featuredPost ? <div className="glass-panel mt-10 rounded-3xl p-7"><p className="font-bold text-white">Nenhuma postagem encontrada.</p><p className="mt-3 text-sm leading-6 text-acrux-muted">{query.trim() || activeCategory !== "Todos" ? "Tente outro termo ou filtro." : "A equipe ainda não publicou conteúdos no blog."}</p></div> : null}

        {selectedPost ? (
          <article className="glass-panel mt-10 rounded-3xl p-6 sm:p-9" id="post-content">
            <button className="text-sm font-bold text-acrux-cyan-bright hover:text-white" onClick={() => setSelectedPostId(null)} type="button">← Fechar leitura</button>
            <p className="mt-7 text-sm text-acrux-muted">{formatDate(selectedPost.published_at)} · Equipe ACRUX</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">{selectedPost.title}</h2>
            {browserClient && selectedPost.cover_path ? <img alt="" className="mt-7 max-h-120 w-full rounded-2xl object-cover" src={getPublicImageUrl(browserClient, "blog", selectedPost.cover_path) ?? ""} /> : null}
            <p className="mt-7 max-w-3xl text-lg leading-8 text-acrux-muted">{selectedPost.excerpt}</p>
            <div className="mt-7 max-w-3xl whitespace-pre-wrap text-base leading-8 text-white/88">{selectedPost.body}</div>
            <div className="mt-8 flex flex-wrap gap-2">{selectedPost.tags.map((tag) => <span className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-bold text-acrux-muted" key={tag}>#{tag}</span>)}</div>
          </article>
        ) : null}

        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}
