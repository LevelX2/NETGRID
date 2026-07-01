# Hidden-Resource-Trash-Cost-Correction-Prozess

Status: in Umsetzung
Quelle/Vorgabe: Nutzerbeobachtung vom 2026-07-01 zu `Credit Subversion` und anschließende Freigabe, Hidden Resources mit `[T]`/Trash-Symbol regelkonform zu korrigieren.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung.

- Gesamtziel: Hidden Runner Resources mit gedrucktem `[T]`-Kostenbestandteil werden nach Verwendung revealed und faceup in den Runner-Heap getrasht, statt nur getappt und später wieder enttappt zu werden.
- Endzustand: `Credit Subversion` und dieselbe Hidden-Resource-Kostenfamilie bleiben nicht im Rig, sind nicht erneut nutzbar und leaken vor Nutzung keine verdeckte Identität.
- In Scope: Engine-Kosten-/Resolverpfade, konkrete Proteus-/Classic-Hidden-Resource-Implementierungen, fokussierte Engine-Tests, Prozess-/Statusdokumentation.
- Nicht-Ziele: neue Kartenfreigaben, UI-Redesign, KI-Gewichtung, Server/WebSocket-Verträge, Remote-Push oder Pull Request.
- Relevante Artefakte: `packages/engine/src/card-implementations/**/runner/resources/*.ts`, `packages/engine/src/ability-engine/*`, `packages/engine/src/game/**`, `packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts`, paketnahe Run-/Trace-/Access-/Damage-Tests.
- Verifikation: fokussierte Engine-Tests, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`; möglichst ein breiter Engine-Testlauf.

## Gesamtziel

Der Prozess korrigiert die Hidden-Resource-Semantik für alle aktiven Hidden Resources, deren Text `Hidden resources are installed face down, but are put into the trash face up.` und einen `[T]`-Kostenbestandteil enthält. Für diese Karten ist `[T]` fachlich Trash-Kosten, nicht ein temporärer Tap-Zustand. Chiba Bank Account ist bereits korrigiert und bleibt Referenz.

## Annahmen

- Arbeitsbranch: `codex/hidden-resource-trash-cost-correction`.
- Worktree: `C:\Projekte\NETGRID_HIDDEN_RESOURCE_TRASH_COST`.
- Lokaler Integrationsbranch: `main`.
- `AGENTS.local.md` ist im Arbeits-Worktree nicht vorhanden; die lokalen Hinweise aus dem Hauptworkspace wurden zuvor gelesen.
- Die gedruckten `[T]`-Hidden-Resource-Kosten werden in den konkreten CardImplementation-Definitionen als `trash_source` modelliert. Wo bestehende generische Pfade nur `tap_source` kennen, werden sie eng erweitert.
- `Credit Subversion` und `Death from Above` nutzen aktuell denselben Primitive-Pfad; der Primitive wird auf Reveal+Trash umgestellt, nicht nur pro Karte umgangen.
- Classic-Hidden-Resources `Executive File Clerk` und `Sandbox Dig` werden mitkorrigiert, weil sie dieselbe aktive Hidden-Resource-Regelzeile tragen.

## Nicht-Ziele

- Keine Änderung an normalen nicht-Hidden-Resource-`[T]`-Karten, wenn sie nicht zur Hidden-Resource-Regelfamilie gehören.
- Keine Produkt-/Release-Promotion und keine Decklegalitätsänderung.
- Keine Änderung an PlayerView-Redaction außer den notwendigen öffentlichen Reveal-/Trash-Payloads nach Nutzung.
- Keine Rückwärtskompatibilität für alte Runtime-Zustände, in denen Hidden Resources bereits fälschlich getappt im Rig liegen.

## Controller-Invarianten

- Die Rules Engine bleibt die einzige Regelautorität.
- LegalActions werden aus Engine-State erzeugt; `applyAction` revalidiert Seite, Timing, Source, Kosten, Ziele, Choices und StateVersion.
- Verdeckte Hidden-Resource-Identitäten bleiben bis zur Nutzung aus Corp-Views, PublicEvents, Reconnect-Payloads, Logs, KI-Inputs und Client-Fehlern heraus.
- Nach Nutzung werden Hidden Resources faceup im Runner-Heap sichtbar und können durch spätere Untap-Logik nicht erneut aktiviert werden.
- Replay und StateHash bleiben deterministisch.

## Automatische Fehlerbehandlung

- Bei rotem paketnahem Test wird eng im aktuellen Paket debuggt.
- Wenn ein generischer Pfad durch die neue Trash-Semantik zu breit würde, wird die Änderung auf die Hidden-Resource-Familie begrenzt.
- Wenn eine Hidden-Info- oder Replay-Sicherheitsgrenze unklar wird, stoppt der Prozess mit Blocker-Report und Removal Condition.
- Wenn `main` vor dem finalen Merge weiterläuft, wird `main` defensiv in den Arbeitsbranch integriert.

## Sicherheitsblocker

- Eine verdeckte Hidden-Resource-Identität erscheint vor Nutzung in Corp-Views oder PublicPayloads.
- Eine getrashte Hidden Resource bleibt im Rig oder wird später durch `untapRunnerCardsAtTurnStart` wieder aktivierbar.
- `applyAction` akzeptiert stale Actions für getrashte oder nicht mehr installierte Quellen.
- Replay/StateHash driften nach Reveal+Trash.
- Die Änderung würde normale nicht-Hidden-Resource-Tap-Mechaniken unbeabsichtigt auf Trash umstellen.

## State Machine

1. `planned`: Prozessartefakt existiert und ist committed.
2. `engine_contract_ready`: Kosten-/Resolvermodell für Hidden-Resource-Reveal+Trash ist umgesetzt.
3. `card_definitions_corrected`: Proteus-/Classic-Hidden-Resource-Definitionen nutzen Trash-Kosten.
4. `tests_hardened`: Regressionstests prüfen Heap, `sourceTrashed`, Nicht-Wiederverwendbarkeit, Redaction und Replay.
5. `verified`: Paketchecks und Abschlusschecks sind grün oder mit Risiko dokumentiert.
6. `merged`: Arbeitsbranch ist lokal nach `main` integriert und Worktree entfernt.

## Paketfolge

### HRTC-00 Prozessartefakt

Ziel: Prozess dokumentieren und Arbeitsumgebung herstellen.
Eingangsvoraussetzungen: Worktree `C:\Projekte\NETGRID_HIDDEN_RESOURCE_TRASH_COST` auf Branch `codex/hidden-resource-trash-cost-correction`.
Konkrete Arbeit: Dieses Artefakt anlegen.
Kernartefakte: `docs/architecture/engine/hidden-resource-trash-cost-correction-process-2026-07-01.md`.
Tests/Checks: `git status --short`, `git diff --check`.
Done-Gate: Artefakt committed.
Commit-Message: `docs(engine): plan hidden resource trash correction`.

### HRTC-01 Engine-Semantik und Kartendefinitionen

Ziel: Hidden-Resource-`[T]` wird in allen betroffenen aktiven Karten als Source-Trash behandelt.
Eingangsvoraussetzungen: HRTC-00 committed.
Konkrete Arbeit:

- Successful-run Hidden-Resource-Primitive von Reveal+Tap auf Reveal+Trash umstellen.
- Aktivierte Hidden-Resource-Fähigkeiten von `tap_source`/`credit_and_tap_source` auf `trash_source` plus vorhandene Credit-Kosten migrieren.
- Event-Modification-, Trace-, Access-, Run- und activated-card-Kostenpfade so erweitern, dass `trash_source` in diesen Familien korrekt bezahlt wird.
- Chiba bleibt unverändert als bereits korrigierte Referenz.

Kernartefakte: `packages/engine/src/ability-engine/`, `packages/engine/src/game/`, `packages/engine/src/card-implementations/proteus/runner/resources/`, `packages/engine/src/card-implementations/classic/runner/resources/`.
Tests/Checks: paketnahe Engine-Tests, `git diff --check`.
Done-Gate: betroffene Kostenpfade kompilieren und fokussierte Tests laufen grün.
Commit-Message: `fix(engine): trash hidden resources on use`.

### HRTC-02 Regressionstests und Dokumentationsstand

Ziel: Die korrigierte Semantik ist gegen Regressionen abgesichert und der Projektstatus kennt den Fix.
Eingangsvoraussetzungen: HRTC-01 committed.
Konkrete Arbeit:

- PRO011/PRO012-Tests von Tap-Erwartungen auf Heap/`sourceTrashed`/Nicht-Wiederverwendung drehen.
- Falls nötig zusätzliche Tests für Classic-Hidden-Resources ergänzen.
- Prozessartefakt auf Ergebnisstand aktualisieren.
- Wiederverwendbare Erkenntnis in `docs/codex/CODEX_STATUS.md` oder Wissensbasis/Log zurückführen, sofern der lokale Stand konfliktfrei integrierbar ist.

Kernartefakte: `packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts`, paketnahe Unit-Tests, Prozessartefakt, Status-/Log-Artefakte.
Tests/Checks: fokussierte Engine-Tests, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`.
Done-Gate: Tests und Typecheck grün; Dokumentationsstand committed.
Commit-Message: `test(engine): harden hidden resource trash behavior`.

