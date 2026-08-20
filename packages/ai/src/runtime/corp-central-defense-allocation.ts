/**
 * Pure, fail-closed central-defense allocation contract.
 *
 * This module deliberately knows nothing about card costs, rez costs, or random
 * state.  Callers must provide the complete, engine-derived access facts.  Its
 * result is a deterministic priority and, for an exact tie, a canonical
 * candidate set that a later atomic Engine random decision may consume.
 */

export type CorpCentralDefenseServerId = "hq" | "rd";

export type CorpCentralDefenseThreat =
  | "none"
  | "material"
  | "acute"
  | "terminal";

export interface CorpCentralDefenseFraction {
  readonly numerator: number;
  readonly denominator: number;
}

export interface CorpCentralDefenseAccessFacts {
  /** Exact probability that the Runner completes this access. */
  readonly successfulAccessProbability: CorpCentralDefenseFraction;
  /** Number of distinct cards the access can expose, before population capping. */
  readonly accessibleCardCount: number;
  /** Explicit so an omitted multiaccess fact cannot silently become false. */
  readonly isMultiaccess: boolean;
  /** Side-safe pressure history; the adapter owns the bounded recency window. */
  readonly recentRunOrAccessEvents: number;
  readonly recentSuccessfulAccessRunnerTurns: number;
  /** Every active server-bound access effect, identified by its Engine fact id. */
  readonly serverBoundEffectIds: readonly string[];
}

export interface CorpCentralDefenseCardFacts {
  /** Complete population from which this central access samples. */
  readonly populationCardCount: number;
  readonly agendaCardCount: number;
  readonly agendaPointValue: number;
  /** Strategically classified cards, never inferred from printed trash cost. */
  readonly importantTrashableCardCount: number;
}

export interface CorpCentralDefenseFacts {
  readonly serverId: CorpCentralDefenseServerId;
  readonly factsKnown: boolean;
  readonly threat: CorpCentralDefenseThreat;
  readonly access: CorpCentralDefenseAccessFacts;
  readonly cards: CorpCentralDefenseCardFacts;
}

/** Plan-memory cadence for the one-use HQ hold. */
export interface CorpCentralDefenseHqHoldCadence {
  readonly status: "available" | "consumed";
  readonly receiptId: string;
  readonly turnKey: string;
  readonly factsStateVersion: number;
}

export interface CorpCentralDefenseAllocationInput {
  readonly observedAtStateVersion: number;
  readonly turnKey: string;
  readonly hq: CorpCentralDefenseFacts;
  readonly rd: CorpCentralDefenseFacts;
  readonly hqHoldCadence?: CorpCentralDefenseHqHoldCadence;
}

export interface CorpCentralDefenseAllocationEvidence {
  readonly threat: CorpCentralDefenseThreat;
  readonly expectedAgendaLoss: CorpCentralDefenseFraction;
  readonly expectedTrashableLoss: CorpCentralDefenseFraction;
  readonly accessibleCardCount: number;
  readonly isMultiaccess: boolean;
  readonly recentRunOrAccessEvents: number;
  readonly recentSuccessfulAccessRunnerTurns: number;
  readonly serverBoundEffectIds: readonly string[];
}

export type CorpCentralDefenseAllocation =
  | {
      readonly status: "unknown";
      readonly reason: "incomplete_or_invalid_facts";
    }
  | {
      readonly status: "known";
      readonly selectedServerId: CorpCentralDefenseServerId;
      readonly evidence: Readonly<
        Record<CorpCentralDefenseServerId, CorpCentralDefenseAllocationEvidence>
      >;
      /** A later Engine random contract may choose only from this sorted set. */
      readonly canonicalNearTieCandidateServerIds: readonly CorpCentralDefenseServerId[];
      readonly hqHold:
        | {
            readonly status: "eligible_once";
            readonly receiptId: string;
          }
        | {
            readonly status: "consumed";
            readonly receiptId: string;
          }
        | {
            readonly status: "ineligible";
          };
    };

