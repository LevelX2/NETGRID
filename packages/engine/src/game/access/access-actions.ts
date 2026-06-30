import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { POLTERGEIST_ID } from "../../compatibility/runtime-compatibility";
import { UPGRADE_TRASH_PROGRAM_SOURCE } from "../../mechanics/longtail-card-effects";
import { quoteStealCostForAccessedAgenda } from "../../ability-engine/steal-cost-modifiers";
import { quoteAccessTrashCost } from "../../ability-engine/trash-cost-modifiers";
import type { RestrictedHostedCreditUse } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

type ActiveRun = NonNullable<GameState["run"]>;
type ActiveBreach = NonNullable<ActiveRun["breach"]>;
type AccessQueueZone = ActiveBreach["queue"][number]["zone"];
type AccessTrashCounterType = "crumble" | "garbage";

export type RunnerAccessActionHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => CorpServer;
  };
  actions: {
    buildLegalAction: (
      side: "runner",
      type: LegalAction["type"],
      label: string,
      source: LegalAction["source"],
      costs?: LegalAction["costs"],
      payload?: LegalAction["payload"],
    ) => LegalAction;
  };
  payment: {
    hostedPaymentCredits: (cardId: CardInstanceId) => number;
    restrictedHostedCreditSourceIds: (
      use: RestrictedHostedCreditUse,
      options?: {
        accessedCardId?: CardInstanceId | undefined;
        installCardType?: CardDefinition["type"] | undefined;
        breakerId?: CardInstanceId | undefined;
      },
    ) => CardInstanceId[];
    isRestrictedHostedCreditSource: (definition: CardDefinition) => boolean;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, counterType: string) => number;
  };
  callbacks: {
    successfulRunProgramActions: (run: ActiveRun) => LegalAction[];
    runnerDuringRunCardImplementationLegalActions: () => LegalAction[];
    hiddenStackInstallRunActions: (run: ActiveRun) => LegalAction[];
  };
};

export type RunnerAccessActionBuildResult = {
  handled: boolean;
  legalActions: LegalAction[];
};

