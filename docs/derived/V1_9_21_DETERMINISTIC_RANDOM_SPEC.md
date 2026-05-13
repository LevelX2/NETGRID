# V1.9.21 Deterministic Random Spec

Status: planned
Stand: 2026-05-13

## Modell

V1.9.21 buendelt Karten, deren Wirkung ein zufaelliges Ergebnis oder einen Wuerfelwurf braucht. Zufall bleibt Engine-intern deterministisch:

- Seed und RandomCounter sind die einzige Quelle fuer neue Zufallswerte.
- Jede Ziehung oder Wuerfelauflösung erzeugt einen RandomDrawRecord.
- PublicEvents duerfen Ergebnis und oeffentliche Quelle zeigen, aber keine verdeckten Kartenidentitaeten.

## Engine-Regel

Kartentext wird nicht geparst. Jede Zielkarte erhaelt einen eng typisierten Resolver oder eine eng typisierte Helper-Familie. LegalActions zeigen nur erlaubte Aktionen aus dem aktuellen PlayerView-Kontext; `applyAction` revalidiert Quelle, Side, Timing, Kosten, Ziele und Zufallsfenster erneut.

## Sichtbarkeit

Zufallsergebnisse sind oeffentlich, wenn der Effekt oeffentlich aufgeloest wird. Verdeckte Zonen bleiben abstrakt, solange keine bereits legale Reveal-/Access-Logik greift.

## Replay

Replay muss dieselben RandomDrawRecords, dieselbe State-Version-Folge und denselben finalen StateHash erzeugen.
