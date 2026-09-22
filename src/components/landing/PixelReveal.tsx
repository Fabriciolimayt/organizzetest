import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import "./pixel-reveal.css";

export type PixelRevealProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
  id?: string;
};

type Pixel = { x: number; y: number; dx: number; dy: number; delay: number; alpha: number };

export function PixelReveal({ text, className, as: Tag = "span", id }: PixelRevealProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const label = textRef.current;
    const canvas = canvasRef.current;
    const root = label?.parentElement;
    if (!label || !canvas || !root || typeof IntersectionObserver === "undefined") return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    let disposed = false;
    let completed = false;
    let visible = false;
    let ready = false;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let context: CanvasRenderingContext2D | null = null;
    let pixels: Pixel[] = [];
    let width = 0;
    let height = 0;
    let size = 4;
    let color = "#F1F1F1";
    let background = "#030303";

    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    };

    const finish = () => {
      completed = true;
      pause();
      canvas.hidden = true;
      canvas.dataset.pixelState = "complete";
      context?.clearRect(0, 0, width, height);
      pixels = [];
    };

    const draw = (now: number) => {
      frame = 0;
      if (disposed || completed || !visible || document.hidden || !context) return;
      if (previous) elapsed += now - previous;
      previous = now;
      const progress = Math.min(elapsed / 900, 1);
      if (progress === 1) {
        finish();
        return;
      }

      context.clearRect(0, 0, width, height);
      for (const pixel of pixels) {
        const local = Math.max(0, (progress - pixel.delay) / (1 - pixel.delay));
        const remaining = (1 - local) ** 3;
        // Only individual glyph cells are occluded; the readable DOM text never disappears.
        context.globalAlpha = (1 - progress) * 0.85;
        context.fillStyle = background;
        context.fillRect(pixel.x, pixel.y, size, size);
        context.globalAlpha = pixel.alpha * (1 - progress) * 0.9;
        context.fillStyle = color;
        context.fillRect(
          pixel.x + Math.round(pixel.dx * remaining / size) * size,
          pixel.y + Math.round(pixel.dy * remaining / size) * size,
          size - 0.5,
          size - 0.5,
        );
      }
      context.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const prepare = () => {
      const bounds = root.getBoundingClientRect();
      const node = label.firstChild;
      if (!node || bounds.width <= 0 || bounds.height <= 0) return false;
      context = canvas.getContext("2d");
      const mask = document.createElement("canvas");
      const ink = mask.getContext("2d", { willReadFrequently: true });
      if (!context || !ink) return false;

      width = Math.ceil(bounds.width);
      height = Math.ceil(bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      mask.width = width;
      mask.height = height;
      const style = getComputedStyle(label);
      const fontSize = Number.parseFloat(style.fontSize);
      size = Math.max(4, Math.min(12, Math.round(fontSize / 8)));
      color = style.color;
      background = getComputedStyle(root).getPropertyValue("--pixel-reveal-canvas").trim() || background;
      ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ink.fillStyle = "#fff";
      ink.textBaseline = "alphabetic";
      const metrics = ink.measureText("Mg");
      const ascent = metrics.fontBoundingBoxAscent || fontSize * 0.8;
      const descent = metrics.fontBoundingBoxDescent || fontSize * 0.2;
      const range = document.createRange();

      // Range geometry follows the browser's real wrapping, including responsive wordmarks.
      let offset = 0;
      let characterIndex = 0;
      for (const character of text) {
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        const rect = range.getBoundingClientRect();
        if (characterIndex % 5 === 1 || characterIndex % 5 === 2) {
          ink.fillText(character, rect.left - bounds.left, rect.top - bounds.top + (rect.height - ascent - descent) / 2 + ascent);
        }
        characterIndex += 1;
      }
      range.detach();
      const data = ink.getImageData(0, 0, width, height).data;
      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          const alpha = data[(y * width + x) * 4 + 3] / 255;
          if (alpha < 0.15) continue;
          const seed = ((x * 13 + y * 7) % 97) / 97;
          pixels.push({ x, y, alpha, dx: (seed - 0.5) * size * 12, dy: (((x + y * 3) % 71) / 71 - 0.5) * size * 8, delay: seed * 0.28 });
        }
      }
      canvas.hidden = false;
      canvas.dataset.pixelState = "assembling";
      return true;
    };

    const resume = () => {
      if (disposed || completed || !ready || !visible || document.hidden || frame) return;
      if (!context && !prepare()) {
        finish();
        return;
      }
      frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) resume();
      else pause();
    }, { threshold: 0.12 });
    const onVisibility = () => document.hidden ? pause() : resume();
    const onMotion = () => { if (motion.matches) finish(); };
    const onResize = () => { if (context) finish(); };

    observer.observe(root);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    window.addEventListener("resize", onResize, { passive: true });
    void Promise.resolve(document.fonts?.ready).then(() => {
      if (disposed) return;
      ready = true;
      resume();
    });

    return () => {
      disposed = true;
      pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
      window.removeEventListener("resize", onResize);
      canvas.hidden = true;
    };
  }, [text]);

  return (
    <Tag id={id} className={cn("pixel-reveal", className)}>
      <span ref={textRef} className="pixel-reveal__text">{text}</span>
      <canvas ref={canvasRef} data-pixel-canvas data-pixel-state="idle" aria-hidden="true" className="pixel-reveal__canvas" hidden />
    </Tag>
  );
}

export default PixelReveal;
