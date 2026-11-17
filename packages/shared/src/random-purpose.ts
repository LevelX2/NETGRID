import type { CardDefinitionId, CardInstanceId, RunId, TraceId } from "./index";
import {
  isDamageRandomSource,
  type DamageRandomSource,
} from "./damage-random-source";

/** Stable wire codes. Existing entries keep their numeric identity. */
export const RandomPurposeCode = {
  SetupRunnerShuffle: 1,
  SetupCorpShuffle: 2,
  SetupRunnerDraw: 3,
  SetupCorpDraw: 4,
  MulliganRunnerShuffle: 5,
  MulliganCorpShuffle: 6,
  MulliganRunnerDraw: 7,
  MulliganCorpDraw: 8,
  HqAccess: 9,
  HqMultiaccess: 10,
  DamageSelection: 11,
  ProgramProbe: 12,
  TagDamageDie: 13,
  VirusInstallDie: 14,
  IceEncounterDie: 15,
  PrintedRandomDamageDie: 16,
  RewindEncounterDie: 17,
  PassedIceDie: 18,
  PostEncounterDie: 19,
  BreakerRandomDie: 20,
  DiceLoopInitial: 21,
  DiceLoopFollowup: 22,
  ThreeDice: 23,
  VirusCorpStartDie: 24,
  VirusRunnerStartDie: 25,
  SatelliteMonitorDie: 26,
  RunnerStartEffectDie: 27,
  TurnStartActionDie: 28,
  RunStartStrengthDie: 29,
  RunnerFullRecycle: 30,
  ReschedulerShuffle: 31,
  AgendaFullRecycle: 32,
  AgendaHqShuffle: 33,
  CorpCardIntoRd: 34,
  RevealRdUntilAgendaShuffle: 35,
  ArchivesIntoRdShuffle: 36,
  TestSpinReturnShuffle: 37,
  TestSpinInstallShuffle: 38,
  RevealedProgramInstalledShuffle: 39,
  RevealedProgramEmptyShuffle: 40,
  StackProgramInstallShuffle: 41,
  StackShowEmptyShuffle: 42,
  StackShowInstallShuffle: 43,
  TemporaryProgramInstallShuffle: 44,
  StackSearchShuffle: 45,
  StackToGripShuffle: 46,
  TopFiveShuffle: 47,
  TopMatchingShuffle: 48,
  PaidStackInstallShuffle: 49,
  EmptyGripSearchShuffle: 50,
  ImplementationHqDiscard: 51,
  HiddenResourceHqDiscard: 52,
  VirusHqDiscard: 53,
  ForcedActionGripSelection: 54,
  BoardwalkHqSelection: 55,
  SuccessfulRunGripShuffle: 56,
  AiTurnPlanSelection: 60,
  IceInstallSelection: 61,
  TraceBidSelection: 62,
} as const;

type SideCode = 0 | 1;

