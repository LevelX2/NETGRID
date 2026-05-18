---
activityId: act-2026-05-17-proteus-release-slicing-plan
status: done
kind: concept
area: docs
priority: normal
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget: Proteus planning
blockedBy:
  - act-2026-05-17-proteus-mechanics-coverage-analysis
resultArtifacts:
  - docs/releases/proteus/release-slicing-plan.md
  - docs/activities/inbox/act-2026-05-17-proteus-visible-baseline-card-slice.md
  - docs/activities/inbox/act-2026-05-17-proteus-bad-publicity-engine-harness.md
  - docs/activities/inbox/act-2026-05-17-proteus-variable-ice-harness-slice.md
  - docs/activities/inbox/act-2026-05-17-proteus-hidden-resource-foundation-slice.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
checks:
  - "rg -n \"PROTEUS_RELEASE_SLICING_PLAN|proteus-visible-baseline|Proteus-Release-Slicing\" docs KI-Wissen-NETGRID"
  - "Test-Path docs/releases/proteus/release-slicing-plan.md"
  - "git diff --check"
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

- [x] Es gibt eine priorisierte Proteus-Umsetzungsfolge mit kleinen/mittleren Slices.
- [x] Jeder Slice nennt klare Abhängigkeiten und Stop-Kriterien.
- [x] Die ersten umsetzbaren Slices sind als eigene Activities vorbereitet.
- [x] AI-Support wird separat geplant und nicht automatisch aus Human-Spielbarkeit abgeleitet.
- [x] Hidden-Info-, Replay-, StateHash- und LegalAction-Gates bleiben harte Kriterien.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Dieses Paket darf weitere Activity-Pakete erzeugen; es soll nicht selbst zum Großrelease werden.

## Ergebnisnotiz

Erledigt. `docs/releases/proteus/release-slicing-plan.md` schneidet die Proteus-Umsetzung in priorisierte kleine/mittlere Slices: sichtbare Baseline-Karten, Bad-Publicity-7+-Harness, variable ICE-Foundation, Hidden-Runner-Resource-Foundation, einfache Runner-/Agenda-/Access-Slices, Cybernetics-/Deck-Hardware, Virus-/Antibody-/Purge und Random-/Longtail-Familien. Der Plan trennt `human_playable`, Decklegalität und `ai_supported` ausdrücklich und hält Hidden-Info-, LegalAction-, Replay- und StateHash-Gates als Stop-Kriterien.

Als neues erstes Folgepaket wurde `docs/activities/inbox/act-2026-05-17-proteus-visible-baseline-card-slice.md` angelegt. Die bereits vorhandenen Inbox-Pakete für Bad-Publicity-Harness, variable ICE-Harness und Hidden-Resource-Foundation werden im Plan als weitere erste Umsetzungspakete referenziert. Status, Wissensindex und Projektlog wurden mit dem planning-only Stand nachgezogen.

Checks: Dokument-/Referenzsuche und `git diff --check` grün. Offene Punkte: Keine Runtime-Implementierung, keine Proteus-Gesamtfreigabe, keine Decklegalität und keine AI-Hints in diesem Paket.
