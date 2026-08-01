---
activityId: act-2026-08-01-runner-broker-hosted-credit-hint-contract
status: done
kind: fix
area: ai-data
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-01
startedAt: 2026-08-01
completedAt: 2026-08-01
branch: codex/ai-series-82b2-final-remediation
releaseTarget:
blockedBy: []
resultArtifacts:
  - scripts/audit-ai-deck-hint-consumers.ts
  - packages/ai/src/economy-card-hint-contract.test.ts
  - data/local/series-82b2-runner-deck-audit-report-fixed.json
checks:
  - unveränderter Runner-Deck-Consumer-Audit 22 Definitionen / 45 Karten grün, 0 Findings, 0 Warnungen
  - 35 fokussierte Hint-/Capability-Regressionen grün
  - check:ai-economy und check:ai-hint-metadata-contracts grün
  - AI-Typecheck mit 6144 MB Heap grün
  - check:ai-action-capacity-hints scheitert identisch bereits auf main an einer repositoryweiten Normalisierungsabweichung
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

- [x] Der bisher rote Runner-Deck-Consumer-Audit ist mit demselben Deck und
      Behavior-Checkpoint grün.
- [x] Broker weist für die Hosted-Credit-Aufladung Engine- und Hint-Menge 3
      aus; `hosted_credit_add_hint_mismatch` verschwindet ohne Audit-Ausnahme.
- [x] Bestehende Bank-Load-/Cashout-Semantik und Economy-Vertragstests bleiben
      grün.
- [x] Keine Planinstanz, Route, `PlanExecutionOrigin`, Actionwahl oder
      Choice-Payload ändert sich durch den Datenfix.
- [x] Hint-Schema-/Coverage-Gates, AI-Typecheck und `git diff --check` sind
      grün.

## Umsetzungshinweise

- Dies ist ein Datenvertrag-Fix, kein zweiter Broker-Verhaltensfix.
- Die generische Poolbeschreibung soll die Engine-LegalAction beschreiben;
  der Credit-Bank-Plan bleibt alleiniger fachlicher Owner für Load, Hold und
  Cashout.

## Ergebnisnotiz

Die Detailprüfung hat die Ursache gegenüber der ersten Diagnose präzisiert:
Der aktive Broker-Hint enthielt die korrekte 3-Credit-Menge bereits als
`counter_economy`/`bank_load`. Der generische Audit akzeptierte jedoch nur
`finite_economy_pool` und erzeugte damit einen falschen Widerspruch. Der
Consumer versteht nun beide kanonischen Hosted-Credit-Dialekte: einen
endlichen Pool oder eine wiederaufladbare Bank. Broker bleibt ausdrücklich
kein endlicher Pool; dadurch entstehen weder doppelte Economy-Effekte noch
eine Verhaltensänderung. Der unveränderte historische Deck-/Behavior-
Checkpoint läuft danach mit 0 Findings und 0 Warnungen durch.

Das themenfremde Gate `check:ai-action-capacity-hints` ist weiterhin rot,
scheitert aber bytegleich auch im unveränderten primären `main`-Checkout. Es
wurde deshalb nicht durch eine repositoryweite Normalisierung in dieses Paket
gezogen.
