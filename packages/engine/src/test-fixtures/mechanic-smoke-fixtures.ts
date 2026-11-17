import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import { applyAction, createGameAfterSetup, getLegalActions } from "../index";
import {
  CURRENT_RULES_BASELINE,
  DEMO_DECKS,
  type CardDefinitionId,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type CreateGameConfig,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";

export function createMechanicFixtureGameAfterSetup(
  config: CreateGameConfig = {},
): GameState {
  return createGameAfterSetup({
    ...config,
    runnerDeck: config.runnerDeck ?? DEMO_DECKS.demo_runner_001,
    corpDeck: config.corpDeck ?? DEMO_DECKS.demo_corp_001,
  });
}

export const ONR_V1_0_5K_FINAL_CARD_IDS = [
  227,
  264,
  266,
  282,
  356,
  358,
  415,
  442,
  444,
  449,
  450,
  451,
] as const;

export const ONR_V1_0_6K_FINAL_CARD_IDS = [
  291,
  307,
  309,
  320,
  284,
  357,
  432,
  493,
  494,
  497,
  499,
  500,
  502,
  513,
  514,
  519,
  456,
  457,
  464,
  468,
] as const;

export const ONR_V1_1_2K_FINAL_CARD_IDS = [
  218,
  226,
  228,
  252,
  272,
  285,
  465,
  469,
  471,
  473,
  474,
  475,
  477,
  478,
  481,
  482,
  490,
  491,
  505,
  507,
] as const;

export const ONR_V1_2_3_FINAL_CARD_IDS = [
  233,
  251,
  278,
  286,
  293,
  297,
  313,
  455,
  461,
  509,
  518,
] as const;

export const ONR_V1_6_1_FINAL_CARD_IDS = [
  235,
  240,
  337,
  441,
  443,
  466,
] as const;

export const ONR_V1_6_2_FINAL_CARD_IDS = [
  424,
  427,
  529,
  532,
  553,
] as const;

export const ONR_V1_6_3_FINAL_CARD_IDS = [
  445,
  479,
  485,
  562,
  583,
] as const;

export const ONR_V1_7_0_FINAL_CARD_IDS = [
  223,
  248,
  281,
  375,
  392,
] as const;

export const ONR_V1_7_1_FINAL_CARD_IDS = [
  326,
  318,
  330,
  296,
  341,
] as const;

export const ONR_V1_7_2_FINAL_CARD_IDS = [
  495,
  496,
  498,
  370,
  391,
] as const;

export const ONR_V1_8_0_FINAL_CARD_IDS = [
  295,
  302,
  368,
  371,
  413,
  426,
] as const;

export const ONR_V1_8_1_FINAL_CARD_IDS = [
  224,
  258,
  261,
  306,
  385,
  405,
  421,
  434,
  437,
  438,
  454,
  480,
] as const;

export const ONR_V1_9_0_FINAL_CARD_IDS = [
  217,
  219,
  327,
  435,
  487,
] as const;

export const ONR_V1_9_1_FINAL_CARD_IDS = [
  225,
  246,
  242,
] as const;

export const ONR_V1_9_2_FINAL_CARD_IDS = [
  288,
  308,
  319,
  396,
  400,
  423,
  447,
] as const;

export const ONR_V1_9_3_FINAL_CARD_IDS = [
  419,
  425,
  463,
  483,
] as const;

export const ONR_V1_9_4_FINAL_CARD_IDS = [
  420,
  429,
] as const;
export const ONR_V1_9_5_FINAL_CARD_IDS = [
  431,
  520,
] as const;
export const ONR_V1_9_6_FINAL_CARD_IDS = [448] as const;
export const ONR_V1_9_7_FINAL_CARD_IDS = [213] as const;
export const ONR_V1_9_8_FINAL_CARD_IDS = [
  230,
  231,
] as const;
export const ONR_V1_9_9_FINAL_CARD_IDS = [
  561,
  563,
  564,
  565,
] as const;
export const ONR_V1_9_12_RELEASE_CARD_IDS = [
  221,
  222,
  229,
  244,
  276,
  294,
  303,
  386,
  388,
  410,
  411,
] as const;
export const ONR_V1_9_13_RELEASE_CARD_IDS = [
  250,
  333,
  339,
  340,
  342,
  347,
  351,
  355,
  367,
  373,
  382,
  397,
  398,
  399,
  436,
  446,
  470,
] as const;
export const ONR_V1_9_14_WIP_CARD_IDS = [
  265,
  268,
  275,
  328,
  332,
  338,
  344,
  366,
  369,
  374,
  376,
  377,
  378,
  379,
  390,
  393,
  395,
  433,
  440,
  452,
  453,
  460,
  472,
  476,
  511,
] as const;

export const ONR_V1_9_14_RUNNER_CARD_IDS = ONR_V1_9_14_WIP_CARD_IDS.filter(
  (cardId) => CARD_DEFINITIONS_BY_ID[cardId]?.side === "runner",
);

export const ONR_V1_9_15_WIP_CARD_IDS = [
  232,
  236,
  253,
  255,
  274,
  277,
  310,
  317,
  323,
  324,
  354,
  439,
  467,
  506,
] as const;

export const ONR_V1_9_16_WIP_CARD_IDS = [
  215,
  216,
  245,
  247,
  259,
  262,
  283,
  352,
  353,
  360,
  361,
  362,
  364,
  365,
  394,
  458,
] as const;

export const ONR_V1_9_17_WIP_CARD_IDS = [
  521,
  522,
  523,
  526,
  528,
  530,
  531,
  533,
  538,
  541,
  542,
  545,
  548,
  549,
  552,
  554,
  556,
  557,
] as const;

export const ONR_V1_9_18_WIP_CARD_IDS = [
  566,
  567,
  568,
  569,
  570,
  571,
  573,
  574,
  576,
  577,
  578,
  581,
  582,
  584,
  585,
] as const;

export const ONR_V1_9_19_WIP_CARD_IDS = [
  237,
  290,
  401,
  414,
  503,
  504,
  512,
  515,
  516,
  517,
  524,
  527,
  535,
  540,
  558,
  559,
  560,
  575,
  580,
  586,
] as const;

export const ONR_V1_9_20_WIP_CARD_IDS = [
  234,
  241,
  345,
  346,
  372,
  380,
  383,
  402,
  403,
  404,
  412,
  416,
  417,
  430,
  525,
  534,
  536,
  537,
  539,
  543,
  544,
  546,
  547,
  550,
  555,
  572,
] as const;

export const ONR_V1_9_21_WIP_CARD_IDS = [
  214,
  220,
  316,
  384,
  551,
  579,
] as const;

export const ONR_V1_9_22_WIP_CARD_IDS = [
  238,
  239,
  243,
  249,
  256,
  257,
  260,
  263,
  267,
  269,
  273,
  279,
  280,
  287,
  289,
  292,
  298,
  305,
  312,
  314,
  315,
  321,
  325,
  329,
  331,
  334,
  335,
  336,
  343,
  348,
  349,
  350,
  359,
  407,
  408,
  409,
  418,
  422,
  428,
  459,
  486,
  488,
  489,
  492,
  501,
  508,
  510,
] as const;

export const ONR_V1_0_5K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v105k_smoke_094",
  name: "O:NR V1.0.5K Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 227, quantity: 2 },
    { id: 264, quantity: 2 },
    { id: 266, quantity: 2 },
    { id: 282, quantity: 2 },
    { id: 356, quantity: 1 },
    { id: 358, quantity: 1 },
    { id: 595, quantity: 2 },
  ],
};

