// src/utils/pdfScale.ts
import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api";

export type FitMode = "fitWidth" | "fitPage" | "actual";

export const CONTENT_PADDING_PX = 16;

export function computeBaseScale(
  page: PDFPageProxy,
  container: HTMLElement,
  rotation: 0 | 90 | 180 | 270,
  mode: FitMode
) {
  const unscaled = page.getViewport({ scale: 1, rotation });
  const cw = Math.max(0, container.clientWidth - CONTENT_PADDING_PX * 2);
  const ch = Math.max(0, container.clientHeight - CONTENT_PADDING_PX * 2);

  switch (mode) {
    case "fitWidth":
      return cw / unscaled.width || 1;
    case "fitPage":
      return Math.min(cw / unscaled.width, ch / unscaled.height) || 1;
    case "actual":
    default:
      return 1;
  }
}
