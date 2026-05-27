import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  RunState,
} from "@netgrid/shared";
import { dynamicSubroutineAttributionFor } from "../../ability-engine/additional-subroutine-modifiers";
import { normalizeSubtypeLabel } from "../../ability-engine/card-implementation-modifiers";
import {
  icebreakerAbilitiesForDefinition,
  type RuntimeIcebreakerAbility,
} from "../../ability-engine/icebreaker-abilities";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  BLINK_ID,
  MYSTERY_BOX_ID,
  PILE_DRIVER_ID,
  SELF_MODIFYING_CODE_ID,
} from "../../compatibility/runtime-compatibility";
import { AI_BOON_RANDOM_BREAKER_CARD_ID } from "../../mechanics/random-effects";
import {
  buildRunnerSelfModifyingCodeInstallAction,
} from "../turn/runner-special-zone-install-actions";

type ActiveRun = NonNullable<GameState["run"]>;
type Subroutine = NonNullable<CardDefinition["subroutines"]>[number];
type BreakSubroutineCostBreakdown = {
  baseCost: number;
  legacyRunAdditionalCost: number;
  runnerHardwareAdditionalCost: number;
  cardImplementationAdditionalCost: number;
  additionalCost: number;
  totalCost: number;
  publicPayload: NonNullable<LegalAction["payload"]>;
};

export type RunnerEncounterActionHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    cardCounter: (cardId: CardInstanceId, counterType: string) => number;
    effectiveSubtypesForCard: (
      cardId: CardInstanceId,
      definition?: CardDefinition,
    ) => string[];
    hostedProgramStrengthModifier: (cardId: CardInstanceId) => number;
    publicServerLabel: (serverId: ActiveRun["attackedServerId"]) => string | undefined;
  };
  run: {
    currentRun: () => ActiveRun;
    currentEncounterSubroutines: (
      iceDefinition: CardDefinition,
    ) => NonNullable<CardDefinition["subroutines"]>;
    runnerDuringRunCardImplementationLegalActions: () => LegalAction[];
    runRemainderStrengthBonusForBreaker: (breakerId: CardInstanceId) => number;
    canUseBreakerOnCurrentFort: (breakerId: CardInstanceId) => boolean;
  };
  ice: {
    strengthForIce: (iceId: CardInstanceId) => number;
  };
  breaker: {
    dupreStrengthCounterBonus: (breakerId: CardInstanceId) => number;
    runnerStealthRecurringCredits: () => number;
  };
  payment: {
    availableRunnerRunCredits: (breakerId?: CardInstanceId) => number;
    runJackOutAdditionalCost: (run: ActiveRun) => number;
  };
  actions: {
    buildLegalAction: (
      type: LegalAction["type"],
      label: string,
      source: LegalAction["source"],
      costs?: LegalAction["costs"],
      payload?: LegalAction["payload"],
      metadata?: Partial<
        Pick<LegalAction, "abilityRef" | "effectRef" | "targetRequirements">
      >,
    ) => LegalAction;
    abilityMetadata: (
      sourceCardInstanceId: CardInstanceId,
      abilityId: string,
      encounteredIceId?: CardInstanceId,
    ) => Pick<LegalAction, "abilityRef" | "effectRef" | "targetRequirements">;
  };
  costs: {
    breakSubroutineCostBreakdown: (
      baseCost: number,
      subroutineCount?: number,
    ) => BreakSubroutineCostBreakdown;
  };
  callbacks: {
    postPassSpecialWindowActions: () => LegalAction[];
  };
};

export type RunnerEncounterActionBuildResult = {
  legalActions: LegalAction[];
  handled: boolean;
  encounterId?: string;
  iceId?: CardInstanceId;
};

export type RunnerMovementActionBuildResult = {
  legalActions: LegalAction[];
  handled: boolean;
};

