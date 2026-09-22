import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "/Users/fabriciolima/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const base = process.env.QA_URL || "http://127.0.0.1:56784";
const directory = "artifacts/auth-paper";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/Users/fabriciolima/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
});
const results = [];
try {
  for (const width of [320, 375, 768, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: width < 900 ? 844 : 960 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}/auth`);
    await page.locator(".auth-paper").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".auth-paper__art img").evaluate(image => image.decode());
    for (const mode of ["login", "signup"]) {
      if (mode === "signup") await page.getByRole("button", { name: "Criar conta", exact: true }).click();
      const geometry = await page.evaluate(() => {
        const controls = [...document.querySelectorAll(".auth-paper button, .auth-paper input, .auth-paper a")];
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          invalidTargets: controls.filter(el => {
            const r = el.getBoundingClientRect();
            return r.height < 44 || r.width < 44 || r.x < -1 || r.right > innerWidth + 1;
          }).map(el => el.textContent || el.getAttribute("aria-label")),
          imageLoaded: document.querySelector(".auth-paper__art img").naturalWidth > 0,
        };
      });
      assert.equal(geometry.overflow, false, `${width} ${mode}: overflow`);
      assert.deepEqual(geometry.invalidTargets, [], `${width} ${mode}: small/clipped control`);
      assert.equal(geometry.imageLoaded, true);
      await page.screenshot({ path: `${directory}/${mode}-${width}.png`, fullPage: true });
      results.push({ width, mode, ...geometry });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
  await page.goto(`${base}/signup`);
  await page.locator(".auth-paper").waitFor();
  assert.equal(new URL(page.url()).pathname, "/signup");
  assert.equal(await page.getByRole("form", { name: "Criar conta" }).isVisible(), true);
  await page.getByLabel("E-mail", { exact: true }).fill("visual-test@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("OnlyMocked123!");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  assert.equal(await page.getByLabel("Senha", { exact: true }).getAttribute("type"), "text");
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  assert.equal(await page.getByLabel("E-mail", { exact: true }).inputValue(), "visual-test@example.com");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  let resolveRequest;
  const release = new Promise(resolve => { resolveRequest = resolve; });
  await page.route("**/auth/v1/token?grant_type=password", async route => {
    await release;
    await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "invalid_grant", error_description: "Credenciais de teste inválidas" }) });
  });
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "A processar..." }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Continuar com Google" }).isDisabled(), true);
  assert.equal(await page.locator(".auth-paper__spinner").evaluate(el => getComputedStyle(el).animationName), "none");
  await page.screenshot({ path: `${directory}/loading-mobile.png`, fullPage: true });
  resolveRequest();
  await page.getByText("Credenciais de teste inválidas", { exact: true }).waitFor();
  await page.screenshot({ path: `${directory}/error-mobile.png`, fullPage: true });
  assert.equal(await page.getByRole("button", { name: "Entrar", exact: true }).isDisabled(), false);
  results.push({ behavior: "direct signup, visibility, mode retention, reduced motion, mocked loading/error", passed: true });
  await page.reload();
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").getAttribute("aria-label"), "Organizze: página inicial");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").getAttribute("aria-label"), "Voltar ao início");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").getAttribute("name"), "email");
  await page.screenshot({ path: `${directory}/keyboard-mobile.png`, fullPage: true });
  // Text-only enlargement stresses content without scaling the bitmap or controls.
  await page.evaluate(() => {
    const nodes = [...document.querySelectorAll(".auth-paper *")].filter(el => el.matches("input") || [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()));
    const sizes = nodes.map(el => Number.parseFloat(getComputedStyle(el).fontSize));
    nodes.forEach((el, i) => { el.style.fontSize = `${sizes[i] * 2}px`; });
  });
  assert.equal(await page.getByLabel("E-mail", { exact: true }).evaluate(el => getComputedStyle(el).fontSize), "32px");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "200% text overflow");
  await page.screenshot({ path: `${directory}/text-200-mobile.png`, fullPage: true });
  results.push({ behavior: "keyboard and 200% text reflow", passed: true });
  await page.close();
  const fallback = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await fallback.route("**/images/auth/**", route => route.abort());
  await fallback.goto(`${base}/auth`);
  await fallback.locator(".auth-paper").waitFor();
  assert.equal(await fallback.getByRole("button", { name: "Entrar", exact: true }).isVisible(), true);
  await fallback.screenshot({ path: `${directory}/image-unavailable.png`, fullPage: true });
  results.push({ behavior: "missing image keeps functional form", passed: true });
  await fallback.close();
  await writeFile(`${directory}/browser-checks.json`, JSON.stringify(results, null, 2));
  console.log(`${results.length} browser checks passed`);
} finally {
  await browser.close();
}
