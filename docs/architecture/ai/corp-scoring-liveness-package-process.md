# Corp-Scoring-Liveness – Paketprozess

Status: aktiv, Paket P5

## Quelle und Zielprüfung

Quelle ist der Nutzerauftrag vom 24. August 2026 zum Match
`match_9f8cecdd78b35d0e`, insbesondere Decision 60 sowie die getrennten
Checkpoints D39 und D78. Zielzustand, Nicht-Ziele, Ownership, Testmatrix,
Verifikationsreihenfolge, Worktree, Merge und Abschlussbericht sind eindeutig
bestimmbar. Kleine Dateinamen- und Typbenennungsdetails folgen den vorhandenen
Konventionen.

## Gesamtziel

Die bestehende Ownership-Kette
`corp.score_agenda → corp.establish_scoring_remote → corp.defend_servers → corp.economy`
wird so geschlossen, dass ein blockierter Score-Root stets einen eigenen
ausführbaren Head, einen ausführbaren gebundenen Support-Head, eine echte
Waiting Condition, eine nachvollziehbare Replan-/Retarget-Entscheidung oder
einen konkreten Abandon-Grund besitzt. Unveränderte fachliche Bedarfe behalten
zugübergreifend dieselbe Identität und Credit-Zielhöhe.

## Annahmen

- Das vorhandene Decision-/Match-Bundle ist die Quelle für realistische,
  side-sichere Checkpoint-Fixtures; falls D60 nicht direkt serialisiert ist,
  wird der Zustand exakt aus vorhandener Evidence nachgebildet.
- `feasible` behält die Bedeutung „eigener aktueller Step ausführbar“.
- Ein echter fehlender Engine-Quote oder eine fehlende LegalAction-Eigenschaft
  erweitert den Scope nicht automatisch. Der Prozess dokumentiert dann den
  Engpass und seine Removal Condition.
- Die vom Nutzer verlangten vollständigen AI-Shards und die angemessene
  Selfplay-/Baseline-Evidence sind ein ausdrücklich zusätzliches finales Gate.

## Nicht-Ziele

- keine Match-, Deck- oder Karten-Sonderlogik;
- keine Änderung der Engine-Legalität und kein Kartenresolver-Sonderweg;
- kein zweiter Planner, globaler Action-Override oder Prioritätsbonus;
- kein allgemeiner Credit-, Draw-, EndTurn- oder First-Legal-Fallback;
- keine Vorgabe eines bestimmten D39-ICE-/Server-Gewinners;
- keine unzusammenhängenden Refactorings oder Legacy-Adapter.

## Controller-Invarianten

- Die Engine und `LegalActions` bleiben alleinige Legalitätsautorität.
- `corp.score_agenda` besitzt Agenda, Zielremote und Scoreentscheidung.
- `corp.establish_scoring_remote` besitzt Targetbindung, Phase und
  Remote-Lifecycle.
- `corp.defend_servers` besitzt ICE-Auswahl, Allokation, Installation und Rez.
- `corp.economy` finanziert nur einen exakten stabilen Bedarf oder einen
  eigenständig admission-geprüften endlichen Reserveplan.
- `PlanExecutionOrigin`, Parent-/Need-Bindung, konkrete aktuelle Action und
  StateVersion bleiben bei Support- und Choice-Pfaden erhalten.
- Fortschritt ist eine messbare Vorher-/Nachher-Änderung, keine ausgeführte
  Action-ID und keine bloße Credit-Erhöhung.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Ein roter fokussierter Test wird eng am verantwortlichen Owner debuggt; das
  nächste Paket beginnt erst nach erfülltem Done-Gate.
- Fehlende Quotes, unklare Ownership, zyklische Needs, side-unsichere Daten,
  fehlende aktuelle LegalAction-Bindung oder unauflösbare konkurrierende
  Vertragsdefinitionen stoppen den betroffenen Schnitt fail-closed.
- Ein Blockerreport nennt Ursache, verantwortlichen Pfad, Evidence und Removal
  Condition. Kein Workaround und kein Fallback ersetzt die Ursache.
- Fremde Worktrees, Listener, Datenbanken und offene Änderungen bleiben
  unangetastet. Dieser Prozess startet keinen Server.

## State Machine

```text
prepared
→ red_evidence
→ support_contract_green
→ safe_setup_green
→ economy_need_green
→ progress_coverage_green
→ checkpoints_green
→ final_verification_green
→ merged
→ cleaned
```

Genau ein Paket ist aktiv. Ein Zustandswechsel setzt fokussierte grüne Checks,
`git diff --check`, einen paketbezogenen Commit und einen aktualisierten
Prozessstatus voraus.

## Paketfolge und Paketdetails

### P0 – Preflight und Prozessvertrag

