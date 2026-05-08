# V1.2.1 Replacement Effects - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.2.1 ergänzt Replacement Effects als eigenes Hochrisiko-Gate auf Basis von V1.2.0. Replacement wird nicht mit Prevention, Avoid oder Interrupts vermischt.

Der Release implementiert nur eine eng testbare Replacement-Pipeline und höchstens einen test-only Pilotfall. Er gibt keine neue Runtime-Karte und kein KI-Deck frei.

## Quellenbasis

- `docs/derived/V1_2_0_EVENT_MODIFICATION_DETAILED_PLAN.md`
- `docs/derived/EVENT_MODIFICATION_1_2_0_SPEC.md`
- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/POST_V1_1_2_MECHANICS_AI_CARD_ROADMAP.md`
- bestehende Specs für Damage, Access/Breach, Trash/Steal, Visibility, Replay, StateHash und KI-Inputs

## Scope

- Replacement-Pipeline getrennt von Prevention/Avoid/Interrupt.
- Originalevent und Replacementevent im EventLog.
- Einmal-pro-Fenster-Regeln.
- Deterministische Reihenfolge bei mehreren Kandidaten.
- Sichtbare Blockade bei Konflikten, die nicht sicher aufgelöst werden können.
- Prüfung von Access-, Trash-, Steal- und Damage-Replacement-Pilotfällen.
- Test-only Pilot bevorzugt über Damage Replacement, sofern V1.2.0 Damage-Pilot grün ist.
- KI-Support nur als LegalAction-Fallback; strategische KI-Nutzung erst bei konkreter Mechanikfreigabe und AI-Hints.

## Nicht-Ziele

- Keine neue Runtime-Karte.
- Keine KI-Deckfreigabe.
- Keine Special Zones, Ownership, Control, Set Aside oder Remove from Game.
- Keine breite offizielle Replacement-Matrix.
- Keine automatische Kartentextauslegung.
- Keine öffentlichen Plattformfunktionen.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.

## Abhängigkeiten

| Abhängigkeit | Status | Bedeutung |
| --- | --- | --- |
| V1.2.0 Event Modification | muss umgesetzt und grün sein | Replacement nutzt ImminentEvent, PendingChoice, EventLog, Replay und Redaction-Grundlagen. |
| Damage-Pilot | bevorzugt grün | Primärer test-only Replacement-Pilot, wenn stabil. |
| Access/Breach | vorhanden, eng | Kandidat für spätere Replacementtypen, aber hoher Hidden-Info-Risikograd. |
| Trash/Steal | vorhanden, eng | Kandidaten für spätere Replacementtypen, aber nur nach konfliktfreier Spezifikation. |
| KI-Fallback | vorhanden/aus V1.2.0 gehärtet | KI muss Replacement-Fenster legal passieren können. |

## Pilotfall-Prüfung

| Pilotfamilie | Bewertung | V1.2.1-Entscheidung |
| --- | --- | --- |
| Damage Replacement | niedrigster relativer Integrationsaufwand, wenn V1.2.0 Damage Prevention stabil ist; testet Original/Replacement vor Randomness. | Bevorzugter test-only Pilot. |
| Access Replacement | fachlich wichtig, aber höchstes Hidden-Info- und Queue-Risiko. | Spezifizieren und als späteren Kandidaten blockiert lassen. |
| Trash Replacement | mittel; Root/Archives/Heap/Trash-Ziele müssen exakt sein. | Nicht Primärpilot; Konflikt-/No-Scope-Tests vorbereiten. |
| Steal Replacement | hoch, weil Agenda-Punkte, Score Area und Game-End betroffen sind. | Nicht Primärpilot; nur Spezifikationsprüfung. |

Bevorzugter Pilot: Damage Replacement als test-only Harness, z. B. "würde Damage eintreten, ersetze das Damage-Event durch ein öffentliches Tag-Event" oder eine gleichwertige nicht promotete Fixture. Der konkrete Effekt muss im Implementation Review dokumentiert werden. Er darf keine Karte freigeben.

## Reihenfolge

1. V1.2.0 muss abgeschlossen und grün sein.
2. Replacement-Eventobjekt und ReplacementWindow definieren.
3. Replacement-Kandidaten getrennt von prevent/avoid/interrupt sammeln.
4. Einmal-pro-Fenster-Tracking einführen.
5. Deterministische Kandidatenordnung festlegen.
6. Konfliktblocker für mehrdeutige Fälle ergänzen.
7. Bevorzugten Damage-Replacement-Pilot umsetzen oder begründet durch einen anderen test-only Pilot ersetzen.
8. EventLog mit Originalevent und Replacementevent schreiben.
9. Replay/StateHash, Visibility, Undo, Multiplayer/Reconnect und KI-Fallback testen.
10. Karten- und KI-Deck-No-Scope bestätigen.

## Engine-Vertrag

Replacement wirkt auf ein `OriginalEvent`, bevor dieses final aufgelöst wird. Wenn ein Replacement angewandt wird:

- bleibt das Originalevent im EventLog als ersetzt erhalten,
- entsteht genau ein `ReplacementEvent`,
- wird das Originalevent nicht zusätzlich final angewandt,
- wird die einmal-pro-Fenster-Regel für den Replacement-Kandidaten verbraucht,
- durchläuft das Replacementevent nur die ausdrücklich erlaubten Folgefenster.

## Server-Vertrag

- Replacement-Choice ist eine normale LegalAction/PlayerAction.
- Server akzeptiert keine Replacement-Sonderroute.
- Idempotency verhindert doppelte Anwendung.
- Reconnect zeigt nur side-sichere Replacement-Fenster.
- Konfliktblocker werden als redigierte, sichtbare Fehler oder LegalAction-Abwesenheit abgebildet.

## Web-Vertrag

- Web rendert Replacement-PendingChoice aus PlayerView.
- UI zeigt Originalevent und Replacementoption nur soweit sichtbar.
- Keine Client-Logik entscheidet, welche Replacement-Kandidaten existieren.
- Undo-Preview nennt keine verborgenen Replacement-Quellen.

## KI-Vertrag

- KI darf Replacement nur wählen, wenn eine LegalAction existiert.
- Ohne AI-Hints wählt KI legalen Pass/Fallback.
- Strategische Bewertung ist nur für konkrete `ai_supported` Replacement-Mechanik erlaubt.
- `AiDecisionDebug` darf Originalevent, Replacementwahl und Abwägung nur side-sicher nennen.

## Kartenstatus- und Mechanik-Coverage-Auswirkung

- Keine Karte wird in V1.2.1 promoted.
- Mechanik-Coverage darf nach Umsetzung höchstens für den getesteten Pilottyp `implemented_limited` werden.
- Generisches Replacement bleibt offen oder `implemented_limited` mit klarer Granularität.
- Karten mit Access-, Trash-, Steal- oder Damage-Replacement bleiben gesperrt, bis ihr konkreter Typ freigegeben, getestet und AI-Hints-geprüft ist.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Replacement wird wie Prevention behandelt. | Sehr hoch | Getrennte Pipeline, eigene EventLog-Kategorien und Tests. |
| Originalevent wird zusätzlich angewandt. | Sehr hoch | Replay-/StateHash- und Outcome-Tests. |
| Replacement kann mehrfach im selben Fenster greifen. | Hoch | Einmal-pro-Fenster-Regel und Test. |
| Mehrere Kandidaten erzeugen stille Priorität. | Hoch | Deterministische Ordnung oder sichtbarer Blocker. |
| Access-/Steal-Replacement leakt Hidden Info. | Sehr hoch | Nicht Primärpilot; spätere Typen blockieren, bis spezifiziert. |
| KI nutzt Replacement ohne Hints strategisch. | Mittel | Pass-/Fallback-Pflicht und AI-supported-Gate. |

## Offene Fragen

Keine blockierende offene Frage für die Umsetzung.

Nicht blockierend:

- Der konkrete test-only Damage-Replacement-Effekt wird im Umsetzungsthread gewählt, solange er Original/Replacement sauber testet und keine Karte freigibt.
- Access-, Trash- und Steal-Replacement bleiben als geprüfte, aber nicht freigegebene Pilotfamilien dokumentiert.

## Gate

`V1_2_1_requirements_freeze_done: true`

`ready_for_implementation: true`

V1.2.1 darf erst nach erfolgreicher V1.2.0-Implementierung umgesetzt werden.
