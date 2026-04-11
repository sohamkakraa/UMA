/**
 * Geometry for an `<img>` with `object-fit: contain`: the axis-aligned rectangle
 * (in element CSS pixels) where the image is actually painted, plus intrinsic size.
 * Works for SVG and raster — uses naturalWidth / naturalHeight vs clientWidth / clientHeight.
 */
export type ObjectFitContainRect = {
  /** Element border box */
  rw: number;
  rh: number;
  /** Top-left of painted image inside the element */
  ox: number;
  oy: number;
  /** Painted size (same aspect as intrinsic) */
  dw: number;
  dh: number;
  iw: number;
  ih: number;
};

export function getObjectFitContainRect(img: HTMLImageElement): ObjectFitContainRect | null {
  const rw = img.clientWidth;
  const rh = img.clientHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (rw <= 0 || rh <= 0 || iw <= 0 || ih <= 0) return null;

  const s = Math.min(rw / iw, rh / ih);
  const dw = iw * s;
  const dh = ih * s;
  const ox = (rw - dw) / 2;
  const oy = (rh - dh) / 2;

  return { rw, rh, ox, oy, dw, dh, iw, ih };
}
