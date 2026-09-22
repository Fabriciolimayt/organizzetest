import { useEffect, type RefObject } from "react";

export function useLandingMotion(scope: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    let cancelled = false;
    let cleanup = () => {};
    let resize: ResizeObserver | null = null;
    let refreshFrame = 0;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        const context = gsap.context(() => {
          media.add(
            { desktop: "(min-width: 1024px)", reduce: "(prefers-reduced-motion: reduce)", all: "all" },
            ({ conditions }) => {
              if (conditions?.reduce) return;
              const desktop = Boolean(conditions?.desktop);
              root.querySelectorAll<HTMLElement>("[data-scene]").forEach((scene) => {
                const prelude = scene.dataset.scene === "prelude";
                const targets = prelude
                  ? Array.from(scene.querySelectorAll<HTMLElement>("[data-prelude-layer]"))
                  : Array.from(scene.querySelectorAll<HTMLElement>("[data-motion]")).filter(
                    (node) => !node.querySelector("[data-motion]"),
                  );
                if (!targets.length) return;

                // Animate leaf content only, without multiplying ancestor opacity.
                const groups = prelude ? [targets] : targets.map((target) => [target]);
                groups.forEach((group, index) => {
                  gsap.fromTo(group,
                    { y: desktop ? 24 : 10, opacity: 0.9 },
                    {
                      y: 0, opacity: 1, duration: desktop ? 0.72 : 0.4,
                      delay: Math.min(index, 3) * (desktop ? 0.06 : 0.03),
                      stagger: prelude ? 0.1 : 0, ease: "power3.out",
                      clearProps: "transform,opacity",
                      scrollTrigger: { trigger: prelude ? scene : group[0], start: "top 88%", once: true },
                    },
                  );
                });
              });
              root.querySelectorAll<SVGElement>("[data-chart-reveal]").forEach((chart) => {
                gsap.fromTo(chart, { clipPath: "inset(0 100% 0 0)" }, {
                  clipPath: "inset(0 0% 0 0)", duration: 1.25, ease: "power2.out",
                  scrollTrigger: { trigger: chart.closest("svg"), start: "top 90%", once: true },
                  clearProps: "clipPath",
                });
              });
              root.querySelectorAll<HTMLElement>(".demo-bars").forEach((bars) => {
                gsap.fromTo(bars.querySelectorAll("[data-bar-reveal]"), { scaleY: 0.12 }, {
                  scaleY: 1, stagger: 0.045, duration: 0.8, ease: "power3.out", clearProps: "transform",
                  scrollTrigger: { trigger: bars, start: "top 90%", once: true },
                });
              });
              root.querySelectorAll<HTMLElement>("[data-source-node]").forEach((node, index) => {
                gsap.fromTo(node, { y: 20 }, {
                  y: 0, duration: 0.9, delay: index * 0.08, ease: "power3.out",
                  scrollTrigger: { trigger: node.parentElement, start: "top 75%", once: true }, clearProps: "transform",
                });
              });
              root.querySelectorAll<HTMLElement>("[data-context-shift]").forEach((panel, index) => {
                gsap.fromTo(panel, { y: desktop ? 30 : 12 }, {
                  y: desktop ? -24 : -8, ease: "none",
                  scrollTrigger: { trigger: panel.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 + index * 0.04 },
                });
              });
              root.querySelectorAll<HTMLElement>("[data-scan-beam]").forEach((beam) => {
                gsap.fromTo(beam, { scaleX: 0, opacity: 0 }, {
                  scaleX: 1, opacity: 1, duration: 0.9, ease: "power3.out",
                  scrollTrigger: { trigger: beam, start: "top 85%", once: true },
                });
              });
            },
          );
        }, root);
        let previousHeight = root.getBoundingClientRect().height;
        resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(([entry]) => {
          if (!entry || cancelled || Math.abs(entry.contentRect.height - previousHeight) < 0.5) return;
          previousHeight = entry.contentRect.height;
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => { if (!cancelled) ScrollTrigger.refresh(); });
        });
        resize?.observe(root);
        cleanup = () => { media.revert(); context.revert(); };
        void document.fonts?.ready.then(() => {
          if (!cancelled) ScrollTrigger.refresh();
        });
      })
      .catch(() => cleanup());

    return () => {
      cancelled = true;
      cancelAnimationFrame(refreshFrame);
      resize?.disconnect();
      cleanup();
    };
  }, [scope]);
}
