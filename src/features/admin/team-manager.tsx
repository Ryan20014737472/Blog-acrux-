"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { AdminWorkspace } from "@/components/admin/admin-workspace";
import type { AdminSession } from "@/components/admin/admin-gate";
import { ConfirmationDialog, type ConfirmationRequest } from "@/components/admin/confirmation-dialog";
import { slugify } from "@/lib/content/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl, uploadPublicImage } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type TeamAreaRow = Database["public"]["Tables"]["team_areas"]["Row"];

interface TeamDraft {
  area: string;
  displayOrder: string;
  id: string | null;
  isPublished: boolean;
  isHomeFeatured: boolean;
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
  isHomeFeatured: false,
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
    isHomeFeatured: member.is_home_featured,
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
  const [areas, setAreas] = useState<TeamAreaRow[]>([]);
  const [areaOrders, setAreaOrders] = useState<Record<string, string>>({});
  const [newArea, setNewArea] = useState("");
  const [draft, setDraft] = useState<TeamDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingAreas, setIsSavingAreas] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);

  const canManage = session.role === "admin";
  const homeFeaturedCount = members.filter((member) => member.is_home_featured).length;
  const homeSlotAvailable = draft.isHomeFeatured || homeFeaturedCount < 3;
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
    const [{ data, error: loadError }, { data: areaData, error: areaError }] = await Promise.all([
      supabase.from("team_members").select("*").order("display_order").order("name"),
      supabase.from("team_areas").select("*").order("display_order").order("name"),
    ]);

    if (loadError) {
      setError("Não foi possível carregar os integrantes.");
    } else {
      setMembers(data ?? []);
    }
    if (areaError) {
      setError("Não foi possível carregar as áreas da equipe.");
    } else {
      setAreas(areaData ?? []);
      setAreaOrders(Object.fromEntries((areaData ?? []).map((area) => [area.name, String(area.display_order)])));
    }

    setIsLoading(false);
  }, []);

  async function saveAreaOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setError(null);
    setFeedback(null);
    setIsSavingAreas(true);
    const { error: saveError } = await supabase.from("team_areas").upsert(
      areas.map((area) => ({ name: area.name, display_order: getNumber(areaOrders[area.name] ?? "0") })),
      { onConflict: "name" },
    );
    setIsSavingAreas(false);
    if (saveError) {
      setError("Não foi possível salvar a ordem das áreas.");
      return;
    }
    setFeedback("Ordem das áreas atualizada.");
    await loadMembers();
  }

  async function addArea() {
    if (!canManage) return;
    const name = newArea.trim();
    if (!name) return;
    if (areas.some((area) => area.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      setError("Essa área já está cadastrada.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setError(null);
    setFeedback(null);
    setIsSavingAreas(true);
    const { error: addError } = await supabase.from("team_areas").insert({
      name,
      display_order: Math.max(0, ...areas.map((area) => area.display_order)) + 1,
    });
    setIsSavingAreas(false);
    if (addError) {
      setError("Não foi possível adicionar a área.");
      return;
    }
    setNewArea("");
    setFeedback("Área adicionada. Agora você pode selecioná-la no perfil de um integrante.");
    await loadMembers();
  }

  function askDeleteArea(name: string) {
    if (!canManage || members.some((member) => member.area === name)) return;
    const unsavedOrder = areas.some((area) => areaOrders[area.name] !== String(area.display_order));
    setConfirmation({
      title: `Excluir a área ${name}?`,
      description: `A área será removida da lista de classificação. Nenhum integrante será excluído.${unsavedOrder ? " Alterações de ordem ainda não salvas serão descartadas." : ""}`,
      confirmLabel: "Excluir área",
      tone: "danger",
      onConfirm: async () => {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        setError(null);
        setFeedback(null);
        setIsSavingAreas(true);
        try {
          const { error: deleteError, count } = await supabase.from("team_areas").delete({ count: "exact" }).eq("name", name);
          if (deleteError) {
            setError(deleteError.code === "23503" ? `A área ${name} possui integrantes. Mova-os para outra área antes de excluí-la.` : "Não foi possível excluir a área.");
            return;
          }
          if (count !== 1) {
            setError("A área não foi encontrada. Atualize a página e tente novamente.");
            return;
          }
          setDraft((current) => current.area === name ? { ...current, area: "" } : current);
          setFeedback(`Área ${name} excluída.`);
          await loadMembers();
        } finally {
          setIsSavingAreas(false);
        }
      },
    });
  }

  async function confirmAreaAction() {
    if (!confirmation || isSavingAreas || isSaving) return;
    try {
      await confirmation.onConfirm();
    } catch {
      setError("Não foi possível excluir a área. Tente novamente.");
    } finally {
      setConfirmation(null);
    }
  }

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
      is_home_featured: draft.isHomeFeatured,
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

  function deleteMember() {
    if (!draft.id || !canManage) return;
    const memberId = draft.id;
    setConfirmation({
      title: "Excluir integrante?",
      description: `O perfil de ${draft.name} será excluído definitivamente. A foto enviada continuará no acervo de mídia.`,
      confirmLabel: "Excluir integrante",
      tone: "danger",
      onConfirm: async () => {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        setError(null);
        setIsSaving(true);
        try {
          const { error: deleteError } = await supabase.from("team_members").delete().eq("id", memberId);
          if (deleteError) {
            setError("Não foi possível excluir o integrante.");
            return;
          }
          setDraft(emptyDraft);
          setFeedback("Perfil excluído. A foto enviada permanece guardada no acervo de mídia.");
          await loadMembers();
        } finally {
          setIsSaving(false);
        }
      },
    });
  }

  return (
    <AdminWorkspace
      description="Cadastre os perfis e organize as áreas da equipe. Apenas administradores podem alterar estes registros."
      section="equipe"
      session={session}
      title="Gerenciar equipe"
    >
      {error ? <p className="mt-6 rounded-2xl border border-red-300/22 bg-red-950/24 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}
      {feedback ? <p className="mt-6 rounded-2xl border border-cyan-200/18 bg-cyan-300/8 px-4 py-3 text-sm text-acrux-cyan-bright" role="status">{feedback}</p> : null}
      {canManage ? <form className="glass-panel mt-10 rounded-3xl p-5 sm:p-7" onSubmit={saveAreaOrders}>
        <div><h2 className="text-lg font-bold text-white">Ordem das áreas</h2><p className="mt-1 text-sm leading-6 text-acrux-muted">As áreas aparecem como seções na página da equipe. Números menores aparecem primeiro. Para excluir uma área em uso, mova seus integrantes para outra área antes.</p></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{areas.map((area) => {
          const memberCount = members.filter((member) => member.area === area.name).length;
          return <div className="rounded-xl border border-white/10 bg-[#020817]/35 px-4 py-3" key={area.name}>
            <label className="flex items-center justify-between gap-3 text-sm font-bold text-white">{area.name}<input aria-label={`Ordem da área ${area.name}`} className="admin-input w-20 text-center" inputMode="numeric" min="0" onChange={(event) => setAreaOrders((current) => ({ ...current, [area.name]: event.target.value }))} type="number" value={areaOrders[area.name] ?? "0"} /></label>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/8 pt-2 text-xs text-acrux-muted"><span>{memberCount ? `${memberCount} ${memberCount === 1 ? "integrante vinculado" : "integrantes vinculados"}` : "Área vazia"}</span><button aria-label={`Excluir área ${area.name}`} className="rounded-lg px-2 py-1 font-bold text-red-100 transition-colors enabled:hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-45" disabled={isSavingAreas || isLoading || memberCount > 0} onClick={() => askDeleteArea(area.name)} title={memberCount ? "Mova os integrantes para outra área antes de excluir" : `Excluir área ${area.name}`} type="button">Excluir</button></div>
          </div>;
        })}</div>
        <div className="mt-5 flex flex-wrap items-end gap-3"><button className="button-secondary min-h-10 px-4" disabled={isSavingAreas || areas.length === 0} type="submit">{isSavingAreas ? "Salvando…" : "Salvar ordem das áreas"}</button><label className="grid gap-1.5 text-sm font-bold text-white">Nova área<input className="admin-input min-w-40" maxLength={60} onChange={(event) => setNewArea(event.target.value)} placeholder="Ex.: Engenharia" value={newArea} /></label><button className="button-secondary min-h-10 px-4" disabled={isSavingAreas || !newArea.trim()} onClick={addArea} type="button">Adicionar área</button></div>
      </form> : null}
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
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
            <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-area">Área<select className="admin-input" id="member-area" onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))} value={draft.area}><option value="">Selecionar área</option>{draft.area && !areas.some((area) => area.name === draft.area) ? <option value={draft.area}>{draft.area}</option> : null}{areas.map((area) => <option key={area.name} value={area.name}>{area.name}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-role">Função<input className="admin-input" id="member-role" onChange={(event) => setDraft((current) => ({ ...current, roleTitle: event.target.value }))} value={draft.roleTitle} /></label></div>
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-bio">Descrição curta<textarea className="admin-input min-h-30 resize-y" id="member-bio" maxLength={500} onChange={(event) => setDraft((current) => ({ ...current, shortBio: event.target.value }))} value={draft.shortBio} /></label>
            <div className="grid gap-3"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-photo">Foto<input accept="image/avif,image/gif,image/jpeg,image/png,image/webp" className="admin-file-input" disabled={isUploading} id="member-photo" onChange={uploadPhoto} type="file" /></label>{photoUrl ? <img alt={`Prévia de ${draft.name || "integrante"}`} className="max-h-80 w-full rounded-2xl border border-white/10 object-cover" src={photoUrl} /> : <p className="text-sm text-acrux-muted">Nenhuma foto enviada.</p>}</div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]"><label className="grid gap-2 text-sm font-bold text-white" htmlFor="member-order">Ordem dentro da área<input className="admin-input" id="member-order" inputMode="numeric" min="0" onChange={(event) => setDraft((current) => ({ ...current, displayOrder: event.target.value }))} type="number" value={draft.displayOrder} /><span className="text-xs font-normal text-acrux-muted">A ordem das áreas é definida no painel acima.</span></label><div className="grid gap-3"><label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-[#020817]/45 px-4 text-sm font-bold text-white"><input checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} type="checkbox" />Publicar perfil</label><label className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 text-sm font-bold ${homeSlotAvailable ? "border-cyan-200/15 bg-cyan-300/5 text-white" : "border-white/8 bg-white/3 text-acrux-muted"}`}><input checked={draft.isHomeFeatured} disabled={!homeSlotAvailable} onChange={(event) => setDraft((current) => ({ ...current, isHomeFeatured: event.target.checked, isPublished: event.target.checked ? true : current.isPublished }))} type="checkbox" />Exibir na Home ({homeFeaturedCount}/3)</label>{!homeSlotAvailable ? <p className="text-xs leading-5 text-acrux-muted">Limite atingido. Remova outro destaque para liberar esta vaga.</p> : null}</div></div>
          </div>
          <button className="button-primary mt-7" disabled={isSaving || isUploading} type="submit">{isSaving ? "Salvando…" : draft.id ? "Salvar alterações" : "Cadastrar integrante"}</button>
        </form> : <div className="glass-panel rounded-3xl p-6 sm:p-8"><p className="text-lg font-bold text-white">Acesso de leitura</p><p className="mt-3 max-w-xl text-base leading-7 text-acrux-muted">Sua conta pode consultar a equipe, mas alterações de integrantes exigem uma conta administradora.</p></div>}
      </div>
      <ConfirmationDialog busy={isSavingAreas || isSaving} onCancel={() => setConfirmation(null)} onConfirm={() => void confirmAreaAction()} request={confirmation} />
    </AdminWorkspace>
  );
}
