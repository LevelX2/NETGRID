# AI-Baseline-Ownership-Fixes – Paketprozess

Status: P3 abgeschlossen, lokale Integration ausstehend
Datum: 2026-08-01  
Quelle: roter AI-Behavior-Baseline-Lauf `b87549867` mit zwei deterministischen
`missing_plan_module_coverage`-Abbrüchen in 60 Spielen

## Goal-Check

Aktives Goal:

> Arbeite den Paketprozess „NETGRID AI Baseline Ownership Fixes“ vollständig
> und sequenziell ab: (P1) eindeutige Singapore-City-Grid-HQ-Ice-Swap-
> LegalActions samt Engine-Invariante und Tests, (P2) konsistente Night-Shift-/
> Empty-R&D-Economy- und Defense-Funding-Ownership samt exakter
> PlanExecutionOrigin und Regressionstests, (P3) relevante Gesamtverifikation
> und Wissenspflege. Arbeite ausschließlich im dedizierten Worktree
> `C:\Projekte\NETGRID_AI_BASELINE_OWNERSHIP_FIXES` auf Branch
> `codex/ai-baseline-ownership-fixes`, committe jedes abgeschlossene Paket,
> integriere aktuelles `main` defensiv, merge den fertigen Branch lokal nach
> `main`, verifiziere `main` sowie Worktree- und Branch-Cleanup und markiere das
> Goal erst danach als complete. Keine Pushes oder PRs.

## Gesamtziel

Die beiden reproduzierten Baseline-Abbrüche werden an ihrer jeweiligen
fachlichen Autoritätsgrenze behoben. Danach muss der Standardlauf wieder ohne
IllegalActions, Runtimefehler, Fallbacks, Replay- oder Hidden-Info-Abweichungen
enden. Der Fix darf weder LegalActions nachträglich in der KI deduplizieren
noch Economy-, Defense- oder Choice-Autorität duplizieren.

## Annahmen und Nichtziele

- Engine und Rules Engine bleiben einzige Legalitätsautorität.
- Die zwei als `illegalActions` gezählten Fälle sind dieselben zwei
  fail-closed Runtimeabbrüche; es wurden keine ungültigen Actions angewandt.
- Der Singapore-Fehler ist eine kollidierende Engine-Action-ID für zwei
  verschiedene aktuelle Zielvarianten.
- Der Night-Shift-Fehler ist eine widersprüchliche Planabdeckung: Empty-R&D
  macht den Draw-Anteil nicht ausführbar, während eine Defense-Funding-Route
  dieselbe Action trotzdem als produktiven Economy-Head bindet.
- Nichtziel sind allgemeines KI-Retuning, neue Kartenheuristiken, Änderungen
  der Baseline-Schwellen oder die Bereinigung der doppelten Reportzählung.
- Keine Legacy-Kompatibilität, kein Push, kein Pull Request und kein Start
  von Webclient oder Server.

## Verbindliche Controller- und Ownership-Invarianten

1. Jede aktuell angebotene LegalAction besitzt innerhalb einer StateVersion
   eine eindeutige `actionId`.
2. Variantenidentität verwendet nur side-sichere, deterministische
   Diskriminatoren. Verdeckte Kartenidentitäten werden nicht in öffentliche
   Action-IDs übernommen.
3. Die KI dedupliziert keine fehlerhaften LegalActions; ein Engine-Verstoß
   bleibt fail-closed sichtbar.
4. `corp.defend_servers` bleibt Root-Foreground und fachlicher Owner von
   ICE-/Serverwahl und Defense-Bedarf.
5. `corp.economy` darf nur als exakte Supportinstanz einen konkreten,
   vollständig gequoteten Parent-Fundingbedarf erfüllen.
6. Ein Draw-Operation-Kandidat bei leerem R&D ist keine ausführbare
   Funding-Payload. Er bleibt explizit dispositioniert und darf keinen
   produktiven Planning Head erzeugen.
