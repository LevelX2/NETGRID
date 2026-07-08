# Runner Tactical Plan Substeps Prozess

Status: in Umsetzung

Quelle/Vorgabe: Playtest-Rückmeldung vom 2026-07-08 zur Runner-Planebene, insbesondere HQ-Run-Vorbereitung, Handkartenentwicklung, Funding-Substeps, Planlisten-Debug und Raven Microcyb Eagle.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung. Das gewünschte Ziel ist ein Planmodell, in dem strategische Zielpläne die Richtung vorgeben und Vorbereitungsschritte wie Breaker suchen, Karte ziehen oder Credits nehmen als aktuelle Schritte dieses Zielplans erscheinen. Reine Support-Pläne dürfen nicht als gleichrangige Ersatzrichtung dominieren, wenn sie nur Mittel für ein konkretes Ziel sind.

## Gesamtziel

Runner-Tactical-Plans sollen konkrete Ziele sichtbar machen:

- Ein Run-Ziel bleibt ein Run-Plan, auch wenn aktuell Breaker-Abdeckung, Kartenziehen oder Credits fehlen.
- Eine nützliche Handkarte bleibt ein Handkarten-Plan, auch wenn aktuell Credits fehlen.
- Die aktuell ausführbare Aktion ist ein Substep des ausgewählten Zielplans.
- Die Debug-Anzeige zählt Planstatus korrekt und macht Substeps nachvollziehbar.
- Raven Microcyb Eagle zeigt im Katalog den korrekten lokalen Spoiler-/Engine-Text.

## Annahmen

- `runner.obtain_breaker_coverage` wird nicht mehr als eigenständiger Zielplan neben dem Run-Plan benötigt, wenn der Run-Plan denselben Substep tragen kann.
- Nicht bezahlbare Handkarten mit akutem oder nützlichem Bedarf dürfen als `runner.develop_hand_card` sichtbar bleiben, wenn sie über `gain_credits` vorbereitet werden können.
- Nicht relevante, doppelte oder aktuell nutzlose Handkarten bleiben weiterhin ausgeschlossen.
- Support-Actions wie `gain_credit` und `draw_card` bleiben LegalAction-basierte Schritte, erzeugen aber nur dann eigene Basispläne, wenn kein konkreter höherwertiger Zielplan sie bindet.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine neuen LegalActions.
- Keine Hidden-Info-Ausweitung.
- Keine allgemeine KI-Gewichtungsneukalibrierung außerhalb der betroffenen Planmodellierung.
- Keine Änderung an laufenden Matchdaten oder alten Debug-Exports.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Die KI wählt nur vorhandene LegalActions.
- Planebene und Action-Ebene dürfen Scores unterscheiden, müssen aber ihre Beziehung sichtbar machen.
- Ein Plan kann blockiert, aktiv oder verworfen sein; die Zusammenfassung darf verworfene Pläne nicht als "aktuell möglich" zählen.

## Automatische Fehlerbehandlung

- Wenn ein Plan nicht auf eine LegalAction mappen kann, bleibt er sichtbar, aber nicht ausgewählt.
- Wenn ein Substep keine LegalAction findet, wird der Plan blockiert statt durch eine unverbundene Basisaktion ersetzt.
- Wenn ein Kartentextkonflikt zwischen Shared-Katalog und versionierter Kartendatei besteht, gilt die versionierte lokale Spoiler-/Engine-Grundlage.

## Sicherheitsblocker

Blocker sind:

- Notwendigkeit neuer Engine-Aktionen.
- Hidden-Info-Leak in PlayerView, AI-Debug oder Debug-Export.
- Regelkonflikt bei Raven Microcyb Eagle, der über sichtbaren Text hinaus Engine-Verhalten ändern müsste.

## State Machine

1. Zielplan wird gebaut.
2. Plan ermittelt aktuellen Step.
3. Step mappt auf LegalActions.
4. Action-Ranking bewertet nur Actions, die der ausgewählte Plan zulässt oder als Alternativen sichtbar sind.
5. Debug zeigt Planstatus, Step, Mapping und relevante Action-Kandidaten.

