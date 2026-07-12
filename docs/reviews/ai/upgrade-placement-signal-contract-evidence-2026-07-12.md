# Upgrade Placement Signal Contract Evidence 2026-07-12

## Datenbasis

- SQLite: `data/runtime/multiplayer/netgrid.sqlite`, ausschließlich read-only.
- Match: `match_0919a905d2772f18`.
- Modus: `human_runner_vs_corp_ai`, Corp-KI `hard`.
- Trace-Modus: `detailed`.
- Analysierter Stand: StateVersion 124 mit 59 AI-Decision-Traces.

## Beobachtete Fehlentscheidungen

### Decision 56 / Event 118

- StateVersion vor der Aktion: 117.
- Gewählte Aktion:
  `corp.install_card.corp_onr_proteus_065_networked-center_1.hq...`.
- Ergebnis: Networked Center wurde in HQ installiert.
- Score: `-1591`.
- Fehlende Komponente: `corp_upgrade_install_placement_mismatch`.

### Decision 57 / Event 119

- StateVersion vor der Aktion: 118.
- Corp: 8 Credits, 2 Klicks, 1 Agenda-Punkt.
- Runner: 3 Credits, 2 Agenda-Punkte, 0 Tags.
- Remote 1: ein ICE, leerer Root.
- HQ-Root: Networked Center.
- Gewählte Aktion:
  `corp.install_card.corp_onr_proteus_072_research-bunker_1.hq...`.
- Die LegalAction trug `placement: root` und
  `regionReplacementWarning: true`.
- Ergebnis: Research Bunker wurde in HQ installiert und Networked Center nach
  Archives verschoben.
- Score: `-1591`; `gain_credit` lag mit `-1681` nur 90 Punkte dahinter.
- Fehlende Komponente: `corp_upgrade_install_placement_mismatch = -5200`.

## Bestehender Vertrag

`corpUpgradeInstallPlacementComponent` prüfte bereits generisch:

- `remote.agenda_difficulty_discount` oder
  `score.agenda_difficulty_discount` auf HQ, R&D oder Archives:
  `corp_upgrade_install_placement_mismatch = -5200`;
- vorbereitetes Scoring-Remote: `corp_upgrade_install_placement_fit = 850`;
- aktives Scoreline-Remote: `corp_upgrade_install_placement_fit = 1600`.

Die aktiven Hints von Washington, Networked Center, Research Bunker und
Weapons Depot enthielten diese Signale korrekt.

## Root Cause

`actionCardSemanticProfileFromHint` übernahm in das produktive
Action-Card-Semantic-Profil nur aus strukturierten Effekten abgeleitete,
generische Signale und Legacy-Rollen. Die reviewten kartenweiten
`tacticSignals` des aktiven Hints wurden nicht erhalten.

Für Research Bunker kamen deshalb nur generische Signale wie
`corp.score_progress`, `corp.score_closeout`, `corp.remote_protection` und
`remote_role:scoring_protection` beim Aktionskandidaten an. Die vom
Placement-Consumer geprüften Agenda-Difficulty-Signale fehlten vollständig.

Die bisherige Regression injizierte die benötigten Signale direkt in einen
künstlichen `ActionSemanticCandidate`. Sie bewies den Consumer isoliert, aber
nicht den produktiven Vertrag Hint -> Profil -> Projection -> Score.

## Umsetzung

Reviewte kartenweite `tacticSignals` werden jetzt als
`compatibilitySignals` im Action-Card-Semantic-Profil erhalten. Damit bleiben
sie außerhalb des allgemeinen Action-Scorings, stehen aber gezielten
semantischen Consumern wie dem Upgrade-Placement zur Verfügung.

Der Runtime-Consumer bleibt kartennamenfrei und nutzt weiterhin nur:

- side-safe sichtbare Corp-Karten;
- LegalAction-Payload und Zielserver;
- aktive, reviewte AI-Hints;
- sichtbaren Serverzustand aus der Corp-PlayerView.

## Regression

`corp-upgrade-placement-signal-contract.test.ts` prüft den echten Vertrag für:

- Washington, D.C., City Grid;
- Networked Center;
- Research Bunker;
- Weapons Depot;
- Panic Button als HQ-only-Gegenbeispiel;
- Simon Francisco als HQ/R&D-Gegenbeispiel.

Abgedeckt sind Central-Mismatch, vorbereitetes Remote-Fit, aktives
Scoreline-Remote und der beobachtete HQ-Region-Replacement-Actionshape.

## Grenzen

- Keine Engine-Aktion wurde illegal gemacht.
- Keine allgemeine Region-Replacement-Strafe wurde eingeführt.
- Die historische Runtime-Datenbank wurde nicht verändert.
- Ein neuer manueller Playtest benötigt einen über `scripts/start-netgrid.ps1`
  mit dem integrierten Stand gestarteten Serverprozess.
