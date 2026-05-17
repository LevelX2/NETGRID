export type InviteLobbyRedactionLeak = {
  ruleId: string;
  description: string;
  path: string;
  matched: string;
};

type KeyRule = {
  ruleId: string;
  description: string;
  pattern: RegExp;
};

type ValueRule = {
  ruleId: string;
  description: string;
  pattern: RegExp;
};

export const INVITE_LOBBY_FORBIDDEN_KEY_RULES: KeyRule[] = [
  {
    ruleId: "token-or-token-hash-field",
    description: "Invite/lobby metadata must not expose raw tokens or token hashes.",
    pattern: /^(?:token|.*Token|.*TokenHash|tokenHash|joinToken|sessionToken|reconnectToken|hostSessionToken|hostReconnectToken)$/i
  },
  {
    ruleId: "session-id-field",
    description: "Invite/lobby metadata must not expose internal session identifiers.",
    pattern: /^(?:sessionId|sessionIds|sessions)$/i
  },
  {
    ruleId: "decklist-or-deckhash-field",
    description: "Invite/lobby metadata must not expose decklists, deck snapshots, deck cards, or deck hashes.",
    pattern: /^(?:decklist|deckList|deckHash|deckSnapshot|deckSnapshotId|deckCards|cards|privateDeck|privateDeckSnapshots)$/i
  },
  {
    ruleId: "hidden-card-identity-field",
    description: "Invite/lobby metadata must not expose hidden card identities.",
    pattern: /^(?:cardInstances|definitionId|cardDefinitionId|cardId|cardIds|hiddenCard|hiddenCards)$/i
  },
  {
    ruleId: "ai-input-or-decision-debug-field",
    description: "Invite/lobby metadata must not expose AIInput or DecisionDebug diagnostics.",
    pattern: /^(?:AIInput|aiInput|DecisionDebug|decisionDebug|aiDecisionDebug)$/i
  }
];

export const INVITE_LOBBY_FORBIDDEN_VALUE_RULES: ValueRule[] = [
  {
    ruleId: "join-token-query-value",
    description: "Invite/lobby metadata must not embed join-token URLs or query values.",
    pattern: /(?:[?&]joinToken=|joinToken=)[^&\s"]+/i
  },
  {
    ruleId: "token-hash-value",
    description: "Invite/lobby metadata must not expose sha256 token hashes.",
    pattern: /sha256:[a-f0-9]{64}/i
  },
  {
    ruleId: "session-id-value",
    description: "Invite/lobby metadata must not expose generated session IDs.",
    pattern: /\bsession_[a-z0-9_-]+\b/i
  },
  {
    ruleId: "deck-hash-value",
    description: "Invite/lobby metadata must not expose deck hashes.",
    pattern: /\bfnv1a:[a-f0-9]+\b/i
  }
];

export function findInviteLobbyPayloadRedactionLeaks(payload: unknown): InviteLobbyRedactionLeak[] {
  const leaks: InviteLobbyRedactionLeak[] = [];
  visitInviteLobbyPayload(payload, [], leaks, new Set<unknown>());
  return leaks;
}

export function assertInviteLobbyPayloadRedacted(payload: unknown, label = "invite/lobby payload"): void {
  const leaks = findInviteLobbyPayloadRedactionLeaks(payload);
  if (leaks.length === 0) return;
  const details = leaks
    .slice(0, 10)
    .map((leak) => `${leak.ruleId} at ${leak.path}: ${leak.matched}`)
    .join("\n");
  throw new Error(`${label} leaked forbidden invite/lobby metadata:\n${details}`);
}

function visitInviteLobbyPayload(payload: unknown, path: string[], leaks: InviteLobbyRedactionLeak[], seen: Set<unknown>): void {
  if (typeof payload === "string") {
    for (const rule of INVITE_LOBBY_FORBIDDEN_VALUE_RULES) {
      if (rule.pattern.test(payload)) {
        leaks.push({
          ruleId: rule.ruleId,
          description: rule.description,
          path: formatPath(path),
          matched: rule.pattern.source
        });
      }
    }
    return;
  }

  if (!payload || typeof payload !== "object") return;
  if (seen.has(payload)) return;
  seen.add(payload);

  if (Array.isArray(payload)) {
    payload.forEach((entry, index) => visitInviteLobbyPayload(entry, [...path, String(index)], leaks, seen));
    return;
  }

  for (const [key, value] of Object.entries(payload)) {
    const nextPath = [...path, key];
    for (const rule of INVITE_LOBBY_FORBIDDEN_KEY_RULES) {
      if (rule.pattern.test(key)) {
        leaks.push({
          ruleId: rule.ruleId,
          description: rule.description,
          path: formatPath(nextPath),
          matched: key
        });
      }
    }
    visitInviteLobbyPayload(value, nextPath, leaks, seen);
  }
}

function formatPath(path: string[]): string {
  return path.length > 0 ? path.join(".") : "$";
}
