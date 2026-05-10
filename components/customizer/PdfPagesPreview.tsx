"use client";

// Renders a PDF as canvas-rendered images via pdf.js (through react-pdf).
// We do this instead of an <iframe>/native PDF viewer because mobile browsers
// (especially iOS Safari) refuse to render PDFs inline or render them poorly.
// Canvas works the same on every device and respects the container width.

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Match the worker version to the installed pdfjs-dist (avoids API mismatch errors).
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  url: string;
}

export default function PdfPagesPreview({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Track the container width so each page is rendered at the right scale.
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      ref={containerRef}
      className="space-y-3 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {error ? (
        <p className="text-sm text-red-500 text-center py-6">{error}</p>
      ) : (
        <Document
          file={url}
          loading={
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-6 h-6 border-[3px] border-[#ecbc5d] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#233933]/50">Cargando vista previa...</p>
            </div>
          }
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(e) => setError(e.message)}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-white"
            >
              <Page
                pageNumber={i + 1}
                width={width || undefined}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
