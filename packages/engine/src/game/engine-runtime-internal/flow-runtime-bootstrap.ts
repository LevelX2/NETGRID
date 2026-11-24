import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import * as runtimePorts from "./runtime-port-bindings";
import {
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CounterType,
  type GameState,
  type LegalAction,
  type ServerId,
} from "@netgrid/shared";
import {
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  corpServerIdForInstalledCard,
  quoteCorpRootRezCost,
  rezCostForCard,
} from "../payment";
import {
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustRun,
  mustServer,
  publicInstalledCorpCardIdentityKnown,
  runnerInstalledCardIds,
  scoredCorpAgendaIds,
} from "../state/card-server-lookup";
import {
  drawCorpCards,
  randomHqAccess,
  rollDeterministicDie,
  shuffleStateIds,
  nextRandom,
} from "../state/draw-random";
import { credits, spendCredits } from "../state/economy-mutation";
import {
  addCardCounter,
  cardCounter,
  cardInstanceWithoutCounters,
  ensureRunnerTurnFlags,
  setCardCounter,
  spendCardCounter,
} from "../state/turn-flags-counters";
import { cleanupEmptyRemotes, ensureSpecialZones, removeFromAllZones } from "../state/zone-mutation";
import { configureEventContextHostComposition } from "../events/event-context-hosts";
import { BAD_PUBLICITY_LOSS_THRESHOLD } from "../win-conditions";
import {
  calculateRunnerLink as calculateRunnerLinkInTrace,
  traceBidChoice,
  startTraceFromOperation as startTraceFromOperationInTrace,
} from "../trace/trace-orchestration";
import { buildLegalAction as action } from "../turn/action-builders";
import { finalizeCorpIceInstallAfterExternalPayment } from "../install/install-card";
import { rezCard as executeRezCard } from "../rez/rez-card";
import {
  addRunnerTagsWithPrevention,
  configureDamageCoreHost,
  createDamageImminentEvent,
  doDamage,
  openDamageResolutionWindow,
  openEventModificationWindow,
  openReplacementWindow,
  openRunnerInstalledTrashPreventionWindow,
  resolveDamageImminentEvent,
  resolveDamageOperation,
  setDamagePayload,
  type DamageCoreHost,
  type DamageSummary,
} from "../damage/damage-core";
import { advanceArchivesBreachPastNonDecisionCards } from "../access/access-flow";
import {
  installedAccessBonusForServer,
  runnerHqAccessBonus as runnerHqAccessBonusForBreach,
} from "../access/breach-state";
import { resetBreakerStrength } from "../run/run-end-cleanup";
import {
  availableRunnerRunCredits,
  availableRunnerRunStartCredits,
  hostedPaymentCredits,
  isRestrictedHostedCreditSource,
  restrictedHostedCreditSourceIds,
  runDurationPaymentHost,
} from "../run/run-duration-payment";
import { isSupportedEncounterTraceSuccessEffect } from "../run/encounter-printed-effects";
import { isActivityGatedFortRunBlocked } from "../run/fort-run-side-families";
import {
  createRunAccessLegalActionHostComposition,
  type RunAccessLegalActionHostCompositionHost,
} from "../run/run-access-legal-action-hosts";
import { resumePaidRunnerBreakerAction } from "../run/runner-breaker-action-execution";
import { corpUtilityImplementationForDefinition } from "../play/corp-operation-resolution";
import { publicServerLabel } from "../../public-context";
import { traceSuccessEffectForCardImplementation } from "../../ability-engine/trace-implementations";
import { type RuntimeIcebreakerAbility } from "../../ability-engine/icebreaker-abilities";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import type { CardImplementationDefinition } from "../../card-implementations/types";
import { snapshotPersistentStealCostModifiersForSource } from "../../ability-engine/steal-cost-modifiers";
import type { CardCorpUtilityImplementation } from "../../ability-engine/definition-types";

import {
  cloneState,
  agendaPointsForScoredCard,
  finishRun,
  recurringTraceCreditPoolTotal,
} from "./runtime-bootstrap-support";
import type { RuntimeDeps } from "./runtime-shared";

