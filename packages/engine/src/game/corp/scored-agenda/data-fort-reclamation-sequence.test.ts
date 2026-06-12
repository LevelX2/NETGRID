import { describe, expect, it } from "vitest";
import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
} from "./data-fort-reclamation-sequence";

describe("data fort reclamation sequence routing", () => {
  it("recognizes install and rez sequence choice sources", () => {
    expect(
      isHqToNewRemoteInstallRezChoiceSource(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
      ),
    ).toBe(true);
    expect(
      isHqToNewRemoteInstallRezChoiceSource(
        "v1922.data_fort_reclamation:data_fort_agenda:8",
      ),
    ).toBe(true);
    expect(
      isHqToNewRemoteInstallRezRezChoiceSource(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:8",
      ),
    ).toBe(true);
    expect(
      isHqToNewRemoteInstallRezChoiceSource("v162.priority_requisition"),
    ).toBe(false);
  });
});
