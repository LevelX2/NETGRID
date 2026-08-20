# KI-Selbstspielzyklus 034 – wiederholte Remote-Exposition mit verdeckter Gegen-Evidence

Stand: 2026-08-20
Status: drei vollständige finale Realpfad-Partien; SP-084 mit unabhängiger
Paarung verdichtet; kein generischer Fix freigegeben

## Reproduktionsvertrag

- Auswahlseed: `6fdd96e9abce4dd4b77a6efc09bb0906`
- Runner: **Redline Riot**, 45 Karten,
  `standard_standard_runner_redline_riot_1.0.0`, `fnv1a:3cf12d1d`
- Corp: **Rent to Own War Engine**, 47 Karten und 22 Agendapunkte,
  `standard_standard_corp_rent_to_own_war_engine_1.0.0`,
  `fnv1a:2b45c878`
- Spielseeds: `selfplay-034-5215b1a2105d3ebdcac616c9dac08792`,
  `selfplay-034-8908484b083ae02d444944e5b0b351d9` und
  `selfplay-034-6f42e952970b6852f438fad53f22babf`
- Ausgangsstand: `f4f86e16cd94e438691aa0a2efcd67f6d46b7fab`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Worktree-Port 8911 und der für den
Fünferblock gesetzten isolierten SQLite-Serie. Standardports und Datenbanken
des primären Checkouts blieben unangetastet.

## Ergebnis wie im Programm

| Partie | Endergebnis | Agendapunkte | Ende | Entscheidungen |
| ------ | ----------: | ------------: | ---- | --------------: |
| Seed 1 | Runner **10 – 0** Corp | **7:0** | Agendapunkte | 233 |
| Seed 2 | Runner **10 – 0** Corp | **10:0** | Agendapunkte | 212 |
| Seed 3 | Runner **10 – 3** Corp | **9:3** | Agendapunkte | 174 |

Finale Match-IDs und StateHashes:
`match_155ccb3595f7d83b` / `fnv1a:cf326a45`,
`match_ff8ce87a9921e641` / `fnv1a:e7a0ce0e` und
`match_cb1e188058655240` / `fnv1a:119b231c`.

## Vollständiger Decision-Denominator

619/619 Entscheidungen und Traces sind genau einmal vorhanden: 233, 212 und
174, ausschließlich `ai-decision-trace-v2`. Die getrennten Eventpässe
enthalten 234, 213 und 175 Events einschließlich Terminalzustand.
`FLAGS=0`: keine Lücken, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections oder fehlenden Auditsektionen.

611 Entscheidungen sind unter dem sichtbaren Zustand plausibel. Acht
Corp-Entscheidungen in Seed 2 sind als zusammenhängende
Score-Expositionsfenster prüfbedürftig: D41–D42, D110–D111, D133/D156 und
D202/D204. Alle acht Entscheidungen sind legal, plan-first und beim exakten
`corp.score_agenda`-Owner gebunden. Prüfbedürftig ist die wiederholte
Zertifizierung derselben Remote, nicht eine technische Ausführungslücke.

Die Serie enthält 25 Runstarts, 18 erfolgreiche Runs, elf Agenda-Steals und
einen Corp-Score.

## Findings und Clusterkorrelation

### SP-084 – vier reife Scorelinien gehen in Seed 2 verloren

Seed 2 installiert vier Agenden in `remote_1` und beginnt jeweils einen
gebundenen Advance-Pfad. Die Agenda-Installationen werden als
`corp_engine_certified_mature_remote_score_install:remote_1` geführt; die
Folgezüge gehören zu `corp_funded_protected_score_advance` oder der reifen
Advance-Route. Der Runner stiehlt trotzdem alle vier Agenden unmittelbar aus
diesem Server.

