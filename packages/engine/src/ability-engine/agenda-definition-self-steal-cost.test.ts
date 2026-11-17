import { expect, it } from "vitest";
import { quoteAgendaDefinitionSelfStealCreditCost } from "./steal-cost-modifiers";

it.each(["hq", "rd", "archives", "remote_1"])(
  "quotes Fetal AI's canonical two-credit self-cost in %s",
  (serverId) => {
    expect(
      quoteAgendaDefinitionSelfStealCreditCost(
        62,
        serverId,
      ),
    ).toBe(2);
    expect(
      quoteAgendaDefinitionSelfStealCreditCost(
        408,
        serverId,
      ),
    ).toBe(0);
  },
);
it.each([
  ["missing", "hq"],
  [251, "hq"],
  [62, "new_remote"],
  [62, "remote_bad"],
])("rejects an unquotable definition/zone %s/%s", (definitionId, serverId) => {
  expect(
    quoteAgendaDefinitionSelfStealCreditCost(definitionId, serverId),
  ).toBeUndefined();
});
