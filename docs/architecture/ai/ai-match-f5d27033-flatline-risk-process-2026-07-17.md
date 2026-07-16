# KI-Match-F5D27033-Flatline-Risikoprozess

Status: fachlich abgeschlossen; lokale Integration ausstehend

## Quelle und Ziel

Quelle ist das gespeicherte Match `match_f5d27033a083d6b8`, beendet am
2026-07-16 um 23:04 Uhr Ortszeit. Ziel ist, drei freigegebene und auf dem
aktuellen Code reproduzierbare Runner-Fehler generisch zu beheben:

1. Ein sichtbar bekannter Damage-Ambush als einziger verbleibender
   Remote-Zugriff muss die Continue-/Jack-out-Entscheidung beeinflussen.
2. Damage-Handpuffer müssen die effektive maximale Handgröße und Core Damage
   berücksichtigen; schwache Installationen dürfen den Puffer nicht ohne
   unmittelbaren Schutz verdrängen.
3. Opportunistische Runs dürfen einen fachlich stärkeren Survival-/Reserve-
   Schritt nicht durch absolute Plan-Arbitration verdrängen. Vorhandene
   replay-stabile Probevariation bleibt die Quelle für echte Grenzfälle.

## Invarianten und Nicht-Ziele

- Es werden ausschließlich side-sichere PlayerViews, öffentliche Eventpräfixe
  und LegalActions konsumiert.
- Die KI errät weder Chance Observation noch Urban Renewal aus verdeckten
  Zonen.
- Kartentext, Engine-Regeln und die geprüften Kartenhints werden nicht
  verändert, solange die Checkpoints keine semantische Abweichung belegen.
- Frühe Informationsruns und dringende Remote-Contests werden nicht pauschal
  unterdrückt.
- Kein Push und kein Pull Request.

## Arbeitszustand

- Hauptworkspace: `C:\Projekte\NETGRID`
- Worktree: `C:\Projekte\NETGRID_AI_F5D_FLATLINE_RISK_FIX`
- Branch: `codex/ai-f5d-flatline-risk-fix`
- Lokaler Integrationsbranch: `main`

## Paketfolge

### Paket 1: Preflight und Prozessartefakt

Status: abgeschlossen

- Worktree und Branch anlegen.
- Projekt-, Agenten-, Skill- und Checkpoint-Verträge lesen.
- Prozess, Invarianten, Paketfolge und Abschlussgates festhalten.

Done-Gate: sauberer Worktree, `git diff --check`, Paketcommit.

### Paket 2: Match-Evidence und rote Checkpoints

Status: abgeschlossen

- Decisions 13/StateVersion 25, 24/StateVersion 41 und
  33/StateVersion 56 side-safe capturen.
- Unveränderte fachliche Erwartungen und enge Gegenproben definieren.
- Nur `behavior_regression` als roten Nachweis akzeptieren.
- Hint-/Consumer-Audit und Decision-Coverage im Evidence-Report sichern.

Done-Gate: alle drei Zielcheckpoints rot, Gegenproben grün, separater
Red-Evidence-Commit.

### Paket 3: Generische Runtime-Korrektur

Status: abgeschlossen

- Bekannten verbleibenden Access-Schaden in Run-Revalidation und Jack-out-
  Auswahl konsumieren.
- Effektive Handgröße, Handpuffer-Headroom und Core Damage in Survival-
  Scoring und Exclusions berücksichtigen.
- Plan-Arbitration für schwache Development-Installationen und
  opportunistische Runs an die vorhandene Risiko-/Probeentscheidung anbinden.

Done-Gate: unveränderte Zielcheckpoints grün, Gegenproben weiterhin grün,
fokussierte Unit-Tests grün, Paketcommit.

### Paket 4: Breite Verifikation und Abschluss

Status: Verifikation und Dokumentation abgeschlossen; Merge/Cleanup ausstehend

- Angrenzende Decision-Checkpoint- und Runtime-Tests ausführen.
- AI-Typecheck, relevante AI-Shards beziehungsweise vollständige AI-Suite und
  `git diff --check` ausführen.
- Evidence-, Final-Report und Monatslog aktualisieren.
- Aktuelles `main` defensiv integrieren, final erneut prüfen, lokal nach
  `main` mergen und Worktree sowie Arbeitsbranch verifiziert entfernen.

Done-Gate: dokumentierter grüner Verify-Stand, lokaler Main-Merge und sauberer
Cleanup.

## Automatische Fehlerbehandlung

- Checkpoint-Drift ist Infrastrukturarbeit und kein Verhaltensbeleg.
- Bereits grüne historische Erwartungen werden nicht durch einen Fix
  erzwungen.
- Bei Hidden-Info-, LegalAction-, Engine- oder Merge-Konflikten wird ohne
  KI-Workaround gestoppt.
- Neue breite Regressionen werden auf den kleinsten betroffenen Vertrag
  zurückgeführt, bevor der Prozess fortgesetzt wird.

## Abschlusskriterien

- Alle drei freigegebenen Findings besitzen dauerhafte spielgleiche
  Checkpoints und positive Gegenproben.
- Die Checkpoints werden ohne Erwartungsänderung grün.
- Die neue Evidence erklärt Hint-, Consumer-, Plan- und Arbitration-Kette.
- Relevante fokussierte und breite Gates bestehen oder bekannte, unveränderte
  Baseline-Abweichungen sind exakt dokumentiert.
- Der fertige Arbeitsbranch ist lokal in `main` integriert; Worktree und
  Branch sind entfernt und ihre Entfernung ist verifiziert.
