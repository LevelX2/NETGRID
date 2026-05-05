# V1.0.5 Requirements Review - Action Board UX und Board-Klarheit

Stand: 2026-05-05
Status: bestanden

## Review-Ergebnis

Die V1.0.5-Anforderungen sind ausreichend eingefroren, um die Umsetzung zu starten.

Der Scope ist bewusst eng: V1.0.5 verbessert die Lesbarkeit laufender Partien, normalisiert sichtbare UI-Begriffe und härtet V1.0.2-Cues/KI-Pacing sowie V1.0.4-Lifecycle-Verträge gegen Regression. Die Phase verändert keine Engine-Regeln, keine Karten, keine Mechaniken, keine Replay-Daten und keinen StateHash.

## Geprüfte Artefakte

- `docs/derived/V1_0_5_ACTION_BOARD_UX_PLAN.md`
- `docs/derived/V1_0_5_REQUIREMENTS.md`
- `docs/derived/ACTION_BOARD_UX_1_0_5_SPEC.md`
- `docs/derived/BOARD_RUN_UI_1_0_5_SPEC.md`
- `docs/derived/V1_0_5_TEST_MATRIX.md`
- `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md`
- `docs/derived/V1_0_2_REQUIREMENTS.md`
- `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md`
- `docs/derived/V1_0_4_REQUIREMENTS.md`
- `docs/derived/V1_0_4_FINAL_REVIEW.md`
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`
- `docs/codex/CODEX_STATUS.md`
- `apps/web/app/page.tsx`
- `apps/web/app/chronicle.ts`
- `apps/web/app/action-cues.ts`
- `tests/specs/visibility-contract.test.ts`

## Konsistenzprüfung

| Vorgabe | Status | Ergebnis |
| --- | --- | --- |
| Engine bleibt Regelautorität | pass | V1.0.5 ist ausdrücklich Darstellung/Präsentation; keine GameState-, Replay- oder StateHash-Erweiterung. |
| Kein FullState im Browser | pass | Spezifikationen erlauben nur PlayerView, LegalActions, side-gefilterte Events, safe Match-Payloads und lokale UI-Einstellungen. |
| Keine Hidden-Info-Leaks | pass | Redaction, Runner-Rig, zentrale Server, Archive-Counts und Breach-/Access-Fortschritt haben eigene No-Leak-Regeln und Testspuren. |
| V1.0.2-Cues bleiben geschützt | pass | Cue-Mapping, Redaction, Reconnect-Queue, Audio und Highlight-Regeln sind Must- und Testspuren. |
| KI-Pacing bleibt LegalActions-basiert | pass | `advance_ai`, `fast`, `paced`, `manual` und `applyAction`-Revalidierung sind Regression-Gates. |
| V1.0.4-Lifecycle bleibt geschützt | pass | Forfeit/terminaler Status und Token-/Session-Sicherheit bleiben Teil der Regression-Gates. |
| Deutsche UI-Begriffe sind testbar | pass | Ein projektinternes UI-Glossar ersetzt die vorher offene Glossarfrage für V1.0.5. |
| Browser-Smoke ist wiederholbar | pass | Ein eigenes Smoke-Dokument definiert konkrete Prüfpunkte, auch ohne neues E2E-Framework. |
| Keine Scope-Ausweitung | pass | Neue Karten, Mechaniken, Assets, Tutorial, Chat-Erweiterung und Plattformfunktionen sind gesperrt. |

## Risikoentscheidungen

| Risiko | Entscheidung |
| --- | --- |
| Es liegt keine offizielle deutsche Terminologiefreigabe vor. | V1.0.5 nutzt ein projektinternes UI-Glossar. Es beansprucht keine offizielle Übersetzung und ändert keine technischen IDs. |
| `R&D` deutsch zu glätten könnte Wiedererkennung verlieren. | UI-Hauptlabel ist `F&E (R&D)`, technische ID bleibt `rd`, Tests dürfen beide Displayteile erwarten. |
| `Jack-out` ist als englischer Begriff etabliert. | Haupttext wird deutsch `Run abbrechen`, etablierter Begriff darf in Klammern bleiben. |
| Runner-Rig-Gruppierung könnte vermeintliche Nicht-Karten anzeigen. | Nur tatsächlich sichtbare PlayerView-Rig-Karten werden gruppiert; leere Gruppen bleiben kompakt oder ausgeblendet. |
| Browser-/Visual-Smokes bleiben manuell. | Für V1.0.5 ist ein wiederholbares dokumentiertes Runbook zulässig; automatisches E2E bleibt späterer Qualitätsrelease. |
| Action-Gruppen könnten durch rohe ActionTypes sichtbar bleiben. | Requirements und Spec verlangen ein Mapping; Testmatrix enthält einen Glossar-/Rohlabel-Test. |

## Coverage-Check

| Bereich | Status |
| --- | --- |
| Must-Anforderungen | pass, 12 Must-Anforderungen mit Testspur |
| Action Board UX | pass |
| Board-/Run-/Server-Spezifikation | pass |
| UI-Glossar | pass |
| Cue-/Audio-/Reconnect-Regression | pass |
| KI-Pacing-/Advance-AI-Regression | pass |
| Hidden-Info-/Payload-Regression | pass |
| Browser-/Visual-Smoke | pass, als Implementierungs-Gate definiert |
| Scope-Grenzen | pass |

## Offene Punkte

Keine blockerrelevanten offenen Punkte.

Für die Umsetzung bleiben normale technische Detailentscheidungen offen, aber ausreichend begrenzt:

- exakte CSS-Position des Cue-Overlays auf Desktop und schmalem Viewport,
- ob Rig-Gruppen mit leeren Gruppen vollständig ausgeblendet oder kompakt angezeigt werden,
- ob R&D in bestimmten engen UI-Stellen als `F&E` oder `F&E (R&D)` angezeigt wird,
- ob Browser-Smoke zunächst manuell dokumentiert oder mit Browser-Automation teilautomatisiert wird.

Diese Punkte blockieren die Implementierung nicht, solange Requirements, Spezifikationen und Testmatrix eingehalten werden.

## Gate

`V1_0_5_requirements_freeze_done: true`

`ready_for_implementation: true`
