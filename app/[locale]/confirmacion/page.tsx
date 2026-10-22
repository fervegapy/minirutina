import ConfirmacionPage from "@/app/confirmacion/ConfirmacionPage";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function Page({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { pedido_id?: string; pagado?: string };
}) {
  return <ConfirmacionPage searchParams={searchParams} idioma={params.locale} />;
}
