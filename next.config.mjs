/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist v5 ships ESM (.mjs) and uses browser globals at module-eval time.
  // Without transpiling, Next.js' webpack hits "Object.defineProperty called on
  // non-object" inside pdf.mjs in dev. Transpiling these packages forces Next
  // to run them through its own loaders so the build doesn't blow up.
  transpilePackages: ["react-pdf", "pdfjs-dist"],

  // Allow next/image to load logos / favicons / OG images served from the
  // Supabase Storage CDN (branding bucket). We also pass `unoptimized` on the
  // <Image> calls themselves, but the host still needs to be allowlisted.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // /lp fue la ruta donde se probó la landing simplificada antes de que pasara
  // a ser la home. Temporal y no permanente a propósito: si algún día se hace
  // un A/B con dos landings, /lp vuelve a ser una página y no queremos que el
  // navegador tenga cacheado un 308 hacia /.
  async redirects() {
    return [{ source: "/lp", destination: "/", permanent: false }];
  },

  // Vercel sirve todo /public con `max-age=0, must-revalidate`, así que el
  // navegador revalida cada archivo en cada visita y no guarda nada entre
  // sesiones. Estas reglas lo arreglan para los assets pesados.
  async headers() {
    return [
      {
        // La versión está en la ruta, así que el contenido de esta URL nunca
        // cambia y se puede cachear para siempre. Un re-encode va a /hero/v4/.
        source: "/hero/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Estos nombres no están versionados, así que no pueden ser immutable:
        // una semana fresco, y hasta 30 días sirviendo la copia guardada
        // mientras revalida de fondo. Si reemplazás una imagen sin cambiarle el
        // nombre, tarda hasta una semana en propagarse.
        source: "/:dir(icons|productos|recompensas|decorations|fonts)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
