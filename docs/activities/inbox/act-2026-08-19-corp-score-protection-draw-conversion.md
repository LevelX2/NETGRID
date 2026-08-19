---
activityId: act-2026-08-19-corp-score-protection-draw-conversion
status: inbox
kind: concept
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-19
startedAt:
completedAt:
branch: codex/ai-selfplay-cycle-001
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Score-Schutz-Drawing auf wirksame Score-Konversion prüfen

## Ziel

Klären, ob der generische Pfad `corp.defend_servers` einen vorbereiteten
Score-Plan zu lange über `draw_card` stützt, ohne dass der Plan danach in eine
belegte Install-/Advance-/Score-Linie zurückkehrt. Nur bei belastbarer
side-sicherer Evidence einen engen, owner-konformen Fix ableiten.

## Kontext und Quellen

- Persistierter lokaler Pilotmatch `match_ce0f0272ed65d4f9`, Seed
  `ai-selfplay-pilot-001-game-v2`, Originalset, Runner Origins Probe Pressure
  gegen Corp Demo Deck 08 Starter Score Grid, Detailtrace aktiviert.
- Der Match endete nach 152 Aktionen regulär durch `corp_deck_empty`; es gab
  keine Illegal Actions, Fallbacks, Timeouts oder Runtimefehler.
- Entscheidungen 93 und 104: `corp.defend_servers` zog jeweils für den
  Parent `corp.score_agenda` mit dem Need `score-protection`, obwohl die
  anschließende Score-Konversion in diesem Match ausblieb.
- Die Detailtraces begründen die Züge als `develop_score_protection`; die
  verfügbaren Daten belegen jedoch noch keinen besseren legalen Zug und damit
  keinen Fehler.

## Scope

- Mindestens einen zusätzlichen reproduzierbaren Fall oder ein präzises
  Live-Engine-Szenario prüfen.
- Zwischen notwendigem Schutz-Drawing, tatsächlich verfügbarer
  Score-Konversion und nur scheinbar verpasster Gelegenheit unterscheiden.
- Bei Bestätigung den bestehenden Owner `corp.defend_servers` oder den
  gebundenen Score-Parent minimal erweitern; keine kartenbezogene Sonderregel.
- Einen fallnahen L3-Regressionstest mit echten oder exakt nachgebildeten
  `LegalActions` ergänzen und Plan-, Step- sowie Parent-Bindung sichern.

## Nicht im Scope

- Kein Rückschluss aus Sieg, Niederlage oder Deck-out allein.
- Keine Änderungen an Engine-Legalität, Choice-Resolvern oder Hidden-Info-
  Grenzen.
- Keine Auswertung oder Versionierung von Rohtraces, Datenbankdateien oder
  gegnerischen verdeckten Informationen.

## Akzeptanzkriterien

- [ ] Der Befund ist als bestätigter Fehler oder als unbegründeter Verdacht
  nachvollziehbar entschieden.
- [ ] Ein bestätigter Fix bleibt beim bestehenden Planowner und verbessert
  eine generische Score-Schutz-/Score-Konversionsfähigkeit.
- [ ] Bei einem Fix belegt ein fallnaher Regressionstest die Auswahl und
  unveränderte Ownership; betroffene KI-Architekturdokumentation ist geprüft
  und bei Vertragsänderung aktualisiert.
- [ ] Replay, StateHash, LegalAction- und Hidden-Info-Grenzen bleiben
  erhalten.

## Umsetzungshinweise

- Vor einem Patch `packages/ai/AGENTS.md`,
  `docs/architecture/ai/change-compass.md`, `README.md` und die einschlägigen
  Owner-Abschnitte der `planning-architecture.md` vollständig lesen.
- Die lokale Maintenance-Analysis-API verwenden; direkte SQLite-Reads sind
  kein Analysepfad.

## Ergebnisnotiz

Offener Verdacht aus dem ersten Selbstspielpilot; noch keine Umsetzung
freigegeben.
