# Universal Fast Advance Play-Strength Process

Status: `in_progress`

Datum: 2026-07-10

## Quelle

- `docs/reviews/ai/universal-fast-advance-20-game-playtest-evidence-2026-07-10.md`
- Nutzerfreigabe vom 2026-07-10 für alle vier freigabereifen Punkte

## Zielprüfung

Die Vorgabe ist für direkte Umsetzung ausreichend präzise. Die vier Findings
besitzen konkrete Replay-/StateVersion-Evidence, betroffene Schichten,
Akzeptanzkriterien und Sicherheitsgrenzen.

## Gesamtziel

Die vier freigegebenen Findings sequenziell beheben: Roadblock- und
Cost-Penalty-LegalAction-Lücken schließen, Fast-Advance-Enabler generisch in
konkrete Scorelinien konvertieren sowie stale Runner-Runs und unbegründete
Recovery-Loops reduzieren. Danach alle relevanten Engine-/AI-Gates ausführen
und den Arbeitsbranch lokal nach `main` integrieren.

## Annahmen

- Die Evidence-Datei und die lokalen Rohtraces sind die fachliche Baseline.
- Die aktuelle Semantic Runtime bleibt der einzige Live-Entscheidungsweg.
- Generische Funktions-/Action-Semantik hat Vorrang vor Karten-ID-Sonderlogik.
- Die Implementierung darf nur vorhandene LegalActions bewerten und wählen.

## Nicht-Ziele

- keine Änderung von Kartenregeln oder Kartentexten;
- keine Nutzung verdeckter Informationen;
- keine Promotion neuer Decks in den Default-/Random-Pool;
- kein Push und kein Pull Request;
- keine allgemeine Neuarchitektur von Engine oder KI.

## Controller-Invarianten

- Engine-Korrektheit zuerst; `applyAction` bleibt finaler Guardrail.
- Jede KI-Aktion stammt aus `LegalActions`.
- PlayerView, PublicEvents, Debug und Reports bleiben side-safe.
- Replay, StateHash und Seed/RandomDrawRecords bleiben deterministisch.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden innerhalb des aktiven Pakets debuggt.
- Eine echte Engine-/LegalAction-Lücke wird nicht im KI-Code umgangen.
- Nicht belegte Erweiterungen werden als Follow-up dokumentiert.
- Bei Side-Safety-, Replay- oder StateHash-Regression stoppt der Prozess.

## Sicherheitsblocker

- notwendiger FullGameState- oder Hidden-Info-Zugriff;
- neue Aktionserzeugung außerhalb der Engine;
- nicht deterministische Roadblock-/Penalty-Auflösung;
- nicht kollisionsfrei integrierbarer `main`-Stand.

## State Machine

`preflight -> engine_legalactions -> corp_fast_advance -> runner_loops -> final_review -> main_sync -> complete`

## Paketfolge

### FA001 – Preflight und Evidence

- Ziel: Prozess, Worktree, Baseline und vier freigegebene Findings verankern.
- Kernartefakte: dieses Prozessdokument und der Evidence-Report.
- Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: eigener Worktree/Branch, unveränderte Hauptworkspace-Fremdarbeit,
  Prozess und Evidence committed.
- Commit: `docs(ai): start universal fast advance playstrength process`

### FA002 – Engine-LegalAction-Fortsetzungen

- Ziel: Roadblock-Encounter und Runner-Cost-Penalty-Fenster können nie in
  einem nicht terminalen Zustand ohne LegalAction hängen bleiben.
- Kernartefakte: Engine-Mechanik, fokussierte Roadblock-/Penalty-Tests.
- Checks: fokussierte Engine-Tests, Replay/StateHash-Gegenprobe,
  Engine-Typecheck.
- Done-Gate: alle dokumentierten Zustandsvarianten deterministisch grün.
- Commit: `fix(engine): close roadblock and runner penalty windows`

### FA003 – Corp-Fast-Advance-Konversion

- Ziel: vorhandene Advancement-/Ability-LegalActions werden anhand einer
  konkreten sicheren Scorekonversion statt bloßer Countermenge bewertet.
- Kernartefakte: Action-/Target-Semantik oder Score-Komponenten, fokussierte
  Corp-Regressionen und Debug-Evidence.
- Checks: fokussierte AI-Tests, AI-Typecheck, relevante Hint-/Doctrine-Gates.
- Done-Gate: Agenda-Ziel oder Transfer wird bei erreichbarer Scorelinie
  bevorzugt; Gegenproben ohne erreichbare Linie bleiben neutral.
