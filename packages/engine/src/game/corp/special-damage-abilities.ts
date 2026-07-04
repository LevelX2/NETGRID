import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
  Side,
} from "@netgrid/shared";
import type { CardUniqueDirectLongtailImplementation } from "../../ability-engine/definition-types";

type SpecialDamagePayload = Record<string, string | number | boolean>;

type AgendaPointSpendResult = {
  paidPoints: number;
  bonusPointsSpent: number;
  spentAgendaIds: CardInstanceId[];
  spentAgendaDefinitionIds: CardDefinitionId[];
};

export type CorpSpecialDamageAbilityHost = {
  state: GameState;
  legalAction?: LegalAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    uniqueDirectLongtailImplementationForCard: (
      cardId: CardInstanceId,
    ) => CardUniqueDirectLongtailImplementation | undefined;
    uniqueDirectLongtailImplementationForDefinition: (
      definitionId: CardDefinitionId,
    ) => CardUniqueDirectLongtailImplementation | undefined;
    rezzedCorpRootCardIds: () => CardInstanceId[];
  };
  actions: {
    buildLegalAction: (
      side: Side,
      type: LegalAction["type"],
      label: string,
      source: CardInstanceId,
      costs: LegalAction["costs"],
      payload: LegalAction["payload"],
    ) => LegalAction;
  };
  agendaPoints: {
    total: () => number;
    scoredForfeitTargets: () => CardInstanceId[];
    pointsForScoredCard: (cardId: CardInstanceId) => number;
    forfeitCorpAgendaForPointCost: (cardId: CardInstanceId) => void;
    spendPointCost: (requiredPoints: number) => AgendaPointSpendResult;
  };
  damage: {
    resolveDamageOperation: (
      damageType: DamageType,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
  };
  rng: {
    rollDie: (purpose: string) => number;
    randomCounter: () => number;
  };
  trash: {
    trashCorpInstalledCardToArchives: (cardId: CardInstanceId) => void;
  };
};

export type CorpSpecialDamageAbilityLegalActionResult = {
  handled: boolean;
  actions: LegalAction[];
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
};

export type CorpSpecialDamageAbilityExecutionResult = {
  handled: boolean;
  stateChanged?: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  damageType?: DamageType;
  damageAmount?: number;
  dieRoll?: number;
  sourceTrashed?: boolean;
  resolvedPayload?: SpecialDamagePayload;
  resolvedEffects?: ResolvedGameEffect[];
};

export function buildCorpSpecialDamageAbilityActionsForCard(
  host: CorpSpecialDamageAbilityHost,
  sourceCardId: CardInstanceId,
): CorpSpecialDamageAbilityLegalActionResult {
  const definition = host.cards.definitionFor(sourceCardId);
  const implementation =
    host.cards.uniqueDirectLongtailImplementationForCard(sourceCardId);
  if (implementation?.kind === "tagged_meat_damage") {
    if (
      host.state.runner.tags < implementation.requiredRunnerTags ||
      host.agendaPoints.total() < implementation.agendaPointCost
    )
      return {
        handled: true,
        actions: [],
        sourceCardId,
        sourceDefinitionId: definition.id,
      };
    return {
      handled: true,
      actions: [
        host.actions.buildLegalAction(
          "corp",
          "gain_credit",
          `${definition.title}: ${implementation.damageAmount} Meat Damage`,
          sourceCardId,
          [{ clicks: 1 }],
          {
            cardId: sourceCardId,
            v1920AssetAbility: "tagged_meat_damage",
            agendaPointCost: implementation.agendaPointCost,
            damageType: implementation.damageType,
            damageAmount: implementation.damageAmount,
          },
        ),
      ],
      sourceCardId,
      sourceDefinitionId: definition.id,
    };
  }
  if (implementation?.kind === "tag_threshold_meat_damage_asset") {
    return {
      handled: true,
      actions: [
        host.actions.buildLegalAction(
          "corp",
          "gain_credit",
          `${definition.title}: Wuerfel gegen Tags werfen`,
          sourceCardId,
          [{ clicks: 1 }],
          { cardId: sourceCardId, v1921AssetAbility: "schlaghund_tag_damage" },
        ),
      ],
      sourceCardId,
      sourceDefinitionId: definition.id,
    };
  }
  return { handled: false, actions: [] };
}

