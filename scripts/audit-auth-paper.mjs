import { chromium } from "/Users/fabriciolima/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { playAudit } from "/tmp/organizze-browser-tools/node_modules/playwright-lighthouse/index.js";
import { writeFile } from "node:fs/promises";

const results = [];
for (const formFactor of ["mobile", "desktop"]) {
  for (let run = 1; run <= 3; run++) {
    const port = 9345;
    const browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || "/Users/fabriciolima/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      args: [`--remote-debugging-port=${port}`],
    });
    try {
      const page = await browser.newPage();
      await page.goto(`${process.env.QA_URL || "http://127.0.0.1:56784"}/auth`);
      const audit = await playAudit({
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
        reports: { formats: { json: true, html: true }, directory: "artifacts/auth-paper", name: `lighthouse-${formFactor}-${run}` },
      });
      const { lhr } = audit;
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
await writeFile("artifacts/auth-paper/lighthouse-summary.json", JSON.stringify(results, null, 2));
