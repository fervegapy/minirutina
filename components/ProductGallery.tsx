"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  /** Image URLs in display order. */
  images: string[];
  /** Alt text base — index appended automatically. */
  alt: string;
  /** Accent color hex used for the active thumbnail outline + active dot. */
  accentColor?: string;
}

/**
 * Light-weight image carousel for product detail pages. No external deps —
 * just useState + arrow buttons + thumbnail strip. Keyboard arrows work
 * when the gallery is focused.
 */
export default function ProductGallery({
  images,
  alt,
  accentColor = "#336aea",
}: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  const go = useCallback(
    (delta: number) => {
      setCurrent((c) => (c + delta + count) % count);
    },
    [count],
  );

  // Arrow-key navigation when the gallery is the focused region.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) return null;

  return (
    <div className="w-full">
      {/* Main image */}
      <div className="relative rounded-3xl overflow-hidden aspect-square border border-[#e5e7eb] bg-white">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`${alt} — imagen ${i + 1}`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            priority={i === 0}
            className={`object-cover transition-opacity duration-300 ${
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-[#e5e7eb] text-[#22244e] flex items-center justify-center transition-all duration-200 hover:-translate-y-1/2 hover:scale-105 active:scale-95 backdrop-blur"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-[#e5e7eb] text-[#22244e] flex items-center justify-center transition-all duration-200 hover:-translate-y-1/2 hover:scale-105 active:scale-95 backdrop-blur"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators — bottom center */}
        {count > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Ir a imagen ${i + 1}`}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: i === current ? accentColor : "#22244e22",
                  width:           i === current ? 22 : 8,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:opacity-100"
              style={{
                borderColor: i === current ? accentColor : "#e5e7eb",
                opacity:     i === current ? 1 : 0.6,
              }}
            >
              <Image
                src={src}
                alt={`${alt} — miniatura ${i + 1}`}
                fill
                sizes="(min-width: 768px) 15vw, 30vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
