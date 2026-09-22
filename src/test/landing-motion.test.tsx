import { useRef } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLandingMotion } from "@/components/landing/useLandingMotion";

const motion = vi.hoisted(() => ({
  reduce: false,
  registerPlugin: vi.fn(),
  fromTo: vi.fn(),
  mediaRevert: vi.fn(),
  contextRevert: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: motion.registerPlugin,
    fromTo: motion.fromTo,
    matchMedia: () => ({
      add: (_queries: unknown, callback: (context: unknown) => void) => callback({ conditions: { desktop: true, reduce: motion.reduce } }),
      revert: motion.mediaRevert,
    }),
    context: (callback: () => void) => {
      callback();
      return { revert: motion.contextRevert };
    },
  },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { refresh: motion.refresh } }));

function MotionFixture() {
  const root = useRef<HTMLElement>(null);
  useLandingMotion(root);
  return (
    <main ref={root}>
      <section data-scene="prelude">
        <div data-motion="prelude-stage">
          <div data-prelude-layer="context" />
          <div data-prelude-layer="primary" />
          <div data-prelude-layer="details" />
        </div>
      </section>
      <section data-scene="whatsapp">
        <div data-motion="whatsapp-stage">
          <div data-motion="whatsapp-input">Entrada</div>
          <div data-motion="whatsapp-interpretation">Interpretacao</div>
        </div>
      </section>
      <section data-scene="signature">
        <div data-motion="signature-graph">Grafico</div>
        <div data-motion="signature-wordmark">Organizze</div>
      </section>
    </main>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  motion.reduce = false;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("landing motion lifecycle", () => {
  it("reveals each nested step and closing element when that element enters the viewport", async () => {
    const { container } = render(<MotionFixture />);
    await waitFor(() => expect(motion.fromTo).toHaveBeenCalledTimes(5));

    const [opening, ...steps] = motion.fromTo.mock.calls;
    expect(opening[0]).toHaveLength(3);
    expect(opening[2].scrollTrigger.trigger).toBe(container.querySelector('[data-scene="prelude"]'));
    expect(steps.map(([targets]) => targets[0].dataset.motion)).toEqual([
      "whatsapp-input", "whatsapp-interpretation", "signature-graph", "signature-wordmark",
    ]);
    for (const [targets, from, to] of steps) {
      expect(to.scrollTrigger.trigger).toBe(targets[0]);
      expect(to.scrollTrigger.once).toBe(true);
      expect(to.clearProps).toBe("transform,opacity");
      expect(from.opacity).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("removes scoped animations and media subscriptions when leaving the page", async () => {
    const { unmount } = render(<MotionFixture />);
    await waitFor(() => expect(motion.fromTo).toHaveBeenCalled());
    unmount();
    expect(motion.mediaRevert).toHaveBeenCalledOnce();
    expect(motion.contextRevert).toHaveBeenCalledOnce();
  });

  it("does not animate when reduced motion is requested", async () => {
    motion.reduce = true;
    const { unmount } = render(<MotionFixture />);
    await waitFor(() => expect(motion.registerPlugin).toHaveBeenCalled());
    expect(motion.fromTo).not.toHaveBeenCalled();
    unmount();
    expect(motion.mediaRevert).toHaveBeenCalledOnce();
  });

  it("refreshes scroll boundaries after a disclosure changes page height and disconnects on exit", async () => {
    let notify: ResizeObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: ResizeObserverCallback) { notify = callback; }
      observe() {}
      disconnect = disconnect;
    });
    const { unmount } = render(<MotionFixture />);
    await waitFor(() => expect(motion.fromTo).toHaveBeenCalled());
    motion.refresh.mockClear();
    notify([{ contentRect: { height: 100 } } as ResizeObserverEntry], {} as ResizeObserver);
    await waitFor(() => expect(motion.refresh).toHaveBeenCalledOnce());
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
