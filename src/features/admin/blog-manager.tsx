"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { AdminWorkspace } from "@/components/admin/admin-workspace";
import type { AdminSession } from "@/components/admin/admin-gate";
import { parseTags, slugify } from "@/lib/content/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl, uploadPublicImage } from "@/lib/supabase/storage";
import type { PublicationStatus } from "@/types/content";
import type { Database } from "@/types/database";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type PostCategoryRow = Database["public"]["Tables"]["post_categories"]["Row"];

interface ManagedPost extends PostRow {
  categoryIds: string[];
}

interface PostDraft {
  body: string;
  categoryIds: string[];
  coverPath: string | null;
  excerpt: string;
  featured: boolean;
  id: string | null;
  publishedAt: string | null;
  slug: string;
  status: PublicationStatus;
  tags: string;
  title: string;
}

const emptyDraft: PostDraft = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverPath: null,
  tags: "",
  status: "draft",
  featured: false,
  publishedAt: null,
  categoryIds: [],
};

function toDraft(post: ManagedPost): PostDraft {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    coverPath: post.cover_path,
    tags: post.tags.join(", "),
    status: post.status,
    featured: post.is_featured,
    publishedAt: post.published_at,
    categoryIds: post.categoryIds,
  };
}

function messageFromError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    return "Esse slug já está em uso. Altere o endereço do conteúdo e tente novamente.";
  }

  return fallback;
}

function statusLabel(status: PublicationStatus) {
  if (status === "published") return "Publicado";
  if (status === "archived") return "Arquivado";
  return "Rascunho";
}

interface BlogManagerProps {
  session: AdminSession;
}

