// ARCH-5R extracts only the read-only PlayerView projection.
// This module creates no LegalActions, executes no actions, and mutates no
// GameState. The host passes LegalActions in until getLegalActions itself moves
// behind the game facade in a later ARCH step.
import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type CorpServer,
  type GameEvent,
  type GameState,
  type LegalAction,
  type PlayerView,
  type PublicGameEvent,
  type ServerId,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import {
  corpServerIdForInstalledCard,
} from "../../ability-engine/cost-pipeline";
import {
  effectiveAgendaDifficulty,
  maxHandSize,
  runnerMemoryLimit,
  type EffectiveAgendaDifficultyDependencies,
} from "../../ability-engine/effective-values";
import { iceStrengthModifierBonusFor } from "../../ability-engine/ice-strength-modifiers";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type { RestrictedHostedCreditUse } from "../../ability-engine/definition-types";
import { SERVER_DIFFICULTY_UPGRADE_CARD_IDS } from "../../mechanics/agenda-scoring";
import { serverChoiceDisplayLabel } from "../../public-context";

const ENCRYPTION_BREAKTHROUGH_ID = "onr_v1_200_encryption-breakthrough";
const SUPERIOR_NET_BARRIERS_ID = "onr_v1_219_superior-net-barriers";
const SECURITY_NET_OPTIMIZATION_ID = "onr_v1_215_security-net-optimization";

const effectiveAgendaDifficultyDeps: EffectiveAgendaDifficultyDependencies = {
  definitionFor,
  runnerHasInstalledCorporateAlly,
  serverDifficultyIncreaseFromFaitAccompli,
  serverDifficultyReductionFromUpgrades,
};

export function buildPlayerViewProjection(
  state: GameState,
  side: Side,
  legalActions: LegalAction[],
): PlayerView {
  const runnerSide = side === "runner";
  const visibleServers = state.corp.servers.map((server) => ({
    id: server.id,
    label: server.label,
    ice: server.ice.map((id) => visibleCorpCard(state, id, side, "ice")),
    root:
      server.id === "archives"
        ? visibleCorpArchives(state, side)
        : server.root.map((id) => visibleCorpCard(state, id, side, "root")),
    ...counterDisplaysField(poxCounterDisplaysForServer(state, server.id)),
  }));

  const run = state.run
    ? {
        attackedServerId: state.run.attackedServerId,
        phase: state.run.phase,
        position: { ...state.run.position },
        ...(state.run.approachIceExposeViewingIceId
          ? {
              approachedIce: visibleCorpCard(
                state,
                state.run.approachIceExposeViewingIceId,
                side,
                "ice",
              ),
            }
          : {}),
        ...(state.run.encounteredIceId
          ? {
              encounteredIce: visibleCorpCard(
                state,
                state.run.encounteredIceId,
                side,
                "ice",
              ),
            }
          : {}),
        ...(state.run.accessedCardId
          ? {
              accessedCard: visibleCorpCard(
                state,
                state.run.accessedCardId,
                side,
                "root",
              ),
            }
          : {}),
        ...(state.run.breach
          ? {
              breach: {
                breachId: state.run.breach.breachId,
                serverId: state.run.breach.serverId,
                currentIndex: state.run.breach.currentIndex,
                remainingCount: state.run.breach.queue.filter(
                  (entry) => entry.status === "pending",
                ).length,
                completed: state.run.breach.completed,
              },
            }
          : {}),
        ...(state.run.badPublicityCredits !== undefined
          ? { badPublicityCredits: state.run.badPublicityCredits }
          : {}),
        successful: state.run.successful,
      }
    : undefined;

  return {
    side,
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    activeSide: state.activeSide,
    phase: state.phase,
    own: runnerSide
      ? {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          gripOrHq: state.runner.grip.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.runner.stack.length,
          heapOrArchives: state.runner.heap.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.runner.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          rig: [
            ...state.runner.rig.programs,
            ...state.runner.rig.hardware,
            ...state.runner.rig.resources,
          ].map((id) => visibleOwnCard(state, id)),
          memoryUsed: state.runner.memoryUsed,
          memoryLimit: runnerMemoryLimit(state),
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          tags: state.runner.tags,
        }
      : {
          identity: visibleOwnCard(state, state.corp.identity),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          gripOrHq: state.corp.hq.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.corp.rd.length,
          heapOrArchives: state.corp.archives.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.corp.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          maxHandSize: maxHandSize(state, "corp"),
          tags: state.runner.tags,
        },
    opponent: runnerSide
      ? {
          identity: visibleOwnCard(state, state.corp.identity),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          tags: state.runner.tags,
          handCount: state.corp.hq.length,
          maxHandSize: maxHandSize(state, "corp"),
          deckCount: state.corp.rd.length,
          discardCount: state.corp.archives.length,
          scoreArea: state.corp.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
        }
      : {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          tags: state.runner.tags,
          handCount: state.runner.grip.length,
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          deckCount: state.runner.stack.length,
          discardCount: state.runner.heap.length,
          discardCards: state.runner.heap.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.runner.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          rig: [
            ...state.runner.rig.programs,
            ...state.runner.rig.hardware,
            ...state.runner.rig.resources,
          ].map((id) => visibleRunnerRigCardForViewer(state, id, side)),
          memoryUsed: state.runner.memoryUsed,
          memoryLimit: runnerMemoryLimit(state),
        },
    servers: visibleServers,
    specialZones: visibleSpecialZones(state, side),
    ...(run ? { run } : {}),
    ...(state.pendingChoice?.side === side
      ? { pendingChoice: visibleChoice(state, state.pendingChoice) }
      : {}),
    ...(state.deckMetadata
      ? {
          deckMetadata: {
            own:
              side === "runner"
                ? state.deckMetadata.runner
                : state.deckMetadata.corp,
            opponent:
              side === "runner"
                ? state.deckMetadata.corp
                : state.deckMetadata.runner,
          },
        }
      : {}),
    publicEvents: state.eventLog.map((event) =>
      redactPublicEventForSide(toPublicEvent(event), side),
    ),
    legalActions,
    winner: state.winner,
    agendaPointsToWin: state.agendaPointsToWin,
    ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {}),
  };
}

