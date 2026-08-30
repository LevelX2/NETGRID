# KI-Selbstspielzyklus 015 – bekannte Remote-Gefahren und Score-Stagnation

Stand: 2026-08-20  
Status: fünf generische Ursachen behoben; drei finale Seeds vollständig
auditiert; reproduzierbare Corp-Score-Stagnation als strategischer Verdacht
gespeichert

## Reproduktionsvertrag

- Auswahlseed: `c10f77c2741245b7925db251f4d1c8ba`
- Runner: **Inside Forgery Loop**, 45 Karten, `fnv1a:402af487`
- Corp: **Proteus Korp – Hidden Node & Region Trap**, 45 Karten und
  21 Agendapunkte, `fnv1a:78faa278`
- Spielseeds:
  - `selfplay-015-28e3a9e1c1e6a0baafe764472f72d0d9`
  - `selfplay-015-cfca4d57ca7f9af5003a8bb2fb5d3c80`
  - `selfplay-015-5af6d5cca899165f700f5374e7c5dd8f`
- harte KI, Detailtrace, `rules_match`, moderner offener Trace-Vertrag

Alle Ausgangs-, Zwischen- und Abschlussläufe liegen in der fortgeschriebenen
isolierten SQLite-Datenbank des Worktrees. Die Datenbank wurde nicht zwischen
den Replays geleert. Analyse und Reproduktion verwendeten ausschließlich die
lokale read-only Maintenance-Analyse-API.

## Ergebnis wie im Programm

| Partie | Standarddecks                                                              |            Endergebnis | Agendapunkte | Niederlage   | Entscheidungen |
| ------ | -------------------------------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Inside Forgery Loop** gegen **Proteus Korp – Hidden Node & Region Trap** | Runner **10 – 0** Corp |      **8:0** | Agendapunkte |            247 |
| Seed 2 | **Inside Forgery Loop** gegen **Proteus Korp – Hidden Node & Region Trap** | Runner **10 – 0** Corp |      **7:0** | Agendapunkte |            258 |
| Seed 3 | **Inside Forgery Loop** gegen **Proteus Korp – Hidden Node & Region Trap** | Runner **10 – 0** Corp |      **9:0** | Agendapunkte |            128 |

Die finalen Match-IDs sind `match_e95fa67a803b0558`,
`match_735d9780ff057a8d` und `match_6a60206b339987ef`.

Der letzte Kampagnenkontinuitätsfix verändert die Suffixe erwartbar: Seed 1
divergiert in D104 nur bei der Instanzwahl einer doppelten WuTech Mem Chip,
Seed 2 in D44 zwischen Basis-Credit und Kartenziehen und Seed 3 in D48 durch
Jack ’n’ Joe. Keine Divergenz erzeugt einen Diagnoseflag. Gewinner und
Endgrund bleiben in allen drei Seeds unverändert.

## Vollständiger Decision-Denominator

Alle 633 finalen Entscheidungen wurden seitenweise und genau einmal geladen:

- Seed 1: 247/247, Ereignisse 248 einschließlich Terminal;
- Seed 2: 258/258, Ereignisse 259 einschließlich Terminal;
- Seed 3: 128/128, Ereignisse 129 einschließlich Terminal;
- keine Lücke, kein Duplikat, Fallback, Timeout, unbekannter Plan,
  Coveragefehler, Auswahlmismatch oder Engine-Rejection;
- vollständige historische LegalActions, Engine-Evidence, actor-private
  Analysesnapshots und Checkpoint-Captures;
- 39 Runstarts, davon 29 erfolgreich; zehn gestohlene und keine von der Corp
  gescorte Agenda.

## Behobene Findings

### SP-077 – terminaler Zugriff gewährte nach tödlichem Effekt noch Belohnungen

Ein On-Access-Effekt konnte die Partie bereits beenden, während der
Access-Lifecycle anschließend noch verzögerte Agenda-Belohnungen abwickelte.
Die Engine beendet den Zugriff nun unmittelbar nach einem terminalen Effekt.
Ein Engine-Regressionsfall kombiniert einen tödlichen Agenda-Zugriff mit der
verzögerten Belohnung und sichert, dass nach dem Terminal keine Zustandsprämie
mehr entsteht.

### SP-078 – bekannte Agenda-Zugriffskosten und Zugriffsschaden gingen verloren

Engine-zertifizierte Steal-Kosten erreichten den AI-DTO nicht vollständig.
Zusätzlich wurde der bei einem früheren Zugriff beobachtete Schaden einer
bekannten Remote-Agenda bei späteren Runs nicht gegen aktuelle Hand und
verbleibende Prävention gerechnet. Der generische bekannte-Remote-Vertrag
behält nun beide Engine-/Eventfakten, bindet sie an Server, Position und
Quellereignis und unterscheidet bezahlbar, noch zu finanzieren und aktuell
nicht überlebbar.

### SP-079 – bekannte Remote wurde erneut als unbekanntes Informationsziel behandelt

Eine weiterhin bekannte und positionsstabile verdeckte Remote-Karte konnte
parallel wieder ein Informationsvorbereitungsprojekt auslösen. Die
Informationsroute bleibt jetzt auf tatsächlich unbekannte oder nachweislich
geänderte Positionen beschränkt. Die bestehende Contest-/Access-Bewertung
behält die Entscheidungshoheit; es entsteht kein Karten-Sonderplan.

