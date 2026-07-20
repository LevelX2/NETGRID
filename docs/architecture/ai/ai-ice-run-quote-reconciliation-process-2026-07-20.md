# ICE-Run-Quote-Reconciliation für die Runner-KI

Status: aktiv – Paket `IRQR-1` in Arbeit

## Quelle und Zielprüfung

Die vollständige Abfrage aller 116 spielbaren ICE verglich tatsächliche
Encounter-Auflösung, den side-sicheren `effectiveRunQuote` im
Runner-`PlayerView` und die produktiven Runner-Consumer. 64 ICE besitzen
Sondermechaniken. Gefunden wurden öffentliche, deterministisch berechenbare
Abweichungen sowie getrennte bedingte Gegner- und Zufallseffekte.

Die Vorgabe ist für die automatische Umsetzung präzise genug: bekannte und
öffentliche Fakten werden vor dem Run exakt abgebildet; echte Corp-Wahl und
Zufall werden als sichtbare Konditionalität modelliert, nicht als erfundene
Gewissheit.

## Gesamtziel

Die Runner-KI verwendet für bekannte, gerezzte ICE dieselben öffentlichen
Run-Fakten wie die Engine bei der tatsächlichen Encounter-Auflösung. Sie
berechnet Zugang, Break-, Trace-, Zahlungs- und Runstart-Kosten daraus
konsistent und unterscheidet garantierten Zugang von gegnerabhängigen oder
probabilistischen Routen, ohne Tags, Schaden oder unbekannte ICE pauschal zu
verbieten.

## Annahmen und Nicht-Ziele

- Die Engine bleibt die einzige Regelautorität; die KI wählt ausschließlich
  bestehende `LegalActions`.
- Runner-Entscheidungen nutzen nur Runner-`PlayerView`, side-sichere
  `PublicEvents`, sichtbare LegalActions und erlaubte Metadaten.
- Öffentliche Rez-Entscheidungen, sichtbare ICE-Stärke, Subtypen, Zähler und
  Corp-Credits dürfen verwendet werden; verdeckte Kartenidentitäten,
  gegnerische Hand und Deckreihenfolge bleiben ausgeschlossen.
- Ein terminaler Agenda-Zugriff darf nach dem Gewinn irrelevante Nachteile
  akzeptieren. Effekte vor dem Zugriff, die den Zugang beenden oder einen
  Flatline verursachen können, bleiben entscheidungsrelevant.
- Keine Änderung von Kartentext, Engine-Legalität, Zufallsquelle oder
  Trace-Regeln; keine globale Neugewichtung von Tags, Schaden oder
  Programmverlust; keine pauschale Sperre für konditionale Runs, unbekannte
  ICE oder wiederholte Central-Runs; keine neue Ersatzruntime und keine
  Remote-Integration.

## Controller-Invarianten

1. Für öffentlich bekannte, gerezzte ICE stimmen `effectiveRunQuote` und
   effektive Encounter-Subroutinen hinsichtlich Anzahl, Typ, Betrag,
   Trace-Basis und öffentlicher Begrenzungen überein.
2. Sichtbare Alternativen werden als Alternativen bewertet: Breaken,
   Bezahlen, Trace-Vermeidung, bewusste Akzeptanz und Zugriff nach einem
   Sieg werden nicht fälschlich addiert.
3. Sicherer ETR erzeugt keinen garantierten Zugang; möglicher Gegner- oder
   Zufallseffekt wird als konditional ausgewiesen.
4. Neue sichtbare Engine-Fakten dürfen eine Revalidierung auslösen. Die KI
   darf dafür keine verdeckten Fakten antizipieren.
5. PlayerView, Debug, Replay und öffentliche Events bleiben frei von
   verdeckten Kartendaten und internen Engine-Details.

## Sicherheitsblocker und Fehlerbehandlung

Der Prozess stoppt bei einem erforderlichen Hidden-Info-Zugriff, einer
Änderung der Rules-Engine-Legalität, nicht deterministischem Replay oder
einem PlayerView-/PublicEvent-Leak. Rote Pakettests werden im selben Paket an
der gemeinsamen fachlichen Quelle behoben. Eine reine Kennzahlverbesserung
ohne nachvollziehbare Regelparität ist kein Done-Gate.