export function BlogManager({ session }: BlogManagerProps) {
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageCategories = session.role === "admin";
  const editorLocked = session.role === "editor" && Boolean(draft.id) && draft.status !== "draft";
  const browserClient = createSupabaseBrowserClient();
  const coverUrl = browserClient ? getPublicImageUrl(browserClient, "blog", draft.coverPath) : null;

  const loadContent = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A conexão com o Supabase não está disponível neste ambiente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const [postsResult, categoriesResult, linksResult] = await Promise.all([
      supabase.from("posts").select("*").order("updated_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("post_categories").select("*"),
    ]);

    if (postsResult.error || categoriesResult.error || linksResult.error) {
      setError("Não foi possível carregar os conteúdos do blog.");
      setIsLoading(false);
      return;
    }

    const linksByPost = new Map<string, string[]>();
    for (const link of (linksResult.data ?? []) as PostCategoryRow[]) {
      const existing = linksByPost.get(link.post_id) ?? [];
      existing.push(link.category_id);
      linksByPost.set(link.post_id, existing);
    }

    const rows = (postsResult.data ?? []) as PostRow[];
    setPosts(rows.map((post) => ({ ...post, categoryIds: linksByPost.get(post.id) ?? [] })));
    setCategories((categoriesResult.data ?? []) as CategoryRow[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  function updateTitle(title: string) {
    setDraft((current) => ({
      ...current,
      title,
      slug: current.slug === slugify(current.title) ? slugify(title) : current.slug,
    }));
  }

  function toggleCategory(categoryId: string) {
    setDraft((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A conexão com o Supabase não está disponível neste ambiente.");
      return;
    }

    setError(null);
    setFeedback(null);
    setIsUploading(true);

    try {
      const path = await uploadPublicImage(supabase, "blog", "posts", file);
      setDraft((current) => ({ ...current, coverPath: path }));
      setFeedback("Imagem de capa enviada. Salve a postagem para vincular a imagem.");
    } catch (uploadError) {
      setError(messageFromError(uploadError, "Não foi possível enviar a imagem."));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    const slug = slugify(name);

    if (!name || !slug) {
      setError("Informe um nome válido para a categoria.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    const { data, error: categoryError } = await supabase
      .from("categories")
      .insert({ name, slug })
      .select()
      .single();

    if (categoryError || !data) {
      setError(messageFromError(categoryError, "Não foi possível criar a categoria."));
      return;
    }

    setCategories((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    setDraft((current) => ({ ...current, categoryIds: [...current.categoryIds, data.id] }));
    setNewCategoryName("");
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editorLocked) {
      setError("Contas editoras podem alterar apenas os próprios rascunhos. Publicação e arquivamento exigem administrador.");
      return;
    }
    const title = draft.title.trim();
    const slug = slugify(draft.slug);
    const excerpt = draft.excerpt.trim();
    const body = draft.body.trim();

    if (!title || !slug || !excerpt || !body) {
      setError("Preencha título, endereço, resumo e conteúdo antes de salvar.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setFeedback(null);
    setIsSaving(true);

    const publishedAt = draft.status === "published" ? draft.publishedAt ?? new Date().toISOString() : null;
    const payload = {
      title,
      slug,
      excerpt,
      body,
      cover_path: draft.coverPath,
      tags: parseTags(draft.tags),
      status: draft.status,
      is_featured: draft.featured,
      published_at: publishedAt,
    };

    try {
      let savedPost: PostRow | null = null;

      if (draft.id) {
        const { data, error: updateError } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", draft.id)
          .select()
          .single();

        if (updateError) throw updateError;
        savedPost = data;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Sua sessão expirou. Entre novamente para salvar.");

        const { data, error: insertError } = await supabase
          .from("posts")
          .insert({ ...payload, author_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        savedPost = data;
      }

      if (!savedPost) throw new Error("A postagem não foi salva.");

      const { error: removeLinksError } = await supabase
        .from("post_categories")
        .delete()
        .eq("post_id", savedPost.id);

      if (removeLinksError) throw removeLinksError;

      if (draft.categoryIds.length > 0) {
        const { error: addLinksError } = await supabase
          .from("post_categories")
          .insert(draft.categoryIds.map((categoryId) => ({ post_id: savedPost.id, category_id: categoryId })));

        if (addLinksError) throw addLinksError;
      }

      setDraft(toDraft({ ...savedPost, categoryIds: draft.categoryIds }));
      setFeedback(draft.id ? "Postagem atualizada." : "Postagem criada.");
      await loadContent();
    } catch (saveError) {
      setError(messageFromError(saveError, "Não foi possível salvar a postagem."));
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePost() {
    if (!draft.id || session.role !== "admin") return;
    if (!window.confirm("Excluir esta postagem? Esta ação não pode ser desfeita.")) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setFeedback(null);
    setIsSaving(true);
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", draft.id);
    setIsSaving(false);

    if (deleteError) {
      setError("Não foi possível excluir a postagem.");
      return;
    }

    setDraft(emptyDraft);
    setFeedback("Postagem excluída. A imagem enviada continua guardada no acervo de mídia.");
    await loadContent();
  }

  return (
    <AdminWorkspace
      description="Crie rascunhos, publique notícias e organize categorias sem sair do painel. Postagens publicadas aparecem no Blog público."
      section="blog"
      session={session}
      title="Gerenciar blog"
    >
      <div className="mt-10 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="glass-panel h-fit rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-white">Postagens</p>
              <p className="mt-1 text-sm text-acrux-muted">{posts.length} registro(s)</p>
            </div>
            <button className="button-secondary min-h-10 px-4" onClick={() => { setDraft(emptyDraft); setError(null); setFeedback(null); }} type="button">Nova</button>
          </div>
          <div className="mt-5 grid gap-2">
            {isLoading ? <p className="text-sm text-acrux-muted">Carregando postagens…</p> : null}
            {!isLoading && posts.length === 0 ? <p className="rounded-2xl border border-dashed border-cyan-200/16 p-4 text-sm leading-6 text-acrux-muted">Ainda não há postagens. Crie a primeira ao lado.</p> : null}
            {posts.map((post) => (
              <button
                className={draft.id === post.id ? "rounded-2xl border border-cyan-200/32 bg-cyan-300/9 p-4 text-left" : "rounded-2xl border border-white/8 bg-[#020817]/30 p-4 text-left transition-colors hover:border-cyan-200/22"}
                key={post.id}
                onClick={() => { setDraft(toDraft(post)); setError(null); setFeedback(null); }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-white">{post.title}</p>
                  <span className="shrink-0 text-xs font-bold text-acrux-cyan-bright">{statusLabel(post.status)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-acrux-muted">{post.excerpt}</p>
              </button>
            ))}
          </div>
        </aside>

        <form className="glass-panel rounded-3xl p-5 sm:p-7" onSubmit={savePost}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-white">{draft.id ? "Editar postagem" : "Nova postagem"}</p>
              <p className="mt-1 text-sm text-acrux-muted">Campos com conteúdo oficial só devem ser publicados após revisão da equipe.</p>
            </div>
            {draft.id && session.role === "admin" ? <button className="rounded-full border border-red-200/20 px-4 py-2 text-sm font-bold text-red-100 transition-colors hover:border-red-200/50" disabled={isSaving} onClick={deletePost} type="button">Excluir</button> : null}
          </div>

          <div className="mt-7 grid gap-5">
            {editorLocked ? <p className="rounded-2xl border border-cyan-200/18 bg-cyan-300/8 px-4 py-3 text-sm leading-6 text-acrux-muted">Esta postagem já está pública ou arquivada. Uma conta editora não pode alterá-la.</p> : null}
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="post-title">
              Título
              <input className="admin-input" id="post-title" onChange={(event) => updateTitle(event.target.value)} required value={draft.title} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="post-slug">
              Endereço do post
              <input className="admin-input" id="post-slug" onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} required value={draft.slug} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="post-excerpt">
              Resumo
              <textarea className="admin-input min-h-25 resize-y" id="post-excerpt" maxLength={280} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))} required value={draft.excerpt} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="post-body">
              Conteúdo
              <textarea className="admin-input min-h-55 resize-y" id="post-body" onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} required value={draft.body} />
            </label>

            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-bold text-white" htmlFor="post-cover">
                Imagem de capa
                <input accept="image/avif,image/gif,image/jpeg,image/png,image/webp" className="admin-file-input" disabled={isUploading} id="post-cover" onChange={uploadCover} type="file" />
              </label>
              {coverUrl ? <img alt="Prévia da imagem de capa" className="max-h-68 w-full rounded-2xl border border-white/10 object-cover" src={coverUrl} /> : <p className="text-sm text-acrux-muted">Nenhuma capa enviada.</p>}
            </div>

            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="post-tags">
              Tags
              <input className="admin-input" id="post-tags" onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="Ex.: robótica, bastidores, engenharia" value={draft.tags} />
            </label>

            <div className="grid gap-3">
              <p className="text-sm font-bold text-white">Categorias</p>
              {categories.length ? <div className="flex flex-wrap gap-2">{categories.map((category) => <label className={draft.categoryIds.includes(category.id) ? "cursor-pointer rounded-full border border-cyan-200/32 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-acrux-cyan-bright" : "cursor-pointer rounded-full border border-white/12 px-3 py-2 text-sm font-bold text-acrux-muted"} key={category.id}><input checked={draft.categoryIds.includes(category.id)} className="sr-only" onChange={() => toggleCategory(category.id)} type="checkbox" />{category.name}</label>)}</div> : <p className="text-sm text-acrux-muted">Nenhuma categoria cadastrada.</p>}
              {canManageCategories ? <div className="flex flex-col gap-2 sm:flex-row"><input className="admin-input" onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Nova categoria" value={newCategoryName} /><button className="button-secondary min-h-12 shrink-0" onClick={createCategory} type="button">Adicionar categoria</button></div> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-2 text-sm font-bold text-white" htmlFor="post-status">
                Status
                <select className="admin-input" id="post-status" onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as PublicationStatus }))} value={draft.status}>
                  <option value="draft">Rascunho</option>
                  <option disabled={session.role !== "admin"} value="published">Publicado</option>
                  <option disabled={session.role !== "admin"} value="archived">Arquivado</option>
                </select>
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-[#020817]/45 px-4 text-sm font-bold text-white"><input checked={draft.featured} disabled={session.role !== "admin"} onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.checked }))} type="checkbox" />Em destaque</label>
            </div>
          </div>

          {error ? <p className="mt-6 rounded-2xl border border-red-300/22 bg-red-950/24 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}
          {feedback ? <p className="mt-6 rounded-2xl border border-cyan-200/18 bg-cyan-300/8 px-4 py-3 text-sm text-acrux-cyan-bright" role="status">{feedback}</p> : null}
          <div className="mt-7 flex flex-wrap gap-3"><button className="button-primary" disabled={editorLocked || isSaving || isUploading} type="submit">{isSaving ? "Salvando…" : draft.id ? "Salvar alterações" : "Criar postagem"}</button>{draft.status === "published" && draft.publishedAt ? <p className="self-center text-sm text-acrux-muted">Publicada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(draft.publishedAt))}</p> : null}</div>
        </form>
      </div>
    </AdminWorkspace>
  );
}
