import { AdminSection } from "@/components/admin/admin-section";

const sections = ["blog", "equipe", "robos", "projetos", "competicoes", "galeria", "temporadas", "patrocinadores", "usuarios"] as const;

interface AdminSectionPageProps {
  params: Promise<{ section: string }>;
}

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export const dynamicParams = false;
export const metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section } = await params;

  return <AdminSection section={section} />;
}
