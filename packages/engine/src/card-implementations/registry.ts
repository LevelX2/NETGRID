import type { CardDefinitionId } from "@netgrid/shared";
import { dataMasonsHostingImplementation } from "./onr-v1/corp/assets/data-masons-hosting";
import { encoderIncImplementation } from "./onr-v1/corp/assets/encoder-inc";
import { fortressArchitectsImplementation } from "./onr-v1/corp/assets/fortress-architects";
import { skaldervikenSaBetaTestSiteImplementation } from "./onr-v1/corp/assets/skalderviken-sa-beta-test-site";
import { accountsReceivableImplementation } from "./onr-v1/corp/operations/accounts-receivable";
import { annualReviewsImplementation } from "./onr-v1/corp/operations/annual-reviews";
import { dayShiftImplementation } from "./onr-v1/corp/operations/day-shift";
import { efficiencyExpertsImplementation } from "./onr-v1/corp/operations/efficiency-experts";
import { nightShiftImplementation } from "./onr-v1/corp/operations/night-shift";
import { jerusalemCityGridImplementation } from "./onr-v1/corp/upgrades/jerusalem-city-grid";
import { bodyweightSyntheticBloodImplementation } from "./onr-v1/runner/preps/bodyweight-synthetic-blood";
import { jackNJoeImplementation } from "./onr-v1/runner/preps/jack-n-joe";
import { livewiresContactsImplementation } from "./onr-v1/runner/preps/livewires-contacts";
import { scoreImplementation } from "./onr-v1/runner/preps/score";
import type { CardImplementationDefinition } from "./types";

export const CARD_IMPLEMENTATIONS = [
  bodyweightSyntheticBloodImplementation,
  jackNJoeImplementation,
  livewiresContactsImplementation,
  scoreImplementation,
  accountsReceivableImplementation,
  annualReviewsImplementation,
  dayShiftImplementation,
  efficiencyExpertsImplementation,
  nightShiftImplementation,
  dataMasonsHostingImplementation,
  encoderIncImplementation,
  skaldervikenSaBetaTestSiteImplementation,
  fortressArchitectsImplementation,
  jerusalemCityGridImplementation,
] as const satisfies readonly CardImplementationDefinition[];

export const CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, CardImplementationDefinition>
> = Object.fromEntries(
  CARD_IMPLEMENTATIONS.map((implementation) => [
    implementation.cardDefinitionId,
    implementation,
  ]),
);

export function cardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}
