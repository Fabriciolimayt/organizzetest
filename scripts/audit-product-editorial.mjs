import { chromium } from "/Users/fabriciolima/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const auditModule = process.env.QA_AUDIT_MODULE || resolve("../../../Organizze Site/node_modules/playwright-lighthouse/index.js");
const { playAudit } = await import(pathToFileURL(auditModule).href);
const directory = process.env.QA_AUDIT_OUTPUT || "artifacts/product-editorial/performance";
await mkdir(directory, { recursive: true });
const results = [];
for (const formFactor of ["mobile", "desktop"]) {
  for (let run = 1; run <= 3; run++) {
    const port = 9352;
    const browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || "/Users/fabriciolima/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      args: [`--remote-debugging-port=${port}`],
    });
    try {
      const page = await browser.newPage();
      await page.goto(`${process.env.QA_URL || "http://127.0.0.1:56789"}/auth`);
      const { lhr } = await playAudit({
        page, port, ignoreError: true, disableLogs: true,
        thresholds: { performance: 100, accessibility: 100, "best-practices": 100, seo: 100 },
        config: { extends: "lighthouse:default", settings: {
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          formFactor,
          screenEmulation: formFactor === "desktop"
            ? { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false }
            : { mobile: true, width: 375, height: 812, deviceScaleFactor: 1, disabled: false },
          ...(formFactor === "desktop" ? { throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } : {}),
        } },
        reports: { formats: { json: true, html: true }, directory, name: `${formFactor}-${run}` },
      });
      const result = {
        formFactor, run,
        scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
        lcp: lhr.audits["largest-contentful-paint"].numericValue,
        tbt: lhr.audits["total-blocking-time"].numericValue,
        cls: lhr.audits["cumulative-layout-shift"].numericValue,
        findings: Object.entries(lhr.audits).filter(([, a]) => a.score !== null && a.score < 1).map(([id, a]) => ({ id, title: a.title, display: a.displayValue })),
      };
      results.push(result);
      console.log(JSON.stringify(result));
    } finally { await browser.close(); }
  }
}
await writeFile(`${directory}/summary.json`, JSON.stringify(results, null, 2));
