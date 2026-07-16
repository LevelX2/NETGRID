# AI-Match 03575: Trace/Repeat Final Review (2026-07-16)

Status: Fachlich abgeschlossen und lokal nach `main` integriert

## Ergebnis

Das zuletzt abgeschlossene Spiel `match_03575bf4efae5bc7` wurde über alle 75
Runner-KI-Entscheidungen geprüft. Replay, PlayerViews, LegalActions und
Detailed-Traces sind vollständig verknüpft; der aktuelle Ausgangscode
reproduzierte alle 75 historischen Wahlen ohne Warmup-Drift. Zwei freigegebene
Verhaltensfehler und ein Derived-Facts-Consumerfehler sind generisch geschlossen:

- DI37/SV61 wählt `bid_0` statt `bid_6`, wenn die Tag-Annahme plus legale
  Bereinigung im sichtbaren Folgezustand strikt günstiger und kein aktiver
  Tag-Punish sichtbar ist.
- DI58/SV94 wählt `runner.start_run.rd` statt eines irrelevanten Draws, weil
  die Corp-Pflichtkarte den zuvor bekannten R&D-Top verändert hat und Runner
  mit fünf Agenda-Punkten im Zwei-Punkte-Matchpoint-Fenster steht.
- Networking wird im Full-Derived-Facts-Inventar am tatsächlich registrierten
  Classic-Pfad gefunden und nicht mehr als fehlende Implementierung geführt.

Die historischen Expectations blieben nach dem roten Nachweis unverändert.

## Spiel- und Evidence-Basis

| Feld               | Wert                                           |
| ------------------ | ---------------------------------------------- |
| Match              | `match_03575bf4efae5bc7`                       |
| Modus              | `human_corp_vs_runner_ai`, Runner Hard         |
| Seed               | `match-mrnzsqrb-yp60i8`                        |
| Ergebnis           | Runner gewinnt über Agenda-Punkte              |
| Final StateVersion | 117                                            |
| Final StateHash    | `fnv1a:20607820`                               |
| Replay / Snapshots | 118 Events / 118 Snapshots                     |
| AI-Traces          | 75 erwartet, 75 vorhanden, 75 exakt zugeordnet |
| Warmup             | DI37: 36/36 exakt; DI58: 57/57 exakt           |

Die rote Baseline und Gegenproben stehen in
`docs/reviews/ai/ai-match-03575-red-evidence-2026-07-16.md`. Beide Zieltests
scheiterten vor Produktionsänderungen ausschließlich als
`behavior_regression`. Engine-Legalität, Runtime-Restore, StateHash, Redaction
und Fixture-Schema blieben grün.

## Umgesetzte Verträge

### Ökonomischer Runner-Trace-Bid

Der Runner-Bid-Consumer kennt nun neben der sichtbaren Restpfadquote auch den
öffentlichen CardImplementation-Vertrag des aktiven Trace-Erfolgseffekts. Das
ist nötig, weil die gerade ausgelöste dynamische Subroutine im Runner-Bid-Fenster
bereits aus dem aktuellen ICE-Quote entfernt ist. Der neue Engine-Quote ist
definitionsbasiert, öffentlich und zustandslos; FullState oder verdeckte Karten
werden nicht konsumiert.

Ein verlorener Trace wird nur dann als ökonomische Alternative gewählt, wenn:

- der sichtbare Erfolgseffekt genau eine positive Tag-Menge liefert;
- Runner aktuell tagfrei ist und genug Clicks zur Bereinigung besitzt;
- kein sichtbarer aktiver Tag-Punish vorliegt;
- der Run-Zweck die Tag-Annahme rechtfertigt und der sichtbare Restpfad bekannt
  bleibt;
- Bereinigung und Run-Reserve bezahlbar sind; und
- der Gewinn-Bid entweder die Run-Reserve verletzt oder gegenüber
  Bereinigungskosten plus Click-Opportunität strikt teurer ist.

Damit bleibt der bestehende 5F6D-Vertrag für Restpfad-Budget und sichtbaren
Tag-Punish unverändert grün.

### Frischer R&D-Wiederholungsrun

Die pauschale `runner_recent_same_server_runs`-Komponente bleibt für HQ,
Remotes, unveränderte bekannte R&D-Tops und Wiederholungsruns ohne sichtbaren
Informationsgewinn bestehen. Für R&D wird sie nur reduziert, wenn das
Belief-State-Memory eine sichtbare Top-Veränderung nach einem bekannten Access
belegt. Vor Matchpoint bleibt ein begrenzter Malus von 700 pro jüngstem Run;
innerhalb von zwei Agenda-Punkten zum Sieg entfällt er. Die bestehende
Low-Value-Stale-Top-Strafe bleibt zusätzlich aktiv.

