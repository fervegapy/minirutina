/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist v5 ships ESM (.mjs) and uses browser globals at module-eval time.
  // Without transpiling, Next.js' webpack hits "Object.defineProperty called on
  // non-object" inside pdf.mjs in dev. Transpiling these packages forces Next
  // to run them through its own loaders so the build doesn't blow up.
  transpilePackages: ["react-pdf", "pdfjs-dist"],
};

export default nextConfig;
