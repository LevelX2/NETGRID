import type { CardImplementationDefinition } from "../../../types";

// card name: Code Viral Cache
// text: Play only if you made a successful run on HQ this turn. If the Corp forgoes actions to lose Virus counters, two counters of your choice are not removed. The Corp may trash Viral Cache by taking an action to pay [5].
export const codeViralCacheImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_155_code-viral-cache",
  hiddenReplacementLongtail: {
    kind: "code_viral_cache_purge_replacement",
    visibility: "hidden_info_barrier",
  },
};
