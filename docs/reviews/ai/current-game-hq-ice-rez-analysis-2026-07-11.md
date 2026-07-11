# Analyse: Nicht gerezztes äußeres HQ-ICE im Spiel vom 11. Juli 2026

## Ergebnis

Der gemeldete Eindruck ist **kein KI-Rankingfehler**. Die gespeicherte Partie
`match_8d959dc447958cef` zeigt, dass das lange ungerezzte HQ-ICE `Colonel Failure`
in keinem der beobachteten Rez-Fenster legal gerezzt werden konnte. Die Corp
hatte jeweils 7 bis 9 Credits, die Karte kostet 17 Credits. Deshalb enthielten
die `LegalActions` nur `decline_rez`; die KI hatte keine Rez-Alternative, die sie
hätte auswählen oder falsch bewerten können.

Als später ein bezahlbares äußeres `Bug Zapper` vor `Colonel Failure` lag, hat
die KI dieses ICE korrekt gerezzt. Das anschließende Nicht-Rezzen von
`Colonel Failure` war erneut durch die fehlenden Credits erzwungen.

Eine Änderung am KI-Ranking oder eine Karten-ID-Sonderregel ist daher nicht
gerechtfertigt.

## Datenbasis und Abgrenzung

- lokale SQLite-Datenbank:
  `data/runtime/multiplayer/netgrid.sqlite`
- Match: `match_8d959dc447958cef`
- Match-Zeitraum: 11. Juli 2026, 17:13 bis 17:58 Uhr MESZ
- Endstand: `finished`, State-Version 246
- gespeicherte KI-Entscheidungstraces: 99
- herangezogen: `engine_events`, `state_snapshots` und
  `ai_decision_traces.trace_json`
- keine Rohtraces oder lokalen Laufzeitdaten wurden versioniert

Die Match-Zuordnung ist eindeutig: Nur dieser Matchdatensatz enthält gemeinsam
die im Spielbericht genannten Karten `Corporate Shuffle`, `Snowbank`,
`Dr. Dreff` und `Reclamation Project`.

## Rekonstruktion der HQ-Rez-Fenster

| State-Version | HQ-Situation | Corp-Credits | LegalActions / Trace | Bewertung |
| --- | --- | ---: | --- | --- |
| 65 | `Puzzle` wird angegriffen | 4 | `rez_ice` und `decline_rez`; KI rezzt `Puzzle` für 2 | legale aktive Verteidigung |
| 125 | `Colonel Failure` wird angegriffen | 7 | nur `decline_rez` | Rez-Kosten 17 nicht zahlbar |
| 161 | `Colonel Failure` wird angegriffen | 9 | nur `decline_rez` | Rez-Kosten 17 nicht zahlbar |
| 177 | `Colonel Failure` wird angegriffen; `Dr. Dreff` kann im HQ-Fenster genutzt werden | 7 | `Dr. Dreff in HQ rezzen` und `decline_rez`; KI wählt Dr. Dreff | korrekte kostenfreie Intervention |
| 196 | `Colonel Failure` wird angegriffen | 8 | nur `decline_rez` | Rez-Kosten 17 nicht zahlbar |
| 221 | `Colonel Failure` wird angegriffen | 9 | nur `decline_rez` | Rez-Kosten 17 nicht zahlbar |
| 236 | äußeres `Bug Zapper` vor innerem `Colonel Failure` | 10 | `Bug Zapper rezzen` und `decline_rez`; KI rezzt für 6 | bezahlbares äußeres ICE wird korrekt gerezzt |
| 242 | nach Passage von `Bug Zapper` wird inneres `Colonel Failure` angegriffen | 4 | nur `decline_rez` | Rez-Kosten 17 nicht zahlbar |

Die Kartendaten bestätigen für `onr_proteus_015_colonel-failure` den Rez-Preis
17. Der Engine-Pfad `buildCorpApproachActions` erzeugt eine `rez_ice`-Action nur,
wenn `quoteCorpRezCost(...).canPay` wahr ist. Die fehlenden Rez-Kandidaten in den
Traces sind damit regelkonform und kein Trace- oder Projektionsverlust.

## Detail des letzten HQ-Runs

Der letzte HQ-Run macht die Trennung zwischen legaler Entscheidung und
erzwungenem Pass besonders deutlich:

1. State 236: HQ enthält innen `Colonel Failure` und außen `Bug Zapper`.
   Corp hat 10 Credits.
2. Trace 98 bietet `Bug Zapper rezzen` und `Nicht rezzen` an. Die KI wählt das
   Rezzen; der Score enthält ausdrücklich Bezahlbarkeit, wirksame Verteidigung
   und die nachgelagerte Rez-Reserve für das innere ICE.
3. Nach Zahlung der 6 Credits verbleiben 4 Credits. Der Runner bricht beide
   Subroutinen und passiert `Bug Zapper`.
4. State 242: `Colonel Failure` wird angegriffen. Trace 99 enthält nur noch
   `Nicht rezzen`, weil 4 Credits den Rez-Preis 17 nicht decken.
5. Die KI lehnt das Rezzen ab und der Run geht regelkonform in den Access.

## Entscheidung

- kein KI-Code geändert
- kein Hint geändert
- keine Regression mit künstlich geänderter Karten-ID ergänzt
- der Befund wird als fachlich erklärtes Nicht-Defekt-Ergebnis geschlossen

Ein sinnvoller Produkt-Hinweis für spätere UI-Arbeit wäre, bei menschlich
sichtbaren KI-Erklärungen zwischen „KI wollte nicht rezzen“ und „Rezzen war
nicht legal bzw. nicht bezahlbar“ klar zu unterscheiden. Das ist jedoch kein
Fehler der aktuellen Aktionswahl und gehört nicht in dieses Korrekturpaket.
