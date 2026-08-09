import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildCardSpecAiHintArtifact,
  serializeCardSpecAiHintArtifact,
} from "./lib/card-spec-ai-hint-artifact-builder";

const artifactPath = fileURLToPath(
  new URL("../data/ai/card-spec-ai-hints-generated.json", import.meta.url),
);
const expected = serializeCardSpecAiHintArtifact(buildCardSpecAiHintArtifact());

if (process.argv.includes("--write")) {
  await writeFile(artifactPath, expected, "utf8");
  process.stdout.write("generated card-spec-ai-hints-generated.json\n");
} else {
  const actual = await readFile(artifactPath, "utf8");
  if (actual !== expected)
    throw new Error(
      "card_spec_ai_hint_artifact_drift: run corepack pnpm generate:card-spec-ai-hints",
    );
  process.stdout.write("CardSpec AI hint artifact is current\n");
}
