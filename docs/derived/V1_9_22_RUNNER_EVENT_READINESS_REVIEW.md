# V1.9.22 Runner Event Readiness Review

Stand: 2026-05-13 18:06 CEST
Status: WIP-Readiness, keine Runtime- oder Release-Promotion

## Befund

Die zehn Runner-Event-Zielkarten des V1.9.22-Slices sind im Scope, im Catalog-WIP-Guard und als Runtime-Definitionen mit finalen display-only Texten enthalten:

- Anonymous Tip
- Core Command: Jettison Ice
- Forged Activation Orders
- If You Want It Done Right...
- misc.for-sale
- Open-Ended Mileage Program
- Organ Donor
- Security Code WORM Chip
- Synchronized Attack on HQ
- Valu-Pak Software Bundle

Die fuehrende V1.9.10-bis-V1.9.xx-Funktionsmatrix bestaetigt fuer diese Karten nur `Runner-Event mit Soforteffekt`. Das historische V1.0.5K-Rueckstellregister nennt fuer einzelne Karten konkrete Kernnotizen, aber noch keinen vollstaendigen Resolververtrag:

- Core Command: Jettison Ice: Successful-HQ-run-Flag und Zielauswahl rezzed ICE.
- Forged Activation Orders: Corp-Entscheidung: rezzen oder trashen.
- If You Want It Done Right...: Stack ansehen, Karte wählen, Rest sortieren.
- misc.for-sale / Organ Donor: Multi-Auswahl aus installierten Karten bzw. Hand.
- Open-Ended Mileage Program: Tag-Entfernung plus Rücknahme-Option.
- Security Code WORM Chip: Successful-HQ-run-Flag und Zielauswahl unrezzed ICE.
- Valu-Pak Software Bundle: Eingeschränkte Extra-Aktionssequenz.

## Entscheidung für den nächsten Umsetzungsschnitt

Ein echter `play_event`-Resolver darf erst ergänzt werden, wenn fuer die konkrete Karte Kosten, Zielmenge, Timingbedingung, Folgechoice und Zone-/Trash-/Heap-Bewegung lokal bestaetigt sind. Die bisherigen Kernnotizen reichen als Einstieg, aber noch nicht fuer eine `human_playable`-, `deck_legal`- oder `ai_supported`-Promotion.

Der sichere WIP-Schnitt bleibt daher:

1. Eventkarten als Runtime-WIP ohne `play_event`-LegalAction-Promotion belassen.
2. Den bestehenden No-`play_event`-Guard beibehalten.
3. Fuer den naechsten echten Resolver eine einzelne Karte mit vollstaendig lokal bestaetigtem Vertrag auswaehlen.

## Removal Condition

Der Eventschnitt kann in Code gehen, sobald fuer mindestens eine Eventkarte ein lokaler Resolververtrag vorliegt:

- `canPlay`-/Timingbedingung,
- benoetigte Ziele und Choice-Optionen,
- Kosten und Zusatzkosten,
- Zonebewegungen inklusive Heap/Archives/Trash,
- PublicEvent-/PlayerView-Redaction,
- Replay-/StateHash-Erwartung,
- AI-Fallback-Verhalten.

## Gate-Auswirkung

V1.9.22 bleibt `implementing`. Dieser Review ist kein fachlicher P0-Blocker, sondern ein Schutz gegen erfundene Eventwirkungen.
