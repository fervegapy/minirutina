import RutinasWizard from "@/components/customizer/RutinasWizard";
import type { Locale } from "@/lib/i18n";

export default function Page({ params }: { params: { locale: Locale } }) {
  return <RutinasWizard idioma={params.locale} />;
}
