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

// Two predeclared candidates. Both preserve every named thematic core card,
// all agendas and the complete set of Node/Region/punish functions.
const economy = [
  { cardId: "onr_proteus_054_bel-digmo-antibody", delta: -1 },
  { cardId: "onr_proteus_075_stereogram-antibody", delta: -1 },
  { cardId: "onr_v1_281_accounts-receivable", delta: 2 },
];
const balanced = [
  ...economy,
  { cardId: "onr_proteus_017_credit-blocks", delta: -1 },
  { cardId: "onr_proteus_040_sumo-2008", delta: -1 },
  { cardId: "onr_v1_237_data-wall", delta: 2 },
];
for (const [label, changes] of [
  ["economy", economy],
  ["balanced", balanced],
] as const) {
  for (const pilot of [true, false]) {
    writeFileSync(
      resolve(out, `${label}${pilot ? "-pilot" : ""}.json`),
      JSON.stringify(
        {
          label,
          changes,
          games: pilot
            ? games.filter((_, i) =>
                [4, 11, 19, 21, 24, 33, 35, 38].includes(i),
              )
            : games,
        },
        null,
        2,
      ),
    );
  }
}
