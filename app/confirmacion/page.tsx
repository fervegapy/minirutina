import ConfirmacionPage from "./ConfirmacionPage";

export const dynamic = "force-dynamic";

// Versión en español. En inglés y portugués: app/[locale]/confirmacion.
export default function Page({ searchParams }: { searchParams: { pedido_id?: string; pagado?: string } }) {
  return <ConfirmacionPage searchParams={searchParams} />;
}
