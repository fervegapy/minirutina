// Admin shell — wraps every page under /admin EXCEPT /admin/login (which
// lives outside this route group). The middleware already enforces auth,
// so by the time this server component renders we know we have a valid
// allowlisted user; we just pull the email for the header.
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-emails";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    // Belt-and-suspenders: middleware should have caught this already.
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex">
      <AdminSidebar email={user.email ?? ""} />
      <main className="flex-1 min-w-0 px-6 py-8 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
}
