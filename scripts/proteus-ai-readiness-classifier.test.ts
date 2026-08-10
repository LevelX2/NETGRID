import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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
      expect(hint, record.cardId).toBeDefined();
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
        record.cardId,
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
      ["onr_proteus_021_dog-pile", "temporary_action"],
      ["onr_proteus_027_iceberg", "x_cost"],
      ["onr_proteus_034_riddler", "x_cost"],
      ["onr_proteus_035_roadblock", "random_outcome"],
      ["onr_proteus_046_corporate-guard-r-temps", "x_cost"],
      ["onr_proteus_049_emergency-rig", "x_cost"],
      ["onr_proteus_058_executive-boot-camp", "random_outcome"],
      ["onr_proteus_062_lesley-major", "access_ambush"],
      ["onr_proteus_063_lisa-blight", "random_outcome"],
    ]);

    for (const [cardId, family] of expected) {
      const hint = generatedHintsById.get(cardId)!;
      expect(classifyProteusAiReadiness(hint), cardId).toMatchObject({
        family,
      });
    }
  });

  it("leaves Proteus action capacity exclusively with the CardSpec compiler", () => {
    const normalizerSource = readFileSync(
      fileURLToPath(
        new URL("./normalize-ai-action-capacity-hints.mjs", import.meta.url),
      ),
      "utf8",
    );
    expect(normalizerSource).not.toContain("onr_proteus_");

    const profiles = generatedArtifact.cards
      .filter((record) => record.cardId.startsWith("onr_proteus_"))
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
