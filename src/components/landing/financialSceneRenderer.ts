import {
  AmbientLight, BoxGeometry, CanvasTexture, Color, DirectionalLight, EdgesGeometry,
  Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, WebGLRenderer,
  type BufferGeometry, type Material,
} from "three";

export type FinancialSceneModel = {
  money: (value: number) => string;
  title: string;
  demonstration: string;
  historyLabel: string;
  availableLabel: string;
  categoriesLabel: string;
  sequenceLabel: string;
  referenceLabel: string;
  emptyLabel: string;
  available: number;
  variable: number;
  history: number[];
  categories: { label: string; amount: number }[];
  references: { label: string; amount: number; color: string }[];
};

export type FinancialSceneController = { dispose: () => void };
type Options = { host: HTMLElement; model: FinancialSceneModel; onReady: () => void; onError: () => void };
type PanelKind = "history" | "available" | "categories";

const BLUE = "#69D7FF";
const CORAL = "#FF7C6B";
const GOLD = "#F4C56A";
const GREEN = "#66DFA6";
const PALETTE = [CORAL, GOLD, BLUE, GREEN];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function paintPanel(kind: PanelKind, model: FinancialSceneModel, compact: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = kind === "history" ? 1200 : 800;
  canvas.height = kind === "history" ? 800 : kind === "available" ? 340 : 760;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");
  const { width, height } = canvas;
  const pad = kind === "history" ? 56 : 44;
  const body = compact ? 46 : 30;
  ctx.fillStyle = "#090909";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#232323";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  ctx.textBaseline = "middle";

  const text = (label: string, x: number, y: number, size = body, color = "#F1F1F1", maxWidth = width - x - pad, align: CanvasTextAlign = "left") => {
    ctx.save();
    ctx.font = `400 ${size}px "Geist Variable", "Geist", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let clipped = label;
    while (clipped.length > 1 && ctx.measureText(clipped).width > maxWidth) clipped = clipped.slice(0, -2) + "\u2026";
    ctx.fillText(clipped, x, y);
    ctx.restore();
  };
  const glowingLine = (points: [number, number][], color: string, dashed = false) => {
    if (!points.length) return;
    ctx.save();
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = dashed ? 3 : 5;
    if (dashed) ctx.setLineDash([10, 10]);
    ctx.shadowColor = color;
    ctx.shadowBlur = dashed ? 8 : 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  };

  if (kind === "history") {
    text("Organizze / " + model.demonstration, pad, 54, body - 4, "#A0A0A0");
    text(model.title, pad, 112, compact ? 48 : 42);
    const left = pad + 72, right = width - pad, top = 205, bottom = 524;
    const values = [...model.history, ...model.references.map((item) => item.amount), 0];
    const minimum = Math.min(...values), maximum = Math.max(...values, 1);
    const y = (value: number) => bottom - (value - minimum) / (maximum - minimum) * (bottom - top);
    for (let index = 0; index < 4; index++) {
      const value = minimum + (maximum - minimum) * index / 3;
      ctx.strokeStyle = "#232323";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, y(value)); ctx.lineTo(right, y(value)); ctx.stroke();
      text(String(Math.round(value)), left - 20, y(value), compact ? 40 : 26, "#A0A0A0", left - 24, "right");
    }
    model.references.forEach((item) => glowingLine([[left, y(item.amount)], [right, y(item.amount)]], item.color, true));
    const points: [number, number][] = model.history.map((value, index) => [left + (index / Math.max(1, model.history.length - 1)) * (right - left), y(value)]);
    glowingLine(points, BLUE);
    points.forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = "#F1F1F1"; ctx.fill();
    });
    if (!points.length) text(model.emptyLabel, left, (top + bottom) / 2, body, "#A0A0A0");
    text("01", left, bottom + 36, body - 6, "#A0A0A0");
    text(String(model.history.length).padStart(2, "0"), right, bottom + 36, body - 6, "#A0A0A0", 80, "right");
    text(model.sequenceLabel, (left + right) / 2, bottom + 36, body - 6, "#A0A0A0", right - left - 120, "center");
    const legend = [{ label: model.historyLabel, amount: model.history[model.history.length - 1], color: BLUE }, ...model.references];
    legend.forEach((item, index) => {
      const x = pad + (index % 2) * (width - pad * 2) / 2, y = 630 + Math.floor(index / 2) * 86;
      glowingLine([[x, y - 20], [x + 26, y - 20]], item.color);
      text(item.label, x + 42, y - 20, body - 2, "#A0A0A0", 460);
      text(item.amount === undefined ? "\u2014" : model.money(item.amount), x + 42, y + 20, body + 2, "#F1F1F1", 460);
    });
  } else if (kind === "available") {
    text(model.availableLabel, pad, 65, compact ? 40 : 34);
    text(model.money(model.available), pad, 160, compact ? 84 : 88);
    text(model.demonstration, pad, 258, compact ? 32 : 28, "#A0A0A0");
    glowingLine([[pad, height - 34], [width - pad, height - 34]], BLUE);
  } else {
    text(model.categoriesLabel, pad, 64, compact ? 40 : 34);
    text(model.money(model.variable), pad, 134, 64);
    const shown = model.categories.slice(0, 6);
    const maximum = Math.max(1, ...model.categories.map((item) => item.amount));
    shown.forEach((item, index) => {
      const y = 235 + index * 82;
      const color = PALETTE[index % PALETTE.length];
      text(item.label, pad, y, compact ? 36 : 32, "#A0A0A0", 330);
      text(model.money(item.amount), width - pad, y, compact ? 36 : 32, "#F1F1F1", 330, "right");
      ctx.fillStyle = "#232323"; ctx.fillRect(pad, y + 26, width - pad * 2, 12);
      const extent = Math.max(0, item.amount / maximum) * (width - pad * 2);
      if (extent) {
        ctx.fillStyle = color; ctx.fillRect(pad, y + 26, extent, 12);
        glowingLine([[pad, y + 27], [pad + extent, y + 27]], color);
      }
    });
    if (!shown.length) text(model.emptyLabel, pad, 250, body, "#A0A0A0");
    if (model.categories.length > 6) text(`+ ${model.categories.length - 6}`, width - pad, 734, body - 4, "#A0A0A0", 120, "right");
  }
  return canvas;
}

export function createFinancialScene({ host, model, onReady, onError }: Options): FinancialSceneController {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("data-financial-canvas", "");
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(new Color("#030303"), 0);
  const scene = new Scene();
  const assembly = new Group();
  scene.add(assembly);
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  scene.add(new AmbientLight("#F1F1F1", 1.5));
  const light = new DirectionalLight("#F1F1F1", 3);
  light.position.set(-4, 7, 9); scene.add(light);
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<CanvasTexture>();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false, failed = false, visible = false, ready = false;
  let frame = 0, width = 0, height = 0, compact: boolean | undefined, largeText: boolean | undefined;
  let pointerX = 0, pointerY = 0, currentX = 0, currentY = 0;
  let progress = 0.5, currentProgress = 0.5, previousTime = 0, frames = 0;
  let needsResize = true, needsTextures = false;
  let intersection: IntersectionObserver | undefined;
  let resize: ResizeObserver | undefined;

  const clearPanels = () => {
    assembly.clear();
    geometries.forEach((item) => item.dispose()); geometries.clear();
    materials.forEach((item) => item.dispose()); materials.clear();
    textures.forEach((item) => { item.dispose(); item.image.width = 1; item.image.height = 1; }); textures.clear();
  };
  const buildPanel = (kind: PanelKind, w: number, h: number, x: number, y: number, z: number) => {
    const group = new Group();
    group.position.set(x, y, z);
    const geometry = new BoxGeometry(w, h, 0.08);
    const material = new MeshStandardMaterial({ color: "#090909", roughness: 0.38, metalness: 0.65 });
    geometries.add(geometry); materials.add(material);
    group.add(new Mesh(geometry, material));
    const edgeGeometry = new EdgesGeometry(geometry);
    const edgeMaterial = new LineBasicMaterial({ color: "#232323", transparent: true, opacity: 0.8 });
    geometries.add(edgeGeometry); materials.add(edgeMaterial);
    group.add(new LineSegments(edgeGeometry, edgeMaterial));
    const texture = new CanvasTexture(paintPanel(kind, model, width < 900));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures.add(texture);
    const faceGeometry = new PlaneGeometry(w - 0.015, h - 0.015);
    const faceMaterial = new MeshBasicMaterial({ map: texture, toneMapped: false });
    geometries.add(faceGeometry); materials.add(faceMaterial);
    const face = new Mesh(faceGeometry, faceMaterial);
    face.position.z = 0.042; group.add(face);
    assembly.add(group);
  };
  const buildPanels = () => {
    clearPanels();
    if (compact) {
      buildPanel("history", 7.6, 5.07, 0, 4.5, 0);
      buildPanel("available", 7.6, 3.23, 0, 0.05, 0.05);
      buildPanel("categories", 7.6, 7.22, 0, -5.57, 0);
    } else {
      buildPanel("history", 8.7, 5.8, -2.45, 0.9, 0);
      buildPanel("available", 4.65, 1.98, 4.55, 2.22, 0.12);
      buildPanel("categories", 4.65, 4.42, 4.55, -1.34, 0.22);
    }
  };
  const active = () => !disposed && !failed && visible && !document.hidden;
  const schedule = () => {
    if (active() && !frame) frame = requestAnimationFrame(draw);
  };
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; previousTime = 0; };
  const updateProgress = () => {
    const rect = host.getBoundingClientRect();
    progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
  };

  function draw(time: number) {
    frame = 0;
    if (!active()) return;
    try {
      if (needsResize) {
        const bounds = host.getBoundingClientRect();
        width = bounds.width; height = bounds.height;
        if (!width || !height) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (compact !== (width < 600) || largeText !== (width < 900)) {
          compact = width < 600; largeText = width < 900; needsTextures = true;
        }
        needsResize = false;
        updateProgress();
      }
      if (needsTextures) { buildPanels(); needsTextures = false; }
      // Damped input settles completely; there is no clock-driven decorative loop.
      const blend = 1 - Math.exp(-Math.min(previousTime ? time - previousTime : 1000, 64) / 90);
      previousTime = time;
      if (motion.matches) { currentX = 0; currentY = 0; currentProgress = 0.5; }
      else {
        currentX += (pointerX - currentX) * blend;
        currentY += (pointerY - currentY) * blend;
        currentProgress += (progress - currentProgress) * blend;
      }
      const scroll = currentProgress - 0.5;
      assembly.rotation.set(compact ? -0.12 : -0.62 + scroll * 0.12, compact ? -0.04 : -0.12, compact ? 0.025 : 0.31);
      assembly.position.set(0, compact ? 0.25 : scroll * 0.75, 0);
      const viewHeight = compact ? Math.max(17.7, 8.65 / camera.aspect) : Math.max(9.5, 17.8 / camera.aspect);
      const distance = viewHeight / (2 * Math.tan(camera.fov * Math.PI / 360));
      camera.position.set(currentX * (compact ? 0 : 0.28), currentY * (compact ? 0 : 0.18), distance);
      camera.lookAt(0, compact ? -scroll * 0.35 : 0, 0);
      renderer.render(scene, camera);
      canvas.dataset.financialFrame = String(++frames);
      if (!ready) { ready = true; onReady(); }
      if (!motion.matches && (Math.abs(pointerX - currentX) + Math.abs(pointerY - currentY) + Math.abs(progress - currentProgress) > 0.001)) schedule();
    } catch {
      failed = true; stop(); onError();
    }
  }

  const onScroll = () => { if (active() && !motion.matches) { updateProgress(); schedule(); } };
  const onPointer = (event: PointerEvent) => {
    if (!active() || motion.matches || compact || event.pointerType === "touch") return;
    const bounds = host.getBoundingClientRect();
    pointerX = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
    pointerY = clamp(-((event.clientY - bounds.top) / bounds.height * 2 - 1), -1, 1);
    schedule();
  };
  const onLeave = () => { pointerX = 0; pointerY = 0; if (!motion.matches) schedule(); };
  const onVisibility = () => { if (document.hidden) stop(); else { updateProgress(); schedule(); } };
  const onResize = () => { needsResize = true; schedule(); };
  const onMotion = () => { pointerX = 0; pointerY = 0; updateProgress(); schedule(); };
  const onContextLost = (event: Event) => { event.preventDefault(); failed = true; stop(); onError(); };
  const onContextRestored = () => { failed = false; ready = false; needsTextures = true; needsResize = true; schedule(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true; stop();
    intersection?.disconnect(); resize?.disconnect();
    host.removeEventListener("pointermove", onPointer); host.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility); motion.removeEventListener("change", onMotion);
    canvas.removeEventListener("webglcontextlost", onContextLost); canvas.removeEventListener("webglcontextrestored", onContextRestored);
    clearPanels(); scene.clear(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
  };

  try {
    host.append(canvas);
    host.addEventListener("pointermove", onPointer, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    if (typeof ResizeObserver !== "undefined") { resize = new ResizeObserver(onResize); resize.observe(host); }
    if (typeof IntersectionObserver !== "undefined") {
      intersection = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) { updateProgress(); schedule(); } else stop();
      });
      intersection.observe(host);
    } else { visible = true; schedule(); }
    void document.fonts?.ready.then(() => { if (!disposed) { needsTextures = true; schedule(); } });
  } catch (error) {
    dispose(); throw error;
  }
  return { dispose };
}
