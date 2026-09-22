import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "/Users/fabriciolima/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { NOW, USER_ID, DATA_TABLES, syntheticSession, readFixture } from "./product-editorial-fixtures.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = new URL(process.env.QA_URL || "http://127.0.0.1:56788");
assert(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname), "QA_URL must use loopback");
assert(["http:", "https:"].includes(base.protocol) && !base.username && !base.password, "Invalid QA_URL");
const mode = process.argv.includes("--baseline") ? "baseline" : "validation";
const only = process.env.QA_ONLY || "";
const selections = only.split(",").map((value) => value.trim()).filter(Boolean);
const runName = process.env.QA_RUN || mode;
assert(/^[a-z0-9_-]+$/i.test(runName), "QA_RUN must be a plain directory name");
const directory = path.join(root, "artifacts/product-editorial", runName);
await mkdir(directory, { recursive: true });
const startedAt = new Date().toISOString();
const widths = [320, 375, 768, 1440, 1920];
const dashboardRoutes = ["", "lancamentos", "relatorios", "limite-de-gastos", "orcamento", "planos", "objetivos", "grupos", "whatsapp", "diagnostico-whatsapp", "assinatura"].map((name) => `/dashboard${name ? `/${name}` : ""}`);
const onboardingRoutes = ["nome", "idioma", "moeda"].map((name) => `/onboarding/${name}`);
const headings = {
  "/dashboard": "Setembro de 2026", "/dashboard/lancamentos": "Lançamentos & Extrato",
  "/dashboard/relatorios": "Relatórios & Análise", "/dashboard/limite-de-gastos": "Limites de gastos",
  "/dashboard/orcamento": "Orçamento", "/dashboard/planos": "Planos de orçamento",
  "/dashboard/objetivos": "Objetivos financeiros", "/dashboard/grupos": "Espaços partilhados",
  "/dashboard/whatsapp": "Automação WhatsApp", "/dashboard/diagnostico-whatsapp": "Diagnóstico WhatsApp",
  "/dashboard/assinatura": "Assinatura e planos", "/onboarding/nome": "Como te devemos chamar?",
  "/onboarding/idioma": "Em que língua continuamos?", "/onboarding/moeda": "Como apresentamos os valores?",
  "/auth": "Continua de onde paraste.",
  "/__design-system": "Primitivos Invisible Ledger",
};
const results = [];
const network = [];
let browser;
let timedOut = false;
let currentCase = "setup";
const safeError = (error) => String(error?.message || error).replace(/https?:\/\/\S+/g, "[URL omitted]").replace(/eyJ[A-Za-z0-9_.-]+/g, "[token omitted]").slice(0, 600);
const record = (name, passed, detail = {}) => results.push({ case: currentCase, name, status: passed ? "pass" : "fail", ...detail });
const check = async (name, callback) => {
  try { const detail = await callback(); record(name, true, detail || {}); }
  catch (error) { record(name, false, { error: safeError(error) }); }
};
const slug = (route) => route.replace(/^\//, "").replaceAll("/", "-");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Inspect only the locally served public browser module; no .env or saved browser state.
async function storageKey() {
  if (process.env.QA_PROJECT_REF) {
    assert(/^[a-z0-9-]+$/.test(process.env.QA_PROJECT_REF), "Invalid QA_PROJECT_REF");
    return `sb-${process.env.QA_PROJECT_REF}-auth-token`;
  }
  const response = await fetch(new URL("/src/integrations/supabase/client.ts", base), { redirect: "error", signal: AbortSignal.timeout(8000) });
  assert(response.ok, "Local public client module unavailable; provide QA_PROJECT_REF (public project reference, not a key)");
  const source = await response.text();
  const refs = [...new Set([...source.matchAll(/https:\/\/([a-z0-9-]+)\.supabase\.co/g)].map((match) => match[1]))];
  assert.equal(refs.length, 1, "Cannot determine public project reference; provide QA_PROJECT_REF");
  return `sb-${refs[0]}-auth-token`;
}

async function isolatedPage(width, { authenticated = true, state = "populated" } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 900 ? 844 : 960 }, deviceScaleFactor: 1, locale: "pt-PT", timezoneId: "Europe/Lisbon", colorScheme: "light", reducedMotion: "reduce", serviceWorkers: "block", acceptDownloads: false });
  const localNetwork = [];
  const errors = [];
  const control = { state, auth: "deny", releases: [], closing: false };
  const log = (request, outcome, reason) => {
    const url = new URL(request.url());
    const target = url.hostname.endsWith(".supabase.co") ? "supabase" : url.origin === base.origin ? "local" : "external";
    const entry = { case: currentCase, method: request.method(), target, path: target === "external" ? "[external resource]" : /^\/(rest|auth|functions)\/v1\/[a-z_-]+$/.test(url.pathname) ? url.pathname : "[unrecognized path]", queryKeys: target === "external" ? [] : [...new Set(url.searchParams.keys())].filter((key) => /^[a-z_.]+$/i.test(key)), outcome, ...(reason ? { reason } : {}) };
    localNetwork.push(entry); network.push(entry);
  };
  const block = async (route, outcome, reason) => {
    log(route.request(), outcome, reason);
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: reason || "Blocked by isolated QA harness", code: "QA_BLOCKED" }) });
  };
  // Context guard also covers popup first requests; the page-level handler supplies mocks.
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === base.origin && ["GET", "HEAD"].includes(request.method())) return route.continue();
    return block(route, "blocked-context-guard");
  });
  await context.routeWebSocket(/.*/, (socket) => { socket.close(); });
  await context.addInitScript(({ key, session, userId, origin }) => {
    if (location.origin !== origin) return;
    if (session) localStorage.setItem(key, JSON.stringify(session));
    localStorage.setItem("organizze.locale", "pt");
    localStorage.setItem("organizze.currency", "EUR");
    localStorage.setItem("organizze.name", "Alexandra de Albuquerque - QA");
    localStorage.setItem("organizze.lastUserId", userId);
    localStorage.setItem("organizze.tourCompleted", "1");
    localStorage.setItem(`organizze.tourCompleted:${userId}`, "1");
    localStorage.removeItem("organizze.firstRun");
  }, { key: await keyPromise, session: authenticated ? syntheticSession() : null, userId: USER_ID, origin: base.origin });
  const page = await context.newPage();
  page.setDefaultTimeout(3500);
  page.setDefaultNavigationTimeout(12000);
  await page.clock.setFixedTime(new Date(NOW));
  page.on("pageerror", (error) => errors.push(safeError(error)));
  await page.route("https://*.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = { "access-control-allow-origin": base.origin, "access-control-allow-headers": "*" };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (request.method() === "POST" && url.pathname === "/auth/v1/token" && control.auth === "error") {
      log(request, "mock-auth-error");
      await new Promise((resolve) => control.releases.push(resolve));
      if (control.closing) return;
      return route.fulfill({ status: 400, headers, contentType: "application/json", body: JSON.stringify({ error: "invalid_grant", error_description: "Credenciais sinteticas QA invalidas" }) });
    }
    if (!["GET", "HEAD"].includes(request.method())) return block(route, "blocked-write", "No mutation fixture is permitted");
    let fixture;
    try { fixture = readFixture(url, request.headers(), control.state); }
    catch (error) { return block(route, "uncovered-fixture", safeError(error)); }
    const delayed = DATA_TABLES.some((table) => url.pathname === `/rest/v1/${table}`);
    if (control.state === "loading" && delayed) {
      log(request, "mock-held-loading");
      await new Promise((resolve) => control.releases.push(resolve));
      if (control.closing) return;
    }
    if (control.state === "error" && delayed) {
      log(request, "mock-error");
      return route.fulfill({ status: 500, headers, contentType: "application/json", body: JSON.stringify({ message: "Erro sintetico QA", code: "QA_ERROR" }) });
    }
    log(request, "mock-read");
    return route.fulfill({ status: 200, contentType: "application/json", headers: { ...headers, ...fixture.headers }, body: JSON.stringify(fixture.body) });
  });
  return { page, control, network: localNetwork, errors, close: async () => { control.closing = true; control.releases.splice(0).forEach((release) => release()); await context.close(); } };
}

