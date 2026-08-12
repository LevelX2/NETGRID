import type { CardInstanceId, GameState } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { definitionFor, mustInstance } from "./card-server-lookup";
import { ensureSpecialZones, removeFromAllZones } from "./zone-mutation";

const MICROTECH_BACKUP_KIND =
  "replace_installed_program_trash_with_host_on_source";

export function isMicrotechBackupDrive(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return (
    state.runner.rig.hardware.includes(cardId) &&
    cardImplementationForDefinitionId(definitionFor(state, cardId).id)
      ?.runnerUtilityLongtail?.kind === MICROTECH_BACKUP_KIND
  );
}

export function installedMicrotechBackupDriveIds(
  state: GameState,
): CardInstanceId[] {
  return state.runner.rig.hardware
    .filter((cardId) => isMicrotechBackupDrive(state, cardId))
    .sort();
}

export function simultaneousInstalledProgramTrashIds(
  state: GameState,
  rootIds: CardInstanceId[],
): CardInstanceId[] {
  const result: CardInstanceId[] = [];
  const visit = (cardId: CardInstanceId): void => {
    if (result.includes(cardId)) return;
    if (
      state.runner.rig.programs.includes(cardId) &&
      definitionFor(state, cardId).type === "program"
    )
      result.push(cardId);
    Object.entries(state.cardInstances)
      .filter(([, instance]) => instance.hostedOn === cardId)
      .map(([hostedId]) => hostedId)
      .sort()
      .forEach(visit);
  };
  rootIds.forEach(visit);
  return result;
}

export function placeProgramsOnMicrotechBackupDrive(
  state: GameState,
  sourceCardId: CardInstanceId,
  programIdsBottomToTop: CardInstanceId[],
): void {
  if (!isMicrotechBackupDrive(state, sourceCardId))
    throw new Error("Microtech Backup Drive ist nicht mehr installiert.");
  const currentTopOrder = microtechHostedProgramIds(state, sourceCardId).reduce(
    (maximum, cardId) =>
      Math.max(
        maximum,
        Math.floor(state.cardInstances[cardId]?.microtechBackupOrder ?? 0),
      ),
    0,
  );
  programIdsBottomToTop.forEach((cardId, index) => {
    if (
      !state.runner.rig.programs.includes(cardId) ||
      definitionFor(state, cardId).type !== "program"
    )
      throw new Error(
        "Das gewählte Backup-Programm ist nicht mehr installiert.",
      );
    const instance = mustInstance(state.cardInstances, cardId);
    if (runnerProgramUsesMemory(state, cardId))
      state.runner.memoryUsed = Math.max(
        0,
        state.runner.memoryUsed - runnerProgramMemoryCost(state, cardId),
      );
    removeFromAllZones(state, cardId);
    ensureSpecialZones(state).setAside.push(cardId);
    const {
      hostedOn: _hostedOn,
      installedAsRunnerProgram: _installedAsRunnerProgram,
      microtechBackupOrder: _microtechBackupOrder,
      ...withoutInstallState
    } = instance;
    void _hostedOn;
    void _installedAsRunnerProgram;
    void _microtechBackupOrder;
    state.cardInstances[cardId] = {
      ...withoutInstallState,
      faceup: true,
      rezzed: true,
      zone: {
        side: "special",
        zone: "set_aside",
        visibility: "public",
        returnZone: { side: "runner", zone: "heap" },
      },
      hostedOn: sourceCardId,
      microtechBackupOrder: currentTopOrder + index + 1,
    };
  });
}

export function microtechHostedProgramIds(
  state: GameState,
  sourceCardId: CardInstanceId,
): CardInstanceId[] {
  return Object.entries(state.cardInstances)
    .filter(
      ([cardId, instance]) =>
        instance.hostedOn === sourceCardId &&
        definitionFor(state, cardId).type === "program",
    )
    .map(([cardId]) => cardId)
    .sort(
      (left, right) =>
        Math.floor(state.cardInstances[left]?.microtechBackupOrder ?? 0) -
          Math.floor(state.cardInstances[right]?.microtechBackupOrder ?? 0) ||
        left.localeCompare(right),
    );
}

export function trashMicrotechBackedProgram(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const instance = mustInstance(state.cardInstances, cardId);
  const {
    hostedOn: _hostedOn,
    microtechBackupOrder: _microtechBackupOrder,
    ...withoutBackupState
  } = instance;
  void _hostedOn;
  void _microtechBackupOrder;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...withoutBackupState,
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
}

function runnerProgramUsesMemory(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const hostId = mustInstance(state.cardInstances, cardId).hostedOn;
  if (!hostId) return true;
  const hostDefinition = definitionFor(state, hostId);
  return !(
    (hostDefinition.type === "program" &&
      hostDefinition.subtypes.some(
        (subtype) => subtype.toLowerCase() === "daemon",
      )) ||
    cardImplementationForDefinitionId(hostDefinition.id)?.runnerUtilityLongtail
      ?.kind === MICROTECH_BACKUP_KIND
  );
}

function runnerProgramMemoryCost(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const instance = mustInstance(state.cardInstances, cardId);
  return Math.max(
    0,
    Math.floor(
      instance.installedAsRunnerProgram?.memoryCost ??
        definitionFor(state, cardId).memoryCost ??
        0,
    ),
  );
}
