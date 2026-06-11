# AI Junkyard BBS Follow-ups Automation Process

Status: implemented; pending local main integration

Quelle/Vorgabe: Review-Anhang zum Commit `3a3d82501a276c8a2c4553c9332568a28d5c67b1` (`fix(ai): score Junkyard BBS recovery by target`).

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise. Der Review benennt keinen Stopper, aber drei begrenzte Follow-ups:

- Junkyard-BBS-Recovery auch für den Legacy-/Fallback-Actiontyp `trigger_ability` mit `resourceAbility: "junkyard_bbs_return_top_heap"` bewerten oder den Nicht-Einsatz absichern.
- Zielauflösung strenger an die sichtbare oberste Heap-Karte binden; `targetCardDefinitionId` darf keine nicht-oberste bekannte Heap-/Archives-Karte ersatzweise bewerten.
- Falls sinnvoll, eine Kalibrierungsregression ergänzen, damit generische Ziele ohne akuten Boardstate-Bedarf nicht automatisch Basic Credit schlagen.

## Gesamtziel

Die Runner-KI bewertet Junkyard BBS in der Semantic Runtime unabhängig vom aktuellen legalen Action-Shape target-aware, side-safe und top-heap-strikt. Regressionen decken den Legacy-Actiontyp, falsches Definition-Matching und generische Nicht-Notfall-Ziele ab.

## Annahmen

- Der aktive CardImplementation-Pfad kann `activated_card_ability` liefern; der alte Engine-/UI-Kompatibilitätspfad kann weiterhin `trigger_ability` mit `resourceAbility: "junkyard_bbs_return_top_heap"` liefern.
- Junkyard BBS nimmt regeltechnisch die oberste Heap-Karte zurück. Wenn eine Action keinen konkreten `targetCardId` liefert, ist nur die sichtbare Top-Heap-Karte als KI-Ziel belastbar.
- Diese Arbeit verändert keine Engine-Regeln, keine LegalAction-Erzeugung, keine Hidden-Info-Projektion, kein Replay und keinen StateHash.

## Nicht-Ziele

- Keine neue Kartenfreigabe.
- Keine Änderung an Junkyard-BBS-Engine-Ausführung.
- Keine breite Neujustierung aller Runner-Recovery- oder Card-Ability-Gewichte.
- Kein Push und keine Remote-Integration.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Jede Paketänderung wird eng getestet, mit `git diff --check` geprüft und einzeln committed.
- Der Arbeitsbranch bleibt `codex/junkyard-bbs-followups` im Worktree `C:\Projekte\NETGRID_JUNKYARD_BBS_FOLLOWUPS`.
- Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für die finale lokale Integration nach `main` genutzt.

## Automatische Fehlerbehandlung

- Bei Testfehlern bleibt das aktuelle Paket aktiv und wird eng debuggt.
- Bei Git-Konflikten werden beide Intentionen rekonstruiert und erhalten, wenn fachlich kompatibel.
- Bei unklarer fachlicher Intention stoppt der Prozess mit Blocker-Notiz statt zu raten.

## Sicherheitsblocker

- Hidden-Info-Leak in PlayerView, AI-Input oder Debug-Ausgabe.
- KI-Zielbewertung einer nicht sichtbaren oder nicht obersten Heap-Karte.
- Änderung an `applyAction`, LegalAction-Erzeugung oder Engine-Regelverträgen ohne expliziten neuen Scope.
- Rote relevante Checks nach Konfliktlösung.

## State Machine

1. `process_documented`
2. `legacy_action_compatibility_done`
3. `top_heap_strictness_done`
4. `calibration_regression_done`
5. `final_verified`
6. `merged_to_main`

## Paketfolge

### JY-FU-0: Prozessartefakt

Ziel: Diesen sequenziellen Prozess dokumentieren.

Kernartefakte: `docs/architecture/ai/ai-junkyard-bbs-followups-automation-process-2026-06-11.md`.

Checks: `git diff --check`.

Done-Gate: Prozessartefakt committed.

Commit-Message: `docs(ai): plan Junkyard BBS follow-ups`

### JY-FU-1: Legacy-Action-Kompatibilität

Ziel: Der Junkyard-BBS-Zielwert-Scorer erkennt neben `activated_card_ability` auch den Legacy-/Fallback-Pfad `trigger_ability` mit `resourceAbility: "junkyard_bbs_return_top_heap"`.