export const ONR_V1_0_5K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v105k_smoke_094",
  name: "O:NR V1.0.5K Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 415, quantity: 3 },
    { id: 588, quantity: 3 },
    { id: 442, quantity: 2 },
    { id: 444, quantity: 2 },
    { id: 449, quantity: 2 },
    { id: 450, quantity: 2 },
    { id: 451, quantity: 2 },
    { id: 596, quantity: 2 },
  ],
};

export const ONR_V1_0_6K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v106k_smoke_094",
  name: "O:NR V1.0.6K Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 291, quantity: 2 },
    { id: 307, quantity: 2 },
    { id: 309, quantity: 2 },
    { id: 320, quantity: 2 },
    { id: 284, quantity: 2 },
    { id: 357, quantity: 2 },
    { id: 227, quantity: 1 },
    { id: 282, quantity: 1 },
    { id: 595, quantity: 8 },
  ],
};

export const ONR_V1_0_6K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v106k_smoke_094",
  name: "O:NR V1.0.6K Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 493, quantity: 1 },
    { id: 494, quantity: 1 },
    { id: 497, quantity: 1 },
    { id: 499, quantity: 1 },
    { id: 500, quantity: 1 },
    { id: 502, quantity: 1 },
    { id: 513, quantity: 1 },
    { id: 514, quantity: 1 },
    { id: 519, quantity: 1 },
    { id: 456, quantity: 1 },
    { id: 457, quantity: 1 },
    { id: 464, quantity: 1 },
    { id: 468, quantity: 1 },
    { id: 442, quantity: 1 },
    { id: 444, quantity: 1 },
    { id: 601, quantity: 1 },
    { id: 596, quantity: 1 },
  ],
};

export const ONR_V1_1_2K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v112k_smoke_094",
  name: "O:NR V1.1.2K Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 218, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 228, quantity: 2 },
    { id: 252, quantity: 2 },
    { id: 272, quantity: 2 },
    { id: 285, quantity: 2 },
    { id: 357, quantity: 2 },
    { id: 595, quantity: 8 },
  ],
};

export const ONR_V1_1_2K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v112k_smoke_094",
  name: "O:NR V1.1.2K Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 505, quantity: 1 },
    { id: 507, quantity: 1 },
    { id: 465, quantity: 1 },
    { id: 469, quantity: 1 },
    { id: 471, quantity: 1 },
    { id: 473, quantity: 1 },
    { id: 474, quantity: 1 },
    { id: 475, quantity: 1 },
    { id: 477, quantity: 1 },
    { id: 478, quantity: 1 },
    { id: 481, quantity: 1 },
    { id: 482, quantity: 1 },
    { id: 490, quantity: 1 },
    { id: 491, quantity: 1 },
    { id: 596, quantity: 2 },
  ],
};

export const ONR_V1_2_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v123_smoke_094",
  name: "O:NR V1.2.3 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 233, quantity: 2 },
    { id: 251, quantity: 2 },
    { id: 278, quantity: 2 },
    { id: 286, quantity: 2 },
    { id: 293, quantity: 1 },
    { id: 297, quantity: 1 },
    { id: 313, quantity: 2 },
  ],
};

export const ONR_V1_2_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v123_smoke_094",
  name: "O:NR V1.2.3 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 1 },
    { id: 415, quantity: 3 },
    { id: 455, quantity: 2 },
    { id: 461, quantity: 2 },
    { id: 509, quantity: 3 },
    { id: 518, quantity: 1 },
    { id: 449, quantity: 2 },
    { id: 473, quantity: 2 },
    { id: 491, quantity: 2 },
    { id: 471, quantity: 2 },
    { id: 507, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_6_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v161_smoke_094",
  name: "O:NR V1.6.1 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 235, quantity: 2 },
    { id: 240, quantity: 2 },
    { id: 337, quantity: 2 },
    { id: 595, quantity: 8 },
  ],
};

export const ONR_V1_6_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v161_smoke_094",
  name: "O:NR V1.6.1 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 441, quantity: 1 },
    { id: 443, quantity: 1 },
    { id: 466, quantity: 1 },
    { id: 513, quantity: 2 },
    { id: 514, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_6_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v162_smoke_094",
  name: "O:NR V1.6.2 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 235, quantity: 2 },
    { id: 240, quantity: 2 },
    { id: 337, quantity: 2 },
    { id: 595, quantity: 8 },
  ],
};

