# Corp-Handverwertung und Opening-Rush – Worktree-Paketprozess

Status: **P0 bis P4 abgeschlossen; P5 aktiv**

Stand: 2026-07-28

Quelle:

- Nutzerbeobachtung zum ersten Corp-Zug des Matches
  `match_0c77a1fb8540644a`;
- Architekturreview der produktiven Plan-first-Runtime vom 2026-07-28;
- `docs/architecture/ai/ai-plan-layer-target-state-wip.md`;
- bestehender Shell-Traders-/Rent-I-Con-Checkpoint für denselben Match.

## Zielprüfung

Der Endzustand ist für eine automatische sequenzielle Umsetzung hinreichend
bestimmt:

1. Bekannte eigene HQ-Karten erhalten side-sicher eine nachvollziehbare
   Domainroute oder eine explizite, fachliche Nichtverwendungsdisposition.
2. Sofortige Corp-Economy-Operationen konkurrieren als reguläre
   `corp.economy`-Routen und als exakt gebundener Parent-Support gegen Draw,
   Basic Credit und nicht dringliche Entwicklung.
3. Draw berücksichtigt einen konkreten Suchbedarf, HQ-Druck und bereits
   ausführbare Kartenrouten, ohne die Plan-Ownership zu umgehen.
4. Relevante Assets und Nodes der aktiv verwendeten Corp-Decks werden
   familienweise einem vorhandenen Domainplan zugeordnet oder als enger
   Coverage-Gap ausgewiesen.
5. Frühe Rush-Gelegenheiten werden als Modus von `corp.score_agenda`
   vollständig bewertet und dürfen innerhalb eines qualifizierten,
   nicht widerlegten P4-Fensters seed-deterministisch variieren.
6. Historische Checkpoints, kontrollierte Gegenproben und Simulationen
   belegen die Verbesserung ohne Hidden-Info-, LegalAction-, Replay- oder
   StateHash-Regressions.

Arbeitsbranch:
`codex/corp-hand-utilization-opening-rush`

Arbeits-Worktree:
`C:\Projekte\NETGRID_CORP_HAND_UTILIZATION_OPENING_RUSH`

Ausgangs-`main`:
`b426e8e83d6bb8d3dd71fa7a14c9e3b4b2d31194`

## Gesamtziel

Die Corp-KI verwertet bekannte produktive HQ-Karten häufiger über ihre
fachlichen Planmodule, zieht nur für einen konkreten und kapazitätsverträglichen
Bedarf und kann in den ersten Corp-Zügen eine qualifizierte, bewusst riskante
Scoreline eröffnen. Plan-first-Ownership, side-sichere Eingaben, aktuelle
LegalActions und deterministisches Replay bleiben vollständig erhalten.

## Annahmen

- Der erste Pilot umfasst die in aktuellen Corp-Checkpoints,
  Behavior-Baseline-Slots und lokal aktiv verwendeten Corp-Decks vorkommenden
  Karten. Eine Vollfreischaltung des gesamten Kartenpools ist kein
  stillschweigender Bestandteil dieses Prozesses.
- Eine bekannte HQ-Karte darf mehrere fachliche Beiträge besitzen, aber jede
  konkrete LegalAction hat genau einen ausführenden Domainowner oder eine
  explizite Disposition.
- Handdruck verändert keine Prioritätsklasse. Er darf nur Admission,
  Readiness und den Wert innerhalb derselben validierten Klasse beeinflussen.
- Eine produktive Kartenroute und ein residenter Draw-Bedarf werden nach jeder
  ausgeführten Aktion neu bewertet; es entsteht keine unrevalidierte
  Mehraktions-Makroaktion.
- Ein Opening-Rush ist eine `corp.score_agenda`-Instanz. Economy und Defense
  bleiben exakt gebundene Supportprovider; ein Opening-Modul installiert
  weder Agenda noch ICE.
- Seed-Variation ist AI-Policy-Variation. Sie verwendet niemals
  `Math.random`, Engine-`RandomCounter` oder verdeckte Runner-Daten.

