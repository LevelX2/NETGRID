# Runner-Payment-Support-Hidden-Resources-Prozess

Status: implementiert im Arbeitsbranch, Verifikation läuft
Quelle/Vorgabe: Nutzerfreigabe vom 2026-06-30 zur allgemeinen Anbindung von Hidden-Resource-Credit-Support an Runner-Kosten und zur Korrektur von Chiba Bank Account als Trash-Kostenquelle.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung.

- Gesamtziel: Hidden Runner Resources, die während Kosten oder Penalties Credits bereitstellen dürfen, müssen über einen einheitlichen Payment-Support-Pfad bei allen relevanten Runner-Zahlungen berücksichtigt werden.
- Endzustand: LegalActions für Runner-Kosten rechnen verfügbare normale Credits plus zulässige Support-Kapazität; wenn normale Credits nicht reichen, öffnet die ursprüngliche Aktion ein Support-Fenster, erlaubt passende Hidden-Resource-Aktionen und validiert danach die ursprüngliche Zahlung erneut.
- In Scope: Engine-Zahlungspfade für Runner-Installkosten, Eventkosten, Runner-aktivierte Karteneffekte, Access-Steal-/Trashkosten, Run-/Icebreaker-/Pay-or-End-Kosten und Runner-Trace-Bids; Chiba-/Swiss-/Liberated-Bank-Resource-Kosten; paketnahe Engine-Tests und Prozessdokumentation.
- Nicht-Ziele: UI-Redesign, Korp-Zahlungspfade, neue Kartenfreigaben, KI-Gewichtungslogik, Server/WebSocket-Verträge, Remote-Push oder Pull Request.
- Verifikation: paketnahe Vitest-Läufe, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`; final möglichst ein breiter Engine-Testlauf.

## Gesamtziel

Der Prozess macht Runner-Credit-Zahlungen nicht mehr punktuell Chiba-aware. Stattdessen entsteht ein wiederverwendbarer Runner-Payment-Support-Vertrag, den alle relevanten Runner-Zahlungsorte nutzen. Damit werden bezahlbare Aktionen korrekt als legal angezeigt, ohne im LegalAction-Surface kombinatorische Varianten wie "mit Chiba", "mit zwei Chibas" oder "mit Swiss plus Chiba" zu erzeugen.

## Annahmen

- `main` bleibt lokaler Integrationsbranch.
- Arbeitsbranch: `codex/runner-payment-support-hidden-resources`.
- Worktree: `C:\Projekte\NETGRID_RUNNER_PAYMENT_SUPPORT`.
- Chiba Bank Account hat fachlich Kosten `[1], [Trash]: Gain [4]`.
- Swiss Bank Account und Liberated Savings Account bleiben im selben Support-Fenster-Modell, müssen aber mit ihrer gedruckten Kostenstruktur abgeglichen werden.
- Support-Kapazität ist nur ein Legalitäts-Upper-Bound. Die eigentliche Zahlung bleibt durch `applyAction` und das Support-Fenster revalidiert.

## Nicht-Ziele

- Keine getrennten LegalAction-Varianten je Resource-Kombination.
- Keine automatische Vorauswahl, welche Hidden Resource genutzt werden muss.
- Keine Erweiterung der PlayerViews um verdeckte Kartendefinitionen.
- Keine Änderung daran, dass UI, Server, KI und Human Player nur LegalActions einreichen.
- Keine sichtbare Webclient-Versionserhöhung.

## Controller-Invarianten

- Die Rules Engine bleibt die einzige Regelautorität.
- `applyAction` validiert Seite, ActionId, StateVersion, Timingpunkt, Kosten, Ziele und Choices erneut.
- Hidden-Info darf nicht in PlayerViews, PublicEvents, WebSocket-Payloads, Reconnect, Undo-Previews, Replays, Logs, KI-Inputs oder Client-Fehler leaken.
- Replay und StateHash bleiben deterministisch.
- Support-Fenster sind Runner-seitig; die Korp sieht erst öffentliche Folgen aufgedeckter oder getrashter Hidden Resources.
- Neue Payment-Helper bleiben Engine-intern und ziehen keine UI-, Server-, DB- oder KI-Abhängigkeiten in das Engine-Paket.

## Automatische Fehlerbehandlung

- Bei rotem Paketcheck wird im aktiven Paket eng debuggt; kein Wechsel zum nächsten Paket.
- Wenn ein Zahlungspfad fachlich nicht sicher generisch angebunden werden kann, wird er als bewusst nicht migriert dokumentiert und mit einem fokussierten Regressionstest abgesichert.
- Wenn Hidden-Info- oder Replay-Sicherheit zweifelhaft wird, stoppt der Prozess mit Blocker-Report.
- Wenn `main` vor dem finalen Merge weiterläuft, wird `main` defensiv in den Arbeitsbranch integriert.

## Sicherheitsblocker

- Ein Support-Fenster würde verdeckte Kartendefinitionen an die Korp oder öffentliche Payloads geben.
- Eine ursprüngliche Aktion könnte nach Support ohne erneute Kosten-/Zielprüfung durchlaufen.
- Support-Kapazität könnte eine Zahlung legalisieren, obwohl die Resource-Kosten nicht bezahlbar sind.
- Eine getrashte oder getappte Support-Quelle könnte durch stale Actions erneut genutzt werden.
- Replay oder StateHash würden von UI-Auswahlreihenfolge oder nichtdeterministischen Support-Kombinationen abhängen.

## State Machine

1. `planned`: Prozessartefakt existiert, Worktree und Branch sind angelegt.
2. `contract_characterized`: Bestehende Support-Fenster- und Bank-Resource-Semantik ist testbar beschrieben.
3. `support_core_ready`: Gemeinsame Payment-Support-Helper und Kapazitätsberechnung sind vorhanden.
4. `payment_paths_migrated`: Relevante Runner-Zahlungspfade nutzen den gemeinsamen Support-Vertrag.
5. `bank_costs_corrected`: Chiba und verwandte Bank-Ressourcen haben korrekte Trash-/Tap-Kosten und stale Guards.
6. `verified`: Paket- und Abschlusschecks sind grün oder dokumentiert nicht ausführbar.
7. `merged`: Arbeitsbranch wurde lokal nach `main` integriert.

## Paketfolge

### RPS-00 Prozessartefakt und Worktree

Ziel: Prozess dokumentieren und isolierte Arbeitsumgebung herstellen.
Eingangsvoraussetzungen: Hauptworkspace sauber, Branch/Worktree kollisionsfrei.
Konkrete Arbeit: Dieses Artefakt anlegen.
Kernartefakte: `docs/architecture/engine/runner-payment-support-hidden-resources-process-2026-06-30.md`.
Checks: `git status --short`, `git diff --check`.
Done-Gate: Artefakt committed.
Commit-Message: `docs(engine): plan runner payment support process`.

### RPS-01 Regressionen und Charakterisierung

Ziel: Sollverhalten und aktuelle Lücken testbar machen.
Konkrete Arbeit:

- Installkosten-Charakterisierung für 3 Credits plus Chiba bei 4-Credit-Karte.
- Event-, Access- und Trace-Beispiele, die ohne Support bisher nicht legal sind und mit Support legal werden müssen.
- Stale-/Tapped-/Trashed-Guards für Support-Quellen.
- Chiba-Kostencharakterisierung: nach Nutzung liegt Chiba im Runner-Trash und ist öffentlich/revealed.

Kernartefakte: Engine-Tests unter `packages/engine/src/index-tests/proteus/`.
Checks: paketnahe Vitest-Läufe, `git diff --check`.
Done-Gate: Tests beschreiben Zielsemantik; vor dem Fix rote Lücken sind dokumentiert oder direkt im Paket eng gefixt.
Commit-Message: `test(engine): cover runner payment support gaps`.

### RPS-02 Gemeinsamer Runner-Payment-Support-Kern

Ziel: Support-Kapazität, Fensteröffnung und Originalaktions-Revalidierung wiederverwendbar kapseln.
Konkrete Arbeit:

- Gemeinsame Helper für Runner-Credit-Zahlungsfähigkeit mit Support-Kapazität einführen.
- Support-Fenster um Zahlungskontext erweitern, soweit für Revalidierung und Fehlertexte nötig.
- Originalaktionen nur erneut anbieten, wenn normale verfügbare Credits nach Support tatsächlich reichen.
- Support-Actions side-safe und stale-sicher an Fenster-ID, OriginalActionId, AmountDue und Payment-Kind binden.

Kernartefakte: `packages/engine/src/game/engine-runtime-internal/`, `packages/engine/src/game/legal-actions.ts`, Ability-Runtime-Dateien.
Checks: Support-Fenster-Tests, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`.
Done-Gate: Bestehende Install-Support-Tests bleiben grün; neue Core-Tests sind grün.
Commit-Message: `refactor(engine): centralize runner payment support`.