export const ONR_V1_6_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v162_smoke_094",
  name: "O:NR V1.6.2 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 424, quantity: 1 },
    { id: 427, quantity: 1 },
    { id: 529, quantity: 2 },
    { id: 532, quantity: 2 },
    { id: 553, quantity: 2 },
    { id: 444, quantity: 2 },
    { id: 442, quantity: 2 },
    { id: 443, quantity: 2 },
    { id: 596, quantity: 2 },
  ],
};

export const ONR_V1_6_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v163_smoke_094",
  name: "O:NR V1.6.3 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 226, quantity: 2 },
    { id: 235, quantity: 2 },
    { id: 240, quantity: 2 },
    { id: 595, quantity: 8 },
  ],
};

export const ONR_V1_6_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v163_smoke_094",
  name: "O:NR V1.6.3 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 1 },
    { id: 415, quantity: 3 },
    { id: 445, quantity: 1 },
    { id: 479, quantity: 1 },
    { id: 485, quantity: 1 },
    { id: 562, quantity: 2 },
    { id: 583, quantity: 2 },
    { id: 444, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_7_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v170_smoke_094",
  name: "O:NR V1.7.0 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 223, quantity: 2 },
    { id: 248, quantity: 2 },
    { id: 281, quantity: 2 },
    { id: 375, quantity: 2 },
    { id: 392, quantity: 1 },
    { id: 233, quantity: 1 },
    { id: 240, quantity: 1 },
    { id: 226, quantity: 2 },
    { id: 595, quantity: 3 },
  ],
};

export const ONR_V1_7_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v170_smoke_094",
  name: "O:NR V1.7.0 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 1 },
    { id: 415, quantity: 3 },
    { id: 445, quantity: 2 },
    { id: 444, quantity: 2 },
    { id: 507, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_7_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v171_smoke_094",
  name: "O:NR V1.7.1 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 326, quantity: 2 },
    { id: 318, quantity: 2 },
    { id: 330, quantity: 2 },
    { id: 296, quantity: 2 },
    { id: 341, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 248, quantity: 2 },
    { id: 595, quantity: 4 },
  ],
};

export const ONR_V1_7_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v171_smoke_094",
  name: "O:NR V1.7.1 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 1 },
    { id: 415, quantity: 3 },
    { id: 445, quantity: 1 },
    { id: 444, quantity: 2 },
    { id: 507, quantity: 2 },
    { id: 596, quantity: 3 },
    { id: 594, quantity: 2 },
  ],
};

export const ONR_V1_7_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v172_smoke_094",
  name: "O:NR V1.7.2 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 370, quantity: 2 },
    { id: 391, quantity: 2 },
    { id: 375, quantity: 2 },
    { id: 341, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 595, quantity: 4 },
  ],
};

export const ONR_V1_7_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v172_smoke_094",
  name: "O:NR V1.7.2 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 1 },
    { id: 415, quantity: 3 },
    { id: 495, quantity: 2 },
    { id: 496, quantity: 2 },
    { id: 498, quantity: 2 },
    { id: 444, quantity: 2 },
    { id: 596, quantity: 3 },
    { id: 594, quantity: 2 },
  ],
};

export const ONR_V1_8_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v180_smoke_094",
  name: "O:NR V1.8.0 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 295, quantity: 2 },
    { id: 302, quantity: 2 },
    { id: 368, quantity: 1 },
    { id: 371, quantity: 1 },
    { id: 226, quantity: 2 },
    { id: 248, quantity: 2 },
    { id: 595, quantity: 4 },
  ],
};

export const ONR_V1_8_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v180_smoke_094",
  name: "O:NR V1.8.0 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 415, quantity: 3 },
    { id: 413, quantity: 2 },
    { id: 426, quantity: 2 },
    { id: 588, quantity: 2 },
    { id: 444, quantity: 2 },
    { id: 589, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_8_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v181_smoke_094",
  name: "O:NR V1.8.1 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 224, quantity: 2 },
    { id: 258, quantity: 2 },
    { id: 261, quantity: 2 },
    { id: 306, quantity: 2 },
    { id: 385, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 233, quantity: 2 },
    { id: 595, quantity: 4 },
  ],
};

export const ONR_V1_8_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v181_smoke_094",
  name: "O:NR V1.8.1 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 415, quantity: 3 },
    { id: 405, quantity: 2 },
    { id: 421, quantity: 2 },
    { id: 434, quantity: 2 },
    { id: 437, quantity: 2 },
    { id: 438, quantity: 2 },
    { id: 454, quantity: 2 },
    { id: 480, quantity: 2 },
    { id: 491, quantity: 2 },
    { id: 589, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v190_smoke_094",
  name: "O:NR V1.9.0 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 217, quantity: 2 },
    { id: 219, quantity: 2 },
    { id: 327, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 233, quantity: 2 },
    { id: 595, quantity: 4 },
  ],
};

