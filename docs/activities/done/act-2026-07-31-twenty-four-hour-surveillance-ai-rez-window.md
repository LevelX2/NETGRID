---
activityId: act-2026-07-31-twenty-four-hour-surveillance-ai-rez-window
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt: 2026-07-31
branch: codex/act-2026-07-31-twenty-four-hour-surveillance
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/match-4d7bd0eba9138d83-complete-ai-analysis-2026-07-31.md
  - packages/ai/src/runtime/plan-first-live-runtime.ts
  - packages/ai/src/runtime/plan-first-live-runtime-corp-rez-contract.test.ts
checks:
  - match_4d7bd0eba9138d83 decision coverage 204/204
  - decision 177 checkpoint reproduced without warmup drift
  - deck hint consumer audit 34/34 unique Corp cards; four unrelated pre-existing blocking findings recorded
  - focused Corp rez contract 43/43
  - AI typecheck
  - AI hint metadata and source structure gates
  - card function abstraction gate
  - AI shards 544/544 files and 4449/4449 tests
  - Engine implementation, payment, replay and StateHash 79/79
---

# Korp-KI nutzt das Rez-Fenster von Twenty-Four-Hour Surveillance

## Ziel

Die Korp-KI soll ein bezahlbares, im angegriffenen Server installiertes
`Twenty-Four-Hour Surveillance` im passenden Rez-Fenster aktivieren, wenn der
sichtbare Runner-Zustand relevante Stealth-Zahlungsquellen enthält und das
Rezzen deren Nutzung während des Runs regelwirksam verhindert.

## Kontext und Quellen

- Nutzer-Playtest vom 31.07.2026: Bei einem Run auf HQ lag
  `Twenty-Four-Hour Surveillance` ungerezzt im HQ-Root. Die Korp-KI rezzte das
  Upgrade trotz Rez-Kosten 1 nicht; der Runner konnte während des Runs mehrere
  Stealth-Quellen verwenden.
- Lokaler Kartentext in `data/cards/originalset-v1-cards.json`:
  `During runs on this fort, Runner cannot use bits from stealth sources.`
- Die Kartenimplementation
  `packages/engine/src/card-implementations/onr-v1/corp/upgrades/twenty-four-hour-surveillance.ts`
  bindet den Effekt als serverbezogenes
  `block_stealth_bits_during_runs_on_this_fort`-Fenster.
- Vor einer Verhaltensänderung in `packages/ai/` gilt der verbindliche
  KI-Architektur-Preflight aus `AGENTS.md`.

## Scope

- Den beobachteten Zustand mit HQ-Installation, ausreichenden Korp-Credits
  und mindestens einer tatsächlich relevanten sichtbaren Runner-Stealth-
  Zahlungsquelle als fokussierte Engine-/KI-Regression reproduzieren.
- Belegen, in welchem bestehenden Rez-Fenster die exakte `rez_card`-
  LegalAction verfügbar ist und ob der Fehler in LegalAction-Erzeugung,
  Window-Weiterleitung oder KI-Auswahl liegt.
- Den zuständigen bestehenden Korp-Plan beziehungsweise Controller als
  alleinigen Owner der Rez-Entscheidung verwenden und dessen Bewertung so
  schärfen, dass der konkrete Stealth-Sperrnutzen die Rez-Kosten angemessen
  berücksichtigt.
- Gegenbeispiele für fehlende Stealth-Quellen, falschen Server, fehlende
  Credits und bereits gerezzte Quelle ergänzen.
- Nach dem Rezzen sicherstellen, dass relevante Stealth-Credit-/Bit-Quellen
  im angegriffenen Server nicht mehr als zulässige Zahlungsquellen angeboten
  oder akzeptiert werden.

## Nicht im Scope

- Keine generelle Regel, jedes bezahlbare Upgrade bei jedem Run zu rezzen.
- Keine kartennamenspezifische Parallelentscheidung außerhalb des bestehenden
  Plans oder Controllers.
- Keine neue Choice-, Resolver-, Fallback- oder Override-Autorität.
- Keine Änderung des Kartentexts, der Rez-Kosten oder der Bedeutung von
  Stealth-Quellen.
- Keine Nutzung verdeckter Runner-Hand-, Stack- oder Deckinformationen.

## Akzeptanzkriterien

