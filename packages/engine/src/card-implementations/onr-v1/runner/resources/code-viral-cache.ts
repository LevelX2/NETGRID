import type { CardImplementationDefinition } from "../../../types";

// card name: Code Viral Cache
// text: Play only if you made a successful run on HQ this turn. If the Corp forgoes actions to lose Virus counters, two counters of your choice are not removed. The Corp may trash Viral Cache by taking an action to pay [5].
export const codeViralCacheImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_155_code-viral-cache",
  installCapabilities: [
    {
      kind: "runner_made_successful_run_on_server_this_turn",
      server: "hq",
      visibility: "public",
    },
  ],
  hiddenReplacementLongtail: {
    kind: "purge_replacement_with_runner_virus_counter_cleanup",
    visibility: "hidden_info_barrier",
  },
  corpTrashInstalledRunnerSource: {
    kind: "corp_trash_installed_runner_resource",
    timing: "corp_main",
    cost: { clicks: 1, credits: 5 },
    target: "source",
    visibility: "public",
  },
};