### RPS-03 Runner-Zahlungspfade migrieren

Ziel: Relevante Runner-Kosten nutzen denselben Support-Vertrag.
Konkrete Arbeit:

- Runner-Eventkosten und Runner-aktivierte Karteneffektkosten anbinden.
- Access-Steal- und Access-Trashkosten anbinden.
- Run-/Icebreaker-/Pay-or-End-Runnerkosten anbinden.
- Runner-Trace-Bids anbinden.
- Bestehende Spezial-Credit-Pools wie Recurring Credits, Bad Publicity und run/access-spezifische Credits erhalten, aber Hidden-Resource-Support als separate Support-Phase integrieren.

Kernartefakte: `runner-main-actions.ts`, `access-actions.ts`, `access-flow.ts`, `run-duration-payment.ts`, `trace-orchestration.ts`, Ability-Runtime-Kostenpfade.
Checks: paketnahe Engine-Tests je Zahlungsfamilie, `git diff --check`.
Done-Gate: LegalActions erscheinen bei ausreichender Support-Kapazität; eigentliche Zahlung scheitert weiterhin, wenn Support nicht genutzt oder stale geworden ist.
Commit-Message: `feat(engine): support hidden resources across runner payments`.

### RPS-04 Bank-Resource-Kosten und Support-Fenster-Härtung