export function corpCentralDefenseHqAgendaExposureIsDeadline(
  allocation: CorpCentralDefenseAllocation | undefined,
): boolean {
  if (allocation?.status !== "known") return false;
  const hq = allocation.evidence.hq;
  return (
    hq.expectedAgendaLoss.numerator > 0 &&
    (hq.recentSuccessfulAccessRunnerTurns > 0 ||
      hq.recentRunOrAccessEvents >= 2)
  );
}

interface Fraction {
  readonly numerator: bigint;
  readonly denominator: bigint;
}

const SERVER_ORDER: readonly CorpCentralDefenseServerId[] = ["hq", "rd"];
const THREAT_RANK: Readonly<Record<CorpCentralDefenseThreat, number>> = {
  none: 0,
  material: 1,
  acute: 2,
  terminal: 3,
};

function isSafeWhole(value: number, minimum = 0): boolean {
  return Number.isSafeInteger(value) && value >= minimum;
}

function toFraction(value: CorpCentralDefenseFraction): Fraction | undefined {
  if (
    !isSafeWhole(value.numerator) ||
    !isSafeWhole(value.denominator, 1) ||
    value.numerator > value.denominator
  ) {
    return undefined;
  }
  return {
    numerator: BigInt(value.numerator),
    denominator: BigInt(value.denominator),
  };
}

function multiply(left: Fraction, right: Fraction): Fraction {
  return {
    numerator: left.numerator * right.numerator,
    denominator: left.denominator * right.denominator,
  };
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let currentLeft = left < 0n ? -left : left;
  let currentRight = right < 0n ? -right : right;
  while (currentRight !== 0n) {
    const remainder = currentLeft % currentRight;
    currentLeft = currentRight;
    currentRight = remainder;
  }
  return currentLeft === 0n ? 1n : currentLeft;
}

function reduced(value: Fraction): Fraction {
  const divisor = greatestCommonDivisor(value.numerator, value.denominator);
  return {
    numerator: value.numerator / divisor,
    denominator: value.denominator / divisor,
  };
}

function compare(left: Fraction, right: Fraction): number {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference === 0n ? 0 : difference > 0n ? 1 : -1;
}

function publicFraction(
  value: Fraction,
): CorpCentralDefenseFraction | undefined {
  const normalized = reduced(value);
  if (
    normalized.numerator > BigInt(Number.MAX_SAFE_INTEGER) ||
    normalized.denominator > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return undefined;
  }
  return {
    numerator: Number(normalized.numerator),
    denominator: Number(normalized.denominator),
  };
}

function isValidFacts(facts: CorpCentralDefenseFacts): boolean {
  if (!facts.factsKnown || !SERVER_ORDER.includes(facts.serverId)) return false;
  if (!(facts.threat in THREAT_RANK)) return false;
  const { access, cards } = facts;
  if (!toFraction(access.successfulAccessProbability)) return false;
  if (
    !isSafeWhole(access.accessibleCardCount, 1) ||
    typeof access.isMultiaccess !== "boolean" ||
    !isSafeWhole(access.recentRunOrAccessEvents) ||
    !isSafeWhole(access.recentSuccessfulAccessRunnerTurns) ||
    access.recentSuccessfulAccessRunnerTurns > 3 ||
    !Array.isArray(access.serverBoundEffectIds) ||
    !access.serverBoundEffectIds.every(
      (effectId) => typeof effectId === "string" && effectId.length > 0,
    )
  )
    return false;
  if (
    !isSafeWhole(cards.populationCardCount, 1) ||
    !isSafeWhole(cards.agendaCardCount) ||
    !isSafeWhole(cards.agendaPointValue) ||
    !isSafeWhole(cards.importantTrashableCardCount)
  )
    return false;
  return (
    cards.agendaCardCount <= cards.populationCardCount &&
    cards.importantTrashableCardCount <=
      cards.populationCardCount - cards.agendaCardCount
  );
}

function expectedLoss(
  facts: CorpCentralDefenseFacts,
  lossValue: number,
): Fraction {
  const probability = toFraction(facts.access.successfulAccessProbability)!;
  const exposed = Math.min(
    facts.access.accessibleCardCount,
    facts.cards.populationCardCount,
  );
  return multiply(probability, {
    numerator: BigInt(exposed) * BigInt(lossValue),
    denominator: BigInt(facts.cards.populationCardCount),
  });
}