export function buildRunnerAccessActions(
  host: RunnerAccessActionHost,
): RunnerAccessActionBuildResult {
  if (!host.state.run) return { handled: false, legalActions: [] };
  const run = host.state.run;
  const successfulRunActions = host.callbacks.successfulRunProgramActions(run);
  if (successfulRunActions.length > 0)
    return { handled: true, legalActions: successfulRunActions };
  if (!run.accessedCardId) {
    const hiddenStackInstallActions = [
      ...host.callbacks.runnerDuringRunCardImplementationLegalActions(),
      ...host.callbacks.hiddenStackInstallRunActions(run),
    ];
    if (hasPendingAccessCandidate(host, run))
      return {
        handled: true,
        legalActions: [
          ...hiddenStackInstallActions,
          host.actions.buildLegalAction(
            "runner",
            "access_card",
            "Karte accessen",
            "game_rule",
          ),
        ],
      };
    if (hiddenStackInstallActions.length > 0)
      return { handled: true, legalActions: hiddenStackInstallActions };
    return {
      handled: true,
      legalActions: [
        host.actions.buildLegalAction(
          "runner",
          "continue_run",
          "Zugriff abschließen",
          "game_rule",
        ),
      ],
    };
  }
  const definition = host.cards.definitionFor(run.accessedCardId);
  const freeTrashSource = freeTrashAccessSourceForCurrentAccessCard(
    host,
    run,
    definition,
  );
  const freeTrashEnabled = freeTrashSource.enabled;
  const accessedFromArchives = isCurrentAccessFromArchives(host, run);
  if (definition.type === "agenda") {
    const accessReplacement = agendaAccessReplacementForDefinition(definition);
    if (accessReplacement?.kind === "install_as_runner_program") {
      const legalActions: LegalAction[] = [];
      if (
        host.state.runner.memoryUsed + accessReplacement.memoryCost <=
        host.state.runner.memoryLimit
      ) {
        legalActions.push(
          host.actions.buildLegalAction(
            "runner",
            "steal_agenda",
            `${definition.title} als Programm installieren`,
            run.accessedCardId,
            [],
            {
              cardId: run.accessedCardId,
              agendaAccessReplacement: "install_as_runner_program",
              installedRunnerProgramMemoryCost: accessReplacement.memoryCost,
            },
          ),
        );
      }
      legalActions.push(
        host.actions.buildLegalAction(
          "runner",
          "decline_trash",
          `${definition.title} nicht installieren`,
          "game_rule",
          [],
          {
            cardId: run.accessedCardId,
            agendaAccessReplacement: "declined_install_as_runner_program",
            installedRunnerProgramMemoryCost: accessReplacement.memoryCost,
          },
        ),
      );
      return { handled: true, legalActions };
    }
    const accessServerId =
      run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId;
    const stealCostQuote = quoteStealCostForAccessedAgenda(
      host.state,
      accessServerId,
      definition,
    );
    if (stealCostQuote.totalCost > 0) {
      if (host.state.runner.credits < stealCostQuote.totalCost) {
        return {
          handled: true,
          legalActions: [
            host.actions.buildLegalAction(
              "runner",
              "decline_trash",
              `${definition.title} nicht stehlen`,
              "game_rule",
              [],
              {
                cardId: run.accessedCardId,
                ...stealCostQuote.publicPayload,
                stealBlockedByCost: true,
              },
            ),
          ],
        };
      }
      return {
        handled: true,
        legalActions: [
          host.actions.buildLegalAction(
            "runner",
            "steal_agenda",
            `${definition.title} stehlen`,
            run.accessedCardId,
            [{ credits: stealCostQuote.totalCost }],
            {
              cardId: run.accessedCardId,
              ...stealCostQuote.publicPayload,
            },
          ),
        ],
      };
    }
    return {
      handled: true,
      legalActions: [
        host.actions.buildLegalAction(
          "runner",
          "steal_agenda",
          `${definition.title} stehlen`,
          run.accessedCardId,
        ),
      ],
    };
  }
  if (accessedFromArchives) {
    return {
      handled: true,
      legalActions: [
        host.actions.buildLegalAction(
          "runner",
          "decline_trash",
          run.breach ? "Weiter accessen" : "Zugriff abschließen",
          "game_rule",
        ),
      ],
    };
  }
  if (definition.type === "asset" || definition.type === "upgrade") {
    const legalActions: LegalAction[] = [];
    legalActions.push(...hiddenResourceCurrentAccessTrashActions(host, run));
    const trashCost = effectiveAccessTrashCost(host, run.accessedCardId);
    if (freeTrashEnabled) {
      legalActions.push(
        host.actions.buildLegalAction(
          "runner",
          "trash_accessed_card",
          `${definition.title} kostenlos trashen`,
          run.accessedCardId,
          [],
          {
            accessTrashCostOverride: 0,
            freeAccessTrash: true,
            ...(freeTrashSource.counterType
              ? {
                  proteusRunnerVirusFreeTrashCounterType:
                    freeTrashSource.counterType,
                }
              : {}),
          },
        ),
      );
    } else if (
      availableRunnerAccessTrashCredits(host, run.accessedCardId) >=
      trashCost.totalCost
    ) {
      const upgradeTrashRecurringCreditsAvailable =
        upgradeTrashRecurringCreditSourceIds(host, run.accessedCardId).reduce(
          (sum, cardId) => sum + host.payment.hostedPaymentCredits(cardId),
          0,
        );
      const poltergeistRecurringCreditsAvailable =
        poltergeistRecurringCreditSourceIds(host, run.accessedCardId).reduce(
          (sum, cardId) => sum + host.payment.hostedPaymentCredits(cardId),
          0,
        );
      legalActions.push(
        host.actions.buildLegalAction(
          "runner",
          "trash_accessed_card",
          `${definition.title} trashen`,
          run.accessedCardId,
          [{ credits: trashCost.totalCost }],
          {
            accessTrashBaseCost: trashCost.baseCost,
            accessTrashCostModifier: trashCost.modifier,
            accessTrashTotalCost: trashCost.totalCost,
            ...(trashCost.sourceDefinitionIds.length > 0
              ? {
                  accessTrashCostSourceDefinitionIds:
                    trashCost.sourceDefinitionIds.join(","),
                  accessTrashCostSourceTitles: trashCost.sourceTitles.join(","),
                }
              : {}),
            ...(upgradeTrashRecurringCreditsAvailable > 0 &&
            definition.type === "upgrade"
              ? {
                  v1922RunnerProgramAbility:
                    "upgrade_trash_recurring_credit",
                  upgradeTrashRecurringCreditsAvailable,
                }
              : {}),
            ...(poltergeistRecurringCreditsAvailable > 0 &&
            definition.type === "asset"
              ? {
                  v1922RunnerProgramAbility:
                    "poltergeist_node_trash_recurring_credit",
                  poltergeistRecurringCreditsAvailable,
                }
              : {}),
          },
        ),
      );
    }
    legalActions.push(
      host.actions.buildLegalAction(
        "runner",
        "decline_trash",
        "Nicht trashen",
        "game_rule",
      ),
    );
    return { handled: true, legalActions };
  }
  if (freeTrashEnabled) {
    return {
      handled: true,
      legalActions: [
        ...hiddenResourceCurrentAccessTrashActions(host, run),
        host.actions.buildLegalAction(
          "runner",
          "trash_accessed_card",
          `${definition.title} kostenlos trashen`,
          run.accessedCardId,
          [],
          {
            accessTrashCostOverride: 0,
            freeAccessTrash: true,
            ...(freeTrashSource.counterType
              ? {
                  proteusRunnerVirusFreeTrashCounterType:
                    freeTrashSource.counterType,
                }
              : {}),
          },
        ),
        host.actions.buildLegalAction(
          "runner",
          "decline_trash",
          run.breach ? "Weiter accessen" : "Access abschließen",
          "game_rule",
        ),
      ],
    };
  }
  return {
    handled: true,
    legalActions: [
      ...hiddenResourceCurrentAccessTrashActions(host, run),
      host.actions.buildLegalAction(
        "runner",
        "decline_trash",
        run.breach ? "Weiter accessen" : "Access abschließen",
        "game_rule",
      ),
    ],
  };
}

