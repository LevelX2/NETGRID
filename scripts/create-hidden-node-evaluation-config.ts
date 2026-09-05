import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const out = resolve(import.meta.dirname, "../tmp/hidden-node");
mkdirSync(out, { recursive: true });
const runnerId = "standard_runner_krashkurs_clown_kreditmaschine_2026_07_11";
const games = [
  ...Array.from({ length: 40 }, (_, i) => ({
    runnerId,
    seed: `meta-357-final-${String(i + 1).padStart(3, "0")}`,
  })),
  ...[
    runnerId,
    "standard_runner_rd_express",
    "standard_runner_redline_riot",
  ].flatMap((runnerId, opponent) =>
    Array.from({ length: 10 }, (_, i) => ({
      runnerId,
      seed: `hidden-node-holdout-20260905-${opponent + 1}-${String(i + 1).padStart(2, "0")}`,
    })),
  ),
];
writeFileSync(
  resolve(out, "original.json"),
  JSON.stringify({ label: "original", games }, null, 2),
);
writeFileSync(
  resolve(out, "pilot.json"),
  JSON.stringify(
    {
      label: "pilot",
      games: games.filter((_, i) =>
        [4, 11, 19, 21, 24, 33, 35, 38].includes(i),
      ),
    },
    null,
    2,
  ),
);
writeFileSync(
  resolve(out, "checkpoint.json"),
  JSON.stringify(
    {
      label: "checkpoint",
      games: [games[33]],
      captureActionIndices: [69, 84, 96, 267, 278],
    },
    null,
    2,
  ),
);