function visibleChoice(
  state: GameState,
  choice: ChoiceRequest,
): NonNullable<PlayerView["pendingChoice"]> {
  const stackSearchResolution =
    choice.stackSearchResolution ?? stackSearchResolutionForChoice(choice);
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => {
      const card = visibleChoiceCardForOption(state, choice, option);
      return {
        id: option.id,
        label: option.label,
        ...(option.publicLabel ? { publicLabel: option.publicLabel } : {}),
        ...(option.selectable === false ? { selectable: false } : {}),
        ...(option.value !== undefined &&
        !(
          choice.visibility === "public" &&
          option.publicLabel &&
          typeof option.value === "string" &&
          option.id.startsWith("ice_")
        )
          ? { value: option.value }
          : {}),
        ...(card ? { card } : {}),
      };
    }),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility,
    ...(stackSearchResolution ? { stackSearchResolution } : {}),
  };
}

function isRunnerStackSearchChoice(choice: ChoiceRequest): boolean {
  return (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("v098.search_stack") ||
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.search_stack_card") ||
      choice.source.startsWith("v1911.search_stack") ||
      choice.source.startsWith("v1911.aujourdoui_top5") ||
      choice.source.startsWith("v1912.search_stack") ||
      choice.source.startsWith("v1911.short_circuit_search") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install") ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install"))
  );
}

function stackSearchResolutionForChoice(
  choice: ChoiceRequest,
): ChoiceRequest["stackSearchResolution"] | undefined {
  if (!isRunnerStackSearchChoice(choice)) return undefined;
  return {
    reveal:
      choice.source.startsWith("v1911.short_circuit_search") ||
      choice.source.startsWith("v1911.aujourdoui_top5") ||
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install") ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
        choice.source.includes(":stack:"))
        ? "public"
        : "hidden",
    destination:
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install") ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install")
        ? "install_program"
        : "grip",
    shuffleAfter: true,
    ...(choice.source.startsWith("v1911.self_modifying_code_install_program") ||
    choice.source.startsWith("v1911.sneak_preview_stack_install") ||
    choice.source.startsWith("p3_38.search_stack_install") ||
    choice.source.startsWith("p3_38.stack_or_trash_program_install")
      ? { publicRevealKind: "reveal" }
      : {}),
  };
}

