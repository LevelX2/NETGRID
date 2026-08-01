# Serie 82b2 – vollständige KI-Analyse und Remediation

Status: `broad_verification_complete`; alle fünf Activities und zwölf
historischen Checkpoint-Proben sind grün, die breite Verifikation ist
abgeschlossen und die lokale Main-Integration folgt

Quelle/Vorgabe: Nutzerauftrag vom 01.08.2026, beide abgeschlossenen Spiele der
Serie `series_82b2d391315f055b` vollständig zu analysieren, bestehende
Playtest-Findings zu verifizieren, zusätzliche Findings als Activities zu
schneiden und alle reproduzierbaren offenen Pakete im Worktree umzusetzen.

## Zielprüfung

Der Endzustand ist ausreichend präzise:

- beide Spiele erhalten vollständige Decision-Coverage;
- Nutzerfindings und zusätzliche Findings werden side-sicher belegt;
- nur auf aktuellem Code als `behavior_regression` reproduzierbare Fehler
  werden behoben;
- jedes Finding bleibt beim bestehenden fachlichen Planowner;
- alle zugehörigen Activities werden sequenziell geclaimt, umgesetzt,
  verifiziert und einzeln committed;
- der fertige Branch wird lokal nach `main` integriert;
- Worktree und gemergter Branch werden anschließend verifiziert entfernt.

## Gesamtziel

Runner- und Corp-KI sollen die in den beiden finalen Spielen sichtbar
gewordenen Plan-, Zielwahl-, Economy-, Defense- und Kartenlinien auf dem
aktuellen Plan-first-Stand kohärent ausführen, ohne Engine-, LegalAction-,
Hidden-Info-, Replay- oder StateHash-Verträge zu verändern oder eine zweite
Entscheidungsautorität einzuführen.

## Annahmen und Freigabe

- Match 1: `match_550e1860213fbef4`, Runner-KI.
- Match 2: `match_1bad991988b099b8`, Corp-KI.
- Der Nutzer hat die direkte Umsetzung aller aus der vollständigen Analyse
  hervorgehenden belastbaren Probleme ausdrücklich beauftragt. Nach der
  Analyse wird die vollständige Punkt-/Maßnahmenliste im Chat ausgegeben;
  diese vorhandene Direktfreigabe erlaubt danach die automatische
  Fortsetzung, solange kein Sicherheits- oder Scopeblocker entsteht.
- Der normale Server auf Port 8787 bleibt unangetastet. Die Standard-SQLite
  wird nur nach ausdrücklicher Zustimmung zum angekündigten Live-Read und
  ausschließlich mit kurzlebigen Read-only-Clients geöffnet.
- Bereits angelegte Activities sind Startscope, aber kein Vorurteil: Ein
  historischer Fund, der auf aktuellem Code nicht rot reproduzierbar ist,
  erhält keinen Verhaltensfix.

## Nicht-Ziele

- keine Engine-Regeländerung ohne nachgewiesene LegalAction-/Engine-Lücke;
- keine Karten-ID-, Match-ID- oder StateVersion-Sonderheuristik;
- keine Hidden-Info-Nutzung;
- kein neuer globaler Chooser, Resolver, Override oder Fallback;
- keine pauschale Schwächung früher Probe-Runs, Archives-Runs, Bankaufbau,
  ICE-Rez oder Bluff-/Decoy-Linien;
- kein Push und kein Pull Request.

## Controller-Invarianten

- `runner.convert_run_window` besitzt die gebundene Folgeauswahl eines bereits
  eröffneten Run-/Access-Fensters und erhält den `PlanExecutionOrigin` des
  auslösenden Runplans.
- `runner.economy` beziehungsweise die konkrete Credit-Bank-Instanz besitzt
  Load, Hold und Cashout; Parentpläne liefern nur typisierte Fundingbedarfe.
- `corp.defend_servers` bleibt alleiniger Owner für globale ICE-Allokation,
  ICE-Installation, Schutzbewertung und Rez-Entscheidung.
- `corp.score_agenda` besitzt Agendaquelle, Scorepfad, Counterbank und
  Countertransfer. `corp.ambush_and_bluff` darf dieselbe Karteninstanz nicht
  mit einem widersprüchlichen Parallelzweck ausführen.
- Choices vervollständigen ausschließlich die Payload einer bereits exakt
  gebundenen LegalAction und ändern weder `actionId` noch Executor.

## Automatische Fehlerbehandlung

- `behavior_regression`: Activity bleibt ausführbar; unveränderte rote
  Expectation plus grüne Gegenprobe separat committen, danach generisch fixen.
- `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required` oder Redactionfehler: kein Verhaltensfix;
  Infrastruktur- oder Migrationsbefund separat dokumentieren.
