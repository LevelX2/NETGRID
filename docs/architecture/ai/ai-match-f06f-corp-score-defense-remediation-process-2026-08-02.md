# Match f06f – Corp-Score-, Remote- und Defense-Remediation-Prozess

Status: aktiv – P3 rote Decision-Checkpoints abgeschlossen

Quelle: vollständiges 123/123-Entscheidungsaudit von
`match_f06f0fe345a11e0f` und Freigabe der Maßnahmen durch den
Projektbetreiber am 2. August 2026.

## Zielprüfung

Der Endzustand ist ausreichend bestimmt. Vier klare Fehlentscheidungen und
eine zusammenhängende Defense-Schwäche sind historisch reproduzierbar zu
prüfen. Die Korrektur erweitert ausschließlich die vorhandenen Owner und
deren bestehende Parent-/Need-/Portfolio-Verträge. Unbekannte historische
oder aktuelle Projektionen bleiben fail-closed.

## /Goal

Arbeite P1 bis P6 vollständig und sequenziell im Worktree
`C:\Projekte\NETGRID_AI_MATCH_F06F_REMEDIATION` auf Branch
`codex/ai-match-f06f-remediation` ab. Sichere jeden freigegebenen Fehler vor
dem Fix als spielgleichen roten Decision-Checkpoint mit grüner Gegenprobe.
Committe jedes abgeschlossene Paket einzeln. Integriere danach aktuelles
lokales `main`, führe die vollständigen AI-Gates aus, merge lokal nach
`main`, verifiziere den integrierten Stand und entferne den sauberen Worktree
sowie den vollständig gemergten Arbeitsbranch. Kein Push.

## Gesamtziel

Die Corp soll sichere oder verantwortbar geschützte Agenda-Scorelinien
resident fortführen, einen im selben Zug möglichen Score niemals durch freie
Economy verdrängen und bei Remote-abhängiger Deckdoktrin einen belastbaren
Scoring-Remote erhalten. `corp.defend_servers` soll zusätzliche ICE-Schichten
nur bei belegtem marginalem Schutzgewinn, passendem beobachtetem Druck und
vollständig finanzierbarer Install-/Rez-Fortsetzung wählen. Sichtbarer
Multiaccess, wiederholte erfolgreiche Runs und terminale Zentralgefahr dürfen
zusätzliche Central-Verteidigung weiterhin begründen.

## Annahmen und Nicht-Ziele

- Engine-Quotes, LegalActions und side-sichere PlayerViews bleiben die
  einzigen Regel-, Kosten- und Wirkungsquellen.
- Es gibt kein starres Maximum von drei ICE. Bereits ungerezzte Schichten,
  fehlender Druck und Opportunitätskosten bilden eine planinterne
  Sättigungsprüfung mit belegten Ausnahmen.
- Frühe Rush-Scores wie Corporate Coup aus dem analysierten Match bleiben
  zulässig, wenn die aktuelle vollständige Route sie trägt.
- Fast-Advance- und andere remoteunabhängige Doctrine-Linien erhalten keinen
  künstlichen Glacier-Auftrag.
- Keine Karten-ID-, Kartennamen-, Decklisten- oder Choice-Resolver-Sonderlogik.
- Keine Änderung von Spielregeln, SQLite-Daten oder öffentlichen Payloads.

## Controller-Invarianten

1. `corp.score_agenda` bleibt alleiniger Owner von Agenda, Zielremote,
   Install/Advance/Score, Scoring-Horizont und Same-Turn-Closeout.
2. `corp.establish_scoring_remote` besitzt ausschließlich langfristige
   Remote-Nutzbarkeit und veröffentlicht Schutzbedarf; es wählt kein ICE und
   keine Rez-Action.
3. `corp.defend_servers` bleibt alleiniger Owner globaler ICE-Allokation,
   ICE-Installation, Schutzprojektion, Rezreserve und Rezentscheidung.