Kernartefakte: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`.

Checks: AI-Typecheck, Junkyard-AI-Tests, `git diff --check`.

Done-Gate: Ein Test belegt, dass die Semantic Runtime eine Junkyard-`trigger_ability` target-aware bewertet und nicht als generisch gute Recovery über Basic Credit nimmt.

Commit-Message: `fix(ai): support Junkyard BBS trigger recovery scoring`

### JY-FU-2: Top-Heap-Striktheit

Ziel: Ohne konkretes `targetCardId` bewertet die KI nur die sichtbare Top-Heap-Karte; ein abweichendes `targetCardDefinitionId` darf keine tiefer liegende oder sonstige bekannte Karte auswählen.

Kernartefakte: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`.

Checks: AI-Typecheck, Junkyard-AI-Tests, `git diff --check`.

Done-Gate: Ein Test mit zwei Heap-Karten zeigt, dass eine abweichende Definition nicht zur Bewertung der nicht obersten Karte führt.

Commit-Message: `fix(ai): keep Junkyard BBS target scoring top-heap strict`

### JY-FU-3: Generische Zielkalibrierung

Ziel: Generische mittlere Ziele ohne sichtbaren Boardstate-Bedarf werden nicht automatisch über Basic Credit bevorzugt.

Kernartefakte: `packages/ai/src/index.test.ts`; `packages/ai/src/index.ts` nur bei notwendiger enger Kalibrierung.

Checks: AI-Typecheck, Junkyard-AI-Tests, `git diff --check`.

Done-Gate: Eine Regression mit generischem Ziel ohne Coverage-/Funding-Bedarf verliert gegen Basic Credit oder dokumentiert ein bewusstes, eng begründetes Scoring.

Commit-Message: `test(ai): cover generic Junkyard BBS recovery calibration`

## Verifikationsregeln

- Paketnah: `corepack pnpm --filter @netgrid/ai typecheck`
- Paketnah: `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts -t "Junkyard"`
- Vor finaler Integration zusätzlich Status- und Ancestor-Prüfung nach dem Worktree-Main-Abgleich.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_JUNKYARD_BBS_FOLLOWUPS`
- Arbeitsbranch: `codex/junkyard-bbs-followups`
- Integrationsbranch: lokales `main`
- Kein Push.
- Finale Integration defensiv nach `worktree-main-abgleich`.

## Controller-Prompt-Kern

`/Goal Arbeite AI Junkyard BBS Follow-ups vollständig und sequenziell von JY-FU-0 bis JY-FU-3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_JUNKYARD_BBS_FOLLOWUPS auf Branch codex/junkyard-bbs-followups. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Alle Pakete sind committed.
- Relevante AI-Checks sind grün.
- Arbeitsbranch ist lokal in `main` integriert.
- Hauptworkspace ist sauber.
- Keine Remote-Aktion wurde ausgeführt.

## Umsetzungsergebnis

Paketcommits:

- JY-FU-0: `11b49dc5` `docs(ai): plan Junkyard BBS follow-ups`
- JY-FU-1: `b07ec723` `fix(ai): support Junkyard BBS trigger recovery scoring`
- JY-FU-2: `b97d5611` `fix(ai): keep Junkyard BBS target scoring top-heap strict`
- JY-FU-3: `b7332b18` `test(ai): cover generic Junkyard BBS recovery calibration`

Ergebnis:

- `trigger_ability` mit `resourceAbility: "junkyard_bbs_return_top_heap"` wird für Junkyard BBS target-aware bewertet.
- Ohne konkretes `targetCardId` bewertet der Scorer nur die sichtbare Top-Heap-Karte.
- `targetCardDefinitionId` allein kann keine tiefer liegende oder sonstige bekannte Karte als Junkyard-Ziel auswählen.
- Generische Breaker-/Setup-Ziele ohne sichtbaren Coverage-Bedarf werden Junkyard-spezifisch niedriger kalibriert; sichtbarer Coverage-Fix bleibt hoch priorisiert.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Junkyard" --testTimeout 30000`
- `git diff --check`

Hinweis: Der ursprünglich geplante pnpm-Testaufruf `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts -t "Junkyard"` reicht im Workspace die Argumente so weiter, dass ein breiterer AI-Testlauf startet. Dabei timeoutete einmal unabhängig `src/simulation/simulation-harness.test.ts` nach 5000 ms. Für die Paketabnahme wurde deshalb der gezielte Vitest-Exec-Aufruf gegen `src/index.test.ts` genutzt.
