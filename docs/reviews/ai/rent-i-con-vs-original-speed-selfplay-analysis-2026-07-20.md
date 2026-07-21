# Rent-I-Con gegen Original Speed – KI-Selbstspielanalyse

Status: Analyse abgeschlossen, keine Umsetzung freigegeben

## Ausgangslage und Methode

Als zuletzt beendetes Spiel wurde `match_e653f50ac25eed22` aus
`data/runtime/multiplayer/netgrid.sqlite` verwendet (Status `finished`,
Modus `human_runner_vs_corp_ai`, Abschluss am 2026-07-19). Die daraus
gespeicherten Deck-Snapshots wurden unverändert verwendet:

- Runner: `Rent-I-Con: Das Shellspiel` (`fnv1a:518ccd75`, 45 Karten)
- Corp: `Original Speed v1.0` (`fnv1a:45dc454b`, 55 Karten)

Beide Seiten liefen als `current_candidate` mit fünf festen Seeds
`rent-i-con-vs-original-speed-2026-07-20-001` bis `-005` und einem Limit von
480 Aktionen je Spiel. Alle Rohartefakte liegen lokal unter
`data/local/ai-match-deck-*rent-i-con-vs-original-speed-2026-07-20*`.

## Ergebnis

| Kennzahl | Ergebnis |
| --- | ---: |
| Partien | 5 / 5 |
| Runner-Siege | 4 |
| Corp-Siege | 1 |
| Ø Aktionen / Ø Züge | 234 / 28,8 |
| Runner- / Corp-Agendapunkte | 34 / 16 |
| Replayfehler / Fehlerpartien / Aktionslimits | 0 / 0 / 0 |
| Illegale Aktionen / Hidden-Info-Marker | 0 / 0 |
| Corp-Scorefenster verpasst | 0 von 8 |

Die Ergebnisse sind bei nur fünf Seeds Verhaltensevidence, keine belastbare
Stärkeaussage. Besonders die 4:1-Siegbilanz ist nicht als Balance- oder
Qualitätsurteil zu lesen.

## Entscheidungsanalyse

Die 1.170 KI-Entscheidungen sind redaction-safe; die Why-Coverage ist
vollständig für den report-only Vertrag. Der Trace-Miner markiert zwölf
`plan_step_action_mismatch`-Hinweise mittlerer Schwere, alle auf der
Runner-Seite in Seeds 001–003. Es gibt keine dominierte Planwahl, keine
No-progress-Schleife und keinen ausgelassenen Korp-Score.

Die Seeddiagnostik ordnet die relevanten Runner-Fenster überwiegend als
regelkonforme Coverage-Reaktion ein: 32 von 40 übersprungenen Advanced-Remote-
Contests hatten eine explizite Sperre durch fehlende Breaker-Coverage. Die
weiteren acht Skip-Signale besitzen aus dieser kompakten Evidence keine
ausreichende Alternative-/Choice-Evidence für einen reproduzierbaren
Verhaltensfehler. Die zwölf Plan-Mismatch-Marker sind daher aktuell
**prüfbedürftig, nicht freigabereif**: Sie können Replanning-/Observability-
Drift abbilden, belegen aber keinen schlechteren legalen Folgezug.

## Deck-Hint- und Consumer-Audit

Der Audit wurde für alle eindeutigen Karten beider Deck-Snapshots ausgeführt;
es gab keine Ausschlüsse. Er ist nicht grün und verhindert deshalb eine
Aussage, die Hint-/Consumer-Kette sei vollständig driftfrei.

- Runner: 26 eindeutige Karten, 3 blockierende
  `hint_field_without_consumer_contract`-Findings:
  `onr_proteus_106_disgruntled-ice-technician`, `onr_v1_011_cloak`,
  `onr_v1_071_vewy-vewy-quiet` (je `tacticSignals`). Die Capability-Consumer
  erkennen vier Search-Tools; die primären Strategien sind
  `runner.search.breaker`, `runner.run_event_tempo` und `runner.rnd_pressure`.
