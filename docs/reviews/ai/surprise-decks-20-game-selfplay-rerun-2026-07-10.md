# Wiederholungslauf der Überraschungsdecks 2026-07-10

## Status

- Der identische 20-mal-480-Selfplay-Lauf ist abgeschlossen.
- Alle technischen Abschlussgates sind grün.
- Die vier freigegebenen Analysepunkte sind umgesetzt beziehungsweise, beim
  widerlegten Archives-Runtime-Finding, korrekt in den Detektor verschoben.
- Ein neuer Präzisions-Follow-up für positive stapelbare Duplicate-Installationen
  ist dokumentiert, aber nicht automatisch umgesetzt.

## Gegenstand und Evidence

Verwendet wurden erneut:

- Runner: `Mit Ansage: Der perfekte Coup`
- Korp: `Syds ICE-Pfandhaus`
- Seeds: `surprise-decks-2026-07-10-01` bis
  `surprise-decks-2026-07-10-20`
- Controller: Runner und Korp jeweils `current_candidate`
- Aktionslimit: 480 je Partie

Lokale, unversionierte Vollbestände:

- Baseline: `data/local/ai-selfplay-surprise-decks-20x480-2026-07-10.json`
- Wiederholung:
  `data/local/ai-selfplay-surprise-decks-20x480-2026-07-10-rerun.json`

Der erste Exportversuch des Wiederholungslaufs scheiterte erst nach den
vollständig berechneten Partien an einer nicht öffentlich exportierten
Zählhilfsfunktion. Der deterministische Lauf wurde unverändert wiederholt; der
korrigierte Export schrieb den Vollbestand erfolgreich und verwendet für die
Kontrollzählung keine interne API.

## Harte Gates

| Gate | Baseline | Wiederholung |
| --- | ---: | ---: |
| Partien | 20 | 20 |
| Entscheidungen | 5.404 | 5.469 |
| Illegale Aktionen | 3 | 0 |
| Replay-Fehler | 0 | 0 |
| echte 480er-Aktionslimits | 0 | 0 |
| Runtime-Fallbacks | 0 | 0 |
| Timeouts | 0 | 0 |
| Hidden-Info-Marker | 20 instabil | 0 stabil |
| Redaction-safe | ja | ja |
| Detektion nach Persistierung identisch | nein | ja |

Die drei vormals technisch abgebrochenen Seeds sind sauber:

- Seed `04`: Runner-Sieg nach 355 Aktionen, `errors: []`, Replay grün.
- Seed `09`: Korp-Sieg nach 332 Aktionen, `errors: []`, Replay grün.
- Seed `12`: Korp-Flatline nach 271 Aktionen, `errors: []`, Replay grün.

## Spielergebnisse

| Ergebnis | Baseline | Wiederholung |
| --- | ---: | ---: |
| Runner-Siege | 13 | 14 |
| davon Agendapunkte | 9 | 9 |
| davon leeres R&D | 4 | 5 |
| Korp-Siege | 4 | 6 |
| davon Agendapunkte | 1 | 2 |
| davon Flatline | 3 | 4 |
| technische Abbrüche | 3 | 0 |
| Durchschnittliche Aktionen | 270,2 | 273,45 |
| Korp-Agenda-Scores | 13 | 16 |
| Runner-Agenda-Steals | 52 | 54 |

Die Verschiebung der Siegzahl entsteht vor allem dadurch, dass die drei
Choice-Abbrüche nun regulär zu Ende gespielt werden. Aus diesem einzelnen
Deckpaar folgt weiterhin keine allgemeine Balanceaussage.

## Vergleich der relevanten Detektoren

| Detektor | Baseline | Wiederholung | Delta |
| --- | ---: | ---: | ---: |
| Findings gesamt | 1.486 | 568 | -918 |
| `hidden_info_marker` | 20 | 0 | -20 |
| `illegal_action` | 3 | 0 | -3 |
| `repeated_low_value_archives` | 16 | 0 | -16 |
| `recovery_low_value_loop` | 813 | 230 | -583 |
| `plan_step_action_mismatch` | 901 | 110 | -791 |
| `repeated_no_progress_run` | 273 | 268 | -5 |
| `duplicate_low_delta_install` | 5 | 5 | 0 |

Mehrere Detektoren können dieselbe Entscheidung markieren; deshalb summieren
sich die Detektorwerte nicht zu `Findings gesamt`.