async function settle(page) {
  const heading = headings[new URL(page.url()).pathname];
  await (heading ? page.getByRole("heading", { name: heading, level: 1, exact: true }) : page.locator("h1").first()).waitFor({ timeout: 10000 });
  await page.locator("#dashboard-main-content").getByText(/A carregar|A sincronizar/).first().waitFor({ state: "hidden", timeout: 8000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode().catch(() => {}))));
  await sleep(250);
}

async function geometry(page) {
  return page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !(el.closest(".sr-only") && !el.matches(":focus")); };
    const identify = (el) => { const box = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), id: el.id || undefined, role: el.getAttribute("role") || undefined, label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100), box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth } }; };
    const horizontal = (el) => {
      for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (parent.id === "dashboard-main-content") continue;
        if (/auto|scroll/.test(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth + 2) return true;
      }
      return false;
    };
    const nodes = [...document.querySelectorAll("body *")].filter(visible);
    const outside = nodes.filter((el) => {
      const r = el.getBoundingClientRect();
      const meaningful = (el.textContent || "").trim() || el.matches("input,button,img,canvas");
      return meaningful && r.top < innerHeight && r.bottom > 0 && (r.left < -2 || r.right > innerWidth + 2) && !el.closest("svg,[role=progressbar]") && !horizontal(el);
    }).slice(0, 15).map(identify);
    const controls = nodes.filter((el) => el.matches("button,input,select,[role=combobox],a"));
    const undersized = controls.filter((el) => { const r = el.getBoundingClientRect(); return r.height < 43 || r.width < 43; }).slice(0, 20).map(identify);
    const clippedText = controls.filter((el) => !el.matches("input,textarea") && el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).textOverflow !== "ellipsis").slice(0, 15).map(identify);
    const canvas = document.createElement("canvas").getContext("2d");
    const splitWords = nodes.filter((el) => el.matches("h1,.financial-value") && el.children.length === 0).filter((el) => {
      const style = getComputedStyle(el);
      canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const available = el.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return (el.textContent || "").trim().split(/\s+/).some((word) => canvas.measureText(word).width > available + 2);
    }).slice(0, 15).map(identify);
    const main = document.querySelector("#dashboard-main-content");
    const navigation = document.querySelector("aside") || document.querySelector("header");
    const mainBox = main?.getBoundingClientRect();
    const overflowSources = main ? nodes.filter((el) => {
      if (!main.contains(el) || horizontal(el) || el.closest("svg,[role=progressbar]") || !(el.textContent || "").trim()) return false;
      const box = el.getBoundingClientRect();
      return box.left < mainBox.left - 2 || box.right > mainBox.right + 2;
    }).slice(0, 15).map(identify) : [];
    const intrinsicOverflow = main ? nodes.filter((el) => main.contains(el) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2 && !el.matches("input,textarea") && !el.closest("[role=progressbar]")).slice(-20).map((el) => ({ ...identify(el), classes: typeof el.className === "string" ? el.className : "" })) : [];
    const overflowText = [];
    if (main) {
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode()) && overflowText.length < 12) {
        if (!text.textContent.trim() || !visible(text.parentElement)) continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        const rects = [...range.getClientRects()].filter((box) => box.right > mainBox.right + 2 || box.left < mainBox.left - 2);
        if (rects.length) overflowText.push({ ...identify(text.parentElement), text: text.textContent.trim().slice(0, 100), rects: rects.map((box) => ({ x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), right: Math.round(box.right) })) });
      }
    }
    return {
      documentOverflow: document.documentElement.scrollWidth > innerWidth + 2,
      mainOverflow: !!main && main.scrollWidth > main.clientWidth + 2,
      outside, undersized, clippedText, splitWords, overflowSources, intrinsicOverflow, overflowText,
      scrollOwner: main ? { overflowY: getComputedStyle(main).overflowY, clientHeight: main.clientHeight, scrollHeight: main.scrollHeight, clientWidth: main.clientWidth, scrollWidth: main.scrollWidth } : null,
      colors: { body: getComputedStyle(document.body).backgroundColor, main: main && getComputedStyle(main).backgroundColor, navigation: navigation && getComputedStyle(navigation).backgroundColor },
      brokenImages: [...document.images].filter((img) => visible(img) && (!img.complete || !img.naturalWidth)).map((img) => new URL(img.src).pathname),
    };
  });
}

