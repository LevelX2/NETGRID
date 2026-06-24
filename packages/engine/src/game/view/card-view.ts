// ARCH-6 read-only View-Helfer.
// Keine State-Mutation, keine LegalAction-Erzeugung, kein Import aus index.ts,
// keine PublicPayload-Vertragsaenderung.
import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type CounterType,
  type CorpServer,
  type GameState,
  type PlayerView,
  type PurgeableRunnerVirusCounterBucket,
  type PurgeableRunnerVirusCounterType,
  type ServerId,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import { corpServerIdForInstalledCard } from "../payment";
import {
  effectiveAgendaDifficulty,
  type EffectiveAgendaDifficultyDependencies,
} from "../../ability-engine/effective-values";
import { iceStrengthModifierBonusFor } from "../../ability-engine/ice-strength-modifiers";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { CASCADE_ID, SKIVVISS_ID } from "../../compatibility/runtime-compatibility";
import type { RestrictedHostedCreditUse } from "../../ability-engine/definition-types";
import { SERVER_DIFFICULTY_UPGRADE_CARD_IDS } from "../../mechanics/agenda-scoring";
import { serverChoiceDisplayLabel } from "./server-view";

const ENCRYPTION_BREAKTHROUGH_ID = "onr_v1_200_encryption-breakthrough";
const SUPERIOR_NET_BARRIERS_ID = "onr_v1_219_superior-net-barriers";
const COCKROACH_ID = "onr_v1_013_cockroach";
const CORP_PROJECTED_VIRUS_PROGRAM_IDS = new Set<string>([
  COCKROACH_ID,
  CASCADE_ID,
  SKIVVISS_ID,
]);

const effectiveAgendaDifficultyDeps: EffectiveAgendaDifficultyDependencies = {
  definitionFor,
  serverDifficultyIncreaseFromRunCounters,
  serverDifficultyReductionFromUpgrades,
};

export function visibleOwnCard(state: GameState, id: CardInstanceId): VisibleCard {
  return visibleKnownCardWithReferenceViewer(state, id, "own");
}

export function visibleOwnCardForViewer(
  state: GameState,
  id: CardInstanceId,
  viewer: Side,
): VisibleCard {
  return visibleKnownCardWithReferenceViewer(state, id, viewer);
}

function visibleKnownCardWithReferenceViewer(
  state: GameState,
  id: CardInstanceId,
  referenceViewer: Side | "own",
): VisibleCard {
  const definition = definitionFor(state, id);
  const instance = mustInstance(state.cardInstances, id);
  const runRemainderStrengthBonus =
    definition.type === "program"
      ? runRemainderStrengthBonusForBreaker(state.run, id)
      : 0;
  const visibleStrength =
    definition.strength !== undefined
      ? definition.type === "ice"
        ? iceStrengthFor(state, id)
        : definition.strength +
          instance.strengthModifier +
          hostedProgramStrengthModifier(state, id) +
          runRemainderStrengthBonus -
          pattelAntibodyStrengthPenalty(instance)
      : undefined;
  const visibleStrengthModifier =
    visibleStrength !== undefined
      ? visibleStrengthModifierForKnownCard(state, id, definition, visibleStrength)
      : undefined;
  return {
    instanceId: id,
    known: true,
    title: definition.title,
    definitionId: definition.id,
    type: definition.type,
    subtypes: effectiveSubtypesForCard(state, id, definition),
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
    ...(visibleStrength !== undefined
      ? { strength: visibleStrength }
      : {}),
    ...(visibleStrengthModifier !== undefined
      ? { strengthModifier: visibleStrengthModifier }
      : {}),
    ...(definition.agendaPoints !== undefined
      ? { agendaPoints: definition.agendaPoints }
      : {}),
    ...(definition.trashCost !== undefined
      ? { trashCost: definition.trashCost }
      : {}),
    ...visibleCountersField(visibleCountersForKnownCard(definition, instance)),
    ...counterDisplaysField(counterDisplaysForKnownCard(definition, instance)),
    ...(instance.tapped ? { tapped: true } : {}),
    ...(instance.hostedOn
      ? {
          hostedOn: instance.hostedOn,
          hostedOnLabel: visibleCardReferenceLabel(
            state,
            instance.hostedOn,
            referenceViewer,
          ),
        }
      : {}),
    ...(instance.selectedServerId
      ? {
          selectedServerId: instance.selectedServerId,
          selectedServerLabel: serverChoiceDisplayLabel(
            state,
            instance.selectedServerId,
          ),
        }
      : {}),
    ...(instance.selectedSubtype
      ? {
          selectedSubtype: instance.selectedSubtype,
          selectedSubtypeLabel: icebreakerSubtypeLabel(instance.selectedSubtype),
        }
      : {}),
    ...(instance.selectedCardId
      ? {
          selectedTargetLabel: visibleCardReferenceLabel(
            state,
            instance.selectedCardId,
            referenceViewer,
          ),
        }
      : {}),
    owner: instance.owner,
    controller: instance.controller,
  };
}

