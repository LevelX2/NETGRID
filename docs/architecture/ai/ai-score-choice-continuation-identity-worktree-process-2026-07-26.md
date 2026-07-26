# Score-Choice-Continuation-Identity – Worktree-Paketprozess

Status: **abgeschlossen; lokale Main-Integration und Cleanup ausstehend**

Stand: 2026-07-26

Quelle: `docs/architecture/ai/ai-score-choice-continuation-identity-process-2026-07-26.md`

## Zielprüfung

Das Gesamtziel ist ausreichend präzise: Der bestehende Prozess begrenzt den
Scope auf zwei Corp-Score-Fortsetzungen, benennt die Shared-, Engine- und
AI-Grenzen, die fail-closed Regeln sowie die erforderlichen Gates. Der
Arbeitsbranch ist `codex/score-choice-continuation-identity`; die Umsetzung
läuft ausschließlich im Worktree
`C:\Projekte\NETGRID_score_choice_continuation_identity`. `main` bleibt bis
zum finalen lokalen Merge unverändert.

## Gesamtziel

Die beiden Corp-Score-Choice-Familien tragen eine aktuelle, strukturierte und
side-sichere Continuation-Identität. Die KI autorisiert und löst sie ohne
semantisches Parsen von `ChoiceRequest.source` auf. Fehlende, fremde, stale
oder unvollständige Identität scheitert fail-closed; Source-Provenienz,
Replay, StateHash und Hidden-Info-Verträge bleiben erhalten.

## Annahmen und Nicht-Ziele

- `LegalAction.actionId` ist die auslösende Identität. Die Choice referenziert
  sie als `originActionId`; die Engine erfindet keine KI- oder UI-Autorität.
- Der Shared-Vertrag bleibt optional, damit nicht migrierte Choice-Familien
  unverändert bleiben.
- Im Scope liegen nur `corp_advancement_counter` und
  `corp_scored_agenda_hq_shuffle`; die übrigen Choice-Producer und 40 weitere
  KI-Source-Auswertungen werden nicht still mitmigriert.
- Push, Pull Request und Remote-Integration sind ausgeschlossen.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität; nur aktuelle LegalActions werden
  durch `applyAction` ausgeführt.
- KI nutzt ausschließlich Corp-PlayerView, side-sichere Ereignisse und
  LegalActions.
- Die Continuation transportiert keine neue Runner- oder Public-Information.
- Unvollständige Bindungen werden nicht aus `choice.source` ergänzt.

## State Machine und Fehlerbehandlung

`P1 → P2 → P3 → P4 → integriert → bereinigt`. Genau ein Paket ist aktiv.
Ein roter Test, ein Hidden-Info-Risiko oder ein widersprüchlicher
Engine-Vertrag hält das aktive Paket an; die Fehlerursache wird eng behoben
oder mit Removal Condition als Blocker dokumentiert. Kein Folgepaket startet
vor dessen Done-Gate.

## Paketfolge

### P1 – Prozess und Vertrag

Ziel: Worktree-Prozess, Scope, Invarianten und Abnahmegrenzen festschreiben.

Checks: Prozessartefakt vollständig, `git diff --check`.

Done-Gate: Dokumentationscommit auf dem Arbeitsbranch.

Commit: `docs(ai): define score choice continuation worktree process`.

### P2 – Shared-/Engine-Producer

Ziel: Diskriminierte optionale Continuation im Shared-Vertrag sowie vollständige
Payloads der beiden Engine-Producer implementieren.

Checks: Shared-/Engine-Typecheck, Engine-Fokustests, PlayerView-/Redaction-
Regression, `git diff --check`.

Done-Gate: Producer liefern nur für die zwei Familien aktuelle, vollständige
und korrekte Payloads; Source bleibt unverändert.

Commit: `feat(engine): expose score choice continuation identity`.

### P3 – KI-Consumer und Fail-closed-Tests

Ziel: Beide Score-Resolver auf strukturierte Identität umstellen und jede
semantische `choice.source`-Lektüre in diesen Resolvern entfernen.

Checks: AI-Typecheck, gezielte Resolvertests für positiv, fehlend, fremd und
stale sowie `check:ai` und `git diff --check`.

Done-Gate: Kein erlaubender Source-Fallback; beide Resolver prüfen Plan,
Action, Agenda, Seite, Timing und State-Version.

Commit: `feat(ai): resolve score choices by continuation identity`.

### P4 – Abschluss und Integration

Ziel: Prozess-/Statusnachweis aktualisieren, finale Gates ausführen und den
Arbeitsbranch lokal integrieren.

Checks: relevante Shared-, Engine- und AI-Tests, Workspace-Typecheck,
`check:ai`, Paketgrenzen, `git diff --check`, sauberer Main-Stand.

Done-Gate: Alle Paketcommits integriert, Worktree und gemergter Branch
verifiziert entfernt.

Commit: `docs(ai): close score choice continuation identity process`.

## Abschlussstand vor Integration

P1 bis P3 sind in `64981e10c`, `49b57d99b`, `f713959fc` und `fa6389c35`
committed. Die vollständigen Gates sind grün: Workspace-Typecheck, 496/496
AI-Testdateien mit 3.968/3.968 Tests, 207/207 Engine-Testdateien mit
1.796/1.796 Tests, `check:ai`, Paketgrenzen mit 1.950 Dateien,
`format:changed` und `git diff --check`.

## Git- und Abschlussregeln

Jedes abgeschlossene Paket erhält einen eigenen Commit. Vor dem finalen Merge
wird aktuelles `main` defensiv in den Arbeitsbranch integriert. Danach erfolgt
die lokale Integration bevorzugt per Fast-forward. Erst bei sauberem Main,
vollständigen Gates und sauberem Arbeitsworktree wird exakt dieser Worktree
entfernt, anschließend die Branch-Löschung ohne Force geprüft.
