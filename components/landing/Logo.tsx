// El logo de la marca, para header y footer.
//
// El logo "oficial" vive en site_config y se cambia desde /admin/branding sin
// deploy. El problema es que estas páginas son estáticas: si el fetch a
// Supabase falla durante el build, getSiteConfig devuelve su FALLBACK y el
// HTML queda prerenderizado con eso hasta la próxima revalidación. Antes el
// fallback era un emoji de planta con el nombre en texto, así que producción
// llegó a servir la home sin logo.
//
// Ahora el fallback es el mismo logo servido desde /public: si Supabase
// responde, gana la versión del admin; si no, igual se ve la marca. Cuando se
// cambie el logo desde /admin/branding conviene actualizar también
// public/logo.png, que es la red de seguridad.
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getSiteConfig } from "@/lib/site-config";

export default async function Logo({
  // El footer va sobre azul oscuro y lo pinta de blanco.
  invert = false,
  priority = false,
}: {
  invert?: boolean;
  priority?: boolean;
}) {
  const cfg = await getSiteConfig();

  return (
    <Image
      src={cfg.logo_url || "/logo.png"}
      alt={cfg.site_name}
      width={160}
      height={40}
      priority={priority}
      unoptimized
      className={cn(
        "h-8 w-auto object-contain",
        invert && "brightness-0 invert",
      )}
    />
  );
}
