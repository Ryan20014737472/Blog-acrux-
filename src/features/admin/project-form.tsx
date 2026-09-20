"use client";

import type { FormEvent, ReactNode } from "react";
import { projectCategories, type ProjectDraft, type ProjectRow } from "@/features/admin/project-form-model";
import type { SeasonOption } from "@/features/admin/competition-form-model";

interface Props {
  draft: ProjectDraft; original: ProjectRow | null; seasons: SeasonOption[];
  disabled: boolean; readOnly: boolean; error: string; message: string; children: ReactNode;
  onChange: (draft: ProjectDraft) => void; onTitleChange: (name: string) => void;
  onFile: (file: File | null) => void; onRemovePhoto: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onDelete: () => void;
}
export function ProjectForm({ draft, original, seasons, disabled, readOnly, error, message, children, onChange, onTitleChange, onFile, onRemovePhoto, onSubmit, onDelete }: Props) {
  const update = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => onChange({ ...draft, [key]: value });
  return <form className="glass-panel min-w-0 rounded-3xl p-5 sm:p-7" onSubmit={onSubmit} aria-busy={disabled}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{readOnly ? "Consultar projeto" : original ? "Editar projeto" : "Novo projeto"}</h2>{original && !readOnly ? <button className="min-h-11 rounded-full border border-red-200/30 px-4 text-sm text-red-100" disabled={disabled} type="button" onClick={onDelete}>Excluir projeto</button> : null}</div>
    {readOnly ? <p className="mt-3 text-sm text-acrux-muted">Somente administradores podem alterar projetos.</p> : null}
    <fieldset className="mt-6 grid min-w-0 gap-5 disabled:opacity-70" disabled={disabled || readOnly}>
      <legend className="sr-only">Dados do projeto</legend>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Título do projeto *<input className="admin-input" required value={draft.title} onChange={(event) => onTitleChange(event.target.value)} /></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Identificador *<input className="admin-input" autoCapitalize="none" spellCheck={false} required value={draft.slug} onChange={(event) => update("slug", event.target.value)} /><span className="font-normal text-acrux-muted">Identificador único com letras minúsculas, números e hífens.</span></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Categoria *<input className="admin-input" required list="project-categories" value={draft.category} onChange={(event) => update("category", event.target.value)} /><datalist id="project-categories">{projectCategories.map((category) => <option key={category} value={category} />)}</datalist><span className="font-normal text-acrux-muted">Escolha uma sugestão ou informe outra categoria.</span></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Temporada<select className="admin-input" value={draft.seasonId} onChange={(event) => update("seasonId", event.target.value)}><option value="">Sem temporada vinculada</option>{draft.seasonId && !seasons.some((season) => season.id === draft.seasonId) ? <option value={draft.seasonId}>Temporada atual (indisponível na lista)</option> : null}{seasons.map((season) => <option value={season.id} key={season.id}>{season.label} ({season.year})</option>)}</select></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Descrição<textarea className="admin-input min-h-32" value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
      <div className="min-w-0"><label className="grid min-w-0 gap-2 text-sm font-bold">Foto do projeto<input className="admin-input min-w-0 w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(event) => { onFile(event.target.files?.[0] ?? null); event.target.value = ""; }} /></label><p className="mt-2 text-xs text-acrux-muted">JPG, PNG, WebP, GIF ou AVIF, até 10 MB. A imagem é enviada ao salvar e terá um endereço público.</p>{children}<button type="button" className="mt-3 min-h-11 text-sm text-acrux-cyan-bright" onClick={onRemovePhoto}>Remover foto deste projeto</button></div>
      <label className="grid gap-2 text-sm font-bold">Conteúdo completo<textarea className="admin-input min-h-64" value={draft.body} onChange={(event) => update("body", event.target.value)} /><span className="font-normal text-acrux-muted">Escreva o desenvolvimento, objetivos e resultados do projeto. As quebras de linha serão mantidas.</span></label>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 p-4 text-sm font-bold"><input type="checkbox" checked={draft.published} onChange={(event) => update("published", event.target.checked)} />Publicar no site</label>
      <p className="text-xs text-acrux-muted">Desmarcado: o registro fica como rascunho. Marque e salve para aparecer na página Projetos.</p>
    </fieldset>
    {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200/20 p-4 text-sm text-red-100">{error}</p> : null}
    {message ? <p role="status" className="mt-5 text-sm text-acrux-cyan-bright">{message}</p> : null}
    {!readOnly ? <button type="submit" className="button-primary mt-6 disabled:opacity-50" disabled={disabled}>{disabled ? "Aguarde…" : original ? "Salvar alterações" : "Cadastrar projeto"}</button> : null}
  </form>;
}

