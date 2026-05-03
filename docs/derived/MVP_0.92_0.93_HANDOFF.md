# MVP 0.92 + 0.93 Handoff

Status: Übergabeplanung für einen neuen Umsetzungsthread
Stand: 2026-05-03

## 1. Empfohlene Reihenfolge

1. V0.92 als Dokumentations- und Requirements-Gate abschließen.
2. V0.92 final reviewen und V0.93 freigeben.
3. V0.93 M1 technisch implementieren.
4. In V0.93 nur M2-Requirements erstellen, keine M2-Mechanik implementieren.
5. Danach getrennt entscheiden, ob V0.94 Damage/Flatline startet.

## 2. Übergabe-Prompt für den nächsten Thread

```text
Bitte setze V0.92 + V0.93 für das Netrunner-Projekt gemäß den bestehenden Projektregeln um.

Arbeitsbasis zuerst lesen:
- KI-Wissen-Netrunner/00 Projektstart.md
- KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md
- KI-Wissen-Netrunner/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md
- KI-Wissen-Netrunner/00 Steuerung/Regeldatei KI-Wissenspflege.md
- docs/codex/CODEX_STATUS.md
- docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md
- docs/derived/MECHANICS_COMPLETION_PLAN.md
- docs/derived/MVP_0.92_DETAILED_PLAN.md
- docs/derived/MVP_0.93_DETAILED_PLAN.md
- docs/derived/MVP_0.92_0.93_HANDOFF.md

Ziel:
1. V0.92 abschließen: Mechanik-Coverage-Matrix, M1-Requirements, M1-Effect/Timing-Spezifikation, M1-Testmatrix, Requirements Review und Final Review erstellen.
2. Danach V0.93 umsetzen: M1-Shared-/Engine-Grundlage für Effects, Abilities, Timing, Choices und Eventklassifikation implementieren.
3. In V0.93 zusätzlich M2-Requirements für Setup/Game-End erstellen.

Grenzen:
- Keine V0.94+-Mechanik implementieren.
- Keine Damage-, Trace-, Resource-, Mulligan-, Multiaccess-, Identity-Ability- oder Prevention-Mechanik freischalten.
- Keine neue spielbare Karte hinzufügen.
- Bestehende Actions und UI-Payloads kompatibel halten.
- Fremde lokale Änderungen nicht zurücksetzen und nicht versehentlich mitcommitten.
- V0.91-Kartenbild-Artefakte nur anfassen, wenn die Status-Reconciliation das ausdrücklich verlangt und die Änderungen klar getrennt bleiben.

Priorität:
- Engine-Korrektheit und Hidden-Info-Sicherheit vor Komfort.
- LegalActions bleiben die einzige Quelle für PlayerActions.
- applyAction revalidiert Side, actionId, stateVersion, Timing, Kosten, Ziele und Choices.
- Replay, StateHash, Visibility, Undo, WebSocket, Reconnect und KI-Input müssen side-sicher bleiben.
```

## 3. Entscheidungen vor oder während der Umsetzung

| Entscheidung | Empfohlene Vorgabe für den Umsetzungsthread |
|---|---|
| V0.91-Status widersprüchlich | Mechanikarbeit fortsetzen, aber Status als offen dokumentieren, solange keine Benutzerentscheidung zu privaten lokalen Bildern vorliegt. |
| Maschinenlesbare Mechanik-Matrix | Ja, zusätzlich zur Markdown-Matrix anlegen, sofern die vorhandenen Datenartefakt-Konventionen passen. |
| Public Action API | Bestehende Action Types sichtbar behalten. Generische Ability-Struktur intern einführen. |
| `trigger_ability` | Nur vorbereiten oder einsetzen, wenn wirklich nötig. Keine UI-Migration erzwingen. |
| `pendingChoice` | In V0.93 additiv einführen und side-sicher testen. Keine neue sichtbare Choice-Mechanik freischalten. |
| Resolver-Umbau | Adapterstrategie nutzen. Erst Pilotpfade, dann weitere direkte Resolver migrieren. |
| StateHash-Rebaselines | Nur nach dokumentierter, absichtlicher State-/Eventschema-Änderung. |
| M2 | Nur Requirements. Mulligan und Game-End-Normalisierung nicht implementieren. |

## 4. Dateien, die der neue Thread voraussichtlich erzeugt

V0.92:

- `docs/derived/MVP_0.92_REQUIREMENTS.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.92.json`
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`
- `docs/derived/MECHANIC_M1_TEST_MATRIX.md`
- `docs/derived/MVP_0.92_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.92_FINAL_REVIEW.md`

V0.93:

- Shared-/Engine-Änderungen nach V0.93-Plan
- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- `docs/derived/MVP_0.93_REQUIREMENTS.md`
- `docs/derived/MVP_0.93_TEST_MATRIX.md`
- `docs/derived/MVP_0.93_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.93_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.93_FINAL_REVIEW.md`

## 5. Klärpunkte für den Benutzer

Diese Punkte sind nicht zwingend nötig, um die Planung zu verstehen, sollten aber vor oder zu Beginn der Umsetzung kurz bestätigt werden:

1. Soll V0.91 im Status als privat-lokale Kartenbildentscheidung freigegeben werden, oder bleibt das Asset-Gate unabhängig blockiert/offen?
2. Soll die V0.92-Coverage-Matrix als Pflichtdatenartefakt unter `data/rules` entstehen?
3. Darf V0.93 `pendingChoice` bereits in Shared/GameState/PlayerView einführen, obwohl Mulligan und Trace noch nicht spielbar werden?
4. Soll V0.93 bestehende Breaker-Aktionen intern auf Ability-Definitionen migrieren, während die öffentlichen Action Types gleich bleiben?
5. Sollen StateHash-Rebaselines erlaubt sein, falls sich das interne Eventschema bewusst ändert, oder sollen bestehende Hashes möglichst hart erhalten bleiben?