async function capture(page, name, { assertLayout = true } = {}) {
  await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true, animations: "disabled", timeout: 10000 });
  const metrics = await geometry(page);
  const textStress = name.startsWith("text200-");
  record("layout", !assertLayout || (!metrics.documentOverflow && !metrics.mainOverflow && !metrics.outside.length && !metrics.clippedText.length && (textStress || !metrics.splitWords.length)), { screenshot: `${name}.png`, metrics });
  if (textStress && metrics.splitWords.length) results.push({ case: currentCase, name: "200% word breaking requires visual review; not automatically lost content", status: "review", screenshot: `${name}.png`, elements: metrics.splitWords });
  if (metrics.mainOverflow && metrics.overflowText[0]?.id) {
    const position = await page.locator("#dashboard-main-content").evaluate((el) => el.scrollTop);
    await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: "center" }), metrics.overflowText[0].id);
    await page.screenshot({ path: path.join(directory, `${name}-overflow-source.png`), animations: "disabled", timeout: 10000 });
    results.push({ case: currentCase, name: "overflow source detail", status: "review", screenshot: `${name}-overflow-source.png`, source: metrics.overflowText[0] });
    await page.locator("#dashboard-main-content").evaluate((el, scrollTop) => { el.scrollTop = scrollTop; }, position);
  }
  record("local images decoded", metrics.brokenImages.length === 0, { images: metrics.brokenImages });
  return metrics;
}

