---
activityId: act-2026-08-01-runner-broker-hosted-credit-hint-contract
status: inbox
kind: fix
area: ai-data
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-01
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner-KI: Broker-Hint an generischen Hosted-Credit-Vertrag angleichen

## Ziel

Der aktive KI-Kartenhinweis für `Broker` soll die von der Engine angebotene
Aufladung um drei Hosted Credits vollständig und maschinenlesbar abbilden.
Spezialisierter Bank-Load/-Cashout-Vertrag und generischer
Hosted-Credit-Consumer dürfen nicht widersprüchliche Aussagen über dieselbe
LegalAction liefern.

## Kontext und Quellen

- Vollständiger Runner-Deck-Consumer-Audit der Serie
  `series_82b2d391315f055b` mit 22 Definitionen und 45 Karten.
- Der Behavior-Checkpoint ist grün, der anschließende Consumer-Audit scheitert
  genau an `onr_v1_154_broker` mit
  `hosted_credit_add_hint_mismatch`, Engine-Mengen `[3]`, Hint-Pool-Mengen
  `[]`.
- Vollständige Evidence:
  `docs/reviews/ai/series-82b2-final-full-decision-audit-2026-08-01.md`, F5.
- Relevante Gates und Verträge:
  - `scripts/audit-ai-deck-hint-consumers.ts`
  - `scripts/audit-ai-economy-contracts.mjs`
  - `packages/ai/src/economy-card-hint-contract.test.ts`

## Scope

- Engine-Effekt und aktive Hintstruktur für Broker gemeinsam prüfen.
- Den aktiven Hint minimal so ergänzen, dass die 3-Credit-Aufladung im
  generischen Hosted-Credit-Poolvertrag dieselbe Menge trägt wie die Engine.
- Den spezialisierten `bank_load`-/`bank_cashout`-Vertrag unverändert
  beibehalten und die beiden Darstellungen mit fokussierten Tests koppeln.
- Den unveränderten Runner-Deck-Audit aus der Serie erneut ausführen.

## Nicht im Scope

- Keine Verhaltens-, Planwahl-, Score-, Hold- oder Cashout-Änderung; diese
  gehört ausschließlich zur separaten Broker-Cashout-Activity.
- Keine Änderung an Broker-Kartentext, LegalActions, Engine-Effekten,
  Hosted-Credit-Zahlung, Replay oder StateHash.
- Kein Karten-ID-Sonderpfad in Runtime, Choice, Resolver oder Planmodul.
- Keine Abschwächung oder Ausnahme im Deck-Consumer-Audit.

## Akzeptanzkriterien

- [ ] Der bisher rote Runner-Deck-Consumer-Audit ist mit demselben Deck und
      Behavior-Checkpoint grün.
- [ ] Broker weist für die Hosted-Credit-Aufladung Engine- und Hint-Menge 3
      aus; `hosted_credit_add_hint_mismatch` verschwindet ohne Audit-Ausnahme.
- [ ] Bestehende Bank-Load-/Cashout-Semantik und Economy-Vertragstests bleiben
      grün.
- [ ] Keine Planinstanz, Route, `PlanExecutionOrigin`, Actionwahl oder
      Choice-Payload ändert sich durch den Datenfix.
- [ ] Hint-Schema-/Coverage-Gates, AI-Typecheck und `git diff --check` sind
      grün.

## Umsetzungshinweise

- Dies ist ein Datenvertrag-Fix, kein zweiter Broker-Verhaltensfix.
- Die generische Poolbeschreibung soll die Engine-LegalAction beschreiben;
  der Credit-Bank-Plan bleibt alleiniger fachlicher Owner für Load, Hold und
  Cashout.

## Ergebnisnotiz

Noch offen.