- Ziel: Pflichtquellen, aktuelle Architektur und Prozessgrenzen bestätigen.
- Arbeit: Wiki-first, AI-Preflight, Worktree-/Branch-Prüfung, dieses Artefakt.
- Checks: Worktree/Branch, `git diff --check`.
- Done-Gate: Ownership und Nicht-Ziele sind widerspruchsfrei festgehalten.
- Commit: `docs(ai): define corp scoring liveness package process`.

### P1 – Reproduzierende Red Evidence

- Ziel: D60-Mehrzugschleife sowie D39-/D78- und generische Strukturfehler vor
  produktiver Änderung reproduzieren.
- Arbeit: echte oder exakt nachgebildete PlayerViews und LegalActions,
  sequenzielle Revalidierung 11→14→17→20, Owner-/Step-/Route-Evidence.
- Kernartefakte: neue Decision-Checkpoint-Tests und engste bestehenden
  Unit-Tests.
- Checks: ausschließlich neue Testdateien beziehungsweise einzelne
  Testnamen; erwartetes Rot muss die beschriebenen Ursachen treffen.
- Done-Gate: Red Evidence ist deterministisch und scheitert nicht wegen
  Fixture-, Import- oder Typfehlern.
- Commit: `test(ai): reproduce corp scoring campaign liveness failures`.

### P2 – Score-/Remote-Support und stabile Identität

- Ziel: blockierte Score-Consumer supportberechtigt machen, ohne `feasible`
  umzudeuten; Lease und Need fachlich stabil binden.
- Arbeit: typisierter Supportzustand, Agenda-/Server-/Revision-/Need-Bindung,
  inkrementeller Defense-Fortschritt und unveränderte Owner.
- Kernartefakte: Remote-Signale, Resident Portfolio, Core-Planmodule und Tests.
- Checks: Remote-, Portfolio- und Core-Modultests.
- Done-Gate: `feasible === false` darf gebundenen Support nicht verhindern;
  Need/Provider bleiben zugübergreifend stabil.
- Commit: `fix(ai): bind blocked score roots to remote support`.

### P3 – Agenda-Linien und safe_setup

- Ziel: `safe_setup` mit exaktem Provider auch ohne Agenda-Head erzeugen.
- Arbeit: Linienfamilien trennen, frühen Agenda-Head-Abbruch entfernen,
  `continue` ohne Linie/Wait durch explizite Disposition ersetzen.
- Kernartefakte: Agenda-Turn-Planning und Runtime-Anbindung.
- Checks: Agenda-Turn-Planning und direkt angebundene Core-/Runtime-Tests.
- Done-Gate: Rush braucht Agenda-Head; safe setup braucht Root, Need, Provider,
  LegalAction und messbaren Fortschritt; providerloses Continue ist unmöglich.
- Commit: `fix(ai): materialize safe setup without agenda head`.

### P4 – Stabile Economy-Bedarfe

- Ziel: Credit-Ziele ausschließlich aus stabiler fachlicher Nachfrage bilden.
- Arbeit: `currentCredits + remainingClicks` als strategische Zielquelle
  entfernen; Parent-/Need-/Target-/Revision-Dedupe; Need-Reduktion als
  Parentfortschritt; begrenzte Restkapazitätsverwertung ohne Fortschrittsclaim.
- Kernartefakte: Economy-Signale, Runtime-Bindung, Portfolio und Tests.
- Checks: Economy-Unit-, Core- und Mehrzugtest.
- Done-Gate: 11/14 bleibt bis 14/14 stabil; 14 öffnet ohne Demand-Änderung kein
  Ziel 17; Parentfortschritt verlangt kleineren Need.
- Commit: `fix(ai): stabilize bound economy funding targets`.

### P5 – Liveness-/Progress-Witness und Coverage

- Ziel: kleinen wiederverwendbaren Fortschrittsvertrag für Score und Remote
  an der vorhandenen Coverage-Grenze validieren.
- Arbeit: Self-/Support-Head, Waiting Condition, Replan und Abandon als
  Witness; geforderte Fehlercodes; P6 maskiert keine fehlende P4/P5-Abdeckung.
- Kernartefakte: Planning-Coverage, eng angebundene Typen/Trace und Tests.
- Checks: Coverage- und Core-Modultests.
- Done-Gate: alle acht generischen Strukturfälle sind fail-closed abgedeckt.
- Commit: `fix(ai): enforce scoring progress witnesses in coverage`.

### P6 – D39 und D78 getrennt abschließen

- Ziel: Defense-Allokation und Remote-Provider-Evidence ohne hartes Kartenziel
  nachweisen.
- Arbeit: vollständige serverbezogene Evidence/Disposition für D39; konkrete
  Providerbewertung oder stärkerer Alternativpfad für D78.
