import { ArrowLink } from "@/components/ui/arrow-link";

export function AdminSetupNotice() {
  return (
    <main className="admin-workspace section pt-24 sm:pt-34">
      <div className="shell max-w-3xl">
        <p className="eyebrow">Área administrativa</p>
        <h1 className="display-heading mt-5">Autenticação ainda não configurada.</h1>
        <div className="glass-panel mt-8 rounded-2xl p-4 sm:rounded-3xl sm:p-8">
          <p className="text-base leading-7 text-acrux-muted">Conecte as variáveis públicas do Supabase neste ambiente e aplique a migração inicial. A área administrativa não usa senhas fixas no frontend nem cadastro público.</p>
        </div>
        <ArrowLink className="mt-8" href="/" variant="secondary">Voltar ao site público</ArrowLink>
      </div>
    </main>
  );
}