- Commit: `fix(ai): convert fast advance enablers into score lines`

### FA004 – Runner-Stale-Run- und Recovery-Gates

- Ziel: unveränderte Zentralzugriffe, unbegründete Recovery und
  Plan-/Aktions-Mismatches werden generisch abgewertet.
- Kernartefakte: Run-/Plan-Alignment, Recovery-/Funding-Gate,
  match-up-übergreifende Regressionen.
- Checks: fokussierte AI-Tests, Simulation-/Trace-Mining-Gegenproben,
  AI-Typecheck.
- Done-Gate: stale Repeat verliert gegen belegte Economy-, Setup-,
  Remote-Contest- oder End-Turn-Alternativen; frische Access-Evidence bleibt
  druckwürdig.
- Commit: `fix(ai): suppress stale central and recovery loops`

### FA005 – Final Review und Wissenspflege

- Ziel: breite Verifikation, Final Review und aktueller Wissens-/Logstand.
- Kernartefakte: Final Review, Evidence-Status, Prozessstatus, Monatslog.
- Checks: fokussierte Tests, `@netgrid/engine`/`@netgrid/ai`-Tests und
  Typechecks, relevante AI-Gates, `git diff --check`.
- Done-Gate: keine neue Safety-/Replay-/Redaction-Regression; Restpunkte und
  ausgeführte Checks dokumentiert.
- Commit: `docs(ai): complete universal fast advance playstrength process`

## Verifikationsregeln

- Paketnahe Tests vor breiten Tests.
- Engine-Änderung: deterministische Mechanik-, LegalAction-, Replay- und
  StateHash-Prüfung.
- AI-Änderung: nur side-sichere Inputs und vorhandene LegalActions.
- Daten-/Hint-Änderungen nur bei nachgewiesener fachlicher Notwendigkeit.
- Nach jedem Paket `git diff --check` und eigener Commit.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_FAST_ADVANCE_20260710`
- Branch: `codex/universal-fast-advance-playstrength`
- Hauptworkspace nur für den finalen lokalen Merge.
- Vor Merge aktuelles lokales `main` in den Arbeitsbranch integrieren.
- Konflikte fachlich auflösen; keine fremden Änderungen zurücksetzen.
- Nach erfolgreichem Merge relevante Checks auf `main` wiederholen.
- Kein Push und kein PR.

## Verbindliches /Goal

`/Goal Arbeite Universal Fast Advance Play-Strength vollständig und
sequenziell von FA001 bis FA005 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main. Lies zuerst AGENTS.md, packages/engine/AGENTS.md,
packages/ai/AGENTS.md, dieses Prozessartefakt und den Evidence-Report. Arbeite
ausschließlich im Worktree C:\Projekte\NETGRID_AI_FAST_ADVANCE_20260710 auf
Branch codex/universal-fast-advance-playstrength. Nutze den Hauptworkspace nur
für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks
aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit
Blocker-Report. Nach FA005 aktuelles main integrieren, final verifizieren,
lokal nach main mergen und den Goal erst danach als complete markieren.`

## Abschlusskriterien

- vier freigegebene Punkte umgesetzt oder fachlich mit Removal Condition
  blockiert;
- fokussierte und breite Verifikation dokumentiert;
- fünf Paketcommits vorhanden;
- Arbeitsbranch sauber und lokal nach `main` integriert;
- Final Review und Wissenspflege abgeschlossen.

## Paketstatus

- FA001: `completed` – Prozess und Evidence im Worktree verankert; Commit
  `0e3240f07`.
- FA002: `completed` – Roadblock-Auto-Pass erhält den bereits fortgeschalteten
  Runzustand; Pay-or-End-the-Run-Zahlungen suspendieren die
  Subroutinenauflösung bis Hidden-Payment-Support abgeschlossen ist. Fokussiert
  grün: 6 Testdateien/46 Tests, Engine-Typecheck und `git diff --check`.
- FA003: `completed` – Advancement-LegalActions veröffentlichen Countermenge,
  Verteilungsmodus und Transferart. Die Corp bewertet die beste sichtbare
  Verteilung, priorisiert sofortige bzw. nächste Scoreaktionen und schließt
  Bursts ohne konkrete Conversion aus; die Choice konzentriert Counter auf
  scorebare Agenden. Fokussiert grün: 5 Testdateien/119 Tests plus 2
  Engine-Testdateien/22 Tests, AI-/Engine-Typecheck, `check:ai`,
  Doctrine- und Format-Gate.
- FA004: `pending`.
- FA005: `pending`.