## Nicht-Ziele

- Keine globale Spielkarte-plus-X-Heuristik und kein freier Actionsieger.
- Kein generischer `corp.safe_generic_development`- oder
  `corp.play_any_asset`-Fallback.
- Keine Kartennamen-Sonderregeln im Produktivcode.
- Keine Annahme, ein nicht sichtbarer Runner-Breaker sei nicht vorhanden.
- Keine Änderung an Kartentexten, Rules Engine oder LegalActions, solange die
  vorhandenen side-sicheren Projektionen vollständig sind.
- Keine UI-, Server-, Datenbank- oder öffentliche Replay-Erweiterung.
- Kein Push, Pull Request oder Remote-Merge.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Die KI konsumiert nur Corp-PlayerView, side-gefilterte PublicEvents,
  aktuelle LegalActions und erlaubte Metadaten.
- Jede ausgeführte Aktion stammt aus der aktuellen LegalAction-Menge und wird
  nach State-Wechsel erneut materialisiert.
- Unbekannte Schutz-, Kosten- oder Effektprojektionen erlauben keine sichere
  Scoreline und keine generische Kartenentwicklung.
- P1 bis P6 bleiben lexikografisch. Handdruck, Kartenverwertung und
  Rush-Variation umgehen keine höhere Prioritätsklasse.
- Öffentliche vorbereitete Breaker, installierte Breaker, öffentliche
  Credits, Memory und Spezialzonen fließen in die bestehende
  Score-Protection-Projektion ein. Verdeckte Runner-Hand und Stack bleiben
  unberührt.
- Eine einmal angenommene Rush-Gelegenheit bleibt als residente Score-Instanz
  stabil, bis sie abgeschlossen, invalidiert oder fachlich aufgegeben wird.

## Automatische Fehlerbehandlung

- Historische Checkpoints unterscheiden `behavior_regression` von Fixture-,
  Redaction-, Replay- und Runtime-Drift.
- Kann der historische erste Zug nicht direkt capturiert werden, wird ein
  side-sicherer kontrollierter Checkpoint mit denselben entscheidungsrelevanten
  PlayerView-, LegalAction- und Planfakten erstellt. Die Abweichung wird
  dokumentiert.
- Rote Tests werden nur als explizite Ziel-Evidence committed und müssen im
  unmittelbar folgenden Umsetzungspaket geschlossen werden.
- Schlägt ein Paketcheck fehl, bleibt das Paket aktiv. Der Fehler wird eng
  behoben oder als Blocker mit Removal Condition dokumentiert.
- Follow-ups erweitern das aktive Paket nicht still.

## Sicherheitsblocker

Der Prozess stoppt ohne heuristischen Workaround, wenn:

- eine benötigte Bewertung nur aus FullState oder verdeckten Runner-Daten
  ableitbar wäre;
- LegalAction-/Engine-Projektionen für aktuelle Kosten oder Effekte fehlen und
  nicht fail-closed behandelt werden können;
- Seed-Variation nicht replay-stabil und zustandsgebunden gespeichert werden
  kann;
- zwei Module dieselbe konkrete Kartenaktion als unabhängige Owner
  beanspruchen;
- ein Konflikt mit neuer `main`-Arbeit denselben fachlichen Vertrag
  widersprüchlich definiert.

## State Machine

`P0 Prozessvertrag → P1 Evidence und Coverage-Baseline →`
`P2 sofortige Economy-Operationen → P3 Handinventar und Dispositionen →`
`P4 Verwerten-vor-Suchen → P5 Asset-/Node-Pilot →`
`P6 Opening-Rush-Varianz → P7 Gesamtverifikation und Integration`

Genau ein Paket ist aktiv. Kein Paket wird übersprungen.

## Paketfolge

### P0 – Prozessvertrag und Worktree

Ziel:
Scope, Invarianten, Paketfolge, Goal und Integrationsregeln festschreiben.

Kernartefakt:

- dieses Prozessdokument.

Checks:

- sauberer Arbeits-Worktree;
- `git diff --check`;
- vollständige Paket- und Abschlussregeln.

