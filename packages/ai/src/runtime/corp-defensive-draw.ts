import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import {
  buildCorpIceDensityProfile,
  corpIcePlacementCandidateForAction,
} from "./corp-ice-placement/corp-ice-placement";
import {
  semanticRuntimeCorpCentralPressureAssessment,
  type CorpCentralServerId,
} from "./semantic-runtime-corp-central-pressure";

const CORP_SAFE_DRAW_CAPACITY_VALUE = 100;
const CORP_LOW_HAND_VALUE = 450;
const CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE = 250;

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
  const projectedDrawCount = corpOptionalDrawCount(action);
  const freeSlotsBefore = Math.max(0, maxHandSize - handCount);
  const freeSlotsAfter = freeSlotsBefore - projectedDrawCount;
  return {
    eligible:
      action.type === "draw_card" &&
      maxHandSize > 2 &&
      projectedDrawCount > 0 &&
      freeSlotsAfter >= 0,
    handCount,
    maxHandSize,
    projectedDrawCount,
    freeSlotsBefore,
    freeSlotsAfter,
  };
}

export function corpOptionalDrawScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent[] {
  const capacity = corpOptionalDrawCapacity(input, action);
  if (!capacity.eligible) return [];
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

function corpOptionalDrawCount(action: LegalAction): number {
  if (action.type !== "draw_card") return 0;
  for (const key of ["drawCardsAmount", "drawAmount", "drawCount"] as const) {
    const value = action.payload?.[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.max(1, Math.floor(value));
    }
  }
  return 1;
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
