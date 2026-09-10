import { describe, expect, it } from "vitest";
import { aiDeckPoolData } from "./ai-deck-pool";
import { cardSetAiReadinessData } from "./card-set-ai-readiness";
import { cardSpecAiHintsGeneratedData } from "./card-spec-ai-hints";
import { cardSupportAiSupportedData } from "./card-support";
import {
  deckFormatProfiles08Data,
  deckFormatProfiles130Data,
} from "./deck-format-profiles";
import { deckSnapshots08Data, deckTemplates08Data } from "./legacy-demo-decks";
import {
  standardDeckCatalogData,
  standardDeckCurationData,
  standardDeckGuidesData,
} from "./standard-decks";
import { localizedDeCardSkinData } from "./display-assets";
import {
  PRODUCT_DEFAULT_CORP_SNAPSHOT_ID,
  PRODUCT_DEFAULT_RUNNER_SNAPSHOT_ID,
} from "./product-default-decks";
import {
  deckFormatProfiles08Data as releaseProfiles08Data,
  deckSnapshots08Data as releaseSnapshots08Data,
  deckTemplates08Data as releaseTemplates08Data,
} from "./release-deck-fixtures";
import { strategyGoalsData } from "./strategy-goals";

describe("product runtime data authority", () => {
  it("points product defaults at curated standard snapshots", () => {
    expect(PRODUCT_DEFAULT_RUNNER_SNAPSHOT_ID).toBe(
      "standard_standard_runner_bit_denial_lock_1.0.0",
    );
    expect(PRODUCT_DEFAULT_CORP_SNAPSHOT_ID).toBe(
      "standard_standard_corp_cheap_bag_tricks_1.0.0",
    );
  });

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

  it("provides release substitutions without legacy demo decks", () => {
    expect(
      releaseProfiles08Data.profiles.map((profile) => profile.profileId),
    ).toEqual(["local-demo-v0.8"]);
    expect(releaseSnapshots08Data.snapshots).toEqual([]);
    expect(releaseTemplates08Data.templates).toEqual([]);
  });
});
