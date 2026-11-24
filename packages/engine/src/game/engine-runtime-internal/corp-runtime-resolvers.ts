import { spendCorpAgendaPoints } from "../state/corp-agenda-point-cost";
import { parseCanonicalCapabilityId } from "@netgrid/cards/engine";
import {
  type ChoiceRequest,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { fixedPlayCostCredits, playCostForDefinition } from "../payment";
import { selectedChoiceIds } from "../choices/choice-validation";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import { eligibleInstalledRunnerHardwareIds } from "../state/installed-runner-hardware";
import { mustArrayValue } from "../state/draw-random";
import { credits } from "../state/economy-mutation";
import { addCardCounter, cardCounter } from "../state/turn-flags-counters";
import { buildLegalAction as action } from "../turn/action-builders";
import { openRunnerInstalledTrashPreventionWindow } from "../damage/damage-core";
import { onPlayCardImplementationEffects } from "../play/corp-operation-resolution";
import { scoreConversionCapabilityPayloadForEffects } from "../../ability-engine/card-implementation-runtime-activated-targets";
import { hiddenRunnerResourceSlotId, isConcealedRunnerResource } from "../view/card-view";
import { effectiveAgendaDifficulty } from "../../ability-engine/effective-values";
import { CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES } from "../../mechanics/card-implementation-derived-sets";
import type { CorpAgendaPointCostResult, RuntimeDeps } from "./runtime-shared";

export function createCorpRuntimeResolvers(
  deps: RuntimeDeps,
  turnCorpRuntime:
    | import("./turn-corp-runtime-port").TurnCorpRuntimePort
    | undefined = deps.turnCorpRuntime,
): import("./corp-runtime-port").CorpRuntimePort {
  if (!turnCorpRuntime)
    throw new Error("Turn-Corp-Runtime muss vor den Corp-Resolvern bestehen.");
  const {
    advanceableInstalledCardTargets,
    isInstalledCorpCardAdvanceable,
    advancementDistributionOptions,
    startCardImplementationAdvancementDistributionChoice,
    parseAdvancementDistributionValue,
    sourcePartsForP334Choice,
    validateAdvancementDistribution,
    resolveCardImplementationAdvancementDistributionChoice,
    movableAdvancementSourceIds,
    moveAdvancementOptions,
    startCardImplementationMoveAdvancementChoice,
    resolveCardImplementationMoveAdvancementChoice,
    resolveCorpOperationAddAdvancementCounters,
    awardRunnerEventAgendaPoint,
  } = turnCorpRuntime;

  function forfeitRunnerAgendaForPointCost(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    if (!cardId || !state.runner.scoreArea.includes(cardId))
      throw new Error(
        "Der Runner kann mit dieser Agenda keine Kosten bezahlen.",
      );
    if (deps.agendaPointsForScoredCard(state, cardId) < 1)
      throw new Error(
        "Die gewaehlte Runner-Agenda liefert keinen Agenda-Punkt fuer Kosten.",
      );
    deps.spendAgendaPointFromScoredCard(state, cardId);
  }

  function forfeitCorpAgendaForPointCost(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    if (!cardId || !state.corp.scoreArea.includes(cardId))
      throw new Error("Die Korp kann mit dieser Agenda keine Kosten bezahlen.");
    if (deps.agendaPointsForScoredCard(state, cardId) < 1)
      throw new Error(
        "Die gewaehlte Korp-Agenda liefert keinen Agenda-Punkt fuer Kosten.",
      );
    deps.spendAgendaPointFromScoredCard(state, cardId);
  }

  function activeObligationCount(state: GameState): number {
    return Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0));
  }

  function addActiveObligation(state: GameState, amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("ACME-Verpflichtungsmenge ist ungueltig.");
    state.activeObligationDebtCount = activeObligationCount(state) + amount;
  }

  function removeActiveObligation(state: GameState): void {
    const current = activeObligationCount(state);
    if (current <= 0)
      throw new Error("Es gibt keine ACME-Savings-and-Loan-Verpflichtung.");
    state.activeObligationDebtCount = current - 1;
  }

  function spendCorpAgendaPointCost(
    state: GameState,
    requiredPoints: number,
  ): CorpAgendaPointCostResult {
    return spendCorpAgendaPoints(state, requiredPoints);
  }

  function installedAgendaOperationTarget(
    state: GameState,
  ): CardInstanceId | undefined {
    return state.corp.servers
      .flatMap((server) => server.root)
      .filter((cardId) => definitionFor(state, cardId).type === "agenda")
      .sort((left, right) => {
        const leftRemaining = Math.max(
          0,
          effectiveAgendaDifficulty(
            deps.effectiveAgendaDifficultyDeps,
            state,
            left,
          ) - mustInstance(state.cardInstances, left).advancementCounters,
        );
        const rightRemaining = Math.max(
          0,
          effectiveAgendaDifficulty(
            deps.effectiveAgendaDifficultyDeps,
            state,
            right,
          ) - mustInstance(state.cardInstances, right).advancementCounters,
        );
        return rightRemaining - leftRemaining || left.localeCompare(right);
      })[0];
  }

  function corpAgendaCounterOperationTarget(
    state: GameState,
  ): CardInstanceId | undefined {
    const scored = state.corp.scoreArea.slice().sort()[0];
    if (scored) return scored;
    return installedAgendaOperationTarget(state);
  }

  function corpScoredAgendaForfeitTargets(state: GameState): CardInstanceId[] {
    return state.corp.scoreArea
      .slice()
      .sort((left, right) => {
        const byPoints =
          deps.agendaPointsForScoredCard(state, left) -
          deps.agendaPointsForScoredCard(state, right);
        return byPoints !== 0 ? byPoints : left.localeCompare(right);
      })
      .filter((cardId) => deps.agendaPointsForScoredCard(state, cardId) >= 1);
  }

  function hardwareTrashByCounterEligibleHardwareIds(
    state: GameState,
  ): CardInstanceId[] {
    return eligibleInstalledRunnerHardwareIds(state, "cybernetics");
  }

  function hardwareTrashByCounterLegalActions(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ): LegalAction[] {
    const playCost = playCostForDefinition(definition);
    if (playCost.kind !== "variable_x")
      throw new Error(
        "Hardware-Trash-by-Counter braucht variable X-Play-Kosten.",
      );
    const eligibleHardwareIds =
      hardwareTrashByCounterEligibleHardwareIds(state);
    const maxTrashCount = Math.min(
      eligibleHardwareIds.length,
      Math.floor(state.corp.credits / playCost.creditsPerX),
    );
    const actions: LegalAction[] = [];
    for (
      let trashCount = playCost.minimumX;
      trashCount <= maxTrashCount;
      trashCount += 1
    ) {
      actions.push(
        action(
          state,
          "corp",
          "play_operation",
          `${definition.title}: ${trashCount} Hardware trashen`,
          cardId,
          [{ clicks: 1, credits: trashCount * playCost.creditsPerX }],
          {
            cardId,
            hardwareTrashByCounterTrashCount: trashCount,
            eligibleHardwareCount: eligibleHardwareIds.length,
            xValue: trashCount,
            xMinimum: playCost.minimumX,
            xMaximum: maxTrashCount,
            xUpperBound: maxTrashCount,
            xCreditsPerUnit: playCost.creditsPerX,
            variableCostKind: "printed_play_cost",
          },
        ),
      );
    }
    return actions;
  }

  function hardwareTrashByCounterTrashCountFromPayload(
    legalAction: LegalAction,
  ): number {
    const trashCount = Number(
      legalAction.payload?.hardwareTrashByCounterTrashCount,
    );
    if (!Number.isInteger(trashCount) || trashCount < 0)
      throw new Error(
        "Hardware-Trash-by-Counter braucht eine gueltige X-Auswahl.",
      );
    return trashCount;
  }

  function resolveHardwareTrashByCounterOperation(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const trashCount = hardwareTrashByCounterTrashCountFromPayload(legalAction);
    const eligibleHardwareIds =
      hardwareTrashByCounterEligibleHardwareIds(state);
    const cardId = String(legalAction.payload?.cardId) as CardInstanceId;
    const definition = definitionFor(state, cardId);
    const playCost = playCostForDefinition(definition);
    if (playCost.kind !== "variable_x")
      throw new Error(
        "Hardware-Trash-by-Counter braucht variable X-Play-Kosten.",
      );
    const paidCredits = Number(legalAction.costs[0]?.credits);
    const creditsBeforePlay = state.corp.credits + paidCredits;
    const currentMaximum = Math.min(
      eligibleHardwareIds.length,
      Math.floor(creditsBeforePlay / playCost.creditsPerX),
    );
    if (
      !Number.isInteger(paidCredits) ||
      trashCount < playCost.minimumX ||
      paidCredits !== trashCount * playCost.creditsPerX ||
      Number(legalAction.payload?.xValue) !== trashCount ||
      Number(legalAction.payload?.xMinimum) !== playCost.minimumX ||
      Number(legalAction.payload?.xMaximum) !== currentMaximum ||
      Number(legalAction.payload?.xUpperBound) !== currentMaximum ||
      Number(legalAction.payload?.xCreditsPerUnit) !== playCost.creditsPerX ||
      legalAction.payload?.variableCostKind !== "printed_play_cost"
    )
      throw new Error(
        "Hardware-Trash-by-Counter hat keinen gueltigen X-Kostenvertrag.",
      );
    if (eligibleHardwareIds.length < trashCount)
      throw new Error(
        "Hardware-Trash-by-Counter findet nicht genug nicht-Cybernetics-Hardware.",
      );
    if (trashCount === 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hardwareTrashByCounterTrashCount: 0,
        trashedHardwareCount: 0,
      };
      return;
    }
    startRunnerInstalledMultiTrashChoice(
      state,
      legalAction,
      {
        effectKind: "installed_hardware_trash_by_counter",
        targetCardType: "hardware",
        minimumTargets: trashCount,
        maximumTargets: trashCount,
        selectionOrdering: "ordered",
        excludesSubtype: "cybernetics",
      },
      eligibleHardwareIds,
    );
  }

  function resolveTaggedRunnerResourceMultiTrashOperation(
    state: GameState,
    legalAction: LegalAction,
    minimumTargets: number,
    maximumTargets: number,
    selectionOrdering: "ordered" | "unordered",
  ): void {
    const resourceIds = state.runner.rig.resources.slice();
    const boundedMaximum = Math.min(maximumTargets, resourceIds.length);
    if (boundedMaximum === 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runnerInstalledMultiTrashTargetCount: 0,
        trashedResourceCount: 0,
      };
      return;
    }
    startRunnerInstalledMultiTrashChoice(
      state,
      legalAction,
      {
        effectKind: "trash_runner_resources_if_tagged",
        targetCardType: "resource",
        minimumTargets: Math.min(minimumTargets, boundedMaximum),
        maximumTargets: boundedMaximum,
        selectionOrdering,
      },
      resourceIds,
    );
  }

  function startRunnerInstalledMultiTrashChoice(
    state: GameState,
    legalAction: LegalAction,
    input: {
      effectKind: NonNullable<
        GameState["pendingRunnerInstalledMultiTrash"]
      >["effectKind"];
      targetCardType: "resource" | "hardware" | "program" | "daemon";
      minimumTargets: number;
      maximumTargets: number;
      selectionOrdering: "ordered" | "unordered";
      excludesSubtype?: string;
    },
    eligibleCardIds: CardInstanceId[],
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    if (state.pendingRunnerInstalledMultiTrash)
      throw new Error("Es ist bereits ein Multi-Trash-Vertrag aktiv.");
    const sourceCardInstanceId = String(
      legalAction.payload?.cardId ?? legalAction.source ?? "",
    ) as CardInstanceId;
    const sourceDefinitionId = definitionFor(state, sourceCardInstanceId).id;
    const eligibleTargets = eligibleCardIds.map((cardId) => {
      const concealed =
        input.targetCardType === "resource" &&
        isConcealedRunnerResource(state, cardId);
      return {
        cardInstanceId: cardId,
        choiceValue: concealed
          ? hiddenRunnerResourceSlotId(state, cardId)
          : cardId,
      };
    });
    state.pendingRunnerInstalledMultiTrash = {
      sourceCardInstanceId,
      sourceDefinitionId,
      ...input,
      eligibleTargets,
    };
    state.pendingChoice = {
      choiceId: `runner_installed_multi_trash_${state.stateVersion + 1}`,
      side: "corp",
      source: "card_implementation.runner_installed_multi_trash",
      sourceCardInstanceId,
      sourceCardDefinitionId: sourceDefinitionId,
      prompt:
        input.effectKind === "trash_runner_resources_if_tagged"
          ? `Bis zu ${input.maximumTargets} Runner-Ressourcen trashen`
          : `${input.maximumTargets} ${input.targetCardType === "hardware" ? "Hardware" : input.targetCardType === "daemon" ? "Daemon" : "Programme"} in Trash-Reihenfolge auswählen`,
      kind: "select_cards",
      options: eligibleTargets.map(({ cardInstanceId, choiceValue }) => {
        const concealed = choiceValue !== cardInstanceId;
        const definition = definitionFor(state, cardInstanceId);
        return {
          id: `target_${choiceValue}`,
          label: concealed ? "Verdeckte Runner-Ressource" : definition.title,
          publicLabel: concealed
            ? "Verdeckte Runner-Ressource"
            : definition.title,
          value: choiceValue,
        };
      }),
      minSelections: input.minimumTargets,
      maxSelections: input.maximumTargets,
      selectionOrdering: input.selectionOrdering,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerInstalledMultiTrashChoiceOpened: true,
      runnerInstalledMultiTrashMinimumTargets: input.minimumTargets,
      runnerInstalledMultiTrashMaximumTargets: input.maximumTargets,
      runnerInstalledMultiTrashOrdering: input.selectionOrdering,
      ...(input.effectKind === "installed_hardware_trash_by_counter"
        ? {
            hardwareTrashByCounterChoiceOpened: true,
            eligibleHardwareCount: eligibleCardIds.length,
            hardwareTrashByCounterTrashCount: input.maximumTargets,
          }
        : { eligibleResourceCount: eligibleCardIds.length }),
    };
  }

  function resolveRunnerInstalledMultiTrashChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    const continuation = state.pendingRunnerInstalledMultiTrash;
    if (
      !choice ||
      choice.source !== "card_implementation.runner_installed_multi_trash" ||
      !continuation
    )
      throw new Error("Es ist keine Runner-Multi-Trash-Choice offen.");
    const selectedValues = deps.selectedChoiceCardIds(choice, playerAction);
    if (
      selectedValues.length < continuation.minimumTargets ||
      selectedValues.length > continuation.maximumTargets
    )
      throw new Error(
        "Die Runner-Multi-Trash-Choice hat eine ungueltige Zielanzahl.",
      );
    const targetByChoiceValue = new Map(
      continuation.eligibleTargets.map((target) => [
        target.choiceValue,
        target.cardInstanceId,
      ]),
    );
    const selectedIds = selectedValues.map((value) => {
      const cardId = targetByChoiceValue.get(value);
      if (!cardId)
        throw new Error("Ein Runner-Multi-Trash-Ziel ist nicht gebunden.");
      return cardId;
    });
    if (new Set(selectedIds).size !== selectedIds.length)
      throw new Error("Ein Runner-Multi-Trash-Ziel wurde doppelt gewählt.");
    if (
      continuation.effectKind === "installed_hardware_trash_by_counter" &&
      !continuation.excludesSubtype
    )
      throw new Error("Der Hardware-Multi-Trash braucht seine Subtypgrenze.");
    const currentLegalTargets = new Set(
      continuation.targetCardType === "hardware"
        ? continuation.excludesSubtype
          ? eligibleInstalledRunnerHardwareIds(
              state,
              continuation.excludesSubtype,
            )
          : state.runner.rig.hardware
        : continuation.targetCardType === "program"
          ? state.runner.rig.programs
          : continuation.targetCardType === "daemon"
            ? state.runner.rig.programs.filter((cardId) =>
                definitionFor(state, cardId).subtypes.includes("daemon"),
              )
            : state.runner.rig.resources,
    );
    for (const cardId of selectedIds) {
      if (!currentLegalTargets.has(cardId))
        throw new Error("Ein Runner-Multi-Trash-Ziel ist nicht mehr legal.");
    }
    delete state.pendingChoice;
    delete state.pendingRunnerInstalledMultiTrash;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      cardId: continuation.sourceCardInstanceId,
      sourceDefinitionId: continuation.sourceDefinitionId,
    };
    trashRunnerInstalledCardsAsBatch(
      state,
      selectedIds,
      continuation.effectKind,
      legalAction,
    );
  }

  function trashRunnerInstalledCardsAsBatch(
    state: GameState,
    targetIds: CardInstanceId[],
    effectKind: NonNullable<
      GameState["pendingRunnerInstalledMultiTrash"]
    >["effectKind"],
    legalAction: LegalAction,
  ): void {
    const definitionIds = targetIds.map(
      (cardId) => definitionFor(state, cardId).id,
    );
    if (targetIds.length === 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runnerInstalledMultiTrashTargetCount: 0,
        ...(effectKind === "installed_hardware_trash_by_counter"
          ? { trashedHardwareCount: 0 }
          : effectKind === "access_hardware_trash_by_advancement"
            ? { trashedHardwareCount: 0 }
            : effectKind === "access_program_trash_by_advancement"
              ? { trashedProgramCount: 0 }
              : { trashedResourceCount: 0 }),
      };
      return;
    }
    if (
      openRunnerInstalledTrashPreventionWindow(
        state,
        legalAction,
        targetIds,
        effectKind,
        "ordered_batch",
      )
    )
      return;
    deps.trashRunnerInstalledCardsToHeapBatch(state, targetIds, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerInstalledMultiTrashTargetCount: targetIds.length,
      runnerInstalledMultiTrashOrdering: "ordered",
      ...(effectKind === "installed_hardware_trash_by_counter"
        ? {
            hardwareTrashByCounterTrashCount: targetIds.length,
            trashedHardwareCount: targetIds.length,
            trashedHardwareDefinitionIds: definitionIds.join(","),
          }
        : effectKind === "access_hardware_trash_by_advancement" ||
            effectKind === "access_program_trash_by_advancement" ||
            effectKind === "access_daemon_trash"
          ? {
              hiddenZoneBarrier: true,
              hiddenZoneAction: "v1919_access_ambush_trash_installed",
              ambushDefinitionId: definitionFor(
                state,
                String(legalAction.payload?.cardId ?? "") as CardInstanceId,
              ).id,
              ...(effectKind === "access_daemon_trash"
                ? {}
                : {
                    advancementCounterCount: Math.max(
                      0,
                      Math.floor(
                        mustInstance(
                          state.cardInstances,
                          String(
                            legalAction.payload?.cardId ?? "",
                          ) as CardInstanceId,
                        ).advancementCounters,
                      ),
                    ),
                  }),
              targetTrashCount: targetIds.length,
              trashedCount: targetIds.length,
              ...(effectKind === "access_hardware_trash_by_advancement"
                ? { trashedHardwareCount: targetIds.length }
                : { trashedProgramCount: targetIds.length }),
              trashedCardType:
                effectKind === "access_hardware_trash_by_advancement"
                  ? "hardware"
                  : effectKind === "access_daemon_trash"
                    ? "daemon"
                    : "program",
              trashedCardDefinitionId: definitionIds[0] ?? "",
              trashedCardDefinitionIds: definitionIds.join(","),
            }
          : {
              trashedResourceCount: targetIds.length,
              trashedResourceDefinitionIds: definitionIds.join(","),
            }),
    };
  }

  function advancementPlacementLegalActions(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ): LegalAction[] {
    const scoreConversionPayload = scoreConversionCapabilityPayloadForEffects(
      onPlayCardImplementationEffects(definition),
    );
    return [
      action(
        state,
        "corp",
        "play_operation",
        `${definition.title} spielen`,
        cardId,
        [{ clicks: 1, credits: fixedPlayCostCredits(definition) }],
        { cardId, ...scoreConversionPayload },
      ),
    ];
  }

  function resolveAgendaCounterOperation(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
  ): void {
    const targetAgendaId = corpAgendaCounterOperationTarget(state);
    if (!targetAgendaId)
      throw new Error("Die V1.9.19-Counter-Operation findet kein Agenda-Ziel.");
    if (!CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES.has(sourceDefinitionId))
      throw new Error("Die V1.9.19-Counter-Operation passt nicht zur Quelle.");
    addCardCounter(state, targetAgendaId, "power", 1);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1919OperationAbility: "add_power_counter",
      targetCardId: targetAgendaId,
      targetCardDefinitionId: definitionFor(state, targetAgendaId).id,
      addedCounterAmount: 1,
      remainingCounters: cardCounter(state, targetAgendaId, "power"),
    };
  }

  function resolveAdvancementPlacementOperation(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const options = advancementPlacementOptions(state);
    if (options.length === 0)
      throw new Error("Advancement-Placement findet kein advancebares Ziel.");
    startAdvancementPlacementChoice(state, options, legalAction);
  }

  function advancementPlacementOptions(state: GameState): Array<{
    firstTargetId: CardInstanceId;
    secondTargetId?: CardInstanceId;
    id: string;
    label: string;
    publicLabel: string;
    value: string;
    metadata?: { placements: Array<{ title: string; amount: number }> };
  }> {
    const targets = advanceableInstalledCardTargets(state) as CardInstanceId[];
    const options: Array<{
      firstTargetId: CardInstanceId;
      secondTargetId?: CardInstanceId;
      id: string;
      label: string;
      publicLabel: string;
      value: string;
      metadata?: { placements: Array<{ title: string; amount: number }> };
    }> = [];
    for (let firstIndex = 0; firstIndex < targets.length; firstIndex += 1) {
      const firstTargetId = mustArrayValue(
        targets,
        firstIndex,
        "Advancement-Placement-Ziel fehlt.",
      );
      for (
        let secondIndex = firstIndex;
        secondIndex < targets.length;
        secondIndex += 1
      ) {
        const secondTargetId = mustArrayValue(
          targets,
          secondIndex,
          "Advancement-Placement-Ziel fehlt.",
        );
        const splitTargets = firstTargetId !== secondTargetId;
        const firstTitle = definitionFor(state, firstTargetId).title;
        const secondTitle = definitionFor(state, secondTargetId).title;
        const label = splitTargets
          ? `Je 1 Advancement-Counter auf ${firstTitle} und ${secondTitle}`
          : `2 Advancement-Counter auf ${firstTitle}`;
        options.push({
          firstTargetId,
          ...(splitTargets ? { secondTargetId } : {}),
          id: `placement_${deps.sanitizeId(firstTargetId)}_${deps.sanitizeId(secondTargetId)}`,
          label,
          publicLabel: label,
          value: splitTargets
            ? `${firstTargetId}|${secondTargetId}`
            : `${firstTargetId}|${firstTargetId}`,
          metadata: {
            placements: splitTargets
              ? [
                  { title: firstTitle, amount: 1 },
                  { title: secondTitle, amount: 1 },
                ]
              : [{ title: firstTitle, amount: 2 }],
          },
        });
      }
    }
    return options;
  }

  function startAdvancementPlacementChoice(
    state: GameState,
    options: ReturnType<typeof advancementPlacementOptions>,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `advancement_placement_${state.stateVersion + 1}`,
      side: "corp",
      source: `card_implementation.advancement_placement:${state.stateVersion + 1}`,
      prompt: "Advancement-Placement: Advancement-Counter legen",
      presentationKey: "advancement_placement",
      kind: "select_option",
      options: options.map((option) => ({
        id: option.id,
        label: option.label,
        publicLabel: option.publicLabel,
        value: option.value,
        ...(option.metadata ? { metadata: option.metadata } : {}),
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1919OperationAbility: "add_advancement_counters_choice",
      eligiblePlacementCount: options.length,
    };
  }

  function resolveAdvancementPlacementChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("card_implementation.advancement_placement")
    )
      throw new Error(
        "Es ist keine Advancement-Placement-Advancement-Choice offen.",
      );
    const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
    const selectedOption = choice.options.find(
      (option) => option.id === selectedOptionId,
    );
    if (!selectedOption || typeof selectedOption.value !== "string")
      throw new Error(
        "Advancement-Placement braucht genau eine Placement-Auswahl.",
      );
    const [firstTargetId, secondTargetId] = selectedOption.value.split("|") as [
      CardInstanceId | undefined,
      CardInstanceId | undefined,
    ];
    if (!firstTargetId || !secondTargetId)
      throw new Error(
        "Advancement-Placement hat keine gueltige Placement-Auswahl.",
      );
    applyAdvancementCounterPlacement(
      state,
      firstTargetId,
      secondTargetId === firstTargetId ? undefined : secondTargetId,
      legalAction,
    );
    delete state.pendingChoice;
  }

  function applyAdvancementCounterPlacement(
    state: GameState,
    firstTargetId: CardInstanceId,
    secondTargetId: CardInstanceId | undefined,
    legalAction: LegalAction,
  ): void {
    const eligibleTargets = new Set<CardInstanceId>(
      advanceableInstalledCardTargets(state) as CardInstanceId[],
    );
    if (!firstTargetId || !eligibleTargets.has(firstTargetId))
      throw new Error("Advancement-Placement findet kein advancebares Ziel.");
    if (secondTargetId && !eligibleTargets.has(secondTargetId))
      throw new Error(
        "Advancement-Placement findet kein zweites advancebares Ziel.",
      );

    const placements: Record<CardInstanceId, number> = {
      [firstTargetId]: secondTargetId ? 1 : 2,
    };
    if (secondTargetId) placements[secondTargetId] = 1;
    for (const [targetId, amount] of Object.entries(placements)) {
      mustInstance(state.cardInstances, targetId).advancementCounters += amount;
    }
    const placementEntries = Object.entries(placements);
    const targetCount = placementEntries.length;
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.cardInstances[sourceCardId])
      throw new Error(
        "Advancement-Placement braucht eine vorhandene Operationsquelle.",
      );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
      v1919OperationAbility: "add_advancement_counters",
      targetCardId: firstTargetId,
      targetCardDefinitionId: definitionFor(state, firstTargetId).id,
      advancementCounterTargetCardIds: placementEntries
        .map(([targetId]) => targetId)
        .join(","),
      targetCardDefinitionIds: placementEntries
        .map(([targetId]) => definitionFor(state, targetId).id)
        .join(","),
      addedAdvancementCounters: 2,
      targetCount,
      advancementPlacementDistribution: placementEntries
        .map(([targetId, amount]) => `${deps.sanitizeId(targetId)}:${amount}`)
        .join(","),
      ...(targetCount === 1
        ? {
            advancementCountersAfter: mustInstance(
              state.cardInstances,
              firstTargetId,
            ).advancementCounters,
          }
        : {}),
    };
  }

  function choiceAction(state: GameState, choice: ChoiceRequest): LegalAction {
    return action(
      state,
      choice.side,
      "resolve_choice",
      choice.prompt,
      "game_rule",
      [],
      {
        choiceId: choice.choiceId,
        choiceVisibility: choice.visibility,
        choiceKind: choice.kind,
      },
      {
        choiceRequirements: [
          {
            choiceId: choice.choiceId,
            minSelections: choice.minSelections,
            maxSelections: choice.maxSelections,
            optionIds: choice.options.map((option) => option.id),
          },
        ],
      },
    );
  }

  function abilityMetadata(
    sourceCardInstanceId: CardInstanceId,
    sourceAbilityId: number,
    encounteredIceId?: CardInstanceId,
  ): Pick<LegalAction, "abilityRef" | "effectRef" | "targetRequirements"> {
    parseCanonicalCapabilityId(sourceAbilityId);
    return {
      abilityRef: { sourceCardInstanceId, sourceAbilityId },
      effectRef: `effect.${sourceAbilityId}`,
      targetRequirements: [
        { id: "encounteredIce", kind: "card", visibility: "public" },
        {
          id: "subroutine",
          kind: "subroutine",
          ...(encounteredIceId ? { sourceIceRef: encounteredIceId } : {}),
        },
      ],
    };
  }

  function rezzedCorpInstalledEconomyCreditSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return deps
      .rezzedCorpRootCardIds(state)
      .filter((cardId: CardInstanceId) =>
        deps.isCorpInstalledEconomyCreditSource(state, cardId),
      )
      .sort();
  }

  function shouldOpenCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
  ): boolean {
    const payloadEntries = Object.entries(legalAction.payload ?? {});
    const canonicalBasicCreditPayload =
      payloadEntries.length === 0 ||
      (legalAction.payload?.gainCreditsAmount === 1 &&
        (legalAction.payload?.effectKind === undefined ||
          legalAction.payload.effectKind === "gain_credits") &&
        payloadEntries.every(([key]) =>
          ["gainCreditsAmount", "effectKind"].includes(key),
        ));
    return (
      legalAction.side === "corp" &&
      legalAction.source === "basic_action" &&
      legalAction.type === "gain_credit" &&
      canonicalBasicCreditPayload &&
      rezzedCorpInstalledEconomyCreditSourceIds(state).length > 0
    );
  }

  function startCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const economyCreditSourceIds =
      rezzedCorpInstalledEconomyCreditSourceIds(state);
    if (economyCreditSourceIds.length === 0)
      throw new Error(
        "Es ist keine rezzed installierte Economy-Credit-Quelle vorhanden.",
      );
    const sourceDefinitionId = definitionFor(
      state,
      economyCreditSourceIds[0]!,
    ).id;
    state.pendingChoice = {
      choiceId: `corp_installed_economy_credit_choice_${state.stateVersion + 1}`,
      side: "corp",
      source: `corp_installed_economy.credit_choice:${state.stateVersion + 1}`,
      prompt: "Credit nehmen oder 2 Credits auf eine Economy-Quelle legen?",
      presentationKey: "corp_economy_credit_choice",
      kind: "select_option",
      options: [
        {
          id: "take_credit",
          label: "1 Credit nehmen",
          publicLabel: "1 Credit genommen",
          value: "take_credit",
          metadata: { amount: 1 },
        },
        ...economyCreditSourceIds.map((cardId, index) => ({
          id: `corp_installed_economy_credit_${cardId}`,
          label:
            economyCreditSourceIds.length === 1
              ? "2 Credits auf die Economy-Quelle legen"
              : `2 Credits auf Economy-Quelle ${index + 1} legen`,
          publicLabel: "2 Credits auf Economy-Quelle gelegt",
          value: cardId,
          metadata: { amount: 2, secondaryAmount: index + 1 },
        })),
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    legalAction.payload = {
      corpInstalledEconomyCreditChoiceOpened: true,
      gainCreditsAmount: 0,
      sourceDefinitionId,
    };
  }

  function resolveCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("corp_installed_economy.credit_choice")
    )
      throw new Error("Es ist keine Economy-Credit-Choice offen.");
    if (choice.side !== "corp" || legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Economy-Credit-Choice nutzen.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    if (selected === "take_credit") {
      const sourceCardId = rezzedCorpInstalledEconomyCreditSourceIds(state)[0]!;
      const sourceDefinitionId = definitionFor(state, sourceCardId).id;
      const gain = credits(state, "corp", 1, {
        kind: "card_effect",
        sourceDefinitionId,
        sourceCardId,
        gainOrdinal: 1,
        reason: "corp_installed_economy_credit_choice",
      });
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        choiceVisibility: "public",
        sourceDefinitionId,
        gainCreditsAmount: 1,
        gainedCredits: gain.creditedAmount,
        corpCreditsAfter: gain.creditsAfter,
      };
      return;
    }
    const selectedOption = choice.options.find(
      (option) => option.id === selected,
    );
    const sourceCardId = String(selectedOption?.value ?? "");
    if (
      !rezzedCorpInstalledEconomyCreditSourceIds(state).includes(sourceCardId)
    )
      throw new Error(
        "Die gewaehlte Economy-Credit-Quelle ist nicht mehr legal.",
      );
    const counterPayload = deps.addVisibleCardCounter(
      state,
      sourceCardId,
      "recurring_credit",
      2,
    );
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      choiceVisibility: "public",
      cardDefinitionId: definitionFor(state, sourceCardId).id,
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
      ...counterPayload,
      gainCreditsAmount: 0,
      gainedCredits: 0,
      corpCreditsAfter: state.corp.credits,
    };
  }

  return {
    forfeitRunnerAgendaForPointCost,
    forfeitCorpAgendaForPointCost,
    activeObligationCount,
    addActiveObligation,
    removeActiveObligation,
    spendCorpAgendaPointCost,
    installedAgendaOperationTarget,
    corpAgendaCounterOperationTarget,
    corpScoredAgendaForfeitTargets,
    hardwareTrashByCounterEligibleHardwareIds,
    hardwareTrashByCounterLegalActions,
    hardwareTrashByCounterTrashCountFromPayload,
    resolveHardwareTrashByCounterOperation,
    resolveTaggedRunnerResourceMultiTrashOperation,
    startRunnerInstalledMultiTrashChoice,
    resolveRunnerInstalledMultiTrashChoice,
    advancementPlacementLegalActions,
    resolveAgendaCounterOperation,
    resolveAdvancementPlacementOperation,
    advancementPlacementOptions,
    startAdvancementPlacementChoice,
    resolveAdvancementPlacementChoice,
    applyAdvancementCounterPlacement,
    advanceableInstalledCardTargets,
    isInstalledCorpCardAdvanceable,
    advancementDistributionOptions,
    startCardImplementationAdvancementDistributionChoice,
    parseAdvancementDistributionValue,
    sourcePartsForP334Choice,
    validateAdvancementDistribution,
    resolveCardImplementationAdvancementDistributionChoice,
    movableAdvancementSourceIds,
    moveAdvancementOptions,
    startCardImplementationMoveAdvancementChoice,
    resolveCardImplementationMoveAdvancementChoice,
    resolveCorpOperationAddAdvancementCounters,
    awardRunnerEventAgendaPoint,
    choiceAction,
    abilityMetadata,
    rezzedCorpInstalledEconomyCreditSourceIds,
    shouldOpenCorpInstalledEconomyCreditChoice,
    startCorpInstalledEconomyCreditChoice,
    resolveCorpInstalledEconomyCreditChoice,
  };
}
