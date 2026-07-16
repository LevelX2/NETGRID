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

`quick_validate.py` meldet den Skill bei 495 Zeilen Hauptdatei als gültig;
der Inspector bestätigt weiterhin 84/84 verknüpfte Entscheidungen.

## Grenzen und Status

- Keine Engine-, LegalAction-, Replay-, PlayerView- oder Hint-Daten wurden
  geändert.
- Keine Karten-ID-, Match-ID-, Seed- oder Instanz-Sonderregel wurde ergänzt.
- Kein neues Selfplay wurde erzeugt; die Aufgabe schließt zwei gespeicherte
  Zustände mit historischen Checkpoints und einer vollständigen AI-Suite.
- Push und Pull Request sind nicht Teil des Auftrags.
- Lokale Main-Integration und Worktree-Cleanup folgen als P5; ihr Ergebnis
  wird nach dem Merge im Prozessartefakt und hier nachgetragen.
