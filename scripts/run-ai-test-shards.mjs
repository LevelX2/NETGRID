import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aiPackageRoot = path.join(root, "packages", "ai");
const vitestCli = path.join(root, "node_modules", "vitest", "vitest.mjs");
const shards = [
  { label: "test:shard:1", value: "1/3" },
  { label: "test:shard:2", value: "2/3" },
  { label: "test:shard:3", value: "3/3" },
];
const startedAt = performance.now();

process.stdout.write(
  `Starting ${shards.length} AI test shards in parallel (one Vitest worker per shard).\n`,
);

const results = await Promise.all(shards.map(runShard));
const durationSeconds = ((performance.now() - startedAt) / 1_000).toFixed(1);
const failed = results.filter(({ code }) => code !== 0);

if (failed.length === 0) {
  process.stdout.write(
    `All ${shards.length} AI test shards passed in ${durationSeconds}s.\n`,
  );
} else {
  process.stderr.write(
    `${failed.length} of ${shards.length} AI test shards failed after ${durationSeconds}s: ${failed
      .map(({ label, code }) => `${label} (exit ${code})`)
      .join(", ")}.\n`,
  );
  process.exitCode = 1;
}

function runShard({ label, value }) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        vitestCli,
        "run",
        "--maxWorkers=1",
        "--testTimeout=30000",
        `--shard=${value}`,
      ],
      {
        cwd: aiPackageRoot,
        env: process.env,
        stdio: "inherit",
      },
    );

    child.on("error", (error) => {
      process.stderr.write(`[${label}] could not start: ${error.message}\n`);
      resolve({ label, code: 1 });
    });
    child.on("exit", (code, signal) => {
      const exitCode = code ?? 1;
      process.stdout.write(
        `[${label}] finished with exit ${exitCode}${signal ? ` (${signal})` : ""}.\n`,
      );
      resolve({ label, code: exitCode });
    });
  });
}