7. Die ausgewählte Action bleibt an dieselbe `actionId`, denselben Step und
   denselben Leaf-Executor gebunden. Ein Choice-Resolver oder spezialisierter
   Route-Adapter darf weder Planwahl noch Executor wechseln.
8. `PlanExecutionOrigin` bindet beim Defense-Funding den exakten
   Defense-Root und die exakte Economy-Supportinstanz; eine beliebige
   unabhängige Economy-Instanz ist unzulässig.
9. Fehlt die exakte Instanz- oder Actionbindung, endet die Entscheidung
   klassifiziert fail-closed statt mit einem allgemeinen Fallback.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Das aktuelle Paket wird nicht abgeschlossen, wenn mindestens einer der
folgenden Befunde auftritt:

- doppelte LegalAction-ID oder versteckte Zielidentität in side-sicheren
  Payloads beziehungsweise Action-IDs;
- eine nicht ausführbare Empty-R&D-Operation erscheint als produktive Route;
- Root-Foreground, Leaf-Executor, Planinstanz, Step, Route oder `actionId`
  weichen bei Rematerialisierung voneinander ab;
- eine fremde Economy-Instanz übernimmt einen Defense-Fundingbedarf;
- IllegalAction, unklassifizierte Runtimefailure, Replay-/StateHash-
  Abweichung, Hidden-Info-Leak, Nondeterminismus oder produktiver Fallback;
- rote paketnahe Tests, Typechecks, Struktur-/Boundary-Gates oder ungeklärte
  Timeouts.

Ein solcher Befund wird im aktuellen Paket untersucht und an der zuständigen
Engine- oder Planmodulgrenze behoben. Er darf nicht durch Deduplizierung,
breitere Semantiksuche, Resolver-Shortcut oder Ersatzaktion kaschiert werden.

## Zustandsmaschine

```text
P0 Prozessvertrag
  -> P1 Singapore LegalAction-Identität
  -> P2 Night Shift / Defense-Funding-Ownership
  -> P3 Gesamtverifikation und Wissenspflege
  -> main in Arbeitsbranch integrieren
  -> finale Branch-Gates
  -> lokal nach main mergen
  -> main verifizieren
  -> Worktree und Branch entfernen
  -> Goal complete
```

Es wird immer nur am aktuellen Paket gearbeitet. Jedes Paket erhält nach
bestandenem Done-Gate genau einen eigenen Commit.

## P0 – Prozessvertrag und isolierter Arbeitsstand

### Arbeit

- Pflichtwissen, AI-Architektur-Preflight und Ownerabschnitte lesen;
- vorhandenen Baseline-Review separat auf `main` sichern;
- Worktree und Arbeitsbranch kollisionsfrei anlegen;
- dieses Prozessartefakt erstellen.

### Done-Gate

- Hauptworkspace und Worktree sind sauber klassifiziert;
- Worktree zeigt auf `codex/ai-baseline-ownership-fixes`;
- Goal, Paketreihenfolge, Invarianten und Abschlussvertrag sind dokumentiert;
- `git diff --check` ist grün.

### Commit

`docs(ai): plan baseline ownership fixes`

## P1 – Eindeutige Singapore-City-Grid-HQ-Swap-Actions

### Ursache

`buildHqIceSwapRunActions` erzeugt für mehrere unrezzte HQ-ICE verschiedene
Payloads, deren `actionId` denselben Variantenvertrag trägt. `makeActionId`
kennt zwar `targetIceIndex`, die Action setzt bislang aber nur `targetIceId`
und `iceIndex`. Der verdeckte Karten-Identifier darf nicht zum öffentlichen
Diskriminator werden; die öffentliche Serverposition ist ausreichend.

### Arbeit

- HQ-Swap-Payload um den bereits action-ID-fähigen, side-sicheren
  `targetIceIndex` ergänzen und die Runtime-Nutzung konsistent halten;
- am zentralen LegalActions-Ausgang eine deterministische Eindeutigkeits-
  Invariante etablieren oder den gleichwertigen vorhandenen Grenzvertrag
  erweitern;
