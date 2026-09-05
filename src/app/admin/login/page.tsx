import Link from "next/link";
import { Suspense } from "react";

import { LoginErrorNotice } from "@/components/admin/login-error-notice";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Entrar na administração",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
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
          <Suspense fallback={null}>
            <LoginErrorNotice />
          </Suspense>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
