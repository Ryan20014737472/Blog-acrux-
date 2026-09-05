import { ActivateAccountForm } from "@/components/admin/activate-account-form";

export const metadata = {
  title: "Ativar conta administrativa",
  robots: { index: false, follow: false },
};

export default function ActivateAccountPage() {
  return (
    <main className="section pt-34">
      <div className="shell max-w-3xl">
        <p className="eyebrow">Convite da ACRUX</p>
        <h1 className="display-heading mt-5">Defina sua senha.</h1>
        <p className="body-copy mt-5">Use esta página somente depois de abrir o convite recebido por e-mail. Não existe cadastro público para o painel.</p>
        <div className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
          <ActivateAccountForm />
        </div>
      </div>
    </main>
  );
}