### Networking und Consumerkette

Der Full-Coverage-Generator besitzt einen validierten Pfad-Override-Mechanismus
für Implementierungen außerhalb der zwei regulären Scan-Wurzeln. Der Override
wird nur akzeptiert, wenn die Datei existiert und dieselbe `cardDefinitionId`
deklariert. So wird Networking korrekt gefunden, ohne den gesamten Classic-Baum
ungeprüft als neue generierte Runtime-Fakten zu aktivieren.

Regeneriert wurden Full-Inventar, Full-Coverage-Report, kompiliertes Hint,
Compiled-Runtime-Report und Inspector-Index. Der Consumerstand lautet:

- 618 aktive Hints;
- 528 gefundene Implementierungen;
- 391 Karten mit generierten Facts;
- 137 Legacy-Fallbacks;
- 90 fehlende Implementierungen;
- 0 harte Full-Gate-Fehler.

## Kartenhint-Audit

Die im Spiel relevanten Hints für Krash, Livewire's Contacts, Temple Microcode
Outlet, Zetatech Mem Chip, The Short Circuit, Jack Attack, Hunting Pack,
Crystal Palace Station Grid und Paris City Grid stimmen mit Implementierung und
tatsächlicher Consumerkette überein. Es gab keinen belegten Anlass für eine
fachliche Hintänderung. Networking war kein Hintfehler: aktiver und kompilierter
Economy-Effekt waren bereits inhaltlich korrekt; nur das Derived-Facts-Inventar
verfehlte den Implementierungspfad.

## Verifikation vor lokaler Integration

| Check                                                                                   | Ergebnis                                          |
| --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Match-03575-Checkpoints                                                                 | 4/4 grün                                          |
| AI-Nachbargates: Match 5F6D, Trace-Context, R&D-Repeat, Derived Facts, Compiled Runtime | zusammen mit Match 03575: 46/46 grün in 6 Dateien |
| Engine Trace-Success-Quote                                                              | 2/2 grün                                          |
| `corepack pnpm check:ai:full`                                                           | grün; 0 harte Fehler                              |
| AI- und Engine-Typecheck                                                                | grün                                              |
| `git diff --check`                                                                      | grün                                              |

Der erste vollständige AI-Lauf nach dem Main-Abgleich meldete 17 Fehler in 350
Dateien bei 2.419 Tests. Zwei davon waren direkte Hinweise auf eine zu breite
erste Classic-Discovery (staler Inspector und alter Blocked-Count). Nach der
Eingrenzung sind beide Gates grün. Der gezielte Wiederholungslauf aller zuvor
roten Dateien enthält noch 15 Fehler; repräsentative identische Läufe auf dem
aktuellen lokalen `main` reproduzieren dieselben Broker-/Plan- und
Hint-Quality-Fehler ohne diesen Branch. Der abschließende vollständige AI-Lauf
bestätigt exakt 15 rote und 2.426 grüne Tests in acht roten und 344 grünen
Dateien bei insgesamt 352 Dateien und 2.441 Tests. Die Match-03575-Datei bleibt
dabei 4/4 grün. Diese bestehende Main-Schuld wurde nicht in den freigegebenen
Scope gezogen.

## Grenzen

- Keine Engine-Regel, LegalAction oder PlayerAction wurde erfunden oder
  umgedeutet.
- Keine Hidden-Zone-, FullState-, Replay-, StateHash- oder
  Randomness-Grenze wurde gelockert.
- Keine Karten-ID-, Match-ID-, Seed- oder Instanz-Sonderregel steuert
  produktives Spielverhalten.
- Keine fachliche Kartenhintänderung wurde vorgenommen.
- Kein Push und kein Pull Request gehören zum Auftrag.

## Integration und Cleanup

Der Arbeitsbranch `codex/ai-match-03575-trace-repeat` wurde nach einem zweiten
Abgleich mit dem inzwischen weitergelaufenen lokalen `main` konfliktfrei über
Merge-Commit `a05cf7cdd` integriert. Auf `main` blieben anschließend 46/46
betroffene AI-Tests, 2/2 Engine-Tests, AI- und Engine-Typecheck sowie
`corepack pnpm check:ai:full` grün. Der isolierte Worktree und sein Branch sind
damit ohne offene Änderungen entfernbar; ihre tatsächliche Entfernung wird als
abschließende unversionierte Repository-Metadatenprüfung direkt nach diesem
Dokumentationscommit verifiziert.