export const ONR_V1_9_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v190_smoke_094",
  name: "O:NR V1.9.0 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 415, quantity: 3 },
    { id: 405, quantity: 2 },
    { id: 421, quantity: 2 },
    { id: 435, quantity: 2 },
    { id: 487, quantity: 2 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 589, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v191_smoke_094",
  name: "O:NR V1.9.1 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 225, quantity: 2 },
    { id: 246, quantity: 2 },
    { id: 242, quantity: 2 },
    { id: 233, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v191_smoke_094",
  name: "O:NR V1.9.1 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 415, quantity: 3 },
    { id: 588, quantity: 3 },
    { id: 491, quantity: 3 },
    { id: 450, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v192_smoke_094",
  name: "O:NR V1.9.2 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 288, quantity: 2 },
    { id: 308, quantity: 2 },
    { id: 319, quantity: 2 },
    { id: 396, quantity: 2 },
    { id: 233, quantity: 2 },
    { id: 595, quantity: 4 },
  ],
};

export const ONR_V1_9_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v192_smoke_094",
  name: "O:NR V1.9.2 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 400, quantity: 2 },
    { id: 423, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 588, quantity: 2 },
    { id: 447, quantity: 2 },
    { id: 491, quantity: 2 },
    { id: 450, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v193_smoke_094",
  name: "O:NR V1.9.3 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 226, quantity: 2 },
    { id: 233, quantity: 2 },
    { id: 341, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v193_smoke_094",
  name: "O:NR V1.9.3 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 419, quantity: 2 },
    { id: 425, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 588, quantity: 2 },
    { id: 463, quantity: 2 },
    { id: 483, quantity: 2 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 1 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_4_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v194_smoke_094",
  name: "O:NR V1.9.4 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 226, quantity: 2 },
    { id: 233, quantity: 2 },
    { id: 240, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_4_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v194_smoke_094",
  name: "O:NR V1.9.4 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 420, quantity: 2 },
    { id: 429, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 513, quantity: 2 },
    { id: 514, quantity: 2 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_5_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v195_smoke_094",
  name: "O:NR V1.9.5 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 226, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_5_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v195_smoke_094",
  name: "O:NR V1.9.5 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 431, quantity: 2 },
    { id: 520, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_6_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v196_smoke_094",
  name: "O:NR V1.9.6 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 226, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_6_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v196_smoke_094",
  name: "O:NR V1.9.6 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 448, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 432, quantity: 1 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_7_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v197_smoke_094",
  name: "O:NR V1.9.7 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 213, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_7_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v197_smoke_094",
  name: "O:NR V1.9.7 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 415, quantity: 3 },
    { id: 432, quantity: 1 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_8_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v198_smoke_094",
  name: "O:NR V1.9.8 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 230, quantity: 2 },
    { id: 231, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_8_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v198_smoke_094",
  name: "O:NR V1.9.8 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 415, quantity: 3 },
    { id: 432, quantity: 1 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_9_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v199_smoke_094",
  name: "O:NR V1.9.9 Runner Smoke",
  side: "runner",
  identity: 587,
  cards: [
    { id: 213, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 233, quantity: 2 },
    { id: 286, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_9_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v199_smoke_094",
  name: "O:NR V1.9.9 Corp Smoke",
  side: "corp",
  identity: 3,
  cards: [
    { id: 561, quantity: 2 },
    { id: 563, quantity: 2 },
    { id: 564, quantity: 2 },
    { id: 565, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 588, quantity: 3 },
    { id: 491, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};

export const ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1911_hidden_zone_wip",
  name: "O:NR V1.9.11 Hidden-Zone WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 254, quantity: 1 },
    { id: 270, quantity: 1 },
    { id: 271, quantity: 1 },
    { id: 299, quantity: 1 },
    { id: 300, quantity: 1 },
    { id: 301, quantity: 1 },
    { id: 304, quantity: 1 },
    { id: 311, quantity: 1 },
    { id: 322, quantity: 1 },
    { id: 363, quantity: 1 },
    { id: 381, quantity: 1 },
    { id: 387, quantity: 1 },
    { id: 389, quantity: 1 },
    { id: 591, quantity: 2 },
    { id: 597, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1911_hidden_zone_wip",
  name: "O:NR V1.9.11 Hidden-Zone WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 406, quantity: 1 },
    { id: 462, quantity: 1 },
    { id: 484, quantity: 1 },
    { id: 588, quantity: 3 },
    { id: 415, quantity: 3 },
    { id: 606, quantity: 2 },
    { id: 589, quantity: 2 },
    { id: 590, quantity: 2 },
    { id: 601, quantity: 2 },
    { id: 596, quantity: 4 },
  ],
};

export const ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1912_counter_recurring_wip",
  name: "O:NR V1.9.12 Counter Recurring WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 221, quantity: 1 },
    { id: 222, quantity: 1 },
    { id: 229, quantity: 1 },
    { id: 244, quantity: 1 },
    { id: 276, quantity: 1 },
    { id: 294, quantity: 1 },
    { id: 303, quantity: 1 },
    { id: 386, quantity: 1 },
    { id: 388, quantity: 1 },
    { id: 233, quantity: 2 },
    { id: 591, quantity: 2 },
    { id: 597, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1912_counter_recurring_wip",
  name: "O:NR V1.9.12 Counter Recurring WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 410, quantity: 2 },
    { id: 411, quantity: 2 },
    { id: 415, quantity: 3 },
    { id: 588, quantity: 3 },
    { id: 589, quantity: 2 },
    { id: 596, quantity: 4 },
  ],
};

export const ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1913_damage_prevention_wip",
  name: "O:NR V1.9.13 Damage Prevention WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 250, quantity: 1 },
    { id: 333, quantity: 1 },
    { id: 339, quantity: 1 },
    { id: 340, quantity: 1 },
    { id: 342, quantity: 1 },
    { id: 347, quantity: 1 },
    { id: 351, quantity: 1 },
    { id: 355, quantity: 1 },
    { id: 367, quantity: 1 },
    { id: 373, quantity: 1 },
    { id: 382, quantity: 1 },
    { id: 397, quantity: 1 },
    { id: 398, quantity: 1 },
    { id: 399, quantity: 1 },
    { id: 591, quantity: 2 },
    { id: 595, quantity: 8 },
  ],
};

export const ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1913_damage_prevention_wip",
  name: "O:NR V1.9.13 Damage Prevention WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 436, quantity: 2 },
    { id: 446, quantity: 2 },
    { id: 470, quantity: 2 },
    { id: 513, quantity: 2 },
    { id: 588, quantity: 3 },
    { id: 596, quantity: 6 },
  ],
};

export const ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1914_trace_tag_resource",
  name: "O:NR V1.9.14 Trace Tag Resource Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 265, quantity: 1 },
    { id: 268, quantity: 1 },
    { id: 275, quantity: 1 },
    { id: 328, quantity: 1 },
    { id: 332, quantity: 1 },
    { id: 338, quantity: 1 },
    { id: 344, quantity: 1 },
    { id: 366, quantity: 1 },
    { id: 369, quantity: 1 },
    { id: 374, quantity: 1 },
    { id: 376, quantity: 1 },
    { id: 377, quantity: 1 },
    { id: 378, quantity: 1 },
    { id: 379, quantity: 1 },
    { id: 390, quantity: 1 },
    { id: 393, quantity: 1 },
    { id: 395, quantity: 1 },
    { id: 591, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1914_trace_tag_resource",
  name: "O:NR V1.9.14 Trace Tag Resource Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 433, quantity: 2 },
    { id: 440, quantity: 2 },
    { id: 452, quantity: 2 },
    { id: 453, quantity: 2 },
    { id: 460, quantity: 2 },
    { id: 472, quantity: 2 },
    { id: 476, quantity: 2 },
    { id: 537, quantity: 1 },
    { id: 511, quantity: 2 },
    { id: 588, quantity: 3 },
    { id: 596, quantity: 4 },
  ],
};

export const ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1915_run_access",
  name: "O:NR V1.9.15 Run Access WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 232, quantity: 1 },
    { id: 236, quantity: 1 },
    { id: 253, quantity: 1 },
    { id: 255, quantity: 1 },
    { id: 274, quantity: 1 },
    { id: 277, quantity: 1 },
    { id: 310, quantity: 1 },
    { id: 317, quantity: 2 },
    { id: 323, quantity: 1 },
    { id: 324, quantity: 1 },
    { id: 354, quantity: 1 },
    { id: 591, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_15_RUN_ACCESS_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1915_run_access",
  name: "O:NR V1.9.15 Run Access WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 439, quantity: 2 },
    { id: 467, quantity: 2 },
    { id: 506, quantity: 2 },
    { id: 588, quantity: 3 },
    { id: 596, quantity: 4 },
    { id: 594, quantity: 2 },
  ],
};

export const ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1916_program_subtype",
  name: "O:NR V1.9.16 Program Subtype WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 215, quantity: 1 },
    { id: 216, quantity: 1 },
    { id: 245, quantity: 1 },
    { id: 247, quantity: 1 },
    { id: 259, quantity: 1 },
    { id: 262, quantity: 1 },
    { id: 283, quantity: 1 },
    { id: 352, quantity: 1 },
    { id: 353, quantity: 1 },
    { id: 360, quantity: 1 },
    { id: 361, quantity: 1 },
    { id: 362, quantity: 1 },
    { id: 364, quantity: 1 },
    { id: 365, quantity: 1 },
    { id: 394, quantity: 1 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1916_program_subtype",
  name: "O:NR V1.9.16 Program Subtype WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 458, quantity: 2 },
    { id: 588, quantity: 3 },
    { id: 596, quantity: 4 },
    { id: 594, quantity: 2 },
  ],
};

export const ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1917_generic_asset",
  name: "O:NR V1.9.17 Generic Asset WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 591, quantity: 2 },
    { id: 597, quantity: 2 },
    { id: 598, quantity: 2 },
    { id: 247, quantity: 1 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_17_GENERIC_ASSET_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1917_generic_asset",
  name: "O:NR V1.9.17 Generic Asset WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 521, quantity: 1 },
    { id: 522, quantity: 1 },
    { id: 523, quantity: 1 },
    { id: 526, quantity: 1 },
    { id: 528, quantity: 1 },
    { id: 530, quantity: 1 },
    { id: 531, quantity: 1 },
    { id: 533, quantity: 1 },
    { id: 538, quantity: 1 },
    { id: 541, quantity: 1 },
    { id: 542, quantity: 1 },
    { id: 545, quantity: 1 },
    { id: 548, quantity: 1 },
    { id: 549, quantity: 1 },
    { id: 552, quantity: 1 },
    { id: 554, quantity: 1 },
    { id: 556, quantity: 1 },
    { id: 557, quantity: 1 },
    { id: 566, quantity: 1 },
    { id: 567, quantity: 1 },
    { id: 568, quantity: 1 },
    { id: 569, quantity: 1 },
    { id: 570, quantity: 1 },
    { id: 571, quantity: 1 },
    { id: 573, quantity: 1 },
    { id: 574, quantity: 1 },
    { id: 576, quantity: 1 },
    { id: 577, quantity: 1 },
    { id: 578, quantity: 1 },
    { id: 581, quantity: 1 },
    { id: 582, quantity: 1 },
    { id: 584, quantity: 1 },
    { id: 585, quantity: 1 },
    { id: 588, quantity: 3 },
    { id: 596, quantity: 4 },
  ],
};

export const ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1919_agenda_overadvance",
  name: "O:NR V1.9.19 Agenda/Overadvance WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 237, quantity: 1 },
    { id: 290, quantity: 1 },
    { id: 602, quantity: 1 },
    { id: 591, quantity: 2 },
    { id: 597, quantity: 2 },
    { id: 598, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1919_agenda_overadvance",
  name: "O:NR V1.9.19 Agenda/Overadvance WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 401, quantity: 1 },
    { id: 414, quantity: 1 },
    { id: 503, quantity: 1 },
    { id: 504, quantity: 1 },
    { id: 512, quantity: 1 },
    { id: 515, quantity: 1 },
    { id: 516, quantity: 1 },
    { id: 517, quantity: 1 },
    { id: 524, quantity: 1 },
    { id: 527, quantity: 1 },
    { id: 535, quantity: 1 },
    { id: 540, quantity: 1 },
    { id: 558, quantity: 1 },
    { id: 559, quantity: 1 },
    { id: 560, quantity: 1 },
    { id: 575, quantity: 1 },
    { id: 580, quantity: 1 },
    { id: 586, quantity: 1 },
    { id: 514, quantity: 1 },
    { id: 588, quantity: 2 },
    { id: 596, quantity: 4 },
  ],
};

export const ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1920_global_modifier",
  name: "O:NR V1.9.20 Global Modifier WIP Runner",
  side: "runner",
  identity: 587,
  cards: [
    { id: 234, quantity: 1 },
    { id: 241, quantity: 1 },
    { id: 345, quantity: 1 },
    { id: 346, quantity: 1 },
    { id: 372, quantity: 1 },
    { id: 380, quantity: 1 },
    { id: 383, quantity: 1 },
    { id: 591, quantity: 2 },
    { id: 597, quantity: 2 },
    { id: 595, quantity: 6 },
  ],
};

export const ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1920_global_modifier",
  name: "O:NR V1.9.20 Global Modifier WIP Corp",
  side: "corp",
  identity: 3,
  cards: [
    { id: 402, quantity: 1 },
    { id: 403, quantity: 1 },
    { id: 404, quantity: 1 },
    { id: 412, quantity: 1 },
    { id: 416, quantity: 1 },
    { id: 417, quantity: 1 },
    { id: 430, quantity: 1 },
    { id: 525, quantity: 1 },
    { id: 534, quantity: 1 },
    { id: 536, quantity: 1 },
    { id: 537, quantity: 1 },
    { id: 539, quantity: 1 },
    { id: 543, quantity: 1 },
    { id: 544, quantity: 1 },
    { id: 546, quantity: 1 },
    { id: 547, quantity: 1 },
    { id: 550, quantity: 1 },
    { id: 555, quantity: 1 },
    { id: 572, quantity: 1 },
    { id: 444, quantity: 1 },
    { id: 588, quantity: 2 },
    { id: 596, quantity: 4 },
  ],
};

