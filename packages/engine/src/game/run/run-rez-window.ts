import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type {
  CardRunEncounterInterventionImplementation,
  CardVariableRezImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID } from "../../mechanics/longtail-card-effects";
import {
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  oliviaSalazarRezSourcesForRunIce,
  quoteCorpRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
} from "../payment";
import { buildLegalAction } from "../turn/action-builders";
import {
  type FortPassWindowHost,
} from "./fort-pass-window";
import { buildRegisteredRunWindowActions } from "./run-window-registry";

type ActiveRun = NonNullable<GameState["run"]>;

type CorpRootRezResolver = {
  name: string;
  resolve: (state: GameState) => void;
};

const CORP_ROOT_REZ_RESOLVERS: Record<string, CorpRootRezResolver> = {
  simple_economy_asset: {
    name: "corp_asset_rez_gain_3",
    resolve: (state) => {
      state.corp.credits += 3;
    },
  },
  v08_cashout_asset: {
    name: "corp_asset_rez_gain_4",
    resolve: (state) => {
      state.corp.credits += 4;
    },
  },
};

export type RunRezWindowHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    runnerInstalledProgramIds: () => CardInstanceId[];
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote"> | string) => CorpServer;
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  fortPass: FortPassWindowHost;
  choices: {
    selectedChoiceIds: (selectedChoices: PlayerAction["selectedChoices"]) => string[];
  };
  callbacks: {
    canReplaceFortCardsFromHq: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => boolean;
    continueAfterRootRez: (legalAction?: LegalAction) => void;
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    acmeSavingsAndLoanObligationCount: () => number;
    addAcmeSavingsAndLoanObligation: (amount: number) => void;
  };
};

export type RunRezWindowResult = {
  handled: boolean;
  rezzedCardId?: CardInstanceId;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  serverId?: Exclude<ServerId, "new_remote"> | string;
  rootEffectResolved?: boolean;
  speedTrapChoiceStarted?: boolean;
  speedTrapResolved?: boolean;
  runnerJackedOut?: boolean;
  continueAfterRez?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]> | undefined;
  stateChanged?: boolean;
};

export type RootRezEffectResult = RunRezWindowResult;
export type RootRezContinuationResult = RunRezWindowResult;
export type SpeedTrapRezWindowResult = RunRezWindowResult & {
  successfulRunWithoutAccess?: boolean;
};
export type RunRezActionBuildResult = {
  legalActions: LegalAction[];
};

