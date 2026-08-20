import { createClients } from "./clients.js";
import { loadConfig } from "./config.js";
import { logSafe } from "./safe-log.js";
import { createBridgeServer } from "./server.js";
import { createJobWorker } from "./worker.js";

const config = loadConfig();
const clients = createClients(config);
const server = createBridgeServer(config, clients);
const worker = createJobWorker(config, clients);

server.listen(config.port, config.host, () => {
  logSafe("info", "bridge", { event: "bridge.lifecycle", outcome: "started", statusCode: 200 });
  worker.start();
});

let shutdownStarted = false;
async function shutdown() {
  if (shutdownStarted) return;
  shutdownStarted = true;
  await worker.stop();
  await new Promise((resolve) => server.close(resolve));
  logSafe("info", "bridge", { event: "bridge.lifecycle", outcome: "stopped" });
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => {
    void shutdown().then(() => process.exit(0));
  });
}