Der Befund ist nicht als vierfach bewiesener Corp-Fehler lesbar. Beim ersten
Contest erzeugt die verdeckte Handkarte **All-nighter** den zusätzlichen
Runweg; nach dem Rez von **Filter** bezahlt der Runner exakt zwei Credits und
erreicht die Agenda mit null Credits. Beim letzten Contest startet D206
**Inside Job**, überspringt die äußere ICE-Schicht und bezahlt anschließend
ebenfalls exakt zwei Credits für **Filter**. Diese privaten Karten durfte die
Corp bei ihrer vorherigen Auswahl nicht side-sicher kennen. Die beiden
mittleren Zugriffe waren dagegen normale Runs mit öffentlich ausreichender
Liquidität und halten den bestehenden Expositionsverdacht offen.

Damit verdichtet die unabhängige Paarung SP-084 und SP-006, ohne bereits eine
allgemeine Scoretempo-Grenze zu beweisen. Ein Fix müsste öffentliche
Rig-Abdeckung und Runner-Liquidität vollständig quoten, dürfte aber weder
verdeckte Events vorwegnehmen noch erfolgreiche schnelle Scorefenster
pauschal sperren.

### Gegen-Evidence zu einem pauschalen Score-Stau

Seed 3 belegt die funktionierende Gegenroute desselben Corp-Decks. D75
installiert **Corporate War** über `corp.score_agenda`; D76 spielt unter
demselben Plan **Project Consultants**, D77 löst die Engine-Choice aus und
D78 scoret die nun vierfach avancierte Agenda für drei Punkte. Action-ID,
Executor und Planinstanz bleiben über die gesamte Sequenz korrekt gebunden.

Seed 2 versucht wiederholt zu scoren und scheitert an Contests; Seed 3
konvertiert sofort. Die drei Nullpunkte aus den ersten beiden Spielen dürfen
daher nicht automatisch als weiterer langsamer Score-Stau nach SP-082
gezählt werden. Sie sind Gegen-Evidence gegen eine rein ergebnisbasierte
Klassifikation dieses Clusters.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Der Runner stiehlt schon in D45 und D47 zwei Agenden aus R&D und
beendet die Partie nach sieben Runs, vier erfolgreichen Zugriffen und drei
Steals. Die Corp entwickelt Defense und Punish-Infrastruktur, erreicht aber
keinen stabilen Scorehorizont. Der frühe doppelte Zentralzugriff prägt die
Partie stark; ein konkret dominanter alternativer Corp-Zug ist im
LegalAction-Vergleich nicht belegt.

**Seed 2:** Der Runner gewinnt nach elf Runs, neun erfolgreichen Zugriffen
und vier Remote-Steals 10:0. Die Corp erzeugt vier echte Scorepläne; zwei
gehen gegen normale finanzierte Runs verloren, zwei gegen zuvor verdeckte
taktische Run-Events. Das Ergebnis zeigt eine wiederholte, aber nicht
einheitlich verursachte Exposition.

**Seed 3:** Die Corp scoret D75–D78 korrekt drei Punkte, bevor der Runner mit
fünf erfolgreichen von sieben Runs und vier Steals auf neun Punkte kommt.
Späte geringe Corp-Liquidität und Zentralzugriffe erklären den Verlust
besser als ein fehlender Score-Owner.

Über die Serie gewinnt der Runner 3:0. Das klare Matchup-Ergebnis ist kein
Beweis für einen pauschalen Corp-Fehler: Zentralvarianz, öffentlich
finanzierbare Contests und verdeckte Run-Events tragen unterschiedlich zu den
drei Verlusten bei.

## Verifikation und Abschlussentscheidung

- 619/619 Entscheidungen und 622 Events vollständig analysiert;
- alle drei Terminalzustände und StateHashes persistiert;
- acht Score-Expositionsentscheidungen einschließlich LegalActions,
  Planbindung, Runner-Liquidität und verdeckter Run-Events geprüft;
- SP-084/SP-006 mit unabhängiger Paarung und Gegen-Evidence verdichtet;
- SP-082 gegen eine rein ergebnisbasierte Erweiterung abgegrenzt;
- kein Fix: Ein generischer, side-sicherer Alternativenvergleich ist noch
  nicht vollständig belegt.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
