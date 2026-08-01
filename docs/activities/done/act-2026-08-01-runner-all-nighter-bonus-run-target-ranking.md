---
activityId: act-2026-08-01-runner-all-nighter-bonus-run-target-ranking
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-01
startedAt: 2026-08-01
completedAt: 2026-08-01
branch: codex/ai-series-82b2-final-remediation
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/runtime/plan-first-live-runtime.ts
  - packages/ai/src/runtime/plan-first-live-runtime-restricted-run-contract.test.ts
  - data/scenarios/ai-decision-checkpoints/cp-82b2-01-all-nighter-rd-bonus-d5.json
checks:
  - focused restricted-run and Runner plan tests: 38 passed
  - AI typecheck with explicit 6144 MB Node heap: passed
  - check:ai-source-structure: passed
  - git diff --check: passed
---

# Runner-KI: All-Nighter-Bonus-Run nach Zielwert statt Aktionsreihenfolge wählen

## Ziel

Die Runner-KI soll den durch `All-Nighter` eröffneten kostenlosen Folge-Run
auf den sichtbar wertvollsten legalen Server richten. Ein bekannt
ertragloses Archives darf nicht allein deshalb gewinnen, weil alle
Bonus-Run-Aktionen im Fortsetzungsplan denselben Pauschalwert erhalten.

## Kontext und Quellen

- Nutzer-Playtest vom 01.08.2026, Spiel 1 der aktuellen Hin-und-Rückspiel-Serie:
  `match_550e1860213fbef4` (`human_corp_vs_runner_ai`).
- Entscheidung 2 / StateVersion 7: Die KI spielt `All-Nighter auf R&D` unter
  `runner.pressure_central` und trasht beim Zugriff `Vapor Ops`.
- Entscheidung 5 / StateVersion 10: Der gebundene
  `runner.convert_run_window`-Plan wählt danach `Bonus-Run auf Archives`.
- Derselbe Trace bewertet den normalen Archives-Pfad mit
  `runner_archives_visible_state_has_no_agenda_payoff`, `run_if_free` und
  Score 160, während R&D als `fresh`, `run_now` und Score 300 vorliegt.
- Alle Bonus-Run-Ziele erhalten in der Fortsetzung dennoch denselben
  pauschalen Assessment-Wert 250; dadurch geht die vorhandene Zielqualität
  bei der Auswahl verloren.
- Verwandter erledigter Vertrag:
  `docs/activities/done/act-2026-05-17-runner-ai-repeat-rd-run.md`.
- Vollständige Serien-Evidence:
  `docs/reviews/ai/series-82b2-final-full-decision-audit-2026-08-01.md`, F1
  und Decision-Coverage D2–D5.

## Scope

- Den historischen Zustand aus Entscheidung 5 als aktuellen fokussierten
  KI-Checkpoint reproduzieren.
- `runner.convert_run_window` als Owner der bereits eröffneten
  All-Nighter-Fortsetzung beibehalten und innerhalb dieses Plans die legalen
  Bonus-Run-Ziele mit der vorhandenen side-sicheren RunTarget-/Access-Payoff-
  Bewertung unterscheiden.
- Sichtbare Archives-Karten, bekannte Agenda-Ausbeute, frische oder stale
  Zentralzugriffe, erreichbare Pfade und unvermeidbare sichtbare Gefahren in
  die Zielrangfolge übernehmen, soweit diese Signale bereits dem zuständigen
  Run-Plan gehören.
- Positive Regression: frisches R&D schlägt das bekannte ertraglose Archives
  im konkreten Matchzustand.
- Gegenproben: Archives darf gewinnen, wenn dort eine unbekannte oder konkret
  wertvolle Karte liegt; ein frischer anderer Server darf ebenfalls gewinnen,
  wenn seine sichtbare Quote besser ist.

## Nicht im Scope

- Keine Änderung an `All-Nighter`, Bonus-Run-LegalActions, Run-Regeln,
  Zugriff, Replay oder StateHash.
- Keine pauschale Sperre für Archives-Runs und keine Karten-ID-Sonderregel für
  `All-Nighter`.
- Keine Nutzung verdeckter Corp-Hand-, R&D-, Remote- oder Deckinformationen.
- Kein neuer Zielwahl-Resolver, Fallback, Override oder paralleler Run-Plan.
- Der Choice-/Fortsetzungsweg darf keine neue Strategieentscheidung außerhalb
  des zuständigen Plans treffen.

## Akzeptanzkriterien

- [x] Der Checkpoint aus Entscheidung 5 reproduziert die bisherige Wahl oder
      dokumentiert nachvollziehbar eine bereits wirksame Korrektur.
- [x] Bei legalem Bonus-Run auf frisches R&D und bekannt ertraglosem Archives
      wählt die KI R&D; Zielscore und Auswahlgrund sind im Debug sichtbar.
- [x] Ein sichtbar wertvolles oder informationsfrisches Archives kann
      weiterhin korrekt als Bonusziel gewinnen.
- [x] Planinstanz, Step, Executor und exakte Bonus-Run-`actionId` bleiben an
      `runner.convert_run_window` gebunden; nur das Ziel innerhalb der legalen
      Fortsetzungsaktionen ändert sich.
- [x] Hidden-Info-, LegalAction-, Replay- und StateHash-Grenzen bleiben
      unverändert; passende fokussierte KI-Regressionen und AI-Typecheck sind
      grün.

## Umsetzungshinweise

- Vor dem ersten KI-Codepatch den verbindlichen KI-Architektur-Preflight aus
  `AGENTS.md` vollständig durchführen.
- Den vorhandenen RunTarget-/Access-Payoff-Owner wiederverwenden. Die
  Fortsetzung darf dessen Bewertung konsumieren, aber keine zweite
  Serverstrategie aufbauen.
- Besonders auf die derzeit gleiche
  `runner_engine_restricted_run_sequence_continuation`-Bewertung aller
  Bonusziele achten; ein stabiler Tie-Break nach Aktionsreihenfolge ist hier
  kein fachlicher Zielwert.

## Ergebnisnotiz

Erledigt. Die bestehende `runner.convert_run_window`-Continuation übernimmt
jetzt den bereits vorhandenen side-sicheren RunTarget-Score der exakten
Restricted-Run-LegalAction. Damit schlägt im historischen D5-Zustand der
frische R&D-Bonus-Run das bekannte schwächere Archives. Planinstanz,
Capability, Executor und Actionbindung bleiben unverändert; nur der Server-
Wert innerhalb desselben Owners unterscheidet die Ziele. Eine Gegenprobe dreht
die sichtbaren Scores um und lässt weiterhin Archives gewinnen.
