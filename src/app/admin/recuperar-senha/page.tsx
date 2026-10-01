import { PasswordRecoveryForm } from "@/components/admin/password-recovery-form";
import { SiteLogo } from "@/components/layout/site-logo";

export const metadata = {
  title: "Definir senha administrativa",
  robots: { index: false, follow: false },
};

export default function PasswordRecoveryPage() {
  return (
    <main className="admin-auth section pt-24 sm:pt-34">
      <div className="shell min-w-0 max-w-3xl">
        <div className="mb-8 hidden lg:block"><SiteLogo className="min-h-11" compact priority /></div>
        <p className="eyebrow">Acesso administrativo</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.055em] text-white sm:mt-5 sm:text-5xl lg:text-6xl">Defina uma nova senha.</h1>
        <p className="mt-3 text-sm leading-6 text-acrux-muted sm:mt-5 sm:text-base sm:leading-7">Informe o e-mail da sua conta autorizada. O link será enviado por e-mail; nunca informe sua senha para outra pessoa.</p>
        <div className="glass-panel mt-6 min-w-0 rounded-2xl p-4 sm:mt-8 sm:rounded-3xl sm:p-8">
          <PasswordRecoveryForm />
        </div>
      </div>
    </main>
  );
}
