"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, BarChart3, Search, FileText, ImageIcon, TrendingUp, Truck, Mail, Ticket, CreditCard, LogOut, Menu, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const NAV = [
  { href: "/admin/pedidos",     label: "Pedidos",     Icon: Package },
  { href: "/admin/ventas",      label: "Ventas",      Icon: BarChart3 },
  { href: "/admin/intenciones", label: "Intenciones", Icon: Search },
  { href: "/admin/mensajes",    label: "Mensajes",    Icon: Mail },
  { href: "/admin/cupones",      label: "Cupones",        Icon: Ticket },
  { href: "/admin/pagos",        label: "Pagos · dLocal", Icon: CreditCard },
  { href: "/admin/cms",          label: "Contenido",      Icon: FileText },
  { href: "/admin/tipo-cambio",  label: "Tipo de cambio", Icon: TrendingUp },
  { href: "/admin/delivery",     label: "Delivery",       Icon: Truck },
  { href: "/admin/branding",     label: "Branding",       Icon: ImageIcon },
];

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes (link tap, back/forward, etc).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const cerrarSesion = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-zinc-200 flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-2 -ml-2 rounded-md text-zinc-700 hover:bg-zinc-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-lg">🌿</span>
        <span className="font-semibold text-zinc-900">minirutina</span>
        <span className="ml-auto text-[10px] font-semibold tracking-wider uppercase text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
          admin
        </span>
      </div>

      {/* Overlay behind the mobile drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 ease-in-out md:static md:z-auto md:w-60 md:shrink-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span className="font-semibold text-zinc-900">minirutina</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
              admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="md:hidden p-1 rounded-md text-zinc-500 hover:bg-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
    </>
  );
}
