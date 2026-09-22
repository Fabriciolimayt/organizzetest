import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const normalizeMarkdownWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const sceneIds = [
  "prelude",
  "promise",
  "month",
  "whatsapp",
  "available",
  "sources",
  "plans",
  "future",
  "planning",
  "trust",
  "signature",
] as const;

const requiredHeadings = [
  "Editorial Product Edition (2026-09-21)",
  "Auth Paper Edition (2026-09-20)",
  "Brand Mark",
  "Color And Meaning",
  "Typography",
  "Public Scene Contract",
  "Product Shell Contract",
  "Motion",
  "Responsive And Accessibility",
  "Functional Preservation",
  "Landing Approval Gate",
] as const;

const declaredRoutes = [
  "/__design-system",
  "/",
  "/.lovable/oauth/consent",
  "/auth",
  "/signup",
  "/convite",
  "/onboarding/nome",
  "/onboarding/idioma",
  "/onboarding/moeda",
  "/onboarding/whatsapp",
  "/onboarding/whatsapp/verificar",
  "/dashboard",
  "/dashboard/lancamentos",
  "/dashboard/relatorios",
  "/dashboard/limite-de-gastos",
  "/dashboard/orcamento",
  "/dashboard/planos",
  "/dashboard/objetivos",
  "/dashboard/grupos",
  "/dashboard/whatsapp",
  "/dashboard/diagnostico-whatsapp",
  "/dashboard/assinatura",
  "*",
] as const;

const declaredRawRoutePaths = [
  "/__design-system",
  "/",
  "/.lovable/oauth/consent",
  "/auth",
  "/signup",
  "/convite",
  "/onboarding/nome",
  "/onboarding/idioma",
  "/onboarding/moeda",
  "/onboarding/whatsapp",
  "/onboarding/whatsapp/verificar",
  "/dashboard",
  "lancamentos",
  "relatorios",
  "limite-de-gastos",
  "orcamento",
  "planos",
  "objetivos",
  "grupos",
  "whatsapp",
  "diagnostico-whatsapp",
  "assinatura",
  "*",
] as const;

const section = (document: string, heading: string, nextHeading?: string) => {
  const start = document.indexOf(`## ${heading}`);
  const end = nextHeading ? document.indexOf(`## ${nextHeading}`, start) : document.length;
  return document.slice(start, end);
};