type RandomPurposeArguments = {
  1: [];
  2: [];
  3: [];
  4: [];
  5: [];
  6: [];
  7: [];
  8: [];
  9: [];
  10: [runId: RunId, selectionIndex: number];
  11: [
    damageType: 0 | 1 | 2,
    source: DamageRandomSource,
    amount: number,
    selectionIndex: number,
  ];
  12: [sourceDefinitionId: CardDefinitionId];
  13: [sourceDefinitionId: CardDefinitionId];
  14: [
    sourceDefinitionId: CardDefinitionId,
    stateVersion: number,
    installedCardId: CardInstanceId,
    counterIndex: number,
  ];
  15: [
    sourceDefinitionId: CardDefinitionId,
    runId: RunId,
    iceId: CardInstanceId,
  ];
  16: [runId: RunId, iceId: CardInstanceId, subroutineIndex: number];
  17: [runId: RunId, iceId: CardInstanceId];
  18: [
    sourceDefinitionId: CardDefinitionId,
    runId: RunId,
    iceId: CardInstanceId,
    sourceId: CardInstanceId,
  ];
  19: [
    sourceDefinitionId: CardDefinitionId,
    runId: RunId,
    iceId: CardInstanceId,
    breakerId: CardInstanceId,
  ];
  20: [
    sourceDefinitionId: CardDefinitionId,
    runId: RunId,
    iceId: CardInstanceId,
    breakerId: CardInstanceId,
    subroutineIndex: number,
  ];
  21: [sourceDefinitionId: CardDefinitionId];
  22: [
    sourceDefinitionId: CardDefinitionId,
    stateVersion: number,
    rollIndex: number,
  ];
  23: [sourceDefinitionId: CardDefinitionId, dieOrdinal: number];
  24: [
    sourceDefinitionId: CardDefinitionId,
    stateVersion: number,
    counterIndex: number,
  ];
  25: [
    sourceDefinitionId: CardDefinitionId,
    stateVersion: number,
    counterIndex: number,
  ];
  26: [stateVersion: number, sourceCardId: CardInstanceId, runIndex: number];
  27: [
    sourceDefinitionId: CardDefinitionId,
    stateVersion: number,
    sourceCardId: CardInstanceId,
  ];
  28: [
    side: SideCode,
    sourceDefinitionId: CardDefinitionId,
    stateVersion: number,
    sourceCardId: CardInstanceId,
  ];
  29: [sourceDefinitionId: CardDefinitionId];
  30: [sourceDefinitionId: CardDefinitionId, stateVersion: number];
  31: [sourceCardId: CardInstanceId, stateVersion: number];
  32: [stateVersion: number];
  33: [sourceCardId: CardInstanceId, stateVersion: number];
  34: [sourceDefinitionId: CardDefinitionId, reason: 0 | 1 | 2];
  35: [runId: RunId];
  36: [runId: RunId];
  37: [runId: RunId, cardId: CardInstanceId];
  38: [choiceStateVersion: number];
  39: [sourceCardId: CardInstanceId, installedCardId: CardInstanceId];
  40: [sourceCardId: CardInstanceId, runId: RunId];
  41: [choiceStateVersion: number];
  42: [sourceCardId: CardInstanceId, runId: RunId];
  43: [choiceStateVersion: number];
  44: [choiceStateVersion: number];
  45: [choiceStateVersion: number];
  46: [choiceStateVersion: number];
  47: [choiceStateVersion: number];
  48: [choiceStateVersion: number];
  49: [choiceStateVersion: number];
  50: [sourceDefinitionId: CardDefinitionId];
  51: [sourceDefinitionId: CardDefinitionId, selectionIndex: number];
  52: [
    sourceDefinitionId: CardDefinitionId,
    choiceStateVersion: number,
    selectionIndex: number,
  ];
  53: [selectionIndex: number];
  54: [stateVersion: number];
  55: [stateVersion: number, selectionIndex: number];
  56: [runId: RunId, sourceCardId: CardInstanceId, stateVersion: number];
  60: [side: SideCode, stateVersion: number, quoteFingerprint: number];
  61: [stateVersion: number, quoteFingerprint: number];
  62: [
    side: SideCode,
    assessmentKind: 0 | 1,
    traceId: TraceId | 0,
    stateVersion: number,
    quoteFingerprint: number,
  ];
};

export type RandomPurposeCode = keyof RandomPurposeArguments;
export type RandomPurpose = {
  [Code in RandomPurposeCode]: readonly [
    code: Code,
    ...arguments: RandomPurposeArguments[Code],
  ];
}[RandomPurposeCode];

export type RandomHqDiscardContext =
  | readonly [51, sourceDefinitionId: CardDefinitionId]
  | readonly [
      52,
      sourceDefinitionId: CardDefinitionId,
      choiceStateVersion: number,
    ]
  | readonly [53];

type ArgumentKind =
  | "integer"
  | "positive"
  | "card"
  | "side"
  | "ternary"
  | "fingerprint"
  | "damage";
