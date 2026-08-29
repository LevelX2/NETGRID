---
activityId: act-2026-08-29-vapor-ops-run-priority-stop
status: done
priority: high
owner: release-implementation-agent
branch: codex/vapor-ops-run-priority-stop
worktree: C:\Projekte\NETGRID-worktrees\vapor-ops-run-priority-stop
---

# Menschliche Run-Aktion vor automatischem KI-Fortschritt anhalten

## Quelle und Beobachtung

Beim Spiel als menschliche Korp gegen die Runner-KI war eine gerezzte und
entwickelte **Vapor Ops** vor dem Zugriff legal nutzbar. Die Aktion
„Vapor Ops: Advancement-Counter für 1 Credit ausgeben“ erschien kurz, der
Runner setzte den Run aber automatisch fort, obwohl „Restlichen Run
automatisch passen“ nicht aktiviert war. Mit nachträglich aktivierter
KI-Bremse blieb dasselbe Fenster nach einer Zurücknahme sichtbar.

## Zielprüfung

Der Endzustand ist ausreichend präzise:

- Die Engine bleibt alleinige Regelautorität und erzeugt die Vapor-Ops-
  `LegalAction` unverändert.
- Die automatische Web-KI-Orchestrierung hält an, sobald im aktiven
  Run mindestens eine aktuelle menschliche Korp-`LegalAction` offen ist,
  deren sichtbare Quellkarte im angegriffenen Server liegt.
- Nur der für den aktuellen Run ausdrücklich aktivierte Korp-Auto-Pass darf
  dieses lokale automatische Anhalten übergehen.
- Die manuelle KI-Fortsetzung und die Runner-Plan-/Step-/Routenwahl bleiben
  unverändert.

## Gesamtziel

`/Goal` Den Vapor-Ops-Timingfehler ursachenorientiert und generisch beheben:
Aktuelle menschliche Korp-Run-Aktionen aus dem angegriffenen Server stoppen
den automatischen KI-Vorlauf, sofern für den aktuellen Run kein ausdrücklicher
Auto-Pass aktiv ist. Den Fix mit
fokussierten Regressionstests absichern, paketweise committen, lokal nach
`main` integrieren und Worktree sowie Branch verifiziert bereinigen.

## Annahmen

- Die beobachtete Partie ist `human_corp_vs_runner_ai`.
- „KI-Bremse“ bezeichnet den lokalen dauerhaften Priority-Hold; sie bleibt als
  zusätzliche manuelle Bremse bestehen, ist aber nicht Voraussetzung für das
  korrekte Standardverhalten.
- „Restlichen Run automatisch passen“ ist die ausdrückliche Zustimmung, in
  diesem Run menschliche optionale Run-Fenster automatisch zu überspringen.
- Aktionen von Karten in anderen Servern lösen keinen automatischen Halt aus;
  dafür bleibt der bewusst gesetzte Priority-Hold mit manueller Freigabe.

## Nicht-Ziele

- Keine Änderung an Vapor Ops, Kartenregeln, Kosten, Timing oder Legalität.
- Keine Änderung an Runner-Plan, Step, Route, Action-ID oder Choice-Auflösung.
- Kein Kartenname-/Definition-ID-Sonderfall.
- Kein Server-, Browser- oder E2E-Start und keine breite AI-Shard-Suite.

## Controller-Invarianten

- Der Server-Controller darf die nächste bestehende Runner-KI-Aktion weiterhin
  vorbereiten und manuell ausführen.
- Automatisches UI-Pacing darf sie nicht absenden, solange eine side-sichere
  menschliche Korp-Run-`LegalAction` aus dem angegriffenen Server auf derselben
  `stateVersion` offen ist.
- Der aktive Auto-Pass wird ausschließlich durch den bereits rungebundenen
  lokalen Auto-Pass-Key autorisiert.
- Keine zweite Action-Auswahl, keine erzeugte LegalAction und kein Fallback.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Unklare oder veraltete Actiondaten erlauben keinen stillen automatischen
  Fortschritt.
- Bei fremden Änderungen in den konkreten Zieldateien, einem Ownership-
  Konflikt oder einem Hidden-Info-Risiko wird ohne Workaround gestoppt.
