import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import BrandSignature from "@/components/landing/BrandSignature";
import CentralPromise from "@/components/landing/CentralPromise";
import FinancialPrelude from "@/components/landing/FinancialPrelude";
import PixelReveal from "@/components/landing/PixelReveal";
import { formatLandingMoney } from "@/components/landing/formatLandingMoney";
import { getLandingCopy, type PublicLocale } from "@/components/landing/landingCopy";
import { landingDemo, localizeDemoLabel } from "@/components/landing/landingDemo";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const renderOpening = (locale: PublicLocale = "pt-PT") => render(
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <FinancialPrelude demo={landingDemo} locale={locale} />
    <CentralPromise copy={getLandingCopy(locale)} />
  </MemoryRouter>,
);

describe("compact product-first opening", () => {
  it("keeps three chart planes and a branded, copy-driven promise with the same actions", () => {
    const { container } = renderOpening();
    const stage = container.querySelector('[data-motion="prelude-stage"]');
    const layers = Array.from(container.querySelectorAll<HTMLElement>("[data-prelude-layer]"));

    expect(layers.map((layer) => layer.dataset.preludeLayer)).toEqual(["context", "primary", "details"]);
    expect(layers.map((layer) => layer.dataset.motion)).toEqual(["prelude-context", "prelude-primary", "prelude-details"]);
    for (const layer of layers) {
      expect(layer.parentElement).toBe(stage);
      expect(layer.className).not.toMatch(/\babsolute\b/);
    }
    expect(container.querySelectorAll('[data-prelude-layer="context"] dd')).toHaveLength(4);
    expect(container.querySelector('[data-prelude-layer="context"] .truncate')).toBeNull();
    expect(Array.from(container.querySelectorAll("[data-scene]"), (scene) => scene.getAttribute("data-scene")))
      .toEqual(["prelude", "promise"]);
    expect(container.querySelectorAll(".opening-chart-plane")).toHaveLength(3);
    expect(container.querySelectorAll(".opening-prelude__donut circle")).toHaveLength(landingDemo.categories.length);
    expect(container.querySelectorAll(".opening-prelude__bars rect")).toHaveLength(landingDemo.categories.length);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Organizze");
    expect(screen.getByRole("heading", { name: getLandingCopy("pt-PT").promiseTitle })).toHaveClass("opening-promise__title");
    expect(screen.getByRole("link", { name: "Começar 15 dias grátis" })).toHaveAttribute("href", "/auth");
    expect(screen.getByRole("link", { name: "Ver como funciona" })).toHaveAttribute("href", "#month");
  });

  it.each<PublicLocale>(["pt-PT", "pt-BR"])("preserves all details behind a named disclosure in %s", (locale) => {
    renderOpening(locale);
    const trigger = screen.getByRole("button", { name: "Detalhes do mês" });
    const content = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveClass("opening-prelude__details-toggle");
    expect(content).toHaveClass("sr-only");

    trigger.focus();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveFocus();
    expect(content).toHaveClass("opening-prelude__details");
    expect(content).not.toHaveClass("sr-only");

    for (const category of landingDemo.categories) {
      expect(within(content).getByText(localizeDemoLabel(category.label, locale))).toBeInTheDocument();
      expect(content).toHaveTextContent(formatLandingMoney(category.amount, landingDemo.currency, locale).replace(/\s/g, " "));
    }
    const statusLabels = locale === "pt-PT"
      ? { safe: "Dentro do previsto", warning: "A acompanhar", expense: "Comprometido" }
      : { safe: "Dentro do planejado", warning: "Acompanhar", expense: "Comprometido" };
    for (const commitment of landingDemo.upcoming) {
      const row = within(content).getByRole("article", { name: localizeDemoLabel(commitment.label, locale) });
      expect(row).toHaveTextContent(formatLandingMoney(commitment.amount, landingDemo.currency, locale).replace(/\s/g, " "));
      expect(row).toHaveTextContent(commitment.date);
      expect(row).toHaveTextContent(statusLabels[commitment.status]);
    }

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(content).toHaveClass("sr-only");
    expect(within(content).getAllByRole("article")).toHaveLength(landingDemo.upcoming.length);
  });
});

