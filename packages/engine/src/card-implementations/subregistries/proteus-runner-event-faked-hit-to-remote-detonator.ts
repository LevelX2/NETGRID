import type { CardImplementationDefinition } from "../types";
import { proteusFakedHitImplementation } from "../proteus/runner/events/faked-hit";
import { proteusFrameUpImplementation } from "../proteus/runner/events/frame-up";
import { proteusAllHandsImplementation } from "../proteus/runner/events/all-hands";
import { blackmailImplementation } from "../proteus/runner/events/blackmail";
import { proteusCruisingForNetwatchImplementation } from "../proteus/runner/events/cruising-for-netwatch";
import { proteusDecoySignalImplementation } from "../proteus/runner/events/decoy-signal";
import { proteusDemolitionRunImplementation } from "../proteus/runner/events/demolition-run";
import { proteusDisgruntledIceTechnicianImplementation } from "../proteus/runner/events/disgruntled-ice-technician";
import { proteusDroneForADayImplementation } from "../proteus/runner/events/drone-for-a-day";
import { proteusHijackImplementation } from "../proteus/runner/events/hijack";
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

export const PROTEUS_RUNNER_EVENT_FAKED_HIT_TO_REMOTE_DETONATOR_IMPLEMENTATIONS =
  [
    proteusFakedHitImplementation,
    proteusFrameUpImplementation,
    proteusAllHandsImplementation,
    blackmailImplementation,
    proteusCruisingForNetwatchImplementation,
    proteusDecoySignalImplementation,
    proteusDemolitionRunImplementation,
    proteusDisgruntledIceTechnicianImplementation,
    proteusDroneForADayImplementation,
    proteusHijackImplementation,
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
  ] as const satisfies readonly CardImplementationDefinition[];
