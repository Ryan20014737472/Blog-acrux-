export const siteConfig = {
  name: "ACRUX ROBOCEP",
  shortName: "ACRUX",
  description:
    "Site oficial da equipe de robótica ACRUX ROBOCEP: tecnologia, engenharia, criatividade e conexão entre pessoas.",
  locale: "pt_BR",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const publicNavigation = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/equipe", label: "Equipe" },
  { href: "/robos", label: "Robôs" },
  { href: "/projetos", label: "Projetos" },
  { href: "/competicoes", label: "Competições" },
  { href: "/blog", label: "Blog" },
  { href: "/galeria", label: "Galeria" },
] as const;

export const adminNavigation = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/equipe", label: "Equipe" },
  { href: "/admin/robos", label: "Robôs" },
  { href: "/admin/projetos", label: "Projetos" },
  { href: "/admin/competicoes", label: "Competições" },
  { href: "/admin/galeria", label: "Galeria" },
  { href: "/admin/temporadas", label: "Temporadas" },
  { href: "/admin/patrocinadores", label: "Patrocinadores" },
  { href: "/admin/usuarios", label: "Usuários" },
] as const;

