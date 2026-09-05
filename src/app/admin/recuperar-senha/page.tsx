import { PasswordRecoveryForm } from "@/components/admin/password-recovery-form";

export const metadata = {
  title: "Definir senha administrativa",
  robots: { index: false, follow: false },
};

export default function PasswordRecoveryPage() {
  return (
    <main className="section pt-34">
      <div className="shell max-w-3xl">
        <p className="eyebrow">Acesso administrativo</p>
        <h1 className="display-heading mt-5">Defina uma nova senha.</h1>
        <p className="body-copy mt-5">Informe o e-mail da sua conta autorizada. O link será enviado por e-mail; nunca informe sua senha para outra pessoa.</p>
        <div className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
          <PasswordRecoveryForm />
        </div>
      </div>
    </main>
  );
}
