import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  assertAiInputIsSideSafe,
  simulateAiGame as simulateProductAiGame,
} from "./product-simulation";
import { simulateAiGame as simulateDevelopmentAiGame } from "./simulation";

describe("product simulation facade", () => {
  it("preserves the established deterministic simulator result", () => {
    const config = { seed: "product-simulation-contract", maxActions: 12 };

    expect(simulateProductAiGame(config)).toEqual(
      simulateDevelopmentAiGame(config),
    );
    expect(typeof assertAiInputIsSideSafe).toBe("function");
  });

  it("does not load benchmark, soak, mining, league or report entrypoints", async () => {
    const result = await build({
      entryPoints: [
        fileURLToPath(new URL("./product-simulation.ts", import.meta.url)),
      ],
      bundle: true,
      format: "esm",
      metafile: true,
      platform: "node",
      treeShaking: true,
      write: false,
    });
    const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
    const inputs = Object.keys(result.metafile.inputs).map((input) =>
      path
        .relative(
          repositoryRoot,
          path.isAbsolute(input) ? input : path.resolve(input),
        )
        .replaceAll("\\", "/"),
    );
    const forbiddenFragments = [
      "/reports/",
      "/evaluation/",
      "/ai-runtime-simulation-composition.ts",
      "/ai-simulation-composition.ts",
      "/ai-simulation-entrypoints.ts",
      "/ai-selfplay-trace-mining-runner.ts",
      "/ai-soak-runner.ts",
      "/benchmark-deck-slot-runner.ts",
      "/doctrine-quality-benchmark-runner.ts",
      "/match-progression-benchmark-runner.ts",
      "/match-progression-benchmark-suite-runner.ts",
      "/simulation-league.ts",
    ];

    expect(
      inputs.filter((input) =>
        forbiddenFragments.some((fragment) => input.includes(fragment)),
      ),
    ).toEqual([]);
  });
});
