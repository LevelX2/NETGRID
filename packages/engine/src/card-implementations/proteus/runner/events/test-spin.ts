import type { CardImplementationDefinition } from "../../../types";

// card name: Test Spin
// text: Search your stack for a program and install it at no cost. Shuffle your stack, make a run, then return that program to your stack or pay the penalty.
export const proteusTestSpinImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_126_test-spin",
  runnerEventLongtail: {
    kind: "search_stack_install_program_free_then_run_return_or_penalty",
    installCost: "free",
    shuffleAfterwards: true,
    penaltyBase: 4,
    penaltyDamageType: "meat",
    visibility: "hidden_info_barrier",
  },
};