- Unabhängige Baselinefehler werden getrennt ausgewiesen und nicht in diesen
  Scope gezogen.

## State Machine

```text
diagnose
  -> attacked_server_human_run_action_pending
      -> auto_pass_current_run: automatische KI-Fortsetzung erlaubt
      -> no_auto_pass: automatische KI-Fortsetzung angehalten
  -> other_server_human_run_action_pending: bisheriges KI-Pacing unverändert
  -> no_human_run_action: bisheriges KI-Pacing unverändert
```

## Paketfolge

### VO-1 – Ursachenpfad und Vertrag festhalten

- Ziel: Engine-/Controller-/UI-Ownership und den realen Datenpfad belegen.
- Kernartefakt: dieses Activity-Paket.
- Check: Quellen-/Referenzprüfung und `git diff --check`.
- Done-Gate: Ursache, Invarianten, Nicht-Ziele und Folgepaket sind eindeutig.
- Commit: `docs(activity): define Vapor Ops run priority stop`

### VO-2 – Generischen Auto-Pacing-Stop implementieren

- Ziel: automatisches KI-Pacing bei aktueller menschlicher Korp-Run-Aktion aus
  dem angegriffenen Server ohne aktuellen Auto-Pass verhindern.
- Kernartefakte:
  - `apps/web/app/action-board-ui.ts`
  - `apps/web/app/page.tsx`
  - fokussierte Web-Regressionsprüfung
- Checks:
  - direkter Vitest für die neue Policy einschließlich Vapor-Ops-naher
    `activated_card_ability`, anderem Server und Auto-Pass-Gegenfall;
  - direkt angrenzender Run-Layering-Test;
  - `git diff --check`.
- Done-Gate: Standard-Pacing hält, Auto-Pass-Gegenfall läuft weiter, manuelle
  KI-Fortsetzung und Action-Ownership sind unverändert.
- Commit: `fix(web): pause AI for human run actions`

## Verifikations- und Integrationsregeln

- Nur direkt änderungsnahe Web-Tests ausführen.
- Pro abgeschlossenem Paket ein lokaler Commit.
- Vor Integration aktuelles `main` defensiv in den Arbeitsbranch aufnehmen,
  falls es weitergelaufen ist.
- Anschließend lokal nach `main` integrieren; kein Push und kein PR.
- Erst nach erfolgreichem Merge Worktree und gemergten Branch entfernen und
  beides über Git sowie Dateisystem verifizieren.

## Fortschritt

- [x] Worktree- und Branch-Preflight
- [x] Engine-Legalität und aktuelle Vapor-Ops-Action geprüft
- [x] Ursache im automatischen KI-Pacing eingegrenzt
- [x] VO-1 committed (`c6a3e0ed7`)
- [x] VO-2 implementiert und fokussiert getestet

Die lokale `main`-Integration sowie die verifizierte Worktree-/Branch-
Bereinigung erfolgen nach dem letzten Paketcommit und werden im
Controller-Abschluss berichtet; sie werden hier nicht vorzeitig als
versionierter Ist-Stand behauptet.

## Ergebnis und Checks

- Die neue Policy prüft ausschließlich aktuelle side-sichere Korp-
  `LegalActions`, deren strukturierte Quellkarten-ID zu einer Karte im
  angegriffenen Server gehört.
- Eine Vapor-Ops-Aktion aus einem anderen Server hält die Runner-KI nicht
  automatisch an; dafür bleibt der Priority-Hold mit manueller Freigabe.
- Der für den aktuellen Run aktivierte Auto-Pass hebt den automatischen Halt
  ausdrücklich auf.
- Fokussierte Web-Tests: 2 Dateien, 146 Tests bestanden.
- Web-Typecheck: Die geänderten Dateien sind fehlerfrei; der Gesamtlauf bleibt
  an einem unabhängigen Ausgangsfehler in
  `app/ai-turn-plan-comparison-ui.test.ts` rot, weil das dortige Fixture die
  bereits erforderlichen Felder `executionOrigin` und `selectedStep` nicht
  enthält.