### SP-080 – Run-Aktion verbrauchte eine Handkarte außerhalb der Überlebensquote

Eine Event-basierte Run-Aktion konnte eine Karte aus der Hand verbrauchen.
Die anschließende Zugriffsschadensquote rechnete jedoch noch mit der Hand vor
dem Event. Die Runzielbewertung zieht die von der LegalAction exakt gebundene
Quellkarte nun vor der Überlebensprüfung ab. Der persistierte Checkpoint
`cp-selfplay-015-02-run-action-hand-cost-d153` sichert denselben Plan- und
Action-Owner bei korrigierter Überlebensentscheidung.

### SP-081 – „Trash ablehnen“ galt als zerstörtes Kampagnenziel

Die Corp-Kampagnenkontinuität erkannte jedes Action-Type-Fragment `trash` als
Zerstörung ihres Zieles. Dadurch beendete auch `decline_trash` eine
Score-/Bluff-Kampagne, obwohl keine Karte den Server verließ. Eine Zerstörung
wird nun nur bei einer tatsächlichen Trash-Aktion mit exakt passender
Zielinstanz anerkannt. Ein fokussierter Regressionstest hält die Kampagne nach
einer abgelehnten Trash-Option offen.

## Gewinneranalyse

Inside Forgery Loop gewinnt nicht nur durch einen einzelnen glücklichen
Zugriff. Über die drei Seeds startet der Runner 14, 14 und 11 Runs, davon 11,
7 und 11 erfolgreich. Die bekannte-Remote-Logik wartet bei nicht
überlebbaren Zugriffseffekten, berücksichtigt zusätzliche Steal-Kosten und
setzt bekannte lukrative Zugriffe fort, sobald die Route wieder tragfähig
ist. Zehn gestohlene Agenden bei null Corp-Scores machen die wiederholte
Zentral- und Remote-Konversion zum dominanten Gewinnerverhalten.

## Verliereranalyse und Metaebene

Die Corp verliert alle drei Partien ohne eigenen Agendapunkt. Die Ursachen
sind zweistufig:

- In allen Seeds fehlen frühe vollständig zertifizierte Scorelinien. Das
  Deck benötigt für viele Agenden vier oder fünf Advances und kann eine neu
  installierte Agenda nicht bis zum nächsten Corp-Zug fertigstellen.
- Im langen zweiten Seed besitzt die Corp spät 15 bis 21 Credits und fünf bis
  sechs Agenden in HQ. Das bestehende `remote_1` enthält jedoch nur eine
  bereits gerezzte Homing Missile. Deren Trace-basierte End-Run-Wirkung wird
  in der konkreten sichtbaren Lage nicht als sicherer direkter Zugriffsschutz
  zertifiziert. Jede Agenda-Installation dort bleibt deshalb mit
  `subset_assessment_unknown` fail-closed; neue Remotes besitzen wiederum
  keinen zulässigen kurzfristigen Scoreparent.
- Die Corp nimmt dadurch wiederholt Credits, ohne sie in einen Scoreversuch
  umzusetzen. Das ist ein reales, seedübergreifendes Verlustmuster, aber noch
  kein Beweis für eine einzelne dominante LegalAction: Eine pauschale
  Freigabe langsamer, ungeschützter Agenden würde die bestehende
  Schutzarchitektur umgehen und ist durch diese Paarung nicht gerechtfertigt.

SP-082 speichert deshalb die genaue Score-Stagnation als strategischen
Verdacht. Nötige nächste Evidence sind unabhängige Deckpaarungen mit
vier-/fünffach zu avancenden Agenden sowie eine exakte mehrzügige Quote, die
Install, Schutz, Advances und erwartbaren Contest vergleicht. Erst wenn eine
solche Linie die wiederholte P6-Liquiditätsaufnahme nachweislich dominiert,
folgt ein generischer Fix.

## Architektur-, Test- und Dokumentationswirkung

- Regelterminalität bleibt allein in der Engine; die KI erhält keinen
  nachgelagerten Terminal-Workaround.
- Remote-Zugriffskosten, beobachteter Zugriffsschaden und Run-Handkosten
  bleiben Engine-/Eventfakten und werden beim bestehenden Runplan bewertet.
- Informationsvorbereitung und Kampagnenkontinuität behalten ihre bisherigen
  Owner; es entsteht weder neuer Resolver noch paralleler Plan.
- Die fokussierten Remote-, DTO-, Checkpoint-, Ambush- und
  Kampagnenkontinuitätstests laufen 20/20 grün; der Engine-Regressionsfall ist
  grün. AI- und Engine-Typechecks zeigen ausschließlich bereits bekannte,
  unabhängige Baselinefehler.
- Die bestehenden Architekturtexte beschreiben Owner-, Engine-Fakt- und
  Continuation-Grenzen bereits ausreichend; keine normative KI-Dokuänderung
  war erforderlich.

## Ablauf- und Laufzeitbeobachtung

Für den Abschluss wurden nur die nach SP-081 betroffenen drei Seeds frisch
gespielt. Decision-Seiten und Ereignishistorien wurden getrennt geladen; ein
einziger automatisierter Denominator-Pass prüfte Indizes, Terminalität und
alle Diagnoseflags. Das vermeidet wiederholte Vollabfragen derselben großen
Traces. Die auffällige Score-Stagnation wurde einmal an einem späten
repräsentativen Zustand vollständig aufgefächert und anschließend über alle
Corp-Entscheidungen aggregiert.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
