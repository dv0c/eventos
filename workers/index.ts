import { createWorkers } from "../src/server/jobs/workers";

const workers = createWorkers();

console.log(`Started ${workers.length} BullMQ workers`);

async function shutdown() {
  console.log("Shutting down workers...");
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
