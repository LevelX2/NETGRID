import { describe, expect, it } from "vitest";
import { isEmployeeEmpowermentStartDrawChoiceSource } from "./employee-empowerment-sequence";

describe("direct scored agenda effect modules", () => {
  it("recognizes employee empowerment start-draw choices", () => {
    expect(
      isEmployeeEmpowermentStartDrawChoiceSource(
        "v1912.employee_empowerment_start_draw:agenda_1:8",
      ),
    ).toBe(true);
    expect(
      isEmployeeEmpowermentStartDrawChoiceSource(
        "v162.scored_subtype_reveal:agenda_1:wall:2:8",
      ),
    ).toBe(false);
  });
});
