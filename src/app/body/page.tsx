"use client";

import { useEffect, useMemo, useState } from "react";
import { getHydrationSafeStore, getStore } from "@/lib/store";
import { resolveThemePreference } from "@/lib/themePreference";
import type { ExtractedLab } from "@/lib/types";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { BodyScrollCanvas } from "@/components/body/BodyScrollCanvas";
import { BodySectionDock } from "@/components/body/BodySectionDock";
import {
  organGroupFromProfileSex,
  resolveBodyScrollSections,
} from "@/lib/bodyScrollRegistry";

function syncThemeFromDocument(): "light" | "dark" {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return resolveThemePreference(getStore().preferences?.theme);
}

export default function BodyPage() {
  const [scrollY, setScrollY] = useState(0);
  const [windowHeight, setWindowHeight] = useState(800);
  const [store, setStore] = useState(() => getHydrationSafeStore());
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window === "undefined" ? resolveThemePreference(undefined) : syncThemeFromDocument()
  );

  const organGroup = useMemo(() => organGroupFromProfileSex(store?.profile?.sex), [store?.profile?.sex]);
  const sections = useMemo(() => resolveBodyScrollSections(organGroup), [organGroup]);

  useEffect(() => {
    queueMicrotask(() => {
      setStore(getStore());
      setTheme(syncThemeFromDocument());
      setWindowHeight(window.innerHeight);
    });
    const handleScroll = () => setScrollY(window.scrollY);
    const handleResize = () => setWindowHeight(window.innerHeight);

    const syncTheme = () => setTheme(syncThemeFromDocument());
    const onStoreUpdate = () => syncTheme();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("storage", syncTheme);
    window.addEventListener("focus", syncTheme);
    window.addEventListener("mv-store-update", onStoreUpdate);
    const mo = new MutationObserver(syncTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("focus", syncTheme);
      window.removeEventListener("mv-store-update", onStoreUpdate);
      mo.disconnect();
    };
  }, []);

  /** Land on first viewport: organ group for profile sex (intro slide). */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [organGroup]);

  const isLight = theme === "light";

  const activeIndex = useMemo(() => {
    const raw = Math.floor((scrollY + windowHeight * 0.4) / windowHeight);
    return Math.max(0, Math.min(sections.length - 1, raw));
  }, [scrollY, windowHeight, sections.length]);

  const activeSection = sections[activeIndex] ?? sections[0];

  const sectionLabs = useMemo<ExtractedLab[]>(() => {
    if (!store || activeSection.labKeys.length === 0) return [];
    const allLabs = store.labs ?? [];
    const filtered = allLabs.filter((lab) =>
      activeSection.labKeys.some((key) => lab.name.toLowerCase().includes(key.toLowerCase()))
    );
    filtered.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
    const seen = new Set<string>();
    const deduped: ExtractedLab[] = [];
    for (const lab of filtered) {
      const key = lab.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(lab);
      }
    }
    return deduped.slice(0, 5);
  }, [store, activeSection]);

  const scrollToSection = (index: number) => {
    const vh = typeof window !== "undefined" ? window.innerHeight : windowHeight;
    window.scrollTo({ top: index * vh, behavior: "smooth" });
  };

  const scrollSpacerVh = sections.length * 100;

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateY(-50%) translateX(-24px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateY(-50%) translateX(24px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes introFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <div
        style={{
          background: isLight ? "var(--bg)" : "#030d14",
          minHeight: "100vh",
          color: isLight ? "var(--fg)" : undefined,
          paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <AppTopNav fixed />

        <div style={{ height: `${scrollSpacerVh}vh` }}>
          <div
            style={{
              position: "sticky",
              top: 56,
              height:
                "calc(100vh - 56px - 5.75rem - max(0px, env(safe-area-inset-bottom, 0px)))",
              overflow: "hidden",
            }}
          >
            <BodyScrollCanvas
              activeIndex={activeIndex}
              activeSection={activeSection}
              sectionLabs={sectionLabs}
              isLight={isLight}
              organGroup={organGroup}
            />
          </div>
        </div>

        <BodySectionDock
          sections={sections}
          activeIndex={activeIndex}
          isLight={isLight}
          onGoTo={scrollToSection}
        />
      </div>
    </>
  );
}
