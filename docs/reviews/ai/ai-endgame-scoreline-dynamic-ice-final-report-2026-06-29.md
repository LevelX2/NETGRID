# AI Endgame Scoreline and Dynamic ICE Final Report, 2026-06-29

## Analysiertes Match

- Match-ID: `match_28b304f024323f9d`
- Quelle: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Auslöser: Corp verlor eine spielentscheidende Agenda nach einer als `temporary_safe` bewerteten Remote-Scoreline.

## Umgesetzte Änderungen

### Endgame-Scoreline-Assessment

- `semanticRuntimeCorpScoringWindowAssessment` projiziert installierte Agenda-Root-Karten jetzt in den konkreten Remote-Kontext.
- Das Assessment gibt side-safe Evidence zu `agenda_points_at_risk`, `runner_agenda_points_after_steal` und `agenda_steal_severity` aus.
- Nicht-immediate Scorelines mit Runner-Exposure, `near_win`/`game_ending`-Steal und dynamischer/positionsabhängiger Scheinsicherheit werden nicht mehr als `temporary_safe` klassifiziert.
- Statische, bezahlbare Rush-Fenster ohne sichtbare Runner-Coverage bleiben möglich.

### Dynamic ICE

- Remote-Scoreline-Schutz unterscheidet jetzt bezahlbare ICE, durable-relevante ICE und dynamische Schutzschwächen.
- `position_dependent_ice`, `corp_ice.position_scaling`, `corp_ice.outer_ice_scaling`, `same_fort_reposition` und mobile Positionswechsel werden in der Scoreline-Sicherheit berücksichtigt.
- Dynamic-only Remote-ICE bekommt keinen vollen Scoring-Remote-Aufbauwert mehr, wenn es keine konkrete durable Schutzverbesserung liefert.

### Archives-Priorität

- Archives-ICE erhält keinen pauschalen Bonus mehr.
- Nennenswerter Archives-Wert entsteht nur noch bei konkretem Archives-Risiko, insbesondere Agenda in Archives oder wiederholtem Archives-Run-/Access-Druck.
- Bei akutem HQ/R&D-Druck oder Agenda-Druck in HQ wird Archives-ICE ohne eigenes Risiko abgewertet.

## Grenzen

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Annahme über verdeckte Runner-Handkarten wie `Inside Job`.
- Keine Änderung an AI-Hints oder generierten AI-Daten, weil die vorhandenen Proteus-Risiko-Hints ausreichend waren.
- Keine öffentliche oder gegnerseitige Debug-Ausweitung mit verdeckten Corp-ICE-Identitäten.

## Verifikation

Bestanden:

- `corepack pnpm --filter @netgrid/ai exec vitest run --maxWorkers=1 --testTimeout=30000 src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-score.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts src/runtime/semantic-runtime-corp-rez-floor.test.ts src/runtime/semantic-runtime-corp-effective-defense.test.ts src/runtime/semantic-runtime-corp-central-rez-context.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Nicht ausgeführt:

- `corepack pnpm check:ai`, weil keine AI-Hint- oder generierten AI-Daten geändert wurden.

## Ergebnis

Die Replay-Endgame-Klasse ist jetzt abgesichert: Eine game-ending Agenda darf nicht mehr hinter dynamischer Scheinsicherheit als `temporary_safe` durchgehen, wenn der Runner vor dem Score eine Zugriffschance bekommt und die Corp-Remote nicht mit durable wirksamer ICE/Reserve trägt. Zugleich bleiben echte Rush-Fenster mit statischer, bezahlbarer, für den sichtbaren Runner nicht gedeckter ICE spielbar.

