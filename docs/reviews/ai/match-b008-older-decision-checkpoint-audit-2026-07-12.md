# Match B008: Older Decision Checkpoint Audit

## Ziel

Das ältere erste Spiel der Seitenwechsel-Serie wurde nicht aufgrund seines
damaligen Ergebnisses pauschal zum Fix-Scope erklärt. Historische Kandidaten
wurden als exakte Checkpoints auf den aktuellen KI-Code geladen. Nur aktuell
rote `behavior_regression`-Fälle werden weiterbearbeitet.

## Quelle

- Match: `match_b0080115bddbce23`
- Modus: menschliche Corp gegen Hard-Runner-KI
- Ergebnis: Corp-Flatline
- Evidence: 143 Events, 143 Snapshots und 72 AI-Decision-Traces
- Promoted Fixtures:
  - `data/scenarios/ai-decision-checkpoints/cp-b008-01.json`
  - `data/scenarios/ai-decision-checkpoints/cp-b008-02.json`
  - `data/scenarios/ai-decision-checkpoints/cp-b008-03.json`

## Aktuell rote Fälle

### CP-B008-01 – Break vor runbeendenden Subroutinen

- Decision 54, StateVersion 103.
- Runner besitzt 2 Credits und Matador.
- Zwei Break-Aktionen sind legal und kosten jeweils 1 Credit.
- Die KI wählt trotzdem `continue_run`, lässt eine Programmtrash- und eine
  End-the-run-Subroutine auslösen und erhält dafür bereits einen Rohmalus von
  `-2500`.
- Aktueller Checkpoint: rot.
- Gegenprobe mit 0 Credits und ohne bezahlbaren Break: grün.

### CP-B008-02 – Event-Run ohne passierbaren bekannten Pfad

- Decision 67, StateVersion 131.
- Der bekannte R&D-Pfad ist mit dem sichtbaren Rig nicht passierbar.
- Basis-Runs sind deshalb bereits korrekt ausgeschlossen.
- Gypsy Schedule Analyzer wird als eingebetteter Event-Run nicht gleichartig
  projiziert und gewinnt nur durch `selected_by_plan_mapping:250`.
- Aktueller Checkpoint: rot.
- Gegenprobe mit offenem R&D-Pfad: grün; ein normaler R&D-Run oder Gypsy sind
  dort beide fachlich zulässig.

### CP-B008-03 – Zwei-Karten-Handpuffer

- Decision 69, StateVersion 134.
- Runner besitzt zwei Handkarten, 4 Credits und zwei Klicks.
- Bezahlter Draw liegt mit 979 Punkten nur 50 unter dem Credit mit 1029.
- Der folgende einzelne Draw erhöht die Hand nur auf drei; die Partie endet im
  anschließenden Corp-Zug durch Flatline. Die verdeckte konkrete
  Kartenreihenfolge ist keine Entscheidungsgrundlage, der sichtbare
  Zwei-Karten-Puffer dagegen schon.
- Aktueller Checkpoint: rot.
- Gegenprobe mit vier Handkarten: grün und nicht künstlich auf Credit
  festgelegt; eine andere konkrete Entwicklungskarte bleibt zulässig.

## Ausgeschlossene Beobachtungen

- Frühe Probeläufe gegen ungerezztes ICE werden nicht pauschal verboten.
- Die spätere verdeckte Urban-Renewal-Karte wird nicht als damaliges Wissen
  verwendet.
- Erfolgloser zufälliger Access und zufällige Kartenreihenfolge erzeugen keinen
  Fix.

## Red-/Green-Ergebnis

Kontrollierter Lauf: 6 Tests, davon exakt 3 rote Zieltests und 3 grüne
Gegenproben. Alle roten Fälle sind `behavior_regression`; es gab keinen
Fixture-, Restore-, Redaction- oder Legality-Fehler.
