import type { CardImplementationDefinition } from "../types";
import { proteusIceAndDataSpecialReportImplementation } from "../proteus/runner/events/ice-and-data-special-report";
import { proteusIdentityDonorImplementation } from "../proteus/runner/events/identity-donor";
import { proteusLiveNewsFeedImplementation } from "../proteus/runner/events/live-news-feed";
import { proteusOnTheFastTrackImplementation } from "../proteus/runner/events/on-the-fast-track";
import { proteusPersonalTouchTheImplementation } from "../proteus/runner/events/personal-touch-the";
import { pirateBroadcastImplementation } from "../proteus/runner/events/pirate-broadcast";
import { proteusPrearrangedDropImplementation } from "../proteus/runner/events/prearranged-drop";
import { promisesPromisesImplementation } from "../proteus/runner/events/promises-promises";
import { proteusReconnaissanceImplementation } from "../proteus/runner/events/reconnaissance";
import { proteusRemoteDetonatorImplementation } from "../proteus/runner/events/remote-detonator";
import { proteusRushHourImplementation } from "../proteus/runner/events/rush-hour";
import { proteusSenatorialFieldTripImplementation } from "../proteus/runner/events/senatorial-field-trip";
import { proteusSubliminalCorruptionImplementation } from "../proteus/runner/events/subliminal-corruption";
import { proteusTestSpinImplementation } from "../proteus/runner/events/test-spin";
import { proteusWeefleInitiationImplementation } from "../proteus/runner/events/weefle-initiation";
import { proteusCorticalCybermodemImplementation } from "../proteus/runner/hardware/cortical-cybermodem";
import { proteusCorticalStimulatorsImplementation } from "../proteus/runner/hardware/cortical-stimulators";
import { proteusDeckTheImplementation } from "../proteus/runner/hardware/deck-the";
import { proteusEurocorpseTmSpinChipImplementation } from "../proteus/runner/hardware/eurocorpse-tm-spin-chip";
import { proteusLucidrineDripFeedImplementation } from "../proteus/runner/hardware/lucidrinetm-drip-feed";

export const CARD_IMPLEMENTATION_GROUP_024 = [
  proteusIceAndDataSpecialReportImplementation,
  proteusIdentityDonorImplementation,
  proteusLiveNewsFeedImplementation,
  proteusOnTheFastTrackImplementation,
  proteusPersonalTouchTheImplementation,
  pirateBroadcastImplementation,
  proteusPrearrangedDropImplementation,
  promisesPromisesImplementation,
  proteusReconnaissanceImplementation,
  proteusRemoteDetonatorImplementation,
  proteusRushHourImplementation,
  proteusSenatorialFieldTripImplementation,
  proteusSubliminalCorruptionImplementation,
  proteusTestSpinImplementation,
  proteusWeefleInitiationImplementation,
  proteusCorticalCybermodemImplementation,
  proteusCorticalStimulatorsImplementation,
  proteusDeckTheImplementation,
  proteusEurocorpseTmSpinChipImplementation,
  proteusLucidrineDripFeedImplementation,
] as const satisfies readonly CardImplementationDefinition[];