## State Machine

`preflight -> irqr_0_process_and_matrix -> irqr_1_public_quote_parity -> irqr_2_runner_consumer_semantics -> irqr_3_conditional_and_random_effects -> irqr_4_final_evidence -> main_merge -> cleanup -> complete`

Genau ein Paket ist aktiv. Jedes Paket endet mit fokussierten Checks,
`git diff --check`, einem eigenen Commit und einem sauberen Worktree.

## Paketfolge

| Paket | Ziel | Done-Gate | Commit |
| --- | --- | --- | --- |
| `IRQR-0` | Prozessartefakt und Testmatrix | Scope, Nicht-Ziele, Kandidatenfamilien und Checks dokumentiert; Worktree sauber | `docs(ai): define ice run quote reconciliation` |
| `IRQR-1` | Öffentliche Quote-Parität | Variable ETR, relative Damage-/Trace-Subroutinen, Homing-Missile-X und Pocket-VR-Trace-Credits side-sicher und encounter-paritätisch quotiert | `fix(engine): quote public dynamic ice effects` |
| `IRQR-2` | Sichtbare Runner-Semantik | ETR-/Secret-ETR, Kreditverlust, Pay-or-Trash, Coyote, Viral 15 und bekannte Runstart-Schäden fließen differenziert in Zugang, Budget und Alternativen ein | `fix(ai): evaluate visible ice run effects` |
| `IRQR-3` | Bedingte und zufällige Effekte | Iceberg/Riddler, Brain Drain, Roadblock, Vacuum Link, Positionswechsel und Corp-Credit-Folgen erzeugen nur begründete konditionale Risiko-/Kostenpfade | `feat(ai): model conditional ice run risks` |
| `IRQR-4` | Evidenz und Abschluss | Familienregressionen, AI-Gates, Hidden-Info-Checks und vergleichbarer Baseline-Lauf grün; Review und Wissenspflege aktualisiert | `test(ai): verify ice run quote reconciliation` |

### IRQR-1: Öffentliche Quote-Parität

**Problem:** Der Encounter ergänzt öffentlich bekannte Subroutinen und Werte,
während `visibleEffectiveIceRunQuote` nur einen Teil davon enthält.

**Familien:** Food Fight, Gatekeeper und Sandstorm; Bug Zapper, Dog Pile und
Mastermind; Hunting Pack; Homing Missile; Pocket Virtual Reality.

**Maßnahme:** Die projektierten effektiven Subroutinen verwenden dieselben
öffentlichen Ableitungen wie die Encounter-Ausführung. Öffentliche
Begrenzungen und temporäre Trace-Credits erhalten ausdrücklich typisierte,
side-sichere Quote-Felder. Interne `variableIceState`-Strukturen und
verdeckte Daten werden nicht exportiert.

**Nebenwirkungen:** Keine Änderung an Rez-, Trace- oder Break-Legalität.
Unreztes und unbekanntes ICE bleibt konditional.

### IRQR-2: Sichtbare Runner-Semantik

**Problem:** Mehrere im Quote sichtbare Sondertypen werden als harmlos
behandelt oder ihre günstigste legale Alternative wird übersehen.

**Familien:** Puzzle; Too Many Doors; Simple Sentry ICE und Simple Taxing
Barrier ICE; Washed-Up Solo Construct; Coyote; Viral 15; Baskerville,
Cerberus und Mastiff.

**Maßnahme:** Die gemeinsame Pfad-/Encounter-Analyse erhält eine vollständige
sichtbare Effektklassifikation mit Zugangswirkung, Budgetdelta, optionaler
Zahlung, Runstart-Schaden und verbleibendem Rückzugswert. Unterschiedliche
Effekte werden nicht zu einer pauschalen Gefahr zusammengezogen.

**Nebenwirkungen:** Ein gewinnender Zugriff bleibt gegenüber nachgelagerten
Nachteilen möglich. Programmverlust, Schaden und Tags erhalten keine neue
globale harte Sperre.

