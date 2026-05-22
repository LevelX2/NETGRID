---
activityId: act-2026-05-22-ai-decision-trace-contract
status: inbox
kind: architecture
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# KI-Entscheidungslog-Vertrag für lokale Analyse festlegen

## Ziel

Ein knapper Architekturvertrag definiert, wie NETGRID KI-Entscheidungen lokal nachvollziehbar protokolliert, ohne `AIInput`, FullState, Hidden-Info, Decklisten oder normale Serverlogs zu kontaminieren.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-22: private Backend-/Wartungsansicht für KI-Entscheidungen, auswählbar pro Match, historisch durchklickbar und live auf zweitem Bildschirm beobachtbar.
- Gewünschte Anzeige: zuerst Metaebene pro Entscheidung, Details erst per Aufklappen/Drilldown.
- Bestehende Anker:
  - `packages/shared/src/index.ts`: `AiDecisionDebug` und `sanitizeAiDecisionDebug`.
  - `packages/ai/src/runner-plans.ts` und `packages/ai/src/corp-plans.ts`: Planbewertung und Score-Sortierung.
  - `apps/server/src/multiplayer.ts`: KI-Schritte und Replay-DecisionDebug-Projektion.
  - `docs/releases/v2/v2-7-observability/observability-redaction-baseline.md`: `DecisionDebug` bleibt aus normalen Logs/Observability heraus.
  - `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`: `D6_ai_debug_data` ist kein Standardzugriff.

## Scope

- Vertrag für `AiDecisionTrace` oder ähnliches Zielobjekt festlegen.
- Trennung definieren zwischen gespeicherten Roh-Trace-Daten, backendseitigem Anzeige-ViewModel und HTML-Rendering im Webclient.
- Festlegen, welche Felder in Metaebene, Detailansicht, Export und Live-Ansicht erlaubt sind.
- Aktivierungsmodell festlegen: standardmäßig aus, pro Match über erweiterte Optionen oder lokale Diagnoseeinstellung aktivierbar.
- Datenklassifikation und Zugriff festlegen: lokale private Maintenance-/Analysefläche, nicht normale Spiel-UI.

## Nicht im Scope

- Keine Implementierung von Storage, API oder UI.
- Keine Änderung an KI-Auswahl, LegalActions, `applyAction`, Engine-Regeln, Replay-StateHash oder Public Replay.
- Kein öffentliches, accountbasiertes oder moderatorisches Freigabemodell.
- Kein Speichern von HTML in der Datenbank.

## Akzeptanzkriterien

- [ ] Der Vertrag benennt ein versioniertes Trace-Schema mit Meta-, Detail- und optionalen Exportfeldern.
- [ ] Der Vertrag legt fest, dass DB strukturiertes JSON/Spalten speichert und HTML erst in der Wartungsansicht gerendert wird.
- [ ] Hidden-Info-, Token-, Decklisten-, FullState-, `privatePayload`-, `cardInstances`-, `AIInput`- und lokale-Pfad-Verbote sind ausdrücklich enthalten.
- [ ] Der Vertrag beschreibt Meta/Drilldown als Anzeigeprinzip.
- [ ] Folgepakete für Trace-Erweiterung, Storage/API, Wartungs-UI, Live-Follow und Tests/Export sind referenziert oder ableitbar.

## Umsetzungshinweise

- Passender Zielort ist wahrscheinlich `docs/architecture/ai/` oder ein kleiner Planungsvertrag unter `docs/releases/v2/v2-7-observability/`.
- `AiDecisionDebug` darf als Basis dienen, sollte aber nicht direkt als unkontrolliertes Persistenzformat behandelt werden.
- Die Anzeigeprojektion sollte bewusst zwischen "sichtbarer Fakt", "Hypothese", "Unsicherheit" und "Bewertungsgrund" unterscheiden.

## Ergebnisnotiz

Noch offen.
