import { getZonas } from "@/lib/delivery";
import DeliveryView from "@/components/admin/DeliveryView";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const zonas = await getZonas();

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Delivery
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Zonas y precios de envío. Cada zona agrupa ciudades — al elegir una
          ciudad en el checkout, se cobra el precio de la zona correspondiente.
          La zona marcada como <strong>default</strong> se aplica a cualquier
          ciudad que no esté en otra zona.
        </p>
      </header>
      <DeliveryView zonas={zonas} />
    </div>
  );
}