function visibleChoiceCardForOption(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceRequest["options"][number],
): VisibleCard | undefined {
  if (typeof option.value !== "string") return undefined;
  const cardId = option.value as CardInstanceId;
  const isStackChoice = isRunnerStackSearchChoice(choice);
  const isSneakHeapChoice =
    choice.source.startsWith("v1911.sneak_preview_heap_install") ||
    (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
      choice.source.includes(":heap:"));
  const isPriorityRequisitionChoice = choice.source.startsWith(
    "v162.priority_requisition",
  );
  const isP333PrivateLookChoice = choice.source.startsWith(
    "p3_33.private_look",
  );
  if (
    !isStackChoice &&
    !isSneakHeapChoice &&
    !isPriorityRequisitionChoice &&
    !isP333PrivateLookChoice
  )
    return undefined;
  if (isP333PrivateLookChoice) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.owner !== "corp") return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (isPriorityRequisitionChoice) {
    const instance = state.cardInstances[cardId];
    if (
      !instance ||
      instance.owner !== "corp" ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce" ||
      instance.rezzed ||
      definitionFor(state, cardId).type !== "ice"
    )
      return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (isStackChoice && !state.runner.stack.includes(cardId)) return undefined;
  if (isSneakHeapChoice && !state.runner.heap.includes(cardId)) return undefined;
  const instance = state.cardInstances[cardId];
  if (!instance || instance.owner !== "runner") return undefined;
  if (!isStackChoice && definitionFor(state, cardId).type !== "program")
    return undefined;
  return visibleOwnCard(state, cardId);
}

function toPublicEvent(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass
      ? { visibilityClass: event.visibilityClass }
      : {}),
    publicPayload: event.publicPayload,
  };
}

function redactPublicEventForSide(
  event: PublicGameEvent,
  viewerSide: Side,
): PublicGameEvent {
  const actor = event.publicPayload.actor;
  const actionType = event.publicPayload.actionType;
  if (
    actionType !== "access_card" ||
    actor !== "runner" ||
    viewerSide !== "corp"
  )
    return event;
  const serverLabel =
    typeof event.publicPayload.serverLabel === "string"
      ? event.publicPayload.serverLabel
      : "";
  const serverId =
    typeof event.publicPayload.serverId === "string"
      ? event.publicPayload.serverId
      : "";
  const rdHiddenAccess =
    serverId === "rd" ||
    serverLabel === "R&D" ||
    serverLabel === "F&E (R&D)" ||
    serverLabel === "F&E";
  if (!rdHiddenAccess) return event;
  const {
    cardDefinitionId: _cardDefinitionId,
    title: _title,
    ...publicPayload
  } = event.publicPayload;
  void _cardDefinitionId;
  void _title;
  return {
    ...event,
    publicPayload: {
      ...publicPayload,
      redactedKind: "accessed_card",
    },
  };
}

