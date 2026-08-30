# KI-Selbstspielzyklus 036 – verdeckte Coverage und vierfache Scorekonversion

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien; keine neue klare generische
Fehlerursache; SP-082/SP-084 mit Gegen-Evidence abgegrenzt

## Reproduktionsvertrag

- Auswahlseed: `8c2e23de995840ea999c44bcaf9539a9`
- Runner: **King of the Road**, 45 Karten,
  `standard_standard_runner_adb10896_1.0.0`, `fnv1a:db67cbcc`
- Corp: **Cheap Bag of Tricks**, 58 Karten und 24 Agendapunkte,
  `standard_standard_corp_cheap_bag_tricks_1.0.0`, `fnv1a:0fa0783c`
- Spielseeds: `selfplay-036-e22b0f1112aada997af60585c61b6d63`,
  `selfplay-036-82cbdf152ce240f785436d6d261b5ae9` und
  `selfplay-036-7916308b9819b984c9be5c4b1395af22`
- Ausgangsstand: `c6d8b54f7`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Worktree-Port 8911 und der für den
Fünferblock gesetzten isolierten SQLite-Serie. Standardports und Datenbanken
des primären Checkouts blieben unangetastet.

## Ergebnis wie im Programm

| Partie |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | Runner **10 – 0** Corp |      **7:0** | Agendapunkte |            402 |
| Seed 2 | Corp **10 – 3** Runner |     **10:3** | Agendapunkte |            238 |
| Seed 3 | Runner **10 – 3** Corp |      **7:3** | Agendapunkte |            444 |

Finale Match-IDs und StateHashes:
`match_ca306913c784e90d` / `fnv1a:7d5ba509`,
`match_811731e0217208cd` / `fnv1a:529c58cb` und
`match_8a8f0e1eb809cdda` / `fnv1a:887e7dc5`.

## Vollständiger Decision-Denominator

1.084/1.084 Entscheidungen und Traces sind genau einmal vorhanden: 402,
238 und 444, ausschließlich `ai-decision-trace-v2`. Die Eventpässe enthalten
403, 239 und 445 Events einschließlich Terminalzustand. `FLAGS=0`: keine
Lücken, Duplikate, Fallbacks, Timeouts, Auswahlmismatches,
Engine-Rejections oder fehlenden Auditsektionen.

1.028 Entscheidungen liegen im regulären Prüfpfad. Die 56 benannten
Ausnahmen umfassen fünf Corp-Scores, sieben Agenda-Steals, drei Jack-outs
und die Terminalfenster. Sie wurden vollständig gegen LegalActions,
Planherkunft, sichtbare Ressourcen und Folgezustand geprüft. Die Serie
enthält 42 Runstarts, 26 erfolgreiche Runs, sieben Steals und fünf Scores.

## Findings und Clusterkorrelation

### SP-084 – verlorene Remote wird erst durch verdeckte Wild Card geöffnet

Seed 1 installiert die Corp in D82 **Main Office Relocation** hinter Banpei
und setzt zwei Advances. Zu diesem Zeitpunkt hat der Runner nur einen Credit
und keine öffentlich installierte passende Antwort. Erst D86 installiert er
die zuvor verdeckte **Wild Card**, startet D87 den Remote-Contest, bricht D88
und D89 beide Banpei-Subroutinen kostenlos und stiehlt D93 die Agenda.

Der Verlust ist kein side-sicher belegter Score-Expositionsfehler: Die Corp
durfte die private Handkarte bei D82–D84 nicht antizipieren. Der Fall
entspricht damit der begrenzenden Hidden-Event-Evidence aus Zyklus 034. Er
bleibt wertvolle Gegen-Evidence gegen eine Regel, die spätere private
Coverage rückwirkend in die Corp-Bewertung einrechnet.

### SP-082 – Cheap Bag of Tricks konvertiert vier Mehrzuglinien

Seed 2 belegt die volle Scorekompetenz des Decks. **Main Office Relocation**
wird D113 installiert, der Runner contestet und jackt D129 aus; D134/D135
und D143–D145 führen zum Score. Danach konvertiert die Corp **Corporate
Coup** D154–D178, **Project Babylon** D190–D203 und **Tycho Extension**
D224–D238. Agenda, Remote, Root und Executor bleiben jeweils beim
`corp.score_agenda`-Owner.

Seed 3 liefert eine langsamere positive Linie: **Employee Empowerment** wird
D398/D399 begonnen und D409–D412 gescort. Eine folgende Tycho Extension
bleibt unvollendet, bevor der Runner in D442/D444 zwei Agenden aus R&D
stiehlt. Seed 1 bleibt bei null Punkten, doch das einzelne Ergebnis trägt
gegenüber den fünf korrekten Scores der anderen beiden Seeds keinen neuen
klaren Score-Stau-Fix.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Der Runner gewinnt mit zehn erfolgreichen von 16 Runs und drei
Steals. Der erste Remote-Steal hängt an verdeckter Wild Card; spätere
Zentralzugriffe und die fehlende Corp-Konversion bestimmen den Rest. Eine
konkret dominierende frühere Corp-Linie ist nicht belegt.

**Seed 2:** Die Corp gewinnt 10:3. Sie stoppt beziehungsweise überlebt zwei
Remote-Contests und konvertiert vier Agenden über mehrere Züge. Der Runner
hat sieben erfolgreiche von zwölf Runs, erzielt aber nur einen Steal. Das
Spiel ist starke Gegen-Evidence gegen einen allgemeinen fehlenden
Scoreowner oder eine pauschal zu hohe Schutzschwelle.

**Seed 3:** Der Runner gewinnt 7:3. Die Corp baut eine sehr tiefe HQ-Defense
und eine lange Remote auf, scoret Employee Empowerment, verliert das Match
aber durch frühe und terminale zentrale Zugriffe. Der Runner erreicht neun
erfolgreiche von 14 Runs. Zentralvarianz und der Zeitpunkt der Agenda-Treffer
erklären den Ausgang besser als eine technische Scorelücke.

Über die Serie gewinnt der Runner 2:1. Die Resultate schwanken stark, obwohl
Decks und KI-Stand gleich bleiben. Das unterstreicht, dass ein einzelner
Remoteverlust oder Nullscore nicht ohne öffentliche Alternativquote als
Fehler klassifiziert werden darf.

## Verifikation und Abschlussentscheidung

- 1.084/1.084 Entscheidungen und 1.087 Events vollständig analysiert;
- alle Terminalzustände und StateHashes persistiert;
- sieben Steals, fünf Scores und drei Jack-outs einzeln geprüft;
- SP-084 durch eine zuvor verdeckte Coverage-Antwort abgegrenzt;
- SP-082 durch vier korrekte Mehrzug-Scores plus einen weiteren Score
  begrenzt;
- kein Fix: Die verbleibenden Auffälligkeiten tragen keinen belegten
  generischen, side-sicheren besseren Pfad.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
