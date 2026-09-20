"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Member = Pick<Database["public"]["Tables"]["team_members"]["Row"], "id" | "name" | "area">;
type Album = Pick<Database["public"]["Tables"]["galleries"]["Row"], "id" | "title" | "project_id" | "is_published">;

interface ProjectRelationsProps {
  projectId: string;
  canManage: boolean;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}

export function ProjectRelations({ projectId, canManage, disabled, onBusyChange }: ProjectRelationsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const mutationLock = useRef(false);

  useEffect(() => {
    const version = ++generation.current;
    setIsLoading(true);
    setIsBusy(false);
    setLoadError(null);
    setError(null);
    setFeedback(null);
    setAlbumId("");

    async function loadRelations() {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) throw new Error("Connection unavailable");

        const [memberResult, participantResult, albumResult] = await Promise.all([
          supabase.from("team_members").select("id, name, area").order("name"),
          supabase.from("project_team_members").select("team_member_id").eq("project_id", projectId),
          supabase.from("galleries").select("id, title, project_id, is_published").order("title"),
        ]);
        if (memberResult.error || participantResult.error || albumResult.error) throw new Error("Load failed");
        if (version !== generation.current) return;

        setMembers(memberResult.data ?? []);
        setParticipantIds((participantResult.data ?? []).map((item) => item.team_member_id));
        setAlbums(albumResult.data ?? []);
      } catch {
        if (version === generation.current) setLoadError("Não foi possível carregar participantes e álbuns. Tente novamente.");
      } finally {
        if (version === generation.current) setIsLoading(false);
      }
    }

    void loadRelations();
    return () => {
      generation.current += 1;
      mutationLock.current = false;
      onBusyChange(false);
    };
  }, [projectId, onBusyChange, retry]);

  async function changeRelation(kind: "member" | "album", id: string, attach: boolean) {
    if (!canManage || disabled || isLoading || loadError || mutationLock.current) return;
    mutationLock.current = true;
    const version = generation.current;
    setIsBusy(true);
    onBusyChange(true);
    setError(null);
    setFeedback(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Connection unavailable");

      if (kind === "member") {
        const result = attach
          ? await supabase.from("project_team_members").insert({ project_id: projectId, team_member_id: id }).select("team_member_id").single()
          : await supabase.from("project_team_members").delete().eq("project_id", projectId).eq("team_member_id", id).select("team_member_id").single();
        if (result.error || !result.data) throw new Error("Participant update failed");
        if (version !== generation.current) return;
        setParticipantIds((current) => attach ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id));
        setFeedback(attach ? "Participante vinculado ao projeto." : "Participante removido do projeto. O perfil da equipe foi preservado.");
      } else {
        const query = supabase.from("galleries").update({ project_id: attach ? projectId : null }).eq("id", id);
        const { data, error: updateError } = await (attach ? query.is("project_id", null) : query.eq("project_id", projectId))
          .select("id, title, project_id, is_published").single();
        if (updateError || !data) throw new Error("Album update failed");
        if (version !== generation.current) return;
        setAlbums((current) => current.map((album) => album.id === data.id ? data : album));
        setAlbumId("");
        setFeedback(attach ? "Álbum vinculado ao projeto." : "Vínculo removido. O álbum e suas fotos foram preservados.");
      }
    } catch {
      if (version === generation.current) setError("Não foi possível atualizar o vínculo. Ele pode ter sido alterado por outra pessoa. Atualize a lista e tente novamente.");
    } finally {
      if (version === generation.current) {
        mutationLock.current = false;
        setIsBusy(false);
        onBusyChange(false);
      }
    }
  }

  const locked = disabled || isBusy || isLoading;
  const assignedAlbums = albums.filter((album) => album.project_id === projectId);
  const availableAlbums = albums.filter((album) => album.project_id === null);
  const visibleMembers = canManage ? members : members.filter((member) => participantIds.includes(member.id));

  return (
    <section aria-busy={isLoading || isBusy} aria-labelledby="project-relations-title" className="glass-panel rounded-3xl p-5 sm:p-7">
      <h2 className="text-lg font-bold text-white" id="project-relations-title">Integrantes e álbuns</h2>
      <p className="mt-2 text-sm leading-6 text-acrux-muted">Os vínculos abaixo são salvos imediatamente, separadamente dos dados do projeto.</p>
      {!canManage ? <p className="mt-2 text-sm text-acrux-muted">Sua conta pode consultar os vínculos. Alterações exigem uma conta administradora.</p> : null}
      {isLoading ? <p className="mt-6 text-sm text-acrux-muted" role="status">Carregando participantes e álbuns…</p> : null}
      {loadError ? <div className="mt-6 rounded-2xl border border-red-300/22 bg-red-950/24 p-4">
        <p className="text-sm text-red-100" role="alert">{loadError}</p>
        <button className="button-secondary mt-3 min-h-10 px-4" disabled={locked} onClick={() => setRetry((current) => current + 1)} type="button">Tentar novamente</button>
      </div> : null}
      {!isLoading && !loadError ? <div className="mt-7 grid gap-8">
        <fieldset disabled={locked || !canManage}>
          <legend className="font-bold text-white">Integrantes responsáveis</legend>
          <p className="mt-2 text-sm text-acrux-muted">{participantIds.length} participante(s) vinculado(s)</p>
          {visibleMembers.length ? <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto">
            {visibleMembers.map((member) => <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#020817]/30 p-3 text-sm" key={member.id}>
              <input checked={participantIds.includes(member.id)} className="mt-1 size-4 shrink-0 accent-cyan-300" onChange={(event) => void changeRelation("member", member.id, event.target.checked)} type="checkbox" />
              <span className="min-w-0 break-words font-bold text-white">{member.name}{member.area ? <span className="mt-1 block font-normal text-acrux-muted">{member.area}</span> : null}</span>
            </label>)}
          </div> : <p className="mt-4 text-sm text-acrux-muted">{canManage ? "Cadastre integrantes na área Equipe para vinculá-los ao projeto." : "Nenhum participante vinculado."}</p>}
        </fieldset>

        <div>
          <h3 className="font-bold text-white">Álbuns do projeto</h3>
          <p className="mt-2 text-sm leading-6 text-acrux-muted">Crie os álbuns e envie as fotos na <Link aria-disabled={locked} className="font-bold text-acrux-cyan-bright underline underline-offset-4" href="/admin/galeria" onClick={(event) => { if (locked) event.preventDefault(); }} tabIndex={locked ? -1 : undefined}>área Galeria</Link>. Cada álbum mantém sua própria configuração de publicação.</p>
          {assignedAlbums.length ? <ul className="mt-4 grid gap-2">
            {assignedAlbums.map((album) => <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#020817]/30 p-3" key={album.id}>
              <div className="min-w-0 flex-1"><p className="break-words text-sm font-bold text-white">{album.title}</p><p className="mt-1 text-xs text-acrux-muted">{album.is_published ? "Álbum publicado" : "Álbum em rascunho"}</p></div>
              {canManage ? <button aria-label={`Desvincular álbum ${album.title}`} className="min-h-10 rounded-full border border-white/12 px-3 text-sm font-bold text-acrux-muted hover:text-white" disabled={locked} onClick={() => void changeRelation("album", album.id, false)} type="button">Desvincular</button> : null}
            </li>)}
          </ul> : <p className="mt-4 text-sm text-acrux-muted">Nenhum álbum vinculado.</p>}
          {canManage ? <fieldset className="mt-5 grid gap-3" disabled={locked}>
            <label className="grid gap-2 text-sm font-bold text-white" htmlFor="project-album">Vincular um álbum existente
              <select className="admin-input min-w-0 w-full" id="project-album" onChange={(event) => setAlbumId(event.target.value)} value={albumId}>
                <option value="">Selecionar álbum</option>
                {availableAlbums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
              </select>
            </label>
            <p className="text-xs leading-5 text-acrux-muted">Somente álbuns ainda não vinculados a outro projeto aparecem aqui.</p>
            <button className="button-secondary w-fit" disabled={!albumId || locked} onClick={() => void changeRelation("album", albumId, true)} type="button">Vincular álbum</button>
          </fieldset> : null}
        </div>
      </div> : null}
      {error ? <div className="mt-6 rounded-2xl border border-red-300/22 bg-red-950/24 p-4">
        <p className="text-sm text-red-100" role="alert">{error}</p>
        <button className="button-secondary mt-3 min-h-10 px-4" disabled={locked} onClick={() => setRetry((current) => current + 1)} type="button">Atualizar vínculos</button>
      </div> : null}
      {feedback ? <p className="mt-6 rounded-2xl border border-cyan-200/18 bg-cyan-300/8 px-4 py-3 text-sm text-acrux-cyan-bright" role="status">{feedback}</p> : null}
    </section>
  );
}

