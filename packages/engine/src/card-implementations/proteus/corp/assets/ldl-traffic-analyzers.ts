import type { CardImplementationDefinition } from "../../../types";

// card name: LDL Traffic Analyzers
// text: You may advance LDL Traffic Analyzers before and after you rez it. You may rez LDL Traffic Analyzers during a trace attempt. LDL Traffic Analyzers advancement counter: Gain [5]. Use this ability only during a trace attempt. When the trace attempt ends, return to the bank any of the [5] you did not spend.
export const proteusLdlTrafficAnalyzersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_061_ldl-traffic-analyzers",
  advanceable: {
    while: "installed_before_and_after_rez",
  },
  abilities: [
    {
      kind: "activated",
      timing: "corp_trace_window",
      costs: [{ kind: "advancement_counter", amount: 1, source: "source" }],
      condition: { kind: "source_has_advancement_counters", minimum: 1 },
      effects: [
        {
          kind: "gain_temporary_trace_credits",
          recipient: "corp",
          amount: 5,
          usableFor: "current_trace",
          cleanup: "trace_end",
          visibility: "public",
        },
      ],
    },
  ],
};
