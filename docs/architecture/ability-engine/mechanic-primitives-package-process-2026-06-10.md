# Mechanic Primitives Paketprozess 2026-06-10

Status: In Umsetzung
Arbeitsbranch: `codex/mechanic-primitives`
Worktree: `C:\Projekte\NETGRID_MECHANIC_PRIMITIVES`

## Quelle/Vorgabe

Der Nutzerauftrag ist, die zuvor blockierten oder nur teilweise generalisierten Mechanikfamilien direkt mit dem Paketprozess-Worktree-Goal anzugehen:

- Successful-Run-Vertragsfamilie, insbesondere Hidden-Resource-Followups vor Access;
- ICE-Subroutine-/Stärke-Modifier-Primitive für Ice Transmutation und verwandte Subroutine-Kopie-Effekte;
- Hidden-Zone-Install-/Rez-Sequenzvertrag für Data Fort Reclamation und verwandte Install-/Rez-Bausteine;
- abschließender Testblock mit vollem Testlauf, Analyse roter Tests und Behebung aller durch diese Änderungen verursachten Regressionen.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung, sofern konservativ gearbeitet wird:

- keine neue Kartenfreigabe, kein Catalog-/AI-/UI-Scope;
- bestehende LegalAction- und PlayerView-Grenzen bleiben erhalten;
- neue generische Namen dürfen nur existierende Semantik ausdrücken;
- falls eine Mechanikfamilie keinen sicheren gemeinsamen Vertrag trägt, wird kein Code erzwungen, sondern eine Removal Condition dokumentiert.

## Gesamtziel

Die blockierten Mechanikfamilien werden in wiederverwendbare, parametrisierte Ability-Engine-Verträge überführt, soweit bestehendes Verhalten 1:1 erhalten bleibt. Die bisherigen kartenbenannten Definition-`kind`s sollen dort verschwinden, wo sie durch fachlich tragfähige Bausteine ersetzt werden können.

Der abgeschlossene Arbeitsbranch wird lokal nach `main` integriert.

## Annahmen

- Der lokale `main` bei Worktree-Erstellung ist die gültige Integrationsbasis.
- Die zwei vorbestehenden lokalen Commits auf `main` sind bewusst integrierte Vorarbeit und werden nicht verändert.
- Bestehende LegalAction-Payload-Namen können stabil bleiben, wenn sie Teil von Tests, Replay oder PublicPayload-Vertrag sind.
- Parametrisierung darf kleinschrittig sein: zuerst bestehende Karten abbilden, keine hypothetischen Effekte ohne aktuellen Nutzerwert.

## Nicht-Ziele

- keine neuen Karten als `human_playable`, `deck_legal` oder `ai_supported` freischalten;
- keine AI-Hints, Szenarien oder Manifest-Promotion;
- keine Web-/Server-/UI-Arbeit;
- kein Push oder PR;
- keine große Neuordnung von Run-, Choice- oder Scored-Agenda-Runtime außerhalb der betroffenen Pfade.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- LegalActions werden nur aus legalen Quellen erzeugt und in `applyAction` erneut validiert.
- Hidden-Info bleibt aus PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads und Logs heraus.
- Replay, StateHash, RandomCounter und RandomDrawRecords bleiben deterministisch.
- Keine verdeckten HQ-, R&D- oder Remote-Kartenidentitäten werden öffentlich gemacht.

## Automatische Fehlerbehandlung

- Bei rotem Paketcheck wird nur das aktive Paket debuggt.
- Bei rotem Volltest wird jeder Fehler als bekannte Baseline, durch aktuelle Änderung verursachte Regression oder unklare Fremdregression klassifiziert.
- Durch aktuelle Änderungen verursachte Regressionen werden im selben Prozess behoben.
- Bekannte Baseline-Rotstände werden dokumentiert, aber nicht unter falschem Scope gelöst.

## Sicherheitsblocker

Ein Paket stoppt ohne riskante Codeänderung, wenn es eines dieser Dinge bräuchte:

- neue PublicEvent-/PlayerView-Payload-Semantik ohne Tests;
- neue Hidden-Zone-Choice-Source ohne Stale-, Wrong-Side- und StateHash-Test;
- neues Run-Timingfenster ohne eindeutige Access-Fortsetzung;
- nicht deterministische Ziel- oder Kartenreihenfolge;
- Änderung an bestehenden Kartenregeln statt reiner Vertragsgeneralisierung.

## State Machine

