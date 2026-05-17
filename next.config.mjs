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
};

export default nextConfig;