export function visibleCorpIdentityCard(state: GameState): VisibleCard {
  const card = visibleOwnCard(state, state.corp.identity);
  return {
    ...card,
    ...counterDisplaysField([
      ...(card.counterDisplays ?? []),
      ...(cascadeCorpCounterDisplays(state) ?? []),
      ...(cockroachCorpCounterDisplays(state) ?? []),
      ...(skivvissCorpCounterDisplays(state) ?? []),
      ...(badPublicityCounterDisplays(state) ?? []),
      ...(purgeableRunnerVirusCounterDisplaysForBucket(
        state.purgeableRunnerVirusCounters?.corp,
        "corp",
      ) ?? []),
    ]),
  };
}

function visibleCountersField(
  counters: Partial<Record<CounterType, number>> | undefined,
): Pick<VisibleCard, "counters"> | Record<string, never> {
  return counters && Object.keys(counters).length > 0 ? { counters } : {};
}

export function counterDisplaysField(
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
  "onr_v1_318_department-of-truth-enhancement",
  "onr_v1_193_corporate-coup",
  "onr_v1_198_detroit-police-contract",
  "onr_v1_209_political-coup",
]);

function visibleCountersForKnownCard(
  definition: CardDefinition,
  instance: CardInstance,
): Partial<Record<CounterType, number>> | undefined {
  if (!instance.counters) return undefined;
  const counters = cloneCounters(instance.counters);
  if (CORP_PROJECTED_VIRUS_PROGRAM_IDS.has(definition.id)) delete counters.virus;
  return counters;
}

function counterDisplaysForKnownCard(
  definition: CardDefinition,
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  return [
    ...(advancementCounterDisplays(instance.advancementCounters) ?? []),
    ...(storedCreditCounterDisplays(definition, instance) ?? []),
    ...(restrictedPoolCounterDisplays(definition, instance) ?? []),
    ...(recurringCreditCounterDisplays(definition, instance) ?? []),
    ...(specialCounterDisplays(definition, instance) ?? []),
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
      creditPool: {
        kind: "stored_credit",
      },
    },
  ];
}

