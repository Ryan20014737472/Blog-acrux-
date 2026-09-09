"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { AdminWorkspace } from "@/components/admin/admin-workspace";
import type { AdminSession } from "@/components/admin/admin-gate";
import { slugify } from "@/lib/content/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl, uploadPublicImage } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];

const teamAreas = ["CAD", "Programação", "Mecânica", "Elétrica", "Gestão", "Marketing", "Impacto STEAM"] as const;

interface TeamDraft {
  area: string;
  displayOrder: string;
  id: string | null;
  isPublished: boolean;
  name: string;
  photoPath: string | null;
  roleTitle: string;
  shortBio: string;
  slug: string;
}

const emptyDraft: TeamDraft = {
  id: null,
  name: "",
  slug: "",
  area: "",
  roleTitle: "",
  shortBio: "",
  photoPath: null,
  displayOrder: "0",
  isPublished: false,
};

function toDraft(member: TeamMemberRow): TeamDraft {
  return {
    id: member.id,
    name: member.name,
    slug: member.slug,
    area: member.area ?? "",
    roleTitle: member.role_title ?? "",
    shortBio: member.short_bio ?? "",
    photoPath: member.photo_path,
    displayOrder: String(member.display_order),
    isPublished: member.is_published,
  };
}

function getNumber(value: string) {
  const result = Number.parseInt(value, 10);
  return Number.isFinite(result) && result >= 0 ? result : 0;
}

interface TeamManagerProps {
  session: AdminSession;
}