function accessSourceDefinitionIdsForRuntime(): {
  setup: CardDefinitionId;
  trap: CardDefinitionId;
  crybaby: CardDefinitionId;
  taggedRunnerMeatDamageUpgrade: CardDefinitionId;
  accessNetDamageUpgrade: CardDefinitionId;
  oncePerRunAccessTraceUpgrade: CardDefinitionId;
  hardwareTrashByAdvancementAsset: CardDefinitionId;
  programTrashByAdvancementAsset: CardDefinitionId;
  advancementCoreDamageAsset: CardDefinitionId;
} {
  const unique = (
    sourceKind: string,
    predicate: (
      implementation: (typeof CARD_IMPLEMENTATIONS)[number],
    ) => boolean,
  ): CardDefinitionId => {
    const matches = CARD_IMPLEMENTATIONS.filter(predicate)
      .map((implementation) => implementation.cardDefinitionId)
      .sort();
    if (matches.length !== 1)
      throw new Error(
        `Expected exactly one ${sourceKind} implementation, found ${matches.length}.`,
      );
    return matches[0]!;
  };
  const hasAccessEffect = (
    implementation: (typeof CARD_IMPLEMENTATIONS)[number],
    predicate: (
      effect: NonNullable<typeof implementation.accessEffects>[number],
    ) => boolean,
  ) => implementation.accessEffects?.some(predicate) === true;
  return {
    setup: unique("Setup ambush", (implementation) =>
      hasAccessEffect(
        implementation,
        (effect) =>
          effect.sourceZones.includes("installed") &&
          effect.sourceZones.includes("hq") &&
          effect.sourceZones.includes("rd") &&
          effect.ignoreIfAccessedFrom?.includes("archives") === true &&
          effect.effects.some(
            (candidate) =>
              candidate.kind === "damage" &&
              candidate.damageType === "net" &&
              candidate.amount === 2,
          ) &&
          (effect.installedSourceActivation ?? "requires_rezzed") ===
            "requires_rezzed",
      ),
    ),
    trap: unique("paid net-damage-and-tag ambush", (implementation) =>
      hasAccessEffect(
        implementation,
        (effect) =>
          effect.cost?.kind === "corp_may_pay_credits" &&
          effect.cost.amount === 4 &&
          effect.effects.some(
            (candidate) =>
              candidate.kind === "damage" &&
              candidate.damageType === "net" &&
              candidate.amount === 3,
          ) &&
          effect.effects.some((candidate) => candidate.kind === "add_tags"),
      ),
    ),
    crybaby: unique(
      "link-reduction counter upgrade",
      (implementation) =>
        implementation.remainingReplacementLongtail?.kind ===
          "link_reduction_counter_upgrade" &&
        implementation.remainingReplacementLongtail.counterType === "crying",
    ),
    taggedRunnerMeatDamageUpgrade: unique(
      "tagged-runner meat-damage access effect",
      (implementation) =>
        hasAccessEffect(
          implementation,
          (effect) =>
            effect.condition?.kind === "runner_is_tagged" &&
            effect.effects.some(
              (candidate) =>
                candidate.kind === "damage" && candidate.damageType === "meat",
            ),
        ),
    ),
    accessNetDamageUpgrade: resolveUniqueInstalledNetDamageUpgrade(
      CARD_IMPLEMENTATIONS,
      (definitionId) => CARD_DEFINITIONS_BY_ID[definitionId],
    ),
    oncePerRunAccessTraceUpgrade: unique(
      "once-per-run access trace",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "trace" &&
              "limit" in candidate &&
              candidate.limit === "once_per_run_on_this_fort_per_source",
          ),
        ),
    ),
    hardwareTrashByAdvancementAsset: unique(
      "advancement-scaled hardware-trash access effect",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "trash_installed_runner_cards" &&
              candidate.target === "hardware" &&
              typeof candidate.amount === "object" &&
              candidate.amount.kind === "source_advancement_counter_count",
          ),
        ),
    ),
    programTrashByAdvancementAsset: unique(
      "advancement-scaled program-trash access effect",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "trash_installed_runner_cards" &&
              candidate.target === "program" &&
              typeof candidate.amount === "object" &&
              candidate.amount.kind === "source_advancement_counter_count",
          ),
        ),
    ),
    advancementCoreDamageAsset: unique(
      "advancement-scaled core-damage access effect",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "damage_from_source_advancement_counters" &&
              candidate.damageType === "core",
          ),
        ),
    ),
  };
}

export function resolveUniqueInstalledNetDamageUpgrade(
  implementations: readonly CardImplementationDefinition[],
  definitionFor: (definitionId: CardDefinitionId) => CardDefinition | undefined,
): CardDefinitionId {
  const matches = implementations
    .filter((implementation) =>
      isInstalledNetDamageUpgrade(
        implementation,
        definitionFor(implementation.cardDefinitionId),
      ),
    )
    .map((implementation) => implementation.cardDefinitionId)
    .sort();
  if (matches.length !== 1)
    throw new Error(
      `Expected exactly one installed net-damage upgrade implementation, found ${matches.length}.`,
    );
  return matches[0]!;
}

export function isInstalledNetDamageUpgrade(
  implementation: CardImplementationDefinition,
  definition: CardDefinition | undefined,
): boolean {
  if (definition?.type !== "upgrade") return false;
  const effects = implementation.accessEffects ?? [];
  return effects.some(
    (effect) =>
      effect.kind === "on_access" &&
      effect.sourceZones.length === 1 &&
      effect.sourceZones[0] === "installed" &&
      effect.installedSourceActivation === undefined &&
      effect.condition === undefined &&
      effect.cost === undefined &&
      effect.optional === undefined &&
      effect.effects.length === 1 &&
      effect.effects[0]?.kind === "damage" &&
      effect.effects[0].recipient === "runner" &&
      effect.effects[0].damageType === "net" &&
      effect.effects[0].amount === 1 &&
      effect.effects[0].preventable === true,
  );
}