- Corp: 26 eindeutige Karten, 25 blockierende Findings derselben Klasse.
  Betroffen sind vor allem nicht vertraglich zugeordnete `tacticSignals`,
  daneben `strategySupportPairs` und `remoteRole`. Die aktiven
  Strategy-Consumer bilden dennoch `corp.ice_tax_glacier`,
  `corp.fast_advance` und `corp.remote_scoring` als primäre Strategien.

Dies ist eine Hint-/Consumer-Vertragslücke, nicht der Nachweis, dass eine
dieser Karten im analysierten Spiel falsch gewählt wurde. Eine Karten- oder
Score-Anpassung allein wäre deshalb nicht begründet.

## Freigabereife Punkte

Punkt 1: Deck-Hint-Consumer-Contract-Drift

- Beschreibung Spielfehler: Die Deck-Audits können 3 Runner- und 25
  Corp-Hintfelder nicht einem produktiven Consumer-Vertrag zuordnen. Dadurch
  ist die Semantikübergabe bis zur finalen Arbitration nicht vollständig
  nachweisbar.
- Dafür geplante Anpassungsmaßnahme: Consumer-Contract-Registry und die
  betroffenen Hintfelder systematisch abgleichen; pro semantischem Feld den
  produktiven Consumer nachweisen oder das unbelegte Feld gezielt entfernen.
  Danach beide Deck-Audits sowie die fünf Seeds unverändert wiederholen.

## Nicht freigabereif aus diesen Spielen

- Die zwölf Runner-Plan-Mismatch-Marker: Für keinen liegt aktuell ein
  spielgleicher roter Checkpoint mit einer sichtbar besseren legalen
  Alternative vor.
- Die übersprungenen Advanced-Remote-Contests: Die Mehrzahl ist durch
  fehlende Coverage begründet; die übrigen Fälle benötigen eine gezielte
  Alternativenanalyse vor einer KI-Änderung.

## Vollständige Entscheidungs-Evidence, nachgezogen am 2026-07-21

Für jede der fünf Partien liegt nun eine vollständige, redigierte
Entscheidungsdatei unter
`data/local/ai-full-analysis-rent-i-con-vs-original-speed-2026-07-21/` vor.
Sie enthält alle 1.170 Entscheidungen sowie bis zu 100 legale Alternativen
pro Entscheidung, einschließlich Scores, Hard Gates, Planbezug und
side-sicherer Facts.

Die zusätzliche Prüfung bestätigt die 32 Coverage-Sperren. Für die acht
verbleibenden Advanced-Remote-Fenster ergibt sich ein präziseres Bild:

- Die Remote-Run-Action war jeweils legal.
- In sieben Fenstern war `runner.contest_remote` der ausgewiesene Plan, die
  konkrete Remote-Run-Action trug jedoch gleichzeitig
  `excluded_by_current_plan` und `plan_mismatch`.
- Stattdessen wurde `gain_credit` mit `selected_by_plan_mapping:true` gewählt.
  Die Roh- und Final-Scores des Credit-Schritts lagen jeweils über denen der
  Run-Alternative; daraus folgt kein belegter dominierter Zug.

Die vollständige Evidence bestätigt damit keine neue KI-Verhaltensregression.
Sie verschärft aber den Observability-/Arbitration-Befund: Ein Plan mit der
Bezeichnung `runner.contest_remote` muss nachvollziehbar unterscheiden, ob
er zunächst Finanzierung aufbaut oder einen Remote-Run erwartet. Der direkte
Run darf dabei nicht widersprüchlich als durch genau diesen Plan ausgeschlossen
erscheinen. Dieses Problem ist als Diagnose-/Planvertrag zu behandeln, bis
ein spielgleicher Checkpoint eine fachlich bessere Folgeauswahl belegt.
