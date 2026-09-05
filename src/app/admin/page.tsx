import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminSetupNotice } from "@/components/admin/admin-setup-notice";
import { requireAdminAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const access = await requireAdminAccess();

  if (access.kind === "unconfigured") {
    return <AdminSetupNotice />;
  }

  return <AdminDashboard displayName={access.displayName} email={access.email} role={access.role} />;
}