Done-Gate:
Prozessartefakt ist auf dem Arbeitsbranch committed.

Commit:
`docs(ai): plan corp hand utilization and opening rush`

### P1 – Historische Evidence und Karten-Coverage-Baseline

Ziel:
Den ersten Corp-Zug mit Accounts Receivable gegen Draw sowie die bereits
vorhandenen Draw-/Overflow- und Shell-Traders-Gegenfälle reproduzierbar
sichern. Für bekannte HQ-Karten der ausgewählten Pilotdecks wird sichtbar,
welche Domainroute oder Disposition aktuell existiert.

Konkrete Arbeit:

- historischen oder kontrollierten Same-State-Checkpoint für Accounts
  Receivable bei fünf Credits erstellen;
- Gegenproben für vier Credits, akute höhere Priorität, sichere
  Draw-Konversion und unvermeidbaren Last-Click-Overflow;
- internes side-sicheres Coverage-Reportmodell für bekannte Corp-HQ-Karten
  spezifizieren und die Baseline dokumentieren;
- vorhandenen D9-Shell-Traders-Checkpoint unverändert als Schutzgrenze
  ausführen.

Checks:

- fokussierte Checkpoint-Tests;
- bestehende Corp-Draw-/Overflow-Tests;
- `git diff --check`.

Done-Gate:
Die Zielabweichung ist als `behavior_regression` oder kontrollierter roter
Test belegt; grüne Sicherheitsgegenproben und Baseline-Report sind separat
erkennbar.

Commit:
`test(ai): capture corp hand utilization gaps`

### P2 – Sofortige Economy-Operationen in `corp.economy`

Ziel:
Bezahlbare und exakt projizierte Economy-Operationen als reguläre
Economy-Konversion sowie als Parent-Funding-Route besitzen.

Konkrete Arbeit:

- garantierte sofortige Liquiditäts- und gemischte Credit-/Draw-Operationen
  aus LegalAction-Projektionen ableiten;
- endliche Economy-Signale mit exakter Karteninstanz, Action-ID, Kosten,
  Handdelta und Abschlussbedingung erzeugen;
- Accounts Receivable bei fünf Credits und die Ein-Credit-Schwellenroute bei
  vier Credits schließen;
- höhere Score-, Survival-, Kill- und Schutzprioritäten erhalten.

Checks:

- fokussierte Economy-Modul- und Runtime-Tests;
- Accounts-, Efficiency-Experts- und gemischte Operation-Gegenproben, soweit
  im produktiven Karten-/LegalAction-Vertrag verfügbar;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Sofortige Economy-Operationen werden ausschließlich durch `corp.economy`
ausgeführt, ihre exakten Projektionen entscheiden gegen Basic Credit/Draw,
und P1–P3-Gegenfälle bleiben stabil.

Commit:
`feat(ai): route immediate corp economy operations`

Ergebnis:

- `convert_immediate_operation` bindet genau eine bekannte HQ-Operation an
  ihre aktuelle `LegalAction`, ihre garantierte Projektion, Kosten, Handdelta
  und den Abschluss `source_consumed`.
- `prepare_immediate_operation` verwendet bei genau einem fehlenden Credit
  ausschließlich die Engine-zertifizierte Basic-Credit-Action. Der erwartete
  Folgeschritt verwendet nur die geprüfte strategische Klassifikation einer
  reinen Burst-Economy-Operation und ihre sichtbare Kostenschwelle. Hint-Beträge
  werden ausdrücklich nicht als Sofortprojektion genutzt. Nach dem Credit wird
  der Vorlauf durch die neu erzeugte Operations-`LegalAction` ersetzt.
- Der historische D5-Checkpoint entscheidet nun mit `corp.economy` für
  Accounts Receivable. Synthetische Runtime-Gegenproben decken Accounts bei
  vier und fünf Credits, Efficiency Experts, Night Shift, exakte
  Projektionsdrift und leeres R&D ab.
- Der bestehende Protect-R&D-Checkpoint behält Night Shift als Action, erwartet
  nach der Single-Owner-Korrektur aber `corp.economy` statt
  `corp.defend_servers` als ausführenden Plan.
