import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "/Users/fabriciolima/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { NOW, USER_ID, syntheticSession, readFixture } from "./product-editorial-fixtures.mjs";

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("vite/package.json"))("esbuild");
const base = new URL(process.env.QA_URL || "http://127.0.0.1:56789");
assert(["127.0.0.1", "localhost"].includes(base.hostname));
const injection = await build({
  stdin: { contents: `import {instrument} from 'react-scan/lite';
    window.__renderEvents=[];
    instrument({onEvent:e=>{if(e.kind==='commit')window.__renderEvents.push(e)},
      recordChangeDescriptions:true, includeFiberIdentity:true});`, resolveDir: process.cwd() },
  bundle: true, write: false, format: "iife", platform: "browser",
});
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Users/fabriciolima/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" });
const results = [];
try {
  for (const path of ["/auth", "/dashboard"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, serviceWorkers: "block" });
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === base.origin && request.method() === "GET") return route.continue();
      if (url.hostname.endsWith(".supabase.co") && request.method() === "GET") {
        const fixture = readFixture(url, request.headers(), "populated");
        return route.fulfill({ status: fixture.status || 200, contentType: "application/json", body: JSON.stringify(fixture.body), headers: { "access-control-allow-origin": "*", ...fixture.headers } });
      }
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
      return route.abort();
    });
    await context.routeWebSocket(/.*/, socket => socket.close());
    await context.addInitScript({ content: injection.outputFiles[0].text });
    if (path === "/dashboard") await context.addInitScript(({ session, userId }) => {
      localStorage.setItem("sb-mvnpfnmplnsdfkufghgh-auth-token", JSON.stringify(session));
      localStorage.setItem("organizze.lastUserId", userId);
      localStorage.setItem(`organizze.tourCompleted:${userId}`, "1");
      localStorage.setItem("organizze.tourCompleted", "1");
    }, { session: syntheticSession(), userId: USER_ID });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(NOW));
    await page.goto(new URL(path, base).href);
    await page.locator(path === "/auth" ? ".auth-paper" : ".product-dashboard").waitFor();
    await page.waitForTimeout(1200);
    const baseline = await page.evaluate(() => window.__renderEvents.length);
    await page.waitForTimeout(2200);
    const idle = await page.evaluate(() => window.__renderEvents.length);
    if (path === "/auth") {
      await page.getByRole("button", { name: "Criar conta", exact: true }).click();
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
    } else {
      await page.getByRole("button", { name: "Abrir menu da conta" }).count();
    }
    const events = await page.evaluate(() => window.__renderEvents.map(e => ({ didError: e.didError,
      unnecessary: e.tree?.filter(n => n.changeDescription?.kind === "unnecessary").map(n => n.name) || [] })));
    results.push({ path, initialCommits: baseline, idleCommits: idle - baseline, totalCommits: events.length,
      errorCommits: events.filter(e => e.didError).length, flaggedUnnecessary: events.flatMap(e => e.unnecessary) });
    assert(baseline > 0, "Instrumentation observes React commits");
    assert.equal(idle - baseline, 0, "No ongoing idle React renders");
    assert(events.every(e => !e.didError));
    await context.close();
  }
} finally {
  await browser.close();
  await mkdir("artifacts/product-editorial", { recursive: true });
  await writeFile("artifacts/product-editorial/render-budgets.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