export function handleCorpSpecialDamageAbilityAction(
  host: CorpSpecialDamageAbilityHost,
): CorpSpecialDamageAbilityExecutionResult {
  const legalAction = host.legalAction;
  if (!legalAction || legalAction.type !== "gain_credit") return { handled: false };
  if (
    legalAction.payload?.v1920AssetAbility ===
    "tagged_meat_damage"
  ) {
    const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
    handleTaggedMeatDamageAction(host, sourceCardId);
    return {
      handled: true,
      stateChanged: true,
      sourceCardId,
      sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
      damageType: "meat",
      damageAmount: Number(legalAction.payload?.damageAmount ?? 15),
      resolvedPayload: legalAction.payload as SpecialDamagePayload,
      ...(legalAction.resolvedEffects
        ? { resolvedEffects: legalAction.resolvedEffects }
        : {}),
    };
  }
  if (legalAction.payload?.v1921AssetAbility === "deterministic_die_probe") {
    throw new Error("Schlaghund nutzt keine Wuerfelprobe mehr.");
  }
  if (legalAction.payload?.v1921AssetAbility === "schlaghund_tag_damage") {
    const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
    handleSchlaghundAction(host, sourceCardId);
    return {
      handled: true,
      stateChanged: true,
      sourceCardId,
      sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
      damageType: "meat",
      damageAmount: Number(legalAction.payload?.damageAmount ?? 10),
      dieRoll: Number(legalAction.payload?.v1921DieRoll ?? 0),
      sourceTrashed: legalAction.payload?.selfTrashed === true,
      resolvedPayload: legalAction.payload as SpecialDamagePayload,
      ...(legalAction.resolvedEffects
        ? { resolvedEffects: legalAction.resolvedEffects }
        : {}),
    };
  }
  return { handled: false };
}

function handleTaggedMeatDamageAction(
  host: CorpSpecialDamageAbilityHost,
  sourceCardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf diese Tagged-Damage-Faehigkeit nutzen.");
  if (!host.cards.rezzedCorpRootCardIds().includes(sourceCardId))
    throw new Error("Die Tagged-Damage-Faehigkeit ist nicht rezzed installiert.");
  const definition = host.cards.definitionFor(sourceCardId);
  const implementation =
    host.cards.uniqueDirectLongtailImplementationForDefinition(definition.id);
  if (implementation?.kind !== "tagged_meat_damage")
    throw new Error("Die Tagged-Damage-Faehigkeit passt nicht zur Karte.");
  if (host.state.runner.tags < implementation.requiredRunnerTags)
    throw new Error("Die Tagged-Damage-Faehigkeit verlangt mehr Runner-Tags.");
  const costResult = host.agendaPoints.spendPointCost(
    implementation.agendaPointCost,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1920AssetAbility: "tagged_meat_damage",
    sourceDefinitionId: definition.id,
    sourceCardId,
    runnerTagsBefore: host.state.runner.tags,
    agendaPointCost: implementation.agendaPointCost,
    agendaPointCostPaid: costResult.paidPoints,
    ...(costResult.bonusPointsSpent > 0
      ? { corpBonusAgendaPointsSpent: costResult.bonusPointsSpent }
      : {}),
    ...(costResult.spentAgendaDefinitionIds.length > 0
      ? {
          spentAgendaDefinitionIds:
            costResult.spentAgendaDefinitionIds.join(","),
        }
      : {}),
  };
  host.damage.resolveDamageOperation(
    implementation.damageType,
    implementation.damageAmount,
    definition.id,
  );
}

function handleSchlaghundAction(
  host: CorpSpecialDamageAbilityHost,
  sourceCardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf V1.9.21-Asset-Zufall nutzen.");
  if (!host.cards.rezzedCorpRootCardIds().includes(sourceCardId))
    throw new Error(
      "Die V1.9.21-Asset-Zufallsfaehigkeit ist nicht rezzed installiert.",
    );
  const definition = host.cards.definitionFor(sourceCardId);
  const implementation =
    host.cards.uniqueDirectLongtailImplementationForDefinition(definition.id);
  if (implementation?.kind !== "tag_threshold_meat_damage_asset")
    throw new Error(
      "Die V1.9.21-Asset-Zufallsfaehigkeit passt nicht zur Karte.",
    );
  const randomPurpose = `v1921.die.${definition.id}.tag_damage`;
  const dieRoll = host.rng.rollDie(randomPurpose);
  const runnerTags = host.state.runner.tags;
  const tagThresholdMet = runnerTags >= dieRoll;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    randomPurpose,
    v1921DieRoll: dieRoll,
    runnerTags,
    tagThresholdMet,
    randomCounterAfter: host.rng.randomCounter(),
  };
  if (!tagThresholdMet) return;
  host.damage.resolveDamageOperation(
    implementation.damageType,
    implementation.damageAmount,
    definition.id,
  );
  if (!host.state.pendingChoice) {
    host.trash.trashCorpInstalledCardToArchives(sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      selfTrashed: true,
    };
  }
}

function requireLegalAction(host: CorpSpecialDamageAbilityHost): LegalAction {
  if (!host.legalAction) throw new Error("LegalAction fehlt.");
  return host.legalAction;
}