- Kernartefakte: Defense-Signale/-Allokation, Checkpoint-Tests, Trace.
- Checks: D39, D78 und direkt angrenzende Defense-Tests.
- Done-Gate: fachliche Alternativen und Ausschlussgründe sind sichtbar; kein
  technischer Tiebreak und keine Karten-/Decksonderregel entscheiden.
- Commit: `fix(ai): explain corp defense support allocation`.

### P7 – Finale Verifikation, Wissenspflege und Integration

- Ziel: alle Nutzer-Gates grün, wiederverwendbaren Vertrag dokumentieren,
  branch lokal integrieren und vollständig aufräumen.
- Arbeit: fokussierte Tests, betroffene Modultests, Checkpoints, Coverage,
  AI-Typecheck, vollständige AI-Shards, angemessene deterministische
  Selfplay-/Baseline-Suite; Architektur-/Logpflege; Prozessartefakt nach
  Überführung des dauerhaften Wissens entfernen; enger Abschlusscommit.
- Checks: Nutzerreihenfolge plus `git diff --check`, Status und Main-Prüfung.
- Done-Gate: sämtliche Akzeptanzkriterien grün; Worktree sauber; Fast-Forward
  nach `main`; Worktree-Pfad in Git und Dateisystem entfernt; Branch gelöscht.
- Commits: `docs(ai): document corp scoring liveness contract` und
  `fix(ai): enforce corp scoring campaign liveness` (nur falls ein finaler
  enger Squash-/Abschlusscommit fachlich nötig ist; Paketcommits bleiben sonst
  bestehen).

## Verifikationsregeln

1. neue fokussierte Red/Green-Tests;
2. betroffene Planmodultests;
3. Decision-Checkpoint-Tests;
4. Corp-Planning-Coverage-Tests;
5. `corepack pnpm --filter @netgrid/ai typecheck`;
6. `corepack pnpm test:ai:shards`;
7. vorhandene deterministische Selfplay-/Baseline-Suite im für die Änderung
   aussagekräftigen Umfang;
8. nach jedem Paket `git diff --check`.

Fokussierte AI-Tests erhalten mindestens 180 Sekunden äußeres Zeitfenster,
vollständige Shards mindestens 600 Sekunden. Laufende Prozesse werden über
ihre Session-ID weiterverfolgt und nicht wegen eines kurzen ersten Yields neu
gestartet.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_CORP_SCORING_LIVENESS`.
- Arbeitsbranch: `codex/ai-corp-scoring-liveness`.
- Integrationsbranch und Hauptcheckout: `main` in `C:\Projekte\NETGRID`.
- Nur paketbezogene Änderungen werden gestagt; jedes Done-Gate erhält einen
  Commit. Kein Push und kein Pull Request.
- Vor Merge wird ein weitergelaufenes `main` defensiv in den Arbeitsbranch
  integriert und nur betroffene Checks werden wiederholt.
- Der finale Merge erfolgt bevorzugt per Fast-Forward. Danach werden exakt
  dieser saubere Worktree und anschließend der nachweislich gemergte Branch
  entfernt und beide Cleanup-Schritte verifiziert.

## Controller-Prompt-Kern

```text
/Goal Arbeite Corp-Scoring-Liveness vollständig und sequenziell von P0 bis P7
ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, packages/ai/AGENTS.md, den AI-Änderungskompass, die
einschlägige Planning-/Campaign-Architektur und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CORP_SCORING_LIVENESS
auf Branch codex/ai-corp-scoring-liveness. Nutze den Hauptworkspace nur für
den finalen Merge. Stelle keine Zwischenfragen, solange konservative
automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket,
aktualisiere den Paketstatus, führe die paketnahen Checks aus und committe
jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Workaround,
schreibe einen Blockerreport mit Removal Condition. Verifiziere abschließend
die vom Nutzer geforderten breiten Gates, merge lokal nach main, prüfe main,
entferne den sauberen Worktree, verifiziere dessen Entfernung in Git und im
Dateisystem, lösche den gemergten Branch und markiere das Goal erst dann als
complete.
```

## Abschlusskriterien

Alle fachlichen Akzeptanzkriterien des Nutzerauftrags sind durch Unit-,
Struktur-, Checkpoint- und Mehrzugtests belegt. Der Decision Trace erklärt
Root, Blocker, Need, Provider, Head/Wait, Vorher/Nachher-Bedarf,
Parentfortschritt, Disposition und Economy-Zielquelle. Produktiver Code enthält
keine Match-, Deck- oder Karten-Sonderlogik. Alle geforderten Gates sind grün,
die dauerhafte Architektur ist nachgezogen, `main` enthält die Paketcommits und
Arbeitsworktree sowie Arbeitsbranch sind verifiziert entfernt.
