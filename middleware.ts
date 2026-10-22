// Middleware: keeps the Supabase auth session fresh on every request and
// protects /admin (except /admin/login + auth callback) by checking that
// the logged-in user's email is in the ADMIN_EMAILS allowlist.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-emails";
import { MONEDA_COOKIE, MONEDA_COOKIE_MAX_AGE, monedaFromCountryCode, type Moneda } from "@/lib/mercado";
import { LOCALE_COOKIE, PAIS_COOKIE, PAIS_FORZADO_COOKIE, PAIS_IP_COOKIE, isLocale, varianteDe, type Locale } from "@/lib/i18n";

// País elegido a mano (selector del header, o ?pais=AR para probar): va en
// PAIS_FORZADO_COOKIE, aparte, para que sin elección la moneda se recalcule
// por IP en cada visita.
const COOKIE_OPTS = { maxAge: MONEDA_COOKIE_MAX_AGE, path: "/" };

// ─── Sitio público: idioma + moneda ──────────────────────────────────────────
// No toca Supabase: en el embudo público solo resuelve idioma y moneda y
// reescribe a la variante estática de la página (ver lib/i18n.ts).
function publico(req: NextRequest): NextResponse {
  const { pathname, searchParams } = req.nextUrl;

  // Archivos estáticos (fotos de public/productos/, íconos, etc.) pasan de
  // largo: /productos/rutinas.png comparte prefijo con el detalle de
  // producto y si no se reescribía a /v/…, que no existe (404).
  if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

  // País → moneda. ?pais=XX lo fuerza (y ?pais=auto lo vuelve a la IP).
  const paisParam = searchParams.get("pais")?.toUpperCase() ?? null;
  const paisForzado = paisParam === "AUTO" ? null : paisParam ?? req.cookies.get(PAIS_FORZADO_COOKIE)?.value ?? null;
  const paisIp = req.headers.get("x-vercel-ip-country")?.toUpperCase() ?? null;
  const pais = paisForzado ?? paisIp;
  const moneda: Moneda = monedaFromCountryCode(pais);

  // Idioma: el prefijo de la URL manda; si no hay, lo que la persona eligió
  // con el selector (cookie); si no eligió nada, español. Nunca se cambia de
  // idioma por lo detectado: para eso está el aviso (AvisoPais), que sugiere
  // y deja decidir.
  const seg = pathname.split("/")[1];
  const idiomaParam = searchParams.get("idioma");
  const idiomaCookie = req.cookies.get(LOCALE_COOKIE)?.value;
  let locale: Locale;
  let resto = pathname; // ruta sin el prefijo de idioma
  if (seg === "en" || seg === "pt") {
    locale = seg;
    resto = pathname.slice(3) || "/";
  } else {
    locale = isLocale(idiomaParam) ? idiomaParam
           : isLocale(idiomaCookie) ? idiomaCookie
           : "es";
  }

  const conCookies = (r: NextResponse) => {
    if (paisParam) {
      if (paisParam === "AUTO") r.cookies.delete(PAIS_FORZADO_COOKIE);
      else r.cookies.set(PAIS_FORZADO_COOKIE, paisParam, COOKIE_OPTS);
    }
    if (req.cookies.get(MONEDA_COOKIE)?.value !== moneda) {
      // Legible desde el cliente: los precios se eligen en el navegador.
      r.cookies.set(MONEDA_COOKIE, moneda, COOKIE_OPTS);
    }
    // País en uso (el elegido o el de la IP) y el de la IP aparte: el
    // selector muestra el primero y el aviso compara contra el segundo.
    const paisUso = pais?.toUpperCase() ?? "PY";
    if (req.cookies.get(PAIS_COOKIE)?.value !== paisUso) r.cookies.set(PAIS_COOKIE, paisUso, COOKIE_OPTS);
    if (paisIp && req.cookies.get(PAIS_IP_COOKIE)?.value !== paisIp) r.cookies.set(PAIS_IP_COOKIE, paisIp, COOKIE_OPTS);
    // El idioma se guarda solo cuando la persona lo eligió con el selector
    // (?idioma=). Entrar por /en o /pt no lo fija: esa visita suele venir de
    // nuestra propia redirección o de un link compartido, y fijarlo dejaba a
    // la persona atrapada en ese idioma aunque después entrara por la URL en
    // español.
    const elegido = isLocale(idiomaParam) ? idiomaParam : null;
    if (elegido && idiomaCookie !== elegido) r.cookies.set(LOCALE_COOKIE, elegido, COOKIE_OPTS);
    return r;
  };

  // Una URL en español con otro idioma elegido → a su prefijo. Solo en las
  // páginas traducidas: home, detalle de producto y el flujo de compra.
  const esTraducible = resto === "/" || resto.startsWith("/productos/");
  // El flujo de compra existe de verdad en /en/… y /pt/… (app/[locale]/): no
  // se reescribe, se sirve tal cual.
  const esFlujo =
    resto.startsWith("/personalizar/") || resto === "/checkout" || resto === "/confirmacion";
  if (seg !== "en" && seg !== "pt" && locale !== "es" && (esTraducible || esFlujo)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${resto === "/" ? "" : resto}`;
    url.searchParams.delete("idioma");
    return conCookies(NextResponse.redirect(url));
  }

  if (esTraducible) {
    const url = req.nextUrl.clone();
    url.pathname = `/v/${varianteDe(locale, moneda)}${resto === "/" ? "" : resto}`;
    return conCookies(NextResponse.rewrite(url));
  }

  if (esFlujo) return conCookies(NextResponse.next());

  // Lo que no está traducido (/en/pagar/…, etc.) va a la versión en español.
  if (seg === "en" || seg === "pt") {
    const url = req.nextUrl.clone();
    url.pathname = resto;
    return conCookies(NextResponse.redirect(url));
  }

  return conCookies(NextResponse.next());
}

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (!p.startsWith("/admin") && !p.startsWith("/auth")) return publico(req);

  // Build a response we can attach cookies to as the session refreshes.
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: req });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({ request: req });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const pathname = req.nextUrl.pathname;

  // Refresh the session if needed.
  const { data: { user } } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (isAdminRoute && !isLoginRoute) {
    // Logged in and allowed? Continue.
    if (user && isAdminEmail(user.email)) return res;
    // Logged in but not on allowlist → sign out and bounce to login.
    if (user && !isAdminEmail(user.email)) {
      await supabase.auth.signOut();
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_allowed");
      return NextResponse.redirect(url);
    }
    // Not logged in → bounce to login.
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Solo las rutas con sesión. Los clientes no tienen cuenta (los pedidos se
  // identifican por contacto), así que el único que se autentica es el admin:
  // correr esto en la landing, los customizers y el checkout solo agregaba el
  // arranque del cliente de Supabase al TTFB de todo el embudo, sin usarlo.
  // Las públicas pasan por publico(), que es solo leer headers/cookies.
  matcher: [
    "/admin/:path*", "/auth/:path*",
    "/", "/en", "/en/:path*", "/pt", "/pt/:path*",
    "/productos/:path*", "/personalizar/:path*", "/checkout", "/confirmacion", "/pagar/:path*",
  ],
};
