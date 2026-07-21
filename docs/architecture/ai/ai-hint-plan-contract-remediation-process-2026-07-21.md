# KI-Hint- und Plan-Contract-Remediation – Paketprozess (2026-07-21)

## Ziel

Die beim Selbstspiel `Rent-I-Con: Das Shellspiel` gegen `Original Speed v1.0`
festgestellten Diagnosen belastbar einordnen und gezielt beheben. Die Arbeit
bleibt auf Consumer-Contracts, Nachweisbarkeit von Hint-Semantik und die
Richtigkeit der Plan-/Mismatch-Diagnostik begrenzt. Sie verändert weder die
Rules Engine noch Kartenregeln.

## Ausgangsevidence

- Referenzmatch: `match_e653f50ac25eed22`.
- Fünf Seeds `rent-i-con-vs-original-speed-2026-07-20-001` bis `-005`:
  vier Runner- und ein Corp-Sieg, 1.170 Entscheidungen, keine illegalen
  Aktionen, Replay-Fehler oder verdeckten Datenmarker.
- Der Hint-Audit meldete 28 blockierende Einträge allein deshalb, weil für
  `tacticSignals`, `strategySupportPairs` und `remoteRole` kein Eintrag im
  Audit-Contract-Register existierte. Die Meldung ist kein Beleg dafür, dass
  die Felder zur Laufzeit ungenutzt sind.
- Die drei Corp-Eis `Crystal Wall`, `Keeper` und `Quandary` tragen jeweils
  `tacticSignals: ["corp_ice.end_run"]`. Ihre End-the-run-Wirkung ist bereits
  über Engine-Subroutinen, `etr_ice` sowie `etr`/`remote_protection` modelliert.
  Ob das zusätzliche Signal redundant ist, wird vor einer Löschung mit einem
  Profilvergleich entschieden.
- Die zwölf `plan_step_action_mismatch` betreffen
  `runner.opportunistic_central_run`; alle enthalten
  `runnerKnownPathBlockedByMissingCoverage` oder
  `runnerRunSuppressedAsKnownNoAccess`. Der Miner erkennt diese begründeten
  Nicht-Runs bisher nicht. Das ist zunächst ein Diagnostik-Contract-Problem,
  kein Nachweis für schlechte Runner-Aktionen.
- Bei sieben weiteren Remote-Fällen war `runner.contest_remote` aktiv, während
  eine Remote-Run-Alternative als `excluded_by_current_plan` erschien. Die
  Auswahl war nicht nachweislich falsch; Planphase und Begründung sind jedoch
  nicht eindeutig genug.

## Paketfolge

1. **Evidence und Contract-Register:** Die drei Audit-Felder nur mit ihren
   tatsächlich vorhandenen Consumer-Ketten registrieren; Regressionstest für
   die Audit-Ausgabe ergänzen.
2. **ETR-Signalentscheidung:** Für Crystal Wall, Keeper und Quandary den
   kompilierten semantischen Profilbeitrag mit und ohne `corp_ice.end_run`
   vergleichen. Nur bei nachgewiesener Wirkungslosigkeit entfernen; andernfalls
   mit einem gezielten Consumer-Test behalten.
3. **Plan- und Mismatch-Contract:** Bekannte, wegen fehlender Breaker-Coverage
   oder sicher fehlendem Access unterdrückte Runs als explizite Erklärung im
   Mismatch-Miner akzeptieren. Die Runner-Plan-Revalidierung so testen bzw.
   schärfen, dass ein nicht ausführbarer Run nicht weiter als Ausführungsplan
   interpretiert wird. Für Remote-Contest wird die Funding- gegenüber der
   Execute-Phase explizit begründet, ohne Runs pauschal zu erzwingen.
4. **Verifikation:** Betroffene Unit-Tests, Typ-/Lint-Checks, Deck-Hint-Audit
   sowie fünf erneute Seeds mit vollständigen Diagnosedateien laufen lassen.
   Eine neue Analyse vergleicht Findings und Ergebnisstabilität mit der
   Ausgangsevidence.

## Akzeptanzkriterien

- Der Audit meldet die drei Felder nicht mehr allein wegen eines fehlenden
  Registereintrags und verweist nur auf reale Consumer.
- Die ETR-Signalentscheidung ist reproduzierbar getestet und dokumentiert;
  keine Feldlöschung ohne Wirkungsnachweis.
- Bekannte, nicht ausführbare Runs erzeugen keinen irreführenden
  `plan_step_action_mismatch`; echte, unbegründete Planabweichungen bleiben
  sichtbar.
- Remote-Contest-Funding und -Ausführung sind in Entscheidungsdaten
  unterscheidbar; es gibt keinen globalen Score- oder Run-Zwang.
- Replay-/LegalActions- und Geheimhaltungs-Invarianten bleiben unverändert.

## Entscheidungen und Zwischenstand

- `tacticSignals` ist als Feld durch den Profil-Compiler konsumiert,
  `strategySupportPairs` durch Opening-Hand- und Deck-Doktrin-Auswertung und
  `remoteRole` durch Deck-Doktrin sowie den Remote-Role-Ontology-Consumer.
  Der Audit-Contract war unvollständig, nicht die drei Felder pauschal nutzlos.
- Für Crystal Wall, Keeper und Quandary bleibt
  `tacticSignals: ["corp_ice.end_run"]` erhalten. Das Feld wird im
  Profil-Compiler als Kompatibilitätssignal verarbeitet und ergänzt somit die
  ETR-Effekt-/Rollen-Semantik der Rez-Aktionen. Der vollständige Fünf-Seed-Lauf
  mit und ohne diese drei Einträge ergab auf diesem Stand jeweils 3:2; daraus
  folgt keine belastbare Verhaltensverbesserung durch eine Löschung. Der frühere
  Audit-Fund war ausschließlich ein fehlender Registereintrag, keine
  Löschaufforderung.
- Der Audit auf dem Corp-Checkpoint
  `cp-74e2369-05-corporate-war-threshold-consumer` enthält nach der Korrektur
  keinen `hint_field_without_consumer_contract`-Fund mehr. Seine drei
  verbleibenden Hosted-Credit-Funde betreffen BBS/Department of Truth und
  gehören nicht zum vorliegenden Hint-Consumer-Problem.
- Remote-Contest-Pläne tragen jetzt explizit
  `runner_remote_contest_phase:acquire_coverage` oder
  `runner_remote_contest_phase:execute`. Die Phase beschreibt die tatsächliche
  Planabsicht, ohne den Selektor zu einem unfinanzierten Run zu zwingen.

## Arbeitsform

Branch `codex/ai-hint-plan-contract-remediation`, isolierter Worktree
`C:\Projekte\NETGRID_AI_HINT_PLAN_CONTRACT_REMEDIATION`. Jeder abgeschlossene
Paketstand wird separat geprüft und committed. Nach erfolgreicher
Gesamtverifikation wird lokal nach `main` integriert; kein Push.
