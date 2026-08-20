import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = resolve(root, "dist");
const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const prohibitedDiagnostics = /react-(?:grab|scan)/i;

execFileSync(packageManager, ["run", "build"], { cwd: root, stdio: "inherit" });

const assetFiles = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? assetFiles(path) : [path];
  });

const matches = assetFiles(distDirectory).filter((path) =>
  prohibitedDiagnostics.test(readFileSync(path, "utf8")),
);

if (matches.length > 0) {
  throw new Error(`Production diagnostics leaked into dist: ${matches.join(", ")}`);
}

console.log("Production diagnostics verification passed: react-grab/react-scan absent from dist.");
