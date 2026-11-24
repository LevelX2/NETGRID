import type { RandomPurpose } from "@netgrid/shared";
import { type CardInstanceId, type GameState, type LegalAction, type PlayerAction, type ServerId } from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import { definitionFor } from "../state/card-server-lookup";
import { nextRandom } from "../state/draw-random";
import { type StartRunOptions } from "../run/run-core-execution";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { cardImplementationRunnerRunStartSourceIds, executeCardImplementationRunnerRunStartEffects } from "../../ability-engine/card-implementation-runtime";
import type { RuntimeDeps } from "./runtime-shared";

export function createRunFlowRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps,
): import("./run-flow-runtime-port").RunFlowRuntimePort {
  function startRun(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    pendingSuccessBonusCredits?: number,
    accessCount = 1,
    options?: StartRunOptions,
    legalAction?: LegalAction,
  ): void {
    deps.runFlow.startRun(
      state,
      serverId,
      pendingSuccessBonusCredits,
      accessCount,
      options,
      legalAction,
    );
  }

  function resumeRunStart(state: GameState, legalAction?: LegalAction): void {
    deps.runFlow.resumeRunStart(state, legalAction);
  }

  function beginRunnerRunStartOrdering(
    state: GameState,
    legalAction?: LegalAction,
  ): boolean {
    const run = state.run;
    if (!run) throw new Error("Run-Start-Ordering benötigt einen aktiven Run.");
    const remaining = runnerRunStartSources(state);
    if (remaining.length === 0) return false;
    if (remaining.length === 1) {
      resolveRunnerRunStartSource(state, remaining[0]!, legalAction);
      return false;
    }
    state.pendingRunStartSourceOrder = { runId: run.runId, remaining };
    openRunnerRunStartOrderChoice(state);
    return true;
  }

  function resolveRunnerRunStartOrderChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): boolean {
    const sequence = state.pendingRunStartSourceOrder;
    const choice = state.pendingChoice;
    if (!sequence || !choice?.source.startsWith("runner_run_start.order:"))
      throw new Error("Es ist keine Run-Start-Reihenfolge offen.");
    if (
      playerAction.side !== "runner" ||
      legalAction.side !== "runner" ||
      state.run?.runId !== sequence.runId
    )
      throw new Error("Die Run-Start-Reihenfolge passt nicht zum aktiven Run.");
    const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0];
    const option = choice.options.find(
      (candidate) => candidate.id === selectedId,
    );
    const sourceKey = typeof option?.value === "string" ? option.value : "";
    const selectedIndex = sequence.remaining.findIndex(
      (source) => runStartSourceKey(source) === sourceKey,
    );
    if (selectedIndex < 0)
      throw new Error("Der gewählte Run-Start-Effekt ist nicht mehr fällig.");
    const selected = sequence.remaining[selectedIndex]!;
    const dueKeys = new Set(
      runnerRunStartSources(state).map(runStartSourceKey),
    );
    if (!dueKeys.has(sourceKey))
      throw new Error("Der gewählte Run-Start-Effekt ist veraltet.");
    delete state.pendingChoice;
    sequence.remaining.splice(selectedIndex, 1);
    resolveRunnerRunStartSource(state, selected, legalAction);
    sequence.remaining = sequence.remaining.filter((source) =>
      new Set(runnerRunStartSources(state).map(runStartSourceKey)).has(
        runStartSourceKey(source),
      ),
    );
    if (sequence.remaining.length > 1) {
      openRunnerRunStartOrderChoice(state);
      return true;
    }
    if (sequence.remaining.length === 1)
      resolveRunnerRunStartSource(state, sequence.remaining[0]!, legalAction);
    delete state.pendingRunStartSourceOrder;
    return false;
  }

  function runnerRunStartSources(state: GameState): Array<{
    kind: "card_implementation" | "random_strength";
    sourceCardId: CardInstanceId;
  }> {
    return [
      ...cardImplementationRunnerRunStartSourceIds(
        deps.cardImplementationRuntimeDeps,
        state,
      ).map((sourceCardId) => ({
        kind: "card_implementation" as const,
        sourceCardId,
      })),
      ...runnerRunStartRandomStrengthSourceIds(state).map((sourceCardId) => ({
        kind: "random_strength" as const,
        sourceCardId,
      })),
    ].sort((left, right) =>
      runStartSourceKey(left).localeCompare(runStartSourceKey(right)),
    );
  }

  function runnerRunStartRandomStrengthSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return state.runner.rig.programs
      .slice()
      .sort()
      .filter((cardId) =>
        runtime.icebreakerHasSpecial(
          state,
          cardId,
          "run_start_random_strength_bonus",
        ),
      );
  }

  function resolveRunnerRunStartSource(
    state: GameState,
    source: {
      kind: "card_implementation" | "random_strength";
      sourceCardId: CardInstanceId;
    },
    legalAction?: LegalAction,
  ): void {
    if (source.kind === "card_implementation") {
      executeCardImplementationRunnerRunStartEffects(
        deps.cardImplementationRuntimeDeps,
        state,
        legalAction,
        source.sourceCardId,
      );
      return;
    }
    applyRunStartRandomStrengthBonus(state, legalAction, source.sourceCardId);
  }

  function openRunnerRunStartOrderChoice(state: GameState): void {
    const sequence = state.pendingRunStartSourceOrder;
    if (!sequence || sequence.remaining.length <= 1)
      throw new Error("Run-Start-Reihenfolge benötigt mehrere Effekte.");
    state.pendingChoice = {
      choiceId: `runner_run_start_order_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner_run_start.order:${sequence.runId}`,
      prompt: "Wähle den nächsten Effekt am Beginn des Runs.",
      kind: "select_cards",
      options: sequence.remaining.map((source) => ({
        id: `source_${runStartSourceKey(source)}`,
        cardId: source.sourceCardId,
        label: definitionFor(state, source.sourceCardId).title,
        value: runStartSourceKey(source),
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    state.activeSide = "runner";
  }

  function runStartSourceKey(source: {
    kind: "card_implementation" | "random_strength";
    sourceCardId: CardInstanceId;
  }): string {
    return `${source.kind}:${source.sourceCardId}`;
  }

  function applyRunStartRandomStrengthBonus(
    state: GameState,
    legalAction?: LegalAction,
    onlySourceCardId?: CardInstanceId,
  ): void {
    const sourceCardIds = onlySourceCardId
      ? [onlySourceCardId]
      : runnerRunStartRandomStrengthSourceIds(state);
    if (sourceCardIds.length === 0 || !state.run) return;
    const outcomes: string[] = [];
    for (const sourceCardId of sourceCardIds) {
      const definition = definitionFor(state, sourceCardId);
      const randomPurpose: RandomPurpose = [29, definition.id];
      const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
      const runStrength = dieRoll;
      state.run.runStartRandomStrengthByBreaker = {
        ...(state.run.runStartRandomStrengthByBreaker ?? {}),
        [sourceCardId]: runStrength,
      };
      state.run.runStartRandomStrengthSourceCardId = sourceCardId;
      state.run.runStartRandomStrength = runStrength;
      outcomes.push(`${sourceCardId}:${dieRoll}:${runStrength}`);
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v1921RunnerProgramAbility: "run_start_random_strength_bonus",
          sourceDefinitionId: definition.id,
          runStartRandomStrengthSourceCardId: sourceCardId,
          randomPurpose: randomPurpose[0],
          v1921DieRoll: dieRoll,
          runStartRandomStrength: runStrength,
          randomCounterAfter: state.randomCounter,
        };
      }
    }
    if (legalAction && outcomes.length > 1) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1921RunnerProgramAbility: "run_start_random_strength_bonus",
        runStartRandomStrengthOutcomes: outcomes.join(","),
        randomCounterAfter: state.randomCounter,
      };
    }
  }

  function continueRun(state: GameState, legalAction?: LegalAction): void {
    deps.runFlow.continueRun(state, legalAction);
  }

  function addCurrentRunAccessCount(
    state: GameState,
    server: Extract<ServerId, "hq" | "rd">,
    amount: number,
  ): { publicPayload: Record<string, string | number | boolean> } {
    const run = state.run;
    if (!run || run.phase === "access")
      throw new Error(
        "Zusaetzlicher Access ist nur vor dem Access-Fenster moeglich.",
      );
    if (run.attackedServerId !== server)
      throw new Error(
        "Diese Access-Faehigkeit passt nicht zum aktuellen Server.",
      );
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Die Access-Anzahl ist ungueltig.");
    run.accessCount = Math.max(0, Math.floor(run.accessCount ?? 1)) + amount;
    return {
      publicPayload: {
        hiddenZoneBarrier: true,
        hiddenResourceAccessBonus: true,
        accessedServerId: server,
        additionalAccessCount: amount,
        runAccessCountAfter: run.accessCount,
      },
    };
  }

  function passCurrentEncounteredIce(
    state: GameState,
    legalAction: LegalAction,
    subtypeRequired?: "ap",
  ): { publicPayload: Record<string, string | number | boolean> } {
    const run = state.run;
    if (
      state.timingPoint !== "run.encounter_ice" ||
      run?.phase !== "encounter_ice" ||
      !run.encounteredIceId
    )
      throw new Error("Es gibt keine aktuelle ICE-Encounter zum Passieren.");
    const iceDefinition = definitionFor(state, run.encounteredIceId);
    if (subtypeRequired && !deps.cardHasSubtype(iceDefinition, subtypeRequired))
      throw new Error("Diese ICE hat nicht den benoetigten Subtyp.");
    const subroutines = deps.subroutinesForCurrentEncounter(
      state,
      iceDefinition,
    );
    for (let index = 0; index < subroutines.length; index += 1) {
      if (
        !run.brokenSubroutineIndexes.includes(index) &&
        !run.resolvedSubroutineIndexes.includes(index)
      ) {
        run.resolvedSubroutineIndexes.push(index);
      }
    }
    continueRun(state, legalAction);
    return {
      publicPayload: {
        passedEncounteredIce: true,
        passedIceDefinitionId: iceDefinition.id,
        skippedSubroutineCount: subroutines.length,
      },
    };
  }

  function archivesAccessRequiresDecisionOrEffect(
    state: GameState,
    cardId: CardInstanceId,
  ): boolean {
    const definition = definitionFor(state, cardId);
    if (definition.type === "agenda") return true;
    const advancementCounters = Math.max(
      0,
      Math.floor(state.cardInstances[cardId]?.advancementCounters ?? 0),
    );
    if (
      state.ambushHarness?.enabled &&
      (!state.ambushHarness.triggerDefinitionId ||
        state.ambushHarness.triggerDefinitionId === definition.id)
    )
      return true;
    const implementation = cardImplementationForDefinitionId(definition.id);
    if (implementation?.accessEffects?.length) {
      return implementation.accessEffects.some((effect) => {
        if (!effect.sourceZones.includes("archives")) return false;
        if (effect.ignoreIfAccessedFrom?.includes("archives")) return false;
        if (
          effect.condition?.kind === "runner_is_tagged" &&
          state.runner.tags <= 0
        )
          return false;
        if (
          effect.condition?.kind === "source_has_advancement_counters" &&
          advancementCounters < effect.condition.minimum
        )
          return false;
        return true;
      });
    }
    if (
      !state.corp.archives.includes(cardId) &&
      implementation?.hiddenReplacementLongtail?.kind ===
        "delayed_agenda_access_replacement"
    )
      return true;
    return (definition.mechanics ?? []).some(
      (mechanic) =>
        mechanic === "access_ambush" ||
        mechanic === "access_trace" ||
        mechanic === "access_replacement",
    );
  }

  return {
    startRun,
    resumeRunStart,
    beginRunnerRunStartOrdering,
    resolveRunnerRunStartOrderChoice,
    applyRunStartRandomStrengthBonus,
    continueRun,
    addCurrentRunAccessCount,
    passCurrentEncounteredIce,
    archivesAccessRequiresDecisionOrEffect,
  };
}