export const ONR_V1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_test_harness_094",
  name: "O:NR v1 Limited Runner Test Harness",
  side: "runner",
  identity: 587,
  cards: [
    { id: 291, quantity: 2 },
    { id: 307, quantity: 2 },
    { id: 309, quantity: 2 },
    { id: 320, quantity: 2 },
    { id: 218, quantity: 2 },
    { id: 226, quantity: 2 },
    { id: 228, quantity: 2 },
    { id: 252, quantity: 2 },
    { id: 272, quantity: 2 },
    { id: 284, quantity: 2 },
    { id: 285, quantity: 2 },
    { id: 357, quantity: 2 },
  ],
};

export const ONR_V1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_test_harness_094",
  name: "O:NR v1 Limited Corp Test Harness",
  side: "corp",
  identity: 3,
  cards: [
    { id: 432, quantity: 2 },
    { id: 493, quantity: 1 },
    { id: 494, quantity: 1 },
    { id: 497, quantity: 1 },
    { id: 499, quantity: 1 },
    { id: 500, quantity: 1 },
    { id: 502, quantity: 1 },
    { id: 505, quantity: 1 },
    { id: 507, quantity: 1 },
    { id: 513, quantity: 1 },
    { id: 514, quantity: 1 },
    { id: 519, quantity: 1 },
    { id: 442, quantity: 1 },
    { id: 444, quantity: 1 },
    { id: 449, quantity: 1 },
    { id: 450, quantity: 1 },
    { id: 451, quantity: 1 },
    { id: 456, quantity: 1 },
    { id: 457, quantity: 1 },
    { id: 464, quantity: 1 },
    { id: 465, quantity: 1 },
    { id: 468, quantity: 1 },
    { id: 469, quantity: 1 },
    { id: 471, quantity: 1 },
    { id: 473, quantity: 1 },
    { id: 474, quantity: 1 },
    { id: 475, quantity: 1 },
    { id: 477, quantity: 1 },
    { id: 478, quantity: 1 },
    { id: 481, quantity: 1 },
    { id: 482, quantity: 1 },
    { id: 490, quantity: 1 },
    { id: 491, quantity: 1 },
  ],
};

