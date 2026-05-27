import { createSupabaseServerClient } from "@/lib/supabase-server";
import MensajesView, { type Mensaje } from "@/components/admin/MensajesView";

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("mensajes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Mensajes de contacto
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Cada submission del formulario en{" "}
          <a href="/contacto" className="underline" target="_blank">/contacto</a>{" "}
          queda guardada acá. También llega un email a soporte@minirutina.com.
        </p>
      </header>
      <MensajesView mensajes={(data ?? []) as Mensaje[]} />
    </div>
  );
}
