# V1.1.2 Requirements Review

Stand: 2026-05-07
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_1_2_REQUIREMENTS.md`
- `docs/derived/FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md`
- `docs/derived/MATCHSTART_ENTRY_UX_1_1_2_SPEC.md`
- `docs/derived/V1_1_2_TEST_MATRIX.md`
- `docs/derived/V1_1_2_FULL_ARCHIVES_AND_MATCHSTART_ENTRY_UX_PLAN.md`

## Ergebnis

`ready_for_implementation: true`

V1.1.2 ist ausreichend geplant, um nach Abschluss/Entscheidung des aktuellen V1.1.1-Scopes umgesetzt zu werden. Der Release ist bewusst zweigeteilt:

- Track A ist der fachlich verbindliche Full-Archives-Access-Gate.
- Track B ist ein unabhängiger Web-UI-Komfortslice für den Matchstart.

Die Trennung ist klar genug, um Track B bei Risiko ohne fachlichen Verlust zu verschieben.

## Stärken

- Full Archives Access ist als Visibility-first-Gate geschnitten.
- Die kritische Hidden-Info-Frage facedown Archives vor Access ist explizit adressiert.
- Queue-Reihenfolge, Reveal-Zeitpunkt, Undo-Barriere, Reconnect und Replay/StateHash sind testbar formuliert.
- Track B bleibt Web-UI-only und ändert keine Regel- oder Serververträge.
- Testmatrix deckt Engine, Server, AI, Web, E2E, Visibility und No-Scope ab.

## Geklärte Entscheidungen

- V1.1.2 bleibt der Roadmap-Slot für Full Archives Access.
- Matchstart Entry UX wird integriert, aber bleibt verschiebbar.
- Archives-Queue verwendet die authoritative `corp.archives`-Reihenfolge.
- Facedown Archives-Karten sind Hidden Info, bis sie tatsächlich accessed werden.
- Track B nutzt Kacheln und Summary, aber keinen neuen Servermodus.
- `Einzelspiel · Deckziel` bleibt entfernt.

## Bekannte Umsetzungsrisiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Archives-Access leakt künftige facedown Queue-Einträge. | Hoch | Engine-/Visibility-/E2E-Leaktests sind Pflicht. |
| Trash aus Archives erzeugt doppelte Archives-Einträge. | Mittel | Spezifischer Engine-Test V112A-T008. |
| Undo-Barriere ist technisch konservativer als fachlich minimal. | Niedrig | Zulässig, wenn dokumentiert und getestet. |
| Track B vergrößert den Release. | Mittel | Track B ist verschiebbar und darf Track A nicht blockieren. |
| E2E-Helfer brauchen gleichzeitige Archives- und Startscreen-Anpassungen. | Mittel | Track A zuerst, Track B danach. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend für Implementation:

- Ob faceup-only Archives-Access weiterhin pauschal als Hidden-Info-Barriere behandelt wird, darf die Umsetzung konservativ entscheiden und im Implementation Review dokumentieren.
- Ob Track B im selben Release bleibt, wird nach Track-A-Aufwand entschieden.

## Gate

`V1_1_2_requirements_freeze_done: true`

`ready_for_implementation: true`

## Nächster empfohlener Prompt

```text
Setze V1.1.2 Full Archives Access und Matchstart Entry UX um.

Lies zuerst:
- AGENTS.md
- docs/codex/CODEX_STATUS.md
- docs/derived/V1_1_2_REQUIREMENTS.md
- docs/derived/FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md
- docs/derived/MATCHSTART_ENTRY_UX_1_1_2_SPEC.md
- docs/derived/V1_1_2_TEST_MATRIX.md
- docs/derived/V1_1_2_REQUIREMENTS_REVIEW.md

Implementiere zuerst Track A Full Archives Access und danach Track B Matchstart Entry UX, sofern Track A grün bleibt.

Nicht erweitern:
- keine Prevention/Avoid/Interrupt/Replacement Effects,
- keine neuen Karten,
- keine offiziellen Assets,
- keine öffentlichen Plattformfunktionen,
- keine neue Regelautorität in UI, Server, Browser oder KI.

Pflichtchecks siehe V1_1_2_TEST_MATRIX.md.
```