4. `corp.economy` finanziert nur exakt gebundene Parent-Bedarfe und darf einen
   vollständig ausführbaren Score-Closeout nicht verdrängen.
5. Jede Aktion bleibt an residente Planinstanz, Step, Route, Action-ID und
   aktuelle StateVersion gebunden.
6. Choice-Resolver vervollständigen ausschließlich die Payload der bereits
   gewählten LegalAction.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Nur `behavior_regression` gilt als rote fachliche Checkpoint-Evidence.
  Engine-, Runtime-, Fixture- oder Redaction-Drift wird vor jedem
  Verhaltensfix als Infrastrukturproblem behandelt.
- Bereits grüne historische Findings werden nicht durch einen neuen Fix
  künstlich reproduziert.
- Fehlende oder veraltete Quotes erzeugen keine Ersatzwerte.
- Standardports 3100/8787 und Hauptserverprozesse werden aus dem Worktree
  nicht berührt. Die Standard-SQLite wird nach der Chat-weiten Zustimmung nur
  kurzlebig und read-only für die eingegrenzten Captures geöffnet.
- Fremde Änderungen oder fachlich unklare Mergekonflikte stoppen die
  Integration, ohne Daten zu verwerfen.

## State Machine

`P1 Prozessvertrag -> P2 Match-Evidence -> P3 rote Checkpoints -> P4
Owner-Korrekturen -> P5 Vollverifikation -> P6 Review/Main-Merge/Cleanup`

Genau ein Paket ist aktiv. Jeder Paketübergang verlangt sein Done-Gate,
`git diff --check`, paketgenaues Staging und einen eigenen Commit.

## Paketfolge

### P1 – Worktree-Preflight und Prozessvertrag

- Ziel: Worktree, Branch, Scope, Owner und Invarianten verbindlich festlegen.
- Artefakt: dieses Prozessdokument.
- Checks: Worktree-/Branchprüfung und `git diff --check`.
- Done-Gate: sauberer isolierter Worktree; Prozess vollständig und
  widerspruchsfrei.
- Commit: `docs(ai): define match f06f remediation process`

### P2 – Match-Evidence und Fehlergruppen

- Ziel: 123/123-Coverage, sichtbare Alternativen, Hint-/Consumer-Audit und die
  vier Ziel-StateVersions dauerhaft nachvollziehbar dokumentieren.
- Zielentscheidungen: Agenda-Install bei Decision 26, GVA-Closeout bei 41,
  Agenda-Install bei 52 und R&D-ICE-Überinvestition bei 102. Decision 37 wird
  als derselben GVA-Ursache zugehöriger Schwachpunkt festgehalten.
- Checks: Evidence gegen gespeicherte Trace-/Eventzahlen und `git diff --check`.
- Done-Gate: keine spätere Hidden-Info wird als frühere Decision-Evidence
  verwendet; Owner und beste sichtbare Alternative sind je Finding benannt.
- Commit: `docs(ai): record match f06f decision evidence`

### P3 – Spielgleiche rote Decision-Checkpoints

- Ziel: alle vier Zielzustände auf unverändertem aktuellem Code prüfen;
  ausschließlich weiterhin fehlerhafte Ziele rot reproduzieren und enge
  Gegenproben grün halten.
- Arbeit: Strict-Warmup-Captures für Decisions 26, 41, 52 und 102; Fixture-
  und Runtime-State-Validierung; Tests prüfen Verhalten und Ownership.
- Ergebnis: Decisions 26, 52 und 102 sind `behavior_regression`; Decision 41
  ist auf aktuellem Code bereits mit korrekter Score-Ownership grün.
- Done-Gate: ausschließlich die drei bestätigten `behavior_regression`-Fälle
  werden in P4 übernommen; Fixtures, Tests und Red-Evidence sind separat
  committed.
- Commit: `test(ai): capture match f06f behavior regressions`

### P4 – Bestehende Owner korrigieren

- Ziel A: `corp.score_agenda` bindet vollständige Scorehorizonte. Der bereits
  grüne Same-Turn-Closeout wird unverändert als Gegenprobe erhalten.
