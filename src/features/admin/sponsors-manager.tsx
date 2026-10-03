"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { useAdminConfirm } from "@/components/admin/admin-confirmation-provider";
import { useAdminDraftProtection } from "@/components/admin/admin-draft-protection";
import { compareSponsors, normalizedSponsorTier, sponsorTiers } from "@/config/sponsor-tiers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl, uploadPublicImage } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";
import { focusAdminEditor } from "@/utils/focus-admin-editor";

type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];
type Draft = { id: string | null; name: string; websiteUrl: string; logoPath: string | null; tier: string; displayOrder: string; isPublished: boolean };
const blank: Draft = { id: null, name: "", websiteUrl: "", logoPath: null, tier: "", displayOrder: "0", isPublished: false };

function fromRow(row: Sponsor): Draft {
  return { id: row.id, name: row.name, websiteUrl: row.website_url ?? "", logoPath: row.logo_path, tier: row.tier ?? "", displayOrder: String(row.display_order), isPublished: row.is_published };
}

export function SponsorsManager({ session }: { session: AdminSession }) {
  const listRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLFormElement>(null);
  const confirm = useAdminConfirm();
  const [items, setItems] = useState<Sponsor[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canManage = session.role === "admin";
  const originalSponsor = items.find((item) => item.id === draft.id);
  const dirty = canManage && JSON.stringify(draft) !== JSON.stringify(originalSponsor ? fromRow(originalSponsor) : blank);
  useAdminDraftProtection({ dirty, busy, discardDescription: "As alterações deste patrocinador serão descartadas." });
  const client = createSupabaseBrowserClient();
  const logoUrl = client ? getPublicImageUrl(client, "sponsors", draft.logoPath) : null;

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase não configurado."); setLoading(false); return; }
    const { data, error: loadError } = await supabase.from("sponsors").select("*").order("display_order").order("name");
    if (loadError) setError("Não foi possível carregar os patrocinadores.");
    else setItems([...(data ?? [])].sort(compareSponsors));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function selectSponsor(next: Draft) {
    if (busy) return;
    if (dirty && !await confirm({ title: "Descartar alterações?", description: "As alterações não salvas deste patrocinador serão perdidas.", confirmLabel: "Descartar alterações", tone: "danger" })) return;
    setDraft(next); setError(""); setMessage("");
    focusAdminEditor(editorRef.current, 1024);
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !canManage || busy) return;
    const sponsorId = draft.id;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const path = await uploadPublicImage(supabase, "sponsors", "logos", file);
      setDraft((current) => current.id === sponsorId ? { ...current, logoPath: path } : current);
      setMessage("Logo enviado. Salve o cadastro para vinculá-lo ao patrocinador.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar o logo."); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || busy) return;
    const name = draft.name.trim();
    const website = draft.websiteUrl.trim();
    if (!name) { setError("Informe o nome do patrocinador."); return; }
    const tier = normalizedSponsorTier(draft.tier);
    if (!tier) { setError("Selecione o nível Ouro, Prata ou Bronze."); return; }
    if (website) {
      try { if (new URL(website).protocol !== "https:") throw new Error(); }
      catch { setError("Informe um endereço HTTPS válido para o site."); return; }
    }
    const displayOrder = Number(draft.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 0) { setError("A ordem deve ser um número inteiro igual ou maior que zero."); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const payload = { name, website_url: website || null, logo_path: draft.logoPath, tier, display_order: displayOrder, is_published: draft.isPublished };
    try {
      const result = draft.id
        ? await supabase.from("sponsors").update(payload).eq("id", draft.id).select().single()
        : await supabase.from("sponsors").insert(payload).select().single();
      if (result.error || !result.data) throw result.error ?? new Error("Patrocinador não encontrado.");
      setDraft(fromRow(result.data));
      setMessage(draft.id ? "Patrocinador atualizado." : "Patrocinador cadastrado.");
      await load();
    } catch {
      setError("Não foi possível salvar. Verifique sua permissão de administrador.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!draft.id || !canManage || busy || !await confirm({ title: `Excluir ${draft.name}?`, description: "Este patrocinador será removido do site. Esta ação não pode ser desfeita.", confirmLabel: "Excluir patrocinador", tone: "danger" })) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { error: deleteError } = await supabase.from("sponsors").delete().eq("id", draft.id);
      if (deleteError) throw deleteError;
      setDraft(blank);
      setMessage("Patrocinador excluído. O arquivo enviado permanece no acervo de mídia.");
      await load();
    } catch {
      setError("Não foi possível excluir o patrocinador.");
    } finally {
      setBusy(false);
    }
  }

  return <AdminWorkspace description="Cadastre parceiros confirmados, envie a marca oficial e escolha quais aparecem no site. Apenas administradores podem alterar cadastros." section="patrocinadores" session={session} title="Gerenciar patrocinadores">
    <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside aria-label="Lista de patrocinadores" className="glass-panel min-w-0 h-fit scroll-mt-24 rounded-3xl p-4 sm:p-6" ref={listRef} tabIndex={-1}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-white">Parceiros ({items.length})</h2>{canManage && <button className="button-secondary px-4" disabled={busy} onClick={() => void selectSponsor(blank)} type="button">Novo</button>}</div>
        {loading ? <p className="mt-5 text-sm text-acrux-muted">Carregando…</p> : items.length ? <ul aria-label="Patrocinadores cadastrados" className="mt-5 max-h-[36svh] space-y-2 overflow-y-auto overscroll-contain pr-1 lg:max-h-none lg:overflow-visible lg:pr-0" tabIndex={0}>{items.map((item) => <li key={item.id}><button aria-current={draft.id === item.id ? "true" : undefined} className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${draft.id === item.id ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 hover:border-cyan-300/25"}`} disabled={busy} onClick={() => void selectSponsor(fromRow(item))} type="button"><span className="block break-words font-bold text-white">{item.name}</span><span className="text-xs text-acrux-muted">{item.is_published ? "Publicado" : "Rascunho"}{item.tier ? ` · ${item.tier}` : ""}</span></button></li>)}</ul> : <p className="mt-5 text-sm text-acrux-muted">Nenhum patrocinador cadastrado.</p>}
      </aside>
      <form aria-labelledby="sponsors-editor-title" className="glass-panel min-w-0 scroll-mt-24 space-y-5 rounded-3xl p-4 sm:p-7" onSubmit={save} ref={editorRef} tabIndex={-1}>
        <button className="mb-4 flex min-h-11 items-center rounded-xl border border-white/12 px-4 text-sm font-bold text-acrux-cyan-bright lg:hidden" onClick={() => focusAdminEditor(listRef.current, 1024)} type="button">Voltar à lista</button>
        <h2 className="text-xl font-bold text-white" id="sponsors-editor-title">{draft.id ? "Editar parceiro" : "Novo parceiro"}</h2>
        <label className="block text-sm text-white">Nome *<input className="admin-input mt-2" disabled={!canManage || busy} maxLength={160} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required value={draft.name} /></label>
        <label className="block text-sm text-white">Site oficial (HTTPS)<input className="admin-input mt-2" disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })} placeholder="https://" type="url" value={draft.websiteUrl} /></label>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2"><label className="block text-sm text-white">Nível de patrocínio *<select className="admin-input mt-2" disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, tier: e.target.value })} required value={draft.tier}><option value="">Selecione um nível</option>{draft.tier && !normalizedSponsorTier(draft.tier) && <option value={draft.tier}>Categoria antiga: {draft.tier}</option>}{sponsorTiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select></label><label className="block text-sm text-white">Ordem dentro do nível<input className="admin-input mt-2" disabled={!canManage || busy} inputMode="numeric" min="0" onChange={(e) => setDraft({ ...draft, displayOrder: e.target.value })} required type="number" value={draft.displayOrder} /></label></div>
        <p className="text-xs leading-5 text-acrux-muted">No site, a ordem é Ouro → Prata → Bronze. Dentro de cada nível, vale a ordem numérica acima.</p>
        <div><label className="block text-sm text-white" htmlFor="sponsor-logo">Logo oficial</label><input accept="image/avif,image/gif,image/jpeg,image/png,image/webp" className="admin-file-input mt-2" disabled={!canManage || busy} id="sponsor-logo" onChange={uploadLogo} type="file" />{logoUrl && <Image alt={`Logo de ${draft.name || "patrocinador"}`} className="mt-4 h-auto max-h-32 w-auto max-w-full object-contain" height={128} src={logoUrl} unoptimized width={208} />}{draft.logoPath && canManage && <button className="mt-3 flex min-h-11 items-center rounded-xl px-3 text-left text-sm text-acrux-cyan-bright hover:bg-cyan-300/10" disabled={busy} onClick={() => setDraft({ ...draft, logoPath: null })} type="button">Remover logo do cadastro</button>}</div>
        <label className="flex min-h-11 items-center gap-3 text-sm text-white"><input checked={draft.isPublished} disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} type="checkbox" />Exibir no site público</label>
        {error && <p aria-live="assertive" className="text-sm text-red-200">{error}</p>}{message && <p aria-live="polite" className="text-sm text-acrux-cyan-bright">{message}</p>}
        {canManage ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><button className="button-primary w-full sm:w-auto" disabled={busy} type="submit">{busy ? "Aguarde…" : "Salvar patrocinador"}</button>{draft.id && <button className="button-secondary" disabled={busy} onClick={remove} type="button">Excluir</button>}</div> : <p className="text-sm text-acrux-muted">Seu perfil pode consultar esta seção; alterações exigem administrador.</p>}
      </form>
    </div>
  </AdminWorkspace>;
}