function visibleOwnCard(state: GameState, id: CardInstanceId): VisibleCard {
  const definition = definitionFor(state, id);
  const instance = mustInstance(state.cardInstances, id);
  const runRemainderStrengthBonus =
    definition.type === "program"
      ? runRemainderStrengthBonusForBreaker(state.run, id)
      : 0;
  return {
    instanceId: id,
    known: true,
    title: definition.title,
    definitionId: definition.id,
    type: definition.type,
    subtypes: definition.subtypes,
    rulesText: definition.rulesText,
    ...(definition.cost !== undefined ? { cost: definition.cost } : {}),
    ...(definition.installCost !== undefined
      ? { installCost: definition.installCost }
      : {}),
    ...(definition.memoryCost !== undefined
      ? { memoryCost: definition.memoryCost }
      : {}),
    ...(definition.memoryLimitBonus !== undefined
      ? { memoryLimitBonus: definition.memoryLimitBonus }
      : {}),
    ...(definition.maxHandSizeBonus !== undefined
      ? { maxHandSizeBonus: definition.maxHandSizeBonus }
      : {}),
    ...(definition.rezCost !== undefined
      ? { rezCost: definition.rezCost }
      : {}),
    ...(definition.baseLink !== undefined
      ? { baseLink: definition.baseLink }
      : {}),
    rezzed: instance.rezzed,
    advancementCounters: instance.advancementCounters,
    ...(definition.advancementRequirement !== undefined
      ? {
          advancementRequirement:
            definition.type === "agenda"
              ? effectiveAgendaDifficulty(
                  effectiveAgendaDifficultyDeps,
                  state,
                  id,
                )
              : definition.advancementRequirement,
        }
      : {}),
    ...(definition.strength !== undefined
      ? {
          strength:
            definition.type === "ice"
              ? iceStrengthFor(state, id)
              : definition.strength +
                instance.strengthModifier +
                hostedProgramStrengthModifier(state, id) +
                runRemainderStrengthBonus,
        }
      : {}),
    ...(definition.agendaPoints !== undefined
      ? { agendaPoints: definition.agendaPoints }
      : {}),
    ...(definition.trashCost !== undefined
      ? { trashCost: definition.trashCost }
      : {}),
    ...(instance.counters
      ? { counters: cloneCounters(instance.counters) }
      : {}),
    ...counterDisplaysField(counterDisplaysForKnownCard(definition, instance)),
    ...(instance.hostedOn ? { hostedOn: instance.hostedOn } : {}),
    ...(requiresDataFortInstallTarget(definition) && instance.selectedServerId
      ? {
          selectedServerId: instance.selectedServerId,
          selectedServerLabel: serverChoiceDisplayLabel(
            state,
            instance.selectedServerId,
          ),
        }
      : {}),
    owner: instance.owner,
    controller: instance.controller,
  };
}

function counterDisplaysField(
  counterDisplays: VisibleCard["counterDisplays"],
): Pick<VisibleCard, "counterDisplays"> | Record<string, never> {
  return counterDisplays && counterDisplays.length > 0
    ? { counterDisplays }
    : {};
}

const STORED_CREDIT_COUNTER_DEFINITION_IDS = new Set<string>([
  "onr_v1_154_broker",
  "onr_v1_178_short-term-contract",
  "onr_v1_174_rigged-investments",
  "onr_v1_309_bbs-whispering-campaign",
  "onr_v1_311_braindance-campaign",
  "onr_v1_326_holovid-campaign",
  "onr_v1_337_rockerboy-promotion",
  "onr_v1_193_corporate-coup",
  "onr_v1_198_detroit-police-contract",
  "onr_v1_209_political-coup",
]);

function counterDisplaysForKnownCard(
  definition: CardDefinition,
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  return [
    ...(advancementCounterDisplays(instance.advancementCounters) ?? []),
    ...(storedCreditCounterDisplays(definition, instance) ?? []),
    ...(restrictedPoolCounterDisplays(definition, instance) ?? []),
    ...(recurringCreditCounterDisplays(instance) ?? []),
    ...(specialCounterDisplays(instance) ?? []),
  ];
}

function counterDisplaysForHiddenCorpRootCard(
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  return advancementCounterDisplays(instance.advancementCounters);
}

function advancementCounterDisplays(
  advancementCounters: number,
): VisibleCard["counterDisplays"] {
  const amount = Math.max(0, Math.floor(advancementCounters));
  if (amount <= 0) return undefined;
  return [
    {
      id: "advancement",
      amount,
      displayKind: "advancement",
      label: "Entwicklung",
      ariaLabel: `${amount} öffentliche Advancement-Counter`,
      usageHint: "score_modifier",
    },
  ];
}

function storedCreditCounterDisplays(
  definition: CardDefinition,
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  if (!STORED_CREDIT_COUNTER_DEFINITION_IDS.has(definition.id)) return undefined;
  const amount = Math.max(0, Math.floor(instance.counters?.bit ?? 0));
  if (amount <= 0) return undefined;
  return [
    {
      id: "stored_credits",
      amount,
      displayKind: "stored_credits",
      label: "Credits",
      ariaLabel: `${amount} gespeicherte Credits`,
      counterType: "bit",
      usageHint: "spendable",
    },
  ];
}

