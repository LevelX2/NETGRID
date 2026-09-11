import { type AiDecisionInput } from "@netgrid/shared";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type PlanSchedulerResult } from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { turnKey } from "../../runtime/runtime-identifiers";
import { corpDefenseSignalOwnsAction } from "./defense-discovery-support";

export function bindSelectedCorpDefenseDrawAttempt(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.portfolio.executorInstanceId === undefined
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signals?: CorpDefenseSignal[] }
    | undefined;
  if (!executor || moduleState?.kind !== "defense" || !moduleState.signals) {
    return;
  }
  const selectedSignal = moduleState.signals.find(
    (signal) =>
      signal.phase === "draw_for_ice" &&
      corpDefenseSignalOwnsAction(signal, result.route.head.actionId),
  );
  if (
    !selectedSignal ||
    (selectedSignal.kind !== "generic" &&
      selectedSignal.kind !== "score_protection_draw")
  ) {
    return;
  }
  selectedSignal.drawAttemptState = {
    turnKey: turnKey(input),
    remainingAttempts: 0,
    selectedAtStateVersion: input.playerView.stateVersion,
  };
}

export function bindSelectedCorpDefenseHqHold(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.portfolio.executorInstanceId === undefined
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signals?: CorpDefenseSignal[];
        centralAllocation?: CorpCorePlanDomain["centralDefenseAllocation"];
        hqHoldCadence?: CorpCorePlanDomain["centralDefenseHqHoldCadence"];
        hqHoldSelection?: CorpCorePlanDomain["centralDefenseHqHoldSelection"];
      }
    | undefined;
  if (
    !executor ||
    moduleState?.kind !== "defense" ||
    !moduleState.signals ||
    moduleState.centralAllocation?.status !== "known" ||
    moduleState.centralAllocation.hqHold.status !== "eligible_once"
  ) {
    return;
  }
  if (result.engineRandomizedIceInstallNearTie !== undefined) {
    return;
  }
  const selectedSignal = moduleState.signals.find(
    (signal) =>
      signal.kind === "generic" &&
      signal.phase === "install_ice" &&
      signal.serverId === "rd" &&
      corpDefenseSignalOwnsAction(signal, result.route.head.actionId),
  );
  if (!selectedSignal) return;
  const cadence = moduleState.hqHoldCadence;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const exactBinding =
    cadence?.status === "available" &&
    cadence.receiptId === moduleState.centralAllocation.hqHold.receiptId &&
    cadence.turnKey === turnKey(input) &&
    cadence.factsStateVersion === input.playerView.stateVersion &&
    selectedAction?.type === "install_card" &&
    selectedAction.payload?.placement === "ice" &&
    selectedAction.payload.serverId === "rd" &&
    typeof selectedAction.payload.cardId === "string" &&
    selectedAction.payload.cardId.length > 0;
  if (!exactBinding) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "plan_registry",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "A selected HQ-hold route must bind one available resident receipt and an exact current R&D ICE-install LegalAction before the receipt is consumed.",
    });
  }
  moduleState.hqHoldCadence = {
    status: "consumed",
    receiptId: cadence.receiptId,
    turnKey: cadence.turnKey,
    factsStateVersion: input.playerView.stateVersion,
  };
  moduleState.hqHoldSelection = {
    selectedActionId: result.route.head.actionId,
    sourceCardInstanceId: selectedAction.payload!.cardId as string,
    selectedAtStateVersion: input.playerView.stateVersion,
    targetServerId: "rd",
  };
}

export function corpResidentDefenseDrawAttempt(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
):
  | {
      serverId: string;
      selectedAtStateVersion: number;
    }
  | undefined {
  const currentTurnKey = turnKey(input);
  for (const instance of previous?.instances ?? []) {
    if (instance.moduleId !== "corp.defend_servers") continue;
    const moduleState = instance.moduleState as
      | { kind?: unknown; signals?: CorpDefenseSignal[] }
      | undefined;
    if (moduleState?.kind !== "defense") continue;
    for (const signal of moduleState.signals ?? []) {
      const attempt = (
        signal as CorpDefenseSignal & {
          drawAttemptState?: {
            turnKey?: unknown;
            remainingAttempts?: unknown;
            selectedAtStateVersion?: unknown;
          };
        }
      ).drawAttemptState;
      if (attempt !== undefined) {
        const turnKeyMatch =
          typeof attempt.turnKey === "string"
            ? /^corp:(0|[1-9]\d*)$/.exec(attempt.turnKey)
            : null;
        const turnNumber = turnKeyMatch ? Number(turnKeyMatch[1]) : Number.NaN;
        const validTurnKey =
          turnKeyMatch !== null &&
          Number.isSafeInteger(turnNumber) &&
          turnNumber >= 0;
        const validRemainingAttempts =
          attempt.remainingAttempts === 0 || attempt.remainingAttempts === 1;
        const validSelectedState =
          attempt.remainingAttempts === 0
            ? Number.isSafeInteger(attempt.selectedAtStateVersion) &&
              (attempt.selectedAtStateVersion as number) >= 0 &&
              (attempt.selectedAtStateVersion as number) <=
                previous!.stateVersion
            : attempt.selectedAtStateVersion === undefined;
        if (
          signal.phase !== "draw_for_ice" ||
          !validTurnKey ||
          !validRemainingAttempts ||
          !validSelectedState
        ) {
          throw new PlanResolutionFailure("invalid_plan_identity", {
            side: input.side,
            stateVersion: input.playerView.stateVersion,
            timingPoint: input.playerView.timingPoint ?? "corp_action.main",
            legalActionTypes: input.legalActions.map((action) => action.type),
            owner: "plan_registry",
            planInstanceId: instance.instanceId,
            removalCondition:
              "A resident Corp defense draw receipt must bind draw_for_ice to corp:<safe non-negative integer>, remainingAttempts 0 or 1, and an exact finite non-negative selected state only after the attempt was consumed.",
          });
        }
      }
      if (
        signal.phase !== "draw_for_ice" ||
        attempt?.turnKey !== currentTurnKey ||
        attempt.remainingAttempts !== 0 ||
        input.playerView.stateVersion <=
          (attempt.selectedAtStateVersion as number)
      ) {
        continue;
      }
      return {
        serverId: signal.serverId,
        selectedAtStateVersion: attempt.selectedAtStateVersion as number,
      };
    }
  }
  return undefined;
}

