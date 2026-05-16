import { describe, expect, it } from "vitest";
import { isCardActionSurfaceTarget } from "./card-action-menu-ui";

describe("card action menu UI helpers", () => {
  it("detects clicks inside the card action surface", () => {
    const target = { closest: (selector: string) => (selector === "[data-card-action-surface='true']" ? {} : null) } as unknown as EventTarget;

    expect(isCardActionSurfaceTarget(target)).toBe(true);
  });

  it("treats clicks outside the card action surface as outside clicks", () => {
    const target = { closest: () => null } as unknown as EventTarget;

    expect(isCardActionSurfaceTarget(target)).toBe(false);
    expect(isCardActionSurfaceTarget(null)).toBe(false);
  });
});