function agendaAccessReplacementForDefinition(definition: CardDefinition):
  | NonNullable<
      ReturnType<typeof cardImplementationForDefinitionId>
    >["agendaAccessReplacement"]
  | undefined {
  return cardImplementationForDefinitionId(definition.id)?.agendaAccessReplacement;
}

function hiddenResourceCurrentAccessTrashActions(
  host: RunnerAccessActionHost,
  run: ActiveRun,
): LegalAction[] {
  const accessedCardId = run.accessedCardId;
  if (!accessedCardId) return [];
  const accessedDefinition = host.cards.definitionFor(accessedCardId);
  if (accessedDefinition.type === "agenda") return [];
  return host.state.runner.rig.resources
    .slice()
    .sort()
    .flatMap((sourceCardId) => {
      const sourceInstance = host.cards.cardInstanceFor(sourceCardId);
      if (sourceInstance.tapped === true) return [];
      const sourceDefinition = host.cards.definitionFor(sourceCardId);
      const utility =
        cardImplementationForDefinitionId(sourceDefinition.id)?.runnerUtilityLongtail;
      if (utility?.kind !== "hidden_resource_current_access_free_trash")
        return [];
      if (host.state.runner.credits < utility.cost.amount) return [];
      return [
        host.actions.buildLegalAction(
          "runner",
          "trash_accessed_card",
          `${sourceDefinition.title}: aktuelle Karte kostenlos trashen`,
          accessedCardId,
          [{ credits: utility.cost.amount }],
          {
            cardId: accessedCardId,
            accessTrashCostOverride: 0,
            freeAccessTrash: true,
            hiddenResourceCurrentAccessTrash: true,
            hiddenResourceSourceCardId: sourceCardId,
            hiddenResourceSourceDefinitionId: sourceDefinition.id,
          },
        ),
      ];
    });
}

export function canFreeTrashCurrentAccessCard(
  host: RunnerAccessActionHost,
  run: ActiveRun,
  definition: CardDefinition,
): boolean {
  return freeTrashAccessSourceForCurrentAccessCard(host, run, definition).enabled;
}

export function freeTrashAccessSourceForCurrentAccessCard(
  host: RunnerAccessActionHost,
  run: ActiveRun,
  definition: CardDefinition,
): { enabled: boolean; counterType?: AccessTrashCounterType } {
  if (definition.type === "agenda") return { enabled: false };
  const currentZone =
    run.breach?.queue[run.breach.currentIndex]?.zone ??
    accessQueueZone(run.accessServerOverride ?? run.attackedServerId);
  const accessServerId =
    run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId;
  const allowedZones = run.freeTrashAccessZones ?? [];
  if (
    (currentZone === "rd" || currentZone === "hq") &&
    allowedZones.includes(currentZone)
  )
    return { enabled: true };
  const corpCounters = host.state.purgeableRunnerVirusCounters?.corp;
  const zoneMatchesAccessTrashCounter =
    currentZone === accessServerId ||
    (currentZone === "remote_root" &&
      definition.type === "upgrade" &&
      (accessServerId === "hq" || accessServerId === "rd"));
  if (!zoneMatchesAccessTrashCounter) return { enabled: false };
  if (
    accessServerId === "hq" &&
    Math.max(0, Math.floor(corpCounters?.crumble ?? 0)) >= 2
  )
    return { enabled: true, counterType: "crumble" };
  if (
    accessServerId === "rd" &&
    Math.max(0, Math.floor(corpCounters?.garbage ?? 0)) >= 2
  )
    return { enabled: true, counterType: "garbage" };
  return { enabled: false };
}

