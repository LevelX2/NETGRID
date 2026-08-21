import type {
  CardCreditGainContinuation,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import type {
  CardRunEncounterInterventionImplementation,
  CardVariableRezImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  corpFortRunRezSupportQuotePayload,
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  discountedRezSourceIdsForRunIce,
  quoteCorpFortRunRezSupport,
  quoteCorpRezCost,
  quoteCorpRootRezCost,
} from "../payment";
import { buildLegalAction } from "../turn/action-builders";
import { credits } from "../state/economy-mutation";
import {
  corpRootRezCreditOutcomeQuotePayload,
  immediateRootRezCreditGainForDefinition,
  quoteCorpRootRezCreditOutcome,
} from "../payment/root-rez-credit-outcome";
import { buildRegisteredRunWindowActions } from "./windows/run-window-registry";
import { runIsAtServerAfterPassingLastIce } from "./windows/after-passing-last-ice-window";
import type {
  RootRezContinuationResult,
  RootRezEffectResult,
  RunRezWindowHost,
  RunRezWindowResult,
  RezInterruptJackOutWindowResult,
} from "./windows/run-window-host";

type ActiveRun = NonNullable<GameState["run"]>;

type CorpRootRezResolver = {
  name: string;
  resolve: (state: GameState) => void;
};

export type {
  RootRezContinuationResult,
  RootRezEffectResult,
  RunRezActionBuildResult,
  RunRezWindowHost,
  RunRezWindowResult,
  RezInterruptJackOutWindowResult,
} from "./windows/run-window-host";

export function buildCorpApproachActions(
  host: RunRezWindowHost,
): LegalAction[] {
  const run = mustRun(host.state);
  if (!run.approachedIceId) return [];
  const ice = host.cards.cardInstanceFor(run.approachedIceId);
  const definition = host.cards.definitionFor(run.approachedIceId);
  const actions: LegalAction[] = [];
  actions.push(...buildCanonicalPaidIceRezActions(host, run.approachedIceId));
  if (!ice.rezzed && !variableRezForDefinition(definition)) {
    for (const sourceId of discountedRezSourceIdsForRunIce(
      host.state,
      run.approachedIceId,
    )) {
      const oliviaRezQuote = quoteCorpRezCost(host.state, run.approachedIceId, {
        discountedRezSourceCardId: sourceId,
      });
      if (!oliviaRezQuote.canPay) continue;
      const oliviaRezCost = oliviaRezQuote.finalCredits;
      actions.push(
        buildLegalAction(
          host.state,
          "corp",
          "rez_ice",
          `Olivia Salazar: ${definition.title} für ${oliviaRezCost} ${oliviaRezCost === 1 ? "Credit" : "Credits"} rezzen`,
          run.approachedIceId,
          costQuoteToLegalActionCosts(oliviaRezQuote),
          costQuotePublicPayload(oliviaRezQuote),
        ),
      );
    }
  }
  actions.push(
    buildLegalAction(
      host.state,
      "corp",
      "decline_rez",
      ice.rezzed
        ? "Keine weitere Karte rezzen / Begegnung beginnen"
        : "ICE nicht rezzen",
      "game_rule",
      [],
      ice.rezzed ? { runApproachRootRezPass: true } : undefined,
    ),
  );
  return [...actions, ...buildCorpRunRootRezActions(host)];
}

export function buildCanonicalPaidIceRezActions(
  host: RunRezWindowHost,
  iceId: CardInstanceId,
): LegalAction[] {
  const ice = host.cards.cardInstanceFor(iceId);
  const definition = host.cards.definitionFor(iceId);
  if (ice.rezzed || definition.type !== "ice") return [];
  const rezQuote = quoteCorpRezCost(host.state, iceId);
  if (!rezQuote.canPay) return [];
  const variableRezActions = variableIceRezActions(
    host,
    iceId,
    definition,
    rezQuote.finalCredits,
    rezQuote.modifiers.map((modifier) => modifier.sourceDefinitionId),
  );
  if (variableRezActions.length > 0) return variableRezActions;
  return [
    buildLegalAction(
      host.state,
      "corp",
      "rez_ice",
      `${definition.title} rezzen`,
      iceId,
      costQuoteToLegalActionCosts(rezQuote),
      costQuotePublicPayload(rezQuote),
    ),
  ];
}

export function buildCorpTraceSelfRezActions(
  host: RunRezWindowHost,
): LegalAction[] {
  if (!host.state.trace) return [];
  const actions: LegalAction[] = [];
  for (const server of host.state.corp.servers
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))) {
    for (const cardId of server.root.slice().sort()) {
      const instance = host.state.cardInstances[cardId];
      if (!instance || instance.rezzed || instance.controller !== "corp")
        continue;
      const definition = host.cards.definitionFor(cardId);
      if (definition.type !== "asset" && definition.type !== "upgrade")
        continue;
      const permitsTraceRez = cardImplementationForDefinitionId(
        definition.id,
      )?.selfRezWindows?.some((window) => window.kind === "trace_attempt");
      if (!permitsTraceRez) continue;
      const rezQuote = quoteCorpRootRezCost(host.state, cardId);
      if (!rezQuote.canPay) continue;
      actions.push(
        buildLegalAction(
          host.state,
          "corp",
          "rez_card",
          `${definition.title} während des Trace rezzen`,
          cardId,
          costQuoteToLegalActionCosts(rezQuote),
          {
            ...costQuotePublicPayload(rezQuote),
            traceWindowSelfRez: true,
          },
        ),
      );
    }
  }
  return actions;
}

