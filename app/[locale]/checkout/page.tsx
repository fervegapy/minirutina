import CheckoutView from "@/components/checkout/CheckoutView";
import type { Locale } from "@/lib/i18n";

export default function Page({ params }: { params: { locale: Locale } }) {
  return <CheckoutView idioma={params.locale} />;
}
