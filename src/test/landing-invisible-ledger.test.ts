import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/landing/useLandingMotion", () => ({ useLandingMotion: vi.fn() }));
import Index from "@/pages/Index";

const renderLanding = () => render(createElement(MemoryRouter, {
  future: { v7_startTransition: true, v7_relativeSplatPath: true },
}, createElement(Index)));

afterEach(() => { localStorage.removeItem("organizze.locale"); vi.restoreAllMocks(); });

describe("Organizze public narrative", () => {
  it("renders all eleven scenes in the approved order", () => {
    const { container } = renderLanding();
    expect(Array.from(container.querySelectorAll("section[data-scene]"), (scene) => scene.getAttribute("data-scene"))).toEqual([
      "prelude", "promise", "month", "whatsapp", "available", "sources",
      "plans", "future", "planning", "trust", "signature",
    ]);
    expect(screen.getByRole("heading", { name: "Organizze", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tudo o que gastas, organizado. O que podes gastar, claro.", level: 2 })).toBeInTheDocument();
    expect(container.querySelector("#metodo")).toBeInTheDocument();
    expect(container.querySelector("#privacidade")).toBeInTheDocument();
  });

  it("preserves every public call to action and section destination", () => {
    const { container } = renderLanding();
    const promise = within(container.querySelector("#promise") as HTMLElement);
    const header = within(container.querySelector("header") as HTMLElement);
    for (const link of screen.getAllByRole("link", { name: "Começar 15 dias grátis" })) {
      expect(link).toHaveAttribute("href", "/auth");
    }
    expect(promise.getByRole("link", { name: "Ver como funciona" })).toHaveAttribute("href", "#month");
    expect(header.getByRole("link", { name: "Como funciona" })).toHaveAttribute("href", "#month");
    expect(header.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", "#whatsapp");
    expect(header.getByRole("link", { name: "Planos" })).toHaveAttribute("href", "#plans");
    expect(header.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/auth");
    for (const link of container.querySelectorAll('a[href^="#"]')) {
      expect(document.getElementById(link.getAttribute("href")!.slice(1))).not.toBeNull();
    }
  });

  it("uses the explicit locale without overwriting the user's preference", () => {
    localStorage.setItem("organizze.locale", "pt-BR");
    const { container } = renderLanding();
    expect(container.querySelector(".landing-page")).toHaveAttribute("lang", "pt-BR");
    expect(screen.getByRole("heading", { name: /Tudo o que você gasta/ })).toBeInTheDocument();
    expect(localStorage.getItem("organizze.locale")).toBe("pt-BR");
  });

  it("remains usable when browser storage is unavailable", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("Storage disabled"); });
    renderLanding();
    expect(screen.getByRole("heading", { name: /Tudo o que/ })).toBeInTheDocument();
  });

  it("does not render chat or dialogue UI", () => {
    const { container } = renderLanding();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    expect(container.querySelector("[data-chat], [data-chat-transcript], .chat-bubble")).toBeNull();
    expect(screen.queryByText("Conversa / agora")).not.toBeInTheDocument();
  });
});
