import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildCs06AiHintArtifact,
  serializeCs06AiHintArtifact,
} from "./lib/cs06-ai-hint-artifact-builder";

const artifactPath = fileURLToPath(
  new URL("../data/ai/cs06-ai-hints-generated.json", import.meta.url),
);
const expected = serializeCs06AiHintArtifact(buildCs06AiHintArtifact());

if (process.argv.includes("--write")) {
  await writeFile(artifactPath, expected, "utf8");
  process.stdout.write("generated cs06-ai-hints-generated.json\n");
} else {
  const actual = await readFile(artifactPath, "utf8");
  if (actual !== expected)
    throw new Error(
      "cs06_ai_hint_artifact_drift: run corepack pnpm generate:cs06-ai-hints",
    );
  process.stdout.write("cs06 AI hint artifact is current\n");
}