- Engine-Tests für zwei Zielvarianten, verschiedene IDs, exakte Zielauswahl
  und Hidden-Info-Vertrag ergänzen;
- den Baseline-Repro Seed 09 bis über StateVersion 43 prüfen.

### Checks

```text
corepack pnpm --filter @netgrid/engine typecheck
corepack pnpm --filter @netgrid/engine test -- <paketnahe Testdateien>
git diff --check
```

### Done-Gate

- zwei HQ-Ziele erzeugen zwei deterministische, eindeutige Action-IDs;
- jede Action wendet exakt ihr ausgewiesenes Ziel an;
- keine verdeckte Kartenidentität wird in side-sichere Verträge verschoben;
- zentrale Duplikaterkennung und fokussierter Baseline-Repro sind grün.

### Commit

`fix(engine): make hq ice swap actions unique`

## P2 – Empty-R&D-Funding und exakte Defense-Support-Origin

### Ursache

Der Economy-Funding-Pfad prüft unmittelbaren Liquiditätsgewinn und
Reliability, aber nicht dieselbe Payload-Ausführbarkeit wie seine
Nichtproduktivitätsdisposition. Dadurch wird `Night Shift` bei leerem R&D
zugleich unproduktiv und als Defense-Funding-Head produktiv. Der spezialisierte
TurnPlanner-Adapter bindet den Head zusätzlich nur über `moduleId` an eine
beliebige Economy-Route statt an die exakte Supportinstanz des Defense-Needs.

### Arbeit

- eine gemeinsame planlokale Payload-Ausführbarkeitsprüfung verwenden und
  in allen Economy-/Defense-Funding-Kandidaten anwenden;
- Defense-Funding-Nodes an die exakte Economy-Supportinstanz und ihren
  konkreten Parent-Need binden;
- spezialisierte Routen nur über diese exakte Instanz rematerialisieren und
  bei fehlender Bindung fail-closed keinen Head erzeugen;
- Tests sichern Owner, Root/Leaf, Step/Route, `actionId` und Executor;
- der Baseline-Repro Seed 05 wird bis über StateVersion 189 geprüft und muss
  die produktive Scorelinie statt des unzulässigen Night-Shift-Konflikts
  fortsetzen.

### Checks

```text
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai test -- <paketnahe Testdateien>
corepack pnpm check:ai-source-structure
corepack pnpm check:package-boundaries
git diff --check
```

### Done-Gate

- Empty-R&D-Draw-Operations sind dispositioniert und niemals produktive
  Funding-Heads;
- andere vollständig ausführbare Funding-Actions bleiben verfügbar;
- Defense bleibt Root, exakter Economy-Support bleibt Leaf;
- keine generische Economy-Instanz, zweite Autorität oder breite
  Rematerialisierung entsteht;
- Seed-05-Repro und Ownership-Regressionsprüfungen sind grün.

### Commit

`fix(ai): bind defense funding to executable economy support`

## P3 – Gesamtverifikation und Wissenspflege

### Arbeit

- relevante Engine- und AI-Gesamtläufe, Typechecks, Struktur- und
  Boundary-Gates ausführen;
- den 60-Spiele-Standardlauf erneut erzeugen und mit der formalen Baseline
  vergleichen;
- Hard Gates und die bereits als vorläufig markierten Verhaltenswerte prüfen;
- Review, AI-Status und Monatslog mit Ursache, Fix, Evidence und Restpunkten
  aktualisieren.

### Checks

```text
corepack pnpm test:ai:shards
corepack pnpm --filter @netgrid/engine test
corepack pnpm typecheck
corepack pnpm check:package-boundaries
corepack pnpm check:ai-source-structure
corepack pnpm check:ai
corepack pnpm benchmark:ai-behavior
git diff --check
```

### Done-Gate

- beide Repros und alle relevanten technischen Gates sind grün;
- der Standardlauf endet ohne die zwei Ownership-Abbrüche und ohne neue harte
  Fehler;
- aktuelle Evidence und verbleibende qualitative Befunde sind dokumentiert;
- Arbeitsbranch ist sauber und integrationsbereit.

