import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

/**
 * Shared shell for the static legal / informational pages
 * (/terminos, /envios-y-devoluciones, /contacto). Keeps the same
 * Header / Footer chrome as the rest of the site and applies a single
 * column of readable width with sensible typography defaults.
 */
export default function LegalLayout({
  title,
  subtitle,
  children,
}: {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf6e7]">
      <Header />
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-[#22244e] mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[#22244e]/60 text-base leading-relaxed">
                {subtitle}
              </p>
            )}
          </header>
          <div
            className="
              text-[#22244e]/80 leading-relaxed text-base space-y-5
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#22244e]
              [&_h2]:mt-10 [&_h2]:mb-3
              [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#22244e]
              [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5
              [&_a]:text-[#336aea] [&_a]:underline [&_a]:underline-offset-2
              [&_strong]:text-[#22244e]
            "
          >
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
