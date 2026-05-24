import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { FreeProgramInstallExecutionResult } from "./free-program-install-execution";
import {
  applyMysteryBoxOncePerRunPlan,
  applyMysteryBoxSourceTrashPlan,
  applySneakPreviewTemporaryReturnPlan,
  createMysteryBoxOncePerRunPlan,
  createMysteryBoxPostInstallSideEffectPlan,
  createSneakPreviewPostInstallSideEffectPlan,
} from "./post-install-side-effects";

const selectedProgramId = "selected_program" as CardInstanceId;
const installedProgramId = "installed_program" as CardInstanceId;
const sourceCardId = "source_card" as CardInstanceId;
const sourceDefinitionId = "source_definition" as CardDefinitionId;

function execution(
  overrides: Partial<FreeProgramInstallExecutionResult> = {},
): FreeProgramInstallExecutionResult {
  return {
    selectedProgramId,
    installedProgramId,
    sourceZone: "stack",
    sourceCardId,
    freeInstall: true,
    temporaryReturnNeeded: false,
    sourceTrashNeeded: false,
    shuffleNeeded: true,
    ...overrides,
  };
}

describe("hidden-zone post-install side effects", () => {
  it("plans and records Sneak Preview temporary return", () => {
    const plan = createSneakPreviewPostInstallSideEffectPlan({
      execution: execution({
        temporaryReturnNeeded: true,
        sourceTrashNeeded: false,
      }),
      sourceCardDefinitionId: sourceDefinitionId,
    });
    const records: unknown[] = [];
    const result = applySneakPreviewTemporaryReturnPlan(plan, {
      recordTemporaryReturn: (record) => records.push(record),
    });

    expect(plan).toMatchObject({
      kind: "sneak_preview",
      installedProgramId,
      selectedProgramId,
      temporaryReturnNeeded: true,
      sourceTrashNeeded: false,
      oncePerRunNeeded: false,
    });
    expect(records).toEqual([{
      cardId: installedProgramId,
      sourceCardDefinitionId: sourceDefinitionId,
    }]);
    expect(result).toEqual({ temporaryReturnRecorded: true });
  });

  it("does not create Sneak source-trash or once-per-run side effects", () => {
    const plan = createSneakPreviewPostInstallSideEffectPlan({
      execution: execution({ temporaryReturnNeeded: false }),
      sourceCardDefinitionId: sourceDefinitionId,
    });
    const records: unknown[] = [];

    expect(applySneakPreviewTemporaryReturnPlan(plan, {
      recordTemporaryReturn: (record) => records.push(record),
    })).toEqual({ temporaryReturnRecorded: false });
    expect(plan.temporaryReturnRecord).toBeUndefined();
    expect(plan.sourceTrashNeeded).toBe(false);
    expect(plan.oncePerRunNeeded).toBe(false);
    expect(records).toEqual([]);
  });

  it("plans and applies Mystery Box source trash after install", () => {
    const plan = createMysteryBoxPostInstallSideEffectPlan(
      execution({ sourceTrashNeeded: true }),
    );
    const trashed: CardInstanceId[] = [];
    const result = applyMysteryBoxSourceTrashPlan(plan, {
      trashSource: (cardId) => trashed.push(cardId),
    });

    expect(plan).toEqual({
      kind: "mystery_box",
      installedProgramId,
      selectedProgramId,
      sourceCardId,
      temporaryReturnNeeded: false,
      sourceTrashNeeded: true,
      oncePerRunNeeded: false,
    });
    expect(trashed).toEqual([sourceCardId]);
    expect(result).toEqual({ sourceTrashed: true });
  });

  it("rejects Mystery Box source trash without a source id", () => {
    expect(() =>
      createMysteryBoxPostInstallSideEffectPlan(
        execution({
          sourceCardId: undefined,
          sourceTrashNeeded: true,
        }),
      ),
    ).toThrow("Mystery Box hat keine Source fuer Source-Trash im Plan.");
  });

  it("plans and applies Mystery Box once-per-run marker", () => {
    const otherSourceId = "other_source" as CardInstanceId;
    const plan = createMysteryBoxOncePerRunPlan({
      sourceCardId,
      usedSourceIdsThisRun: [otherSourceId],
    });
    let marked: CardInstanceId[] = [];
    const result = applyMysteryBoxOncePerRunPlan(plan, {
      markUsedThisRun: (usedSourceIds) => {
        marked = usedSourceIds;
      },
    });

    expect(plan).toEqual({
      kind: "mystery_box_once_per_run",
      sourceCardId,
      usedSourceIdsThisRun: [otherSourceId],
      nextUsedSourceIdsThisRun: [otherSourceId, sourceCardId].sort(),
      oncePerRunUsed: true,
    });
    expect(marked).toEqual([otherSourceId, sourceCardId].sort());
    expect(result).toEqual({ oncePerRunMarked: true });
  });

  it("rejects duplicate Mystery Box once-per-run source use", () => {
    expect(() =>
      createMysteryBoxOncePerRunPlan({
        sourceCardId,
        usedSourceIdsThisRun: [sourceCardId],
      }),
    ).toThrow("Mystery Box wurde in diesem Run bereits genutzt.");
  });
});