export function buildCorpRunRootRezActions(
  host: RunRezWindowHost,
): LegalAction[] {
  const run = host.state.run;
  if (!run) return [];
  const attackedServer = host.servers.mustServer(run.attackedServerId);
  const actions: LegalAction[] = [];
  for (const server of host.state.corp.servers
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))) {
    for (const cardId of server.root.slice().sort()) {
      const instance = host.state.cardInstances[cardId];
      if (!instance || instance.rezzed) continue;
      const definition = host.cards.definitionFor(cardId);
      if (definition.type !== "asset" && definition.type !== "upgrade")
        continue;
      const rezQuote = quoteCorpRootRezCost(host.state, cardId);
      if (!rezQuote.canPay) continue;
      if (!rootRezLifecycleIsSolvable(host, cardId, definition, server))
        continue;
      const action = buildLegalAction(
        host.state,
        "corp",
        "rez_card",
        `${definition.title} in ${server.label} rezzen`,
        cardId,
        costQuoteToLegalActionCosts(rezQuote),
        {
          ...costQuotePublicPayload(rezQuote),
          rezInterruptJackOutEligible: true,
        },
      );
      const creditOutcomeQuote = quoteCorpRootRezCreditOutcome(
        host.state,
        cardId,
        action.actionId,
        rezQuote.finalCredits,
      );
      if (creditOutcomeQuote) {
        action.payload = {
          ...(action.payload ?? {}),
          ...corpRootRezCreditOutcomeQuotePayload(creditOutcomeQuote),
        };
      }
      const fortRunRezSupportQuote = quoteCorpFortRunRezSupport(
        host.state,
        cardId,
        action.actionId,
        rezQuote.finalCredits,
      );
      if (fortRunRezSupportQuote) {
        action.payload = {
          ...(action.payload ?? {}),
          ...corpFortRunRezSupportQuotePayload(fortRunRezSupportQuote),
        };
      }
      actions.push(action);
    }
  }
  actions.push(
    ...buildRegisteredRunWindowActions(
      host.fortPass,
      run,
      attackedServer,
      "corp_root_rez_window",
    ),
  );
  return actions;
}

