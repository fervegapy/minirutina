import { getDlocalConfigRow } from "@/lib/dlocal-config";
import PagosView from "@/components/admin/PagosView";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const cfg = await getDlocalConfigRow();
  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Pagos · dLocal Go
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Credenciales y modo del checkout. Los cambios se aplican al
          instante — no hace falta redeploy ni tocar Vercel.
        </p>
      </header>
      <PagosView cfg={cfg} />
    </div>
  );
}
