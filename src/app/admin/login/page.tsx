import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Entrar na administração",
  robots: { index: false, follow: false },
};

interface AdminLoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="section pt-34">
      <div className="shell grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">Área privada</p>
          <h1 className="display-heading mt-5">Administração da ACRUX.</h1>
          <p className="body-copy mt-6">Apenas contas previamente autorizadas podem gerenciar conteúdos. Não existe cadastro público nesta área.</p>
          <Link className="mt-8 inline-flex text-sm font-bold text-acrux-cyan-bright hover:text-white" href="/">← Voltar para o site público</Link>
        </div>
        <div>
          {error === "unauthorized" ? <p className="mb-4 rounded-xl border border-yellow-200/24 bg-yellow-300/8 px-4 py-3 text-sm text-yellow-50">Esta conta não possui permissão administrativa.</p> : null}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

