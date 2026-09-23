"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl, uploadPublicImage } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];
type Draft = { id: string | null; name: string; websiteUrl: string; logoPath: string | null; tier: string; displayOrder: string; isPublished: boolean };
const blank: Draft = { id: null, name: "", websiteUrl: "", logoPath: null, tier: "", displayOrder: "0", isPublished: false };

function fromRow(row: Sponsor): Draft {
  return { id: row.id, name: row.name, websiteUrl: row.website_url ?? "", logoPath: row.logo_path, tier: row.tier ?? "", displayOrder: String(row.display_order), isPublished: row.is_published };
}

export function SponsorsManager({ session }: { session: AdminSession }) {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canManage = session.role === "admin";
  const client = createSupabaseBrowserClient();
  const logoUrl = client ? getPublicImageUrl(client, "sponsors", draft.logoPath) : null;

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase não configurado."); setLoading(false); return; }
    const { data, error: loadError } = await supabase.from("sponsors").select("*").order("display_order").order("name");
    if (loadError) setError("Não foi possível carregar os patrocinadores.");
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !canManage) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const path = await uploadPublicImage(supabase, "sponsors", "logos", file);
      setDraft((current) => ({ ...current, logoPath: path }));
      setMessage("Logo enviado. Salve o cadastro para vinculá-lo ao patrocinador.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar o logo."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    const name = draft.name.trim();
    const website = draft.websiteUrl.trim();
    if (!name) { setError("Informe o nome do patrocinador."); return; }
    if (website) {
      try { if (new URL(website).protocol !== "https:") throw new Error(); }
      catch { setError("Informe um endereço HTTPS válido para o site."); return; }
    }
    const displayOrder = Number(draft.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 0) { setError("A ordem deve ser um número inteiro igual ou maior que zero."); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const payload = { name, website_url: website || null, logo_path: draft.logoPath, tier: draft.tier.trim() || null, display_order: displayOrder, is_published: draft.isPublished };
    const result = draft.id
      ? await supabase.from("sponsors").update(payload).eq("id", draft.id).select().single()
      : await supabase.from("sponsors").insert(payload).select().single();
    setBusy(false);
    if (result.error || !result.data) { setError("Não foi possível salvar. Verifique sua permissão de administrador."); return; }
    setDraft(fromRow(result.data));
    setMessage(draft.id ? "Patrocinador atualizado." : "Patrocinador cadastrado.");
    await load();
  }

  async function remove() {
    if (!draft.id || !canManage || !window.confirm(`Excluir ${draft.name}? Essa ação não pode ser desfeita.`)) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const { error: deleteError } = await supabase.from("sponsors").delete().eq("id", draft.id);
    setBusy(false);
    if (deleteError) { setError("Não foi possível excluir o patrocinador."); return; }
    setDraft(blank);
    setMessage("Patrocinador excluído. O arquivo enviado permanece no acervo de mídia.");
    await load();
  }

  return <AdminWorkspace description="Cadastre parceiros confirmados, envie a marca oficial e escolha quais aparecem no site. Apenas administradores podem alterar cadastros." section="patrocinadores" session={session} title="Gerenciar patrocinadores">
    <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="glass-panel h-fit rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-white">Parceiros ({items.length})</h2>{canManage && <button className="button-secondary px-4" onClick={() => { setDraft(blank); setError(""); setMessage(""); }} type="button">Novo</button>}</div>
        {loading ? <p className="mt-5 text-sm text-acrux-muted">Carregando…</p> : items.length ? <ul className="mt-5 space-y-2">{items.map((item) => <li key={item.id}><button className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${draft.id === item.id ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 hover:border-cyan-300/25"}`} onClick={() => { setDraft(fromRow(item)); setError(""); setMessage(""); }} type="button"><span className="block font-bold text-white">{item.name}</span><span className="text-xs text-acrux-muted">{item.is_published ? "Publicado" : "Rascunho"}{item.tier ? ` · ${item.tier}` : ""}</span></button></li>)}</ul> : <p className="mt-5 text-sm text-acrux-muted">Nenhum patrocinador cadastrado.</p>}
      </aside>
      <form className="glass-panel space-y-5 rounded-3xl p-5 sm:p-7" onSubmit={save}>
        <h2 className="text-xl font-bold text-white">{draft.id ? "Editar parceiro" : "Novo parceiro"}</h2>
        <label className="block text-sm text-white">Nome *<input className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} maxLength={160} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required value={draft.name} /></label>
        <label className="block text-sm text-white">Site oficial (HTTPS)<input className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })} placeholder="https://" type="url" value={draft.websiteUrl} /></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm text-white">Categoria / cota<input className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} maxLength={80} onChange={(e) => setDraft({ ...draft, tier: e.target.value })} value={draft.tier} /></label><label className="block text-sm text-white">Ordem de exibição<input className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white" disabled={!canManage || busy} min="0" onChange={(e) => setDraft({ ...draft, displayOrder: e.target.value })} required type="number" value={draft.displayOrder} /></label></div>
        <div><label className="block text-sm text-white" htmlFor="sponsor-logo">Logo oficial</label><input accept="image/avif,image/gif,image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm text-acrux-muted" disabled={!canManage || busy} id="sponsor-logo" onChange={uploadLogo} type="file" />{logoUrl && <Image alt={`Logo de ${draft.name || "patrocinador"}`} className="mt-4 max-h-32 max-w-52 object-contain" height={128} src={logoUrl} unoptimized width={208} />}{draft.logoPath && canManage && <button className="mt-3 block text-sm text-acrux-cyan-bright" onClick={() => setDraft({ ...draft, logoPath: null })} type="button">Remover logo do cadastro</button>}</div>
        <label className="flex items-center gap-3 text-sm text-white"><input checked={draft.isPublished} disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} type="checkbox" />Exibir no site público</label>
        {error && <p aria-live="assertive" className="text-sm text-red-200">{error}</p>}{message && <p aria-live="polite" className="text-sm text-acrux-cyan-bright">{message}</p>}
        {canManage ? <div className="flex flex-wrap gap-3"><button className="button-primary" disabled={busy} type="submit">{busy ? "Aguarde…" : "Salvar patrocinador"}</button>{draft.id && <button className="button-secondary" disabled={busy} onClick={remove} type="button">Excluir</button>}</div> : <p className="text-sm text-acrux-muted">Seu perfil pode consultar esta seção; alterações exigem administrador.</p>}
      </form>
    </div>
  </AdminWorkspace>;
}