export function TeamManager({ session }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [draft, setDraft] = useState<TeamDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = session.role === "admin";
  const browserClient = createSupabaseBrowserClient();
  const photoUrl = browserClient ? getPublicImageUrl(browserClient, "avatars", draft.photoPath) : null;

  const loadMembers = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A conexão com o Supabase não está disponível neste ambiente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: loadError } = await supabase
      .from("team_members")
      .select("*")
      .order("display_order")
      .order("name");

    if (loadError) {
      setError("Não foi possível carregar os integrantes.");
    } else {
      setMembers(data ?? []);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  function updateName(name: string) {
    setDraft((current) => ({
      ...current,
      name,
      slug: current.slug === slugify(current.name) ? slugify(name) : current.slug,
    }));
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setFeedback(null);
    setIsUploading(true);

    try {
      const path = await uploadPublicImage(supabase, "avatars", "team", file);
      setDraft((current) => ({ ...current, photoPath: path }));
      setFeedback("Foto enviada. Salve o perfil para vinculá-la ao integrante.");
    } catch {
      setError("Não foi possível enviar a foto. Verifique o formato e o tamanho do arquivo.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;

    const name = draft.name.trim();
    const slug = slugify(draft.slug);

    if (!name || !slug) {
      setError("Preencha nome e endereço do perfil antes de salvar.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError(null);
    setFeedback(null);
    setIsSaving(true);

    const payload = {
      name,
      slug,
      area: draft.area || null,
      role_title: draft.roleTitle.trim() || null,
      short_bio: draft.shortBio.trim() || null,
      photo_path: draft.photoPath,
      display_order: getNumber(draft.displayOrder),
      is_published: draft.isPublished,
    };

    const result = draft.id
      ? await supabase.from("team_members").update(payload).eq("id", draft.id).select().single()
      : await supabase.from("team_members").insert(payload).select().single();

    setIsSaving(false);

    if (result.error || !result.data) {
      setError(result.error?.code === "23505" ? "Esse endereço de perfil já está em uso." : "Não foi possível salvar o integrante.");
      return;
    }

    setDraft(toDraft(result.data));
    setFeedback(draft.id ? "Perfil atualizado." : "Integrante cadastrado.");
    await loadMembers();
  }

  async function deleteMember() {
    if (!draft.id || !canManage) return;
    if (!window.confirm("Excluir este integrante? Essa ação não pode ser desfeita.")) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsSaving(true);
    const { error: deleteError } = await supabase.from("team_members").delete().eq("id", draft.id);
    setIsSaving(false);

    if (deleteError) {
      setError("Não foi possível excluir o integrante.");
      return;
    }

    setDraft(emptyDraft);
    setFeedback("Perfil excluído. A foto enviada permanece guardada no acervo de mídia.");
    await loadMembers();
  }

  return (
    <AdminWorkspace
      description="Cadastre os perfis oficiais da equipe com área, função, apresentação e foto. Apenas administradores podem alterar estes registros."
      section="equipe"
      session={session}
      title="Gerenciar equipe"
    >
      <div className="mt-10 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="glass-panel h-fit rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-lg font-bold text-white">Integrantes</p><p className="mt-1 text-sm text-acrux-muted">{members.length} registro(s)</p></div>
            {canManage ? <button className="button-secondary min-h-10 px-4" onClick={() => { setDraft(emptyDraft); setError(null); setFeedback(null); }} type="button">Novo</button> : null}
          </div>
          <div className="mt-5 grid gap-2">
            {isLoading ? <p className="text-sm text-acrux-muted">Carregando equipe…</p> : null}
            {!isLoading && members.length === 0 ? <p className="rounded-2xl border border-dashed border-cyan-200/16 p-4 text-sm leading-6 text-acrux-muted">Nenhum integrante cadastrado ainda.</p> : null}
            {members.map((member) => (
              <button className={draft.id === member.id ? "rounded-2xl border border-cyan-200/32 bg-cyan-300/9 p-4 text-left" : "rounded-2xl border border-white/8 bg-[#020817]/30 p-4 text-left transition-colors hover:border-cyan-200/22"} key={member.id} onClick={() => { setDraft(toDraft(member)); setError(null); setFeedback(null); }} type="button">
                <div className="flex items-start justify-between gap-3"><p className="font-bold text-white">{member.name}</p><span className="text-xs font-bold text-acrux-cyan-bright">{member.is_published ? "Público" : "Rascunho"}</span></div>
                <p className="mt-2 text-sm text-acrux-muted">{[member.area, member.role_title].filter(Boolean).join(" · ") || "Área e função não informadas"}</p>
              </button>
            ))}
          </div>
        </aside>

        {canManage ? <form className="glass-panel rounded-3xl p-5 sm:p-7" onSubmit={saveMember}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-lg font-bold text-white">{draft.id ? "Editar integrante" : "Novo integrante"}</p><p className="mt-1 text-sm text-acrux-muted">Use somente informações e fotos aprovadas pela pessoa e pela equipe.</p></div>{draft.id ? <button className="rounded-full border border-red-200/20 px-4 py-2 text-sm font-bold text-red-100 transition-colors hover:border-red-200/50" disabled={isSaving} onClick={deleteMember} type="button">Excluir</button> : null}</div>
          <div className="mt-7 grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-name">Nome<input className="admin-input" id="member-name" onChange={(event) => updateName(event.target.value)} required value={draft.name} /></label>
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-slug">Endereço do perfil<input className="admin-input" id="member-slug" onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} required value={draft.slug} /></label>
            <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-area">Área<select className="admin-input" id="member-area" onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))} value={draft.area}><option value="">Selecionar área</option>{teamAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-role">Função<input className="admin-input" id="member-role" onChange={(event) => setDraft((current) => ({ ...current, roleTitle: event.target.value }))} value={draft.roleTitle} /></label></div>
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-bio">Descrição curta<textarea className="admin-input min-h-30 resize-y" id="member-bio" maxLength={500} onChange={(event) => setDraft((current) => ({ ...current, shortBio: event.target.value }))} value={draft.shortBio} /></label>
            <div className="grid gap-3"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-photo">Foto<input accept="image/avif,image/gif,image/jpeg,image/png,image/webp" className="admin-file-input" disabled={isUploading} id="member-photo" onChange={uploadPhoto} type="file" /></label>{photoUrl ? <img alt={`Prévia de ${draft.name || "integrante"}`} className="max-h-80 w-full rounded-2xl border border-white/10 object-cover" src={photoUrl} /> : <p className="text-sm text-acrux-muted">Nenhuma foto enviada.</p>}</div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-order">Ordem de exibição<input className="admin-input" id="member-order" inputMode="numeric" min="0" onChange={(event) => setDraft((current) => ({ ...current, displayOrder: event.target.value }))} type="number" value={draft.displayOrder} /></label><label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-[#020817]/45 px-4 text-sm font-bold text-white"><input checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} type="checkbox" />Publicar perfil</label></div>
          </div>
          {error ? <p className="mt-6 rounded-2xl border border-red-300/22 bg-red-950/24 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}{feedback ? <p className="mt-6 rounded-2xl border border-cyan-200/18 bg-cyan-300/8 px-4 py-3 text-sm text-acrux-cyan-bright" role="status">{feedback}</p> : null}
          <button className="button-primary mt-7" disabled={isSaving || isUploading} type="submit">{isSaving ? "Salvando…" : draft.id ? "Salvar alterações" : "Cadastrar integrante"}</button>
        </form> : <div className="glass-panel rounded-3xl p-6 sm:p-8"><p className="text-lg font-bold text-white">Acesso de leitura</p><p className="mt-3 max-w-xl text-base leading-7 text-acrux-muted">Sua conta pode consultar a equipe, mas alterações de integrantes exigem uma conta administradora.</p></div>}
      </div>
    </AdminWorkspace>
  );
}
