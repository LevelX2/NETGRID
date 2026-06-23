import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";

export type RunFortTriggerExecutionHost = {
  state: GameState;
  actions: {
    spendClick: (state: GameState, side: Side) => void;
  };
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    mustInstance: (
      source: Record<CardInstanceId, CardInstance>,
      cardId: CardInstanceId,
    ) => CardInstance;
  };
  zones: {
    removeFromAllZones: (state: GameState, cardId: CardInstanceId) => void;
  };
  run: {
    resolveSuccessfulRunFollowupAbility: (legalAction: LegalAction) => {
      handled: boolean;
    };
    resolveFullyBrokenPassedIceDerezAndEndRun: (
      legalAction: LegalAction,
    ) => void;
    resolveFullyBrokenPassedIceTrash: (legalAction: LegalAction) => void;
    resolveFortPassAdvancementWindow: (legalAction: LegalAction) => void;
    resolveStartRunIceRepositionWindow: (legalAction: LegalAction) => void;
    resolveApproachIceExposeAbility: (legalAction: LegalAction) => void;
    resolveApproachIceExposeViewingDecision: (
      legalAction: LegalAction,
    ) => void;
    startSingaporeCityGridSwapChoice: (legalAction: LegalAction) => void;
  };
  constants: {
    MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID: string;
  };
};

export type RunFortTriggerExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
};

export function handleRunFortTriggerExecution(
  host: RunFortTriggerExecutionHost,
  legalAction: LegalAction,
): RunFortTriggerExecutionResult {
  if (legalAction.type !== "trigger_ability") return { handled: false };

  if (host.run.resolveSuccessfulRunFollowupAbility(legalAction).handled)
    return handled(legalAction);
  if (
    legalAction.payload?.runnerUtilityAbility ===
    "derez_fully_broken_passed_ice_and_end_run"
  ) {
    host.run.resolveFullyBrokenPassedIceDerezAndEndRun(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.runnerUtilityAbility ===
    "trash_fully_broken_passed_ice"
  ) {
    host.run.resolveFullyBrokenPassedIceTrash(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1922RunnerHardwareAbility ===
    "return_top_hosted_program"
  ) {
    resolveTopHostedProgramReturn(host, legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.fortRunWindowAbility ===
    "add_advancement_counters_after_passing_last_ice_on_this_fort"
  ) {
    host.run.resolveFortPassAdvancementWindow(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.fortRunWindowAbility ===
    "move_self_to_different_position_on_same_fort"
  ) {
    host.run.resolveStartRunIceRepositionWindow(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.approachIceExposeDecision) {
    host.run.resolveApproachIceExposeAbility(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.approachIceExposeViewDecision) {
    host.run.resolveApproachIceExposeViewingDecision(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1918UpgradeAbility ===
    "singapore_city_grid_hq_ice_swap"
  ) {
    host.run.startSingaporeCityGridSwapChoice(legalAction);
    return handled(legalAction);
  }

  return { handled: false };
}

export function hostedProgramIdsOnHardware(
  host: Pick<RunFortTriggerExecutionHost, "state" | "cards">,
  hostId: CardInstanceId,
): CardInstanceId[] {
  return hostedCardsOn(host.state, hostId)
    .filter((cardId) => host.cards.definitionFor(host.state, cardId).type === "program")
    .sort();
}

export function topHostedProgramOnHardware(
  host: Pick<RunFortTriggerExecutionHost, "state" | "cards">,
  hostId: CardInstanceId,
): CardInstanceId | undefined {
  return hostedProgramIdsOnHardware(host, hostId).at(-1);
}

function resolveTopHostedProgramReturn(
  host: RunFortTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Microtech Backup Drive nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.hardware.includes(sourceCardId))
    throw new Error("Microtech Backup Drive ist nicht installiert.");
  if (
    host.cards.definitionFor(state, sourceCardId).id !==
    host.constants.MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID
  )
    throw new Error("Die Microtech-Backup-Drive-Faehigkeit passt nicht zur Karte.");
  const targetProgramId = String(legalAction.payload?.targetProgramId ?? "");
  const topHostedId = topHostedProgramOnHardware(host, sourceCardId);
  if (!targetProgramId || targetProgramId !== topHostedId)
    throw new Error("Nur das oberste Microtech-Programm darf genommen werden.");
  const targetDefinitionId = host.cards.definitionFor(state, targetProgramId).id;
  host.actions.spendClick(state, "runner");
  host.zones.removeFromAllZones(state, targetProgramId);
  state.runner.grip.push(targetProgramId);
  const instance = host.cards.mustInstance(state.cardInstances, targetProgramId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  state.cardInstances[targetProgramId] = {
    ...withoutHost,
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "grip" },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerHardwareAbility: "return_top_hosted_program",
    sourceDefinitionId:
      host.constants.MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
    returnedCardDefinitionId: targetDefinitionId,
    returnedToGrip: true,
    hostedProgramCountAfter: hostedProgramIdsOnHardware(host, sourceCardId)
      .length,
  };
}

function hostedCardsOn(
  state: GameState,
  hostId: CardInstanceId,
): CardInstanceId[] {
  return Object.entries(state.cardInstances)
    .filter(([, instance]) => instance.hostedOn === hostId)
    .map(([cardId]) => cardId as CardInstanceId)
    .sort();
}

function handled(legalAction: LegalAction): RunFortTriggerExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
