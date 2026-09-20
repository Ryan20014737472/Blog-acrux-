"use client";

import type { FormEvent, ReactNode } from "react";
import { editableSpecifications, isTextList, type RobotDraft, type RobotRow } from "@/features/admin/robot-form-model";
import type { SeasonOption } from "@/features/admin/competition-form-model";

interface Props {
  draft: RobotDraft; original: RobotRow | null; seasons: SeasonOption[];
  disabled: boolean; readOnly: boolean; error: string; message: string; children: ReactNode;
  onChange: (draft: RobotDraft) => void; onNameChange: (name: string) => void;
  onFile: (file: File | null) => void; onRemovePhoto: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onDelete: () => void;
}
export function RobotForm({ draft, original, seasons, disabled, readOnly, error, message, children, onChange, onNameChange, onFile, onRemovePhoto, onSubmit, onDelete }: Props) {
  const update = <K extends keyof RobotDraft>(key: K, value: RobotDraft[K]) => onChange({ ...draft, [key]: value });
  const specificationsEditable = !original || editableSpecifications(original.specifications);
  return <form className="glass-panel min-w-0 rounded-3xl p-5 sm:p-7" onSubmit={onSubmit} aria-busy={disabled}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{readOnly ? "Consultar robô" : original ? "Editar robô" : "Novo robô"}</h2>{original && !readOnly ? <button className="min-h-11 rounded-full border border-red-200/30 px-4 text-sm text-red-100" disabled={disabled} type="button" onClick={onDelete}>Excluir robô</button> : null}</div>
    {readOnly ? <p className="mt-3 text-sm text-acrux-muted">Somente administradores podem alterar robôs.</p> : null}
    <fieldset className="mt-6 grid min-w-0 gap-5 disabled:opacity-70" disabled={disabled || readOnly}>
      <legend className="sr-only">Dados do robô</legend>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Nome do robô *<input className="admin-input" required value={draft.name} onChange={(event) => onNameChange(event.target.value)} /></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Identificador *<input className="admin-input" autoCapitalize="none" spellCheck={false} required value={draft.slug} onChange={(event) => update("slug", event.target.value)} /><span className="font-normal text-acrux-muted">Identificador único com letras minúsculas, números e hífens.</span></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Temporada<select className="admin-input" value={draft.seasonId} onChange={(event) => update("seasonId", event.target.value)}><option value="">Sem temporada vinculada</option>{draft.seasonId && !seasons.some((season) => season.id === draft.seasonId) ? <option value={draft.seasonId}>Temporada atual (indisponível na lista)</option> : null}{seasons.map((season) => <option value={season.id} key={season.id}>{season.label} ({season.year})</option>)}</select></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold">Descrição<textarea className="admin-input min-h-32" value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
      <div className="min-w-0"><label className="grid min-w-0 gap-2 text-sm font-bold">Foto do robô<input className="admin-input min-w-0 w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(event) => { onFile(event.target.files?.[0] ?? null); event.target.value = ""; }} /></label><p className="mt-2 text-xs text-acrux-muted">JPG, PNG, WebP, GIF ou AVIF, até 10 MB. A imagem é enviada ao salvar e terá um endereço público.</p>{children}<button type="button" className="mt-3 min-h-11 text-sm text-acrux-cyan-bright" onClick={onRemovePhoto}>Remover foto deste robô</button></div>
      {(["mechanisms", "components"] as const).map((key) => {
        const editable = !original || isTextList(original[key]);
        return <label key={key} className="grid gap-2 text-sm font-bold">{key === "mechanisms" ? "Mecanismos" : "Componentes"}<textarea className="admin-input min-h-28" disabled={!editable} value={draft[key]} onChange={(event) => update(key, event.target.value)} /><span className="font-normal text-acrux-muted">{editable ? "Um item por linha." : "O conteúdo existente usa outro formato e será preservado ao salvar."}</span></label>;
      })}
      <div><h3 className="font-bold">Características técnicas</h3>{specificationsEditable ? <div className="mt-3 grid gap-3">{draft.specifications.map((entry, index) => <div key={index} className="grid min-w-0 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className="admin-input min-w-0" aria-label={`Nome da característica ${index + 1}`} placeholder="Ex.: Peso" value={entry.key} onChange={(event) => update("specifications", draft.specifications.map((item, i) => i === index ? { ...item, key: event.target.value } : item))} />
        <input className="admin-input min-w-0" aria-label={`Valor da característica ${index + 1}`} placeholder="Ex.: 10 kg" value={entry.value} onChange={(event) => update("specifications", draft.specifications.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} />
        <button className="min-h-11 px-3 text-sm text-acrux-muted" type="button" aria-label={`Remover característica ${index + 1}`} onClick={() => update("specifications", draft.specifications.filter((_, i) => i !== index))}>Remover</button>
      </div>)}<button className="button-secondary w-fit" type="button" onClick={() => update("specifications", [...draft.specifications, { key: "", value: "" }])}>Adicionar característica</button></div> : <p className="mt-2 text-sm text-acrux-muted">As características existentes usam outro formato e serão preservadas ao salvar.</p>}</div>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 p-4 text-sm font-bold"><input type="checkbox" checked={draft.published} onChange={(event) => update("published", event.target.checked)} />Publicar no site</label>
      <p className="text-xs text-acrux-muted">Desmarcado: o registro fica como rascunho. Marque e salve para aparecer na página Robôs.</p>
    </fieldset>
    {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200/20 p-4 text-sm text-red-100">{error}</p> : null}
    {message ? <p role="status" className="mt-5 text-sm text-acrux-cyan-bright">{message}</p> : null}
    {!readOnly ? <button type="submit" className="button-primary mt-6 disabled:opacity-50" disabled={disabled}>{disabled ? "Aguarde…" : original ? "Salvar alterações" : "Cadastrar robô"}</button> : null}
  </form>;
}

