# V1.1.3 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`
- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_REQUIREMENTS.md`
- `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_TEST_MATRIX.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/V1_1_2K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`
- `docs/KI-Player/NETGRID_KI_Releaseplanung_Codex_Briefing.md`

## Ergebnis

`V1_1_3_requirements_freeze_done: true`

`ready_for_implementation: false`

V1.1.3 ist bewusst nicht implementierbar, weil der Release selbst nur Planungs- und Normalisierungsarbeit enthält. Der Abschluss besteht in den erstellten Planungsartefakten und der Statuspflege. Die Umsetzung startet erst mit V1.2.0.

## Geklärte Entscheidungen

- V1.2.x kommt vor weiteren K-Kartenreleases.
- Die 52 vorhandenen O:NR-v1-Runtime-Karten bleiben `human_playable` und `deck_legal`, werden aber nicht automatisch `ai_supported`.
- KI-Smokes sind Sicherheitsabdeckung, keine strategische KI-Freigabe.
- V1.2.0 enthält Prevention/Avoid/Interrupt-Grundlagen, aber keine Replacement Effects.
- V1.2.1 enthält Replacement Effects als getrenntes Gate.
- Special Zones, Set Aside, Remove from Game, Ownership und Control bleiben für spätere Releases.

## Stärken

- Die Planungsbasis trennt Karten-, Mechanik- und KI-Freigabe klar.
- Der AI-Level-Audit ist konservativ und überdehnt die heutige KI nicht.
- Hidden Info, Replay, StateHash, LegalActions/applyAction, Multiplayer, Reconnect, Undo und KI-Inputs sind als harte Folgegates festgeschrieben.
- Das Statusmodell verhindert automatische Spielbarkeit aus Katalog, Import, Bilddaten oder AI-Rollen.

## Bekannte Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Implementierungsthreads könnten `ai_supported` zu breit lesen. | Mittel | Handoff und Requirements sagen ausdrücklich: AI-Hints plus Szenario plus DecisionDebug sind Pflicht. |
| Weitere K-Releases wirken verlockend, weil einfache Karten noch möglich sein könnten. | Mittel | V1.1.3 priorisiert V1.2.x wegen Mechanikblockern. |
| Event Modification und Replacement werden verwechselt. | Hoch | Separate V1.2.0- und V1.2.1-Spezifikationen. |

## Offene Punkte

Keine blockierenden offenen Punkte für den Planungsabschluss.

Nicht blockierend:

- Ein maschinenlesbares Card-/Mechanic-Support-Manifest kann später ergänzt werden.
- Die historische V1.0.5-Finalartefakt-Lücke bleibt dokumentiert, blockiert V1.2.x aber nicht.

## Gate

V1.1.3 ist als Planungsrelease abgeschlossen, sobald Status und Wissensbasis aktualisiert sind.
