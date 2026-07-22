import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import {
  buildCorpIceDensityProfile,
  corpIcePlacementCandidateForAction,
} from "../corp-ice-placement/corp-ice-placement";
import {
  semanticRuntimeCorpCentralPressureAssessment,
  type CorpCentralServerId,
} from "../semantic-runtime-corp-central-pressure";
import type { CorpBoardTriage } from "../semantic-runtime-corp-board-triage";

const CORP_SAFE_DRAW_CAPACITY_VALUE = 100;
const CORP_LOW_HAND_VALUE = 450;
const CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE = 250;
const CORP_DRAW_VALUE_PER_CARD = 400;
const CORP_MULTI_DRAW_ACTION_EFFICIENCY_PER_EXTRA_CARD = 100;
const CORP_DRAW_OVERFLOW_PENALTY_PER_CARD = 100;

export type CorpOptionalDrawCapacity = {
  eligible: boolean;
  handCount: number;
  maxHandSize: number;
  projectedDrawCount: number;
  freeSlotsBefore: number;
  freeSlotsAfter: number;
};

export function corpOptionalDrawCapacity(
  input: AiDecisionInput,
  action: LegalAction,
): CorpOptionalDrawCapacity {
  const handCount = input.playerView.own.gripOrHq.length;
  const maxHandSize = Math.max(
    0,
    Math.floor(input.playerView.own.maxHandSize ?? 5),
  );
  const projectedDrawCount = corpProjectedDrawCount(action);
  const freeSlotsBefore = Math.max(0, maxHandSize - handCount);
  const freeSlotsAfter = freeSlotsBefore - projectedDrawCount;
  return {
    eligible: maxHandSize > 2 && projectedDrawCount > 0 && freeSlotsAfter >= 0,
    handCount,
    maxHandSize,
    projectedDrawCount,
    freeSlotsBefore,
    freeSlotsAfter,
  };
}

export function corpQuantitativeDrawScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent[] {
  const projectedDrawCount = corpProjectedDrawCount(action);
  if (projectedDrawCount <= 0) return [];
  const handCount = input.playerView.own.gripOrHq.length;
  const maxHandSize = Math.max(
    0,
    Math.floor(input.playerView.own.maxHandSize ?? 5),
  );
  const overflowCount = Math.max(
    0,
    handCount + projectedDrawCount - maxHandSize,
  );
  const evidence = [
    `projected_draw_count:${projectedDrawCount}`,
    `hand_count:${handCount}`,
    `max_hand_size:${maxHandSize}`,
    `projected_overflow_count:${overflowCount}`,
    `rd_count:${input.playerView.own.stackOrRdCount}`,
  ].join("|");
  return [
    {
      key: "corp_quantitative_draw_yield",
      label: "Quantitativer Kartenziehertrag",
      value:
        projectedDrawCount * CORP_DRAW_VALUE_PER_CARD +
        Math.max(0, projectedDrawCount - 1) *
          CORP_MULTI_DRAW_ACTION_EFFICIENCY_PER_EXTRA_CARD,
      reason: [
        evidence,
        `multi_draw_action_efficiency:${Math.max(0, projectedDrawCount - 1) * CORP_MULTI_DRAW_ACTION_EFFICIENCY_PER_EXTRA_CARD}`,
      ].join("|"),
    },
    ...(overflowCount > 0
      ? [
          {
            key: "corp_draw_overflow_penalty",
            label: "Projizierter Handüberlauf",
            value:
              -Math.min(6, overflowCount) * CORP_DRAW_OVERFLOW_PENALTY_PER_CARD,
            reason: evidence,
          },
        ]
      : []),
  ];
}

export function corpOptionalDrawScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  boardTriage?: CorpBoardTriage,
): AiDecisionScoreComponent[] {
  const capacity = corpOptionalDrawCapacity(input, action);
  if (
    !capacity.eligible ||
    corpOptionalDrawWouldDelayProtectedScoreRemote(boardTriage)
  ) {
    return [];
  }
  const evidence = corpOptionalDrawCapacityEvidence(capacity);
  const components: AiDecisionScoreComponent[] = [
    {
      key: "corp_safe_draw_capacity",
      label: "Sichere Draw-Kapazität",
      value: CORP_SAFE_DRAW_CAPACITY_VALUE,
      reason: evidence.join("|"),
    },
  ];
  if (capacity.freeSlotsAfter >= 1) {
    components.push({
      key: "corp_low_hand",
      label: "Handkarten-Bedarf",
      value: CORP_LOW_HAND_VALUE,
      reason: evidence.join("|"),
    });
  }
  const defensiveDraw = corpMissingConcreteDefenseDrawComponent(
    input,
    action,
    capacity,
  );
  if (defensiveDraw) components.push(defensiveDraw);
  return components;
}

