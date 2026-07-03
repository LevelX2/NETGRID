# Corp-ICE-Placement-Evaluator Final Review 2026-07-03

Status: umgesetzt und lokal verifiziert

Branch: `codex/corp-ice-placement-evaluator`

Prozessartefakt: `docs/architecture/ai/corp-ice-placement-evaluator-process-2026-07-03.md`

## Ergebnis

Der normale Semantic-Corp-Runtime-Pfad bewertet ICE-Installationen jetzt über einen gekapselten `corp-ice-placement`-Evaluator. Der Evaluator baut side-sichere Profile aus vorhandenen `LegalActions`, Corp-`PlayerView`, sichtbaren Karten, Runtime-/Compiled-Hints und öffentlichen Ereignissen. Er erzeugt keine LegalActions, keine PlayerActions und keine Engine-Daten.

Das neue Modul liefert:

- `CorpIceCardPlacementProfile` mit unmittelbarem Stop, Tax/Damage, Program-Trash, Trace/Tag, Run-Lock, Positionsabhängigkeit, Future-/Next-ICE-Synergien, Outside-/Inner-Scaling, Mode-Choice, Mobile-Reposition und Dead-First-Risk.
- `CorpServerNeedProfile` für HQ, R&D, Archives, Remotes und neue Remotes.
- `CorpIceDensityProfile` aus eigener Korp-Sicht.
- `CorpIcePlacementCandidate`, `CorpIcePlacementEvaluation`, Score-Komponente `corp_ice_placement_evaluator` und `bestDeferReason`.
- Diagnosefunktionen `assessCorpIcePlacementForDiagnostics` und `classifyCorpFutureRunIcePlacementProfile` als Legacy-freie Ersatzoberfläche für historische Future-Run-ICE-Metriken.

## Umgesetzte Pakete

- ICE-P0: Prozessartefakt erstellt.
- ICE-P1: Profil-/Score-Komponente und fokussierte Tests eingeführt.
- ICE-P2: `semantic-runtime-corp-score.ts` und `semantic-runtime-corp-remote-score.ts` auf die neue Profil-/Score-Komponente umgestellt.
- ICE-P3: Positions-, Deckdichte- und Defer-Regeln ergänzt.
- ICE-P4: korrespondierende Legacy-/Doppelheuristik aus Public Facade und Simulation entfernt oder auf explizite Legacy-internal Rolle begrenzt.

## Fachliche Abdeckung

Die Tests decken die acht Vorgaben aus der Nutzeranlage ab:

- erstes HQ-ICE bei Agenda-Flood: direktes, bezahlbares Stop-ICE schlägt positionsabhängiges Future-ICE.
- Remote mit bestehender ICE-Schicht: Outside-/Future-ICE gewinnt Wert, wenn eine passende äußere Schicht vorhanden ist.
- leere Remote mit positionsabhängigem ICE: `bestDeferReason = bad_first_ice_wait_for_followup`.
- HQ unter Agenda-Druck: HQ-Schutz schlägt Remote-Aufbau.
- R&D unter sichtbarem Multiaccess-Druck: R&D-Schutz schlägt HQ, wenn HQ keine Agenda hat.
- scorebare Remote bei ruhigen Centrals: Remote-ICE schlägt zusätzliches Central-Overice.
- niedrige Credits und teures ICE: Empfehlung `prefer_economy` mit `defer_reason:rez_reserve_too_low`.
- niedrige ICE-Dichte: mittelmäßiges positionsabhängiges ICE wird bei dringender Servernot eher installiert, statt unrealistisch auf bessere ICE zu warten.
- nicht stoppendes Tag-/Trace-ICE auf HQ wird trotz zentralem Agenda-Druck nicht als `install_now` geboostet, wenn starke Immediate-Economy verfügbar ist.

Mobile/repositionierbare ICE halbieren Positionsmalus, entfernen ihn aber nicht.

## Legacy- und Removal-Audit

Entfernt oder abgelöst:

