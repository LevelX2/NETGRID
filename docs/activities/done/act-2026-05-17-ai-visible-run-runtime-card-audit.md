---
activityId: act-2026-05-17-ai-visible-run-runtime-card-audit
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/visible-run-analysis.ts
  - packages/ai/src/index.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
---

# Sichtbare Runanalyse gegen Runtime-ICE und Breaker auditieren

## Ziel

Die sichtbare Runanalyse der KI soll alle aktuell `ai_supported` Runtime-ICE und sichtbaren Breaker zuverlässig auflösen können. Fehlende Demo- oder Runtime-Definitionen dürfen nicht dazu führen, dass bekannte sichtbare Karten fälschlich als unbekannt oder unbreakable bewertet werden.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitte `P0: Runtime-Kartenabdeckung für sichtbare Runanalyse prüfen`, `Runner-Analyse` und `Offene Fragen / nicht belegte Annahmen`.
- Genannter Startpunkt: `packages/ai/src/visible-run-analysis.ts`.
- Offene Frage aus der Analyse: Prüfen, ob `DEMO_CARDS_BY_ID` für die aktive O:NR-Kartenlage ausreicht oder ob die Runanalyse Runtime-Definitionen nutzen muss.

## Scope

- Inventur der sichtbaren Runanalyse: Welche Kartendatenquelle wird genutzt, welche ICE-/Breaker-Felder werden benötigt, welche Karten fallen heute durch?
- Abgleich gegen aktive `ai_supported` ICE und Breaker aus Catalog-/AI-Hint-/Runtime-Daten.
- Repräsentative Testpaare für Barrier/Code Gate/Sentry und passende Fracter/Decoder/Killer aufnehmen, inklusive Stärke-, Pump-, Break- und Credit-Fällen.
- Ergebnis als kleiner Audit-Report oder als Testname/Fixture-Tabelle nachvollziehbar machen.
- Falls die Analyse echte Definitionslücken findet, kleinsten Fix im gleichen Paket nur dann umsetzen, wenn er keine Engine- oder Catalog-Promotion verändert.

## Nicht im Scope

- Keine neue Kartenfreigabe, keine Änderung an `ai_supported`, `deck_legal` oder Runtime-Promotion.
- Keine Regeländerung an ICE, Breakern, Subroutinen, Encounter oder Access.
- Keine Nutzung verdeckter ICE-Titel, verdeckter Corp-Handkarten oder gegnerischer Decklisten.
- Keine umfassende Runner-Mehrzugstrategie; das ist ein separates P1-Paket.

## Akzeptanzkriterien

- [x] Es gibt eine belastbare Liste oder Testtabelle, welche aktiven AI-supported ICE/Breaker von der sichtbaren Runanalyse aufgelöst werden.
- [x] Kein sichtbares AI-supported Breaker-/ICE-Paar wird nur wegen fehlender Kartendefinition als unbekannt oder unbreakable behandelt.
- [x] Mindestens drei repräsentative O:NR-Paare decken Breaker-Typ, Stärke- und Kostenbewertung ab.
- [x] Hidden-Info-Varianten mit gleicher sichtbarer Lage liefern gleiche Runanalyse-Ergebnisse.
- [x] AI-Tests und Typecheck sind grün oder echte Folgearbeiten sind als neue Activities benannt.

## Umsetzungshinweise

- Vor einem Umbau erst prüfen, ob ein schmaler Adapter von Runtime-/Catalog-Daten in das vorhandene Analyseformat reicht.
- Tests sollten nicht auf historische Release-Batchnamen angewiesen sein, sondern auf fachliche Rollen wie `visible sentry with killer`.
- No-Cheat-Gate: Nur eigene sichtbare Breaker, bekannte/rezzed ICE und side-sichere PublicEvents verwenden.

## Ergebnisnotiz

Abgeschlossen. Die sichtbare Runanalyse nutzt weiterhin geprüfte Shared-Mechanikdefinitionen, löst Runtime-Katalog-IDs aber über `engineCardId` auf und normalisiert Runtime-/Engine-Subtypen wie `code gate`/`code_gate`. Die Testtabelle deckt aktive AI-supported ICE/Breaker sowie die O:NR-Paare `Dwarf`/`Wall of Static`, `Codecracker`/`Quandary` und `Evil Twin`/`Pi in the 'Face` ab; Hidden-Info-Varianten mit gleicher sichtbarer Lage liefern dieselbe Analyse.