export function configureFlowRuntimeBootstrap({
  cardImplementationRuntimeDeps,
}: Pick<RuntimeDeps, "cardImplementationRuntimeDeps">) {
  const accessSourceDefinitionIds = accessSourceDefinitionIdsForRuntime();
  function utilityInstalledOnFort(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    kind: Extract<
      CardCorpUtilityImplementation["kind"],
      | "fort_start_reorder_ice"
      | "fort_start_runner_spend_cap"
      | "start_run_redirect_to_source_fort"
    >,
    options: { rezzedOnly?: boolean; unrezzedOnly?: boolean } = {},
  ): CardInstanceId[] {
    return mustServer(state, serverId)
      .root.slice()
      .sort()
      .filter((cardId): cardId is CardInstanceId => {
        const instance = state.cardInstances[cardId];
        if (!instance?.definitionId || instance.controller !== "corp")
          return false;
        if (options.rezzedOnly && instance.rezzed !== true) return false;
        if (options.unrezzedOnly && instance.rezzed === true) return false;
        return (
          corpUtilityImplementationForDefinition(instance.definitionId)
            ?.kind === kind
        );
      });
  }

  function startOfRunRedirectSourceIds(
    state: GameState,
    originalServerId: Exclude<ServerId, "new_remote">,
  ): CardInstanceId[] {
    return state.corp.servers
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .flatMap((server) =>
        server.id === originalServerId ||
        !canRunnerBeRedirectedToFort(state, server.id)
          ? []
          : utilityInstalledOnFort(
              state,
              server.id,
              "start_run_redirect_to_source_fort",
              {
                rezzedOnly: true,
              },
            ),
      );
  }

  function canRunnerBeRedirectedToFort(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): boolean {
    if (
      isActivityGatedFortRunBlocked(
        runtimePorts.fortRunSideFamiliesHostForState(state),
        serverId,
      )
    )
      return false;
    const { amount: runStartTaxCredits } =
      runtimePorts.runStartTaxForCorpRootAssets(state);
    return (
      runStartTaxCredits === 0 ||
      availableRunnerRunStartCredits(runDurationPaymentHost(state)) >=
        runStartTaxCredits
    );
  }

  function startRunRedirectCostCredits(
    state: GameState,
    sourceCardId: CardInstanceId,
  ): number {
    const utility = runtimePorts.corpUtilityImplementationForCard(
      state,
      sourceCardId,
    );
    if (
      utility?.kind !== "start_run_redirect_to_source_fort" ||
      utility.timing !== "run_start" ||
      utility.redirectTarget !== "source_fort"
    )
      throw new Error("Die Run-Redirect-Quelle ist nicht legal.");
    const credits = Math.max(0, Math.floor(utility.cost.credits));
    if (!Number.isInteger(credits))
      throw new Error("Die Run-Redirect-Kosten sind ungueltig.");
    return credits;
  }

  function openStartOfRunFortUtilityWindow(
    state: GameState,
    legalAction?: LegalAction,
  ): boolean {
    const run = state.run;
    const availableCredits = Math.max(
      0,
      state.corp.credits -
        Math.max(
          0,
          Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
        ),
    );
    if (!run || state.pendingChoice) return false;
    const originalServerId = run.attackedServerId;
    const redirectSourceIds = startOfRunRedirectSourceIds(
      state,
      originalServerId,
    ).filter(
      (cardId) =>
        startRunRedirectCostCredits(state, cardId) <= availableCredits,
    );
    const reorderSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_reorder_ice",
      { rezzedOnly: true },
    );
    const rezzedSpendCapSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_runner_spend_cap",
      { rezzedOnly: true },
    );
    const unrezzedSpendCapSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_runner_spend_cap",
      { unrezzedOnly: true },
    ).filter((cardId) => state.corp.credits >= rezCostForCard(state, cardId));
    if (
      redirectSourceIds.length === 0 &&
      reorderSourceIds.length === 0 &&
      rezzedSpendCapSourceIds.length === 0 &&
      unrezzedSpendCapSourceIds.length === 0
    )
      return false;
    if (
      redirectSourceIds.length === 0 &&
      reorderSourceIds.length === 0 &&
      unrezzedSpendCapSourceIds.length === 0 &&
      rezzedSpendCapSourceIds.length > 0
    ) {
      openRunnerRunSpendCapChoice(
        state,
        rezzedSpendCapSourceIds[0]!,
        legalAction,
      );
      return true;
    }
    run.runStartInterventions = redirectSourceIds.map((cardId) => {
      const targetServerId = corpServerIdForInstalledCard(state, cardId);
      if (!targetServerId)
        throw new Error("Die Redirect-Quelle liegt nicht in einem Korp-Fort.");
      return {
        kind: "start_run_redirect_to_source_fort",
        originalServerId,
        sourceCardInstanceId: cardId,
        sourceDefinitionId: definitionFor(state, cardId).id,
        targetServerId,
        costCredits: startRunRedirectCostCredits(state, cardId),
      };
    });
    state.pendingChoice = {
      choiceId: `corp_start_of_run_redirect_${state.stateVersion + 1}`,
      side: "corp",
      source: `corp.start_of_run_redirect:${run.runId}:${originalServerId}`,
      prompt: "Start-of-run Utility",
      presentationKey: "start_run_redirect",
      kind: "select_option",
      options: [
        { id: "pass", label: "Run nicht umlenken" },
        ...redirectSourceIds.map((cardId) => {
          const targetServerId = corpServerIdForInstalledCard(state, cardId);
          if (!targetServerId)
            throw new Error(
              "Die Redirect-Quelle liegt nicht in einem Korp-Fort.",
            );
          return {
            id: `redirect_${cardId}`,
            label: `${definitionFor(state, cardId).title}: Run umlenken`,
            publicLabel: "Start-of-run Redirect",
            value: cardId,
            serverId: targetServerId,
            metadata: {
              cardTitle: definitionFor(state, cardId).title,
              creditCost: startRunRedirectCostCredits(state, cardId),
            },
          };
        }),
        ...reorderSourceIds.map((cardId) => ({
          id: `herman_${cardId}`,
          label: `${definitionFor(state, cardId).title}: ICE neu anordnen`,
          publicLabel: "Start-of-run Fort-Utility",
          value: cardId,
          serverId: originalServerId,
          metadata: { cardTitle: definitionFor(state, cardId).title },
        })),
        ...rezzedSpendCapSourceIds.map((cardId) => ({
          id: `obfuscated_${cardId}`,
          label: `${definitionFor(state, cardId).title}: Ansage erzwingen`,
          publicLabel: "Start-of-run Spend-Cap",
          value: cardId,
          serverId: originalServerId,
          metadata: {
            cardTitle: definitionFor(state, cardId).title,
            optionKind: "enforce_spend_cap",
          },
        })),
        ...unrezzedSpendCapSourceIds.map((cardId) => ({
          id: `obfuscated_rez_${cardId}`,
          label: `${definitionFor(state, cardId).title}: rezzen und Ansage erzwingen`,
          publicLabel: "Start-of-run Rez",
          value: cardId,
          serverId: originalServerId,
          metadata: {
            cardTitle: definitionFor(state, cardId).title,
            optionKind: "rez_and_enforce_spend_cap",
          },
        })),
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "corp";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        startOfRunRedirectWindowOpened: true,
        originalServerId,
        redirectSourceDefinitionIds: run.runStartInterventions
          .map((intervention) => intervention.sourceDefinitionId)
          .sort()
          .join(","),
      };
    }
    return true;
  }

  function openRunnerRunSpendCapChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    const run = mustRun(state);
    const source = mustInstance(state.cardInstances, sourceCardId);
    const serverId = corpServerIdForInstalledCard(state, sourceCardId);
    if (!serverId)
      throw new Error("Die Spend-Cap-Quelle liegt nicht in einem Korp-Fort.");
    if (serverId !== run.attackedServerId)
      throw new Error(
        "Die Spend-Cap-Quelle liegt nicht auf dem laufenden Fort.",
      );
    if (
      !source.rezzed ||
      corpUtilityImplementationForDefinition(source.definitionId)?.kind !==
        "fort_start_runner_spend_cap"
    )
      throw new Error("Die Spend-Cap-Quelle ist nicht rezzed.");
    const maxAnnouncement = Math.max(
      0,
      Math.floor(availableRunnerRunCredits(runDurationPaymentHost(state))),
    );
    state.pendingChoice = {
      choiceId: `runner_run_spend_cap_${state.stateVersion + 1}`,
      side: "runner",
      source: `corp.start_of_run_redirect.runner_spend_cap:${run.runId}:${sourceCardId}:${serverId}`,
      prompt: "Run-Bit-Ausgabe ansagen",
      presentationKey: "run_bit_spend",
      kind: "select_option",
      options: Array.from({ length: maxAnnouncement + 1 }, (_, amount) => ({
        id: `spend_${amount}`,
        label: `${amount}`,
        value: amount,
        metadata: { amount },
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "runner";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runCreditSpendCapChoiceOpened: true,
        sourceDefinitionId: source.definitionId,
        serverId,
      };
    }
  }

  function canReplaceFortCardsFromHq(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): boolean {
    const server = mustServer(state, serverId);
    const removedCount = server.root.length;
    if (removedCount === 0) return true;
    const candidates = state.corp.hq
      .filter((cardId) => {
        const definition = definitionFor(state, cardId);
        return (
          definition.side === "corp" &&
          (definition.type === "asset" ||
            definition.type === "agenda" ||
            definition.type === "upgrade")
        );
      })
      .sort();
    const orderIsLegal = (order: CardInstanceId[]): boolean => {
      const testState = cloneState(state);
      const testServer = mustServer(testState, server.id);
      testServer.root = [];
      for (const cardId of order) {
        const definition = definitionFor(testState, cardId);
        removeFromAllZones(testState, cardId);
        if (
          !runtimePorts.canInstallCorpRootCardInServer(
            testState,
            definition,
            testServer,
          )
        )
          return false;
        testServer.root.push(cardId);
        testState.cardInstances[cardId] = {
          ...mustInstance(testState.cardInstances, cardId),
          zone: { side: "corp", zone: "serverRoot", serverId: testServer.id },
        };
        if (
          corpRootMainCardIdsInServer(testState, testServer).length >
          runtimePorts.corpRootAgendaOrNodeCapacityInServer(
            testState,
            testServer,
          )
        )
          return false;
      }
      return true;
    };
    const visit = (startIndex: number, selected: CardInstanceId[]): boolean => {
      if (selected.length === removedCount) return orderIsLegal(selected);
      for (let index = startIndex; index < candidates.length; index += 1) {
        if (visit(index + 1, [...selected, candidates[index]!])) return true;
      }
      return false;
    };
    return visit(0, []);
  }

  function spendCorpRunTemporaryCreditsForCurrentRunCost(
    state: GameState,
    amount: number,
  ): void {
    if (amount <= 0) return;
    if (!state.run) throw new Error("Run-Kosten brauchen einen laufenden Run.");
    const installRezReserved = Math.max(
      0,
      Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
    );
    const spendableCorpCredits = Math.max(
      0,
      state.corp.credits - installRezReserved,
    );
    if (spendableCorpCredits < amount)
      throw new Error("Die Korp kann die Run-Kosten nicht bezahlen.");
    const runTemporarySpend = Math.min(
      amount,
      Math.max(
        0,
        Math.floor(state.run.corpRunTemporaryCredits?.remaining ?? 0),
      ),
    );
    if (runTemporarySpend > 0 && state.run.corpRunTemporaryCredits)
      state.run.corpRunTemporaryCredits.remaining = Math.max(
        0,
        state.run.corpRunTemporaryCredits.remaining - runTemporarySpend,
      );
    state.corp.credits -= amount;
  }

  function resolveTestSpinRunEnd(
    state: GameState,
    run: NonNullable<GameState["run"]>,
    legalAction?: LegalAction,
  ): { handled: boolean; stateChanged?: boolean } {
    const pending = run.testSpinTemporaryInstall;
    if (!pending) return { handled: false };
    const sourceDefinition = CARD_DEFINITIONS_BY_ID[pending.sourceDefinitionId];
    const instance = state.cardInstances[pending.cardId];
    if (
      instance &&
      state.runner.rig.programs.includes(pending.cardId) &&
      instance.zone.side === "runner" &&
      instance.zone.zone === "rig"
    ) {
      const definition = definitionFor(state, pending.cardId);
      removeFromAllZones(state, pending.cardId);
      state.runner.stack.push(pending.cardId);
      if (runtimePorts.runnerProgramUsesMemory(state, pending.cardId)) {
        state.runner.memoryUsed = Math.max(
          0,
          state.runner.memoryUsed - (definition.memoryCost ?? 0),
        );
      }
      state.cardInstances[pending.cardId] = {
        ...cardInstanceWithoutCounters(instance),
        faceup: false,
        rezzed: false,
        zone: { side: "runner", zone: "stack" },
      };
      runtimePorts.shuffleRunnerStack(
        state,
        [37, run.runId, pending.cardId],
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "pro018_test_spin_return_to_stack",
          sourceDefinitionId: pending.sourceDefinitionId,
          sourceTitle: sourceDefinition?.title ?? "Test Spin",
          returnedProgramDefinitionId: definition.id,
          returnedToStack: true,
          shufflePerformed: true,
          shuffled: true,
          randomCounterAfter: state.randomCounter,
        };
      }
      return { handled: true, stateChanged: true };
    }
    const penalty = 4 + Math.max(0, Math.floor(pending.installCostPenalty));
    const paid = Math.min(state.runner.credits, penalty);
    if (paid > 0) spendCredits(state, "runner", paid);
    const unpaid = penalty - paid;
    let damageSummary: DamageSummary | undefined;
    if (unpaid > 0) {
      damageSummary = doDamage(state, {
        damageId: `${run.runId}.${pending.sourceDefinitionId}.test_spin_penalty`,
        damageType: "meat",
        amount: unpaid,
        source: `run_end:${pending.sourceDefinitionId}`,
        randomSource: ["c", pending.sourceDefinitionId],
      });
    }
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "pro018_test_spin_penalty",
        sourceDefinitionId: pending.sourceDefinitionId,
        sourceTitle: sourceDefinition?.title ?? "Test Spin",
        returnedToStack: false,
        penaltyAmount: penalty,
        penaltyCreditsPaid: paid,
        runnerCreditsAfter: state.runner.credits,
        ...(damageSummary
          ? {
              damageResolved: true,
              damageType: damageSummary.damageType,
              damageAmount: damageSummary.amount,
              cardsTrashed: damageSummary.cardsTrashed,
              flatline: damageSummary.flatline,
            }
          : {}),
      };
    }
    return { handled: true, stateChanged: true };
  }

  const runAccessLegalActionHostComposition =
    createRunAccessLegalActionHostComposition({
      cards: {
        definitionFor,
        cardInstanceFor: (state, cardId) =>
          mustInstance(state.cardInstances, cardId),
        cardHasSubtype: runtimePorts.cardHasSubtype,
        runnerProgramUsesMemory: runtimePorts.runnerProgramUsesMemory,
        runnerInstalledCardIds,
        publicInstalledCorpCardIdentityKnown,
        effectiveSubtypesForCard: runtimePorts.effectiveSubtypesForCard,
        hostedProgramStrengthModifier:
          runtimePorts.hostedProgramStrengthModifier,
        icebreakerEncounterStrengthBonus:
          runtimePorts.icebreakerEncounterStrengthBonus,
        permanentIcebreakerStrengthCounterBonus:
          runtimePorts.permanentIcebreakerStrengthCounterBonus,
        canReplaceFortCardsFromHq,
      },
      servers: {
        mustServer,
        publicServerLabel,
        randomHqAccess,
      },
      access: {
        hasHiddenResourceAccessStartActions:
          runtimePorts.hasHiddenResourceAccessStartActions,
        advanceArchivesBreachPastNonDecisionCards,
        startRunnerPrivateLookChoice: runtimePorts.startRunnerPrivateLookChoice,
      },
      run: {
        currentRun: mustRun,
        currentEncounterSubroutines:
          runtimePorts.subroutinesForCurrentEncounter,
        runRemainderStrengthBonusForBreaker:
          runtimePorts.runRemainderStrengthBonusForBreaker,
        beginRunnerRunStartOrdering: runtimePorts.beginRunnerRunStartOrdering,
        applyRunnerTraceCounterRunStartEffects:
          runtimePorts.applyRunnerTraceCounterRunStartEffects,
        applyRunStartRandomStrengthBonus:
          runtimePorts.applyRunStartRandomStrengthBonus,
        openStartOfRunFortUtilityWindow,
        finishRun,
        successfulRunInterventionHost:
          runtimePorts.successfulRunInterventionHost,
        startPostAccessInstalledProgramChoice:
          runtimePorts.startPostAccessInstalledProgramChoice,
      },
      payment: {
        spendCredits,
        credits,
        rezCostForCard,
        creditCostForAction: runtimePorts.creditCostForAction,
        corpIceInstallTotalCost: runtimePorts.corpIceInstallTotalCost,
        hostedPaymentCredits,
        spendCorpRunTemporaryCreditsForCurrentRunCost,
        restrictedHostedCreditSourceIds,
        isRestrictedHostedCreditSource,
        spendRunnerAccessTrashCredits:
          runtimePorts.spendRunnerAccessTrashCredits,
      },
      install: {
        finalizeCorpIceInstallInnermost: (state, cardId, server, legalAction) =>
          finalizeCorpIceInstallAfterExternalPayment(
            runtimePorts.installCardHost(state),
            cardId,
            server,
            legalAction,
            { placement: "innermost" },
          ),
      },
      choices: {
        hiddenZoneArrangeChoiceHandlerHost:
          runtimePorts.hiddenZoneArrangeChoiceHandlerHost,
        openRunnerInstalledTrashPreventionWindow,
        startRunnerInstalledMultiTrashChoice: (
          state,
          legalAction,
          sourceCardId,
          input,
          eligibleCardIds,
        ) => {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            cardId: sourceCardId,
          };
          runtimePorts.startRunnerInstalledMultiTrashChoice(
            state,
            legalAction,
            input,
            eligibleCardIds,
          );
        },
      },
      cardImplementation: {
        accessEffectsForDefinition: (definitionId) =>
          cardImplementationForDefinitionId(definitionId)?.accessEffects ?? [],
        hiddenReplacementLongtailKindForDefinition: (definitionId) =>
          cardImplementationForDefinitionId(definitionId)
            ?.hiddenReplacementLongtail?.kind,
        accessHookKindsForDefinition: (definitionId) =>
          cardImplementationForDefinitionId(definitionId)?.accessHooks?.map(
            (hook) => hook.kind,
          ) ?? [],
        runCardImplementationActionHost:
          runtimePorts.runCardImplementationActionHost,
      },
      constants: {
        setup: accessSourceDefinitionIds.setup,
        trap: accessSourceDefinitionIds.trap,
        crybaby: accessSourceDefinitionIds.crybaby,
        taggedRunnerMeatDamageUpgrade:
          accessSourceDefinitionIds.taggedRunnerMeatDamageUpgrade,
        accessNetDamageUpgrade:
          accessSourceDefinitionIds.accessNetDamageUpgrade,
        oncePerRunAccessTraceUpgrade:
          accessSourceDefinitionIds.oncePerRunAccessTraceUpgrade,
        hardwareTrashByAdvancementAsset:
          accessSourceDefinitionIds.hardwareTrashByAdvancementAsset,
        programTrashByAdvancementAsset:
          accessSourceDefinitionIds.programTrashByAdvancementAsset,
        advancementCoreDamageAsset:
          accessSourceDefinitionIds.advancementCoreDamageAsset,
      },
      callbacks: {
        turn: {
          ensureRunnerTurnFlags,
          consumeRunnerFutureActionDebt:
            runtimePorts.consumeRunnerFutureActionDebt,
        },
        trace: {
          calculateRunnerLink: (state) =>
            calculateRunnerLinkInTrace(
              runtimePorts.traceOrchestrationHost(state),
            ),
          traceBidChoice,
          addCorpTraceCounterPoolCounters:
            runtimePorts.addCorpTraceCounterPoolCounters,
          corpTraceCounterPoolTotal: runtimePorts.corpTraceCounterPoolTotal,
          recurringTraceCreditPoolTotal,
          rabbitTraceLimitReductionForIceTrace:
            runtimePorts.rabbitTraceLimitReductionForIceTrace,
          resolveTraceHardwareWreckerSuccess:
            runtimePorts.resolveTraceHardwareWreckerSuccess,
          resolveTraceTrashRunnerResourceSuccess:
            runtimePorts.resolveTraceTrashRunnerResourceSuccess,
          supportsTraceSuccessEffect: (effect) =>
            isSupportedEncounterTraceSuccessEffect(
              effect,
              runtimePorts.traceCounterEffectDefinitionFor,
            ),
          startTraceFromOperation: (
            state,
            sourceDefinitionId,
            traceLimit,
            legalAction,
            successEffect,
          ) =>
            startTraceFromOperationInTrace(
              runtimePorts.traceOrchestrationHost(state),
              sourceDefinitionId,
              traceLimit,
              legalAction,
              successEffect,
            ),
          traceSuccessEffectForCardImplementation,
        },
        damage: {
          addRunnerTagsWithPrevention,
          createDamageImminentEvent,
          doDamage,
          openDamageResolutionWindow,
          openEventModificationWindow,
          openReplacementWindow,
          resolveDamageImminentEvent,
          setDamagePayload,
          resolveDamageOperation,
        },
        tags: {
          addRunnerTagsWithPrevention,
        },
        counters: {
          cardCounter,
          addCardCounter,
          setCardCounter,
          spendCardCounter,
          addVirusCounterWithCounterPrevention:
            runtimePorts.addVirusCounterWithCounterPrevention,
          preventOneVirusCounterWithCounterPrevention:
            runtimePorts.preventOneVirusCounterWithCounterPrevention,
          poxCountersForServer: runtimePorts.poxCountersForServer,
          addCounterToAllInstalledRunnerIcebreakers:
            runtimePorts.addCounterToAllInstalledRunnerIcebreakers,
        },
        ice: {
          strengthForIce: runtimePorts.iceStrengthFor,
          icebreakerHasSpecial: (state, breakerId, special) =>
            runtimePorts.icebreakerHasSpecial(
              state,
              breakerId,
              special as NonNullable<RuntimeIcebreakerAbility["special"]>,
            ),
          selectedServerIcebreakerStrengthCounterBonus:
            runtimePorts.selectedServerIcebreakerStrengthCounterBonus,
          resetBreakerStrength,
          withoutVariableIceState: runtimePorts.withoutVariableIceState,
        },
        zones: {
          removeFromAllZones,
          trashCorpInstalledCardToArchives:
            runtimePorts.trashCorpInstalledCardToArchives,
          trashRunnerInstalledCardToHeap:
            runtimePorts.trashRunnerInstalledCardToHeap,
          trashRunnerInstalledProgram: runtimePorts.trashRunnerInstalledProgram,
          cleanupEmptyRemotes,
          ensureSpecialZones,
          shuffleCorpCardIntoRd: runtimePorts.shuffleCorpCardIntoRd,
          returnRunnerInstalledProgramsToGripForAccess:
            runtimePorts.returnRunnerInstalledProgramsToGripForAccess,
        },
        effects: {
          executeEffectCommands: runtimePorts.executeEffectCommands,
          breakAbilityForLegalAction: runtimePorts.breakAbilityForLegalAction,
          breakSubroutineCostBreakdown:
            runtimePorts.breakSubroutineCostBreakdown,
          abilityMetadata: runtimePorts.abilityMetadata,
          revealCorpRdTop: runtimePorts.revealCorpRdTop,
        },
        rng: {
          nextRandom,
          rollDie: rollDeterministicDie,
          shuffleStateIds,
        },
        misc: {
          drawCorpCards,
          drawRunnerCards: runtimePorts.drawRunnerCards,
          awardRunnerEventAgendaPoint: runtimePorts.awardRunnerEventAgendaPoint,
          activeObligationCount: runtimePorts.activeObligationCount,
          addActiveObligation: runtimePorts.addActiveObligation,
          applyRunnerForgoNextAction: runtimePorts.applyRunnerForgoNextAction,
          hasInstalledRunnerApDamageReducerHardware:
            runtimePorts.hasInstalledRunnerApDamageReducerHardware,
          traceCounterEffectDefinitionFor:
            runtimePorts.traceCounterEffectDefinitionFor,
          installedRunnerVirusSourceIds:
            runtimePorts.installedRunnerVirusSourceIds,
          virusCounterImplementationForCard:
            runtimePorts.virusCounterImplementationForCard,
          agendaPointsForScoredCard,
          snapshotPersistentStealCostModifiersForSource,
          archivesAccessRequiresDecisionOrEffect:
            runtimePorts.archivesAccessRequiresDecisionOrEffect,
          resolveTestSpinRunEnd,
          rezIceWithoutRunContinuation: (state, cardId, legalAction) =>
            executeRezCard(
              runtimePorts.rezCardHost(state),
              cardId,
              false,
              legalAction,
              { runContinuation: "none" },
            ),
          rezRootCardAtReactionWindow: (state, cardId, legalAction) => {
            const quote = quoteCorpRootRezCost(state, cardId);
            if (!quote.canPay)
              throw new Error(
                "Die Korp kann die Aardvark-Rez-Kosten nicht bezahlen.",
              );
            const rezAction = action(
              state,
              "corp",
              "rez_card",
              `${definitionFor(state, cardId).title} im Reaktionsfenster rezzen`,
              cardId,
              costQuoteToLegalActionCosts(quote),
              {
                ...costQuotePublicPayload(quote),
                aardvarkReactionSelfRez: true,
              },
            );
            executeRezCard(
              runtimePorts.rezCardHost(state),
              cardId,
              true,
              rezAction,
              { runContinuation: "none" },
            );
            legalAction.payload = {
              ...(legalAction.payload ?? {}),
              ...rezAction.payload,
            };
          },
          resumePaidRunnerBreakerAction: (state, legalAction) =>
            resumePaidRunnerBreakerAction(
              runtimePorts.runnerBreakerActionExecutionHost(state),
              legalAction,
            ),
          installedRevealHelperCount: (state) =>
            runtimePorts.v1915InstalledRevealHelperIds(state).length,
        },
      },
    } satisfies RunAccessLegalActionHostCompositionHost);

  const runFlow = runAccessLegalActionHostComposition.runFlow;
  const accessFlow = runAccessLegalActionHostComposition.accessFlow;

  configureEventContextHostComposition({
    cards: {
      agendaPointsForScoredCard,
      cardCounter,
      hostedProgramStrengthModifier: runtimePorts.hostedProgramStrengthModifier,
    },
    publicContext: {
      creditCostForAction: runtimePorts.creditCostForAction,
      pumpAmountForLegalAction: runtimePorts.pumpAmountForLegalAction,
    },
    callbacks: {
      breachStateHost: runtimePorts.breachStateHost,
      installedAccessBonusForServer,
      runnerHqAccessBonusForBreach,
    },
    constants: {
      badPublicityLossThreshold: BAD_PUBLICITY_LOSS_THRESHOLD,
    },
  });
  type VisibleCounterPayload = {
    counterType: CounterType;
    addedCounterAmount?: number;
    removedCounterAmount?: number;
    remainingCounters: number;
  };

  const damageCoreHost: DamageCoreHost = {
    cards: {
      definitionFor,
      runnerInstalledCardIds,
      scoredCorpAgendaIds,
      scoredAgendaKindForDefinition: runtimePorts.scoredAgendaKindForDefinition,
    },
    zones: {
      removeFromAllZones,
      trashRunnerInstalledCardToHeap:
        runtimePorts.trashRunnerInstalledCardToHeap,
      trashRunnerInstalledCardsToHeapBatch:
        runtimePorts.trashRunnerInstalledCardsToHeapBatch,
      returnRunnerInstalledCardToGrip:
        runtimePorts.returnRunnerInstalledCardToGrip,
    },
    runner: {
      drawRunnerCard: runtimePorts.drawRunnerCard,
      ensureRunnerTurnFlags,
      addFutureActionDebt: runtimePorts.addRunnerFutureActionDebt,
    },
    corp: {
      agendaPointTotal: runtimePorts.corpAgendaPointTotal,
      chooseAgendasForPointCost: runtimePorts.chooseCorpAgendasForPointCost,
      agendaPointsForScoredCard,
      forfeitAgendaForPointCost: runtimePorts.forfeitCorpAgendaForPointCost,
      spendAgendaPointCost: runtimePorts.spendCorpAgendaPointCost,
    },
    counters: {
      cardCounter: (state, cardId, counterType) =>
        cardCounter(state, cardId, counterType as CounterType),
      spendCardCounter: (state, cardId, counterType, amount) =>
        spendCardCounter(state, cardId, counterType as CounterType, amount),
    },
    credits: {
      gain: credits,
      spend: spendCredits,
    },
    rng: {
      nextRandom,
    },
    reactions: {
      openPostMeatDamageReactionWindow:
        runtimePorts.openPostMeatDamageReactionWindow,
    },
  };

  configureDamageCoreHost(damageCoreHost);

  return {
    runAccessLegalActionHostComposition,
    runFlow,
    accessFlow,
    damageCoreHost,
  };
}
