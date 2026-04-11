"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getObjectFitContainRect } from "@/lib/objectFitContainRect";
import { cn } from "@/components/ui/cn";

const MAG = 2.25;
const LENS_PX = 148;

type AnatomyImageWithMagnifierProps = {
  mainSrc: string;
  underlaySrc: string | null;
  themeAttr: "light" | "dark";
  isOrgan: boolean;
};

/**
 * Cursor-following magnifier (Framer-style): `backgroundPosition` equivalent via a second
 * `<img>` positioned using object-fit **contain** math from `naturalWidth` / `naturalHeight`.
 */
export function AnatomyImageWithMagnifier({
  mainSrc,
  underlaySrc,
  themeAttr,
  isOrgan,
}: AnatomyImageWithMagnifierProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showLens, setShowLens] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [m, setM] = useState({ mx: 0, my: 0 });
  const [lensGeom, setLensGeom] = useState<{
    ux: number;
    uy: number;
    dw: number;
    dh: number;
  } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setShowLens(false);
    setLensGeom(null);
  }, [mainSrc]);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      const wrap = wrapRef.current;
      const img = imgRef.current;
      if (!wrap || !img || img.naturalWidth === 0) return;
      const wr = wrap.getBoundingClientRect();
      const mx = e.clientX - wr.left;
      const my = e.clientY - wr.top;
      setM({ mx, my });

      const g = getObjectFitContainRect(img);
      if (!g) {
        setShowLens(false);
        setLensGeom(null);
        return;
      }
      const ux = mx - g.ox;
      const uy = my - g.oy;
      if (ux < 0 || uy < 0 || ux > g.dw || uy > g.dh) {
        setShowLens(false);
        setLensGeom(null);
        return;
      }
      setLensGeom({ ux, uy, dw: g.dw, dh: g.dh });
      setShowLens(true);
    },
    [reduceMotion]
  );

  const onLeave = useCallback(() => {
    setShowLens(false);
    setLensGeom(null);
  }, []);

  const outerImgClass = isOrgan
    ? "body-anatomy-organ relative z-[1] block max-h-[min(74vh,680px)] w-auto max-w-[min(480px,92vw)] object-contain"
    : "body-anatomy-silhouette relative z-[1] block max-h-[min(74vh,680px)] w-auto max-w-[min(480px,92vw)] object-contain";

  const innerImgClass = isOrgan ? "body-anatomy-organ" : "body-anatomy-silhouette";

  const lensLeft = m.mx - LENS_PX / 2;
  const lensTop = m.my - LENS_PX / 2;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative inline-block leading-none rounded-2xl border border-[var(--border)]/40 bg-[var(--panel-2)]/20",
        reduceMotion ? "cursor-default" : "cursor-none"
      )}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {underlaySrc ? (
        <img
          src={underlaySrc}
          alt=""
          width={360}
          height={640}
          data-body-theme={themeAttr}
          className="body-anatomy-silhouette body-anatomy-silhouette--underlay pointer-events-none absolute left-1/2 top-1/2 z-0 max-h-[min(72vh,640px)] w-auto max-w-[min(420px,44vw)] -translate-x-1/2 -translate-y-1/2 object-contain"
        />
      ) : null}
      <img
        ref={imgRef}
        src={mainSrc}
        alt=""
        width={400}
        height={640}
        data-body-theme={themeAttr}
        className={outerImgClass}
        draggable={false}
      />

      {showLens && lensGeom && !reduceMotion ? (
        <div
          className="pointer-events-none absolute z-20 overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--panel)] shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
          style={{
            width: LENS_PX,
            height: LENS_PX,
            left: lensLeft,
            top: lensTop,
          }}
          aria-hidden
        >
          <img
            src={mainSrc}
            alt=""
            draggable={false}
            data-body-theme={themeAttr}
            className={innerImgClass}
            style={{
              position: "absolute",
              width: lensGeom.dw * MAG,
              height: lensGeom.dh * MAG,
              left: LENS_PX / 2 - lensGeom.ux * MAG,
              top: LENS_PX / 2 - lensGeom.uy * MAG,
              maxWidth: "none",
              maxHeight: "none",
              objectFit: "fill",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