## Paketfolge

### Paket 1: Prozessartefakt

Ziel: Vorgabe, Invarianten, Paketfolge und Abnahmeregeln versioniert festhalten.

Checks: `git diff --check`

Done-Gate: Prozessdokument ist committed.

Commit: `docs(ai): define runner tactical plan substep process`

### Paket 2: Run-Plan-Substeps

Ziel: Blockierte Run-Pläne tragen ihren Vorbereitungsstep direkt; separate `runner.obtain_breaker_coverage`-Planinstanzen werden nicht mehr als gleichrangiger Zielplan erzeugt.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-runner-plans.ts`
- `packages/ai/src/plans/tactical-plan-runner-support-actions.ts`
- `packages/ai/src/tactical-plans.test.ts`

Checks: gezielte AI-Tactical-Plan-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: HQ-Run mit fehlendem Code-Gate zeigt genau den HQ-Run-Plan mit Coverage-Substep.

Commit: `fix(ai): model breaker setup as run plan step`

### Paket 3: Handkarten-Funding-Pläne

Ziel: Nützliche, nicht bezahlbare Handkarten erscheinen als Handkartenentwicklungsplan mit `gain_credits` als aktuellem Step, statt nur indirekt als Credit-Basis-Bonus.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-runner-hand-development.ts`
- `packages/ai/src/plans/tactical-plan-legal-action-mapping.ts`
- `packages/ai/src/tactical-plans.test.ts`

Checks: gezielte Handkarten-/Tactical-Plan-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: Eine nützliche, nicht bezahlbare Handkarte erzeugt einen sichtbaren Plan und mappt auf `gain_credit`, sofern kein höherwertiger Zielplan greift.

Commit: `fix(ai): expose funding steps for useful hand cards`

### Paket 4: Debug-Zusammenfassung und Raven Microcyb Eagle

Ziel: Planebenen-Zusammenfassung zählt aktiv/blockiert/verworfen korrekt; Raven Microcyb Eagle nutzt den korrekten Text und `deck`-Subtype.

Kernartefakte:

- `apps/web/features/debug/AiDecisionDebugOverlay.tsx`
- `packages/shared/src/index.ts`
- passende Shared/Web/Engine/Catalog-Tests je bestehender Abdeckung

Checks: Shared-Tests, Web-Typecheck, AI-Typecheck, `git diff --check`.

Done-Gate: Debug-Summary unterscheidet Planstatus korrekt; Raven Microcyb Eagle zeigt vollständigen Spoilertext.

Commit: `fix(ai): clarify plan status summary and raven text`

## Verifikationsregeln

Mindestens auszuführen:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/shared exec vitest run src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`

## Worktree-, Git- und Integrationsregeln

Arbeitsbranch: `codex/runner-plan-substeps-hand-funding`

Worktree: `C:\Projekte\NETGRID_runner_plan_substeps`

Hauptworkspace: `C:\Projekte\NETGRID`

Jedes Paket wird separat committed. Nach Abschluss wird der Arbeitsbranch lokal nach `main` gemerged und der Worktree entfernt.

## Controller-Prompt-Kern

Arbeite diesen Prozess sequenziell im Worktree `C:\Projekte\NETGRID_runner_plan_substeps` auf Branch `codex/runner-plan-substeps-hand-funding` ab. Arbeite immer nur am aktuellen Paket. Committe jedes Paket nach erfülltem Done-Gate. Nutze den Hauptworkspace nur für den finalen lokalen Merge nach `main`.

## Abschlusskriterien

- Alle vier Pakete sind committed.
- Finale Checks sind grün oder Abweichungen sind als Blocker dokumentiert.
- Branch ist lokal nach `main` gemerged.
- Hauptworkspace ist sauber.
- Worktree ist entfernt.