- Drei bereits auf unverändertem `main` rote Score-Checkpoints bleiben
  außerhalb P2 rot: `cp-74e2369-03` sowie `cp-e676-01` und `cp-e676-03`. Sie
  sind durch `corp_score_protection_assessment_unknown` blockiert und werden
  nicht als P2-Regressionsbeleg gewertet.

### P3 – Side-sicheres Handinventar und explizite Dispositionen

Ziel:
Jede bekannte HQ-Karte der Pilotdecks erhält neutrale Fakten sowie mindestens
eine Domainroute oder eine explizite Nichtverwendungsdisposition.

Konkrete Arbeit:

- `CorpHandInventoryFacts` und `CorpHandPressureAssessment` als
  autoritätslose Runtime-Fakten einführen;
- LegalAction-IDs, Projektionen, Handdelta, Duplikate und vorhandene
  Domainclaims erfassen;
- Dispositionen für `blocked_funding`, `strategic_hold`, `redundant`,
  `unsafe_current_route` und `unsupported_domain_contract` erzeugen;
- vorhandene Discard-/Keep-Bewertung schrittweise an dieselben Fakten binden,
  ohne einen zweiten Discard-Scorer zu schaffen;
- Corp-private Trace-/Testdiagnostik ohne Public-Leak ergänzen.

Checks:

- Fakten-/Dispositionstests;
- Discard-/Choice-Regressionen;
- Hidden-Info-/Redaction-Gegenprobe;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Keine Pilotkarte verschwindet diagnostisch unklassifiziert; der Faktendienst
wählt weder Plan noch Executor.

Commit:
`feat(ai): assess corp hand route coverage`

Ergebnis:

- `CorpHandInventoryFacts` erfasst ausschließlich bekannte eigene HQ-Karten
  sowie aktuelle instanzgebundene `LegalAction`-IDs, exakte Kosten-,
  Economy-, Kapazitäts- und Zielprojektionen, Handdelta und Duplikate.
- Ein expliziter Adapter projiziert die bereits vorhandenen Score-, Economy-,
  Defense-, Punish-, Ambush- und Handmanagement-Signale als Domainclaims. Der
  Faktendienst selbst besitzt weder Plan- noch Executor-Auswahl.
- Unbeanspruchte oder blockierte Karten bleiben mit
  `blocked_funding`, `strategic_hold`, `redundant`,
  `unsafe_current_route` oder `unsupported_domain_contract` diagnostisch
  sichtbar. Im historischen D5-Checkpoint besitzt jede der vier bekannten
  HQ-Karten mindestens einen Claim oder eine Disposition.
- Die vorhandene Discard-/Keep-Bewertung verwendet denselben
  Duplikat-/Handdruck-Faktenpfad nur als Evidence; es wurde kein paralleler
  Discard-Scorer eingeführt.
- Der vollständige Handinventarabschnitt erscheint nur im side-privaten
  Corp-Decision-Debug. Für Runner-Eingaben liefert der Builder keinen
  Corp-Bestand; die bestehende Replay-Perspektivenredaktion bleibt
  unverändert.
- 325 fokussierte Fakten-, Planmodul-, Plan-first-, Discard-/Choice- und
  Checkpoint-Tests sowie der AI-Typecheck sind grün.

### P4 – Plan-first-konformes Verwerten vor Suchen

Ziel:
Ein Draw mit konkretem Parent-Bedarf berücksichtigt bekannte produktive
Kartenrouten und den projizierten HQ-Verlauf.

Konkrete Arbeit:

- Draw-Admission um Parent-Zweck, Versuchsbudget, Net-Handdelta,
  Endturn-Overflow und exakte Kapazitätsfreigaben ergänzen;
- produktive Kartenrouten innerhalb derselben Prioritätsklasse durch
  begrenzten Capacity-Release-/Displacement-Wert konkurrenzfähig machen;
- keine Prioritätsklasse verändern und keine fremde Kartenaction durch das
  Handmodul besitzen;