export function onrV1Game(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_RUNNER_DECK,
    corpDeck: ONR_V1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v105kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
    corpDeck: ONR_V1_0_5K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v106kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
    corpDeck: ONR_V1_0_6K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v112kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
    corpDeck: ONR_V1_1_2K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v123CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_2_3_RUNNER_DECK,
    corpDeck: ONR_V1_2_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v161CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_6_1_RUNNER_DECK,
    corpDeck: ONR_V1_6_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v162CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_6_2_RUNNER_DECK,
    corpDeck: ONR_V1_6_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v163CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_6_3_RUNNER_DECK,
    corpDeck: ONR_V1_6_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v170CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_7_0_RUNNER_DECK,
    corpDeck: ONR_V1_7_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v171CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_7_1_RUNNER_DECK,
    corpDeck: ONR_V1_7_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v172CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_7_2_RUNNER_DECK,
    corpDeck: ONR_V1_7_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v180CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_8_0_RUNNER_DECK,
    corpDeck: ONR_V1_8_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v181CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_8_1_RUNNER_DECK,
    corpDeck: ONR_V1_8_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v190CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_0_RUNNER_DECK,
    corpDeck: ONR_V1_9_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v191CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_1_RUNNER_DECK,
    corpDeck: ONR_V1_9_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v192CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_2_RUNNER_DECK,
    corpDeck: ONR_V1_9_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v193CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_3_RUNNER_DECK,
    corpDeck: ONR_V1_9_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v194CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_4_RUNNER_DECK,
    corpDeck: ONR_V1_9_4_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v195CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_5_RUNNER_DECK,
    corpDeck: ONR_V1_9_5_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v196CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_6_RUNNER_DECK,
    corpDeck: ONR_V1_9_6_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v197CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_7_RUNNER_DECK,
    corpDeck: ONR_V1_9_7_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v198CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_8_RUNNER_DECK,
    corpDeck: ONR_V1_9_8_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v199CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_9_RUNNER_DECK,
    corpDeck: ONR_V1_9_9_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1911HiddenZoneGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1912CounterRecurringGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1913DamagePreventionGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1914TraceTagResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK,
    corpDeck: ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1915RunAccessGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK,
    corpDeck: ONR_V1_9_15_RUN_ACCESS_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1916ProgramSubtypeGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK,
    corpDeck: ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1917GenericAssetGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK,
    corpDeck: ONR_V1_9_17_GENERIC_ASSET_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1919AgendaOveradvanceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
    corpDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export const MECHANIC_SMOKE_CARD_IDS = {
  counterRecurring: ONR_V1_9_12_RELEASE_CARD_IDS,
  damagePrevention: ONR_V1_9_13_RELEASE_CARD_IDS,
  traceTags: ONR_V1_9_14_WIP_CARD_IDS,
  traceTagRunner: ONR_V1_9_14_RUNNER_CARD_IDS,
  runAccess: ONR_V1_9_15_WIP_CARD_IDS,
  programSubtypeHosting: ONR_V1_9_16_WIP_CARD_IDS,
  assetNodeEffects: ONR_V1_9_17_WIP_CARD_IDS,
  serverUpgrades: ONR_V1_9_18_WIP_CARD_IDS,
  agendaScoring: ONR_V1_9_19_WIP_CARD_IDS,
  globalModifiers: ONR_V1_9_20_WIP_CARD_IDS,
  randomEffects: ONR_V1_9_21_WIP_CARD_IDS,
  longtailEffects: ONR_V1_9_22_WIP_CARD_IDS,
} as const;

export const MECHANIC_SMOKE_DECKS = {
  hiddenZone: {
    runner: ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK,
    corp: ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK,
  },
  counterRecurring: {
    runner: ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK,
    corp: ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK,
  },
  damagePrevention: {
    runner: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK,
    corp: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK,
  },
  traceTags: {
    runner: ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK,
    corp: ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK,
  },
  runAccess: {
    runner: ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK,
    corp: ONR_V1_9_15_RUN_ACCESS_CORP_DECK,
  },
  programSubtypeHosting: {
    runner: ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK,
    corp: ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK,
  },
  assetNodeEffects: {
    runner: ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK,
    corp: ONR_V1_9_17_GENERIC_ASSET_CORP_DECK,
  },
  agendaScoring: {
    runner: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
    corp: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
  },
  globalModifiers: {
    runner: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
    corp: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
  },
} as const;

export const MECHANIC_SMOKE_GAMES = {
  hiddenZone: v1911HiddenZoneGame,
  counterRecurring: v1912CounterRecurringGame,
  damagePrevention: v1913DamagePreventionGame,
  traceTags: v1914TraceTagResourceGame,
  runAccess: v1915RunAccessGame,
  programSubtypeHosting: v1916ProgramSubtypeGame,
  assetNodeEffects: v1917GenericAssetGame,
  agendaScoring: v1919AgendaOveradvanceGame,
} as const;

export function originalsetReorderCounterRunlockGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: {
      id: "originalset_spotcheck_reorder_counter_runlock_runner",
      name: "Originalset Spotcheck Reorder Counter Runlock Runner",
      side: "runner",
      identity: 587,
      cards: [
        { id: 226, quantity: 2 },
        { id: 218, quantity: 1 },
        { id: 233, quantity: 2 },
        { id: 235, quantity: 3 },
        { id: 244, quantity: 1 },
        { id: 267, quantity: 1 },
        { id: 591, quantity: 3 },
        { id: 597, quantity: 3 },
        { id: 595, quantity: 8 },
      ],
    },
    corpDeck: {
      id: "originalset_spotcheck_reorder_counter_runlock_corp",
      name: "Originalset Spotcheck Reorder Counter Runlock Corp",
      side: "corp",
      identity: 3,
      cards: [
        { id: 407, quantity: 1 },
        { id: 415, quantity: 3 },
        { id: 445, quantity: 2 },
        { id: 454, quantity: 2 },
        { id: 466, quantity: 1 },
        { id: 474, quantity: 1 },
        { id: 480, quantity: 2 },
        { id: 484, quantity: 2 },
        { id: 524, quantity: 1 },
        { id: 559, quantity: 1 },
        { id: 588, quantity: 3 },
        { id: 589, quantity: 3 },
        { id: 590, quantity: 3 },
        { id: 596, quantity: 6 },
      ],
    },
    agendaPointsToWin: 7,
  });
}

