"use client";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const WA_TEXT   = encodeURIComponent("Hola Mini Rutina, les escribo desde la web y me gustaría saber");
const WA_URL    = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

export default function WhatsAppFloat() {
  if (!WA_NUMBER) return null;
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110"
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 24 24" fill="white" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.121 1.533 5.854L.057 23.428a.75.75 0 0 0 .916.916l5.616-1.474A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.587-.49-5.092-1.346l-.364-.212-3.776.99.999-3.696-.228-.376A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    </a>
  );
}
