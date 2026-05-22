---
activityId: act-2026-05-22-ai-decision-trace-schema-top-alternatives
status: inbox
kind: architecture
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-22-ai-decision-trace-contract
resultArtifacts: []
checks: []
---

# KI-Trace um Top-Alternativen und Score-Komponenten erweitern

## Ziel

Die KI-Entscheidungsdaten sollen pro KI-Schritt nicht nur die gewählte Aktion erklären, sondern auch die wichtigsten Alternativen, Score-Komponenten, Ausschlussgründe und die aktuelle Langfriststrategie side-sicher liefern.

## Kontext und Quellen

- Nutzerwunsch: "Was sind die Alternativen? Wie werden sie bewertet? Was nehme ich raus? Was ist vielleicht die Langfriststrategie?"
- Nutzerpräzisierung: Anzeige soll zuerst Metaebene zeigen und Details erst aufklappen.
- Bestehende KI-Planer sortieren Kandidaten bereits:
  - `packages/ai/src/runner-plans.ts`
  - `packages/ai/src/corp-plans.ts`
- Bestehender Shared-Vertrag:
  - `packages/shared/src/index.ts` mit `AiDecisionDebug` und Sanitizer.

## Scope

- Versioniertes Trace-/Debug-Schema um Felder wie `summary`, `rankedAlternatives`, `scoreBreakdown`, `whyNot`, `longTermPlan`, `warnings` und `detailSections` erweitern oder ergänzendes Trace-Objekt einführen.
- Runner- und Korp-Planentscheidungen so erweitern, dass Top-N-Kandidaten side-sicher verfügbar werden.
- Score-Komponenten auf verständliche Kategorien abbilden, z. B. Economy, Run-Kosten, Serverwert, Agenda-Risiko, Scoring-Fenster, sichtbare Gefahr, Doctrine-Gewicht.
- Ausschlussgründe und Unsicherheiten abstrakt formulieren, ohne verdeckte Karten oder private Wahrheit zu nennen.
- Sanitizer und Typen anpassen.

## Nicht im Scope

- Keine Änderung daran, welche Aktion die KI auswählt.
- Keine neue KI-Strategie, keine Gewichtungsänderung und keine Balance-Korrektur.
- Keine Persistenz in SQLite.
- Keine Backend-/Wartungsseite.
- Keine ungefilterte Ausgabe von `AIInput`, Belief-State-Rohdaten, FullState oder Hidden-Zonen.

## Akzeptanzkriterien

- [ ] Pro KI-Entscheidung stehen gewählte Aktion, Kurzgrund und Top-Alternativen strukturiert zur Verfügung.
- [ ] Score-Komponenten sind für die Anzeige maschinenlesbar und menschenverständlich benannt.
- [ ] Detaildaten enthalten keine verbotenen Hidden-Info-/FullState-/Token-/Decklisten-Muster.
- [ ] Bestehende DecisionDebug-Redaction-Tests werden erweitert oder neue Tests decken die Trace-Felder ab.
- [ ] Die Änderung verändert nicht die deterministische Aktionswahl bei unverändertem sichtbarem Input.

## Umsetzungshinweise

- Der erste Schnitt kann Top 3 oder Top 5 Alternativen begrenzen.
- Lange Evidence-Listen sollten bereits im KI-Paket gekürzt und klassifiziert werden, damit die Backend-Anzeige nicht raten muss.
- Metaebene und Detaildaten sollten getrennt sein, damit die Wartungs-UI nicht aus Rohdetails eine Zusammenfassung bauen muss.

## Ergebnisnotiz

Noch offen.
