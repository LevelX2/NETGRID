import { describe, expect, it } from "vitest";
import type { ActivatedCardAbilityImplementation } from "./definition-types";
import { activatedAbilityPayload } from "./card-implementation-runtime-activated-targets";

describe("activatedAbilityPayload advancement semantics", () => {
  it("publishes advancement distribution amount and mode", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "distribute_advancement_counters",
          amount: 2,
          target: "installed_advanceable_cards",
          distribution: "single_target",
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, 0),
    ).toMatchObject({
      cardImplementationEffectKind: "distribute_advancement_counters",
      advancementCounterAmount: 2,
      advancementCounterChoiceMode: "single_target",
    });
  });

  it("publishes advancement transfer semantics", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "move_advancement_counters",
          source: "source_card",
          target: "chosen_installed_advanceable_card",
          maxAmount: "all",
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, 1),
    ).toMatchObject({
      cardImplementationEffectKind: "move_advancement_counters",
      advancementCounterMoveMaximum: "all",
      advancementCounterMoveSource: "source_card",
    });
  });
});