async function visitCase(name, width, options, callback) {
  if (timedOut || (selections.length && !selections.some((selection) => `${name}@${width}`.includes(selection)))) return;
  currentCase = `${name}@${width}`;
  let fixture;
  try {
    fixture = await isolatedPage(width, options);
    await callback(fixture.page, fixture);
  } catch (error) {
    record("case completed", false, { error: safeError(error) });
    if (fixture && !fixture.page.isClosed()) await fixture.page.screenshot({ path: path.join(directory, `${slug(name)}-${width}-failure.png`), fullPage: true, timeout: 3000 }).catch(() => {});
  } finally {
    if (fixture) {
      record("no browser runtime errors", fixture.errors.length === 0, { errors: fixture.errors });
      record("known fixtures only; no mutations", !fixture.network.some((event) => ["uncovered-fixture", "blocked-write", "blocked-context-guard"].includes(event.outcome) && event.target !== "external"));
      await fixture.close().catch(() => {});
    }
    await writeFile(path.join(directory, "progress.json"), JSON.stringify({ lastCase: currentCase, results }, null, 2));
    console.log(`${currentCase}: ${results.filter((result) => result.case === currentCase && result.status === "fail").length} failed checks`);
  }
}

async function baseline() {
  for (const width of widths) {
    for (const route of [...dashboardRoutes, ...onboardingRoutes, "/auth"]) {
      await visitCase(route, width, { authenticated: route !== "/auth" }, async (page) => {
        await page.goto(new URL(route, base).href);
        await settle(page);
        record("requested route rendered", new URL(page.url()).pathname === route);
        if (route.startsWith("/dashboard")) {
          await page.getByText("A carregar", { exact: false }).first().waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
          record("no data error state", await page.getByText(/N[aã]o foi poss[ií]vel carregar/).count() === 0);
        }
        await capture(page, `${slug(route)}-${width}`);
        if (route.startsWith("/dashboard") && [320, 1440].includes(width)) {
          await page.locator("#dashboard-main-content").evaluate((el) => { el.scrollTop = el.scrollHeight; });
          await capture(page, `${slug(route)}-${width}-bottom`);
        }
        if (route === "/auth") {
          await page.getByRole("button", { name: "Criar conta", exact: true }).click();
          await capture(page, `auth-signup-${width}`);
        }
      });
    }
  }
}

async function portalLight(locator) {
  await locator.waitFor();
  const surface = await locator.evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, inRoot: !!el.closest("#root"), text: getComputedStyle(el).color }));
  const rgb = surface.background.match(/[\d.]+/g)?.map(Number) || [];
  assert(rgb.length >= 3 && rgb.slice(0, 3).every((channel) => channel >= 230) && (rgb[3] ?? 1) === 1, `Portal is not opaque light: ${surface.background}`);
  assert.equal(surface.inRoot, false, "Expected an actual body portal");
  return { surface };
}

async function focusContained(page, locator, count = 24) {
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(i === 0 ? "Shift+Tab" : "Tab");
    assert(await locator.evaluate((el) => el.contains(document.activeElement)), "Focus escaped modal");
  }
}

async function restoredFocus(page, trigger) {
  await page.waitForFunction((element) => element === document.activeElement, trigger, { timeout: 1500 });
}

async function enlargeText(page) {
  return page.evaluate(() => {
    // Snapshot all computed sizes before changing ancestors to avoid compounding.
    const nodes = [...document.querySelectorAll("body *")].filter((el) => !el.closest("svg") && (el.matches("input,textarea,select") || [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())));
    const sizes = nodes.map((el) => ({ font: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight) }));
    nodes.forEach((el, i) => {
      el.style.setProperty("font-size", `${sizes[i].font * 2}px`, "important");
      if (Number.isFinite(sizes[i].line)) el.style.setProperty("line-height", `${sizes[i].line * 2}px`, "important");
    });
    return { method: "text-only computed font and line-height doubled; not native browser zoom", enlargedElements: nodes.length };
  });
}