### Commit

`docs(ai): verify baseline ownership fixes`

### Ausführungsergebnis

- Die beiden Repros sind über ihre früheren Abbruchstellen hinaus grün; der
  60-Spiele-Lauf enthält null IllegalActions und null Runtimefehler.
- AI: 4.481/4.481 Tests im seriellen Drei-Shard-Stabilitätspfad grün. Der
  parallele Standardpfad hatte ausschließlich einen lastabhängigen
  30-Sekunden-Timeout bei 4.480/4.481 bestandenen Tests; der fokussierte Test
  und der serielle Shard waren grün.
- Engine: 1.838/1.838 Tests grün; die neue zentrale Invariante deckte neben
  Singapore weitere fehlende side-sichere Variantenfelder auf. `targetServerId`,
  `counterType` und `decision` sind nun ebenfalls ID-Diskriminatoren.
- Workspace-Typecheck, Package-Boundaries, AI-Hint-Metadaten, AI-/Engine-
  Source-Structure und Diff-Gate sind grün.
- Der Standardlauf bleibt wegen eines klassifizierten 480-Aktionen-Tails
  `attention_required`. Der isolierte 650-Aktionen-Kontrolllauf endet nach
  485 Aktionen regulär durch Corp-Deckout und enthält keine technischen
  Fehler. Die bekannte Klasse `runner_late_gain_credit_real_reserve` bleibt
  außerhalb der beiden Ownership-Fixes ein eigener Spielstärke-Restpunkt.

Damit ist der Ownership-Done-Gate erfüllt. Der Report übernimmt den
Action-Limit-Restpunkt ausdrücklich; eine Schwellen- oder Runner-Strategie-
Änderung wäre ein separates Paket und wurde nicht still in diesen Prozess
aufgenommen.

## Worktree-, Git- und Integrationsvertrag

- Umsetzung ausschließlich in
  `C:\Projekte\NETGRID_AI_BASELINE_OWNERSHIP_FIXES`;
- Branch `codex/ai-baseline-ownership-fixes`;
- Hauptworkspace bis zum finalen lokalen Merge nur für read-only Statuschecks;
- vor dem Merge aktuelles `main` in den Arbeitsbranch integrieren;
- nach der Integration die finalen risikoadäquaten Gates wiederholen;
- anschließend bevorzugt Fast-Forward lokal nach `main` mergen;
- `main` verifizieren, erst dann Worktree entfernen;
- Entfernung in Git und Dateisystem prüfen, danach Branch mit `git branch -d`
  löschen;
- keine Pushes und kein Pull Request;
- Goal erst nach nachgewiesenem Merge und Cleanup als `complete` markieren.

## Controller-Prompt

```text
/Goal Arbeite P0 bis P3 dieses Prozessartefakts vollständig und sequenziell
ab. Arbeite ausschließlich im benannten Worktree und committe jedes bestandene
Paket. Bei doppelter LegalAction-ID, ungenauer Planinstanzbindung,
Ownership-Konflikt, Hidden-Info-Abweichung oder Fallback stoppe fail-closed im
aktuellen Paket und behebe die Ursache beim fachlichen Owner. Integriere danach
aktuelles main defensiv, wiederhole die finalen Gates, merge lokal nach main,
verifiziere main sowie Worktree-/Branch-Cleanup und markiere erst dann das Goal
als complete. Kein Push und kein PR.
```

## Abschlusskriterien

- P0 bis P3 sind jeweils mit bestandenem Done-Gate committed;
- Singapore-HQ-Swap-Actions sind eindeutig und side-safe;
- Empty-R&D-Operationen erzeugen keine produktiven Funding-Heads;
- Defense-Root und exakte Economy-Support-Origin bleiben erhalten;
- Standardbaseline und technische Gates sind ohne harte Fehler grün;
- Wissensbasis und Review enthalten Ursache, Fix und Evidence;
- Arbeitsstand ist lokal nach `main` integriert;
- Worktree und Arbeitsbranch sind nachweislich entfernt;
- Goal ist `complete`.
