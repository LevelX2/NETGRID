# KI-Selbstspielzyklus 012 – Ice Destruction gegen Shadoe Tag & Bag

Stand: 2026-08-20
Status: neun generische Ursachen im KI-, Engine-, Persistenz- und
Diagnosepfad behoben; drei finale Seeds vollständig auditiert; ein
strategischer Corp-Verdacht bleibt offen

## Reproduktionsvertrag

- Auswahlseed: `4a8d8384f5284d8ea437ba15f51a4e23`
- Runner: **Ice Destruction Runner**, 45 Karten,
  `standard_standard_runner_ice_destruction_runner_1.0.0`,
  `fnv1a:698b9883`
- Corp: **Shadoe Tag & Bag**, 48 Karten und 17 Agendapunkte,
  `standard_standard_corp_shadoe_tag_bag_1.0.0`, `fnv1a:f0c0544f`
- Spielseeds:
  - `selfplay-012-f05934ff0349efbeca11e64a3f1278b7`
  - `selfplay-012-4a042e9b889ce977981b8792b9b80355`
  - `selfplay-012-94b9769693e07e4a0dccc88b098ef025`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Alle Original-, Zwischen- und Abschlussläufe liegen in der fortgeschriebenen
isolierten SQLite-Datenbank des Worktrees. Die Datenbank wurde nicht zwischen
den Replays geleert. Die Analyse verwendete ausschließlich die lokale
read-only Maintenance-Analyse-API.

## Ergebnis wie im Programm

| Partie | Standarddecks | Endergebnis | Agendapunkte | Ende | Entscheidungen |
| --- | --- | ---: | ---: | --- | ---: |
| Seed 1 | **Ice Destruction Runner** gegen **Shadoe Tag & Bag** | Runner **10 – 2** Corp | **8:2** | Agendapunkte | 227 |
| Seed 2 | **Ice Destruction Runner** gegen **Shadoe Tag & Bag** | Runner **10 – 2** Corp | **8:2** | Agendapunkte | 420 |
| Seed 3 | **Ice Destruction Runner** gegen **Shadoe Tag & Bag** | Runner **10 – 2** Corp | **7:2** | Agendapunkte | 206 |

Die finalen Match-IDs sind `match_6f4d39695e628aa0`,
`match_7e537a30680ae0d0` und `match_f27f675ebd34e4d5`.

Die ersten vollständigen Läufe endeten Runner 10:5 nach 375 Entscheidungen,
Runner 10:0 nach 329 Entscheidungen und Corp 10:6 nach 288 Entscheidungen.
Der letzte fachliche Zentralverteidigungsfix verändert insbesondere Seed 2:
Gegenüber `match_3d52426f1bfec0ce` steigt die Laufzeit von 296 auf 420
Entscheidungen, HQ erhält vor einer weiteren R&D-Schicht seine erste
Verteidigung, und die Corp scoret zwei statt null Agendapunkte.

## Vollständiger Decision-Denominator

Alle 853 finalen Entscheidungen wurden seitenweise und genau einmal geladen:

- Seed 1: 227/227;
- Seed 2: 420/420;
- Seed 3: 206/206;
- ausschließlich `ai-decision-trace-v2`;
- vollständige historische LegalActions, Engine-Evidence, actor-private
  Analysesnapshots und Checkpoint-Captures;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection, unbekanntes Assessment oder fehlende Auditsektion;
- 52 gestartete Runs, davon 46 erfolgreich, 14 gestohlene und drei von der
  Corp gescorte Agenden.

Nach dem Resultstatistik-Fix wurden alle drei Seeds noch einmal ausgeführt.
Actionart, Planart, Seite und Zug stimmen in allen 853 Entscheidungen mit dem
unmittelbaren Vorlauf überein. Nur die zuvor falschen Resultfelder ändern sich
von 6/3, 25/3 und 15/6 auf korrekt 8/8, 27/27 und 17/11 gestartete/
erfolgreiche Runs.

## Behobene Findings

### Gezielte ICE-Entfernung blieb ohne vollständigen Planvertrag

