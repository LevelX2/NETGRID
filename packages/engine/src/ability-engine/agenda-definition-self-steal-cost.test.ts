import { expect, it } from "vitest";
import { quoteAgendaDefinitionSelfStealCreditCost } from "./steal-cost-modifiers";

it.each(["hq", "rd", "archives", "remote_1"])(
  "quotes Fetal AI's canonical two-credit self-cost in %s",
  (serverId) => {
    expect(
      quoteAgendaDefinitionSelfStealCreditCost(
        "onr_proteus_004_fetal-ai",
        serverId,
      ),
    ).toBe(2);
    expect(
      quoteAgendaDefinitionSelfStealCreditCost(
        "onr_v1_196_corporate-war",
        serverId,
      ),
    ).toBe(0);
  },
);
it.each([
  ["missing", "hq"],
  ["onr_v1_039_krash", "hq"],
  ["onr_proteus_004_fetal-ai", "new_remote"],
  ["onr_proteus_004_fetal-ai", "remote_bad"],
])("rejects an unquotable definition/zone %s/%s", (definitionId, serverId) => {
  expect(
    quoteAgendaDefinitionSelfStealCreditCost(definitionId, serverId),
  ).toBeUndefined();
});