const shapes = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
  9: [],
  10: ["positive", "integer"],
  11: ["ternary", "damage", "positive", "integer"],
  12: ["positive"],
  13: ["positive"],
  14: ["positive", "integer", "card", "integer"],
  15: ["positive", "positive", "card"],
  16: ["positive", "card", "integer"],
  17: ["positive", "card"],
  18: ["positive", "positive", "card", "card"],
  19: ["positive", "positive", "card", "card"],
  20: ["positive", "positive", "card", "card", "integer"],
  21: ["positive"],
  22: ["positive", "integer", "integer"],
  23: ["positive", "positive"],
  24: ["positive", "integer", "integer"],
  25: ["positive", "integer", "integer"],
  26: ["integer", "card", "integer"],
  27: ["positive", "integer", "card"],
  28: ["side", "positive", "integer", "card"],
  29: ["positive"],
  30: ["positive", "integer"],
  31: ["card", "integer"],
  32: ["integer"],
  33: ["card", "integer"],
  34: ["positive", "ternary"],
  35: ["positive"],
  36: ["positive"],
  37: ["positive", "card"],
  38: ["integer"],
  39: ["card", "card"],
  40: ["card", "positive"],
  41: ["integer"],
  42: ["card", "positive"],
  43: ["integer"],
  44: ["integer"],
  45: ["integer"],
  46: ["integer"],
  47: ["integer"],
  48: ["integer"],
  49: ["integer"],
  50: ["positive"],
  51: ["positive", "integer"],
  52: ["positive", "integer", "integer"],
  53: ["integer"],
  54: ["integer"],
  55: ["integer", "integer"],
  56: ["positive", "card", "integer"],
  60: ["side", "integer", "fingerprint"],
  61: ["integer", "fingerprint"],
  62: ["side", "side", "integer", "integer", "fingerprint"],
} as const satisfies Record<RandomPurposeCode, readonly ArgumentKind[]>;

export type RandomDomain = "engine" | "ai_turn_plan_selection";

export function isRandomPurposeCode(
  value: unknown,
): value is RandomPurposeCode {
  return typeof value === "number" && Object.hasOwn(shapes, value);
}

function validArgument(kind: ArgumentKind, value: unknown): boolean {
  if (kind === "damage") return isDamageRandomSource(value);
  if (kind === "card") return typeof value === "string" && value.length > 0;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    return false;
  if (kind === "positive") return value > 0;
  if (kind === "side") return value <= 1;
  if (kind === "ternary") return value <= 2;
  if (kind === "fingerprint") return value <= 0xffffffff;
  return true;
}

export function isRandomPurpose(
  value: unknown,
  domain?: RandomDomain,
): value is RandomPurpose {
  if (!Array.isArray(value) || !isRandomPurposeCode(value[0])) return false;
  const code = value[0];
  if (domain === "engine" && code === 60) return false;
  if (domain === "ai_turn_plan_selection" && code !== 60 && code !== 62)
    return false;
  const shape = shapes[code];
  if (
    value.length !== shape.length + 1 ||
    !shape.every((kind, index) => validArgument(kind, value[index + 1]))
  )
    return false;
  if (code === 23 && value[2] > 3) return false;
  if (
    code === 62 &&
    ((value[2] === 0 && value[3] === 0) || (value[2] === 1 && value[3] !== 0))
  )
    return false;
  return true;
}

export type RandomDrawRecord = {
  counter: number;
  purpose: RandomPurpose;
  value: number;
};

export function isRandomDrawRecord(
  value: unknown,
  domain?: RandomDomain,
): value is RandomDrawRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.counter === "number" &&
    Number.isSafeInteger(record.counter) &&
    record.counter >= 0 &&
    typeof record.value === "number" &&
    Number.isFinite(record.value) &&
    record.value >= 0 &&
    record.value < 1 &&
    isRandomPurpose(record.purpose, domain)
  );
}

export function serializeRandomPurpose(purpose: RandomPurpose): string {
  if (!isRandomPurpose(purpose))
    throw new Error("Der Zufallszweck ist ungültig.");
  return JSON.stringify(purpose);
}

/** Fixed-width binding to the exact private quote context retained in the receipt. */
export function randomContextFingerprint(
  parts: readonly (string | number)[],
): number {
  const source = JSON.stringify(parts);
  let value = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    value ^= source.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

export function isRandomHistory(
  counter: unknown,
  records: unknown,
  domain: RandomDomain,
): records is RandomDrawRecord[] {
  return (
    typeof counter === "number" &&
    Number.isSafeInteger(counter) &&
    counter >= 0 &&
    counter < Number.MAX_SAFE_INTEGER &&
    Array.isArray(records) &&
    records.length === counter &&
    records.every(
      (record, index) =>
        isRandomDrawRecord(record, domain) &&
        record.counter === index &&
        (domain === "engine" ||
          ("domain" in record && record.domain === "ai_turn_plan_selection")),
    )
  );
}