Eine erfolgreiche HQ-Vorbereitung für **Core Command: Jettison Ice** war als
Zugriff isoliert wenig attraktiv. Die KI konnte den Folgeplan deshalb weder
an den später zu entfernenden ICE-Slot noch an Runparent und Choice binden.
Der bestehende Zentraldruckowner bewertet nun die vollständige
HQ-Erfolg-zu-ICE-Entfernung-Linie, bindet exakt Server, sichtbaren ICE-Slot,
Quelle und Entfernungskosten und lässt den Choice-Resolver nur dieses Ziel
einsetzen. Der aktive Run-Spending-Cap begrenzt gleichzeitig schon die von
der Engine veröffentlichten Pump-/Break-Aktionen. In Seed 2 werden die
gebundenen Jettison-Schritte in D48 und D103 unter
`runner.pressure_central` ausgeführt; Seed 3 belegt denselben Vertrag in D102.

### Score-Schutz-Staging verlor einen Gleichrangvergleich

Ein vorbereiteter P3-Scoreparent delegierte seine nächste Schutzschicht
korrekt, verlor bei gleicher Prioritätsklasse aber gegen eine generische
Zentralschicht. Das Defense-Modul behandelt nun auch die exakte
`score_protection_staging_install`-Route parent-first. Eine belastbar
angegriffene agendaexponierte HQ bleibt dabei ein Deadline-Fact, selbst wenn
R&D die aktuelle globale Zentralallokation gewinnt. Seed 2 materialisiert in
D254 die gebundene Schutzschicht vor dem neuen Score-Remote.

### Parallele Run-Actions duplizierten einen terminalen Coverage-Bedarf

Basic- und Event-Run auf dieselbe Matchpoint-Remote erzeugten denselben
fehlenden Agenda-Punkt-Coverage-Bedarf mehrfach. Die Runtime dedupliziert ihn
jetzt über Remote, Capability und Parent, ohne die konkreten Run-Actions oder
den Coverage-Owner zusammenzuführen. Der fokussierte Ownership-Test sichert
genau einen Need bei weiterhin getrennten Runvarianten.

### Gleichstand im Deckrennen war fälschlich nicht Runner-günstig

Am Runner-Matchpoint behandelte die EndTurn-Sicherung nur einen strikt
kleineren Corp-Deckrest als günstiges Deckrennen. Weil die Corp vor dem Runner
pflichtzieht, ist bereits Gleichstand Runner-günstig. Der Scheduler erlaubt
den eng gebundenen Kapazitätsverzicht jetzt auch bei Gleichstand, weiterhin
nur nach vollständiger Ablehnung aller freiwilligen Routen und niemals bei
leerem Corp-Deck oder unbekannten Alternativen.

### Erste Zentralabdeckung verlor gegen weitere Staffelung

In Seed 2 lagen 45 Credits, **Corporate Coup** in HQ und ein noch völlig
nacktes HQ vor. Trotzdem wählte `corp.defend_servers` in D225 eine dritte
R&D-Schicht. Der globale Allokator kannte absolute Agendaexposition und
Zugriffsdruck, aber nicht den aktuellen installierten ICE-Bestand und damit
nicht den Grenznutzen einer ersten Schicht.

Der Facts-Vertrag enthält nun symmetrisch die vorhandene ICE-Zahl je
Zentrale. Außerhalb terminaler Gefahr erhält eine agendaexponierte offene
Zentrale ihre erste wirksame Schicht, bevor die andere weiter gestaffelt wird.
Agenda-freie Zentralen erzeugen keinen Bedarf; terminale Gefahr bleibt
vorrangig. Im finalen Seed 2 schützt Hunter HQ vor dem kritischen Zug. Der
Runner muss den Zugriff finanzieren und die Corp erreicht später ihre erste
Scorelinie.

### Bewusst verschobener Basisrun verlor seinen Owner