function evidenceFor(
  facts: CorpCentralDefenseFacts,
): CorpCentralDefenseAllocationEvidence | undefined {
  const expectedAgendaLoss = publicFraction(
    expectedLoss(facts, facts.cards.agendaPointValue),
  );
  const expectedTrashableLoss = publicFraction(
    expectedLoss(facts, facts.cards.importantTrashableCardCount),
  );
  if (!expectedAgendaLoss || !expectedTrashableLoss) return undefined;
  return {
    threat: facts.threat,
    expectedAgendaLoss,
    expectedTrashableLoss,
    accessibleCardCount: Math.min(
      facts.access.accessibleCardCount,
      facts.cards.populationCardCount,
    ),
    isMultiaccess: facts.access.isMultiaccess,
    recentRunOrAccessEvents: facts.access.recentRunOrAccessEvents,
    recentSuccessfulAccessRunnerTurns:
      facts.access.recentSuccessfulAccessRunnerTurns,
    serverBoundEffectIds: [...facts.access.serverBoundEffectIds].sort(),
  };
}

function compareFacts(
  left: CorpCentralDefenseFacts,
  right: CorpCentralDefenseFacts,
): number {
  const terminal =
    Number(left.threat === "terminal") - Number(right.threat === "terminal");
  if (terminal !== 0) return terminal > 0 ? 1 : -1;
  const agenda = compare(
    expectedLoss(left, left.cards.agendaPointValue),
    expectedLoss(right, right.cards.agendaPointValue),
  );
  if (agenda !== 0) return agenda;
  const trash = compare(
    expectedLoss(left, left.cards.importantTrashableCardCount),
    expectedLoss(right, right.cards.importantTrashableCardCount),
  );
  if (trash !== 0) return trash;
  if (left.access.isMultiaccess !== right.access.isMultiaccess)
    return left.access.isMultiaccess ? 1 : -1;
  const accessCount =
    Math.min(left.access.accessibleCardCount, left.cards.populationCardCount) -
    Math.min(right.access.accessibleCardCount, right.cards.populationCardCount);
  if (accessCount !== 0) return accessCount > 0 ? 1 : -1;
  const successfulTurns =
    left.access.recentSuccessfulAccessRunnerTurns -
    right.access.recentSuccessfulAccessRunnerTurns;
  if (successfulTurns !== 0) return successfulTurns > 0 ? 1 : -1;
  const recentPressure =
    left.access.recentRunOrAccessEvents - right.access.recentRunOrAccessEvents;
  if (recentPressure !== 0) return recentPressure > 0 ? 1 : -1;
  const serverEffects =
    left.access.serverBoundEffectIds.length -
    right.access.serverBoundEffectIds.length;
  return serverEffects === 0 ? 0 : serverEffects > 0 ? 1 : -1;
}

function lossesAreNear(left: Fraction, right: Fraction): boolean {
  const ordering = compare(left, right);
  if (ordering === 0) return true;
  const smaller = ordering < 0 ? left : right;
  const larger = ordering < 0 ? right : left;
  if (smaller.numerator === 0n || larger.numerator === 0n) return false;
  // Exact policy band: the weaker loss projection must be at least 80% of
  // the stronger one. This is a ratio contract, never an additive score.
  return (
    smaller.numerator * larger.denominator * 5n >=
    larger.numerator * smaller.denominator * 4n
  );
}

function areNearTieFacts(
  left: CorpCentralDefenseFacts,
  right: CorpCentralDefenseFacts,
): boolean {
  if (
    (left.threat === "terminal") !== (right.threat === "terminal") ||
    !lossesAreNear(
      expectedLoss(left, left.cards.agendaPointValue),
      expectedLoss(right, right.cards.agendaPointValue),
    ) ||
    !lossesAreNear(
      expectedLoss(left, left.cards.importantTrashableCardCount),
      expectedLoss(right, right.cards.importantTrashableCardCount),
    )
  ) {
    return false;
  }
  const leftAccessCount = Math.min(
    left.access.accessibleCardCount,
    left.cards.populationCardCount,
  );
  const rightAccessCount = Math.min(
    right.access.accessibleCardCount,
    right.cards.populationCardCount,
  );
  return (
    Math.abs(leftAccessCount - rightAccessCount) <= 1 &&
    Math.abs(
      left.access.recentSuccessfulAccessRunnerTurns -
        right.access.recentSuccessfulAccessRunnerTurns,
    ) <= 1 &&
    Math.abs(
      left.access.serverBoundEffectIds.length -
        right.access.serverBoundEffectIds.length,
    ) <= 1
  );
}

