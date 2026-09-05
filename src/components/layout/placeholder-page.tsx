import type { ReactNode } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-heading mt-5">{title}</h1>
        <p className="body-copy mt-6">{description}</p>
        <div className="glass-panel panel-grid mt-10 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-acrux-cyan-bright">
            <span className="status-dot" />
            Estrutura inicial pronta
          </div>
          <p className="mt-4 max-w-2xl text-base leading-7 text-acrux-muted">
            Conteúdo da equipe será adicionado posteriormente pelo painel administrativo.
          </p>
          {children}
        </div>
        <ArrowLink className="mt-8" href="/" variant="secondary">
          Voltar para o início
        </ArrowLink>
      </div>
    </main>
  );
}