1. Preflight: Worktree, Branch, Main-Status und Paket-Scope prüfen.
2. Prozessanker committen.
3. Genau ein Mechanikpaket aktivieren.
4. Typvertrag, Definitionen, Runtime und Tests eng ändern.
5. Paketchecks und `git diff --check` ausführen.
6. Paket committen.
7. Nächstes Paket starten.
8. Testblock: voller Testlauf, Analyse, Regression-Fixes, erneuter Verify.
9. Main einbinden, final prüfen, lokal nach `main` fast-forward mergen.
10. Worktree entfernen und Goal schließen.

## Paketfolge

### P0 - Prozessanker und Preflight

Ziel: Prozessartefakt, Scope, Branch und Worktree festlegen.

Kernartefakte:

- `docs/architecture/ability-engine/mechanic-primitives-package-process-2026-06-10.md`

Checks:

- `git status --short --branch`
- `git diff --check`

Commit: `docs(engine): plan mechanic primitive package process`

### P1 - Successful-Run-before-access-Vertrag

Ziel: Die Hidden-Resource-Followups `Credit Subversion` und `Death from Above` auf einen parametrisierten Vertrag überführen.

Konkrete Arbeit:

- Definitionstyp `successful_run_before_access_effect` oder gleichwertig einführen;
- Parameter für Server, Kostenquelle, Effekt und Sichtbarkeit ausdrücken;
- bestehende Karten auf den Vertrag migrieren;
- Runtime-Erzeugung und Resolution über den generischen Vertrag validieren;
- bestehende Payload-Kompatibilität erhalten, soweit sie Test-/Replay-Vertrag ist.

Kernartefakte:

- `packages/engine/src/ability-engine/definition-types.ts`
- `packages/engine/src/card-implementations/proteus/runner/resources/credit-subversion.ts`
- `packages/engine/src/card-implementations/proteus/runner/resources/death-from-above.ts`
- `packages/engine/src/game/run/successful-run-interventions.ts`
- passende Successful-Run-Tests

Done-Gate:

- Hidden-Resource-Runner-Trigger entstehen nur für richtige Server, installierte ungetappte Hidden Resources und Access-Timing;
- Resolution revalidiert Quelle, Server, Nutzung pro Run, Reveal/Tap und Effekt;
- Focus-Tests grün.

Commit: `refactor(engine): generalize successful run before access effects`

### P2 - ICE-Subroutine-/Stärke-Modifier-Primitive

Ziel: Ice Transmutation über einen generischen Scored-Agenda-Vertrag für markierte rezzed ICE-Modifier ausdrücken.

Konkrete Arbeit:

- Definitionstyp für `select_rezzed_ice_mark_modifier` oder gleichwertig einführen;
- Parameter für Counter, Stärke-Bonus, Subroutine-Duplizierung, Ziel und Sichtbarkeit ausdrücken;
- Ice Transmutation migrieren;
- Runtime-Choice und Resolution gegen generischen Vertrag prüfen;
- vorhandene Subroutine-Kopie-Bausteine nicht unnötig umbauen, aber im Prozess als verwandte Nutzer dokumentieren.

Kernartefakte:

- `packages/engine/src/ability-engine/definition-types.ts`
- `packages/engine/src/card-implementations/onr-v1/corp/agendas/ice-transmutation.ts`
- `packages/engine/src/game/corp/scored-agenda-flow.ts`
- Scored-Agenda-Tests und Encounter-/Card-View-Regressionen

Done-Gate:

- Scoring öffnet weiterhin exakt eine öffentliche Zielwahl bei rezzed ICE;
- gewähltes ICE erhält denselben Mark-Counter;
- Stärke und Subroutine-Duplizierung bleiben unverändert;
- Focus-Tests grün.

Commit: `refactor(engine): generalize scored ice mark modifiers`

### P3 - Hidden-Zone-Install-/Rez-Sequenzvertrag

Ziel: Data Fort Reclamation über einen generischeren Scored-Agenda-Sequenzvertrag ausdrücken.

Konkrete Arbeit:

- Definitionstyp für `score_install_hq_cards_into_new_remote_then_rez` oder gleichwertig einführen;
- Parameter für HQ-Auswahl, maximales Count, temporäre Credits, neues Remote, optionale Rez-Sequenz und Sichtbarkeit ausdrücken;
- Data Fort Reclamation migrieren;
- Runtime-Choice-Quellen und Resolution anhand generischer Vertragsfelder validieren;
- bestehende Hidden-Zone-Payload-Namen stabil halten, sofern sie Tests/Replays schützen.

