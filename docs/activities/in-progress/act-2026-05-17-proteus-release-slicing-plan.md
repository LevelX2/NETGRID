---
activityId: act-2026-05-17-proteus-release-slicing-plan
status: in_progress
kind: concept
area: docs
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget: Proteus planning
blockedBy:
  - act-2026-05-17-proteus-mechanics-coverage-analysis
resultArtifacts: []
checks: []
---

# Proteus-Umsetzungsfolge in kleine Releases schneiden

## Ziel

Aus der Proteus-Coverage-Analyse soll eine konkrete, kleine bis mittlere Umsetzungsfolge entstehen: erst sichere Karten-/Mechanikcluster, danach riskantere Spezialfamilien, jeweils mit Gate, Tests und AI-Support-Grenze.

## Kontext und Quellen

- Nutzerwunsch: Planung erstellen, in welchen Schritten Proteus umgesetzt werden könnte.
- Vorgängerpaket: `act-2026-05-17-proteus-mechanics-coverage-analysis`.
- Projektprinzip: Kartenpool und Mechaniken werden nur über gültige Release- und Gate-Stände erweitert; keine Karte wird durch Import automatisch spielbar.

## Scope

- Proteus-Karten nach Umsetzungsrisiko, Abhängigkeiten und Spielwert sortieren.
- Kleine bis mittlere Slices vorschlagen, z. B. einfache ICE/Breaker/Economy, Agenda-/Ambush-Paket, Hidden-Resource-Paket, Virus-/Antibody-Paket, Random-/variable-Kosten-Paket.
- Pro Slice Scope, Nicht-Scope, Gate, Testspur und AI-Support-Grenze definieren.
- Kandidaten für `human_playable` und spätere `ai_supported` getrennt führen.
- Folgeactivities für die ersten 2-4 konkreten Umsetzungspakete anlegen.

## Nicht im Scope

- Keine direkte Implementierung.
- Keine Proteus-Gesamtfreigabe.
- Keine Decklegalität oder KI-Freigabe ohne Resolver, Manifest, Szenario, Visibility, Replay/StateHash und AI-Smoke.
- Keine öffentlichen Asset- oder Rechtsentscheidungen.

## Akzeptanzkriterien

- [ ] Es gibt eine priorisierte Proteus-Umsetzungsfolge mit kleinen/mittleren Slices.
- [ ] Jeder Slice nennt klare Abhängigkeiten und Stop-Kriterien.
- [ ] Die ersten umsetzbaren Slices sind als eigene Activities vorbereitet.
- [ ] AI-Support wird separat geplant und nicht automatisch aus Human-Spielbarkeit abgeleitet.
- [ ] Hidden-Info-, Replay-, StateHash- und LegalAction-Gates bleiben harte Kriterien.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Dieses Paket darf weitere Activity-Pakete erzeugen; es soll nicht selbst zum Großrelease werden.

## Ergebnisnotiz

Noch offen.