function recurringCreditCounterDisplays(
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  const amount = Math.max(0, Math.floor(instance.counters?.recurring_credit ?? 0));
  if (amount <= 0) return undefined;
  return [
    {
      id: "recurring_credit",
      amount,
      displayKind: "recurring_credit",
      label: "Wiederkehrende Credits",
      ariaLabel: `${amount} wiederkehrende Credits`,
      counterType: "recurring_credit",
      usageHint: "refreshing",
    },
  ];
}

function restrictedPoolCounterDisplays(
  definition: CardDefinition,
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  if (STORED_CREDIT_COUNTER_DEFINITION_IDS.has(definition.id)) return undefined;
  const amount = Math.max(0, Math.floor(instance.counters?.bit ?? 0));
  if (amount <= 0) return undefined;
  const implementation = cardImplementationForDefinitionId(definition.id);
  const restrictedSource = implementation?.restrictedHostedCreditSource;
  const tracePoolSource = implementation?.fortRunWindows?.some(
    (window) => window.kind === "corp_trace_bits_during_runs_on_this_fort",
  );
  if (!restrictedSource && !tracePoolSource) return undefined;
  const label = tracePoolSource
    ? "Trace-Bits"
    : restrictedPoolDisplayLabel(restrictedSource?.usableFor ?? []);
  return [
    {
      id: "restricted_pool",
      amount,
      displayKind: "restricted_pool",
      label,
      ariaLabel: `${amount} ${label}`,
      counterType: "bit",
      usageHint: "spendable",
    },
  ];
}

function restrictedPoolDisplayLabel(
  uses: readonly RestrictedHostedCreditUse[],
): string {
  if (uses.includes("increase_link")) return "Link-Bits";
  if (uses.includes("install_programs")) return "Installations-Bits";
  if (uses.includes("remove_tags")) return "Tag-Entfernungs-Bits";
  if (uses.includes("trash_nodes") || uses.includes("trash_upgrades"))
    return "Trash-Bits";
  if (
    uses.includes("using_icebreaker_during_run") ||
    uses.includes("using_icebreaker_during_run_non_noisy") ||
    uses.includes("using_killer_during_run")
  )
    return "Run-Bits";
  return "Eingeschränkte Bits";
}

