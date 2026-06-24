import type { CardImplementationDefinition } from "../types";
import { allNighterImplementation } from "../onr-v1/runner/preps/all-nighter";
import { anonymousTipImplementation } from "../onr-v1/runner/preps/anonymous-tip";
import { arasakaOwnsYouImplementation } from "../onr-v1/runner/preps/arasaka-owns-you";
import { bodyweightSyntheticBloodImplementation } from "../onr-v1/runner/preps/bodyweight-synthetic-blood";
import { coreCommandJettisonIceImplementation } from "../onr-v1/runner/preps/core-command-jettison-ice";
import { custodialPositionImplementation } from "../onr-v1/runner/preps/custodial-position";
import { dealWithMilitechImplementation } from "../onr-v1/runner/preps/deal-with-militech";
import { desperateCompetitorImplementation } from "../onr-v1/runner/preps/desperate-competitor";
import { editedShippingManifestsImplementation } from "../onr-v1/runner/preps/edited-shipping-manifests";
import { executiveWiretapsImplementation } from "../onr-v1/runner/preps/executive-wiretaps";
import { forgedActivationOrdersImplementation } from "../onr-v1/runner/preps/forged-activation-orders";
import { fortressRespecificationImplementation } from "../onr-v1/runner/preps/fortress-respecification";
import { forgottenBackupChipImplementation } from "../onr-v1/runner/preps/forgotten-backup-chip";
import { gideonsPawnshopImplementation } from "../onr-v1/runner/preps/gideons-pawnshop";
import { huntClubBbsImplementation } from "../onr-v1/runner/preps/hunt-club-bbs";
import { hotTipForWnsImplementation } from "../onr-v1/runner/preps/hot-tip-for-wns";
import { iceAndDatasGuideToTheNetImplementation } from "../onr-v1/runner/preps/ice-and-datas-guide-to-the-net";
import { ifYouWantItDoneRightImplementation } from "../onr-v1/runner/preps/if-you-want-it-done-right";
import { insideJobImplementation } from "../onr-v1/runner/preps/inside-job";
import { jackNJoeImplementation } from "../onr-v1/runner/preps/jack-n-joe";

export const CARD_IMPLEMENTATION_GROUP_001 = [
  allNighterImplementation,
  anonymousTipImplementation,
  arasakaOwnsYouImplementation,
  bodyweightSyntheticBloodImplementation,
  coreCommandJettisonIceImplementation,
  custodialPositionImplementation,
  dealWithMilitechImplementation,
  desperateCompetitorImplementation,
  editedShippingManifestsImplementation,
  executiveWiretapsImplementation,
  forgedActivationOrdersImplementation,
  fortressRespecificationImplementation,
  forgottenBackupChipImplementation,
  gideonsPawnshopImplementation,
  huntClubBbsImplementation,
  hotTipForWnsImplementation,
  iceAndDatasGuideToTheNetImplementation,
  ifYouWantItDoneRightImplementation,
  insideJobImplementation,
  jackNJoeImplementation,
] as const satisfies readonly CardImplementationDefinition[];
