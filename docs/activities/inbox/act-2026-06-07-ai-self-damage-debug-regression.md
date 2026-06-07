---
activityId: act-2026-06-07-ai-self-damage-debug-regression
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-self-damage-survival-guard
  - act-2026-06-07-ai-bad-publicity-relevance-gating
resultArtifacts: []
checks: []
---

# Self-Damage- und Bad-Publicity-Entscheidungen debuggen

## Ziel

Die neue Self-Damage- und Bad-Publicity-Bewertung soll über redigierte DecisionDebug-/AI-Debugfacts nachvollziehbar und durch fokussierte Regressionen abgesichert sein. Spätere Playtests sollen klar zeigen, warum eine riskante Karte blockiert, niedrig bewertet oder als Immediate-Win-Closeout erlaubt wurde.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Die Runner-KI spielte `Faked Hit` in eine unmittelbare Flatline.
- Vorpakete:
  - `act-2026-06-07-ai-faked-hit-self-damage-semantics`
  - `act-2026-06-07-ai-self-damage-survival-guard`
  - `act-2026-06-07-ai-bad-publicity-relevance-gating`
- Relevante Testanker voraussichtlich:
  - `packages/ai/src/index.test.ts`
  - `packages/ai/src/tactical-plans.test.ts`
  - `packages/ai/src/runner-tactical-goals.test.ts`
  - `packages/ai/src/runner-strategic-intent.test.ts`
  - `packages/ai/src/runner-golden-deck-debug.test.ts`

## Scope

- Redigierte Debugfacts ergänzen oder prüfen:
  - `selfDamageAmount`,
  - `selfDamageType`,
  - `selfDamageUnpreventable`,
  - `handBeforeAction`,
  - `handAfterActionCost`,
  - `survivesSelfDamage`,
  - `immediateBadPublicityCloseout`,
  - `badPublicityRelevance`,
  - `why_self_damage_action_blocked`,
  - `why_self_damage_action_allowed`,
  - `why_bad_publicity_support_only`.
- Regressionen für `Faked Hit` und generische Self-Damage-Fälle ergänzen:
  - nur `Faked Hit` auf der Hand, Korp BP < 6 -> nicht wählen,
  - `Faked Hit` plus 1 weitere Handkarte, Korp BP < 6 -> nicht wählen,
  - `Faked Hit` plus 2+ verfügbare Handkarten, Korp BP < 6 -> nicht durch Survival blockiert, aber Bad-Publicity-Relevanz niedrig ohne Deckplan,
  - Korp BP 6 -> `Faked Hit` darf als BP-7-Closeout bewertet werden,
  - final ausgewählte Action stammt aus `input.legalActions`.
- Redaction absichern:
  - keine vollständige Handliste in öffentlichen Debugfacts,
  - keine verdeckten Korp-Karten,
  - keine FullState-/Storage-/`privatePayload`-Daten,
  - keine lokalen Pfade.

## Nicht im Scope

- Keine neue Bewertungslogik außer minimal nötiger Debug-Anbindung.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine Web-UI-Politur oder Browser-E2E.
- Keine neue Bad-Publicity-Strategy-ID.

## Akzeptanzkriterien

- [ ] DecisionDebug oder gleichwertige AI-Debugfacts erklären den Self-Damage-Block für den beobachteten `Faked Hit`-Fall.
- [ ] Debugfacts erklären den Sonderfall, dass lethal Self-Damage bei unmittelbarem BP-7-Closeout erlaubt sein kann.
- [ ] Debugfacts erklären Bad Publicity ohne Deckplan als Support-only beziehungsweise niedrige Relevanz.
- [ ] Regressionen decken die konkreten Faked-Hit-Handgrößen- und BP-Zählerfälle ab.
- [ ] Redaction-Tests bestätigen, dass keine Hidden-Info oder privaten Daten ausgegeben werden.
- [ ] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Wenn die Vorpakete bereits alle Regressionen enthalten, dieses Paket kann als Review-/Nachhärtungspaket abgeschlossen werden und muss nur fehlende Debug-/Redaction-Prüfungen ergänzen.
- Debugwerte dürfen Counts und Gründe zeigen, aber keine Kartenidentitäten aus verdeckten gegnerischen Zonen und keine vollständige Runner-Handliste in öffentlichen Payloads.

## Ergebnisnotiz

Noch offen.