- Ziel B: der bestehende `corp.establish_scoring_remote`-Vertrag wird nur im
  erforderlichen Umfang ownergerecht angeschlossen und delegiert jede
  ICE-/Rezentscheidung an `corp.defend_servers`.
- Ziel C: `corp.defend_servers` konsumiert vorhandene Central-Facts für
  Sättigung und Multiaccess-/Druckausnahmen, respektiert exakte Parentreserven
  und akzeptiert nicht jede minimale Zugriffssenkung ungeachtet ungerezzter
  Schichten und Opportunity Cost als produktiv.
- Tests: unveränderte Zielerwartungen, Ownership, Multiaccess-Ausnahme,
  frühes Rush-Gegenbeispiel, Remote-unabhängige Doctrine und exakte
  Rezreserve-Gegenprobe.
- Done-Gate: keine neue Plan-, Resolver-, Override- oder Reserveautorität;
  fokussierte Tests und `git diff --check` grün.
- Commit: `fix(ai): preserve corp scorelines and bound defense layering`

### P5 – Checkpoints, angrenzende Regressionen und Vollgates

- Ziel: alle unveränderten Checkpoints und Gegenproben grün; keine
  angrenzende Regression.
- Checks: fokussierte Vitest-Suites, ältere relevante Decision-Checkpoints,
  `corepack pnpm check:ai`, `corepack pnpm check:ai-source-structure`,
  `corepack pnpm check:ai-generic-card-id-guards`,
  `corepack pnpm check:proteus-ai-readiness`,
  `corepack pnpm check:ai-deck-doctrine-strategy`, AI-Typecheck und
  `corepack pnpm test:ai:shards`.
- Done-Gate: alle Pflichtchecks grün; Worktree sauber bis auf Review-Artefakt.
- Commit: `test(ai): verify match f06f remediation`

### P6 – Review, Wissenspflege, Integration und Cleanup

- Ziel: Ergebnis, Testevidence und verbleibende Unsicherheiten festhalten;
  Architektur-Wissensverbund auf Änderungsbedarf prüfen; lokal integrieren.
- Arbeit: Final Review, Prozessstatus, gegebenenfalls synchronisierte
  Current-State-Dokumentation; aktuelles `main` in Arbeitsbranch integrieren;
  finale Checks; Fast-Forward-Merge nach `main`; Main-Prüfung; Worktree und
  Branch verifiziert entfernen.
- Done-Gate: `main` enthält alle Paketcommits und ist sauber; Worktree-Pfad
  fehlt in Git und Dateisystem; gemergter Branch ist gelöscht.
- Commit: `docs(ai): close match f06f remediation`

## Verifikationsregeln

- Fokussierte AI-Tests erhalten mindestens 180 Sekunden äußeres Zeitfenster.
- Vollständige AI-Shards und breite Gates erhalten mindestens 600 Sekunden.
- Checkpoint-Erwartungen werden nach dem Fix nicht an das neue Verhalten
  angepasst.
- Verhaltenstests prüfen Ergebnis sowie Plan, Step, Route und Executor.
- Umfangreiche Rohdaten bleiben unter `data/local/` und werden nicht
  versioniert.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree; Hauptcheckout nur für den
  finalen lokalen Merge.
- Jeder abgeschlossene Paketscope erhält genau seinen Commit.
- Vor jedem Commit: paketbezogene Checks und `git diff --check`.
- Kein Push und kein Pull Request.
- Cleanup erst nach erfolgreichem Main-Merge, ohne `--force`, mit doppelter
  Prüfung über `git worktree list --porcelain` und Dateisystem.

## Abschlusskriterien

Alle auf aktuellem Code roten Findings sind generisch behoben, ihre
unveränderten Checkpoints und Gegenproben sind grün, sämtliche Pflichtgates
sind erfolgreich, `main` enthält alle Paketcommits und der Arbeits-Worktree
sowie sein vollständig gemergter Branch sind entfernt.