export function buildRunnerEncounterActions(
  host: RunnerEncounterActionHost,
): RunnerEncounterActionBuildResult {
  const run = host.run.currentRun();
  if (!run.encounteredIceId) return { handled: true, legalActions: [] };
  const encounteredIceId = run.encounteredIceId;
  const iceDefinition = host.cards.definitionFor(run.encounteredIceId);
  const encounterSubroutines =
    host.run.currentEncounterSubroutines(iceDefinition);
  const encounteredIceSubtypes = host.cards.effectiveSubtypesForCard(
    encounteredIceId,
    iceDefinition,
  );
  const encounteredIceStrength = host.ice.strengthForIce(encounteredIceId);
  const actions: LegalAction[] = [];
  actions.push(...host.run.runnerDuringRunCardImplementationLegalActions());
  actions.push(...selfModifyingCodeEncounterActions(host));
  for (const breakerId of host.state.runner.rig.programs) {
    const breaker = host.cards.definitionFor(breakerId);
    if (run.prohibitNoisyIcebreakers && breaker.subtypes.includes("noisy"))
      continue;
    if (!host.run.canUseBreakerOnCurrentFort(breakerId)) continue;
    const breakerBaseStrength =
      typeof run.aiBoonRunStrengthByBreaker?.[breakerId] === "number"
        ? run.aiBoonRunStrengthByBreaker[breakerId]
        : breaker.id === AI_BOON_RANDOM_BREAKER_CARD_ID &&
            typeof run.aiBoonRunStrength === "number"
          ? run.aiBoonRunStrength
          : (breaker.strength ?? 0);
    const breakerStrength =
      breakerBaseStrength +
      host.cards.cardInstanceFor(breakerId).strengthModifier +
      host.cards.hostedProgramStrengthModifier(breakerId) +
      host.cards.cardCounter(breakerId, "militech") +
      host.cards.cardCounter(breakerId, "pattel_antibody") * -1 +
      host.breaker.dupreStrengthCounterBonus(breakerId) +
      host.run.runRemainderStrengthBonusForBreaker(breakerId);
    const breakerAbilities = icebreakerAbilitiesForDefinition(breaker);
    const breakAbilities = breakerAbilities.filter(
      (ability) =>
        ability.type === "break_subroutine" &&
        breakAbilityMatchesIce(ability, encounteredIceSubtypes),
    );
    const hasEligibleBreakTarget = breakAbilities.some((ability) =>
      encounterSubroutines.some(
        (subroutine, index) =>
          breakAbilityMatchesSubroutine(ability, subroutine) &&
          !run.brokenSubroutineIndexes.includes(index) &&
          !run.resolvedSubroutineIndexes.includes(index),
      ),
    );
    const pump = breakerAbilities.find(
      (ability) => ability.type === "pump_strength",
    );
    if (
      pump &&
      !run.noBreakSubroutinesActive &&
      hasEligibleBreakTarget &&
      host.payment.availableRunnerRunCredits(breakerId) >= pump.cost.credits
    ) {
      const variableStrength = pump.variableStrength;
      if (variableStrength) {
        const maxAmount = Math.max(
          0,
          Math.floor(host.payment.availableRunnerRunCredits(breakerId)),
        );
        for (
          let amount = Math.max(1, Math.floor(variableStrength.min));
          amount <= maxAmount;
          amount += 1
        ) {
          actions.push(
            host.actions.buildLegalAction(
              "pump_breaker",
              `${breaker.title}: Stärke +${amount}`,
              breakerId,
              [{ credits: amount }],
              {
                breakerId,
                iceId: encounteredIceId,
                pumpAmount: amount,
                futureActionDebtAdded: amount,
              },
              host.actions.abilityMetadata(breakerId, pump.id, encounteredIceId),
            ),
          );
        }
      } else {
        actions.push(
          host.actions.buildLegalAction(
            "pump_breaker",
            `${breaker.title}: Stärke +${pump.amount ?? 1}`,
            breakerId,
            [{ credits: pump.cost.credits }],
            { breakerId, iceId: encounteredIceId },
            host.actions.abilityMetadata(breakerId, pump.id, encounteredIceId),
          ),
        );
      }
    }
    const canPayAtLeastOneBreakAbility = breakAbilities.some((ability) => {
      const cost = host.costs.breakSubroutineCostBreakdown(
        ability.cost.credits,
        1,
      );
      return host.payment.availableRunnerRunCredits(breakerId) >= cost.totalCost;
    });
    if (
      !run.noBreakSubroutinesActive &&
      breakAbilities.length > 0 &&
      breakerStrength >= encounteredIceStrength &&
      canPayAtLeastOneBreakAbility &&
      breakAbilities.every(
        (ability) =>
          breaker.id !== PILE_DRIVER_ID ||
          ability.postBreakStealthLossMode !== "total_if_available" ||
          host.breaker.runnerStealthRecurringCredits() >=
            (ability.postBreakStealthLoss ?? 0),
      )
    ) {
      const blinkUsedSubroutines =
        run.blinkUsedSubroutinesByBreakerThisEncounter?.[breakerId] ?? [];
      const subroutines = encounterSubroutines;
      const multiBreakAbility = breakAbilities.find(
        (ability) => (ability.count ?? 1) > 1,
      );
      if (multiBreakAbility) {
        actions.push(
          ...multiBreakSubroutineActions(
            host,
            breakerId,
            breaker.title,
            encounteredIceId,
            iceDefinition,
            subroutines,
            multiBreakAbility,
          ),
        );
        continue;
      }
      subroutines.forEach((subroutine, index) => {
        if (breaker.id === BLINK_ID && blinkUsedSubroutines.includes(index))
          return;
        const breakAbility = breakAbilities.find((candidate) =>
          breakAbilityMatchesSubroutine(candidate, subroutine),
        );
        if (!breakAbility) return;
        const singleBreakCost = host.costs.breakSubroutineCostBreakdown(
          breakAbility.cost.credits,
          1,
        );
        if (
          host.payment.availableRunnerRunCredits(breakerId) <
          singleBreakCost.totalCost
        )
          return;
        if (
          !run.brokenSubroutineIndexes.includes(index) &&
          !run.resolvedSubroutineIndexes.includes(index)
        ) {
          const subroutineLabel =
            subroutines.length > 1
              ? `Subroutine ${index + 1} brechen`
              : "Subroutine brechen";
          actions.push(
            host.actions.buildLegalAction(
              "break_subroutine",
              `${breaker.title}: ${subroutineLabel}`,
              breakerId,
              [{ credits: singleBreakCost.totalCost }],
              {
                breakerId,
                iceId: encounteredIceId,
                subroutineIndex: index,
                subroutineId: subroutine.id,
                targetIceDefinitionId: iceDefinition.id,
                targetIceTitle: iceDefinition.title,
                ...dynamicSubroutinePayload(subroutine),
                ...(singleBreakCost?.publicPayload ?? {
                  breakSubroutineBaseCost: breakAbility.cost.credits,
                }),
              },
              host.actions.abilityMetadata(
                breakerId,
                breakAbility.id,
                encounteredIceId,
              ),
            ),
          );
        }
      });
    }
  }
  const nextSubroutines = encounterSubroutinesForNextContinue(
    run,
    encounterSubroutines,
  );
  const nextSubroutineIndexes = encounterSubroutineIndexesForNextContinue(
    run,
    encounterSubroutines,
  );
  const willEndRun = nextSubroutines.some(
    (subroutine) =>
      subroutine.type === "end_the_run" ||
      subroutine.type === "end_the_run_unless_runner_pays",
  );
  const hardEndRun = nextSubroutines.some(
    (subroutine) => subroutine.type === "end_the_run",
  );
  const payOrEndRunEntries = nextSubroutineIndexes
    .map((index) => ({ index, subroutine: encounterSubroutines[index] }))
    .filter(
      (
        entry,
      ): entry is {
        index: number;
        subroutine: NonNullable<CardDefinition["subroutines"]>[number];
      } => entry.subroutine?.type === "end_the_run_unless_runner_pays",
    );
  const payOrEndRunAmount = payOrEndRunEntries.reduce(
    (sum, entry) => sum + Math.max(0, Math.floor(entry.subroutine.amount ?? 0)),
    0,
  );
  const encounterSubroutineIds = nextSubroutines
    .map((subroutine) => subroutine.id)
    .join(",");
  const continueLabel =
    nextSubroutines.length === 0
      ? "ICE passieren"
      : willEndRun
        ? "Subroutinen auslösen (Run endet)"
        : "Subroutinen auslösen";
  if (
    payOrEndRunAmount > 0 &&
    !hardEndRun &&
    host.payment.availableRunnerRunCredits() >= payOrEndRunAmount
  ) {
    actions.push(
      host.actions.buildLegalAction(
        "continue_run",
        `Subroutinen auslösen (Runner zahlt ${payOrEndRunAmount} Credit)`,
        "game_rule",
        [{ credits: payOrEndRunAmount }],
        {
          encounterContinue: true,
          sourceDefinitionId: iceDefinition.id,
          unbrokenSubroutineCount: nextSubroutines.length,
          encounterWillEndRun: false,
          encounterSubroutineIds,
          payOrEndRunSubroutineIndexes: payOrEndRunEntries
            .map((entry) => entry.index)
            .join(","),
          payOrEndRunSubroutinePayment: payOrEndRunAmount,
        },
      ),
    );
  }
  actions.push(
    host.actions.buildLegalAction(
      "continue_run",
      continueLabel,
      "game_rule",
      [],
      {
        encounterContinue: true,
        sourceDefinitionId: iceDefinition.id,
        unbrokenSubroutineCount: nextSubroutines.length,
        encounterWillEndRun: willEndRun,
        encounterSubroutineIds,
      },
    ),
  );
  return {
    handled: true,
    legalActions: actions,
    encounterId: run.runId,
    iceId: encounteredIceId,
  };
}

