import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TourStep } from "@/components/dashboard/TourOverlay";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GlobalTourStep extends TourStep {
  /** Route to navigate to before showing this step. */
  route?: string;
}

interface TourCtx {
  start: () => void;
  close: () => void;
  open: boolean;
}

const Ctx = createContext<TourCtx>({ start: () => {}, close: () => {}, open: false });
export const useTour = () => useContext(Ctx);

const COMPLETED_KEY = "organizze.tourCompleted";
const FIRSTRUN_KEY = "organizze.firstRun";
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export const GLOBAL_TOUR_STEPS: GlobalTourStep[] = [
  { title: "Bem-vindo ao Organizze", body: "Vou mostrar-te tudo num minuto. Podes saltar a qualquer momento.", route: "/dashboard" },
  { title: "Rendimento", body: "Define aqui quanto recebes. É a base do orçamento.", target: '[data-tour="salario"]', route: "/dashboard" },
  { title: "Categorias", body: "Distribui o teu dinheiro em percentagens.", target: '[data-tour="orcamento"]', route: "/dashboard" },
  { title: "Despesas", body: "Adiciona despesas fixas e vê-as atualizar em tempo real.", target: '[data-tour="despesas"]', route: "/dashboard" },
  { title: "Planos", body: "Tens vários cenários? Alterna num clique.", target: '[data-tour="planos"]', route: "/dashboard" },
  { title: "Lançamentos", body: "Aqui registas e consultas cada movimento.", route: "/dashboard/lancamentos" },
  { title: "Relatórios", body: "Vê para onde o teu dinheiro vai com gráficos claros.", route: "/dashboard/relatorios" },
  { title: "Orçamento", body: "Define e ajusta as percentagens por categoria.", route: "/dashboard/orcamento" },
  { title: "Limite de gastos", body: "Define limites e recebe alertas antes de gastares a mais.", route: "/dashboard/limite-de-gastos" },
  { title: "Grupos", body: "Partilha o orçamento com a família ou parceiro.", route: "/dashboard/grupos" },
  { title: "WhatsApp", body: "Liga o WhatsApp e regista despesas só com uma foto.", route: "/dashboard/whatsapp" },
  { title: "Ajuda sempre à mão", body: "Carrega no botão de ajuda para repetir este tour quando quiseres.", route: "/dashboard" },
];

export const TourProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Skip / close WITHOUT marking completed — the tour re-arms on next login.
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Only a full walkthrough (last step reached) marks the tour as completed.
  const complete = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(COMPLETED_KEY, "1");
      localStorage.removeItem(FIRSTRUN_KEY);
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }, []);

  const start = useCallback(() => {
    const first = GLOBAL_TOUR_STEPS[0];
    if (first.route && location.pathname !== first.route) navigate(first.route);
    setOpen(true);
  }, [navigate, location.pathname]);

  // Auto-start for new users whenever they land inside the app until they finish it.
  useEffect(() => {
    if (!location.pathname.startsWith("/dashboard")) return;
    try {
      const firstRun = localStorage.getItem(FIRSTRUN_KEY);
      const done = localStorage.getItem(COMPLETED_KEY);
      if (firstRun === "1" && !done) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      // The tour simply stays inactive when browser storage is unavailable.
    }
  }, [location.pathname]);

  // Listen to legacy event
  useEffect(() => {
    const h = () => start();
    window.addEventListener("organizze:start-tour", h);
    return () => window.removeEventListener("organizze:start-tour", h);
  }, [start]);

  const value = useMemo(() => ({ start, close, open }), [start, close, open]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {open && <TourRunner onClose={close} onComplete={complete} />}
    </Ctx.Provider>
  );
};

/**
 * Owns the current step index, navigates between routes, waits for the target
 * element to appear before passing the step to the overlay.
 */
const TourRunner = ({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [index, setIndex] = useState(0);
  const [readyStep, setReadyStep] = useState<GlobalTourStep | null>(null);

  useEffect(() => {
    const step = GLOBAL_TOUR_STEPS[index];
    if (!step) return;
    let cancelled = false;

    const ensureRoute = async () => {
      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
        await new Promise((r) => setTimeout(r, 350));
      }
      if (cancelled) return;
      if (!step.target) {
        setReadyStep(step);
        return;
      }
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        if (document.querySelector(step.target)) break;
        await new Promise((r) => setTimeout(r, 80));
      }
      if (!cancelled) setReadyStep({ ...step });
    };
    ensureRoute();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!readyStep) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
        <div className="rounded-md border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-menu" role="status">
          A preparar o tour…
        </div>
      </div>
    );
  }

  return (
    <SingleStepOverlay
      step={readyStep}
      index={index}
      total={GLOBAL_TOUR_STEPS.length}
      onPrev={() => setIndex((i) => Math.max(0, i - 1))}
      onNext={() => {
        if (index >= GLOBAL_TOUR_STEPS.length - 1) onComplete();
        else { setReadyStep(null); setIndex((i) => i + 1); }
      }}
      onClose={onClose}
    />
  );
};

// Lightweight inline overlay (kept similar to TourOverlay) so we can drive prev/next from provider
const SingleStepOverlay = ({
  step, index, total, onPrev, onNext, onClose,
}: {
  step: GlobalTourStep; index: number; total: number;
  onPrev: () => void; onNext: () => void; onClose: () => void;
}) => {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const padding = 8;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => element.getAttribute("aria-hidden") !== "true" && !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!step.target) { setRect(null); return; }
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - padding, left: r.left - padding, width: r.width + padding * 2, height: r.height + padding * 2 });
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  const POPOVER_W = 320, POPOVER_H = 220;
  let popStyle: React.CSSProperties;
  if (rect) {
    const vh = window.innerHeight, vw = window.innerWidth;
    const spaceBelow = vh - (rect.top + rect.height);
    const placeBelow = spaceBelow > POPOVER_H + 24;
    const top = placeBelow ? rect.top + rect.height + 12 : Math.max(16, rect.top - POPOVER_H - 12);
    let left = rect.left + rect.width / 2 - POPOVER_W / 2;
    left = Math.max(12, Math.min(left, vw - POPOVER_W - 12));
    popStyle = { top, left, width: POPOVER_W };
  } else {
    popStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: Math.min(POPOVER_W, window.innerWidth - 32) };
  }

  const isFirst = index === 0, isLast = index === total - 1;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
    >
      {rect ? (
        <>
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
          <div aria-hidden="true" className="pointer-events-none fixed rounded-md ring-2 ring-intelligence"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: "0 0 0 2px hsl(var(--background)) inset" }} />
        </>
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/70" />
      )}

      <div className="fixed rounded-md border border-border bg-card p-5 shadow-menu animate-in fade-in duration-200" style={popStyle}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="financial-value text-label font-semibold text-intelligence">Etapa {index + 1} de {total}</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="focus-ring interactive-control flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar tour"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
        <h3 id={titleId} className="text-base font-semibold text-foreground">{step.title}</h3>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        <div
          aria-label={`Progresso do tour: etapa ${index + 1} de ${total}`}
          className="my-5 flex items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} aria-hidden="true" className={`h-0.5 flex-1 ${i <= index ? "bg-intelligence" : "bg-muted"}`} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onPrev} disabled={isFirst}
            className="focus-ring interactive-control flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30">
            <ChevronLeft aria-hidden="true" size={14} /> Anterior
          </button>
          <Button size="sm" onClick={onNext} className="gap-1.5 px-4">
            {isLast ? <>Concluir</> : isFirst ? <>Começar <ChevronRight aria-hidden="true" size={14} /></> : <>Seguinte <ChevronRight aria-hidden="true" size={14} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
};