Der erste Replay nach der Zentralreparatur erreichte D269 und scheiterte
fail-closed: Ein legaler HQ-Run war produktiv, sollte wegen der konkreten
Jettison-/Trace-Kosten aber erst nach Funding erfolgen. Der aktive
Zentraldruckplan materialisierte deshalb Economy, ließ die Basis-Run-Action
jedoch ohne ausdrückliche Disposition.

Nicht aktive Basisruns auf HQ, R&D und Archives bleiben jetzt beim jeweiligen
`runner.pressure_central`-Owner und tragen den exakten Pfad- und
Vorbereitungsgrund. Economy besitzt nur den Funding-Step. Der Regressionstest
sichert unveränderten Runowner, Economy-Executor, Action-ID und vollständige
LegalAction-Abdeckung.

### Die Resultstatistik verlor alte Zugriffsdaten

SP-024 und SP-047 verdichteten sich über die Zyklen 007, 017, 018 und 019.
Zyklus 012 isoliert die Ursache: Beim actionweisen SQLite-Laden blieben alte
Events als kompakter Kontext erhalten, aber `accessIndex` außerhalb des
80-Event-Tails ging verloren. Der terminale Snapshot zählte deshalb nur
jüngere Erstzugriffe. Zusätzlich zählte `runCount` nur Basisruns und ließ
Event-Runs trotz öffentlichem `runnerEventRun` aus.

Der kompakte Persistenzvertrag bewahrt nun genau `accessIndex` und
`runnerEventRun`; Result-Snapshot und UI zählen damit vollständige
Erstzugriffe und alle öffentlich markierten Runstarts. Das ist kein
Berichtsfallback, sondern die Reparatur der verursachenden
Persistenzprojektion.

### Ein fail-closed KI-Versuch war nach dem Abbruch nicht vollständig sichtbar

Vor und während der Reparaturen fehlte bei einer gescheiterten Planwahl oder
Engine-Anwendung ein dauerhaft gebundener Fehlversuch. Die private
Maintenance-Evidence speichert nun Phase, LegalAction-Satz, Checkpoint,
Planfehler und bei Apply-Fehlern die exakte Action-ID samt begrenzter
Engine-Diagnose. Öffentliche Antworten erhalten nur einen side-sicheren Code
und eine opake Diagnosekennung. Dadurch werden weitere Selbstspielabbrüche zu
analysierbaren Findings statt zu verlorener Evidence.

## Gewinneranalyse

**Seed 1:** Der Runner stiehlt fünf Agenden und gewinnt 8:2. Zwei frühe
Zentralzugriffe prüfen HQ und R&D; anschließend konvertieren Inside Job,
Jettison und die aufgebaute Credit-Bank wiederholt entwickelte Remotes. Die
Corp scoret Data Fort Reclamation, verliert aber vier weitere Scoreprojekte
unmittelbar nach Install/Advance.

**Seed 2:** Der Runner startet 27 erfolgreiche Runs und gewinnt 8:2 nach 420
Entscheidungen. Die reparierte Corp-Verteidigung verlängert die Partie
deutlich: HQ erhält seine erste Schicht, R&D wird gestaffelt, und ab Corp-Zug
45 entsteht eine echte Score-Remote, die in Zug 49 zwei Punkte liefert. Der
Runner finanziert dennoch wiederholte Zentral- und Remotezugriffe und stiehlt
fünf Agenden.

**Seed 3:** Der Runner gewinnt 7:2 über vier Steals. Früher R&D-Zugriff trifft
Political Coup; später öffnen Social Engineering, Inside Job und Jettison die
entwickelten Remotes. Die Corp scoret Data Fort Reclamation, kann aber zwei
weitere Agenda-Projekte nicht gegen den sichtbaren Anti-ICE-Plan halten.

## Verliereranalyse und Metaebene

1. **Matchup:** Ice Destruction Runner ist gegen eine Corp, deren Schutzwert
   überwiegend aus einzelnen ICE-Schichten entsteht, strukturell stark.
   Jettison, Inside Job und Social Engineering umgehen, entfernen oder
   entwerten genau diese Investitionen. Drei Runner-Siege belegen daher nicht
   automatisch einen pauschalen Corp-Scorefehler.
