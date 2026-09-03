import { describe, expect, it } from "vitest";
import { aiDeckPoolData } from "./ai-deck-pool";
import { cardSetAiReadinessData } from "./card-set-ai-readiness";
import { cardSpecAiHintsGeneratedData } from "./card-spec-ai-hints";
import { cardSupportAiSupportedData } from "./card-support";
import {
  deckFormatProfiles08Data,
  deckFormatProfiles130Data,
} from "./deck-format-profiles";
import {
  deckSnapshots08Data,
  deckTemplates08Data,
} from "./legacy-demo-decks";
import {
  standardDeckCatalogData,
  standardDeckCurationData,
  standardDeckGuidesData,
} from "./standard-decks";
import { localizedDeCardSkinData } from "./display-assets";
import {
  deckFormatProfiles08Data as releaseProfiles08Data,
  deckSnapshots08Data as releaseSnapshots08Data,
  deckTemplates08Data as releaseTemplates08Data,
} from "./release-deck-fixtures";
import { strategyGoalsData } from "./strategy-goals";

describe("product runtime data authority", () => {
  it("exports the complete explicitly classified product data set", () => {
    expect(aiDeckPoolData.schemaVersion).toBeTruthy();
    expect(cardSetAiReadinessData.schemaVersion).toBeTruthy();
    expect(cardSpecAiHintsGeneratedData.schemaVersion).toBeTruthy();
    expect(strategyGoalsData.schemaVersion).toBeTruthy();
    expect(cardSupportAiSupportedData.schemaVersion).toBeTruthy();
    expect(deckFormatProfiles08Data.schemaVersion).toBeTruthy();
    expect(deckFormatProfiles130Data.schemaVersion).toBeTruthy();
    expect(deckSnapshots08Data.schemaVersion).toBeTruthy();
    expect(deckTemplates08Data.schemaVersion).toBeTruthy();
    expect(standardDeckCatalogData.schemaVersion).toBeTruthy();
    expect(standardDeckCurationData.schemaVersion).toBeTruthy();
    expect(standardDeckGuidesData.schemaVersion).toBeTruthy();
    expect(localizedDeCardSkinData.schemaVersion).toBeTruthy();
  });

  it("provides empty release substitutions for legacy demo fixtures", () => {
    expect(releaseProfiles08Data.profiles).toEqual([]);
    expect(releaseSnapshots08Data.snapshots).toEqual([]);
    expect(releaseTemplates08Data.templates).toEqual([]);
  });
});