const sourceFilesUnder = (directory: string): string[] =>
  readdirSync(resolve(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesUnder(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });

describe("Organizze Basedash fidelity contract", () => {
  it("locks the exact design title, headings, and ordered public scenes", () => {
    const design = read("DESIGN.md");
    const headings = [...design.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    const publicScenes = section(design, "Public Scene Contract", "Product Shell Contract");
    const sceneRows = [...publicScenes.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]);

    expect(design.split("\n", 1)[0]).toBe("# Organizze Design System - Intelligence In Silence");
    expect(headings).toEqual(requiredHeadings);
    expect(sceneRows).toEqual(sceneIds);
  });

  it("locks every declared route and its exceptional routing behavior", () => {
    const design = read("DESIGN.md");
    const app = read("src/App.tsx");
    const preservation = section(design, "Functional Preservation", "Landing Approval Gate");
    const routeBlock = preservation.slice(
      preservation.indexOf("Every declared route"),
      preservation.indexOf("Also preserve"),
    );
    const documentedRoutes = [...routeBlock.matchAll(/^- `([^`]+)`/gm)].map((match) => match[1]);
    const rawAppRoutes = [...app.matchAll(/\bpath="([^"]+)"/g)].map((match) => match[1]);
    const absoluteAppRoutes = rawAppRoutes.map((path) =>
      path.startsWith("/") || path === "*" ? path : `/dashboard/${path}`,
    );

    expect(rawAppRoutes).toEqual(declaredRawRoutePaths);
    expect(absoluteAppRoutes).toEqual(declaredRoutes);
    expect(documentedRoutes).toEqual(declaredRoutes);
    expect(app).toMatch(/import\.meta\.env\.DEV[\s\S]*?path="\/__design-system"/);
    expect(app).toContain('<Route path="/signup" element={<Auth key="signup" initialMode="signup" />} />');
    expect(app).toContain('<Route path="/convite" element={<AcceptInvitation />} />');
    expect(app).toContain('<Route path="*" element={<NotFound />} />');
    expect(routeBlock).toContain(
      "`/__design-system` - development-only primitive showcase; it is registered only when `import.meta.env.DEV` is true and is absent from production routing.",
    );
    expect(routeBlock).toContain(
      "`/signup` - redirect alias that replaces browser history and resolves to `/auth`.",
    );
    expect(routeBlock).toContain(
      "`*` - catch-all fallback that renders the 404 `NotFound` page for every unmatched path.",
    );
  });

  it("locks demonstration-data separation and the landing checkpoint order", () => {
    const design = read("DESIGN.md");
    const publicScenes = section(design, "Public Scene Contract", "Product Shell Contract");
    const approvalGate = section(design, "Landing Approval Gate");
    const checkpoints = [...approvalGate.matchAll(/^\d+\. ([^:]+):/gm)].map((match) => match[1]);

    expect(publicScenes).toContain("Public demonstration values live in static presentation fixtures");
    expect(publicScenes).toContain("separate from hooks that read customer data");
    expect(publicScenes).toContain("Protected pages never fall back to demo data");
    expect(checkpoints).toEqual([
      "Reference contract and brand foundation",
      "Landing",
      "Entry and onboarding",
      "Shell and dashboard",
      "Financial pages",
      "Commercial and automation pages",
      "Final gate",
    ]);
    expect(approvalGate).toContain(
      "present the local landing for explicit user approval before changing entry or protected screens",
    );
    expect(approvalGate).toContain("Landing approval is scene-based rather than literal pixel equality");
    for (const criterion of [
      "relative headline, product-surface, and negative-space scale",
      "product-first hierarchy",
      "alignment and border geometry",
      "layer depth and controlled lighting",
      "scroll timing and reveal order",
      "CTA placement and prominence",
      "mobile preservation of the same narrative job",
    ]) {
      expect(approvalGate).toContain(criterion);
    }
    expect(approvalGate).toContain(
      "Approval fails if the result merely combines a black background with generic dashboard cards",
    );
    for (const definingRhythm of [
      "product prelude",
      "centered editorial promise",
      "large inspectable stages",
      "long quiet intervals",
      "precise motion",
      "monumental closing brand moment",
    ]) {
      expect(approvalGate).toContain(definingRhythm);
    }
  });

  it("locks all reference-map rows, decoded frame evidence, and required note topics", () => {
    const referenceMap = read("docs/design/basedash-reference-map.md");
    const rows = referenceMap
      .split("\n")
      .filter((line) => line.startsWith("| `"))
      .map((line) => {
        const [scene, reference, job, geometry, revealOrder, mobileAdaptation] = line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
        return { scene, reference, job, geometry, revealOrder, mobileAdaptation };
      });
    const notes = referenceMap
      .split(/\n\s*\n/)
      .filter((paragraph) => paragraph.startsWith("**"))
      .map((paragraph) => {
        const match = paragraph.match(/^\*\*([^*]+)\.\*\*\s+([\s\S]+)$/);
        expect(match).not.toBeNull();
        return {
          heading: match![1],
          body: normalizeMarkdownWhitespace(match![2]),
        };
      });

    expect(rows).toEqual([
      {
        scene: "`prelude`",
        reference: "`00:04.250`, frame `01-004.250s.png`",
        job: "establish product quality",
        geometry: "layered dashboard above fold, partially occluded by centered type",
        revealOrder: "shell, values, charts",
        mobileAdaptation: "stacked crop, no pin",
      },
      {
        scene: "`promise`",
        reference: "`00:00.000`, frame `00-000.000s.png`",
        job: "explain consolidation and available amount",
        geometry: "centered statement with a narrow measure and quiet black space",
        revealOrder: "eyebrow, headline, copy, CTA",
        mobileAdaptation: "same order, shorter gap",
      },
      {
        scene: "`month`",
        reference: "`00:29.800`, frame `07-029.800s.png`",
        job: "make one complete month inspectable",
        geometry: "one wide product surface owns the stage, with dense internal bands",
        revealOrder: "frame, tabs, primary values, charts, detail rows",
        mobileAdaptation: "stack summaries before detail; never shrink to a thumbnail",
      },
      {
        scene: "`sources`",
        reference: "`00:12.767`, frame `03-012.767s.png`",
        job: "consolidate every expense source",
        geometry: "source marks sit in a horizontal field above a single convergence point",
        revealOrder: "source labels, connectors, ledger, total",
        mobileAdaptation: "vertical source flow into one owned ledger; no logo cloud",
      },
      {
        scene: "`whatsapp`",
        reference: "`00:59.617`, frame `14-059.617s.png`",
        job: "turn a message or receipt into a financial decision",
        geometry: "centered interpretation surface with subordinate context at the edges",
        revealOrder: "input, interpretation, category, transaction, available amount",
        mobileAdaptation: "one-column pipeline with no fake chat shell or bubbles",
      },
      {
        scene: "`available`",
        reference: "`00:38.317`, frame `09-038.317s.png`",
        job: "answer what remains available",
        geometry: "dominant value region supported by a wide dashboard and compact evidence",
        revealOrder: "available amount, calculation inputs, trend, explanation",
        mobileAdaptation: "lead with the amount, then stack calculation evidence",
      },
      {
        scene: "`future`",
        reference: "`00:46.833`, frame `11-046.833s.png`",
        job: "surface commitments and limits early",
        geometry: "wide product stage with adjacent status columns and time-based rows",
        revealOrder: "commitments, limits, warning state, next action",
        mobileAdaptation: "stack rows before limit tracks and reduce simultaneous reveals",
      },
      {
        scene: "`planning`",
        reference: "`01:16.650`, frame `18-076.650s.png`",
        job: "connect budgets, goals, scenarios, and spaces",
        geometry: "one bright focal panel sits within a field of related product surfaces",
        revealOrder: "focal plan, related surfaces, progressive detail",
        mobileAdaptation: "preserve the focal-first order in a single column",
      },
      {
        scene: "`trust`",
        reference: "`01:33.683`, frame `22-093.683s.png`",
        job: "explain privacy boundaries and system quality",
        geometry: "a central system symbol anchors distributed evidence without card repetition",
        revealOrder: "ownership, storage boundary, spaces, concise evidence",
        mobileAdaptation: "one-column evidence sequence with the symbol kept secondary to copy",
      },
      {
        scene: "`plans`",
        reference: "`01:42.200`, frame `24-102.200s.png`",
        job: "compare current plans without hiding the alternative",
        geometry: "commercial statement bridges into a restrained, inspectable product stage",
        revealOrder: "plan names, prices, eligibility, CTA",
        mobileAdaptation: "stacked comparison with both plans visible before CTA",
      },
      {
        scene: "`signature`",
        reference: "`02:07.733`, frame `30-127.733s.png`",
        job: "close on the future month and Organizze brand",
        geometry: "shallow-perspective chart enters above a near-viewport-width closing wordmark",
        revealOrder: "graph, headline, CTA, wordmark",
        mobileAdaptation: "shallower depth, no pin, wordmark fitted without horizontal overflow",
      },
    ].sort((a, b) => sceneIds.findIndex(id => a.scene === `\`${id}\``) - sceneIds.findIndex(id => b.scene === `\`${id}\``)));
    expect(rows.map(({ scene }) => scene.slice(1, -1))).toEqual(sceneIds);
    expect(notes).toEqual([
      {
        heading: "Typography scale",
        body: "The reference uses small utility navigation and eyebrow text against large centered editorial statements, then returns to compact product labels inside inspectable stages. Organizze keeps interface labels at 12 px or larger, public body copy at 15 px or larger, and dense product copy at 14 px or larger. Display text uses controlled line breaks and balanced width rather than viewport-width scaling.",
      },
      {
        heading: "Hairlines",
        body: "Reference surfaces are structured by low-contrast 1 px rules, not heavy outlines or floating-card shadows. Organizze uses `#24272C` hairlines predominantly at 1 px, with 4-8 px panel radii.",
      },
      {
        heading: "Product-surface depth",
        body: "Depth is created by occlusion, scale, perspective, panel contrast, controlled shadow, opacity, filter, and subtle raster texture. Light belongs to real interfaces and data states; decorative gradient blobs, bokeh, glassmorphism, and generic glow are excluded.",
      },
      {
        heading: "Section spacing",
        body: "The reference alternates dense, large-format product stages with long quiet intervals. Public content stays near a 1180-1240 px maximum while stages may extend beyond that column without causing document overflow. Every first viewport must leave a visible hint of the following scene.",
      },
      {
        heading: "Closing-brand scale",
        body: "The reference wordmark becomes the final monumental object and approaches the available content width beneath the perspective chart. Organizze follows that hierarchy without copying the Basedash mark: the original wordmark is the final large-format graphic, remains fully legible at 375 px, and never creates horizontal overflow.",
      },
    ]);
  });

  it("keeps business and data work outside every landing presentation source", () => {
    const design = read("DESIGN.md");
    const preservation = section(design, "Functional Preservation", "Landing Approval Gate");
    const sourcePaths = ["src/pages/Index.tsx", ...sourceFilesUnder("src/components/landing")];
    const forbiddenPatterns = [
      /from\s+["']@\/hooks\//i,
      /from\s+["']@\/(?:integrations|services)\//i,
      /from\s+["'](?:@supabase\/|@stripe\/|@tanstack\/react-query|axios)/i,
      /\b(?:supabase|stripe)\s*\./i,
      /\b(?:fetch|invoke)\s*\(/i,
      /\buse(?:Query|Mutation|Transactions|Auth|Subscription)\s*\(/i,
    ];

    for (const path of sourcePaths) {
      const source = read(path);
      const displayPath = relative(process.cwd(), resolve(process.cwd(), path));
      for (const pattern of forbiddenPatterns) {
        expect(source, `${displayPath} crosses the landing presentation boundary with ${pattern}`).not.toMatch(pattern);
      }
    }

    expect(preservation).toContain("Existing hooks and handlers remain the source of truth");
    expect(preservation).toContain("Presentation components receive values and callbacks through props");
    expect(preservation).toContain(
      "Animation modules cannot perform financial, authorization, payment, or messaging work",
    );
  });
});