### HRTC-03 Abschlussprüfung und lokale Integration

Ziel: Arbeitsbranch verifizieren und lokal nach `main` integrieren.
Eingangsvoraussetzungen: HRTC-02 committed, Arbeits-Worktree sauber.
Konkrete Arbeit:

- Finalen Verify-Lauf ausführen.
- Aktuelles `main` in Arbeitsbranch integrieren, falls nötig.
- Hauptworkspace prüfen und Arbeitsbranch nach `main` mergen.
- `git status --short` und `git diff --check` auf `main` ausführen.
- Arbeits-Worktree entfernen.

Kernartefakte: Git-Historie.
Tests/Checks: fokussierte Engine-Tests, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`.
Done-Gate: Branch lokal nach `main` integriert, Worktree entfernt, Goal complete.
Commit-Message: kein separater Paketcommit, nur finaler Merge.

## Verifikationsregeln

- Nach jedem Paket: `git diff --check`.
- Nach Codepaketen: mindestens `pnpm --filter @netgrid/engine test -- src/index-tests/proteus/hidden-resource-hardening.test.ts` und betroffene Run-/Trace-/Access-/Damage-Unit-Tests.
- Vor finalem Merge: `pnpm --filter @netgrid/engine typecheck`.
- Wenn ein breiter Engine-Testlauf zeitlich scheitert, werden ausgeführte Teile und Restrisiko dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Arbeit ausschließlich im Worktree `C:\Projekte\NETGRID_HIDDEN_RESOURCE_TRASH_COST`.
- Branch `codex/hidden-resource-trash-cost-correction`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für finalen lokalen Merge nach `main` genutzt.
- Jeder abgeschlossene Paketstand erhält einen Commit.
- Keine Remote-Integration, kein Push und kein Pull Request.
- Fremde offene Änderungen im Hauptworkspace bleiben unangetastet.

## Controller-Prompt-Kern

`/Goal Arbeite den Hidden-Resource-Trash-Cost-Correction-Prozess vollständig und sequenziell von HRTC-00 bis HRTC-03 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md falls vorhanden, die Pflichtseiten der Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_HIDDEN_RESOURCE_TRASH_COST auf Branch codex/hidden-resource-trash-cost-correction. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe oder aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- `Credit Subversion` wird bei Nutzung revealed und faceup getrasht, nicht getappt.
- Alle aktiven Proteus-Hidden-Resources mit gedrucktem Hidden-Resource-Trash-Satz und `[T]`-Kostenbestandteil werden nach Nutzung getrasht und können nicht mehrfach durch Turn-Untap genutzt werden.
- `Executive File Clerk` und `Sandbox Dig` folgen derselben Hidden-Resource-Semantik.
- Chiba Bank Account bleibt korrekt und regressionsgeschützt.
- Corp-Views und PublicPayloads bleiben bis zur Nutzung hidden-info-sicher.
- Replay und StateHash bleiben stabil.
- Paketcommits liegen auf dem Arbeitsbranch und der Branch ist lokal nach `main` integriert.
