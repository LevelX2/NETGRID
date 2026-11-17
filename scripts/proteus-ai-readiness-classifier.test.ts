import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { RUNTIME_CARDS } from "../packages/ai/src/ai-hints";
import generatedArtifact from "../data/ai/card-spec-ai-hints-generated.json";
import readinessInventory from "../data/ai/proteus-ai-readiness-inventory-v1.json";
import { classifyProteusAiReadiness } from "./lib/proteus-ai-readiness-classifier.mjs";

const generatedHintsById = new Map(
  generatedArtifact.cards.map((record) => [record.cardId, record.hint]),
);
const repoRoot = fileURLToPath(new URL("../", import.meta.url));

describe("Proteus AI readiness typed classifier", () => {
  it("preserves the exact reviewed 154-card family partition", () => {
    expect(readinessInventory.cards).toHaveLength(154);
    const classified = readinessInventory.cards.map((record) => {
      const hint = generatedHintsById.get(record.cardId);
      expect(hint, String(record.cardId)).toBeDefined();
      return {
        cardId: record.cardId,
        ...classifyProteusAiReadiness(hint!),
      };
    });

    expect(classified).toEqual(
      readinessInventory.cards.map((record) => ({
        cardId: record.cardId,
        family: record.primaryFamily,
        reasons: record.classificationReasons,
      })),
    );
  });

  it("is invariant to absent, injected or changed editor-only manual notes", () => {
    for (const record of readinessInventory.cards) {
      const hint = generatedHintsById.get(record.cardId)!;
      const expected = classifyProteusAiReadiness(hint);
      expect(
        classifyProteusAiReadiness({
          ...hint,
          manualNotes: [
            "X cost random ambush delayed access run_pressure virus bad publicity",
          ],
        }),
        String(record.cardId),
      ).toEqual(expected);
    }

    const source = readFileSync(
      fileURLToPath(
        new URL("./lib/proteus-ai-readiness-classifier.mjs", import.meta.url),
      ),
      "utf8",
    );
    expect(source).not.toContain("manualNotes");
  });

  it("binds the nine formerly note-dependent cards to typed semantics", () => {
    const expected = new Map([
      [79, "temporary_action"],
      [85, "x_cost"],
      [92, "x_cost"],
      [93, "random_outcome"],
      [104, "x_cost"],
      [107, "target_choice"],
      [116, "random_outcome"],
      [120, "access_ambush"],
      [121, "random_outcome"],
    ]);

    for (const [cardId, family] of expected) {
      const hint = generatedHintsById.get(cardId)!;
      expect(classifyProteusAiReadiness(hint), String(cardId)).toMatchObject({
        family,
      });
    }
    expect(
      generatedHintsById.get(107)?.targetProfiles,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: "temporarily_rez_relevant_ice",
          targetType: "installed_ice",
        }),
      ]),
    );
  });

  it("leaves Proteus action capacity exclusively with the CardSpec compiler", () => {
    const profiles = generatedArtifact.cards
      .filter((record) => RUNTIME_CARDS[record.cardId]?.setId === "proteus")
      .flatMap((record) => record.hint.actionCapacityProfiles ?? []);
    expect(profiles).toHaveLength(16);
  });

  it("binds active deck provenance only to current or explicitly retained sources", () => {
    const decks = JSON.parse(
      readFileSync(
        new URL(
          "../data/decks/proteus-playtest-decks-2026-05-25.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as { sourceDocuments: string[] };

    expect(decks.sourceDocuments).not.toContain(
      "data/cards/proteus-cards.json",
    );
    expect(decks.sourceDocuments).not.toContain(
      "data/manifests/proteus-card-support.json",
    );
    for (const source of decks.sourceDocuments)
      expect(existsSync(`${repoRoot}/${source}`), source).toBe(true);
  });
});
