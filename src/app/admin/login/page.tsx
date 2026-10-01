import Link from "next/link";
import { Suspense } from "react";

import { LoginErrorNotice } from "@/components/admin/login-error-notice";
import { LoginForm } from "@/components/admin/login-form";
import { SiteLogo } from "@/components/layout/site-logo";

export const metadata = {
  title: "Entrar na administração",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-auth section pt-24 sm:pt-34">
      <div className="shell grid min-w-0 max-w-5xl gap-6 sm:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:items-center">
        <div className="min-w-0">
          <div className="mb-8 hidden lg:block"><SiteLogo className="min-h-11" compact priority /></div>
          <p className="eyebrow">Área privada</p>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.055em] text-white sm:mt-5 sm:text-5xl lg:text-6xl">Administração da ACRUX.</h1>
          <p className="mt-3 text-sm leading-6 text-acrux-muted sm:mt-6 sm:text-base sm:leading-7">Apenas contas previamente autorizadas podem gerenciar conteúdos. Não existe cadastro público nesta área.</p>
          <Link className="mt-3 inline-flex min-h-11 items-center rounded-lg text-sm font-bold text-acrux-cyan-bright hover:text-white sm:mt-6" href="/">← Voltar para o site público</Link>
        </div>
        <div className="min-w-0">
          <Suspense fallback={null}>
            <LoginErrorNotice />
          </Suspense>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
