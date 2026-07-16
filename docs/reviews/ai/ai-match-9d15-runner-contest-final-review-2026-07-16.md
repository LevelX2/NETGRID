# Match 9D15: Runner-Contest Final Review (2026-07-16)

## Ergebnis

Die zwei freigegebenen Runner-Fehler aus
`match_9d15b8e9a2d9269d` sind auf aktuellem Code generisch geschlossen. Die
historischen Expectations wurden nach dem roten Nachweis nicht verändert:

- Decision 22 wählt den konkreten erreichbaren Inside-Job-Run auf die akut
  bedrohte Remote statt abstrakter weiterer Kartensuche.
- Decision 81 löst die Run-Sperre gegen eine öffentlich sichtbare mögliche
  Zwei-Punkte-Terminal-Remote, sofern Kosten, Folgeclick und Folgepfad
  tatsächlich tragfähig sind.

Broker-Spielweise blieb vollständig außerhalb von Analysefreigabe,
Produktionsänderungen und Abschlussurteil.

## Umgesetzte Verträge

### Aktionsspezifische Run-Evaluation bleibt führend

Eine `RunnerRunTargetEvaluation` mit `pathPassability:reachable` darf nicht
durch eine nachgelagerte generische ICE-Prüfung ohne Bypass-/Action-Kontext
erneut blockiert oder mit falschen Pfadkosten bestraft werden. Ein konkreter
gleichzieliger `run_now`-Run kann den abstrakten Remote-Coverage-Suchschritt
unterbrechen, wenn der TacticalGoal-Fit die hohe Dringlichkeit belegt.

### Öffentliche Zwei-Punkte-Terminalbedrohung

`runner-terminal-contest-threat.ts` kapselt eine enge side-safe Erweiterung:

- Ein-Punkt-Matchpoint bleibt unverändert erhalten.
- Bei genau zwei fehlenden Punkten gilt nur ein Remote mit einer unbekannten
  oder sichtbaren Agenda-Karte und mindestens zwei öffentlichen
  Advancement-Countern als mögliche Terminalbedrohung.
- Die Run-Lock-Freigabe verlangt weiterhin Bezahlbarkeit, mindestens einen
  Folgeclick und einen erreichbaren Folgepfad auf den konkret bedrohlichen
  Remote.
- Bei drei fehlenden Punkten oder ohne Advancement entsteht keine neue
  Terminalpriorität.

### Breiter Gate-Fund

Der erste Full-Suite-Lauf fand einen angrenzenden 424A-Rückfall: Ein aktiver
`play_best_hand_card`-Plan erzwang einen positiven, aber durch negative
RunTarget-Guidance klar nachrangigen Inside-Job-Run auf HQ. Die Arbitration
lässt solche Low-Value-Run-Events nun gegen eine deutlich bessere positive
Alternative weichen. Der historische 424A-Vertrag und die vollständige Suite
wurden danach erneut grün ausgeführt.

## Commits

- `634d97666` – Prozess und `/Goal`
- `5e63c23ed` – spielgleiche rote Checkpoints und Gegenproben
- `e20dbbd48` – aktionsspezifischer Bypass-Consumer und Remote-Interrupt
- `412f4b2a4` – sichtbare Mehrpunkt-Terminalbedrohung und Run-Lock-Contest
- `e1d6cd82b` – Full-Gate-Eingrenzung für Low-Value-Run-Event-Mapping

## Verifikation vor lokaler Integration

| Check                                          | Ergebnis                               |
| ---------------------------------------------- | -------------------------------------- |
| 9D15-Checkpointdatei                           | 6/6 grün                               |
| neue Terminal-/Run-Lock-/Matchpoint-Units      | 16/16 grün                             |
| Semantic-Choice-Ranking                        | 62/62 grün                             |
| 424A-Entscheidungscheckpoints                  | 12/12 grün                             |
| FD7671- und Seed-03/05-Run-Lock-Verträge       | grün                                   |
| `corepack pnpm --filter @netgrid/ai typecheck` | grün                                   |
| `corepack pnpm check:ai`                       | grün; keine Fehler, bekannte Warnungen |
| AI-Shard 1                                     | 115 Dateien, 718 Tests grün            |
| AI-Shard 2                                     | 114 Dateien, 838 Tests grün            |
| AI-Shard 3                                     | 114 Dateien, 786 Tests grün            |
| vollständige AI-Suite                          | 343 Dateien, 2342 Tests grün           |
| `git diff --check`                             | grün                                   |

## Skill-Härtung

Der Skill `netgrid-ai-spielanalyse-worktree` kennt jetzt ohne erneute breite
Suche:

- das tatsächliche SQLite-Eventschema und den 84/84-Denominator-Schnellpfad;
- Checkpoint-Schema, Capture-, Fixture- und Runner-Pfade;
- den strikten Warmup-Vertrag und die fachlichen Fehlercodes;
- den bestätigten Windows-Fallback
  `C:\Projekte\NETGRID\node_modules\.pnpm\node_modules\.bin\tsx.CMD`;
- die führenden Codepfade von Run-Action-Projektion über Exclusions und
  Score-Consumer bis Plan-Arbitration und Run-Lock-Contest.

`quick_validate.py` meldete den Skill in dieser ersten Phase bei 495 Zeilen
Hauptdatei als gültig;
der Inspector bestätigt weiterhin 84/84 verknüpfte Entscheidungen.

## Grenzen und Status

- Engine-, LegalAction-, Replay- und PlayerView-Verträge wurden nicht
  geändert. Hintdaten ändern sich ausschließlich im nachfolgenden
  Nicht-Broker-Follow-up.
- Keine Karten-ID-, Match-ID-, Seed- oder Instanz-Sonderregel wurde ergänzt.
- Kein neues Selfplay wurde erzeugt; die Aufgabe schließt zwei gespeicherte
  Zustände mit historischen Checkpoints und einer vollständigen AI-Suite.
- Push und Pull Request sind nicht Teil des Auftrags.
- Der Arbeitsbranch wurde per Fast-Forward bis `1bc3c38d4` nach lokalem
  `main` integriert. Im Hauptworkspace sind danach 96 fokussierte Tests und
  der AI-Typecheck grün.
- Der Arbeitsbranch `codex/ai-match-9d15-runner-contest` und der Worktree
  `C:\Projekte\NETGRID_AI_MATCH_9D15_RUNNER_CONTEST` sind verifiziert
  entfernt. Der parallele Broker-Worktree besteht unverändert fort.

## Follow-up: deckweiter Hint- und Consumer-Audit

Auf Nutzerwunsch wurde anschließend das vollständige Runner-Deck aus dem
Checkpoint `cp-9d15-01-urgent-remote-inside-job` geprüft. Broker blieb über
die exakte `cardId` `onr_v1_154_broker` ausgeschlossen. Damit umfasst der
Audit 21 eindeutige Karten mit 43 Kopien.

Der neue reproduzierbare Lauf
`scripts/audit-ai-deck-hint-consumers.ts` vergleicht aktiven und kompilierten
Hint, Full-Derived-Facts, Inspector-Taxonomie sowie die tatsächlichen
`DeckCapabilityProfile`- und `DeckStrategyProfile`-Consumer. Der finale Lauf
meldet `status: ok`, null blockierende Findings und null Warnungen.

Korrigiert wurden:

- Dwarf und Snowball besitzen jetzt vollständige, geprüfte Breaker-Effekte
  und Breaker-Profile;
- Executive Wiretaps und Romp through HQ tragen keine falschen R&D- oder
  Remote-Planrollen mehr;
- Score! ist reine Economy ohne künstlichen Run-Druck;
- R&D Interface ist analog zu HQ Interface auf Multiaccess und R&D-Druck
  normalisiert;
- Jack 'n' Joe und Livewire's Contacts tragen ihre tatsächlichen Mengen in
  den strukturierten Effekten;
- `accessCount` wird als Gesamtzugriff interpretiert, während
  `multiaccess.amount` zusätzliche Zugriffe beschreibt;
- aktive und generierte Teil-Effekte der nachweislich betroffenen Karten
  werden zu genau einem kompilierten Effekt zusammengeführt;
- die seitenneutralen Werte `recover_economy`, `run_pressure` und
  `safe_probe_run` bleiben Function-Signale statt falscher Side-Strategy-
  Aliasse.

Die produktiven Consumer weisen nach der Korrektur nur Temple Microcode
Outlet als Search-Tool sowie All-Nighter und Inside Job als zwei Remote-
Contest-Werkzeuge aus. Die primären Linien bleiben
`runner.interface_closeout`, `runner.rnd_pressure` und
`runner.run_event_tempo` mit jeweils 96 Punkten; HQ-Druck bleibt mit 94
Punkten sekundär. Broker-Hints, Broker-Consumer und Broker-Spielweise wurden
nicht verändert.

Verifiziert wurden 15 fokussierte Testdateien mit 178 Tests, AI-Typecheck,
DeckDoctrine-Strategie-Gate, Taxonomie-Gate, `check:ai:full`,
`git diff --check` und der neue Deck-Audit. Die abgeleiteten AI-Artefakte
stehen konsistent auf dem aktuellen Denominator von 618 aktiven Kartenhints.
Der Analyse-Skill enthält dafür nun eine feste Referenz mit den Search-,
Remote-Contest-, Multiaccess-, Taxonomie- und Homogenisierungsverträgen; seine
Hauptdatei bleibt mit 497 Zeilen gültig.