Kernartefakte:

- `packages/engine/src/ability-engine/definition-types.ts`
- `packages/engine/src/card-implementations/onr-v1/corp/agendas/data-fort-reclamation.ts`
- `packages/engine/src/game/corp/scored-agenda-flow.ts`
- `packages/engine/src/game/corp/install-rez-sequence-handlers.ts`
- Install-/Rez-Sequenztests

Done-Gate:

- Auswahl aus HQ, Installation ins neue Remote und optionale Rez-Sequenz funktionieren unverändert;
- Stale-, Wrong-Side-, Kosten- und Hidden-Info-Grenzen bleiben erhalten;
- Focus-Tests grün.

Commit: `refactor(engine): generalize scored hidden zone install rez sequences`

### P4 - Volltestblock, Regression-Fixes und Integration

Ziel: Alle Tests ausführen, rote Tests klassifizieren und durch diese Änderungen verursachte Regressionen beheben.

Konkrete Arbeit:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine test`
- bei Bedarf weitere root-/packageweite Tests, falls Engine-Änderungen transitive Fehler zeigen;
- rote Tests nach Ursache klassifizieren;
- durch P1 bis P3 verursachte rote Tests beheben;
- `git diff --check`;
- aktuellen `main` in Arbeitsbranch integrieren;
- final lokal nach `main` mergen und Main-Status prüfen.

Done-Gate:

- keine durch P1 bis P3 verursachten roten Tests bleiben offen;
- bekannte Baseline-Rotstände sind von neuen Regressionen getrennt dokumentiert;
- Arbeitsbranch ist sauber und lokal in `main` integriert.

Commit: `docs(engine): record mechanic primitive verification`

## Verifikationsregeln

- Nach jedem Codepaket mindestens Typecheck plus passende Focus-Tests.
- Vor jedem Commit `git diff --check`.
- Im finalen Testblock voller Engine-Testlauf.
- Wenn der volle Testlauf rot bleibt, muss die Restliste beweisen, dass die Fehler nicht durch diesen Prozess verursacht wurden.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_MECHANIC_PRIMITIVES`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push und kein PR.
- Keine fremden Branches oder Worktrees verändern.

## Controller-Prompt-Kern

`/Goal Arbeite Mechanic Primitives vollständig und sequenziell von Paket P0 bis Paket P4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_MECHANIC_PRIMITIVES auf Branch codex/mechanic-primitives. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe die betroffene Codeänderung, schreibe Blocker-Report mit Removal Condition und setze mit dem nächsten Paket fort, wenn keine globale Invariante verletzt ist. Im finalen Testblock alle Engine-Tests laufen lassen, rote Tests klassifizieren und alle durch aktuelle Änderungen verursachten roten Tests beheben. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- P1 bis P3 sind umgesetzt oder mit Removal Condition dokumentiert.
- Bestehende Karten verhalten sich regelgleich.
- Neue Verträge sind durch Focus-Tests abgedeckt.
- Volltestblock ist ausgeführt und analysiert.
- Lokaler `main` enthält alle Paketcommits.

## Paketprotokoll

### P1 Ergebnis

Umgesetzt:

- `CardSuccessfulRunFollowupImplementation` enthält jetzt den parametrisierten Vertrag `successful_run_before_access_effect`.
- `Credit Subversion` nutzt diesen Vertrag mit `server: "hq"` und `effect: { kind: "corp_lose_credits", amount: 3 }`.
- `Death from Above` nutzt denselben Vertrag mit `server: "remote"` und `effect: { kind: "trash_remote_fort", include: "root_and_ice" }`.
- `successful-run-interventions.ts` erzeugt und resolved die bestehenden LegalActions über Type-Guard-Helfer für diese Vertragsparameter.

Bewusst stabil gelassen:

- LegalAction-Payloads `proteusHiddenSuccessfulRunFollowup: "corp_lose_credits"` und `"trash_remote_fort"`.
- Hidden-Zone-Actions `proteus_hidden_successful_hq_run_credit_subversion` und `proteus_hidden_successful_remote_run_trash_fort`.
- Reveal-/Tap-Payloads, Servervalidierung, einmalige Nutzung pro Run, Access-Fortsetzung und PublicPayloads.

Checks:

- Grün: keine alten `hidden_resource_successful_*`-Definition-`kind`s in `packages/engine/src` oder `scripts`.
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts src/game/run/successful-run-interventions.test.ts src/game/run/run-access-transition.test.ts`