function allowsBoundedHqBluff(
  input: CorpCentralDefenseAllocationInput,
  hq: CorpCentralDefenseFacts,
  rd: CorpCentralDefenseFacts,
  comparison: number,
): boolean {
  const cadence = input.hqHoldCadence;
  if (
    !cadence ||
    cadence.status !== "available" ||
    cadence.receiptId.length === 0 ||
    cadence.turnKey !== input.turnKey ||
    cadence.factsStateVersion !== input.observedAtStateVersion
  )
    return false;
  const nonAgendas = hq.cards.populationCardCount - hq.cards.agendaCardCount;
  const rdFocus =
    rd.access.isMultiaccess ||
    rd.access.serverBoundEffectIds.length > 0 ||
    rd.access.recentSuccessfulAccessRunnerTurns >
      hq.access.recentSuccessfulAccessRunnerTurns;
  return (
    comparison < 0 &&
    rdFocus &&
    hq.cards.populationCardCount === 5 &&
    hq.cards.agendaCardCount === 1 &&
    nonAgendas === 4 &&
    hq.cards.importantTrashableCardCount === 0 &&
    (hq.threat === "none" || hq.threat === "material") &&
    !hq.access.isMultiaccess &&
    hq.access.serverBoundEffectIds.length === 0
  );
}

export function allocateCorpCentralDefense(
  input: CorpCentralDefenseAllocationInput,
): CorpCentralDefenseAllocation {
  const { hq, rd } = input;
  const cadence = input.hqHoldCadence;
  if (
    !isSafeWhole(input.observedAtStateVersion) ||
    typeof input.turnKey !== "string" ||
    input.turnKey.length === 0 ||
    !isValidFacts(hq) ||
    !isValidFacts(rd) ||
    hq.serverId !== "hq" ||
    rd.serverId !== "rd" ||
    (cadence !== undefined &&
      (!(cadence.status === "available" || cadence.status === "consumed") ||
        cadence.receiptId.length === 0 ||
        cadence.turnKey.length === 0 ||
        !isSafeWhole(cadence.factsStateVersion) ||
        cadence.factsStateVersion > input.observedAtStateVersion ||
        (cadence.status === "available" &&
          (cadence.turnKey !== input.turnKey ||
            cadence.factsStateVersion !== input.observedAtStateVersion))))
  ) {
    return { status: "unknown", reason: "incomplete_or_invalid_facts" };
  }

  const comparison = compareFacts(hq, rd);
  const selectedServerId: CorpCentralDefenseServerId =
    comparison >= 0 ? "hq" : "rd";
  const hqEvidence = evidenceFor(hq);
  const rdEvidence = evidenceFor(rd);
  if (!hqEvidence || !rdEvidence) {
    return { status: "unknown", reason: "incomplete_or_invalid_facts" };
  }
  const evidence = { hq: hqEvidence, rd: rdEvidence };
  const hqHold =
    cadence?.status === "consumed"
      ? { status: "consumed" as const, receiptId: cadence.receiptId }
      : allowsBoundedHqBluff(input, hq, rd, comparison) && cadence
        ? { status: "eligible_once" as const, receiptId: cadence.receiptId }
        : { status: "ineligible" as const };
  const canonicalNearTieCandidateServerIds: readonly CorpCentralDefenseServerId[] =
    areNearTieFacts(hq, rd) ? SERVER_ORDER : [];
  return {
    status: "known",
    selectedServerId,
    evidence,
    canonicalNearTieCandidateServerIds,
    hqHold,
  };
}