export function buildRunnerMovementActions(
  host: RunnerEncounterActionHost,
): RunnerMovementActionBuildResult {
  const run = host.run.currentRun();
  if (run.postPassPayOrEndRun)
    return { handled: true, legalActions: postPassPayOrEndRunActions(host, run) };
  if (
    run.jackOutLockedUntilEncounterEnds ||
    run.nextEncounterJackOutLock ||
    run.jackOutLockedForRun
  ) {
    return {
      handled: true,
      legalActions: [
        host.actions.buildLegalAction(
          "continue_run",
          "Run fortsetzen",
          "game_rule",
        ),
      ],
    };
  }
  const actions: LegalAction[] = [];
  actions.push(...host.run.runnerDuringRunCardImplementationLegalActions());
  actions.push(...host.callbacks.postPassSpecialWindowActions());
  actions.push(...buildMysteryBoxRunActions(host, run));
  const jackOutAdditionalCost = host.payment.runJackOutAdditionalCost(run);
  if (host.payment.availableRunnerRunCredits() >= jackOutAdditionalCost) {
    actions.push(
      host.actions.buildLegalAction(
        "jack_out",
        jackOutAdditionalCost > 0
          ? `Jack-out (${jackOutAdditionalCost} Credit)`
          : "Jack-out",
        "game_rule",
        jackOutAdditionalCost > 0 ? [{ credits: jackOutAdditionalCost }] : [],
        jackOutAdditionalCost > 0
          ? {
              v1922CorpIceAbility: "viral_15_jack_out_tax",
              jackOutAdditionalCost,
              ...(run.viral15ActiveSourceIceId
                ? {
                    sourceDefinitionId: host.cards.definitionFor(
                      run.viral15ActiveSourceIceId,
                    ).id,
                  }
                : {}),
            }
          : undefined,
      ),
    );
  }
  actions.push(
    host.actions.buildLegalAction(
      "continue_run",
      "Run fortsetzen",
      "game_rule",
    ),
  );
  return { handled: true, legalActions: actions };
}

