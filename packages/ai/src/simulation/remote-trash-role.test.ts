import { describe, expect, it, vi } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { remoteTrashRoleForVisibleCard } from "./remote-trash-role";

const cardRoleMock = vi.hoisted(() => ({
  roles: [] as string[],
}));

vi.mock("../runtime/card-role-lookup", () => ({
  cardRolesForId: () => cardRoleMock.roles,
}));

describe("remoteTrashRoleForVisibleCard", () => {
  it("matches remote trash roles by bounded role terms", () => {
    expect(roleForRoles(["remote_agenda_protection"])).toBe(
      "scoring_protection",
    );
    expect(roleForRoles(["remote_agenda_protectionish_noise"])).toBe(
      "unknown",
    );

    expect(roleForRoles(["ice_tax"])).toBe("run_tax");
    expect(roleForRoles(["nice_tax_noise"])).toBe("unknown");

    expect(roleForRoles(["economy_asset"])).toBe("economy");
    expect(roleForRoles(["microeconomy_noise"])).toBe("unknown");

    expect(roleForRoles(["tag_punishment"])).toBe("tag_punish");
    expect(roleForRoles(["tagalong_noise"])).toBe("unknown");

    expect(roleForRoles(["access_ambush"])).toBe("ambush");
    expect(roleForRoles(["ambusher_noise"])).toBe("unknown");

    expect(roleForRoles(["low_value"])).toBe("low_value");
    expect(roleForRoles(["slow_value_noise"])).toBe("unknown");
  });
});

function roleForRoles(roles: string[]) {
  cardRoleMock.roles = roles;
  return remoteTrashRoleForVisibleCard(card());
}

function card(): VisibleCard {
  return {
    instanceId: "test_card",
    definitionId: "test_card",
    known: true,
    type: "asset",
  } as VisibleCard;
}