function rootRezLifecycleIsSolvable(
  host: RunRezWindowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  server: CorpServer,
): boolean {
  const lifecycle = cardImplementationForDefinitionId(definition.id)?.lifecycle
    ?.on_rez;
  if (
    !lifecycle?.some((effect) => {
      if (effect.kind !== "replace_source_fort_cards_from_hq") return false;
      if (effect.rezTiming !== "after_runner_passed_last_ice_on_source_fort")
        throw new Error("Die Fort-Ersatzkarte hat kein gültiges Rez-Timing.");
      return true;
    })
  )
    return true;
  const run = host.state.run;
  if (!run || !runIsAtServerAfterPassingLastIce(run, server)) return false;
  return host.callbacks.canReplaceFortCardsFromHq(server.id);
}

export function buildCorpRunRootRezWindowActions(
  host: RunRezWindowHost,
): LegalAction[] {
  const run = host.state.run;
  if (!run) return [];
  const server = host.servers.mustServer(run.attackedServerId);
  const isFortPassWindow = host.state.timingPoint === "run.jack_out_window";
  const actions = isFortPassWindow
    ? buildRegisteredRunWindowActions(
        host.fortPass,
        run,
        server,
        "corp_fort_pass_window",
      )
    : host.state.timingPoint === "run.movement_rez_window"
      ? buildCorpRunRootRezActions(host)
      : [];
  if (!isCorpRunRootRezWindowOpen(host)) return [];
  return [
    ...actions,
    buildLegalAction(
      host.state,
      "corp",
      "decline_rez",
      isFortPassWindow
        ? "Keine Fort-Aktion / Weiter"
        : "Nichts rezzen / Weiter",
      "game_rule",
      [],
      {
        ...(isFortPassWindow
          ? { runFortPassPass: true }
          : { runRootRezPass: true }),
        serverId: server.id,
        serverLabel: server.label,
      },
    ),
  ];
}

export function corpRunRootRezActionsAvailable(
  host: RunRezWindowHost,
): boolean {
  return buildCorpRunRootRezActions(host).length > 0;
}

export function isCorpRunRootRezWindowOpen(host: RunRezWindowHost): boolean {
  const run = host.state.run;
  if (!run) return false;
  const server = host.servers.mustServer(run.attackedServerId);
  if (host.state.timingPoint === "run.jack_out_window") {
    if (run.fortPassWindowPassedKeys?.includes(corpRunFortPassWindowKey(run)))
      return false;
    return (
      buildRegisteredRunWindowActions(
        host.fortPass,
        run,
        server,
        "corp_fort_pass_window",
      ).length > 0
    );
  }
  if (host.state.timingPoint !== "run.movement_rez_window") return false;
  const key = corpRunRootRezWindowKey(run);
  if (run.rootRezWindowPassedKeys?.includes(key)) return false;
  if (run.rootRezWindowPendingPassKeys?.includes(key)) return true;
  return buildCorpRunRootRezActions(host).length > 0;
}

export function corpRunFortPassWindowKey(run: ActiveRun): string {
  return `fort-pass:${corpRunRootRezWindowKey(run)}`;
}

export function corpRunRootRezWindowKey(run: ActiveRun): string {
  const position =
    run.position.kind === "ice"
      ? `ice:${run.position.serverId}:${run.position.iceIndex}`
      : `server:${run.position.serverId}`;
  return `${run.runId}:${position}`;
}

