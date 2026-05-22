---
activityId: act-2026-05-22-ai-trace-action-level-alternatives
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
  - act-2026-05-22-ai-decision-trace-schema-top-alternatives
resultArtifacts: []
checks: []
---

# KI-Trace: Action-Level-Alternativen im gewählten Plan

## Ziel

Der KI-Trace soll innerhalb des gewählten Plans nicht nur Plan-Alternativen zeigen, sondern auch die konkret legalen Einzelaktionen mit Bewertung. Bei Economy-Entscheidungen muss sichtbar werden, ob z. B. `Broker: 3 Credits auf Broker legen` als LegalAction vorhanden war, wie sie bewertet wurde und warum stattdessen `runner.gain_credit` gewählt wurde.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-22: Runner-KI nahm einen normalen Credit, obwohl ein installierter `Broker` im Rig lag.
- Aktueller Trace `ai_trace_match_00ff5d28ba6a855e_1` zeigt:
  - `selectedActionId: runner.gain_credit`
  - `planKind: recover_economy`
  - `planId` enthält eine Broker-Action und `runner.gain_credit`
  - Evidence enthält `installed_economy_kind:pool_build`, `installed_economy_future_pool_after:3`, `economy_need:acute`
  - ScoreBreakdown enthält `installedEconomy: -80` mit Grund `installed_economy_pool_build_deferred_for_credit_need`
- Erledigtes Vorgängerpaket:
  - `docs/activities/done/act-2026-05-22-ai-decision-trace-schema-top-alternatives.md`
- Relevante Codepfade:
  - `packages/ai/src/runner-plans.ts`
  - `packages/ai/src/corp-plans.ts`
  - `packages/shared/src/index.ts`
  - `apps/server/src/multiplayer.ts`

## Scope

- `AiDecisionDebug` oder das AI-Trace-Detail um eine begrenzte Action-Level-Projektion erweitern.
- Für den gewählten Plan und optional die Top-Plan-Alternativen eine Liste der wichtigsten LegalActions liefern, z. B.:
  - `actionId`
  - `actionType`
  - side-sichere Quelle oder Quellrolle
  - optional sichtbarer Kartenname, falls im PlayerView bekannt
  - `selected: true | false`
  - `priority` oder Action-Score innerhalb des Plans
  - `whyChosen` beziehungsweise `whyNot`
  - economy-spezifische Felder wie `immediateGain`, `netCredits`, `storedCredits`, `futurePoolAfter`, `economyNeed`, sofern side-sicher ableitbar
- Runner- und Korp-Planer sollen die Daten aus der gleichen Logik ableiten, die auch die Aktionsauswahl trifft.
- Sanitizer und Redaction-Tests anpassen, damit keine FullState-, Hidden-Zone-, Token-, Decklisten- oder private AIInput-Daten in Trace-Details landen.

## Nicht im Scope

- Keine Änderung an der tatsächlichen KI-Aktionswahl.
- Keine neue Broker-Gewichtung; das ist ein eigenes Folgepaket.
- Keine UI-Umsetzung der Anzeige; die Wartungsseite kann diese Daten erst in einem separaten Paket rendern.
- Keine Roh-Ausgabe kompletter `legalActions`, `AIInput`, `PlayerView` oder Belief-State-Objekte.

## Akzeptanzkriterien

- [ ] Für den Trace-Beispielfall wäre erkennbar, dass `Broker: 3 Credits auf Broker legen` als Action vorhanden war und als Pool-Aufbau bewertet wurde.
- [ ] Die gewählte Action `runner.gain_credit` ist innerhalb der Action-Liste eindeutig markiert.
- [ ] Economy-Actions zeigen side-sichere Kennzahlen wie unmittelbarer Gewinn, gespeicherte Credits und zukünftiger Poolwert.
- [ ] Action-Level-Daten sind begrenzt, deterministisch sortiert und nicht größer als nötig.
- [ ] Redaction-/Sanitizer-Tests decken verschachtelte Action-Level-Felder ab.
- [ ] Bestehende Plan-Alternative-Trace-Tests bleiben grün.

## Umsetzungshinweise

- In `runner-plans.ts` existiert bereits `actionPriority()` und `classifyInstalledEconomyAction()`. Diese Informationen sollten für Trace-Daten wiederverwendet werden, statt eine zweite Bewertung daneben zu bauen.
- Für Broker ist besonders wichtig:
  - Load: `pool_build`, `immediateGain: 0`, `futurePoolAfter: 3`
  - Take: `pool_payout`, sichtbarer gespeicherter Wert als Auszahlung
  - Basic Credit: direkte `gain_credit`-Action mit sofortigem +1
- Wenn Detaildaten für Korp noch nicht symmetrisch verfügbar sind, darf der erste Schnitt Runner-first sein, solange der Vertrag erweiterbar bleibt.

## Ergebnisnotiz

Offen.