- [x] Der reproduzierte positive Fall bietet der Korp die exakte legale
      Rez-Action und die KI wählt sie vor der ersten relevanten
      Stealth-Zahlung.
- [x] Das gerezzte Upgrade sperrt ausschließlich Stealth-Quellen während Runs
      auf seinem Server; andere legale Zahlungsquellen bleiben nutzbar.
- [x] Ohne sichtbare relevante Stealth-Quelle, auf einem anderen Server oder
      ohne Rez-Credits entsteht kein künstlicher Rez-Zwang.
- [x] Zuständiger Plan, Planinstanz, Step/Route und Executor bleiben
      nachweisbar erhalten; ein Choice-Resolver ändert weder `actionId` noch
      die Strategieentscheidung.
- [x] Die KI bewertet ausschließlich vorhandene LegalActions und side-sichere
      PlayerView-/PublicContext-Informationen.
- [x] Engine-, KI-, Replay-, StateHash- und Hidden-Info-Regressionen für den
      positiven Fall und die Gegenbeispiele sind grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Vor dem ersten KI-Codepatch vollständig lesen:
  `packages/ai/AGENTS.md`, `docs/architecture/ai/README.md` und die relevanten
  Owner-Abschnitte aus
  `docs/architecture/ai/ai-plan-layer-target-state-wip.md`.
- Zuerst die Engine-LegalAction und deren Timing nachweisen. Nur wenn sie
  korrekt existiert, die KI-Auswahl ändern.
- Für Zahlungsgegenproben echte als Stealth klassifizierte Quellen verwenden,
  keine Titelheuristik.

## Analysebefund vor Umsetzung

- Die Engine bietet in Entscheidung 177 die exakte, bezahlbare
  `rez_card`-LegalAction im HQ-Run korrekt an. Weder LegalAction-Erzeugung noch
  Timingweiterleitung sind die Fehlerursache.
- `corp.defend_servers` bleibt der fachliche Owner. Der Plan verwirft die
  Action derzeit mit
  `corp_root_rez_has_no_exact_engine_certified_economy_or_defense_route`, weil
  `corpExactCardRezSupportAssessment` noch keine generische Wirkungsklasse für
  fortgebundene Stealth-Zahlquellensperren konsumiert.
- Im reproduzierten Zustand besitzt der Runner sichtbar sechs verwendbare
  Stealth-Bits: zwei aus `Invisibility`, zwei aus `Vewy Vewy Quiet` und zwei
  aus `Cortical Cybermodem`. Nach dem zuerst sinnvollen Rez von `Ball and
Chain` stehen der Corp noch 13 Credits für die Rez-Kosten 1 zur Verfügung.
- Die Umsetzung soll den bereits aktiven Hint-Effekt `run_tax` mit Ziel
  `run.corp_stealth_credit_lockout`, Scope `fort` und Timing `during_run`
  konsumieren. Positiv wird die Route nur beim aktuellen Run auf genau diesem
  Fort und bei einem positiven sichtbaren Stealth-Pool; Engine-Kostenquote und
  bestehende Score-Reserveprüfung bleiben verbindlich.
- Es entsteht kein neuer Plan, keine Karten-ID-Abzweigung, keine Resolverlogik
  und keine pauschale Regel zum Rezzen günstiger Upgrades.

## Ergebnisnotiz

`corp.defend_servers` erkennt nun die bereits vorhandene, geprüfte
Effektsemantik einer fortgebundenen Stealth-Credit-Sperre. Eine produktive
Rez-Route entsteht nur während eines Runs auf genau diesem Fort und nur bei
einem positiven, sichtbaren und für nicht-laute Icebreaker nutzbaren
Stealth-Credit-Pool. Die konkrete LegalAction, ihre Kosten und die vorhandene
Score-Reserveprüfung bleiben unverändert verbindlich.

Die Umsetzung enthält weder Karten-ID-/Titel-Heuristik noch einen neuen Plan,
Resolver, Fallback oder Override. Der Regressionstest bindet die ausgewählte
Action weiterhin an `corp.defend_servers`, dessen Planinstanz und dessen
`allocate_server_defense`-Step. Gegenfälle ohne sichtbare Stealth-Credits und
auf einem anderen Fort bleiben beim planinternen `decline_rez`.