function selfModifyingCodeEncounterActions(
  host: RunnerEncounterActionHost,
): LegalAction[] {
  const state = host.state;
  if (
    state.timingPoint !== "run.encounter_ice" ||
    state.activeSide !== "runner" ||
    !state.run?.encounteredIceId ||
    !state.runner.stack.some(
      (cardId) => host.cards.definitionFor(cardId).type === "program",
    )
  )
    return [];
  return state.runner.rig.programs
    .slice()
    .sort()
    .filter((cardId) => host.cards.definitionFor(cardId).id === SELF_MODIFYING_CODE_ID)
    .filter(
      (cardId) =>
        !cardImplementationForDefinitionId(host.cards.definitionFor(cardId).id),
    )
    .map((cardId) =>
      buildRunnerSelfModifyingCodeInstallAction(state, cardId),
    );
}

function multiBreakSubroutineActions(
  host: RunnerEncounterActionHost,
  breakerId: CardInstanceId,
  breakerTitle: string,
  encounteredIceId: CardInstanceId,
  iceDefinition: CardDefinition,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
  breakAbility: RuntimeIcebreakerAbility,
): LegalAction[] {
  const run = host.run.currentRun();
  const eligibleIndexes = subroutines
    .map((subroutine, index) => ({ subroutine, index }))
    .filter(
      ({ subroutine, index }) =>
        breakAbilityMatchesSubroutine(breakAbility, subroutine) &&
        !run.brokenSubroutineIndexes.includes(index) &&
        !run.resolvedSubroutineIndexes.includes(index),
    )
    .map(({ index }) => index);
  const maxCount = Math.min(breakAbility.count ?? 4, eligibleIndexes.length);
  const actions: LegalAction[] = [];
  const selected: number[] = [];
  const visit = (start: number): void => {
    if (selected.length > 0) {
      const subroutineIndexes = [...selected];
      const firstIndex = subroutineIndexes[0] ?? 0;
      const label =
        subroutineIndexes.length === 1
          ? `${breakerTitle}: Subroutine ${firstIndex + 1} brechen`
          : `${breakerTitle}: ${subroutineIndexes.length} Subroutinen brechen`;
      const breakCost = host.costs.breakSubroutineCostBreakdown(
        breakAbility.cost.credits,
        subroutineIndexes.length,
      );
      if (
        host.payment.availableRunnerRunCredits(breakerId) <
        breakCost.totalCost
      )
        return;
      actions.push(
        host.actions.buildLegalAction(
          "break_subroutine",
          label,
          breakerId,
          [{ credits: breakCost.totalCost }],
          {
            breakerId,
            iceId: encounteredIceId,
            subroutineIndexes: subroutineIndexes.join(","),
            breakSubroutineCount: subroutineIndexes.length,
            multiBreakSubroutines: true,
            // Kept for PublicContext and older Pile Driver regression tests.
            pileDriverMultiBreak: true,
            targetIceDefinitionId: iceDefinition.id,
            targetIceTitle: iceDefinition.title,
            ...breakCost.publicPayload,
          },
          host.actions.abilityMetadata(
            breakerId,
            breakAbility.id,
            encounteredIceId,
          ),
        ),
      );
    }
    if (selected.length >= maxCount) return;
    for (let index = start; index < eligibleIndexes.length; index += 1) {
      selected.push(eligibleIndexes[index]!);
      visit(index + 1);
      selected.pop();
    }
  };
  visit(0);
  return actions;
}