Ziel: Chiba und verwandte Bank-Resources entsprechen ihrer gedruckten Kostenstruktur und das Fenster bleibt robust.
Konkrete Arbeit:

- Chiba Bank Account auf Credit- plus Trash-Kosten korrigieren.
- Swiss Bank Account und Liberated Savings Account gegen Kartentext und bestehende Tests prüfen.
- Capacity-Berechnung berücksichtigt Trash-Kostenquellen als einmalig verbrauchbar und tapped/trash-state-sicher.
- Support-Fenster-Labels und Payloads bleiben verständlich und hidden-info-sicher.

Kernartefakte: Proteus-Resource-Implementierungen, Ability-Runtime-Kosten, Hidden-Resource-Tests.
Checks: Hidden-Resource-Testdateien, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`.
Done-Gate: Chiba landet nach Nutzung im Trash; stale Wiederverwendung wird abgelehnt; mehrere Bank-Resources bleiben ohne kombinatorische LegalAction-Explosion nutzbar.
Commit-Message: `fix(engine): trash bank resources used for payment support`.

### RPS-05 Abschlussprüfung, Dokumentation und lokale Integration

Ziel: Prozessstand dokumentieren, breite Checks ausführen, lokal nach `main` integrieren.
Konkrete Arbeit:

- Prozessartefakt auf Ergebnisstatus aktualisieren.
- Relevante Tests und Typecheck ausführen.
- Arbeitsbranch sauber committen.
- Aktuelles `main` in den Arbeitsbranch integrieren, falls nötig.
- Final nach `main` mergen und Worktree entfernen.

Kernartefakte: Prozessartefakt, Git-Historie.
Checks: `pnpm --filter @netgrid/engine typecheck`, relevante Engine-Tests, möglichst `pnpm --filter @netgrid/engine test`, `git diff --check`.
Done-Gate: Arbeitsbranch ist lokal nach `main` integriert, Hauptworkspace sauber.
Commit-Message: `docs(engine): record runner payment support completion`.

## Verifikationsregeln

- Nach jedem Paket: `git diff --check`.
- Nach Codepaketen: mindestens paketnahe Engine-Tests.
- Vor Merge: `pnpm --filter @netgrid/engine typecheck` und relevante Engine-Testdateien.
- Wenn der komplette Engine-Testlauf zeitlich scheitert, muss der ausgeführte Teil dokumentiert und der Rest als offenes Risiko benannt werden.

## Ergebnisstand 2026-06-30

- RPS-00 ist mit Commit `e8f3213` abgeschlossen.
- RPS-01 bis RPS-04 wurden in einem zusammenhängenden Engine-Paket umgesetzt, weil Core-Vertrag, LegalAction-Reoffer, Chiba-Trash-Korrektur und Payment-Pfade zyklisch voneinander abhängen.
- Gemeinsamer Kern: `runner-payment-support.ts` kapselt Support-Kapazität, Runner-Credit-Ziel, Fensteröffnung, Fensterschließung und Pending-Choice-Synchronisierung.
- Angebundene Pfade: Runner-Install-Reoffer, Runner-Events, einfache Runner-Pool-Trigger, Access-Steal-/Trashkosten, Run-Start-Tax, laufende Run-/Icebreaker-/Pay-or-End-Kosten und Runner-Trace-Bids.
- Chiba Bank Account nutzt jetzt `trash_source` statt `tap_source` und wird nach Support-Nutzung in den Runner-Heap gelegt.
- Verifiziert: `pnpm --filter @netgrid/engine typecheck`; `vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts src/game/trace/trace-orchestration.test.ts src/game/run/run-duration-payment.test.ts src/game/run/start-run-action-execution.test.ts src/game/run/runner-breaker-action-execution.test.ts`; kompletter Engine-Testlauf `pnpm --filter @netgrid/engine test` mit 173 Testdateien und 1535 Tests.

## Worktree-, Git- und Integrationsregeln

- Arbeit ausschließlich in `C:\Projekte\NETGRID_RUNNER_PAYMENT_SUPPORT`.
- Branch `codex/runner-payment-support-hidden-resources`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Jeder abgeschlossene Paketstand erhält einen eigenen Commit.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite den Runner-Payment-Support-Hidden-Resources-Prozess vollständig und sequenziell von RPS-00 bis RPS-05 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_RUNNER_PAYMENT_SUPPORT auf Branch codex/runner-payment-support-hidden-resources. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Relevante Runner-Zahlungen können Hidden-Resource-Credit-Support über denselben Engine-internen Vertrag nutzen.
- LegalActions zeigen bezahlbare Aktionen mit Support-Kapazität an, ohne Resource-Kombinationen in der UI zu duplizieren.
- Originalaktionen werden nach Support erneut validiert.
- Chiba Bank Account wird nach Nutzung getrasht und ist danach nicht erneut nutzbar.
- Hidden-Info-, Replay-, StateHash- und stale-action-Grenzen bleiben abgesichert.
- Arbeitsbranch ist lokal nach `main` integriert.