- Bereits grüner Checkpoint: Activity als auf aktuellem Code nicht
  reproduzierbar abschließen; keine Erwartung abschwächen.
- Testfehler: innerhalb des aktiven Pakets diagnostizieren und nicht zum
  nächsten Paket springen.
- Neue Findings: kleine Activity anlegen; keine stille Erweiterung des
  aktiven Pakets.

## Sicherheitsblocker

- Live-SQLite ohne ausdrückliche Zustimmung;
- benötigte gegnerische Hidden-Info;
- fehlende LegalAction, die nur durch KI-Umgehung kompensiert werden könnte;
- Replay-, StateHash-, Redaction- oder Engine-Korrektheitsregression;
- nicht kollisionsfrei integrierbares `main`;
- unklarer oder dirty Worktree vor Merge/Cleanup.

## State Machine

```text
prepared
→ live_read_approved
→ audit_complete
→ findings_and_activities_complete
→ red_checkpoints_complete
→ activity_implementation_loop
→ broad_verification_complete
→ merged_to_main
→ worktree_and_branch_removed
→ complete
```

Genau ein Paket ist aktiv. Kein Zustand wird übersprungen.

Aktueller Stand vom 01.08.2026:

- Live-Read ausdrücklich freigegeben und ausschließlich read-only erfolgt;
- 267/267 KI-Entscheidungen ohne fehlende, verwaiste oder doppelte Traces
  klassifiziert;
- vier Nutzerfindings bestätigt;
- ein zusätzlicher Broker-Hint-/Consumer-Befund als F5 identifiziert;
- vollständige Evidence:
  `docs/reviews/ai/series-82b2-final-full-decision-audit-2026-08-01.md`.
- Red-Evidence:
  `docs/reviews/ai/series-82b2-red-evidence-2026-08-01.md`; alle sechs
  Zielassertionen sind `behavior_regression`, alle Fixture-Gegenproben grün.
- Alle fünf Pakete der Activity-Schleife sind einzeln abgeschlossen und nach
  `docs/activities/done/` verschoben.
- 3/3 AI-Testshards mit 549 Testdateien und 4.506 Tests, `check:ai`,
  AI-Typecheck sowie beide Deck-Consumer-Audits sind grün.
- Abschlussreview:
  `docs/reviews/ai/series-82b2-remediation-final-review-2026-08-01.md`.

## Paketfolge

### P1 – Vollständige Analyse und Evidence

- Eingang: Live-SQLite-Risikogate erfüllt.
- Arbeit: beide Matches inspecten; Decision-Denominator schließen; jede KI-
  Decision samt Parent-/Child-Fenstern klassifizieren; Deck-Hint-/Consumer-
  Audits für beide Decks; Nutzerfindings und weitere Findings mit bester
  sichtbarer Alternative und Folgeauswahl belegen.
- Kernartefakte: Evidence-Report unter `docs/reviews/ai/` und lokale
  umfangreiche Rohdaten ausschließlich unter `data/local/`.
- Checks: 100 Prozent Decision-Coverage, keine verwaisten/doppelten Traces,
  Deck-Audits mit ausgewiesenem Status.
- Done-Gate: vollständige Punkt-/Maßnahmenliste und nicht freigabereife
  Beobachtungen sind getrennt dokumentiert.
- Commit: `docs(ai): audit final series 82b2 decisions`.

### P2 – Activities und Prozessscope finalisieren

- Eingang: P1 abgeschlossen.
- Arbeit: bestehende vier Activities präzisieren; zusätzliche Findings als
  kleine Activities im Worktree anlegen; Priorität und Owner festlegen;
  Prozessreihenfolge aktualisieren.
- Kernartefakte: `docs/activities/inbox/` und dieses Prozessartefakt.
- Checks: eindeutige IDs, Board-Format, `git diff --check`.
- Done-Gate: jedes freigegebene Finding besitzt genau ein ausführbares Paket.
- Commit: `docs(activities): add final series remediation packages`.

### P3 – Spielgleiche Red-Evidence

- Eingang: P2 abgeschlossen.
- Arbeit: für jedes freigegebene Finding den frühesten kausalen historischen
  Zustand capturen; strict warmup; unveränderte aktuelle Runtime ausführen;
  rote Zielerwartung und enge grüne Gegenprobe sichern.
- Kernartefakte: `data/scenarios/ai-decision-checkpoints/`, Checkpointtests und
  Red-Evidence-Report.
- Checks: ausschließlich `behavior_regression` gilt als rot; Fixture-
  Validierung, Eventpräfix, Runtimezustand und Redaction müssen grün sein.
- Done-Gate: alle umzusetzenden Activities besitzen belastbare Red-Evidence;
  bereits grüne Fälle sind ohne Fix dispositioniert.