export function effectiveAccessTrashCost(
  host: RunnerAccessActionHost,
  cardId: CardInstanceId,
): {
  baseCost: number;
  modifier: number;
  totalCost: number;
  sourceDefinitionIds: CardDefinitionId[];
  sourceTitles: string[];
} {
  const definition = host.cards.definitionFor(cardId);
  const baseCost = definition.trashCost ?? 0;
  const zone = host.cards.cardInstanceFor(cardId).zone;
  if (
    zone.side === "corp" &&
    zone.zone === "serverRoot" &&
    (definition.type === "asset" || definition.type === "upgrade")
  ) {
    const quote = quoteAccessTrashCost(host.state, cardId, definition, baseCost);
    return {
      ...quote,
      sourceDefinitionIds: quote.modifiers.map(
        (modifier) => modifier.sourceDefinitionId,
      ),
      sourceTitles: quote.modifiers.map((modifier) => modifier.sourceTitle),
    };
  }
  return {
    baseCost,
    modifier: 0,
    totalCost: baseCost,
    sourceDefinitionIds: [],
    sourceTitles: [],
  };
}

export function runnerAccessTrashRecurringCreditSourceIds(
  host: RunnerAccessActionHost,
  accessedCardId: CardInstanceId,
): CardInstanceId[] {
  return [
    ...upgradeTrashRecurringCreditSourceIds(host, accessedCardId),
    ...poltergeistRecurringCreditSourceIds(host, accessedCardId),
  ].sort();
}

export function runnerAccessTrashRecurringCredits(
  host: RunnerAccessActionHost,
  accessedCardId: CardInstanceId,
): number {
  return runnerAccessTrashRecurringCreditSourceIds(host, accessedCardId).reduce(
    (sum, cardId) => sum + host.payment.hostedPaymentCredits(cardId),
    0,
  );
}

export function availableRunnerAccessTrashCredits(
  host: RunnerAccessActionHost,
  accessedCardId: CardInstanceId,
): number {
  return (
    host.state.runner.credits +
    runnerAccessTrashRecurringCredits(host, accessedCardId)
  );
}

function hasPendingAccessCandidate(
  host: RunnerAccessActionHost,
  run: ActiveRun,
): boolean {
  if (run.breach)
    return run.breach.queue[run.breach.currentIndex]?.status === "pending";
  const server = host.servers.mustServer(run.attackedServerId);
  if (server.id === "rd") return host.state.corp.rd.length > 0;
  if (server.id === "hq") return host.state.corp.hq.length > 0;
  if (server.id === "archives") return host.state.corp.archives.length > 0;
  return server.root.length > 0;
}

function isCurrentAccessFromArchives(
  host: RunnerAccessActionHost,
  run: ActiveRun,
): boolean {
  const cardId = run.accessedCardId;
  if (!cardId) return false;
  const currentEntry = run.breach?.queue[run.breach.currentIndex];
  if (currentEntry?.cardInstanceId === cardId)
    return currentEntry.zone === "archives";
  const zone = host.cards.cardInstanceFor(cardId).zone;
  return zone.side === "corp" && zone.zone === "archives";
}

function accessQueueZone(
  serverId: Exclude<ServerId, "new_remote">,
): AccessQueueZone {
  if (serverId === "rd") return "rd";
  if (serverId === "hq") return "hq";
  if (serverId === "archives") return "archives";
  return "remote_root";
}

function upgradeTrashRecurringCreditSourceIds(
  host: RunnerAccessActionHost,
  accessedCardId: CardInstanceId,
): CardInstanceId[] {
  const accessedDefinition = host.cards.definitionFor(accessedCardId);
  if (accessedDefinition.type !== "upgrade") return [];
  return [
    ...host.payment.restrictedHostedCreditSourceIds("trash_upgrades", {
      accessedCardId,
    }),
    ...host.state.runner.rig.programs.filter((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return (
        !host.payment.isRestrictedHostedCreditSource(definition) &&
        definition.id === UPGRADE_TRASH_PROGRAM_SOURCE &&
        host.counters.cardCounter(cardId, "recurring_credit") > 0
      );
    }),
  ].sort();
}

function poltergeistRecurringCreditSourceIds(
  host: RunnerAccessActionHost,
  accessedCardId: CardInstanceId,
): CardInstanceId[] {
  const accessedDefinition = host.cards.definitionFor(accessedCardId);
  if (accessedDefinition.type !== "asset") return [];
  return [
    ...host.payment.restrictedHostedCreditSourceIds("trash_nodes", {
      accessedCardId,
    }),
    ...host.state.runner.rig.programs.filter((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return (
        !host.payment.isRestrictedHostedCreditSource(definition) &&
        definition.id === POLTERGEIST_ID &&
        host.counters.cardCounter(cardId, "recurring_credit") > 0
      );
    }),
  ].sort();
}
