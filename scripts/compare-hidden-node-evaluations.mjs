import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  compareEvaluations,
  readEvaluation,
} from "./lib/hidden-node-evaluation-summary.mjs";

const directory = resolve(process.argv[2] ?? "tmp/hidden-node");
const comparison = compareEvaluations(
  readEvaluation(resolve(directory, "baseline-original")),
  readEvaluation(resolve(directory, "economy-control")),
);
writeFileSync(
  resolve(directory, "comparison.json"),
  JSON.stringify(comparison, null, 2),
);
for (const cohort of comparison.cohorts) {
  const compact = ({
    games,
    corpWins,
    corpPoints,
    zeroScoreGames,
    scoreActions,
    basicCreditActions,
  }) => ({
    games,
    corpWins,
    corpPoints,
    zeroScoreGames,
    scoreActions,
    basicCreditActions,
  });
  process.stdout.write(
    JSON.stringify({
      cohort: cohort.label,
      baseline: compact(cohort.baseline),
      candidate: compact(cohort.candidate),
    }) + "\n",
  );
}