- Der alte ScoreBreakdown `corp_central_ice_access_stop_install_value` / `corp_central_ice_low_access_stop_install_penalty` ist aus der normalen Runtime entfernt.
- `semanticRuntimeCorpCentralIceProfile` ist nur noch ein dünner Kompatibilitätsadapter auf `buildCorpIceCardPlacementProfile`.
- `packages/ai/src/simulation/corp-future-run-ice-diagnostics.ts` nutzt nicht mehr `legacy/legacy-entrypoints`, sondern `assessCorpIcePlacementForDiagnostics`.
- `assessCorpFutureRunIcePlacement` und `classifyCorpFutureRunIceDefinitionId` sind nicht mehr über `packages/ai/src/index.ts`, `legacy/legacy-entrypoints.ts`, `legacy/legacy-planner-entrypoints.ts` oder `legacy/legacy-public-contract.ts` exportiert.

Verbleibend:

- In `packages/ai/src/legacy/corp-plans.ts` bleiben die alten Future-Run-ICE-Funktionen nur als private interne Helpers des expliziten Legacy-Planners erhalten.
- Der globale Legacy-Notaus `NETGRID_SEMANTIC_AI_RUNTIME=legacy` bleibt projektweit absichtlich bestehen und wurde in diesem Schnitt nicht entfernt.

Removal Condition:

- Die privaten Legacy-Helpers in `legacy/corp-plans.ts` dürfen erst entfernt werden, wenn der gesamte Legacy-Corp-Planner oder mindestens sein Force-Legacy-/Fixture-/Benchmark-Consumer entfernt ist. Vorher wäre eine Löschung kein lokaler ICE-Placement-Cutover, sondern ein projektweiter Legacy-Notaus-Cutover.

## Sicherheitsbewertung

- Keine Engine-, `applyAction`-, Replay-, StateHash-, Randomness-, PlayerView-, PublicEvent- oder WebSocket-Vertragsänderung.
- Keine neue LegalAction-Erzeugung.
- Keine FullState- oder verdeckte Runnerzonen-Nutzung.
- Evidence bleibt auf sichtbare Server-, Kosten-, Profil-, Dichte- und Empfehlungssignale begrenzt.

## Verifikation

Ausgeführt:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-ice-placement/corp-ice-placement.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-ice-placement/corp-ice-placement.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-score.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-ice-placement/corp-ice-placement.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-score.test.ts src/compiled-hints-runtime.test.ts src/index.test.ts -t "future-run|ICE-ordering|Ball and Chain|corp ICE placement|ICE-Platzierung|prefers HQ access-stop ICE"`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-ice-placement/corp-ice-placement.test.ts src/index.test.ts -t "corp ICE placement|nonurgent HQ ICE|Accounts Receivable before|Credit Consolidation before"`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-ice-placement/corp-ice-placement.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-score.test.ts src/compiled-hints-runtime.test.ts src/index.test.ts -t "future-run|ICE-ordering|Ball and Chain|corp ICE placement|ICE-Platzierung|prefers HQ access-stop ICE|nonurgent HQ ICE|Accounts Receivable before|Credit Consolidation before"`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Hinweis: Der frische Worktree hatte anfangs keine `node_modules`; `corepack pnpm install` wurde im Worktree ausgeführt.

Breiter Check: `corepack pnpm --filter @netgrid/ai test` wurde zusätzlich vor und nach dem Merge des aktuellen lokalen `main` angestoßen. Er ist nicht als Paket-Gate grün, weil mehrere vorhandene AI-Daten-/Report-Gates nicht gegen die committed Reports deterministisch sind, unter anderem Hint-Inspector-, Derived-Facts-, Compiled-Index-, Manual-Overlay-, Strategy-Taxonomy- und Hint-Quality-Reports. Der Nach-Merge-Lauf endete mit `10 failed | 264 passed` Testdateien und `22 failed | 2205 passed` Tests; die vorherige echte Scope-Regression in den Corp-Economy-Entscheidungstests ist darin nicht mehr enthalten. Die übrigen Full-Test-Reportdifferenzen bleiben separater Datenpflege-Scope.

## Restpunkte

- Reorder-/Swap-/Move-Spezialfälle wie Walking Wall, Mobile Barricade, Herman Revista, Singapore City Grid, Omni Kismet oder New Blood sind strukturell vorbereitet, aber nicht als vollständige Folgeentscheidung umgesetzt.
- Der globale Legacy-Notaus bleibt ein eigener späterer Projekt-Cutover.
