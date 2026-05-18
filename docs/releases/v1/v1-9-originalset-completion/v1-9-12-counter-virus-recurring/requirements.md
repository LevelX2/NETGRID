# V1.9.12 Requirements - Counter, Virus, Purge und Recurring Pools

Stand: 2026-05-12
Status: ready_for_implementation

## Must

- V1912-M01: Genau die elf V1.9.12-Zielkarten duerfen im Release-Scope bearbeitet werden.
- V1912-M02: Alle neuen Counter-/Pool-Aenderungen laufen ueber Rules-Engine-State und werden in `applyAction` erneut validiert.
- V1912-M03: `purge_virus_counters` bleibt Corp-only, kostet exakt drei Clicks und entfernt nur Virus-Counter.
- V1912-M04: Recurring-Pools refreshen am Start des passenden Runner-Zugs ohne Akkumulation.
- V1912-M05: Karten mit Hidden-Zone-Anteil verwenden nur side-sichere V1.9.11-Pfade und duerfen keine verdeckten Daten in PublicEvents, PlayerViews, KI-Inputs oder Reconnect-Payloads leaken.
- V1912-M06: Jede promotete Karte braucht Engine-/LegalAction-, Visibility-, Replay-/StateHash-, Szenario-, Manifest-, Coverage- und AI-Nachweis.
- V1912-M07: Vor Completion bleiben Katalog- und AI-Promotion explizit offen dokumentiert.

## Should

- V1912-S01: Gemeinsame Helfer fuer Virus-/Recurring-Karten nutzen statt per-card Sonderzustand zu duplizieren.
- V1912-S02: Corp-Agenda-Counter-Faehigkeiten analog zu den bestehenden Coup-Agenda-Pfaden eng typisieren.
- V1912-S03: AI-Fallbacks duerfen installierbare Counter-/Recurring-Karten nutzen, aber keine Hidden-Zone-Privatinformation sehen.

## Completion Gate

V1.9.12 ist erst abgeschlossen, wenn alle Musts nachweisbar erfuellt sind, die volle Checkgruppe gruen ist und `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/final-review.md` das Gate bestaetigt.

