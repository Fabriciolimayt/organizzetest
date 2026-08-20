import { loadConfig } from "./config.js";
import { createInstanceRequest } from "./provision.js";

async function main() {
  const config = loadConfig();
  const instanceName = process.argv[2];
  const { url, options } = createInstanceRequest({
    baseUrl: config.evolutionBaseUrl,
    apiKey: config.evolutionApiKey,
    instanceName,
    instancePrefix: config.instancePrefix,
    webhookUrl: "http://bridge:3000/webhooks/evolution",
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });
  const response = await fetch(url, options);
  if (!response.ok) throw new Error("Evolution rejected instance provisioning");
  const result = await response.json();
  const qr = result?.qrcode?.base64 ?? result?.qrcode?.code;
  if (typeof qr !== "string" || !qr) throw new Error("Evolution did not return a QR value");

  // Interactive-only sensitive output. Do not route this through structured logs.
  process.stdout.write(`${qr}\n`);
}

main().catch(() => {
  process.stderr.write("Instance provisioning failed. Check the instance name and Evolution status.\n");
  process.exitCode = 1;
});