describe("accessible one-shot pixel assembly", () => {
  const installCanvas = () => {
    let intersection: IntersectionObserverCallback;
    const disconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { intersection = callback; }
      observe() {}
      disconnect = disconnect;
    });
    const frames = new Map<number, FrameRequestCallback>();
    let id = 0;
    const request = vi.fn((callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
    const cancel = vi.fn((handle: number) => { frames.delete(handle); });
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const rect = { width: 100, height: 32, top: 0, left: 0, right: 100, bottom: 32, x: 0, y: 0, toJSON() {} };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect);
    vi.spyOn(document, "createRange").mockReturnValue({ setStart() {}, setEnd() {}, detach() {}, getBoundingClientRect: () => rect } as unknown as Range);
    const context = {
      clearRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), setTransform: vi.fn(),
      measureText: () => ({ fontBoundingBoxAscent: 24, fontBoundingBoxDescent: 8 }),
      getImageData: (_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4).fill(255) }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    return {
      context, request, cancel, disconnect, frames,
      intersect: (isIntersecting: boolean) => act(() => intersection([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)),
      tick: (time: number) => act(() => {
        const callbacks = Array.from(frames.values());
        frames.clear();
        callbacks.forEach((callback) => callback(time));
      }),
    };
  };

  it("keeps semantic text readable before intersection, pauses offscreen, finishes once and cleans up", async () => {
    const animation = installCanvas();
    const remove = vi.spyOn(document, "removeEventListener");
    const { container, unmount } = render(<PixelReveal as="h1" text="Organizze" id="brand" />);
    await act(async () => {});
    const canvas = container.querySelector("[data-pixel-canvas]")!;
    expect(screen.getByRole("heading", { name: "Organizze" })).toBeVisible();
    expect(canvas).toHaveAttribute("hidden");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(animation.request).not.toHaveBeenCalled();
    animation.intersect(true);
    animation.tick(100);
    animation.tick(550);
    expect(canvas).toHaveAttribute("data-pixel-state", "assembling");
    expect(animation.context.fillRect).toHaveBeenCalled();
    animation.intersect(false);
    expect(animation.frames.size).toBe(0);
    animation.intersect(true);
    animation.tick(10000);
    expect(canvas).not.toHaveAttribute("hidden");
    animation.tick(10500);
    expect(canvas).toHaveAttribute("hidden");
    expect(canvas).toHaveAttribute("data-pixel-state", "complete");
    animation.intersect(false);
    animation.intersect(true);
    expect(animation.frames.size).toBe(0);
    expect(screen.getByRole("heading", { name: "Organizze" })).toBeVisible();
    unmount();
    expect(animation.disconnect).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });

  it("renders static text without canvas work for reduced motion", async () => {
    const animation = installCanvas();
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const { container } = render(<PixelReveal as="p" text="O mês, claro." />);
    await act(async () => {});
    expect(screen.getByText("O mês, claro.")).toBeVisible();
    expect(container.querySelector("canvas")).toHaveAttribute("hidden");
    expect(animation.request).not.toHaveBeenCalled();
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
  });

  it("pauses for document visibility and cancels pending work on unmount", async () => {
    const animation = installCanvas();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const { unmount } = render(<PixelReveal text="Organizze" />);
    await act(async () => {});
    animation.intersect(true);
    animation.tick(100);
    expect(animation.frames.size).toBe(1);
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(animation.frames.size).toBe(0);
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    expect(animation.frames.size).toBe(1);
    unmount();
    expect(animation.frames.size).toBe(0);
    expect(animation.disconnect).toHaveBeenCalled();
  });
});

describe("shared landing money formatting", () => {
  it.each<PublicLocale>(["pt-PT", "pt-BR"])("matches the previous EUR formatter exactly in %s", (locale) => {
    const previous = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: landingDemo.currency,
      minimumFractionDigits: 2,
    });
    for (const value of [0, -0, 0.01, 12.3, 11222.1, -65432.109, 123456789.99]) {
      expect(formatLandingMoney(value, landingDemo.currency, locale)).toBe(previous.format(value));
    }
  });

  it("reuses the cached formatters in the prelude and signature across renders", () => {
    const numberFormat = vi.spyOn(Intl, "NumberFormat");
    const scenes = (locale: PublicLocale) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <FinancialPrelude demo={landingDemo} locale={locale} />
        <BrandSignature demo={landingDemo} locale={locale} />
      </MemoryRouter>
    );
    const { rerender } = render(scenes("pt-PT"));
    rerender(scenes("pt-BR"));
    fireEvent.click(screen.getByRole("button", { name: "Detalhes do mês" }));
    expect(numberFormat).not.toHaveBeenCalled();
  });
});
