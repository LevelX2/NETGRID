import type { ChoiceRequest, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
} from "./data-fort-reclamation-sequence";
import { isScoredIceMarkModifierChoiceSource } from "./ice-transmutation-sequence";
import { orderedFortRebuildPublicPayload } from "./ordered-fort-rebuild-sequence";
import { isPriorityRequisitionChoiceSource } from "./priority-requisition-sequence";
import {
  resolveScoredAgendaSequenceChoice,
  SCORED_AGENDA_CHOICE_RESOLVERS,
} from "./scored-agenda-sequence-registry";
import type { CorpInstallRezSequenceHandlerHost } from "./scored-agenda-sequence-host";
import {
  applySequenceResolution,
  applySequencePayloadPatch,
  corpSequenceContextPayload,
} from "./scored-agenda-sequence-types";
import { isSecurityPurgeInstallTargetChoiceSource } from "./security-purge-sequence";

describe("scored agenda sequence contract matrix", () => {
  it("routes each registered choice source to exactly one resolver", () => {
    const cases: readonly { source: string; resolverId: string }[] = [
      {
        source: "v162.priority_requisition:priority_agenda:8",
        resolverId: "priority_requisition_choice",
      },
      {
        source: "v1922.data_fort_reclamation:data_fort_agenda:8",
        resolverId: "data_fort_reclamation_install_choice",
      },
      {
        source: "v1922.data_fort_reclamation_rez:data_fort_agenda:remote_1:4:8",
        resolverId: "data_fort_reclamation_rez_choice",
      },
      {
        source:
          "v1922.security_purge_install_targets:security_purge_agenda:ice_1:8",
        resolverId: "security_purge_target_choice",
      },
    ];

    for (const candidate of cases) {
      const matchingIds = SCORED_AGENDA_CHOICE_RESOLVERS.filter((resolver) =>
        resolver.matches(candidate.source),
      ).map((resolver) => resolver.id);
      expect(matchingIds).toEqual([candidate.resolverId]);
    }
  });

  it("keeps source recognizers disjoint across representative sequences", () => {
    const recognizers = [
      isPriorityRequisitionChoiceSource,
      isHqToNewRemoteInstallRezChoiceSource,
      isHqToNewRemoteInstallRezRezChoiceSource,
      isSecurityPurgeInstallTargetChoiceSource,
      isScoredIceMarkModifierChoiceSource,
    ];
    const sources = [
      "v162.priority_requisition:priority_agenda:8",
      "v1922.data_fort_reclamation:data_fort_agenda:8",
      "v1922.data_fort_reclamation_rez:data_fort_agenda:remote_1:4:8",
      "v1922.security_purge_install_targets:security_purge_agenda:ice_1:8",
      "v1920.ice_transmutation:transmutation_agenda:8",
    ];

    for (const source of sources) {
      expect(
        recognizers.filter((recognizer) => recognizer(source)),
      ).toHaveLength(1);
    }
  });

  it("does not mutate host state or payload for unknown registered choices", () => {
    const choice: ChoiceRequest = {
      choiceId: "unknown_choice",
      side: "corp",
      source: "v999.unknown_sequence:agenda_1:8",
      prompt: "Unknown",
      kind: "select_option",
      options: [],
      minSelections: 0,
      maxSelections: 0,
      stateVersion: 8,
      visibility: "public",
    };
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;
    const host = {
      state: { pendingChoice: choice },
      legalAction,
    } as unknown as CorpInstallRezSequenceHandlerHost;

    expect(resolveScoredAgendaSequenceChoice(host)).toEqual({
      handled: false,
    });
    expect(host.state.pendingChoice).toBe(choice);
    expect(legalAction.payload).toEqual({ existing: true });
  });

  it("rejects hidden card lists before sequence payload patches mutate", () => {
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;

    expect(() =>
      applySequencePayloadPatch(legalAction, {
        hqCardIds: "secret_card",
      }),
    ).toThrow(/hidden card data/i);
    expect(legalAction.payload).toEqual({ existing: true });
  });

  it("applies sequence resolutions through sanitized payload patches", () => {
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;

    const result = applySequenceResolution(legalAction, {
      result: { handled: true },
      stateChanged: true,
      payloadPatch: { priorityRequisitionChoiceOpened: false },
    });

    expect(result).toEqual({
      handled: true,
      stateChanged: true,
      resolvedPayload: {
        existing: true,
        priorityRequisitionChoiceOpened: false,
      },
    });
    expect(legalAction.payload).toEqual(result.resolvedPayload);
  });

  it("keeps public sequence contexts and ordered-fort payloads count-only", () => {
    expect(() =>
      corpSequenceContextPayload({
        step: "select_hq_cards",
        hqCardIds: "secret_card",
      }),
    ).toThrow(/hidden card data/i);

    const orderedFortPayload = orderedFortRebuildPublicPayload({
      sourceDefinitionId: "onr_proteus_069_pavit-bharat",
      targetServerId: "remote_1",
      removedCardCount: 2,
      replacementCardCount: 2,
      installedIceCount: 1,
      installedRootCount: 1,
    });
    expect(Object.keys(orderedFortPayload)).not.toContain("hqCardIds");
    expect(JSON.stringify(orderedFortPayload)).not.toContain("secret_card");
  });
});