async function interactions() {
  for (const width of widths) {
    await visitCase("navigation-keyboard", width, {}, async (page) => {
      await page.goto(new URL("/dashboard", base).href);
      await settle(page);
      await check("keyboard skip link reaches main", async () => {
        await page.keyboard.press("Tab");
        assert.equal(await page.locator(":focus").getAttribute("href"), "#dashboard-main-content");
        await page.keyboard.press("Enter");
        assert.equal(await page.locator(":focus").getAttribute("id"), "dashboard-main-content");
      });
      if (width < 1024) {
        const trigger = page.getByRole("button", { name: width < 768 ? "Abrir menu" : "Abrir navegação", exact: true });
        const triggerElement = await trigger.elementHandle();
        await trigger.focus();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", { name: "Menu da aplicação" });
        await dialog.waitFor();
        await check("all eleven destinations in full menu", async () => {
          for (const route of dashboardRoutes) assert(await dialog.locator(`a[href="${route}"]`).count() > 0, `Missing ${route}`);
        });
        await check("navigation traps keyboard focus", () => focusContained(page, dialog));
        await capture(page, `navigation-open-${width}`);
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await check("navigation Escape restores trigger", () => restoredFocus(page, triggerElement));
        if (width < 768) record("five mobile destinations", await page.getByRole("navigation", { name: "Navegação móvel" }).locator("a,button").count() === 5);
      } else {
        await check("desktop visible fixed navigation", async () => {
          assert(await page.locator("aside").first().isVisible());
          for (const route of dashboardRoutes.filter((route) => !route.includes("diagnostico"))) assert(await page.locator(`aside a[href="${route}"]`).count() > 0, `Missing ${route}`);
          const before = await page.locator("aside").first().boundingBox();
          await page.locator("#dashboard-main-content").evaluate((el) => { el.scrollTop = 400; });
          assert.deepEqual(await page.locator("aside").first().boundingBox(), before);
        });
      }
      const account = width < 1024 ? page.getByRole("button", { name: "Abrir menu da conta", exact: true }) : page.locator("aside button[aria-haspopup=menu]");
      const accountElement = await account.elementHandle();
      await account.click();
      await check("account menu portal light", () => portalLight(page.getByRole("menu")));
      await capture(page, `account-menu-${width}`);
      const overlaySnapshot = () => page.evaluate(() => ({ focus: { tag: document.activeElement?.tagName, role: document.activeElement?.getAttribute("role"), label: (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").trim().slice(0, 100) }, overlays: [...document.querySelectorAll("[role=menu],[role=tooltip],[role=dialog]")].map((el) => ({ role: el.getAttribute("role"), state: el.getAttribute("data-state"), text: (el.textContent || "").trim().slice(0, 100) })) }));
      const beforeEscape = await overlaySnapshot();
      await page.keyboard.press("Escape");
      await check("account menu Escape restores trigger", async () => {
        try {
          await page.getByRole("menu").waitFor({ state: "hidden" });
          await restoredFocus(page, accountElement);
        } catch (error) {
          results.push({ case: currentCase, name: "account Escape diagnostic", status: "review", beforeEscape, afterEscape: await overlaySnapshot() });
          throw error;
        }
      });
    });

    await visitCase("transactions-interaction", width, {}, async (page, fixture) => {
      await page.goto(new URL("/dashboard/lancamentos", base).href);
      await settle(page);
      const search = page.getByRole("searchbox", { name: "Pesquisar lançamentos" });
      await check("synthetic table/mobile rows visible", async () => {
        assert(await page.getByText("Renda QA", { exact: true }).filter({ visible: true }).isVisible());
        if (width >= 768) assert.equal(await page.getByRole("table", { name: "Tabela de lançamentos" }).locator("tbody tr").count(), 5);
      });
      await check("search filters real rendered rows", async () => {
        await search.fill("Renda QA");
        assert(await page.getByText("Renda QA", { exact: true }).filter({ visible: true }).isVisible());
        assert.equal(await page.getByText("Rendimento sintetico QA", { exact: true }).filter({ visible: true }).count(), 0);
        await capture(page, `transaction-search-${width}`);
      });
      await search.fill("");
      for (const [label, option, reset] of [["Tipo de lançamento", "Receitas", "Todos os tipos"], ["Categoria", "Habitacao", "Todas as categorias"], ["Estado", "Pendente", "Todos os estados"]]) {
        await check(`filter ${label} changes result`, async () => {
          const filter = page.getByRole("combobox", { name: label, exact: true });
          await filter.click();
          await portalLight(page.getByRole("listbox"));
          await page.getByRole("option", { name: option, exact: true }).click();
          assert(await page.getByText("1 lançamento no resultado atual", { exact: true }).isVisible());
          await filter.click();
          await page.getByRole("option", { name: reset, exact: true }).click();
        });
      }
      const add = page.getByRole("button", { name: "Novo lançamento", exact: true });
      const addElement = await add.elementHandle();
      await add.click();
      const dialog = page.getByRole("dialog", { name: "Novo lançamento", exact: true });
      await check("transaction dialog portal light", () => portalLight(dialog));
      await check("transaction modal labels and editable fields", async () => {
        await dialog.getByLabel("Descrição", { exact: true }).fill("Rascunho sintetico QA - NAO GUARDAR");
        await dialog.getByLabel("Valor (EUR)", { exact: true }).fill("1234567,89");
        await dialog.getByLabel("Comerciante (opcional)", { exact: true }).fill("Somente leitura QA");
      });
      await check("transaction modal traps keyboard focus", () => focusContained(page, dialog));
      await capture(page, `transaction-dialog-${width}`);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await check("transaction dialog Escape restores trigger", () => restoredFocus(page, addElement));
      await page.getByRole("button", { name: "Editar Renda QA", exact: true }).filter({ visible: true }).click();
      const edit = page.getByRole("dialog", { name: "Editar lançamento", exact: true });
      await check("edit modal prefilled, cancel without submission", async () => {
        assert.equal(await edit.getByLabel("Descrição", { exact: true }).inputValue(), "Renda QA");
        await edit.getByRole("button", { name: "Cancelar", exact: true }).click();
      });
      await page.getByRole("button", { name: "Eliminar Renda QA", exact: true }).filter({ visible: true }).click();
      const deletion = page.getByRole("alertdialog");
      await check("delete confirmation portal light; cancel only", async () => {
        const style = await portalLight(deletion);
        await deletion.getByRole("button", { name: "Cancelar", exact: true }).click();
        return style;
      });
      record("no financial submission attempted", fixture.network.every((event) => ["GET", "HEAD"].includes(event.method)));
      if ([320, 1440].includes(width)) {
        await add.click();
        await dialog.waitFor();
        await enlargeText(page);
        await capture(page, `text200-transaction-dialog-${width}`);
        await page.keyboard.press("Escape");
      }
    });

    await visitCase("auth-states", width, { authenticated: false }, async (page, fixture) => {
      await page.goto(new URL("/dashboard", base).href);
      await page.waitForURL("**/auth");
      await settle(page);
      record("unauthenticated protected route redirects", new URL(page.url()).pathname === "/auth");
      await page.goto(new URL("/signup", base).href);
      await page.waitForURL("**/auth");
      await settle(page);
      record("signup alias preserved", new URL(page.url()).pathname === "/auth");
      await check("auth keyboard persistent label and focus", async () => {
        for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
        assert.equal(await page.locator(":focus").getAttribute("name"), "email");
        const style = await page.locator(":focus").evaluate((el) => ({ outline: getComputedStyle(el).outlineStyle, shadow: getComputedStyle(el).boxShadow }));
        assert(style.outline !== "none" || style.shadow !== "none", "No visible focus indicator");
      });
      await page.getByLabel("E-mail", { exact: true }).fill("editorial.qa@example.invalid");
      await page.getByLabel("Senha", { exact: true }).fill("SyntheticOnly123!");
      await page.getByRole("button", { name: "Mostrar senha", exact: true }).click();
      record("password visibility", await page.getByLabel("Senha", { exact: true }).getAttribute("type") === "text");
      await page.getByRole("button", { name: "Ocultar senha", exact: true }).click();
      await page.getByRole("button", { name: "Criar conta", exact: true }).click();
      record("signup retains email", await page.getByLabel("E-mail", { exact: true }).inputValue() === "editorial.qa@example.invalid");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      fixture.control.auth = "error";
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.locator("form[aria-busy=true]").waitFor();
      record("busy auth disables Google", await page.getByRole("button", { name: "Continuar com Google", exact: true }).isDisabled());
      await capture(page, `auth-loading-${width}`);
      fixture.control.releases.splice(0).forEach((release) => release());
      await page.getByText("Credenciais sinteticas QA invalidas", { exact: true }).first().waitFor();
      await capture(page, `auth-error-${width}`);
      record("auth error returns enabled submit", await page.getByRole("button", { name: "Entrar", exact: true }).isEnabled());
    });

    await visitCase("onboarding-keyboard", width, {}, async (page) => {
      await page.goto(new URL("/onboarding/nome", base).href);
      await settle(page);
      const next = page.getByRole("button", { name: "Continuar", exact: true });
      record("empty name prevents continuation", await next.isDisabled());
      await page.getByLabel("O teu nome", { exact: true }).fill("Alexandra de Albuquerque - nome sintetico muito longo QA");
      await next.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL("**/onboarding/idioma");
      await page.getByRole("button", { name: /English/ }).focus();
      await page.keyboard.press("Space");
      await next.click();
      await page.waitForURL("**/onboarding/moeda");
      record("onboarding language saved in isolated context", await page.evaluate(() => localStorage.getItem("organizze.locale")) === "en");
      const currency = page.getByRole("button", { name: /USD/ });
      await currency.focus();
      await page.keyboard.press("Space");
      record("currency selection by keyboard", await currency.getAttribute("aria-pressed") === "true");
      await capture(page, `onboarding-keyboard-${width}`);
      // Stop before WhatsApp linking or any backend interaction.
    });
  }
  for (const interaction of ["pointer", "keyboard"]) {
    await visitCase(`account-direct-${interaction}`, 768, {}, async (page) => {
      await page.goto(new URL("/dashboard", base).href);
      await settle(page);
      const trigger = page.getByRole("button", { name: "Abrir menu da conta", exact: true });
      const element = await trigger.elementHandle();
      if (interaction === "pointer") await trigger.click();
      else { await trigger.focus(); await page.keyboard.press("Enter"); }
      await page.getByRole("menu").waitFor();
      await sleep(800);
      const beforeEscape = await page.evaluate(() => ({ tooltip: !!document.querySelector("[role=tooltip]"), focusRole: document.activeElement?.getAttribute("role") }));
      await page.keyboard.press("Escape");
      await check("direct account first Escape closes and restores focus", async () => {
        await page.getByRole("menu").waitFor({ state: "hidden" });
        await restoredFocus(page, element);
        return { beforeEscape, navigationSheetUsed: false };
      });
      if (await page.getByRole("menu").isVisible()) {
        await page.keyboard.press("Escape");
        await check("second Escape diagnostic", async () => { await page.getByRole("menu").waitFor({ state: "hidden" }); await restoredFocus(page, element); return { beforeEscape }; });
      }
    });
  }
}

async function textAndDataStates() {
  for (const width of [320, 1440]) {
    for (const route of [...dashboardRoutes, ...onboardingRoutes, "/auth"]) {
      await visitCase(`text200-${slug(route)}`, width, { authenticated: route !== "/auth" }, async (page) => {
        await page.goto(new URL(route, base).href);
        await settle(page);
        record("text enlarged to 200 percent", true, await enlargeText(page));
        await capture(page, `text200-${slug(route)}-${width}`);
        if (route.startsWith("/dashboard")) {
          await page.locator("#dashboard-main-content").evaluate((el) => { el.scrollTop = el.scrollHeight; });
          await capture(page, `text200-${slug(route)}-${width}-bottom`);
        }
      });
    }
    for (const state of ["empty", "loading", "error"]) {
      for (const route of ["/dashboard", "/dashboard/lancamentos"]) {
        await visitCase(`${state}-${slug(route)}`, width, { state }, async (page, fixture) => {
          await page.goto(new URL(route, base).href);
          await page.locator("#dashboard-main-content").waitFor();
          if (state === "loading") {
            await page.getByText(route === "/dashboard" ? "A sincronizar as tuas finanças com precisão..." : "A carregar lançamentos...", { exact: true }).waitFor();
            record("loading held by fixture", fixture.network.some((event) => event.outcome === "mock-held-loading"));
          } else if (state === "error") {
            await page.getByText(route === "/dashboard" ? "Não foi possível carregar os dados financeiros." : "Não foi possível carregar os lançamentos.", { exact: true }).waitFor({ timeout: 12000 });
            record("error has retry action", await page.getByRole("button", { name: "Tentar novamente", exact: true }).isVisible());
          } else {
            await settle(page);
            if (route.endsWith("lancamentos")) await page.getByText("Nenhum lançamento corresponde a este período e filtros.", { exact: true }).waitFor();
            record("empty fixture contains no transaction rows", await page.getByText("Renda QA", { exact: true }).count() === 0);
          }
          await capture(page, `${state}-${slug(route)}-${width}`);
          if (state === "loading") {
            fixture.control.state = "populated";
            fixture.control.releases.splice(0).forEach((release) => release());
            await settle(page);
            record("loading recovers after release", await page.getByText(/A sincronizar as tuas finanças|A carregar lançamentos/).count() === 0);
          }
          if (state === "error") {
            fixture.control.state = "populated";
            await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
            await page.getByText(/Não foi possível carregar/).first().waitFor({ state: "hidden" });
            record("retry recovers with synthetic data", true);
          }
        });
      }
    }
  }
  for (const [query, expected] of [["?next=/dashboard/lancamentos", "/dashboard/lancamentos"], ["?next=https://example.invalid", "/dashboard"]]) {
    await visitCase(`auth-session-redirect-${slug(expected)}`, 375, {}, async (page) => {
      await page.goto(new URL(`/auth${query}`, base).href);
      await page.waitForURL((url) => url.pathname === expected);
      await settle(page);
      record("synthetic existing session uses safe redirect", true);
    });
  }
}

const keyPromise = storageKey();
const deadline = setTimeout(() => { timedOut = true; void browser?.close(); }, 12 * 60 * 1000);
try {
  await keyPromise;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/Users/fabriciolima/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-first-run"] });
  for (const width of [375, 768, 1440]) {
    await visitCase("primitive-showcase", width, { authenticated: false }, async (page) => {
      await page.goto(new URL("/__design-system", base).href);
      await settle(page);
      await capture(page, `primitive-showcase-${width}`);
    });
  }
  await baseline();
  if (mode !== "baseline") {
    await interactions();
    await textAndDataStates();
  }
} catch (error) {
  record("harness setup/execution", false, { error: safeError(error) });
} finally {
  clearTimeout(deadline);
  await browser?.close();
  if (!results.length || timedOut) record("suite completed within bounds with selected cases", false);
  const summary = { mode, only: only || null, date: NOW, startedAt, finishedAt: new Date().toISOString(), base: base.origin, timedOut, cases: new Set(results.map((result) => result.case)).size, passed: results.filter((result) => result.status === "pass").length, failed: results.filter((result) => result.status === "fail").length, review: results.filter((result) => result.status === "review").length, screenshots: new Set(results.map((result) => result.screenshot).filter(Boolean)).size };
  const uncovered = network.filter((event) => event.outcome === "uncovered-fixture");
  const limitations = ["Synthetic read-only fixtures, not production/backend/auth correctness.", "No live account, payment, messaging, upload or financial write was attempted.", "Shared server can change between navigations; screenshots are evidence, not pixel-golden comparisons.", "200% is font/line-height stress at 320 and 1440, not native browser zoom. Word breaking is review-only when content remains contained.", "Only dashboard and transactions have dedicated empty/loading/error/retry scenarios; other routes have populated fixtures.", "No OAuth, signup submission, checkout, invitations, receipt upload, WhatsApp linking/sending, viewer role or multi-space switching coverage.", "No Lighthouse, contrast certification or screen-reader claim. Reduced motion is emulated; normal motion is not audited."];
  await writeFile(path.join(directory, "results.json"), JSON.stringify({ summary, limitations, results, network, uncovered }, null, 2));
  const renderResult = (result) => `- **${result.case}**: ${result.name}${result.error ? `: ${result.error.replaceAll("\n", " ")}` : ""}${result.screenshot ? ` ([screenshot](${result.screenshot}))` : ""}`;
  const report = [
    `# Product Editorial ${mode}`,
    `${summary.cases} cases; ${summary.passed} checks passed; ${summary.failed} failed; ${summary.review} review observations; ${summary.screenshots} screenshots.`,
    `Started ${startedAt}; finished ${summary.finishedAt}. ${only ? `Partial selection: ${only}.` : "Full requested route matrix."}`,
    "Synthetic fixtures only. No live account, checkout, message or financial write.",
    "## Failures",
    results.filter((result) => result.status === "fail").map(renderResult).join("\n") || "None.",
    "## Visual Review",
    results.filter((result) => result.status === "review").map(renderResult).join("\n") || "No automatic review observations.",
    "## Uncovered Fixtures",
    uncovered.map((event) => `- ${event.method} ${event.path}: ${event.reason}`).join("\n") || "None observed.",
    "## Limits",
    limitations.map((item) => `- ${item}`).join("\n"),
    "See results.json for geometry, bounded request metadata and coverage details. No headers, bodies or session tokens are recorded.",
  ].join("\n\n");
  await writeFile(path.join(directory, "report.md"), `${report}\n`);
  console.log(JSON.stringify(summary));
  console.log(`Report: ${path.join(directory, "report.md")}`);
  process.exitCode = summary.failed || timedOut ? 1 : 0;
}