export function encounterIce(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: number,
): GameState {
  let next = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === serverId,
  );
  next = apply(
    next,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(next, action) === definitionId,
  );
  if (
    next.timingPoint === "run.jack_out_window" &&
    next.run?.phase === "movement"
  ) {
    next = apply(next, "runner", (action) => action.type === "continue_run");
  }
  return next;
}

export function breakCurrentSubroutine(
  state: GameState,
  breakerDefinitionId: number,
  subroutineIndex: number,
): GameState {
  const breakerId = state.runner.rig.programs.find(
    (id) => state.cardInstances[id]?.definitionId === breakerDefinitionId,
  );
  if (!breakerId) throw new Error(`Missing breaker ${breakerDefinitionId}`);
  let next = state;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const breakerAction = getLegalActions(next, "runner").find(
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === breakerId &&
        action.payload?.subroutineIndex === subroutineIndex,
    );
    if (breakerAction) {
      return apply(
        next,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === breakerId &&
          action.payload?.subroutineIndex === subroutineIndex,
      );
    }
    const pumpAction = getLegalActions(next, "runner").find(
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === breakerId,
    );
    if (!pumpAction) break;
    next = apply(
      next,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === breakerId,
    );
  }
  throw new Error(
    `Missing break action for ${breakerDefinitionId} subroutine ${subroutineIndex}`,
  );
}

