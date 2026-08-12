import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type HintRecord = {
  cardId: string;
  hint: unknown;
};

type GeneratedArtifact = {
  cards: HintRecord[];
};

type ReviewedGolden = {
  cards: HintRecord[];
  [key: string]: unknown;
};

const root = process.cwd();
const artifact = readJson<GeneratedArtifact>(
  "data/ai/card-spec-ai-hints-generated.json",
);
const generatedById = new Map(
  artifact.cards.map((record) => [record.cardId, record]),
);
const goldenPaths = [
  "packages/ai/src/test-fixtures/classic-card-spec-ai-hints-reviewed-v1.json",
  "packages/ai/src/test-fixtures/originalset-v1-card-spec-ai-hints-reviewed-v1.json",
  "packages/ai/src/test-fixtures/proteus-card-spec-ai-hints-reviewed-v1.json",
  "packages/ai/src/test-fixtures/testset-card-spec-ai-hints-reviewed-v1.json",
] as const;

for (const goldenPath of goldenPaths) {
  const reviewed = readJson<ReviewedGolden>(goldenPath);
  const cards = reviewed.cards
    .map(({ cardId }) => {
      const generated = generatedById.get(cardId);
      if (!generated) {
        throw new Error(`${goldenPath}: missing generated hint ${cardId}`);
      }
      return { cardId: generated.cardId, hint: generated.hint };
    })
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  if (cards.length !== reviewed.cards.length) {
    throw new Error(`${goldenPath}: reviewed partition size changed`);
  }
  writeFileSync(
    resolve(root, goldenPath),
    `${JSON.stringify({ ...reviewed, cards }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${goldenPath}: ${cards.length} cards synced\n`);
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8")) as T;
}