- nach jeder Kartenaktion den residenten Draw-Need neu bewerten;
- Draw mit sicherer gleichründiger Konversion, echte Answer-Suche,
  Agenda-Flood und höhere Score-/Defense-Bedarfe als Gegenfälle erhalten.

Checks:

- Accounts-vor-Draw- und Convert-then-Draw-Checkpoints;
- volle HQ, Last-Click, Multi-Draw und Draw-then-Observe;
- bestehende Match-3bb14- und Day-Shift-Regressionen;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Unbegründetes Draw-then-Discard verliert gegen bekannte produktive
gleichklassige Routen; berechtigte Suche und konkrete Konversion bleiben
zulässig.

Commit:
`feat(ai): arbitrate corp hand conversion before draw`

Ergebnis:

- `corp-draw-admission-v1` bewertet jeden zugelassenen Corp-Draw anhand seines
  konkreten Parent-Zwecks, seiner effektiven Prioritätsklasse, des endlichen
  Versuchsbudgets, exakter Draw-/Handprojektion und des projizierten
  Endturn-Overflows.
- Nur bereits fachlich besessene, exakt projizierte Handkonversionen derselben
  Prioritätsklasse dürfen einen Draw zunächst verdrängen. Die begrenzte
  Capacity-Release-Bewertung verändert keine Prioritätsklasse und besitzt
  keine fremde Kartenaction.
- Nach einer verdrängenden Konversion wird der Draw im neuen State vollständig
  neu bewertet. Ein kontrollierter Fast-Advance-Start spielt dadurch
  Efficiency Experts aus einem vollen HQ und zieht anschließend im
  revalidierten Zustand.
- Ein zielgebundener Score-Defense-Draw mit exakt gebundener
  Same-Turn-Freigabe bleibt zugelassen. Ebenso bleibt ein einzelner,
  versuchsbegrenzter Answer-Search-Overflow möglich, wenn keine produktive
  gleichklassige Konversion existiert; größere Multi-Draw-Overflows bleiben
  gesperrt.
- Die Corp-private Debugdiagnostik weist Parent-Zweck, effektive Klasse,
  Handdelta, Overflow, verfügbare Capacity-Release-Actions und die
  Admission-Disposition aus.
- 336 fokussierte Draw-, Planmodul-, Plan-first-, historische Checkpoint- und
  kontrollierte Simulationstests sowie der AI-Typecheck sind grün.

### P5 – Asset-/Node-Domainpilot

Ziel:
Die in den Pilotdecks erkannten vollständig modellierbaren Assets und Nodes
werden familienweise vorhandenen Domainplänen zugeordnet.

Konkrete Arbeit:

- Coverage-Report nach Economy, Score-Support, Defense, Remote, Punish,
  Ambush und Utility auswerten;
- vollständig gequotete Economy-, Score- oder Defense-Familien an ihren
  bestehenden Owner anbinden;
- Install-, Rez-, Payback-, Zielserver-, Reserve- und Abschlussbedingungen
  explizit modellieren;
- nicht ausreichend beschriebene Utility-Familien als enge Follow-ups
  dokumentieren statt generisch auszuspielen.

Checks:

- mindestens je eine positive und negative Pilotkartenroute pro tatsächlich
  geänderter Familie;
- keine Doppel-Ownership;
- angrenzende Economy-, Score-, Defense-, Punish- und Ambush-Tests;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Die ausgewählten vollständig modellierbaren Assets/Nodes konkurrieren mit
konkretem Zweck; nicht modellierbare Karten sind sichtbar und fail-closed.

Commit:
`feat(ai): cover pilot corp asset domain routes`

### P6 – Qualifizierte seed-deterministische Opening-Rush-Varianz

Ziel:
`corp.score_agenda` erkennt in den ersten drei Corp-Zügen vollständige,
vertretbare Rush-Gelegenheiten und kann eine unsichere P4-Linie bewusst
annehmen oder ablehnen.

Konkrete Arbeit:

