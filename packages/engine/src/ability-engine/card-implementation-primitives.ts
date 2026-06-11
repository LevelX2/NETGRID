import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type {
  CardScoredAgendaImplementation,
  CardSuccessfulRunFollowupImplementation,
} from "./definition-types";

export type SuccessfulRunBeforeAccessEffect = Extract<
  CardSuccessfulRunFollowupImplementation,
  { kind: "successful_run_before_access_effect" }
>;

export type ScoredRezzedIceMarkModifier = Extract<
  CardScoredAgendaImplementation,
  { kind: "select_rezzed_ice_mark_modifier" }
>;

export type HqToNewRemoteInstallRezSequence = Extract<
  CardScoredAgendaImplementation,
  { kind: "score_install_hq_cards_into_new_remote_then_rez" }
>;

export type CardImplementationPrimitiveKind =
  | SuccessfulRunBeforeAccessEffect["kind"]
  | ScoredRezzedIceMarkModifier["kind"]
  | HqToNewRemoteInstallRezSequence["kind"];

export type CardImplementationEffectKind =
  | SuccessfulRunBeforeAccessEffect["effect"]["kind"]
  | "mark_modifier"
  | "install_rez_sequence";

type PrimitivePayload = NonNullable<LegalAction["payload"]>;

export function cardImplementationPrimitivePayload(input: {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  primitiveKind: CardImplementationPrimitiveKind;
  effectKind?: CardImplementationEffectKind;
}): PrimitivePayload {
  const effectSuffix = input.effectKind ? `:${input.effectKind}` : "";
  return {
    cardImplementationAbilityId: `${input.sourceDefinitionId}:${input.primitiveKind}${effectSuffix}`,
    cardImplementationPrimitiveKind: input.primitiveKind,
    ...(input.effectKind
      ? { cardImplementationEffectKind: input.effectKind }
      : {}),
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
  };
}

export function hiddenSuccessfulRunBeforeAccessEffect(
  input:
    | {
        server: "hq";
        effect: { kind: "corp_lose_credits"; amount: number };
      }
    | {
        server: "remote";
        effect: { kind: "trash_remote_fort"; include: "root_and_ice" };
      },
): SuccessfulRunBeforeAccessEffect {
  return {
    kind: "successful_run_before_access_effect",
    timing: "immediately_after_successful_run_before_access",
    server: input.server,
    source: "installed_hidden_runner_resource",
    cost: { kind: "reveal_and_tap_source" },
    effect: input.effect,
    visibility: "hidden_info_barrier",
  } as SuccessfulRunBeforeAccessEffect;
}

export function scoredRezzedIceMarkModifier(): ScoredRezzedIceMarkModifier {
  return {
    kind: "select_rezzed_ice_mark_modifier",
    target: "rezzed_installed_ice",
    counterType: "mark",
    counterAmount: 1,
    strengthBonusPerCounter: 1,
    duplicateEachPrintedSubroutinePerCounter: true,
    visibility: "public",
  };
}

export function hqToNewRemoteInstallRezSequence(input: {
  maxCards: number;
  temporaryCredits: number;
}): HqToNewRemoteInstallRezSequence {
  return {
    kind: "score_install_hq_cards_into_new_remote_then_rez",
    sourceZone: "hq",
    targetServer: "new_remote",
    allowedCards: "corp_installable",
    maxCards: input.maxCards,
    temporaryCredits: {
      amount: input.temporaryCredits,
      usableFor: "rez_installed_cards_from_sequence",
      returnUnused: true,
    },
    optionalRez: true,
    visibility: "hidden_info_barrier",
  };
}
