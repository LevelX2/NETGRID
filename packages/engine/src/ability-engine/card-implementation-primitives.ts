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

/**
 * @contract Builds read-only CardImplementation primitive metadata for
 * LegalAction and AI projection.
 * @authority Does not create legality; runtime resolvers still revalidate side,
 * source, timing, costs, targets and choices.
 * @visibility Actor-private source ids must not be copied into public events or
 * opponent views.
 */
export function cardImplementationPrimitivePayload(input: {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  primitiveKind: CardImplementationPrimitiveKind;
  effectKind?: CardImplementationEffectKind;
  abilityKey?: string | undefined;
}): PrimitivePayload {
  const abilityKey =
    input.abilityKey ?? defaultCardImplementationAbilityKey(input);
  return {
    cardImplementationAbilityId: `${input.sourceDefinitionId}:${abilityKey}`,
    cardImplementationAbilityKey: abilityKey,
    cardImplementationPrimitiveKind: input.primitiveKind,
    ...(input.effectKind
      ? { cardImplementationEffectKind: input.effectKind }
      : {}),
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
  };
}

function defaultCardImplementationAbilityKey(input: {
  primitiveKind: CardImplementationPrimitiveKind;
  effectKind?: CardImplementationEffectKind;
}): string {
  if (input.primitiveKind === "successful_run_before_access_effect")
    return "successful_run_before_access:0";
  if (input.primitiveKind === "select_rezzed_ice_mark_modifier")
    return "scored_ice_mark:0";
  if (input.primitiveKind === "score_install_hq_cards_into_new_remote_then_rez")
    return "hq_to_new_remote_install_rez:0";
  const effectSuffix = input.effectKind ? `:${input.effectKind}` : "";
  return `${input.primitiveKind}${effectSuffix}:0`;
}

export function hiddenSuccessfulRunBeforeAccessEffect(
  input:
    | {
        server: "hq";
        effect: { kind: "corp_lose_credits"; amount: number };
        abilityKey?: string;
      }
    | {
        server: "remote";
        effect: { kind: "trash_remote_fort"; include: "root_and_ice" };
        abilityKey?: string;
      },
): SuccessfulRunBeforeAccessEffect {
  return {
    kind: "successful_run_before_access_effect",
    abilityKey: input.abilityKey ?? "successful_run_before_access:0",
    timing: "immediately_after_successful_run_before_access",
    server: input.server,
    source: "installed_hidden_runner_resource",
    cost: { kind: "reveal_and_tap_source" },
    effect: input.effect,
    visibility: "hidden_info_barrier",
  } as SuccessfulRunBeforeAccessEffect;
}

export function scoredRezzedIceMarkModifier(
  input: {
    abilityKey?: string;
  } = {},
): ScoredRezzedIceMarkModifier {
  return {
    kind: "select_rezzed_ice_mark_modifier",
    abilityKey: input.abilityKey ?? "scored_ice_mark:0",
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
  abilityKey?: string;
}): HqToNewRemoteInstallRezSequence {
  return {
    kind: "score_install_hq_cards_into_new_remote_then_rez",
    abilityKey: input.abilityKey ?? "hq_to_new_remote_install_rez:0",
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
