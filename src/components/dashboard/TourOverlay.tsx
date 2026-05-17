import { useEffect, useLayoutEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  title: string;
  body: string;
  emoji?: string;
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

const TourOverlay = ({ steps, open, onClose }: Props) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

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
      el.scrollIntoView({ block: "center", behavior: "smooth" });
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
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Dim layer with cutout */}
      {rect ? (
        <>
          {/* Four mask rects around the target */}
          <div className="fixed bg-black/60" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
          <div className="fixed bg-black/60" style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
          <div className="fixed bg-black/60" style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
          <div className="fixed bg-black/60" style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
          {/* Highlight ring */}
          <div
            className="fixed rounded-xl ring-4 ring-primary pointer-events-none transition-all"
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
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      )}

      {/* Popover */}
      <div
        className="fixed bg-card rounded-xl shadow-2xl border border-border p-5 animate-in fade-in zoom-in-95"
        style={popStyle}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary">
            {index + 1} / {steps.length}
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar tour"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
          {step.emoji && <span>{step.emoji}</span>}
          {step.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {step.body}
        </p>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <Button
            size="sm"
            onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
            className="gap-1.5 rounded-full px-4"
          >
            {isLast ? (
              <>Feito! 🎉</>
            ) : isFirst ? (
              <>Vamos lá <ChevronRight size={14} /></>
            ) : (
              <>Seguinte <ChevronRight size={14} /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
