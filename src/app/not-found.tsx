import { ArrowLink } from "@/components/ui/arrow-link";

export default function NotFound() {
  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">404</p>
        <h1 className="display-heading mt-5">Esta rota não faz parte da constelação.</h1>
        <p className="body-copy mt-6">O endereço pode ter mudado ou ainda não estar disponível.</p>
        <ArrowLink className="mt-8" href="/" variant="primary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}

