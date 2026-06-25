import { describe, expect, it } from "vitest";
import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
} from "./hq-to-new-remote-install-rez-sequence";

describe("data fort reclamation sequence routing", () => {
  it("recognizes install and rez sequence choice sources", () => {
    expect(
      isHqToNewRemoteInstallRezChoiceSource(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
      ),
    ).toBe(true);
    expect(
      isHqToNewRemoteInstallRezChoiceSource(
        "card_implementation.hq_to_new_remote_install_rez:data_fort_agenda:8",
      ),
    ).toBe(true);
    expect(
      isHqToNewRemoteInstallRezRezChoiceSource(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:8",
      ),
    ).toBe(true);
    expect(
      isHqToNewRemoteInstallRezChoiceSource("card_implementation.scored_agenda_free_rez"),
    ).toBe(false);
  });
});
