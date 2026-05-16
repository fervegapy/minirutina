"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, BarChart3, Search, FileText, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const NAV = [
  { href: "/admin/pedidos",     label: "Pedidos",     Icon: Package },
  { href: "/admin/ventas",      label: "Ventas",      Icon: BarChart3 },
  { href: "/admin/intenciones", label: "Intenciones", Icon: Search },
  { href: "/admin/cms",         label: "Contenido",   Icon: FileText },
];

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const cerrarSesion = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-zinc-200 flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="font-semibold text-zinc-900">minirutina</span>
          <span className="ml-auto text-[10px] font-semibold tracking-wider uppercase text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
            admin
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-zinc-200">
        <div className="px-3 py-2 mb-1">
          <p className="text-[11px] text-zinc-500 truncate" title={email}>
            {email}
          </p>
        </div>
        <button
          type="button"
          onClick={cerrarSesion}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