Die 230 verbleibenden Recovery-Funde bestehen nur noch aus strategischen
Aktionstypen: Draw, Start-Run, aktivierte Fähigkeit, Event, Installation und
Credit-Gewinn. Die 110 verbleibenden Plan-Mismatch-Funde bestehen aus
Credit-Gewinn, Installation, Event, Zugende und Operation. `continue_run`,
Access, Choice, Break/Pump und Jack-out sind aus diesen beiden Clustern
verschwunden.

## Ergebnis je freigegebenem Punkt

### 1. Budgetierte Data-Fort-Reclamation-Folgechoice

Die optionale Mehrfach-Rez-Auswahl bildet nun aus sichtbaren Einzelkosten,
temporären Credits und regulären Korp-Credits eine bezahlbare stabile
Teilmenge. Unbezahlbare Karten werden übersprungen; eine leere Auswahl bleibt
legal. Die ursprünglichen Seeds `04`, `09` und `12` enthalten keine
IllegalAction mehr und ihre Replays sind grün.

### 2. Archives-Finding

Es wurde bewusst keine zugübergreifende Archives-Sperre in die produktive
Runner-KI eingebaut. Die Simulation protokolliert stattdessen ausschließlich
side-sichere bekannte und unbekannte Kartenanzahlen sowie einen Hash des
sichtbaren Archives-Inhalts. `repeated_low_value_archives` meldet nur noch
einen unveränderten, vollständig bekannten, agenda-freien Zustand. Im
Wiederholungslauf fällt der zuvor falsche Zähler von 16 auf 0.

### 3. Negative Duplicate-/Bank-Install-Fits

Ein Runner-Handentwicklungsplan darf eine insgesamt nichtpositive
Installation mit explizit negativer Bank-, No-Run-Economy- oder
Persistent-Install-Komponente nicht mehr gegen eine positive semantische
Alternative erzwingen. Positive ausdrücklich stapelbare Bankkopien bleiben
zulässig.

Die drei klar negativen Originalfälle sind verschwunden:

- `05:278`
- `09:203`
- `18:400`

Die fünf verbleibenden `duplicate_low_delta_install`-Funde sind dagegen alle
`install_ready`, haben einen positiven Bankbeitrag von +350 und einen positiven
semantischen Score von +854. Sie umfassen die zwei bewusst erlaubten
Baseline-Fälle `08:334` und `09:284` sowie drei durch den veränderten Spielpfad
entstandene positive Kopien (`09:211`, `13:201`, `13:202`). Das produktive
Verhalten erfüllt damit die freigegebene Maßnahme; der Detektor unterscheidet
positive stapelbare Kopien noch nicht präzise genug.

### 4. Finding-Stabilität

Findings werden auf einer von `actionAlternatives` bereinigten
Detektionsrepräsentation erzeugt, die der gespeicherten Redaction entspricht.
Die erneute Detektion aus den 20 persistierten Summaries liefert exakt dieselben
568 Findings und dieselben Detektorzahlen. Ein eigener Positivtest belegt, dass
ein tatsächlich verbotener Marker weiterhin als `hidden_info_marker` erkannt
wird.

## Neuer freigabepflichtiger Follow-up

`duplicate_low_delta_install` sollte positive, ausdrücklich stapelbare
`install_ready`-Kopien nicht als mittelgradigen Low-Delta-Fehler melden.
Vorgeschlagene generische Maßnahme:

- den Detektor an eine negative Gesamtbewertung, `install_deferred` oder eine
  tatsächlich redundante Duplicate-Rolle binden;
- positive `action_bank_parallel`-/`useful_backup`-Fälle ausnehmen;
- Positivtest für einen negativen Broker-Fall und Negativtest für eine
  positive stapelbare Kopie ergänzen.

Dieser Follow-up wurde nicht umgesetzt, weil er erst aus dem Wiederholungslauf
entstanden ist und vor einer weiteren Änderung eine neue Freigabe benötigt.

## Verifikation

- fokussierte Ranking-Tests: 23 grün
- Selfplay-/Finding-/Harness-Tests: 35 grün
- `@netgrid/ai` Typecheck: grün
- vier ursprüngliche Broker-Seeds: 0 Duplicate-Funde vor P4
- realer P4-Seed `05`: 382 Aktionen, Replay grün, Detektion idempotent
- vollständiger Wiederholungslauf: 20 Partien, 0 Fehler, 0 Replay-Abweichungen