export function corpResidentCentralDefenseHqHoldState(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
): {
  cadence: NonNullable<CorpCorePlanDomain["centralDefenseHqHoldCadence"]>;
  selection?: NonNullable<CorpCorePlanDomain["centralDefenseHqHoldSelection"]>;
} {
  const fresh = (
    receiptId = "corp-central-hq-hold:server-defense-portfolio",
  ): {
    cadence: NonNullable<CorpCorePlanDomain["centralDefenseHqHoldCadence"]>;
  } => ({
    cadence: {
      status: "available",
      receiptId,
      turnKey: turnKey(input),
      factsStateVersion: input.playerView.stateVersion,
    },
  });
  const instance = previous?.instances.find(
    (candidate) => candidate.moduleId === "corp.defend_servers",
  );
  if (!instance) return fresh();
  const moduleState = instance.moduleState as
    | {
        kind?: unknown;
        hqHoldCadence?: {
          status?: unknown;
          receiptId?: unknown;
          turnKey?: unknown;
          factsStateVersion?: unknown;
        };
        hqHoldSelection?: {
          selectedActionId?: unknown;
          sourceCardInstanceId?: unknown;
          selectedAtStateVersion?: unknown;
          targetServerId?: unknown;
        };
      }
    | undefined;
  const cadence = moduleState?.hqHoldCadence;
  const selection = moduleState?.hqHoldSelection;
  if (moduleState?.kind !== "defense" || cadence === undefined) return fresh();
  const turnKeyMatch =
    typeof cadence.turnKey === "string"
      ? /^corp:(0|[1-9]\d*)$/.exec(cadence.turnKey)
      : null;
  const cadenceValid =
    (cadence.status === "available" || cadence.status === "consumed") &&
    typeof cadence.receiptId === "string" &&
    cadence.receiptId.length > 0 &&
    turnKeyMatch !== null &&
    Number.isSafeInteger(Number(turnKeyMatch[1])) &&
    Number.isSafeInteger(cadence.factsStateVersion) &&
    (cadence.factsStateVersion as number) >= 0 &&
    (cadence.factsStateVersion as number) <= previous!.stateVersion;
  const availableValid =
    cadence.status !== "available" || selection === undefined;
  const consumedValid =
    cadence.status !== "consumed" ||
    (typeof selection?.selectedActionId === "string" &&
      selection.selectedActionId.length > 0 &&
      typeof selection.sourceCardInstanceId === "string" &&
      selection.sourceCardInstanceId.length > 0 &&
      selection.targetServerId === "rd" &&
      Number.isSafeInteger(selection.selectedAtStateVersion) &&
      selection.selectedAtStateVersion === cadence.factsStateVersion);
  if (!cadenceValid || !availableValid || !consumedValid) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: instance.instanceId,
      removalCondition:
        "Resident HQ-hold cadence must be one exact available receipt at the portfolio state or one consumed receipt with its exact R&D ICE-install selection.",
    });
  }
  if (cadence.turnKey !== turnKey(input)) {
    return fresh(cadence.receiptId as string);
  }
  if (cadence.status === "available") {
    return fresh(cadence.receiptId as string);
  }
  const selectedAtStateVersion = selection!.selectedAtStateVersion as number;
  if (input.playerView.stateVersion < selectedAtStateVersion) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: instance.instanceId,
      removalCondition:
        "A consumed HQ-hold receipt cannot be observed before its selected state.",
    });
  }
  if (input.playerView.stateVersion > selectedAtStateVersion) {
    const applied =
      input.playerView.servers
        .find((server) => server.id === "rd")
        ?.ice.some(
          (ice) => ice.instanceId === selection!.sourceCardInstanceId,
        ) === true;
    if (!applied) {
      throw new PlanResolutionFailure("invalid_plan_identity", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        owner: "plan_registry",
        planInstanceId: instance.instanceId,
        removalCondition:
          "A consumed HQ-hold receipt must be followed by its exact selected Corp card appearing as ICE on R&D.",
      });
    }
  }
  return {
    cadence: {
      status: "consumed",
      receiptId: cadence.receiptId as string,
      turnKey: cadence.turnKey as string,
      factsStateVersion: cadence.factsStateVersion as number,
    },
    selection: {
      selectedActionId: selection!.selectedActionId as string,
      sourceCardInstanceId: selection!.sourceCardInstanceId as string,
      selectedAtStateVersion,
      targetServerId: "rd",
    },
  };
}
