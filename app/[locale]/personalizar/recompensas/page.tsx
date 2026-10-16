import RecompensasWizard from "@/components/customizer/RecompensasWizard";
import type { Locale } from "@/lib/i18n";

export default function Page({ params }: { params: { locale: Locale } }) {
  return <RecompensasWizard idioma={params.locale} />;
}