function specialCounterDisplays(
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  const counters = instance.counters ?? {};
  return [
    ...singleCounterDisplay(counters.shell, {
      id: "shell",
      displayKind: "shell",
      label: "Shell-Counter",
      ariaLabelName: "Shell-Counter",
      counterType: "shell",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.ablative, {
      id: "ablative",
      displayKind: "damage_prevention",
      label: "Ablative-Counter",
      ariaLabelName: "Ablative-Counter",
      counterType: "ablative",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.virus, {
      id: "virus",
      displayKind: "virus",
      label: "Virus-Counter",
      ariaLabelName: "Virus-Counter",
      counterType: "virus",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.data_raven, {
      id: "data_raven",
      displayKind: "trace",
      label: "Data-Raven-Counter",
      ariaLabelName: "Data-Raven-Counter",
      counterType: "data_raven",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.cerberus, {
      id: "cerberus",
      displayKind: "trace",
      label: "Cerberus-Counter",
      ariaLabelName: "Cerberus-Counter",
      counterType: "cerberus",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.mastiff, {
      id: "mastiff",
      displayKind: "trace",
      label: "Mastiff-Counter",
      ariaLabelName: "Mastiff-Counter",
      counterType: "mastiff",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.crying, {
      id: "crying",
      displayKind: "trace",
      label: "Crying-Counter",
      ariaLabelName: "Crying-Counter",
      counterType: "crying",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.militech, {
      id: "militech",
      displayKind: "generic_counter",
      label: "Militech-Counter",
      ariaLabelName: "Militech-Counter",
      counterType: "militech",
      usageHint: "spendable",
    }),
    ...singleCounterDisplay(counters.mark, {
      id: "mark",
      displayKind: "generic_counter",
      label: "Mark-Counter",
      ariaLabelName: "Mark-Counter",
      counterType: "mark",
      usageHint: "status_marker",
    }),
  ];
}

function poxCounterDisplaysForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): VisibleCard["counterDisplays"] {
  const amount = poxCountersForServer(state, serverId);
  if (amount <= 0) return undefined;
  return [
    {
      id: "pox",
      amount,
      displayKind: "virus",
      label: "Pox-Counter",
      ariaLabel: `${amount} Pox-Counter auf diesem Server`,
      counterType: "virus",
      usageHint: "status_marker",
    },
  ];
}

function singleCounterDisplay(
  rawAmount: number | undefined,
  display: {
    id: string;
    displayKind: NonNullable<
      VisibleCard["counterDisplays"]
    >[number]["displayKind"];
    label: string;
    ariaLabelName: string;
    counterType: CounterType;
    usageHint: NonNullable<
      NonNullable<VisibleCard["counterDisplays"]>[number]["usageHint"]
    >;
  },
): NonNullable<VisibleCard["counterDisplays"]> {
  const amount = Math.max(0, Math.floor(rawAmount ?? 0));
  if (amount <= 0) return [];
  return [
    {
      id: display.id,
      amount,
      displayKind: display.displayKind,
      label: display.label,
      ariaLabel: `${amount} ${display.ariaLabelName}`,
      counterType: display.counterType,
      usageHint: display.usageHint,
    },
  ];
}

function visibleRunnerRigCardForViewer(
  state: GameState,
  id: CardInstanceId,
  viewer: Side,
): VisibleCard {
  if (viewer !== "corp" || !isConcealedRunnerResource(state, id))
    return visibleOwnCard(state, id);
  const instance = mustInstance(state.cardInstances, id);
  return {
    instanceId: hiddenRunnerResourceSlotId(id),
    known: false,
    type: "resource",
    subtypes: ["hidden_runner_resource"],
    rezzed: false,
    owner: instance.owner,
    controller: instance.controller,
  };
}

function isConcealedRunnerResource(
  state: GameState,
  id: CardInstanceId,
): boolean {
  if (!state.runner.rig.resources.includes(id)) return false;
  const instance = state.cardInstances[id];
  if (!instance || instance.faceup) return false;
  const definition = definitionFor(state, id);
  return definition.type === "resource" && cardHasSubtype(definition, "hidden");
}

function hiddenRunnerResourceSlotId(id: CardInstanceId): CardInstanceId {
  return `hidden_runner_resource_${hiddenVisibleCardId(id).replace(
    /^hidden_/,
    "",
  )}`;
}

function visibleCorpCard(
  state: GameState,
  id: CardInstanceId,
  viewer: Side,
  area: "ice" | "root",
): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  const accessed = state.run?.accessedCardId === id;
  const serverId =
    instance.zone.side === "corp" &&
    (instance.zone.zone === "serverIce" || instance.zone.zone === "serverRoot")
      ? instance.zone.serverId
      : undefined;
  const exposedBySpyCounter = serverId
    ? spyCountersForServer(state, serverId) > 0
    : false;
  const viewedApproachedIce =
    viewer === "runner" && state.run?.approachIceExposeViewingIceId === id;
  const visible =
    viewer === "corp" ||
    instance.rezzed ||
    exposedBySpyCounter ||
    accessed ||
    viewedApproachedIce ||
    state.corp.scoreArea.includes(id) ||
    (state.corp.archives.includes(id) && instance.faceup);
  if (!visible) {
    return {
      instanceId: hiddenVisibleCardId(id),
      known: false,
      rezzed: false,
      advancementCounters: area === "root" ? instance.advancementCounters : 0,
      ...(area === "root"
        ? counterDisplaysField(counterDisplaysForHiddenCorpRootCard(instance))
        : {}),
    };
  }
  return visibleOwnCard(state, id);
}

function visibleCorpArchives(state: GameState, viewer: Side): VisibleCard[] {
  return state.corp.archives
    .filter(
      (id) => viewer === "corp" || mustInstance(state.cardInstances, id).faceup,
    )
    .map((id) => visibleCorpCard(state, id, viewer, "root"));
}

function visibleSpecialZones(
  state: GameState,
  viewer: Side,
): NonNullable<PlayerView["specialZones"]> {
  const zones = state.specialZones ?? { setAside: [], removedFromGame: [] };
  return {
    setAside: zones.setAside.map((id) =>
      visibleSpecialZoneCard(state, id, viewer),
    ),
    removedFromGame: zones.removedFromGame.map((id) =>
      visibleSpecialZoneCard(state, id, viewer),
    ),
    setAsideCount: zones.setAside.length,
    removedFromGameCount: zones.removedFromGame.length,
  };
}

function visibleSpecialZoneCard(
  state: GameState,
  id: CardInstanceId,
  viewer: Side,
): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  if (instance.zone.side !== "special") return visibleOwnCard(state, id);
  if (canSeeSpecialZoneCard(instance, viewer)) return visibleOwnCard(state, id);
  return {
    instanceId: hiddenVisibleCardId(id),
    known: false,
  };
}

function canSeeSpecialZoneCard(instance: CardInstance, viewer: Side): boolean {
  if (instance.zone.side !== "special") return true;
  if (instance.zone.visibility === "public") return true;
  if (instance.zone.visibility === "side_private")
    return viewer === (instance.zone.visibilitySide ?? instance.owner);
  return false;
}

function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  const scoredPoints = ids.reduce(
    (sum, id) => sum + agendaPointsForScoredCard(state, id),
    0,
  );
  return side === "corp"
    ? scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
    : scoredPoints;
}

function agendaPointsForScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const definition = definitionFor(state, cardId);
  const basePoints = definition.agendaPoints ?? 0;
  const bonusPoints = cardCounter(state, cardId, "agenda");
  return Math.max(0, basePoints + bonusPoints);
}

function cloneCounters(
  counters: Partial<Record<CounterType, number>>,
): Partial<Record<CounterType, number>> {
  return Object.fromEntries(
    Object.entries(counters).filter(
      ([, amount]) => typeof amount === "number" && amount > 0,
    ),
  ) as Partial<Record<CounterType, number>>;
}

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

function hiddenVisibleCardId(id: CardInstanceId): CardInstanceId {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `hidden_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function runnerHasInstalledCorporateAlly(state: GameState): boolean {
  return state.runner.rig.resources.some((cardId) => {
    const definition = definitionFor(state, cardId);
    if (definition.id !== "onr_v1_156_corporate-ally") return false;
    return !cardImplementationForDefinitionId(definition.id)?.modifiers?.some(
      (modifier) => modifier.kind === "agenda_difficulty",
    );
  });
}

function serverDifficultyIncreaseFromFaitAccompli(
  state: GameState,
  agendaId: CardInstanceId,
): number {
  const zone = mustInstance(state.cardInstances, agendaId).zone;
  if (zone.side !== "corp" || zone.zone !== "serverRoot" || !zone.serverId)
    return 0;
  return Math.max(
    0,
    Math.floor(
      Math.max(
        0,
        Math.floor(state.faitAccompliCountersByServer?.[zone.serverId] ?? 0),
      ) / 2,
    ),
  );
}

function serverDifficultyReductionFromUpgrades(
  state: GameState,
  agendaId: CardInstanceId,
): number {
  const zone = mustInstance(state.cardInstances, agendaId).zone;
  if (zone.side !== "corp" || zone.zone !== "serverRoot" || !zone.serverId)
    return 0;
  const server = mustServer(state, zone.serverId);
  return server.root.reduce((sum, rootCardId) => {
    if (rootCardId === agendaId) return sum;
    const instance = mustInstance(state.cardInstances, rootCardId);
    if (!instance.rezzed) return sum;
    const definitionId = definitionFor(state, rootCardId).id;
    return SERVER_DIFFICULTY_UPGRADE_CARD_IDS.has(definitionId) ? sum + 1 : sum;
  }, 0);
}

function requiresDataFortInstallTarget(definition: CardDefinition): boolean {
  return (
    cardImplementationForDefinitionId(definition.id)?.installTargetBinding
      ?.kind === "choose_data_fort_on_install"
  );
}

function hostedProgramStrengthModifier(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const instance = state.cardInstances[cardId];
  if (!instance?.hostedOn) return 0;
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program" || !cardHasSubtype(definition, "icebreaker"))
    return 0;
  const hostDefinition = definitionFor(state, instance.hostedOn);
  const modifiers =
    cardImplementationForDefinitionId(hostDefinition.id)?.hostedProgramModifiers ??
    [];
  return modifiers.reduce((sum, modifier) => {
    if (
      modifier.appliesTo !== "hosted_icebreakers" ||
      modifier.kind !== "icebreaker_strength"
    )
      return sum;
    const amount = Math.max(0, Math.floor(modifier.amount));
    return sum + (modifier.operation === "reduce" ? -amount : amount);
  }, 0);
}

function iceStrengthFor(state: GameState, iceId: CardInstanceId): number {
  const definition = definitionFor(state, iceId);
  const instance = mustInstance(state.cardInstances, iceId);
  const runEncounterBonus =
    state.run?.encounteredIceId === iceId
      ? Math.max(0, Math.floor(state.run.futureEncounterIceStrengthBonus ?? 0))
      : 0;
  const pattelsReduction = cardCounter(state, iceId, "virus");
  const baseStrength =
    instance.proteusVariableIceState?.family === "x_strength" &&
    typeof instance.proteusVariableIceState.strength === "number"
      ? instance.proteusVariableIceState.strength
      : (definition.strength ?? 0);
  const total =
    baseStrength +
    instance.strengthModifier +
    iceStrengthBonusFor(state, iceId) +
    runEncounterBonus -
    pattelsReduction;
  return Math.max(0, total);
}

function iceStrengthBonusFor(state: GameState, iceId: CardInstanceId): number {
  const iceDefinition = definitionFor(state, iceId);
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  let bonus = 0;
  for (const agendaId of state.corp.scoreArea) {
    const agendaDefinition = definitionFor(state, agendaId);
    const scoredAgenda =
      cardImplementationForDefinitionId(agendaDefinition.id)?.scoredAgenda;
    if (scoredAgenda?.kind === "choose_fort_ice_strength_bonus") {
      if (
        iceServerId &&
        mustInstance(state.cardInstances, agendaId).selectedServerId === iceServerId
      )
        bonus += scoredAgenda.amount;
      continue;
    }
    if (!scoredAgenda) {
      if (
        agendaDefinition.id === SECURITY_NET_OPTIMIZATION_ID &&
        iceServerId &&
        mustInstance(state.cardInstances, agendaId).selectedServerId === iceServerId
      )
        bonus += 1;
      if (
        agendaDefinition.id === ENCRYPTION_BREAKTHROUGH_ID &&
        cardHasSubtype(iceDefinition, "code_gate")
      )
        bonus += 1;
      if (
        agendaDefinition.id === SUPERIOR_NET_BARRIERS_ID &&
        cardHasSubtype(iceDefinition, "wall")
      )
        bonus += 1;
    }
  }
  bonus += iceStrengthModifierBonusFor(state, iceId);
  bonus += cardCounter(state, iceId, "mark");
  return bonus;
}

function runRemainderStrengthBonusForBreaker(
  run: GameState["run"],
  breakerId: CardInstanceId,
): number {
  if (!run) return 0;
  return Math.max(
    0,
    Math.floor(run.remainderStrengthBonusByBreaker?.[breakerId] ?? 0),
  );
}

function poxCountersForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return Math.max(0, Math.floor(state.poxCountersByServer?.[serverId] ?? 0));
}

function spyCountersForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return Math.max(0, Math.floor(state.spyCountersByServer?.[serverId] ?? 0));
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  return definition.subtypes?.includes(subtype) ?? false;
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function mustServer(state: GameState, id: string): CorpServer {
  const server = state.corp.servers.find((candidate) => candidate.id === id);
  if (!server) throw new Error(`Server fehlt: ${id}`);
  return server;
}
