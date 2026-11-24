import type {
  ChoiceRequirement,
  LegalAction,
  PlayerView,
  Side,
  VisibleChoiceOption,
  VisibleChoiceRequest,
} from "./index";
import { isRemoteServerId, type ServerId } from "./server-ids";

export type MatchActionId = number;
export type MatchChoiceId = number;
export type MatchChoiceOptionId = number;

export function isMatchOfferId(value: unknown): value is number {
  return isPositiveSafeInteger(value);
}

export function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export const MATCH_CHOICE_OPTION_PRESENTATIONS = [
  "bad_publicity",
  "bid",
  "card",
  "corp_installed_economy_credit",
  "decline",
  "derez",
  "done",
  "draw",
  "herman",
  "jack_out",
  "keep",
  "leave_in_heap",
  "mulligan",
  "pass",
  "pay",
  "pay_1_return_to_grip",
  "pay_credit",
  "redirect",
  "resume_from_rezzed_ice_back",
  "reveal_next",
  "rez",
  "rez_trash_worm",
  "rig",
  "shuffle_grip",
  "skip",
  "take_credit",
  "take_tag",
  "use",
] as const;

export type MatchChoiceOptionPresentation =
  (typeof MATCH_CHOICE_OPTION_PRESENTATIONS)[number];

const optionPresentations = new Set<string>(MATCH_CHOICE_OPTION_PRESENTATIONS);
const optionPresentationPrefixes = [
  ["bid_", "bid"],
  ["card_", "card"],
  ["agenda_", "card"],
  ["ice_", "card"],
  ["breaker_", "card"],
  ["program_", "card"],
  ["hardware_", "card"],
  ["resource_", "card"],
  ["asset_", "card"],
  ["upgrade_", "card"],
  ["corp_installed_economy_credit_", "corp_installed_economy_credit"],
  ["herman_", "herman"],
  ["redirect_", "redirect"],
  ["rez_", "rez"],
] as const satisfies ReadonlyArray<[string, MatchChoiceOptionPresentation]>;

export function choiceOptionPresentationForEngineKey(
  engineKey: string,
): MatchChoiceOptionPresentation | undefined {
  if (optionPresentations.has(engineKey))
    return engineKey as MatchChoiceOptionPresentation;
  return optionPresentationPrefixes.find(([prefix]) =>
    engineKey.startsWith(prefix),
  )?.[1];
}

export function choiceOptionServerForEngineKey(
  engineKey: string,
): ServerId | undefined {
  const serverKey = engineKey.startsWith("fort_")
    ? engineKey.slice(5)
    : engineKey;
  if (
    serverKey === "hq" ||
    serverKey === "rd" ||
    serverKey === "archives" ||
    serverKey === "new_remote" ||
    isRemoteServerId(serverKey)
  )
    return serverKey;
}

export type OfferedChoiceOption = Omit<
  VisibleChoiceOption,
  "id" | "forcedIceRezQuote" | "hqInstallRezOptionQuote"
> & {
  id: MatchChoiceOptionId;
  presentation?: MatchChoiceOptionPresentation;
  serverId?: ServerId;
};

export type OfferedChoiceRequest = Omit<
  VisibleChoiceRequest,
  "choiceId" | "options" | "agendaPurgeArchivesProtectionQuote" | "continuation"
> & {
  choiceId: MatchChoiceId;
  options: OfferedChoiceOption[];
};

export type OfferedChoiceRequirement = Omit<
  ChoiceRequirement,
  "choiceId" | "optionIds"
> & {
  choiceId: MatchChoiceId;
  optionIds: MatchChoiceOptionId[];
};

export type OfferedLegalAction = Omit<
  LegalAction,
  "actionId" | "choiceRequirements" | "corpScoreRecoveryQuote"
> & {
  actionId: MatchActionId;
  choiceRequirements?: OfferedChoiceRequirement[];
};

export type OfferedPlayerView = Omit<
  PlayerView,
  "legalActions" | "pendingChoice" | "corpPunishRouteQuoteSet"
> & {
  legalActions: OfferedLegalAction[];
  pendingChoice?: OfferedChoiceRequest;
};

export type MatchChoiceSelection = {
  choiceId: MatchChoiceId;
  selectedOptionIds: MatchChoiceOptionId[];
  selectedOptionAmounts?: number[];
};

export type MatchActionSubmission = {
  matchId: string;
  side: Side;
  actionId: MatchActionId;
  clientKnownStateVersion: number;
  clientKnownMatchVersion: number;
  idempotencyKey: string;
  selectedTargets?: Record<string, string>;
  selectedChoices?: MatchChoiceSelection;
};
