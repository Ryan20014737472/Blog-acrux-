import Link from "next/link";

import { ArrowLink } from "@/components/ui/arrow-link";

interface AdminSectionProps {
  section: string;
}

const copy: Record<string, { title: string; description: string }> = {
  blog: { title: "Gerenciar blog", description: "A edição de postagens, categorias, tags, capas e status será conectada ao Supabase nesta área." },
  equipe: { title: "Gerenciar equipe", description: "Perfis, fotos, áreas, funções e ordem de exibição serão administrados aqui." },
  robos: { title: "Gerenciar robôs", description: "Robôs, mecanismos, componentes, temporadas e galerias serão administrados aqui." },
  projetos: { title: "Gerenciar projetos", description: "Projetos, categorias e conteúdos relacionados serão administrados aqui." },
  competicoes: { title: "Gerenciar competições", description: "Eventos, resultados, premiações, relatos e participantes serão administrados aqui." },
  galeria: { title: "Gerenciar galeria", description: "Álbuns, imagens, textos alternativos e conteúdo visual serão administrados aqui." },
  temporadas: { title: "Gerenciar temporadas", description: "A organização cronológica de conteúdos da ACRUX será administrada aqui." },
  patrocinadores: { title: "Gerenciar patrocinadores", description: "Parceiros confirmados, logotipos e links oficiais serão administrados aqui." },
  usuarios: { title: "Gerenciar usuários", description: "Somente administradores poderão conceder ou revisar acessos autorizados." },
};

export function AdminSection({ section }: AdminSectionProps) {
  const content = copy[section] ?? { title: "Área administrativa", description: "Seção em preparação." };

  return (
    <main className="section pt-34">
      <div className="shell max-w-4xl">
        <p className="eyebrow">Administração</p>
        <h1 className="display-heading mt-5">{content.title}</h1>
        <div className="glass-panel panel-grid mt-8 rounded-3xl p-6 sm:p-8">
          <p className="body-copy">{content.description}</p>
          <p className="mt-5 text-sm leading-6 text-acrux-muted">A estrutura de acesso já está protegida por autenticação e papéis; os formulários de gestão serão implementados após a conexão do banco de dados.</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ArrowLink href="/admin" variant="secondary">Voltar ao dashboard</ArrowLink>
          <Link className="button-secondary" href="/">Ver site público</Link>
        </div>
      </div>
    </main>
  );
}

