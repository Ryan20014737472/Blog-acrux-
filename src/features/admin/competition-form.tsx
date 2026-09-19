"use client";

import type { FormEvent } from "react";
import { editableAwards, type CompetitionDraft, type SeasonOption } from "@/features/admin/competition-form-model";

interface CompetitionFormProps {
  draft: CompetitionDraft;
  seasons: SeasonOption[];
  disabled: boolean;
  readOnly: boolean;
  error: string | null;
  feedback: string | null;
  timeZone: string;
  onChange: (draft: CompetitionDraft) => void;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export function CompetitionForm({ draft, seasons, disabled, readOnly, error, feedback, timeZone, onChange, onNameChange, onSubmit, onDelete }: CompetitionFormProps) {
  const update = <K extends keyof CompetitionDraft>(key: K, value: CompetitionDraft[K]) => onChange({ ...draft, [key]: value });
  return (
    <form aria-busy={disabled} className="glass-panel min-w-0 rounded-3xl p-5 sm:p-7" onSubmit={onSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-white">{readOnly ? "Consultar competição" : draft.id ? "Editar competição" : "Nova competição"}</h2>
        {draft.id && !readOnly ? <button className="min-h-11 rounded-full border border-red-200/30 px-4 text-sm font-bold text-red-100 disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button">Excluir competição</button> : null}
      </div>
      {readOnly ? <p className="mt-3 text-sm text-acrux-muted">Sua conta tem acesso de leitura. Alterações exigem uma conta administradora.</p> : null}
      <fieldset className="mt-6 grid min-w-0 gap-5 disabled:opacity-70" disabled={disabled || readOnly}>
        <legend className="sr-only">Dados da competição</legend>
        <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-name">Nome do evento *<input className="admin-input" id="competition-name" onChange={(event) => onNameChange(event.target.value)} required value={draft.eventName} /></label>
        <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-slug">Identificador *<input aria-describedby="competition-slug-help" autoCapitalize="none" className="admin-input" id="competition-slug" onChange={(event) => update("slug", event.target.value)} required spellCheck={false} value={draft.slug} /><span className="font-normal text-acrux-muted" id="competition-slug-help">Identificador único, como regional-ftc-2026.</span></label>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-organization">Categoria / organização<input className="admin-input" id="competition-organization" list="competition-organizations" onChange={(event) => update("organization", event.target.value)} placeholder="FTC, TBR, OBR ou outra" value={draft.organization} /><datalist id="competition-organizations"><option value="FTC" /><option value="TBR" /><option value="OBR" /></datalist></label>
          <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-season">Temporada<select className="admin-input" id="competition-season" onChange={(event) => update("seasonId", event.target.value)} value={draft.seasonId}><option value="">Sem temporada vinculada</option>{draft.seasonId && !seasons.some((season) => season.id === draft.seasonId) ? <option value={draft.seasonId}>Temporada vinculada (não carregada)</option> : null}{seasons.map((season) => <option key={season.id} value={season.id}>{season.label} ({season.year})</option>)}</select></label>
        </div>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-start">Início<input aria-describedby="competition-timezone" className="admin-input min-w-0" id="competition-start" onChange={(event) => update("startsAt", event.target.value)} type="datetime-local" value={draft.startsAt} /></label>
          <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-end">Término<input aria-describedby="competition-timezone" className="admin-input min-w-0" id="competition-end" min={draft.startsAt || undefined} onChange={(event) => update("endsAt", event.target.value)} type="datetime-local" value={draft.endsAt} /></label>
        </div>
        <p className="-mt-2 text-xs leading-5 text-acrux-muted" id="competition-timezone">Horários no fuso do seu dispositivo{timeZone ? `: ${timeZone}` : ""}. As datas são opcionais.</p>
        <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-location">Local<input className="admin-input" id="competition-location" onChange={(event) => update("location", event.target.value)} value={draft.location} /></label>
        <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-result">Resultado<input className="admin-input" id="competition-result" onChange={(event) => update("result", event.target.value)} placeholder="Preencha somente quando confirmado" value={draft.result} /></label>
        <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-awards">Premiações<textarea aria-describedby="competition-awards-help" className="admin-input min-h-28 resize-y" disabled={!editableAwards(draft.originalAwards)} id="competition-awards" onChange={(event) => update("awardsText", event.target.value)} value={draft.awardsText} /><span className="font-normal text-acrux-muted" id="competition-awards-help">{editableAwards(draft.originalAwards) ? "Uma premiação por linha. Deixe vazio se não houver." : "As premiações atuais serão preservadas ao salvar este evento."}</span></label>
        <label className="grid min-w-0 gap-2 text-sm font-bold" htmlFor="competition-report">Relato da participação<textarea className="admin-input min-h-44 resize-y" id="competition-report" onChange={(event) => update("report", event.target.value)} value={draft.report} /></label>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-acrux-navy/45 px-4 py-3 text-sm font-bold"><input checked={draft.isPublished} onChange={(event) => update("isPublished", event.target.checked)} type="checkbox" />Publicar no site</label>
        <p className="-mt-2 text-xs leading-5 text-acrux-muted">Desmarcado: rascunho visível apenas à equipe autorizada. Marcar e salvar torna os dados do evento públicos.</p>
      </fieldset>
      {error ? <p className="mt-5 rounded-xl border border-red-300/25 bg-red-950/25 p-4 text-sm text-red-100" role="alert">{error}</p> : null}
      {feedback ? <p className="mt-5 rounded-xl border border-cyan-200/20 bg-cyan-300/8 p-4 text-sm text-acrux-cyan-bright" role="status">{feedback}</p> : null}
      {!readOnly ? <button className="button-primary mt-6 disabled:opacity-50" disabled={disabled} type="submit">{disabled ? "Aguarde…" : draft.id ? "Salvar alterações" : "Cadastrar competição"}</button> : null}
    </form>
  );
}

