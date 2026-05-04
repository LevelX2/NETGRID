# MVP 0.94/0.95 Assumption Review

Status: Planungsreview, keine Implementierung
Stand: 2026-05-03

## Ergebnis

Die Grundannahmen aus `MECHANICS_COMPLETION_PLAN.md` stimmen weiterhin:

- V0.94 bleibt als erstes hohes Hidden-Info-Gate für Damage und Flatline sinnvoll.
- V0.95 bleibt als Runner-Resource- und Tag-Interaktionsgate sinnvoll.
- V0.91-Assets bleiben unabhängig von Mechanikarbeit.
- V0.93 hat die nötige M1-Basis für Effects, Ability-Metadaten, Choices und Eventklassifikation bereitgestellt.

Eine Annahme wird geschärft:

V0.94 darf Damage nur umsetzen, wenn es vorher einen schmalen Game-End-Grundvertrag für Flatline und Winner-Reason einführt. Das ist nicht der volle M2-Scope. Mulligan, Identity-Setup und Archives/Multiaccess bleiben weiterhin getrennt.

## Geprüfte Quellen

- `docs/codex/CODEX_STATUS.md`
- `docs/derived/MECHANICS_COMPLETION_PLAN.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.92.json`
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`
- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- `docs/derived/MVP_0.93_FINAL_REVIEW.md`
- `docs/derived/DEVIATION_REGISTRY.md`
- `docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf`

## Annahmenstatus

| Annahme | Status | Konsequenz |
|---|---|---|
| V0.93 ist abgeschlossen und M1 kann als Fundament genutzt werden. | stimmt | V0.94/V0.95 dürfen auf `EffectCommand`, `PendingChoice`, `abilityRef` und `visibilityClass` planen. |
| M2 ist nur spezifiziert. | stimmt | V0.94 muss Flatline als engen Game-End-Teilvertrag planen, darf aber keinen Mulligan starten. |
| Damage ist das nächste wichtige Hidden-Info-Gate. | stimmt | V0.94 priorisiert RandomDrawRecords, Undo-Barrieren, PublicEvent-Redaktion und AI-Sichtbarkeit. |
| Resources können direkt nach Damage folgen. | stimmt mit Vorbehalt | V0.95 kann unabhängig von Trace starten, braucht aber `CardType: resource`, Runner-Rig-Erweiterung und Tag-Trash-Regeln. |
| Trace sollte nicht mit Resources vermischt werden. | stimmt | V0.95 darf Tags nutzen, aber keine Trace-/Link-/Bidding-Sequenz implementieren. |
| Private lokale Kartenbilder beeinflussen keine Mechanik. | stimmt | Keine V0.94/V0.95-Anforderung darf Bilddaten in Engine, AI, Replay oder StateHash nutzen. |
| Der Worktree ist sauber genug für Folgeimplementierung. | aktuell nicht gesichert | Vor V0.94-Implementierung müssen fremde lokale Änderungen geprüft, getrennt committed oder ausdrücklich ausgeklammert werden. |

## Empfohlene Reihenfolge

1. V0.94 Requirements-Freeze für Damage/Flatline.
2. V0.94 Implementierung nur nach grünem Requirements Review.
3. V0.95 Requirements-Freeze für Resources/Tag-Interaktion.
4. V0.95 Implementierung erst nach V0.94-Finalgate oder expliziter Scope-Entscheidung, falls Damage verschoben wird.

## Offene fachliche Klärungen vor Requirements-Freeze

- Exakte Damage-/Flatline-Semantik aus CR v26.03 vor V0.94-Requirements final prüfen.
- Ob Runner-Heap im PlayerView für beide Seiten sichtbar werden muss oder ob V0.94 eine dokumentierte Vereinfachung behält.
- Exakte Corp-Basic-Action-Kosten für Resource-Trash bei getaggtem Runner vor V0.95-Requirements final prüfen.
- Ob V0.95 eine erste Resource nur als blanke Boardkarte oder bereits mit einer einfachen sichtbaren Fähigkeit einführt.

## Testplanungsergänzungen

V0.94 braucht zusätzlich zu den Standard-Gates:

- RandomDrawRecord-Tests für zufälliges Trashing aus Grip.
- Negative Leaktests für vor-Damage Grip-Inhalt in CorpView, PublicEvents, WebSocket, Reconnect, Undo, Errors, Logs und AI-Input.
- Undo-Blocker nach jedem Damage-Event.
- Flatline-Winner-Reason-Tests.
- Replay-/StateHash-Tests mit identischem Seed und identischer Damage-Auswahl.

V0.95 braucht zusätzlich:

- Resource-Zonen- und PlayerView-Tests.
- Tag-basierte Resource-Trash-LegalActions mit Revalidierung.
- Negative Tests: untagged Runner, falsche Side, stale Action, nicht öffentliche Resource-Ziele.
- AI-Smokes gegen Tag-/Resource-Boardstates.
- Deck-/Manifest-Gates, damit keine Resource ohne Mechanikfreigabe deck-legal wird.