export function breakAbilityMatchesIce(
  ability: RuntimeIcebreakerAbility,
  iceSubtypes: readonly string[],
): boolean {
  if (ability.type !== "break_subroutine") return false;
  if (
    ability.iceSubtype &&
    !iceSubtypes.includes(normalizeSubtypeLabel(ability.iceSubtype))
  )
    return false;
  if (
    ability.iceSubtypes?.length &&
    !ability.iceSubtypes.some((subtype) =>
      iceSubtypes.includes(normalizeSubtypeLabel(subtype)),
    )
  )
    return false;
  return true;
}

export function breakAbilityMatchesSubroutine(
  ability: RuntimeIcebreakerAbility,
  subroutine: Subroutine,
): boolean {
  const tags = ability.subroutineBreakTags ?? [];
  if (tags.length === 0) return true;
  if (tags.includes("trace") && subroutine.type === "initiate_trace") return true;
  const subroutineTags = subroutine.breakTags ?? [];
  return tags.some((tag) => subroutineTags.includes(tag));
}

function dynamicSubroutinePayload(
  subroutine: Subroutine,
): NonNullable<LegalAction["payload"]> {
  const attribution = dynamicSubroutineAttributionFor(subroutine);
  if (!attribution) return {};
  return {
    dynamicSourceDefinitionId: attribution.sourceDefinitionId,
    dynamicSourceTitle: attribution.sourceTitle,
    dynamicSourceKind: attribution.modifierKind,
    dynamicSubroutineKind: attribution.subroutineKind,
  };
}