export function passCorpRunRootRezWindow(
  host: RunRezWindowHost,
  legalAction: LegalAction,
): RunRezWindowResult {
  const timingPoint = host.state.timingPoint;
  if (
    timingPoint !== "run.jack_out_window" &&
    timingPoint !== "run.movement_rez_window"
  )
    throw new Error("Root-Rez-Fenster ist nicht offen.");
  const run = mustRun(host.state);
  if (!isCorpRunRootRezWindowOpen(host))
    throw new Error("Root-Rez-Fenster wurde bereits geschlossen.");
  const server = host.servers.mustServer(run.attackedServerId);
  const isFortPassWindow = timingPoint === "run.jack_out_window";
  if (isFortPassWindow) {
    run.fortPassWindowPassedKeys = Array.from(
      new Set([
        ...(run.fortPassWindowPassedKeys ?? []),
        corpRunFortPassWindowKey(run),
      ]),
    ).sort();
  } else {
    const key = corpRunRootRezWindowKey(run);
    run.rootRezWindowPassedKeys = Array.from(
      new Set([...(run.rootRezWindowPassedKeys ?? []), key]),
    ).sort();
    run.rootRezWindowPendingPassKeys = (
      run.rootRezWindowPendingPassKeys ?? []
    ).filter((candidate) => candidate !== key);
    if (run.rootRezWindowPendingPassKeys.length === 0)
      delete run.rootRezWindowPendingPassKeys;
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...(isFortPassWindow
      ? { runFortPassPass: true }
      : { runRootRezPass: true }),
    serverId: server.id,
    serverLabel: server.label,
  };
  if (isFortPassWindow) host.state.activeSide = "runner";
  else host.callbacks.continueAfterRootRez(legalAction);
  return {
    handled: true,
    serverId: server.id,
    continueAfterRez: true,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

export function handleRunRootRezPostRez(
  host: RunRezWindowHost,
  rezzedCardId: CardInstanceId,
  legalAction?: LegalAction,
): RootRezContinuationResult {
  const run = host.state.run;
  if (host.state.timingPoint === "run.movement_rez_window" && run) {
    run.rootRezWindowPendingPassKeys = Array.from(
      new Set([
        ...(run.rootRezWindowPendingPassKeys ?? []),
        corpRunRootRezWindowKey(run),
      ]),
    ).sort();
  }
  const rezInterruptResult = startRezInterruptJackOutChoice(
    host,
    rezzedCardId,
    legalAction,
  );
  if (rezInterruptResult.handled) return rezInterruptResult;
  const rootEffect = resolveCorpRootRezEffect(host, rezzedCardId, legalAction);
  if (host.state.pendingChoice) {
    return {
      handled: true,
      rezzedCardId,
      resolvedPayload: legalAction?.payload,
      stateChanged: true,
    };
  }
  closeEmptyMovementRootRezWindowAfterRez(host);
  if (rootEffect.handled) {
    host.callbacks.continueAfterRootRez(legalAction);
    return { ...rootEffect, continueAfterRez: true };
  }
  host.callbacks.continueAfterRootRez(legalAction);
  return {
    handled: true,
    rezzedCardId,
    continueAfterRez: true,
    resolvedPayload: legalAction?.payload,
    stateChanged: true,
  };
}

function closeEmptyMovementRootRezWindowAfterRez(host: RunRezWindowHost): void {
  const run = host.state.run;
  if (
    host.state.timingPoint !== "run.movement_rez_window" ||
    !run ||
    buildCorpRunRootRezActions(host).length > 0
  )
    return;
  const key = corpRunRootRezWindowKey(run);
  run.rootRezWindowPassedKeys = Array.from(
    new Set([...(run.rootRezWindowPassedKeys ?? []), key]),
  ).sort();
  run.rootRezWindowPendingPassKeys = (
    run.rootRezWindowPendingPassKeys ?? []
  ).filter((candidate) => candidate !== key);
  if (run.rootRezWindowPendingPassKeys.length === 0)
    delete run.rootRezWindowPendingPassKeys;
}

export function resolveCorpRootRezEffect(
  host: RunRezWindowHost,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): RootRezEffectResult {
  const definition = host.cards.definitionFor(cardId);
  const resolver = cardImplementationCorpRootRezResolver(definition);
  if (!resolver) return { handled: false, rezzedCardId: cardId };
  resolver.resolve(host.state);
  if (isObligationDebtDefinition(definition.id)) {
    const acmeLongtail =
      remainingReplacementLongtailImplementationForDefinition(definition.id);
    const gainedCredits =
      acmeLongtail?.kind === "obligation_debt"
        ? acmeLongtail.gainCreditsOnRez
        : 12;
    if (host.state.pendingCorpCreditGainReplacement) {
      host.state.pendingCorpCreditGainReplacement.continuation = {
        kind: "corp_root_rez_obligation",
        sourceCardId: cardId,
        sourceDefinitionId: definition.id,
        gainedCredits,
      };
    } else {
      finishObligationDebtRootRez(host, cardId, gainedCredits, legalAction);
    }
  }
  return {
    handled: true,
    rezzedCardId: cardId,
    sourceDefinitionId: definition.id,
    rootEffectResolved: true,
    resolvedPayload: legalAction?.payload,
    stateChanged: true,
  };
}

function finishObligationDebtRootRez(
  host: RunRezWindowHost,
  cardId: CardInstanceId,
  gainedCredits: number,
  legalAction?: LegalAction,
): void {
  host.callbacks.addActiveObligation(1);
  host.callbacks.trashCorpInstalledCardToArchives(cardId, legalAction);
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    gainedCredits,
    selfTrashed: true,
    obligationDebtActive: host.callbacks.activeObligationCount() > 0,
    obligationDebtCountAfter: host.callbacks.activeObligationCount(),
    corpCreditsAfter: host.state.corp.credits,
  };
}

export function resumeObligationDebtRootRezAfterCreditGain(
  host: RunRezWindowHost,
  legalAction: LegalAction,
  continuation: Extract<
    CardCreditGainContinuation,
    { kind: "corp_root_rez_obligation" }
  >,
): void {
  const source = host.state.cardInstances[continuation.sourceCardId];
  if (
    !source ||
    source.definitionId !== continuation.sourceDefinitionId ||
    !host.state.corp.servers.some((server) =>
      server.root.includes(continuation.sourceCardId),
    )
  )
    throw new Error("Die Obligation-Quelle ist nicht mehr installiert.");
  finishObligationDebtRootRez(
    host,
    continuation.sourceCardId,
    continuation.gainedCredits,
    legalAction,
  );
}

export function startRezInterruptJackOutChoice(
  host: RunRezWindowHost,
  rezzedCardId: string,
  legalAction?: LegalAction,
): RezInterruptJackOutWindowResult {
  const run = host.state.run;
  if (!run) return { handled: false };
  const rezzedCardInstanceId = rezzedCardId as CardInstanceId;
  const definition = host.cards.definitionFor(rezzedCardInstanceId);
  if (definition.type !== "asset" && definition.type !== "upgrade")
    return { handled: false };
  const rezInterruptSourceId = installedRezInterruptJackOutSourceIds(host)[0];
  if (!rezInterruptSourceId) return { handled: false };
  if (
    !host.servers
      .mustServer(run.attackedServerId)
      .root.includes(rezzedCardInstanceId)
  )
    return { handled: false };
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  run.rezInterruptPendingRezCardId = rezzedCardInstanceId;
  run.rezInterruptPendingRezTimingPoint = host.state.timingPoint;
  run.rezInterruptPendingRezActiveSide = host.state.activeSide;
  host.state.pendingChoice = {
    choiceId: `rez_interrupt_jack_out_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `rez_interrupt.jack_out:${rezInterruptSourceId}:${rezzedCardId}:${host.state.stateVersion + 1}`,
    prompt: "Nach dem Rez jack out?",
    kind: "select_option",
    options: [
      {
        id: "jack_out",
        label: "Jack out",
        publicLabel: "Rez-Interrupt nutzen",
        value: "jack_out",
      },
      {
        id: "pass",
        label: "Nicht nutzen",
        publicLabel: "Rez-Interrupt nicht nutzen",
        value: "pass",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  host.state.activeSide = "runner";
  if (legalAction) {
    const serverLabel = host.servers.publicServerLabel(run.attackedServerId);
    const rezInterruptSourceDefinitionId =
      host.cards.definitionFor(rezInterruptSourceId).id;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility: "rez_interrupt_jack_out_choice",
      sourceDefinitionId: rezInterruptSourceDefinitionId,
      rezInterruptSourceCardId: rezInterruptSourceId,
      rezzedCardDefinitionId: definition.id,
      ...(serverLabel ? { serverLabel } : {}),
      rezInterruptChoiceOpened: true,
    };
  }
  return {
    handled: true,
    rezzedCardId: rezzedCardInstanceId,
    sourceDefinitionId: host.cards.definitionFor(rezInterruptSourceId).id,
    sourceCardId: rezInterruptSourceId,
    rezInterruptChoiceStarted: true,
    resolvedPayload: legalAction?.payload,
    stateChanged: true,
  };
}

export function resolveRezInterruptJackOutChoice(
  host: RunRezWindowHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): RezInterruptJackOutWindowResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("rez_interrupt.jack_out"))
    throw new Error("Rez-Interrupt-Choice ist nicht offen.");
  const [, rezInterruptSourceId, rezzedCardId] = choice.source.split(":");
  if (
    !rezInterruptSourceId ||
    !host.cards
      .runnerInstalledProgramIds()
      .includes(rezInterruptSourceId as CardInstanceId)
  )
    throw new Error("Die Rez-Interrupt-Quelle ist nicht mehr installiert.");
  const rezInterruptSourceCardId = rezInterruptSourceId as CardInstanceId;
  const rezInterruptSourceDefinitionId = host.cards.definitionFor(
    rezInterruptSourceCardId,
  ).id;
  if (
    !hasRunEncounterInterventionKind(
      host,
      rezInterruptSourceCardId,
      "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
    )
  )
    throw new Error("Die Rez-Interrupt-Quelle ist nicht mehr installiert.");
  const run = mustRun(host.state);
  if (
    !rezzedCardId ||
    run.rezInterruptPendingRezCardId !== rezzedCardId ||
    !host.servers
      .mustServer(run.attackedServerId)
      .root.includes(rezzedCardId as CardInstanceId)
  )
    throw new Error("Das Rez-Interrupt-Rezziel ist nicht mehr gueltig.");
  const rezzedCardInstanceId = rezzedCardId as CardInstanceId;
  const rezzedDefinition = host.cards.definitionFor(rezzedCardInstanceId);
  if (rezzedDefinition.type !== "asset" && rezzedDefinition.type !== "upgrade")
    throw new Error("Der Rez-Interrupt reagiert nur auf Nodes oder Upgrades.");
  if (!host.cards.cardInstanceFor(rezzedCardInstanceId).rezzed)
    throw new Error("Das Rez-Interrupt-Rezziel ist nicht gerezzt.");
  const selectedId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const useRezInterrupt = selectedId === "jack_out";
  const pass = selectedId === "pass";
  if (!useRezInterrupt && !pass)
    throw new Error("Die Rez-Interrupt-Auswahl ist ungueltig.");
  const successfulRunWithoutAccess =
    useRezInterrupt && run.position.kind === "server";
  const serverLabel = host.servers.publicServerLabel(run.attackedServerId);
  const pendingTimingPoint = run.rezInterruptPendingRezTimingPoint;
  const pendingActiveSide = run.rezInterruptPendingRezActiveSide;
  delete run.rezInterruptPendingRezCardId;
  delete run.rezInterruptPendingRezTimingPoint;
  delete run.rezInterruptPendingRezActiveSide;
  delete host.state.pendingChoice;

  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerProgramAbility: "rez_interrupt_jack_out",
    sourceDefinitionId: rezInterruptSourceDefinitionId,
    rezInterruptSourceCardId: rezInterruptSourceCardId,
    rezzedCardDefinitionId: rezzedDefinition.id,
    ...(serverLabel ? { serverLabel } : {}),
    rezInterruptUsed: useRezInterrupt,
    successfulRunWithoutAccess,
  };

  if (useRezInterrupt) {
    host.callbacks.finishRun(successfulRunWithoutAccess, legalAction);
    return {
      handled: true,
      rezzedCardId: rezzedCardInstanceId,
      sourceCardId: rezInterruptSourceCardId,
      sourceDefinitionId: rezInterruptSourceDefinitionId,
      runnerJackedOut: true,
      rezInterruptResolved: true,
      successfulRunWithoutAccess,
      resolvedPayload: legalAction.payload,
      stateChanged: true,
    };
  }

  resolveCorpRootRezEffect(host, rezzedCardInstanceId, legalAction);
  if (host.state.run) {
    host.state.timingPoint =
      (pendingTimingPoint as GameState["timingPoint"] | undefined) ??
      "run.jack_out_window";
    host.state.activeSide = pendingActiveSide ?? "runner";
    host.callbacks.continueAfterRootRez(legalAction);
  }
  return {
    handled: true,
    rezzedCardId: rezzedCardInstanceId,
    sourceCardId: rezInterruptSourceCardId,
    sourceDefinitionId: rezInterruptSourceDefinitionId,
    rezInterruptResolved: true,
    successfulRunWithoutAccess,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

function variableIceRezActions(
  host: RunRezWindowHost,
  iceId: CardInstanceId,
  definition: CardDefinition,
  baseRezCost: number,
  rezCostReductionSourceDefinitionIds: string[],
): LegalAction[] {
  const variableRez = variableRezForDefinition(definition);
  if (!variableRez) return [];
  const availableAdditionalCredits = host.state.corp.credits - baseRezCost;
  if (availableAdditionalCredits < 0) return [];
  if (variableRez.kind === "x_strength") {
    const maxX = Math.min(
      variableRez.maxValue,
      Math.floor(
        availableAdditionalCredits / variableRez.additionalCostPerValue,
      ),
    );
    return Array.from(
      { length: Math.max(0, maxX - variableRez.minValue + 1) },
      (_, offset) => variableRez.minValue + offset,
    ).map((x) => {
      const totalCost = baseRezCost + x * variableRez.additionalCostPerValue;
      return buildLegalAction(
        host.state,
        "corp",
        "rez_ice",
        `${definition.title} mit X=${x} rezzen`,
        iceId,
        [{ credits: totalCost }],
        {
          cardId: iceId,
          variableRezKind: variableRez.kind,
          baseRezCost,
          variableRezAdditionalCost: x * variableRez.additionalCostPerValue,
          variableRezValue: x,
          variableRezCap: variableRez.maxValue,
          rezCostPaid: totalCost,
          effectiveStrengthAfterRez: x,
          ...(variableRez.traceLimitFromValue
            ? { effectiveTraceLimitAfterRez: x }
            : {}),
          ...(rezCostReductionSourceDefinitionIds.length > 0
            ? {
                rezCostReductionSourceDefinitionIds:
                  rezCostReductionSourceDefinitionIds.join(","),
                rezCostReductionAmount: (definition.rezCost ?? 0) - baseRezCost,
              }
            : {}),
        },
      );
    });
  }
  if (variableRez.kind === "paid_end_the_run_subroutines") {
    const maxSubroutineCount = Math.floor(
      availableAdditionalCredits / variableRez.additionalCostPerSubroutine,
    );
    return Array.from(
      { length: maxSubroutineCount + 1 },
      (_, subroutineCount) => {
        const additionalCost =
          subroutineCount * variableRez.additionalCostPerSubroutine;
        const totalCost = baseRezCost + additionalCost;
        return buildLegalAction(
          host.state,
          "corp",
          "rez_ice",
          `${definition.title} mit ${subroutineCount} ETR-Subroutinen rezzen`,
          iceId,
          [{ credits: totalCost }],
          {
            cardId: iceId,
            variableRezKind: variableRez.kind,
            baseRezCost,
            variableRezAdditionalCost: additionalCost,
            variableRezValue: subroutineCount,
            rezCostPaid: totalCost,
            effectiveSubroutineCountAfterRez: subroutineCount,
            ...(rezCostReductionSourceDefinitionIds.length > 0
              ? {
                  rezCostReductionSourceDefinitionIds:
                    rezCostReductionSourceDefinitionIds.join(","),
                  rezCostReductionAmount:
                    (definition.rezCost ?? 0) - baseRezCost,
                }
              : {}),
          },
        );
      },
    );
  }
  const subtypeVariants = [
    {
      value: 0,
      additionalCost: 0,
      selectedSubtypes: stableSubtypeList(variableRez.baseSubtypes),
    },
    ...(availableAdditionalCredits >= variableRez.additionalCost
      ? [
          {
            value: 1,
            additionalCost: variableRez.additionalCost,
            selectedSubtypes: stableSubtypeList(variableRez.alternateSubtypes),
          },
        ]
      : []),
  ];
  return subtypeVariants.map((variant) => {
    const totalCost = baseRezCost + variant.additionalCost;
    return buildLegalAction(
      host.state,
      "corp",
      "rez_ice",
      `${definition.title} als ${variant.selectedSubtypes.join("/")} rezzen`,
      iceId,
      [{ credits: totalCost }],
      {
        cardId: iceId,
        variableRezKind: variableRez.kind,
        baseRezCost,
        variableRezAdditionalCost: variant.additionalCost,
        variableRezValue: variant.value,
        rezCostPaid: totalCost,
        selectedSubtypesAfterRez: variant.selectedSubtypes.join(","),
        ...(rezCostReductionSourceDefinitionIds.length > 0
          ? {
              rezCostReductionSourceDefinitionIds:
                rezCostReductionSourceDefinitionIds.join(","),
              rezCostReductionAmount: (definition.rezCost ?? 0) - baseRezCost,
            }
          : {}),
      },
    );
  });
}

function variableRezForDefinition(
  definition: CardDefinition,
): CardVariableRezImplementation | undefined {
  return cardImplementationForDefinitionId(definition.id)?.variableRez;
}

function stableSubtypeList(subtypes: readonly string[]): string[] {
  return [
    ...new Set(subtypes.map((subtype) => normalizeSubtypeLabel(subtype))),
  ].sort();
}

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cardImplementationCorpRootRezResolver(
  definition: CardDefinition,
): CorpRootRezResolver | undefined {
  const gainCredits = immediateRootRezCreditGainForDefinition(definition.id);
  if (gainCredits === undefined) return undefined;
  return {
    name: "card_implementation_corp_root_rez_credit_outcome",
    resolve: (state) => {
      credits(state, "corp", gainCredits, {
        kind: "card_effect",
        sourceDefinitionId: definition.id,
        gainOrdinal: 1,
        reason: "corp_root_rez",
      });
    },
  };
}

function remainingReplacementLongtailImplementationForDefinition(
  definitionId: string,
) {
  return cardImplementationForDefinitionId(definitionId)
    ?.remainingReplacementLongtail;
}

function isObligationDebtDefinition(definitionId: string): boolean {
  return (
    remainingReplacementLongtailImplementationForDefinition(definitionId)
      ?.kind === "obligation_debt"
  );
}

function installedRezInterruptJackOutSourceIds(
  host: RunRezWindowHost,
): CardInstanceId[] {
  return host.cards
    .runnerInstalledProgramIds()
    .filter((cardId) => {
      const definitionId = host.cards.definitionFor(cardId).id;
      if (
        hasRunEncounterInterventionKind(
          host,
          cardId,
          "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
        )
      )
        return true;
      return false;
    })
    .sort();
}

function runEncounterInterventionsForDefinition(
  definitionId: string,
): readonly CardRunEncounterInterventionImplementation[] {
  return (
    cardImplementationForDefinitionId(definitionId)
      ?.runEncounterInterventions ?? []
  );
}

function hasRunEncounterInterventionKind(
  host: RunRezWindowHost,
  cardId: CardInstanceId,
  kind: CardRunEncounterInterventionImplementation["kind"],
): boolean {
  return runEncounterInterventionsForDefinition(
    host.cards.definitionFor(cardId).id,
  ).some((intervention) => intervention.kind === kind);
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}