### IRQR-3: Bedingte und zufällige Effekte

**Problem:** Manche Karten ändern den Weg erst durch Corp-Wahl oder
Zufallsausgang; sie dürfen weder als sicher noch als unsichtbar gelten.

**Familien:** Iceberg und Riddler; Brain Drain; Roadblock; Vacuum Link;
Glacier, Mobile Barricade und Walking Wall; Simple Code Gate ICE und Gate.

**Maßnahme:** Die bestehende `RunRouteQuote` führt die sichtbare bedingte
Abweichung mit Quelle, maximaler oder erwarteter Kostenwirkung und einem
Revalidierungspunkt. Automatische sichere Corp-Ressourcenwirkung wird exakt
angesetzt; echte Wahl und Zufall bleiben ausdrücklich konditional.

**Nebenwirkungen:** Die Corp erhält keine pauschal optimale imaginierte
Gegenlinie. Der Runner verliert keine berechtigten Probe- oder Gewinnruns.

### IRQR-4: Evidenz und Abschluss

Neben den fokussierten Engine-/AI-Tests werden vollständige AI-Shards,
AI-Typecheck, Source-Structure-, Contract- und Hidden-Info-Gates ausgeführt.
Der AI-Behavior-Baselinevergleich verwendet unveränderte Konfiguration und
wird nur als vergleichbar akzeptiert. Wiederverwendbare Ergebnisse kommen in
einen Final Review und das Monatslog.

## Verifikationsregeln

- Pro Kartenfamilie mindestens eine Quote-Paritätsprobe und eine
  Entscheidungs- oder Pfadprobe.
- Alle neuen PlayerView-Felder erhalten Redaktions- und Hidden-Info-Proben.
- Paketnah: betroffene Engine-/AI-Vitest-Dateien, AI-Typecheck und
  `git diff --check`.
- Final: `corepack pnpm test:ai:shards`,
  `corepack pnpm check:ai-source-structure`, `corepack pnpm test:contracts`,
  relevante Hidden-Info-Tests und ein vergleichbarer Baseline-Lauf.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_ICE_RUN_QUOTE_RECONCILIATION`
- Branch: `codex/ai-ice-run-quote-reconciliation`
- Hauptworkspace: `C:\Projekte\NETGRID` auf `main`, ausschließlich für den
  finalen lokalen Merge.
- Jeder Paketabschluss wird einzeln committed. Vor dem finalen Merge wird
  das dann aktuelle `main` defensiv integriert und die betroffenen Checks
  werden wiederholt.
- Danach wird lokal nach `main` gemergt, der Worktree doppelt verifiziert
  entfernt und der gemergte Branch mit `git branch -d` gelöscht.

## /Goal

`/Goal Arbeite den ICE-Run-Quote-Reconciliation-Prozess vollständig und
sequenziell von IRQR-0 bis IRQR-4 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md,
packages/engine/AGENTS.md, packages/ai/AGENTS.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_ICE_RUN_QUOTE_RECONCILIATION
auf Branch codex/ai-ice-run-quote-reconciliation. Nutze den Hauptworkspace
nur für den finalen Merge. Arbeite immer nur am aktuellen Paket,
dokumentiere dessen Ergebnis, führe Paketchecks aus und committe jedes
abgeschlossene Paket. Keine Hidden-Info-Leaks, keine Engine-Legalitätsänderung,
keine globale Run-Sperre und keine Remote-Integration. Nach Abschluss:
aktuelles main defensiv integrieren, final verifizieren, lokal nach main
mergen, main prüfen, den sauberen Arbeits-Worktree entfernen, Entfernung in
Git und Dateisystem verifizieren, den gemergten Branch löschen und Goal erst
dann als complete markieren.`

## Fortschritt

- Preflight: abgeschlossen – Worktree und Branch sind sauber angelegt.
- `IRQR-0`: abgeschlossen – Scope, Invarianten, Testmatrix und
  Paketgrenzen sind dokumentiert.
- `IRQR-1`: aktiv.
- `IRQR-2` bis `IRQR-4`: offen.