- Commit: `test(ai): capture final series behavior regressions`.

### P4 – Activity-Schleife

Startreihenfolge nach aktuellem Board:

1. `act-2026-08-01-corp-vapor-ops-cross-plan-loop` (`critical`)
2. `act-2026-08-01-runner-all-nighter-bonus-run-target-ranking` (`high`)
3. `act-2026-08-01-runner-broker-cashout-after-value-target` (`high`)
4. `act-2026-08-01-corp-rd-layered-rez-sequence` (`high`)
5. `act-2026-08-01-runner-broker-hosted-credit-hint-contract` (`high`)

Für jede Activity einzeln:

- aus `inbox/` nach `in-progress/` verschieben und Frontmatter claimen;
- vollständige Activity lesen und relevanten Ownervertrag nachweisen;
- nur die rote generische Fehlerursache implementieren;
- unveränderten Checkpoint, Gegenproben, angrenzende Tests, AI-Typecheck und
  `git diff --check` ausführen;
- Activity mit Ergebnis, Artefakten und Checks nach `done/` verschieben;
- genau einen Paketcommit erstellen.

### P5 – Breite Verifikation und Abschlussdokumentation

- Eingang: keine ausführbare zugehörige Activity mehr offen.
- Arbeit: Final-Review, Architekturvertrag und Monatslog aktualisieren;
  Deck-Consumer-Audits wiederholen; vollständige AI-Gates ausführen.
- Checks mindestens:
  - alle neuen und angrenzenden Decision-Checkpoints;
  - `corepack pnpm --filter @netgrid/ai typecheck`;
  - `corepack pnpm check:ai`;
  - `corepack pnpm check:ai-source-structure`;
  - bei Hintänderungen die relevanten Hint-/Doctrine-Gates;
  - `corepack pnpm test:ai:shards`;
  - `git diff --check`.
- Done-Gate: keine neue harte Regression; Worktree sauber.
- Commit: `docs(ai): finalize series 82b2 remediation`.

### P6 – Main-Integration und Cleanup

- Eingang: P5 abgeschlossen und Worktree sauber.
- Arbeit: aktuelles `main` defensiv in den Arbeitsbranch integrieren, finale
  Checks wiederholen, Hauptworkspace prüfen, Branch lokal nach `main` mergen,
  Main-Smokes ausführen, Worktree und gemergten Branch verifiziert entfernen.
- Done-Gate: Branch in `main` enthalten; beide Status sauber; Worktree weder
  in Git noch im Dateisystem vorhanden; Branch per `git branch -d` entfernt.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_SERIES_82B2_FINAL`
- Branch: `codex/ai-series-82b2-final-remediation`
- Basis: lokales `main` bei `ec7835037`
- Hauptworkspace nur für den finalen Merge und Post-Merge-Checks verwenden.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Keine fremden Änderungen übernehmen oder zurücksetzen.
- Standardports 3100/8787 und Haupt-SQLite nicht aus dem Worktree starten,
  stoppen oder ersetzen.

## Verbindliches Goal

```text
/Goal Arbeite die vollständige Analyse und Remediation der Serie 82b2
sequenziell von P1 bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main. Lies AGENTS.md, packages/ai/AGENTS.md, die vorgeschriebenen
Wissensseiten, die relevanten Ownerabschnitte des AI-Zielzustands und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_SERIES_82B2_FINAL auf Branch
codex/ai-series-82b2-final-remediation und nutze den Hauptworkspace nur für
den finalen Merge. Stelle keine Zwischenfragen, solange konservative
Fortsetzung möglich und die vorhandene Nutzerfreigabe ausreichend ist.
Arbeite immer nur am aktuellen Paket, sichere jeden aktuellen Fehler vor dem
Fix als spielgleichen roten Checkpoint mit Gegenprobe, führe Paketchecks und
git diff --check aus und committe jedes abgeschlossene Paket. Stoppe bei
Sicherheitsblockern ohne Workaround und dokumentiere die Removal Condition.
Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen,
Worktree und gemergten Branch verifiziert entfernen und das Goal erst dann als
complete markieren.
```

## Abschlusskriterien

- beide Matches vollständig klassifiziert und deckweit auditiert;
- alle belastbaren Findings als Activities nachvollziehbar;
- alle aktuellen Fehler vor Fix rot und nach Fix grün;
- alle Activities abgeschlossen oder mit echter Removal Condition blockiert;
- breite AI-Gates grün oder bekannte Fremdfehler exakt dokumentiert;
- Final-Review und dauerhaftes Wissen aktualisiert;
- lokaler Main-Merge erfolgreich;
- Worktree und gemergter Branch verifiziert entfernt;
- Goal als `complete` markiert.