2. **Verhaltensmuster:** Shadoe Tag & Bag bleibt in allen Seeds ohne
   erfolgreichen Tag-/Damage-Abschluss. Chance Observation, Audit of Call
   Records, Punitive Counterstrike und Scorched Earth sind häufig nur
   bedingt ausführbar, weil der Runner ungetaggt bleibt. Ohne belegte
   mehrstufige Tagroute ist ein Karten- oder Decksonderfix unzulässig.
3. **Klare Verlustursache Seed 2:** Die frühere nackte-HQ-gegen-dritte-R&D-
   Schicht war ein generischer Grenznutzenfehler. Der Fix verhindert den
   unmittelbaren Gratiszugriff und verbessert Lebensdauer und Scoretempo,
   ohne HQ dauerhaft zur Kernzentrale zu erklären.
4. **Restverdacht:** Trotz 45 bis über 70 Credits hält die Corp in Seed 2
   Corporate Coup rund 14 Züge und verwendet viele Klicks auf Basiscredits,
   bevor eine ausreichend geschützte Scorelinie entsteht. Der gespeicherte
   Zustand beweist aber noch keine einzelne bessere legale Install-/Schutz-/
   Advance-Sequenz: Eine einzelne Quandary-Remote wäre gegen das sichtbare
   Runner-Rig möglicherweise sofort gefallen. SP-052 bleibt deshalb
   ausdrücklich Verdacht.

## Architektur-, Test- und Dokumentationswirkung

- `runner.pressure_central` besitzt Vorbereitung, gezielte ICE-Entfernung und
  bewusst verschobene Basisruns; Resolver wählen weder Server noch Ziel.
- `corp.defend_servers` bleibt einzige globale ICE-Allokationsautorität. Die
  Erstabdeckung ist symmetrischer Grenznutzen, keine feste HQ-, R&D- oder
  Remote-Rolle.
- Resultstatistik liest vollständig erhaltene öffentliche Persistenzfacts;
  Berichte berechnen keinen stillen Ersatzwert.
- Der private Failure-Attempt-Vertrag erweitert ausschließlich lokale
  Diagnose; PlayerViews und öffentliche Replays bleiben side-sicher.
- Das Planebenen-Konzept und der Decision-Trace-Vertrag wurden angepasst.
  `change-compass.md` und AI-README wurden geprüft; ihre bestehenden Owner-,
  Quote- und Fail-closed-Grenzen bleiben ausreichend.

## Ablauf- und Laufzeitoptimierung

Die drei Seeds wurden gemeinsam in kleinen Serverbatches ausgeführt und über
voraggregierte Auditzeilen vollständig klassifiziert. Detailbundles wurden
nur für Abweichungen, Fehlerfenster, Scoreprojekte und Loss-Driver geöffnet.
Nach dem reinen Resultstatistik-Fix genügte ein semantischer 853er
Entscheidungsvergleich statt einer zweiten vollständigen manuellen
Detailanalyse; alle drei Result-Snapshots wurden trotzdem real neu erzeugt.

## Verifikation

- finale Drei-Seed-Serie mit 853/853 auditierten Entscheidungen und null
  Coverage-, Fallback-, Timeout-, Unknown- oder Apply-Abweichungen;
- semantischer Vorher/Nachher-Vergleich 853/853 ohne geänderte Action-, Plan-,
  Seiten- oder Zugfolge nach dem Resultstatistik-Fix;
- Server: fokussierter SQLite-Tail-/Resultstatistiktest grün und
  Paket-Typecheck grün;
- Engine: fokussierte Run-Spending-Cap- und Choice-/Run-Fortsetzungstests
  grün;
- AI: fokussierte Targeted-ICE-, Score-Staging-, Zentralallokations-,
  Terminal-Coverage-, Deckrennen- und Planownership-Regressionen grün;
- angrenzender Plan-First-Lauf enthält ausschließlich die dokumentierten,
  unveränderten Baselineabweichungen; der AI-Typecheck ausschließlich die
  fünf bekannten unabhängigen Baselinefehler.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
