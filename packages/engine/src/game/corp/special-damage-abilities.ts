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
  if (implementation?.kind === "i_got_a_rock_tagged_meat_damage") {
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
            v1920AssetAbility: "i_got_a_rock_tagged_meat_damage",
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
  if (implementation?.kind === "schlaghund_tag_die_meat_damage") {
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
    "i_got_a_rock_tagged_meat_damage"
  ) {
    const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
    handleIGotARockAction(host, sourceCardId);
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

function handleIGotARockAction(
  host: CorpSpecialDamageAbilityHost,
  sourceCardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf I Got a Rock nutzen.");
  if (!host.cards.rezzedCorpRootCardIds().includes(sourceCardId))
    throw new Error("I Got a Rock ist nicht rezzed installiert.");
  const definition = host.cards.definitionFor(sourceCardId);
  const implementation =
    host.cards.uniqueDirectLongtailImplementationForDefinition(definition.id);
  if (implementation?.kind !== "i_got_a_rock_tagged_meat_damage")
    throw new Error("Die I-Got-a-Rock-Faehigkeit passt nicht zur Karte.");
  if (host.state.runner.tags < implementation.requiredRunnerTags)
    throw new Error("I Got a Rock verlangt mindestens zwei Runner-Tags.");
  const forfeitedAgendaIds = chooseCorpAgendasForPointCost(
    host,
    implementation.agendaPointCost,
  );
  const paidPoints = forfeitedAgendaIds.reduce(
    (sum, cardId) => sum + host.agendaPoints.pointsForScoredCard(cardId),
    0,
  );
  if (paidPoints < implementation.agendaPointCost)
    throw new Error("I Got a Rock braucht 3 Agenda-Punkte.");
  const forfeitedDefinitionIds = forfeitedAgendaIds
    .map((cardId) => host.cards.definitionFor(cardId).id)
    .join(",");
  for (const agendaId of forfeitedAgendaIds) {
    host.agendaPoints.forfeitCorpAgendaForPointCost(agendaId);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1920AssetAbility: "i_got_a_rock_tagged_meat_damage",
    sourceDefinitionId: definition.id,
    sourceCardId,
    runnerTagsBefore: host.state.runner.tags,
    agendaPointCost: implementation.agendaPointCost,
    agendaPointCostPaid: paidPoints,
    forfeitedAgendaDefinitionIds: forfeitedDefinitionIds,
    specialZone: "removed_from_game",
    specialZoneVisibility: "public",
    specialZoneReason: "v1920_i_got_a_rock",
  };
  host.damage.resolveDamageOperation(
    implementation.damageType,
    implementation.damageAmount,
    definition.id,
  );
}

function chooseCorpAgendasForPointCost(
  host: CorpSpecialDamageAbilityHost,
  requiredPoints: number,
): CardInstanceId[] {
  let total = 0;
  const selected: CardInstanceId[] = [];
  for (const cardId of host.agendaPoints.scoredForfeitTargets()) {
    selected.push(cardId);
    total += host.agendaPoints.pointsForScoredCard(cardId);
    if (total >= requiredPoints) return selected;
  }
  return [];
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
  if (implementation?.kind !== "schlaghund_tag_die_meat_damage")
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