function recurringCreditCounterDisplays(
  definition: CardDefinition,
  instance: CardInstance,
): VisibleCard["counterDisplays"] {
  const amount = Math.max(0, Math.floor(instance.counters?.recurring_credit ?? 0));
  if (amount <= 0) return undefined;
  const capacity = Math.max(0, Math.floor(definition.recurringCredits ?? amount));
  return [
    {
      id: "recurring_credit",
      amount,
      displayKind: "recurring_credit",
      label: "Wiederkehrende Credits",
      ariaLabel: `${amount} wiederkehrende Credits`,
      counterType: "recurring_credit",
      usageHint: "refreshing",
      creditPool: {
        kind: "recurring_credit",
        capacity,
        refresh: {
          timing: "start_of_runner_turn",
          behavior: "refill_to_capacity_if_used",
        },
      },
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
      creditPool: {
        kind: "restricted_credit",
        ...(restrictedSource
          ? {
              capacity: Math.max(0, Math.floor(restrictedSource.capacity)),
              uses: restrictedSource.usableFor.slice(),
              refresh: {
                timing: restrictedSource.refresh.timing,
                behavior: restrictedSource.refresh.mode,
              },
            }
          : {}),
      },
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
  definition: CardDefinition,
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
    ...singleCounterDisplay(counters.trauma, {
      id: "trauma",
      displayKind: "damage_prevention",
      label: "Trauma-Counter",
      ariaLabelName: "Trauma-Counter",
      counterType: "trauma",
      usageHint: "status_marker",
    }),
    ...(CORP_PROJECTED_VIRUS_PROGRAM_IDS.has(definition.id)
      ? []
      : singleCounterDisplay(counters.virus, {
          id: definition.id === COCKROACH_ID ? "cockroach" : "virus",
          displayKind: "virus",
          label:
            definition.id === COCKROACH_ID
              ? "Cockroach-Counter"
              : "Virus-Counter",
          ariaLabelName:
            definition.id === COCKROACH_ID
              ? "Cockroach-Counter"
              : "Virus-Counter",
          counterType: definition.id === COCKROACH_ID ? "cockroach" : "virus",
          usageHint: "status_marker",
        })),
    ...singleCounterDisplay(counters.trace_tag_counter, {
      id: "trace_tag_counter",
      displayKind: "trace",
      label: "Data-Raven-Counter",
      ariaLabelName: "Data-Raven-Counter",
      counterType: "trace_tag_counter",
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
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.power, {
      id: "power",
      displayKind: "generic_counter",
      label: "Power-Counter",
      ariaLabelName: "Power-Counter",
      counterType: "power",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.link_reduction_counter, {
      id: "link_reduction_counter",
      displayKind: "generic_counter",
      label: "Doppelganger-Counter",
      ariaLabelName: "Doppelganger-Counter",
      counterType: "link_reduction_counter",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.breaker_strength_penalty, {
      id: "breaker_strength_penalty",
      displayKind: "generic_counter",
      label: "Pattel-Counter",
      ariaLabelName: "Pattel-Counter",
      counterType: "breaker_strength_penalty",
      usageHint: "status_marker",
    }),
    ...singleCounterDisplay(counters.mark, {
      id: definition.type === "ice" ? "ice_mark_modifier" : "mark",
      displayKind: "generic_counter",
      label: definition.type === "ice" ? "ICE-Mark-Counter" : "Mark-Counter",
      ariaLabelName:
        definition.type === "ice" ? "ICE-Mark-Counter" : "Mark-Counter",
      counterType: "mark",
      usageHint: "status_marker",
    }),
  ];
}

function skivvissCorpCounterDisplays(state: GameState): VisibleCard["counterDisplays"] {
  const amount = skivvissCounterTotal(state);
  if (amount <= 0) return undefined;
  return [
    {
      id: "skivviss",
      amount,
      displayKind: "virus",
      label: "Skivviss-Counter",
      ariaLabel: `${amount} Skivviss-Counter auf der Korp`,
      counterType: "virus",
      usageHint: "status_marker",
    },
  ];
}

function cockroachCorpCounterDisplays(state: GameState): VisibleCard["counterDisplays"] {
  const amount = cockroachCounterTotal(state);
  if (amount <= 0) return undefined;
  return [
    {
      id: "cockroach",
      amount,
      displayKind: "virus",
      label: "Cockroach-Counter",
      ariaLabel: `${amount} Cockroach-Counter auf der Korp`,
      counterType: "cockroach",
      usageHint: "status_marker",
    },
  ];
}

function cascadeCorpCounterDisplays(state: GameState): VisibleCard["counterDisplays"] {
  const amount = cascadeCounterTotal(state);
  if (amount <= 0) return undefined;
  return [
    {
      id: "runner_virus_corp_cascade",
      amount,
      displayKind: "virus",
      label: "Cascade-Counter",
      ariaLabel: `${amount} Cascade-Counter auf der Korp`,
      counterType: "cascade",
      usageHint: "status_marker",
    },
  ];
}

function cascadeCounterTotal(state: GameState): number {
  const corpCounterAmount = Math.max(
    0,
    Math.floor(Number(state.purgeableRunnerVirusCounters?.corp?.cascade ?? 0)),
  );
  const legacyCardCounterAmount = Object.keys(state.cardInstances).reduce(
    (sum, cardId) => {
      if (definitionFor(state, cardId).id !== CASCADE_ID) return sum;
      return sum + cardCounter(state, cardId, "virus");
    },
    0,
  );
  return corpCounterAmount + legacyCardCounterAmount;
}

function skivvissCounterTotal(state: GameState): number {
  return Object.keys(state.cardInstances).reduce((sum, cardId) => {
    if (definitionFor(state, cardId).id !== SKIVVISS_ID) return sum;
    return sum + cardCounter(state, cardId, "virus");
  }, 0);
}

function cockroachCounterTotal(state: GameState): number {
  return Object.keys(state.cardInstances).reduce((sum, cardId) => {
    if (definitionFor(state, cardId).id !== COCKROACH_ID) return sum;
    return sum + cardCounter(state, cardId, "virus");
  }, 0);
}

function badPublicityCounterDisplays(state: GameState): VisibleCard["counterDisplays"] {
  const amount = Math.max(0, Math.floor(state.corp.badPublicity));
  if (amount <= 0) return undefined;
  return [
    {
      id: "bad_publicity",
      amount,
      displayKind: "bad_publicity",
      label: "Bad Publicity",
      ariaLabel: `${amount} Bad Publicity`,
      counterType: "bad_publicity",
      usageHint: "status_marker",
    },
  ];
}

export function poxCounterDisplaysForServer(
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

export function spyCounterDisplaysForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): VisibleCard["counterDisplays"] {
  const amount = spyCountersForServer(state, serverId);
  if (amount <= 0) return undefined;
  return [
    {
      id: "spy",
      amount,
      displayKind: "generic_counter",
      label: "Spy-Counter",
      ariaLabel: `${amount} Spy-Counter auf diesem Server`,
      counterType: "spy",
      usageHint: "status_marker",
    },
  ];
}

export function purgeableRunnerVirusCounterDisplaysForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): VisibleCard["counterDisplays"] {
  return purgeableRunnerVirusCounterDisplaysForBucket(
    state.purgeableRunnerVirusCounters?.servers?.[serverId],
    `server_${serverId}`,
  );
}

const PURGEABLE_RUNNER_VIRUS_COUNTER_DISPLAY_ORDER: readonly PurgeableRunnerVirusCounterType[] =
  [
    "doom",
    "crumble",
    "garbage",
    "highlighter",
    "scaldan",
    "tax",
    "vienna",
    "socket_archives",
    "socket_hq",
    "socket_rd",
    "pipe",
  ];

function purgeableRunnerVirusCounterDisplaysForBucket(
  bucket: PurgeableRunnerVirusCounterBucket | undefined,
  scopeId: string,
): VisibleCard["counterDisplays"] {
  if (!bucket) return undefined;
  const displays = PURGEABLE_RUNNER_VIRUS_COUNTER_DISPLAY_ORDER.flatMap(
    (counterType) => {
      const amount = Math.max(0, Math.floor(Number(bucket[counterType] ?? 0)));
      if (amount <= 0) return [];
      const label = purgeableRunnerVirusCounterLabel(counterType);
      return [
        {
          id: `runner_virus_${scopeId}_${counterType}`,
          amount,
          displayKind: "virus" as const,
          label,
          ariaLabel: `${amount} ${label}`,
          counterType,
          usageHint: "status_marker" as const,
        },
      ];
    },
  );
  return displays.length > 0 ? displays : undefined;
}

function purgeableRunnerVirusCounterLabel(
  counterType: PurgeableRunnerVirusCounterType,
): string {
  switch (counterType) {
    case "cascade":
      return "Cascade-Counter";
    case "socket_archives":
      return "Socket-Counter Archives";
    case "socket_hq":
      return "Socket-Counter HQ";
    case "socket_rd":
      return "Socket-Counter R&D";
    default:
      return `${counterType[0]?.toUpperCase() ?? ""}${counterType.slice(1)}-Counter`;
  }
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

function pattelAntibodyStrengthPenalty(instance: CardInstance): number {
  return Math.max(0, Math.floor(instance.counters?.breaker_strength_penalty ?? 0));
}

export function visibleRunnerRigCardForViewer(
  state: GameState,
  id: CardInstanceId,
  viewer: Side,
): VisibleCard {
  if (viewer !== "corp" || !isConcealedRunnerResource(state, id))
    return visibleKnownCardWithReferenceViewer(state, id, viewer);
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

function visibleKnownCardForReference(
  state: GameState,
  id: CardInstanceId,
  viewer: Side | "own",
): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  if (viewer === "own") return visibleOwnCard(state, id);
  if (instance.zone.side === "corp") {
    return visibleCorpCard(
      state,
      id,
      viewer,
      instance.zone.zone === "serverIce" ? "ice" : "root",
    );
  }
  if (instance.zone.side === "runner") {
    return visibleRunnerRigCardForViewer(state, id, viewer);
  }
  return visibleSpecialZoneCard(state, id, viewer);
}

function visibleCardReferenceLabel(
  state: GameState,
  id: CardInstanceId,
  viewer: Side | "own",
): string {
  const visible = visibleKnownCardForReference(state, id, viewer);
  if (visible.known && visible.title) return visible.title;
  const instance = state.cardInstances[id];
  if (!instance) return "unbekannte Karte";
  if (instance.zone.side === "corp") {
    if (instance.zone.zone === "serverIce")
      return corpIcePositionLabel(state, id, instance.zone.serverId);
    if (instance.zone.zone === "serverRoot")
      return `Karte in ${serverChoiceDisplayLabel(state, instance.zone.serverId)}`;
    if (instance.zone.zone === "hq") return "Karte in HQ";
    if (instance.zone.zone === "rd") return "Karte in R&D";
    if (instance.zone.zone === "archives") return "Karte im Archiv";
  }
  if (instance.zone.side === "runner") {
    if (instance.zone.zone === "rig") return "installierte Runner-Karte";
    if (instance.zone.zone === "grip") return "Karte im Grip";
    if (instance.zone.zone === "stack") return "Karte im Stack";
    if (instance.zone.zone === "heap") return "Karte im Heap";
  }
  return "verdeckte Karte";
}

function corpIcePositionLabel(
  state: GameState,
  id: CardInstanceId,
  serverId: Exclude<ServerId, "new_remote">,
): string {
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  const position = server ? server.ice.indexOf(id) + 1 : 0;
  const positionSuffix = position > 0 ? ` Position ${position}` : "";
  return `ICE auf ${serverChoiceDisplayLabel(state, serverId)}${positionSuffix}`;
}

export function isConcealedRunnerResource(
  state: GameState,
  id: CardInstanceId,
): boolean {
  if (!state.runner.rig.resources.includes(id)) return false;
  const instance = state.cardInstances[id];
  if (!instance || instance.faceup) return false;
  const definition = definitionFor(state, id);
  return definition.type === "resource" && cardHasSubtype(definition, "hidden");
}

export function hiddenRunnerResourceSlotId(id: CardInstanceId): CardInstanceId {
  return `hidden_runner_resource_${hiddenVisibleCardId(id).replace(
    /^hidden_/,
    "",
  )}`;
}

export function resolveHiddenRunnerResourceSlot(
  state: GameState,
  slotId: string,
): CardInstanceId | undefined {
  return state.runner.rig.resources.find(
    (id) =>
      isConcealedRunnerResource(state, id) &&
      hiddenRunnerResourceSlotId(id) === slotId,
  );
}

function corpViewerCanSeeCorpCard(
  state: GameState,
  id: CardInstanceId,
  instance: CardInstance,
): boolean {
  if (state.corp.hq.includes(id)) return true;
  if (state.corp.archives.includes(id)) return true;
  if (state.corp.scoreArea.includes(id)) return true;
  if (instance.zone.side !== "corp") return false;
  return instance.zone.zone === "serverIce" || instance.zone.zone === "serverRoot";
}

export function visibleCorpCard(
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
  const viewedInstalledExposeCard =
    viewer === "runner" && pendingInstalledCorpExposeReviewCardId(state) === id;
  const privateRunnerRdAccess =
    viewer === "corp" &&
    accessed &&
    state.run?.attackedServerId === "rd" &&
    instance.zone.side === "corp" &&
    instance.zone.zone === "rd";
  const visible =
    (viewer === "corp" && corpViewerCanSeeCorpCard(state, id, instance)) ||
    (!privateRunnerRdAccess &&
      (instance.faceup || instance.rezzed || exposedBySpyCounter)) ||
    (viewer === "runner" && accessed) ||
    viewedApproachedIce ||
    viewedInstalledExposeCard ||
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

function pendingInstalledCorpExposeReviewCardId(
  state: GameState,
): CardInstanceId | undefined {
  const source = state.pendingChoice?.source ?? "";
  if (!source.startsWith("p3_36.expose_installed_card_review:"))
    return undefined;
  const targetCardId = source.split(":")[1];
  return targetCardId && state.cardInstances[targetCardId]
    ? (targetCardId as CardInstanceId)
    : undefined;
}

export function visibleCorpArchives(state: GameState, viewer: Side): VisibleCard[] {
  return state.corp.archives
    .filter(
      (id) => viewer === "corp" || mustInstance(state.cardInstances, id).faceup,
    )
    .map((id) => visibleCorpCard(state, id, viewer, "root"));
}

export function visibleSpecialZones(
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

export function agendaPoints(state: GameState, side: Side): number {
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

function serverDifficultyIncreaseFromRunCounters(
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
        Math.floor(state.serverAgendaCostCountersByServer?.[zone.serverId] ?? 0),
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
    instance.variableIceState?.family === "x_strength" &&
    typeof instance.variableIceState.strength === "number"
      ? instance.variableIceState.strength
      : (definition.strength ?? 0);
  const total =
    baseStrength +
    instance.strengthModifier +
    iceStrengthBonusFor(state, iceId) +
    relativeIceStrengthBonusFor(state, iceId) +
    runEncounterBonus -
    pattelsReduction;
  return Math.max(0, total);
}

function visibleStrengthModifierForKnownCard(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
  visibleStrength: number,
): number | undefined {
  if (definition.strength === undefined) return undefined;
  const instance = mustInstance(state.cardInstances, cardId);
  const baseStrength =
    definition.type === "ice" &&
    instance.variableIceState?.family === "x_strength" &&
    typeof instance.variableIceState.strength === "number"
      ? instance.variableIceState.strength
      : definition.strength;
  const modifier = Math.floor(visibleStrength - baseStrength);
  return modifier > 0 ? modifier : undefined;
}

function iceStrengthBonusFor(state: GameState, iceId: CardInstanceId): number {
  const iceDefinition = definitionFor(state, iceId);
  const iceSubtypes = effectiveSubtypesForCard(state, iceId, iceDefinition);
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
        agendaDefinition.id === ENCRYPTION_BREAKTHROUGH_ID &&
        iceSubtypes.includes("code_gate")
      )
        bonus += 1;
      if (
        agendaDefinition.id === SUPERIOR_NET_BARRIERS_ID &&
        iceSubtypes.includes("wall")
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

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function stableSubtypeList(subtypes: readonly string[]): string[] {
  return [...new Set(subtypes.map((subtype) => normalizeSubtypeLabel(subtype)))]
    .sort();
}

function icebreakerSubtypeLabel(subtype: string): string {
  switch (normalizeSubtypeLabel(subtype)) {
    case "code_gate":
      return "Code Gate";
    case "sentry":
      return "Sentry";
    case "wall":
      return "Wall";
    default:
      return subtype;
  }
}

function effectiveSubtypesForCard(
  state: GameState,
  cardId: CardInstanceId,
  definition = definitionFor(state, cardId),
): string[] {
  const instance = state.cardInstances[cardId];
  const selectedSubtypes = instance?.variableIceState?.selectedSubtypes;
  if (
    definition.type === "ice" &&
    instance?.rezzed &&
    selectedSubtypes &&
    selectedSubtypes.length > 0
  )
    return stableSubtypeList(selectedSubtypes);
  return stableSubtypeList(definition.subtypes ?? []);
}

function rezzedIceOutsideThisIceCount(
  state: GameState,
  iceId: CardInstanceId,
): number {
  const instance = state.cardInstances[iceId];
  if (!instance || instance.zone.side !== "corp" || instance.zone.zone !== "serverIce")
    return 0;
  const serverId = instance.zone.serverId;
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) return 0;
  const iceIndex = server.ice.indexOf(iceId);
  if (iceIndex < 0) return 0;
  return server.ice
    .slice(iceIndex + 1)
    .filter((candidateId) => state.cardInstances[candidateId]?.rezzed === true)
    .length;
}

function relativeIceStrengthBonusFor(
  state: GameState,
  iceId: CardInstanceId,
): number {
  const relativeIce =
    cardImplementationForDefinitionId(definitionFor(state, iceId).id)?.relativeIce;
  const bonusPerCount = relativeIce?.strengthBonusPerCount;
  if (!bonusPerCount) return 0;
  return rezzedIceOutsideThisIceCount(state, iceId) * bonusPerCount;
}

export function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
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
