import { describe, expect, it } from "vitest";
import { isPriorityRequisitionChoiceSource } from "./priority-requisition-sequence";

describe("priority requisition sequence routing", () => {
  it("recognizes priority requisition choice sources", () => {
    expect(
      isPriorityRequisitionChoiceSource(
        "v162.priority_requisition:priority_agenda:8",
      ),
    ).toBe(true);
    expect(
      isPriorityRequisitionChoiceSource(
        "v1922.security_purge_install_targets:security_purge_agenda:ice_1:8",
      ),
    ).toBe(false);
  });
});
