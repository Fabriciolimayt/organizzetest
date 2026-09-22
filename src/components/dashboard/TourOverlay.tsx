import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  title: string;
  body: string;
  /** CSS selector to highlight. If omitted, the popover is centered. */
  target?: string;
}

interface Props {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const POPOVER_W = 320;
const POPOVER_H = 200;
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const TourOverlay = ({ steps, open, onClose }: Props) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const step = steps[index];

  // Reset to first step whenever opened
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
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
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  // Measure target and recompute on resize/scroll
  useLayoutEffect(() => {
    if (!open || !step) return;
    const measure = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      // Wait a frame so scrollIntoView finishes before measuring
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({
          top: r.top - PADDING,
          left: r.left - PADDING,
          width: r.width + PADDING * 2,
          height: r.height + PADDING * 2,
        });
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step]);

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;
  const isFirst = index === 0;

  // Popover position
  let popStyle: React.CSSProperties;
  if (rect) {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - (rect.top + rect.height);
    const placeBelow = spaceBelow > POPOVER_H + 24;
    const top = placeBelow ? rect.top + rect.height + 12 : Math.max(16, rect.top - POPOVER_H - 12);
    let left = rect.left + rect.width / 2 - POPOVER_W / 2;
    left = Math.max(12, Math.min(left, vw - POPOVER_W - 12));
    popStyle = { top, left, width: POPOVER_W };
  } else {
    popStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: Math.min(POPOVER_W, window.innerWidth - 32),
    };
  }

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
      {/* Dim layer with cutout */}
      {rect ? (
        <>
          {/* Four mask rects around the target */}
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
          <div aria-hidden="true" className="fixed bg-black/70" style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
          {/* Highlight ring */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed rounded-md ring-2 ring-intelligence"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: "0 0 0 2px hsl(var(--background)) inset",
            }}
          />
        </>
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/70" onClick={onClose} />
      )}

      {/* Popover */}
      <div
        className="fixed rounded-md border border-border bg-card p-5 shadow-menu animate-in fade-in duration-200"
        style={popStyle}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="financial-value text-label font-semibold text-intelligence">
            Etapa {index + 1} de {steps.length}
          </span>
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

        <h3 id={titleId} className="text-base font-semibold text-foreground">
          {step.title}
        </h3>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>

        <div
          aria-label={`Progresso do tour: etapa ${index + 1} de ${steps.length}`}
          className="my-5 flex items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={index + 1}
        >
          {steps.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-0.5 flex-1 ${i <= index ? "bg-intelligence" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="focus-ring interactive-control flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft aria-hidden="true" size={14} /> Anterior
          </button>
          <Button
            size="sm"
            onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
            className="gap-1.5 px-4"
          >
            {isLast ? (
              <>Concluir</>
            ) : isFirst ? (
              <>Vamos lá <ChevronRight aria-hidden="true" size={14} /></>
            ) : (
              <>Seguinte <ChevronRight aria-hidden="true" size={14} /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