function corpOptionalDrawWouldDelayProtectedScoreRemote(
  boardTriage: CorpBoardTriage | undefined,
): boolean {
  if (boardTriage?.primary !== "protect_score_remote") return false;
  if (boardTriage.severity !== "high" && boardTriage.severity !== "critical") {
    return false;
  }
  return boardTriage.scoreRemoteServerId?.startsWith("remote_") === true;
}

export function corpMissingConcreteDefenseDrawComponent(
  input: AiDecisionInput,
  action: LegalAction,
  capacity = corpOptionalDrawCapacity(input, action),
): AiDecisionScoreComponent | undefined {
  if (!capacity.eligible) return undefined;
  if (input.playerView.own.stackOrRdCount <= 1) return undefined;
  const deckDensity = buildCorpIceDensityProfile(input);
  if (deckDensity.remainingIceEstimate <= 0) return undefined;
  const target = corpMissingConcreteCentralDefenseTarget(input);
  if (!target) return undefined;
  return {
    key: "corp_missing_concrete_defense_draw",
    label: "Fehlende zentrale ICE-Verteidigung",
    value: CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE,
    reason: [
      `target_server:${target.serverId}`,
      `target_pressure_active:${target.pressureActive}`,
      `target_pressure:${target.pressure.toFixed(2)}`,
      "target_ice_count:0",
      "concrete_install_available:false",
      ...deckDensity.evidence,
      ...corpOptionalDrawCapacityEvidence(capacity),
    ].join("|"),
  };
}

function corpMissingConcreteCentralDefenseTarget(input: AiDecisionInput):
  | {
      serverId: CorpCentralServerId;
      pressureActive: boolean;
      pressure: number;
    }
  | undefined {
  return (["hq", "rd"] as const)
    .map((serverId) => {
      const server = input.playerView.servers.find(
        (candidate) => candidate.id === serverId,
      );
      const pressure = semanticRuntimeCorpCentralPressureAssessment(
        input,
        serverId,
      );
      return {
        serverId,
        iceCount: server?.ice.length ?? 0,
        pressureActive: pressure.active,
        pressure: pressure.pressure,
        concreteInstallAvailable: corpConcreteCentralIceInstallAvailable(
          input,
          serverId,
        ),
      };
    })
    .filter(
      (candidate) =>
        candidate.iceCount === 0 && !candidate.concreteInstallAvailable,
    )
    .sort((left, right) => {
      if (left.pressureActive !== right.pressureActive) {
        return left.pressureActive ? -1 : 1;
      }
      if (left.pressure !== right.pressure) {
        return right.pressure - left.pressure;
      }
      return left.serverId === "rd" ? -1 : 1;
    })[0];
}

function corpConcreteCentralIceInstallAvailable(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return input.legalActions.some((action) => {
    if (
      action.type !== "install_card" ||
      action.payload?.placement !== "ice" ||
      corpActionServerId(action) !== serverId
    ) {
      return false;
    }
    const placement = corpIcePlacementCandidateForAction({
      input,
      action,
      serverId,
      server,
    });
    return (
      placement?.recommendation === "install_now" &&
      !placement.visibleZeroEffectRisk
    );
  });
}

function corpActionServerId(action: LegalAction): string | undefined {
  const value =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof value === "string" ? value : undefined;
}

export function corpProjectedDrawCount(action: LegalAction): number {
  for (const key of ["drawCardsAmount", "drawAmount", "drawCount"] as const) {
    const value = action.payload?.[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.max(1, Math.floor(value));
    }
  }
  return action.type === "draw_card" ? 1 : 0;
}

function corpOptionalDrawCapacityEvidence(
  capacity: CorpOptionalDrawCapacity,
): string[] {
  return [
    `hand_count:${capacity.handCount}`,
    `max_hand_size:${capacity.maxHandSize}`,
    `projected_draw_count:${capacity.projectedDrawCount}`,
    `free_slots_before:${capacity.freeSlotsBefore}`,
    `free_slots_after:${capacity.freeSlotsAfter}`,
  ];
}