export function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const selected = mustAction(state, side, predicate);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

export function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionId: string,
): GameState {
  return applyChoices(state, side, [selectedOptionId]);
}

export function applyChoices(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const selected = mustAction(
    state,
    side,
    (action) => action.type === "resolve_choice",
  );
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

export function mustAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): LegalAction {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  if (!selected) throw new Error("Missing legal action");
  return selected;
}

export function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

export function toRunnerTurnFromCorpMain(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

export function sourceDefinition(
  state: GameState,
  action: LegalAction,
): CardDefinitionId | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  )
    return undefined;
  return state.cardInstances[action.source]?.definitionId;
}

export function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  const scoredPoints = ids.reduce((sum, id) => {
    const instance = state.cardInstances[id];
    const basePoints =
      instance === undefined
        ? 0
        : (CARD_DEFINITIONS_BY_ID[instance.definitionId]?.agendaPoints ?? 0);
    const bonusPoints = instance?.counters?.agenda ?? 0;
    const spentPoints = Math.max(
      0,
      Math.floor(instance?.agendaPointsSpent ?? 0),
    );
    return sum + Math.max(0, basePoints + bonusPoints - spentPoints);
  }, 0);
  return side === "corp"
    ? scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
    : scoredPoints;
}

export function cardCounterAmount(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return state.cardInstances[cardId]?.counters?.[counterType] ?? 0;
}

export function setCardCounterForTest(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    counters: {
      ...(state.cardInstances[cardId]?.counters ?? {}),
      [counterType]: amount,
    },
  };
}

export function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "v093_test_choice",
    prompt: "private prompt",
    kind: "select_option",
    options: [
      { id: "keep", label: "Keep private option" },
      { id: "ship", label: "Ship private option" },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side",
  };
}

export function moveRunnerCardToGrip(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function scoreRunnerAgendaForTest(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.scoreArea.includes(id) &&
      !state.corp.scoreArea.includes(id),
  );
  if (!entry) throw new Error(`Missing unscored ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function scoreCorpAgendaForTest(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.scoreArea.includes(id) &&
      !state.corp.scoreArea.includes(id),
  );
  if (!entry) throw new Error(`Missing unscored ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.corp.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function moveRunnerCardCopyToGrip(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.rig.programs.includes(id) &&
      !state.runner.rig.hardware.includes(id) &&
      !state.runner.rig.resources.includes(id) &&
      !state.runner.scoreArea.includes(id),
  );
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function putRunnerCardOnTopOfStack(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "stack" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function drawRunnerCardsForTest(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) {
    const id = state.runner.stack.shift();
    if (!id) throw new Error("Missing runner stack card");
    state.runner.grip.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
    };
  }
}

export function moveCorpCardToHq(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function moveCorpCardCopyToHq(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId && !state.corp.hq.includes(id),
  );
  if (!entry) throw new Error(`Missing HQ copy ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function moveCorpCardToArchives(
  state: GameState,
  definitionId: number,
  faceup = true,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.archives.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "archives" },
    faceup,
    rezzed: faceup,
  };
  return id;
}

export function keepOnlyCorpHqCard(state: GameState, id: CardInstanceId): void {
  const movedToRd = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.hq = [id];
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

export function keepOnlyCorpHqCards(
  state: GameState,
  ids: CardInstanceId[],
): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.hq.filter((cardId) => !keep.has(cardId));
  state.corp.hq = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

export function keepOnlyCorpArchivesCards(
  state: GameState,
  ids: CardInstanceId[],
): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

export function putCorpCardOnTopOfRd(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function putCorpIceOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function putCorpIceCopyOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: number,
): CardInstanceId {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Missing server");
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !server.ice.includes(id as CardInstanceId),
  );
  if (!entry) throw new Error(`Missing ICE copy ${definitionId}`);
  const id = entry[0] as CardInstanceId;
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function putCorpRootInRemote(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  );
  if (!server) {
    server = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function installRunnerProgramForTest(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function installRunnerHardwareForTest(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.hardware.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function installRunnerResourceForTest(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.resources.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function installRunnerProgramCopyForTest(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.rig.programs.includes(id),
  );
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function emptyRunnerGripForTest(state: GameState): void {
  for (const id of state.runner.grip.slice()) {
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
  }
}

export function scoreTwoAgendasForTest(state: GameState): void {
  for (let index = 0; index < 2; index += 1) {
    const entry = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        card.definitionId === 588 &&
        !state.corp.scoreArea.includes(id),
    );
    if (!entry) throw new Error("Missing agenda");
    const id = entry[0];
    removeEverywhere(state, id);
    state.corp.scoreArea.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
  }
}

export function findCard(
  state: GameState,
  definitionId: number,
): CardInstanceId {
  const entries = Object.entries(state.cardInstances).filter(
    ([, card]) => card.definitionId === definitionId,
  );
  const entry =
    entries.find(
      ([id]) =>
        !state.corp.scoreArea.includes(id) &&
        !state.runner.scoreArea.includes(id),
    ) ?? entries[0];
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0];
}

export function removeEverywhere(state: GameState, id: string): void {
  state.corp.hq = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
  state.corp.archives = state.corp.archives.filter((cardId) => cardId !== id);
  state.corp.scoreArea = state.corp.scoreArea.filter((cardId) => cardId !== id);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((cardId) => cardId !== id);
    server.root = server.root.filter((cardId) => cardId !== id);
  }
  state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
  state.runner.stack = state.runner.stack.filter((cardId) => cardId !== id);
  state.runner.heap = state.runner.heap.filter((cardId) => cardId !== id);
  state.runner.scoreArea = state.runner.scoreArea.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (cardId) => cardId !== id,
  );
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter(
      (cardId) => cardId !== id,
    );
    state.specialZones.removedFromGame =
      state.specialZones.removedFromGame.filter((cardId) => cardId !== id);
  }
}
