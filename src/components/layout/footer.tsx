import Link from "next/link";

import { publicNavigation, siteConfig } from "@/config/site";
import { SiteLogo } from "@/components/layout/site-logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020817]/70">
      <div className="shell grid gap-10 py-12 sm:grid-cols-[1.25fr_1fr] lg:grid-cols-[1.4fr_1fr_0.8fr]">
        <div>
          <SiteLogo />
          <p className="mt-5 max-w-sm text-sm leading-6 text-acrux-muted">
            Tecnologia, engenharia, criatividade e conexão entre pessoas. Conteúdos oficiais da equipe serão publicados aqui.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">Explorar</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            {publicNavigation.map((item) => (
              <li key={item.href}>
                <Link className="text-sm text-acrux-muted transition-colors hover:text-acrux-cyan-bright" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">Área interna</p>
          <p className="mt-4 text-sm leading-6 text-acrux-muted">
            A edição do conteúdo é reservada às contas autorizadas da ACRUX.
          </p>
          <Link className="mt-4 inline-flex text-sm font-bold text-acrux-cyan-bright hover:text-white" href="/admin">
            Acessar administração →
          </Link>
        </div>
      </div>
      <div className="border-t border-white/8">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-acrux-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.</p>
          <p>Identidade visual baseada na marca oficial da ACRUX.</p>
        </div>
      </div>
    </footer>
  );
}