export function buildCorpApproachActions(
  host: RunRezWindowHost,
): LegalAction[] {
  const run = mustRun(host.state);
  if (!run.approachedIceId) return [];
  const ice = host.cards.cardInstanceFor(run.approachedIceId);
  const definition = host.cards.definitionFor(run.approachedIceId);
  const actions: LegalAction[] = [];
  const rezQuote = quoteCorpRezCost(host.state, run.approachedIceId);
  const rezCostReductionSourceDefinitionIds = rezQuote.modifiers.map(
    (modifier) => modifier.sourceDefinitionId,
  );
  if (!ice.rezzed && rezQuote.canPay) {
    const variableRezActions = variableIceRezActions(
      host,
      run.approachedIceId,
      definition,
      rezQuote.finalCredits,
      rezCostReductionSourceDefinitionIds,
    );
    if (variableRezActions.length > 0) {
      actions.push(...variableRezActions);
    } else {
      actions.push(
        buildLegalAction(
          host.state,
          "corp",
          "rez_ice",
          `${definition.title} rezzen`,
          run.approachedIceId,
          costQuoteToLegalActionCosts(rezQuote),
          costQuotePublicPayload(rezQuote),
        ),
      );
    }
  }
  if (!ice.rezzed && !variableRezForDefinition(definition)) {
    for (const sourceId of oliviaSalazarRezSourcesForRunIce(
      host.state,
      run.approachedIceId,
    )) {
      const oliviaRezQuote = quoteCorpRezCost(host.state, run.approachedIceId, {
        oliviaSalazarSourceCardId: sourceId,
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
    buildLegalAction(host.state, "corp", "decline_rez", "Nicht rezzen", "game_rule"),
  );
  return [...actions, ...buildCorpRunRootRezActions(host)];
}

export function buildCorpRunRootRezActions(
  host: RunRezWindowHost,
): LegalAction[] {
  const run = host.state.run;
  if (!run) return [];
  const server = host.servers.mustServer(run.attackedServerId);
  const actions: LegalAction[] = [];
  for (const cardId of server.root.slice().sort()) {
    const instance = host.state.cardInstances[cardId];
    if (!instance || instance.rezzed) continue;
    const definition = host.cards.definitionFor(cardId);
    if (definition.type !== "asset" && definition.type !== "upgrade") continue;
    const rezCost = rezCostForCard(host.state, cardId);
    if (host.state.corp.credits < rezCost) continue;
    if (!rootRezLifecycleIsSolvable(host, cardId, definition, server)) continue;
    const rezCostReductionSourceDefinitionIds =
      rezCostReductionSourceDefinitionIdsFor(host.state, cardId, definition);
    actions.push(
      buildLegalAction(
        host.state,
        "corp",
        "rez_ice",
        `${definition.title} in ${server.label} rezzen`,
        cardId,
        [{ credits: rezCost }],
        {
          cardId,
          rootRez: true,
          speedTrapInterruptEligible: true,
          serverId: server.id,
          ...(rezCostReductionSourceDefinitionIds.length > 0
            ? {
                rezCostReductionSourceDefinitionIds:
                  rezCostReductionSourceDefinitionIds.join(","),
                rezCostReductionAmount: (definition.rezCost ?? 0) - rezCost,
                rezCostPaid: rezCost,
              }
            : {}),
        },
      ),
    );
  }
  actions.push(
    ...buildRegisteredRunWindowActions(
      host.fortPass,
      run,
      server,
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
  const lifecycle = cardImplementationForDefinitionId(definition.id)?.lifecycle?.on_rez;
  if (
    !lifecycle?.some((effect) => effect.kind === "replace_source_fort_cards_from_hq")
  )
    return true;
  const run = host.state.run;
  if (!run || run.attackedServerId !== server.id || run.position.kind !== "server")
    return false;
  return host.callbacks.canReplaceFortCardsFromHq(server.id);
}

export function buildCorpRunRootRezWindowActions(
  host: RunRezWindowHost,
): LegalAction[] {
  const run = host.state.run;
  if (!run) return [];
  const server = host.servers.mustServer(run.attackedServerId);
  const actions = [
    ...buildCorpRunRootRezActions(host),
    ...buildRegisteredRunWindowActions(
      host.fortPass,
      run,
      server,
      "corp_fort_pass_window",
    ),
  ];
  if (actions.length === 0 || !isCorpRunRootRezWindowOpen(host)) return [];
  return [
    ...actions,
    buildLegalAction(
      host.state,
      "corp",
      "decline_rez",
      "Nichts rezzen / Weiter",
      "game_rule",
      [],
      {
        runRootRezPass: true,
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
  if (host.state.timingPoint !== "run.jack_out_window") return false;
  const run = host.state.run;
  if (!run) return false;
  if (run.rootRezWindowPassedKeys?.includes(corpRunRootRezWindowKey(run)))
    return false;
  const server = host.servers.mustServer(run.attackedServerId);
  return (
    buildCorpRunRootRezActions(host).length > 0 ||
    buildRegisteredRunWindowActions(
      host.fortPass,
      run,
      server,
      "corp_fort_pass_window",
    ).length > 0
  );
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
  if (host.state.timingPoint !== "run.jack_out_window")
    throw new Error("Root-Rez-Fenster ist nicht offen.");
  const run = mustRun(host.state);
  if (!isCorpRunRootRezWindowOpen(host))
    throw new Error("Root-Rez-Fenster wurde bereits geschlossen.");
  const server = host.servers.mustServer(run.attackedServerId);
  const key = corpRunRootRezWindowKey(run);
  run.rootRezWindowPassedKeys = Array.from(
    new Set([...(run.rootRezWindowPassedKeys ?? []), key]),
  ).sort();
  host.state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runRootRezPass: true,
    serverId: server.id,
    serverLabel: server.label,
  };
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
  const speedTrap = startSpeedTrapRezInterruptChoice(host, rezzedCardId, legalAction);
  if (speedTrap.handled) return speedTrap;
  const rootEffect = resolveCorpRootRezEffect(host, rezzedCardId, legalAction);
  if (rootEffect.handled) return rootEffect;
  host.callbacks.continueAfterRootRez(legalAction);
  return {
    handled: true,
    rezzedCardId,
    continueAfterRez: true,
    resolvedPayload: legalAction?.payload,
    stateChanged: true,
  };
}

export function resolveCorpRootRezEffect(
  host: RunRezWindowHost,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): RootRezEffectResult {
  const definition = host.cards.definitionFor(cardId);
  const resolver =
    cardImplementationCorpRootRezResolver(definition) ??
    CORP_ROOT_REZ_RESOLVERS[definition.id];
  if (!resolver) return { handled: false, rezzedCardId: cardId };
  resolver.resolve(host.state);
  if (isAcmeSavingsAndLoanDefinition(definition.id)) {
    const acmeLongtail = remainingReplacementLongtailImplementationForDefinition(
      definition.id,
    );
    const gainedCredits =
      acmeLongtail?.kind === "acme_savings_and_loan_debt"
        ? acmeLongtail.gainCreditsOnRez
        : 12;
    host.callbacks.addAcmeSavingsAndLoanObligation(1);
    host.callbacks.trashCorpInstalledCardToArchives(cardId, legalAction);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits,
        selfTrashed: true,
        acmeDebtActive: host.callbacks.acmeSavingsAndLoanObligationCount() > 0,
        acmeSavingsAndLoanObligationsAfter:
          host.callbacks.acmeSavingsAndLoanObligationCount(),
        corpCreditsAfter: host.state.corp.credits,
      };
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

export function startSpeedTrapRezInterruptChoice(
  host: RunRezWindowHost,
  rezzedCardId: string,
  legalAction?: LegalAction,
): SpeedTrapRezWindowResult {
  const run = host.state.run;
  if (!run) return { handled: false };
  const rezzedCardInstanceId = rezzedCardId as CardInstanceId;
  const definition = host.cards.definitionFor(rezzedCardInstanceId);
  if (definition.type !== "asset" && definition.type !== "upgrade")
    return { handled: false };
  const speedTrapId = installedSpeedTrapIds(host)[0];
  if (!speedTrapId) return { handled: false };
  if (
    !host.servers
      .mustServer(run.attackedServerId)
      .root.includes(rezzedCardInstanceId)
  )
    return { handled: false };
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  run.speedTrapPendingRezCardId = rezzedCardInstanceId;
  run.speedTrapPendingRezTimingPoint = host.state.timingPoint;
  run.speedTrapPendingRezActiveSide = host.state.activeSide;
  host.state.pendingChoice = {
    choiceId: `v1922_speed_trap_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.speed_trap:${speedTrapId}:${rezzedCardId}:${host.state.stateVersion + 1}`,
    prompt: "Speed Trap: Nach dem Rez jack out?",
    kind: "select_option",
    options: [
      {
        id: "jack_out",
        label: "Jack out",
        publicLabel: "Speed Trap nutzen",
        value: "jack_out",
      },
      {
        id: "pass",
        label: "Nicht nutzen",
        publicLabel: "Speed Trap nicht nutzen",
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
    const speedTrapDefinitionId = host.cards.definitionFor(speedTrapId).id;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt_choice",
      sourceDefinitionId: speedTrapDefinitionId,
      speedTrapSourceCardId: speedTrapId,
      rezzedCardDefinitionId: definition.id,
      ...(serverLabel ? { serverLabel } : {}),
      speedTrapChoiceOpened: true,
    };
  }
  return {
    handled: true,
    rezzedCardId: rezzedCardInstanceId,
    sourceDefinitionId: host.cards.definitionFor(speedTrapId).id,
    sourceCardId: speedTrapId,
    speedTrapChoiceStarted: true,
    resolvedPayload: legalAction?.payload,
    stateChanged: true,
  };
}

export function resolveSpeedTrapRezInterruptChoice(
  host: RunRezWindowHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): SpeedTrapRezWindowResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.speed_trap"))
    throw new Error("Speed-Trap-Choice ist nicht offen.");
  const [, speedTrapId, rezzedCardId] = choice.source.split(":");
  if (
    !speedTrapId ||
    !host.cards.runnerInstalledProgramIds().includes(speedTrapId as CardInstanceId)
  )
    throw new Error("Speed Trap ist nicht mehr installiert.");
  const speedTrapCardId = speedTrapId as CardInstanceId;
  const speedTrapDefinitionId = host.cards.definitionFor(speedTrapCardId).id;
  if (
    !hasRunEncounterInterventionKind(
      host,
      speedTrapCardId,
      "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
    ) &&
    (cardImplementationForDefinitionId(speedTrapDefinitionId) ||
      speedTrapDefinitionId !== SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID)
  )
    throw new Error("Speed Trap ist nicht mehr installiert.");
  const run = mustRun(host.state);
  if (
    !rezzedCardId ||
    run.speedTrapPendingRezCardId !== rezzedCardId ||
    !host.servers
      .mustServer(run.attackedServerId)
      .root.includes(rezzedCardId as CardInstanceId)
  )
    throw new Error("Das Speed-Trap-Rezziel ist nicht mehr gueltig.");
  const rezzedCardInstanceId = rezzedCardId as CardInstanceId;
  const rezzedDefinition = host.cards.definitionFor(rezzedCardInstanceId);
  if (rezzedDefinition.type !== "asset" && rezzedDefinition.type !== "upgrade")
    throw new Error("Speed Trap reagiert nur auf Nodes oder Upgrades.");
  if (!host.cards.cardInstanceFor(rezzedCardInstanceId).rezzed)
    throw new Error("Das Speed-Trap-Rezziel ist nicht gerezzt.");
  const selectedId = host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const useSpeedTrap = selectedId === "jack_out";
  const pass = selectedId === "pass";
  if (!useSpeedTrap && !pass)
    throw new Error("Die Speed-Trap-Auswahl ist ungueltig.");
  const successfulRunWithoutAccess =
    useSpeedTrap && run.position.kind === "server";
  const serverLabel = host.servers.publicServerLabel(run.attackedServerId);
  const pendingTimingPoint = run.speedTrapPendingRezTimingPoint;
  const pendingActiveSide = run.speedTrapPendingRezActiveSide;
  delete run.speedTrapPendingRezCardId;
  delete run.speedTrapPendingRezTimingPoint;
  delete run.speedTrapPendingRezActiveSide;
  delete host.state.pendingChoice;

  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerProgramAbility: "speed_trap_rez_interrupt",
    sourceDefinitionId: speedTrapDefinitionId,
    speedTrapSourceCardId: speedTrapCardId,
    rezzedCardDefinitionId: rezzedDefinition.id,
    ...(serverLabel ? { serverLabel } : {}),
    speedTrapUsed: useSpeedTrap,
    successfulRunWithoutAccess,
  };

  if (useSpeedTrap) {
    host.callbacks.finishRun(successfulRunWithoutAccess, legalAction);
    return {
      handled: true,
      rezzedCardId: rezzedCardInstanceId,
      sourceCardId: speedTrapCardId,
      sourceDefinitionId: speedTrapDefinitionId,
      runnerJackedOut: true,
      speedTrapResolved: true,
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
  }
  return {
    handled: true,
    rezzedCardId: rezzedCardInstanceId,
    sourceCardId: speedTrapCardId,
    sourceDefinitionId: speedTrapDefinitionId,
    speedTrapResolved: true,
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
      Math.floor(availableAdditionalCredits / variableRez.additionalCostPerValue),
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
          ...(variableRez.traceBaseFromValue
            ? { effectiveTraceBaseAfterRez: x }
            : {}),
          ...(variableRez.traceBidLimitFromValue
            ? { effectiveTraceBidLimitAfterRez: x }
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
    return Array.from({ length: maxSubroutineCount + 1 }, (_, subroutineCount) => {
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
                rezCostReductionAmount: (definition.rezCost ?? 0) - baseRezCost,
              }
            : {}),
        },
      );
    });
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
  return [...new Set(subtypes.map((subtype) => normalizeSubtypeLabel(subtype)))]
    .sort();
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
  const longtail = remainingReplacementLongtailImplementationForDefinition(
    definition.id,
  );
  if (longtail?.kind === "acme_savings_and_loan_debt") {
    return {
      name: "card_implementation_corp_root_rez_acme_savings_and_loan_debt",
      resolve: (state) => {
        state.corp.credits += longtail.gainCreditsOnRez;
      },
    };
  }
  return undefined;
}

function remainingReplacementLongtailImplementationForDefinition(
  definitionId: string,
) {
  return cardImplementationForDefinitionId(definitionId)
    ?.remainingReplacementLongtail;
}

function isAcmeSavingsAndLoanDefinition(definitionId: string): boolean {
  return (
    remainingReplacementLongtailImplementationForDefinition(definitionId)
      ?.kind === "acme_savings_and_loan_debt"
  );
}

function installedSpeedTrapIds(host: RunRezWindowHost): CardInstanceId[] {
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
      return (
        !cardImplementationForDefinitionId(definitionId) &&
        definitionId === SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID
      );
    })
    .sort();
}

function runEncounterInterventionsForDefinition(
  definitionId: string,
): readonly CardRunEncounterInterventionImplementation[] {
  return cardImplementationForDefinitionId(definitionId)?.runEncounterInterventions ?? [];
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