- zustandsgebundenen Opening-Scoreline-Quote mit Agenda, Zielremote, Klicks,
  Credits, Rezreserve, erstem Contest-Fenster, Schutzwissen und öffentlichen
  Runner-Gegenrouten erzeugen;
- nur `ready` oder vollständig `supportable` bewertete P4-Gelegenheiten zur
  Variation zulassen;
- risikogestufte, seed-deterministische Admission einmal pro
  Opportunity-Key durchführen und im residenten Planstatus erhalten;
- Annahme und Ablehnung side-sicher im Debug belegen;
- sichtbare vorbereitete Breaker, unbezahlbare Rezreserve, unbekannte
  Projektionen, akute Centrals und höhere Prioritäten blockieren oder
  dominieren die Variation.

Checks:

- gleiche Gelegenheit plus gleicher Seed ist stabil;
- mehrere Seeds zeigen Annahme und Ablehnung im qualifizierten Fenster;
- keine Neuverlosung nach Economy-/ICE-Head;
- öffentlicher Shell-Traders-Breaker, fehlende Reserve und unbekannte Quote
  bleiben fail-closed;
- Score-/Defense-/Economy-Supportgraph bleibt exakt;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Die KI versucht frühe Rushes in einem messbaren Anteil geeigneter Zustände,
ohne sichere Gegenbeweise oder Plancontroller zu übergehen.

Commit:
`feat(ai): vary qualified corp opening rushes`

### P7 – Kontrollierte Probespiele, Review, Integration und Cleanup

Ziel:
Gesamtverhalten, Sicherheitsverträge und Integration nachweisen.

Konkrete Arbeit:

- fokussierte historische Checkpoints und kontrollierte Zustände ausführen;
- mehrere identische Starts mit verschiedenen Seeds simulieren;
- Kartenroute vor Draw, Draw-Parent, projizierten Overflow,
  unzugeordnete Karten und Rush-Entscheidungen auswerten;
- vollständige AI-Suite und relevante Struktur-/Boundary-Gates ausführen;
- Prozessstatus, Review und Wissenslog aktualisieren;
- aktuelles `main` defensiv integrieren, final prüfen und lokal mergen;
- Worktree und gemergten Branch verifiziert entfernen.

Mindestchecks:

```powershell
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai test
corepack pnpm check:ai:full
corepack pnpm check:package-boundaries
git diff --check
```

Done-Gate:
Alle Paketcommits liegen auf dem Arbeitsbranch; verpflichtende Checks sind
grün oder als unabhängige bestehende Abweichung reproduziert; `main` enthält
den Prozess; Hauptcheckout ist sauber; Worktree-Pfad fehlt in Git und
Dateisystem; der gemergte Branch ist ohne Force gelöscht.

Commit:
`docs(ai): close corp hand utilization and opening rush`

## Verifikationsregeln

- Jedes Paket führt zuerst seine fokussierten Tests und danach den
  paketangemessenen Typecheck aus.
- Vor jedem Paketcommit läuft `git diff --check`.
- Nur paketzugehörige Dateien werden gestaged.
- Nicht ausgeführte oder zeitlimitierte Checks werden ausdrücklich als
  solche dokumentiert.
- Ein grüner Legacy-Test ersetzt keinen Plan-first-Checkpoint.
- Vollsuite und Behavior-Simulation gehören ins Abschluss-, nicht in jedes
  Zwischenpaket.

## Worktree-, Git- und Integrationsregeln

- Fachliche Arbeit erfolgt ausschließlich im Arbeits-Worktree.
- Der Hauptworkspace bleibt bis zum finalen lokalen Merge unverändert.
- Jedes abgeschlossene Paket erhält einen eigenen Commit.
- Fremde Worktrees und Branches werden weder verändert noch beendet.
- Vor dem finalen Merge wird geprüft, ob `main` weitergelaufen ist. Neue
  kompatible Intentionen werden defensiv in den Arbeitsbranch integriert.
- Der Merge nach `main` erfolgt bevorzugt per Fast-forward.
- Nach erfolgreicher Main-Verifikation wird exakt
  `C:\Projekte\NETGRID_CORP_HAND_UTILIZATION_OPENING_RUSH` als sauberer
  Arbeits-Worktree entfernt.