function encounterSubroutinesForNextContinue(
  run: RunState,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
): NonNullable<CardDefinition["subroutines"]> {
  return encounterSubroutineIndexesForNextContinue(run, subroutines).flatMap(
    (index) => {
      const subroutine = subroutines[index];
      return subroutine ? [subroutine] : [];
    },
  );
}

function encounterSubroutineIndexesForNextContinue(
  run: RunState,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
): number[] {
  const indexes: number[] = [];
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index)
    )
      continue;
    indexes.push(index);
    if (subroutine.type === "initiate_trace") break;
  }
  return indexes;
}

function postPassPayOrEndRunActions(
  host: RunnerEncounterActionHost,
  run: ActiveRun,
): LegalAction[] {
  const pending = run.postPassPayOrEndRun;
  if (!pending) return [];
  const amount = Math.max(0, Math.floor(pending.amount));
  const serverLabel = host.cards.publicServerLabel(pending.serverId);
  const payload = {
    fortRunWindowAbility: "runner_pay_or_end_run_after_passing_ice_on_this_fort",
    ...(pending.sourceDefinitionIds[0]
      ? { sourceDefinitionId: pending.sourceDefinitionIds[0] }
      : {}),
    sourceDefinitionIds: pending.sourceDefinitionIds.join(","),
    sourceCardIds: pending.sourceCardInstanceIds.join(","),
    passedIceId: pending.passedIceId,
    passedIceDefinitionId: host.cards.definitionFor(pending.passedIceId).id,
    serverId: pending.serverId,
    ...(serverLabel ? { serverLabel } : {}),
    paymentAmount: amount,
  };
  const actions: LegalAction[] = [];
  if (host.payment.availableRunnerRunCredits() >= amount) {
    actions.push(
      host.actions.buildLegalAction(
        "continue_run",
        amount > 0
          ? `Fort-Pass-Kosten zahlen (${amount} Credit)`
          : "Fort-Pass-Kosten zahlen",
        "game_rule",
        amount > 0 ? [{ credits: amount }] : [],
        {
          ...payload,
          decision: "pay",
        },
      ),
    );
  }
  actions.push(
    host.actions.buildLegalAction(
      "continue_run",
      "Run beenden",
      "game_rule",
      [],
      {
        ...payload,
        decision: "end_run",
      },
    ),
  );
  return actions;
}

export function buildMysteryBoxRunActions(
  host: RunnerEncounterActionHost,
  run: ActiveRun,
): LegalAction[] {
  const state = host.state;
  const used = new Set(run.mysteryBoxUsedSourceIdsThisRun ?? []);
  if (state.runner.stack.length === 0) return [];
  return state.runner.rig.programs
    .slice()
    .sort()
    .filter((cardId) => !used.has(cardId))
    .filter((cardId) => host.cards.definitionFor(cardId).id === MYSTERY_BOX_ID)
    .filter(
      (cardId) =>
        !cardImplementationForDefinitionId(host.cards.definitionFor(cardId).id),
    )
    .map((sourceCardId) => {
      const topCards = state.runner.stack.slice(0, 5);
      const programCount = topCards.filter(
        (cardId) => host.cards.definitionFor(cardId).type === "program",
      ).length;
      return host.actions.buildLegalAction(
        "trigger_ability",
        `${host.cards.definitionFor(sourceCardId).title}: Stack-Spitze pruefen`,
        sourceCardId,
        [],
        {
          cardId: sourceCardId,
          v1915RunnerProgramAbility: "mystery_box_top5_program_install",
          revealCount: topCards.length,
          revealedCardDefinitionIds: topCards
            .map((cardId) => host.cards.definitionFor(cardId).id)
            .join(","),
          revealedProgramCount: programCount,
          hiddenZoneBarrier: true,
          hiddenZoneAction: "mystery_box_stack_top5_reveal",
        },
      );
    });
}
