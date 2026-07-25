import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";
import { corpVisibleCardPlayCost } from "./corp-tag-punish-payoff-profiles";

type CorpTagPunishAssessment = {
  isPunishPayoff: boolean;
  isTagSource?: boolean;
};

type CorpTagSourceProfile = {
  tagSource?: boolean;
  requiresScoredAgenda?: boolean;
};

export type CorpTagSourcePayoffContextDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  visibleMeatDamagePayoff: (input: AiDecisionInput) => boolean;
  tagPunishAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTagPunishAssessment | undefined;
  tagSourceProfileForDefinition: (
    definitionId: string | undefined,
  ) => CorpTagSourceProfile | undefined;
  payoffProfileForDefinition: (definitionId: string) => unknown | undefined;
};

export function createCorpTagSourcePayoffContext(
  dependencies: CorpTagSourcePayoffContextDependencies,
): {
  corpImmediateTagSourceVisiblePayoffProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  corpImmediateTagSourceAvailable: (
    input: AiDecisionInput,
    excludedAction?: LegalAction,
  ) => boolean;
  corpImmediateTagSourceAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpPersistentTagEngineVisiblePayoffProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  corpUnprotectedPersistentTagAssetSetup: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpVisibleTagPunishPayoffKind: (
    input: AiDecisionInput,
  ) => "damage" | "economic" | "trash" | undefined;
  corpOntologyPayoffAvailableForTagSource: (
    input: AiDecisionInput,
    sourceAction: LegalAction,
  ) => boolean;
} {
  const corpImmediateTagSourceAction = (
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean => {
    if (
      input.side !== "corp" ||
      action.side !== "corp" ||
      action.type !== "play_operation"
    )
      return false;
    return (
      dependencies.tagPunishAssessmentForAction(input, action)?.isTagSource ===
      true
    );
  };

  const corpVisibleTagPunishPayoffKind = (
    input: AiDecisionInput,
  ): "damage" | "economic" | "trash" | undefined => {
    if (dependencies.visibleMeatDamagePayoff(input)) return "damage";
    if (
      input.playerView.own.gripOrHq.some(
        (card) =>
          card.known &&
          card.definitionId &&
          dependencies.payoffProfileForDefinition(card.definitionId),
      )
    )
      return "economic";
    return undefined;
  };

  const corpImmediateTagSourceVisiblePayoffProfile = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpTaggedRunnerPayoffActionProfile | undefined => {
    if (!corpImmediateTagSourceAction(input, action)) return undefined;
    const payoffKind = corpVisibleTagPunishPayoffKind(input);
    if (!payoffKind) return undefined;
    const sameTurnDamageConversion =
      payoffKind === "damage"
        ? corpSameTurnDamageConversionAfterTagSource(
            input,
            action,
            dependencies,
          )
        : undefined;
    return {
      kind: "tag_source",
      value: sameTurnDamageConversion
        ? 4300
        : payoffKind === "damage"
          ? 2350
          : 1750,
      evidence: [
        "corp_tag_source_visible_payoff_pressure:true",
        `corp_visible_tag_punish_payoff_kind:${payoffKind}`,
        "immediate_operation_tag_source_available:true",
        ...(sameTurnDamageConversion
          ? [
              "corp_tag_source_same_turn_damage_conversion:true",
              `conversion_target:${sameTurnDamageConversion.definitionId}`,
              `conversion_cost:${sameTurnDamageConversion.cost}`,
              `conversion_funding_clicks:${sameTurnDamageConversion.fundingClicks}`,
            ]
          : []),
      ],
    };
  };

  const corpImmediateTagSourceAvailable = (
    input: AiDecisionInput,
    excludedAction?: LegalAction,
  ): boolean =>
    input.legalActions.some(
      (action) =>
        action.actionId !== excludedAction?.actionId &&
        corpImmediateTagSourceAction(input, action),
    );

  const corpUnprotectedPersistentTagAssetSetup = (
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean => {
    if (
      action.type !== "install_card" &&
      action.type !== "rez_ice" &&
      action.type !== "rez_card"
    )
      return false;
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    const profile =
      dependencies.tagSourceProfileForDefinition(sourceDefinitionId);
    if (!profile) return false;

    // Installing or rezzing creates a persistent board source, but it can never
    // activate an effect whose rules contract requires the card to be scored.
    // Such effects become available through later score-area abilities instead.
    return profile.requiresScoredAgenda !== true;
  };

  const corpPersistentTagEngineVisiblePayoffProfile = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpTaggedRunnerPayoffActionProfile | undefined => {
    if (!corpUnprotectedPersistentTagAssetSetup(input, action)) {
      return undefined;
    }
    const payoffKind = corpVisibleTagPunishPayoffKind(input);
    if (!payoffKind) return undefined;
    return {
      kind: "tag_source",
      value: payoffKind === "damage" ? 1850 : 1650,
      evidence: [
        "corp_persistent_tag_engine_activation:true",
        `corp_visible_tag_punish_payoff_kind:${payoffKind}`,
        `engine_action:${action.type}`,
      ],
    };
  };

  const corpOntologyPayoffAvailableForTagSource = (
    input: AiDecisionInput,
    sourceAction: LegalAction,
  ): boolean => {
    if (input.side !== "corp") return false;
    if (
      input.legalActions.some((action) => {
        if (action.actionId === sourceAction.actionId) return false;
        return dependencies.tagPunishAssessmentForAction(input, action)
          ?.isPunishPayoff;
      })
    )
      return true;
    const archivedCardIds = new Set(
      input.playerView.own.heapOrArchives.map((card) => card.instanceId),
    );
    return [
      ...input.playerView.own.gripOrHq,
      ...input.playerView.own.scoreArea,
      ...input.playerView.servers.flatMap((server) => [
        ...server.ice.filter((card) => !archivedCardIds.has(card.instanceId)),
        ...server.root.filter((card) => !archivedCardIds.has(card.instanceId)),
      ]),
    ].some((card) =>
      Boolean(
        card.known &&
        card.definitionId &&
        dependencies.payoffProfileForDefinition(card.definitionId),
      ),
    );
  };

  return {
    corpImmediateTagSourceVisiblePayoffProfile,
    corpImmediateTagSourceAvailable,
    corpImmediateTagSourceAction,
    corpPersistentTagEngineVisiblePayoffProfile,
    corpUnprotectedPersistentTagAssetSetup,
    corpVisibleTagPunishPayoffKind,
    corpOntologyPayoffAvailableForTagSource,
  };
}

function corpSameTurnDamageConversionAfterTagSource(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: Pick<
    CorpTagSourcePayoffContextDependencies,
    "payoffProfileForDefinition"
  >,
): { definitionId: string; cost: number; fundingClicks: number } | undefined {
  const clicksAfterSource =
    input.playerView.own.clicks - corpActionCost(action, "clicks");
  const creditsAfterSource =
    input.playerView.own.credits - corpActionCost(action, "credits");
  if (clicksAfterSource <= 0 || creditsAfterSource < 0) return undefined;

  return input.playerView.own.gripOrHq
    .map((card) => {
      if (
        !card.known ||
        !card.definitionId ||
        card.type !== "operation" ||
        !payoffProfileIncludesDamage(
          dependencies.payoffProfileForDefinition(card.definitionId),
        )
      ) {
        return undefined;
      }
      const cost = corpVisibleCardPlayCost(card);
      if (cost === undefined) return undefined;
      const fundingClicks = Math.max(0, cost - creditsAfterSource);
      if (clicksAfterSource < fundingClicks + 1) return undefined;
      return { definitionId: card.definitionId, cost, fundingClicks };
    })
    .filter(
      (
        target,
      ): target is {
        definitionId: string;
        cost: number;
        fundingClicks: number;
      } => target !== undefined,
    )
    .sort(
      (left, right) =>
        left.fundingClicks - right.fundingClicks ||
        right.cost - left.cost ||
        left.definitionId.localeCompare(right.definitionId),
    )[0];
}

function corpActionCost(
  action: LegalAction,
  kind: "clicks" | "credits",
): number {
  return action.costs.reduce((sum, cost) => sum + (cost[kind] ?? 0), 0);
}

function payoffProfileIncludesDamage(profile: unknown): boolean {
  if (!profile || typeof profile !== "object") return false;
  const payoffKinds = (profile as { payoffKinds?: unknown }).payoffKinds;
  return (
    Array.isArray(payoffKinds) &&
    payoffKinds.some(
      (kind) => kind === "damage" || kind === "scored_agenda_damage_like",
    )
  );
}
