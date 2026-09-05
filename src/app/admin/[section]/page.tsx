import { notFound } from "next/navigation";

import { AdminSection } from "@/components/admin/admin-section";
import { AdminSetupNotice } from "@/components/admin/admin-setup-notice";
import { requireAdminAccess } from "@/lib/auth/access";

const sections = ["blog", "equipe", "robos", "projetos", "competicoes", "galeria", "temporadas", "patrocinadores", "usuarios"] as const;
type AdminSectionName = (typeof sections)[number];

interface AdminSectionPageProps {
  params: Promise<{ section: string }>;
}

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section } = await params;

  if (!sections.includes(section as AdminSectionName)) {
    notFound();
  }

  const access = await requireAdminAccess();
  if (access.kind === "unconfigured") {
    return <AdminSetupNotice />;
  }

  if (section === "usuarios" && access.role !== "admin") {
    notFound();
  }

  return <AdminSection section={section} />;
}