- Entfernung wird über `git worktree list --porcelain` und `Test-Path`
  doppelt geprüft.
- Erst danach wird
  `codex/corp-hand-utilization-opening-rush` mit `git branch -d` gelöscht.
- Kein `--force`, kein `git reset --hard`, kein Push.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess "Corp-Handverwertung und Opening-Rush" vollständig
und sequenziell von P0 bis P7 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md,
KI-Wissen-NETGRID und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_CORP_HAND_UTILIZATION_OPENING_RUSH auf Branch
codex/corp-hand-utilization-opening-rush.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung
möglich ist.
Arbeite immer nur am aktuellen Paket, führe seine Checks aus, dokumentiere
Abweichungen und committe jedes abgeschlossene Paket.
Bei einem Sicherheitsblocker stoppe, dokumentiere Ursache und Removal
Condition und umgehe ihn nicht heuristisch.
Nach P7 integriere aktuelles main defensiv, verifiziere final, merge lokal
nach main, prüfe main, entferne den sauberen Worktree, verifiziere seine
Entfernung in Git und Dateisystem und lösche den gemergten Branch ohne Force.
Markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- P0 bis P7 sind in Reihenfolge abgeschlossen und committed.
- Die Originalbeobachtungen besitzen reproduzierbare Checkpoints.
- Sofortige Economy-Operationen haben `corp.economy` als Owner.
- Handinventar und Handdruck sind autoritätslose, side-sichere Fakten.
- Draw ohne konkreten Bedarf und ohne Kapazitätsroute verliert gegen
  produktive gleichklassige Kartenrouten.
- Pilot-Assets/-Nodes besitzen fachliche Owner oder explizite Coverage-Gaps.
- Qualifizierte Opening-Rushes variieren replay-stabil, ohne sichere
  Gegenbeweise zu ignorieren.
- Main-Merge, Main-Prüfung, Worktree-Entfernung und Branch-Cleanup sind
  vollständig verifiziert.

## Paketstatus

- P0: abgeschlossen in `88c8bc8e7`
  (`docs(ai): plan corp hand utilization and opening rush`).
- P1: abgeschlossen; der D5-Checkpoint ist mit Strict-Warmup ab Decision 4
  ohne Drift capturiert. Der vollständige Warmup ab Decision 1 bleibt durch
  die historische randomisierte Central-ICE-Bindung bei StateVersion 3
  infrastrukturell blockiert. Der unveränderte Zieltest ist ausschließlich
  mit `behavior_regression` rot. Die neun angrenzenden Shell-Traders-,
  Draw-/Overflow- und Day-Shift-Gegenproben sind grün. Der Deck-Audit erfasst
  28 eindeutige Karten und weist neben der erwarteten Behavior-Regression
  zwei vorhandene Consumer-Gaps für BBS Whispering Campaign und Red Herrings
  aus.
- P2: abgeschlossen; D5, Accounts-Schwelle, Efficiency Experts und Night Shift
  sind über endliche `corp.economy`-Signale abgedeckt. Der Protect-R&D-Fall
  behält seine Action bei und folgt der neuen Single-Owner-Zuordnung. Drei
  separat gegen `main` bestätigte rote Score-Checkpoints bleiben als
  vorhandene Baseline außerhalb dieses Pakets dokumentiert.
- P3: abgeschlossen; das autoritätslose Handinventar ist an die vorhandenen
  Domainclaims und den bestehenden Keep-/Discard-Pfad angebunden. Der
  historische D5-Checkpoint weist vollständige Claim-/Disposition-Coverage
  für alle vier bekannten HQ-Karten nach.
- P4: abgeschlossen; gleichklassige exakte Handkonversionen verdrängen einen
  kapazitätsrelevanten Draw nur bis zur nächsten State-Revalidierung.
  Zielgebundene Score-Defense- und begrenzte echte Answer-Suchen bleiben
  erhalten.
- P5: aktiv.
