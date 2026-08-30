# KI-Selbstspielzyklus 019 – CardSpec-Erfolgsrun und Defense-Arbitration

Stand: 2026-08-20
Status: zwei generische KI-/Engine-Ursachen behoben; Hidden Backdoor Sabotage
gewinnt alle drei finalen Partien

## Reproduktionsvertrag

- Auswahlseed: `44e0d8afef744d6db5807e4f7b1124d0`
- Runner: **Proteus Runner - Hidden Backdoor Sabotage**, 46 Karten,
  `standard_standard_proteus_runner_hidden_sabotage_2026_05_25_1.0.0`,
  `fnv1a:d661af9c`
- Corp: **Salazar Toll Road**, 45 Karten,
  `standard_standard_corp_salazar_toll_road_1.0.0`, `fnv1a:43b9832e`
- Spielseeds:
  - `selfplay-019-7b622afdf87a451daf20aa2faa2c3471`
  - `selfplay-019-5aa0c35827a0408fb0fbd5cde498da3a`
  - `selfplay-019-918c8e24410847d9a72efb23eb2ac116`
- Ausgangsstand: `c5d5e0bb53f70eebdb720572c21245665c0aadea`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 mit unverändert persistenter
SQLite-Evidence. Die aktive Standarddeckauswahl verwendete SHA-256 über
`seed:side` modulo 24 Runner- beziehungsweise 23 Corp-Kandidaten.

## Ergebnis wie im Programm

| Partie | Standarddecks                                            |            Endergebnis | Agendapunkte | Ende           | Entscheidungen |
| ------ | -------------------------------------------------------- | ---------------------: | -----------: | -------------- | -------------: |
| Seed 1 | **Hidden Backdoor Sabotage** gegen **Salazar Toll Road** | Runner **10 – 0** Corp |      **9:0** | Agendapunkte   |            181 |
| Seed 2 | **Hidden Backdoor Sabotage** gegen **Salazar Toll Road** | Runner **10 – 0** Corp |      **3:0** | Corp-Deck leer |            388 |
| Seed 3 | **Hidden Backdoor Sabotage** gegen **Salazar Toll Road** | Runner **10 – 0** Corp |      **4:0** | Corp-Deck leer |            594 |

Die finalen Match-IDs lauten `match_8f653fd3c48a0526`,
`match_294cecc3d7918cea` und `match_387c645a776a834b`.

## Vollständiger Decision-Denominator

Alle 1.163 Entscheidungen wurden vollständig geladen und klassifiziert:

- Seed 1: Indizes 1 bis 181;
- Seed 2: Indizes 1 bis 388;
- Seed 3: Indizes 1 bis 594;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 1.163/1.163 persistiert;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection, unbekanntes Assessment oder fehlende Auditsektion;
- 52 Runstarts, acht gestohlene und keine von der Corp gescorte Agenda.

SP-047 bestätigt sich in allen drei Seeds. Die Result-Snapshots melden
9/4/0 erfolgreiche Runs, die vollständigen actor-private Snapshots enthalten
dagegen 14/11/8 unterschiedliche Run-IDs mit `successful: true` und
Accessphase. Der Zyklus führt weiterhin keinen Ersatzwert ein.

## Ursachen und generische Fixes

### SP-048 – CardSpec-Erfolgsrun verlor seine kanonische Identität

Der ursprüngliche zweite Seed `match_faafeff8bf960065` brach in D44 bei der
Credit-Subversion-Folgeaktion mit `missing_plan_module_coverage` ab. Die Engine
baute zwar die CardSpec-Primitive, ließ aber `abilityRef` und `effectRef` aus;
anschließend entfernte die positive AI-DTO-Allowlist Primitive, Effektmenge
und Zielanzahl.

Die Engine bindet erfolgreiche-Run-Primitives jetzt an die exakte kanonische
Capability. Das AI-DTO erhält nur die drei dafür notwendigen side-sicheren
Felder. Der bestehende Owner `runner.convert_run_window` validiert Quelle,
Ability, Capability-Bindung, Run, Server, Timingpunkt, Effektfamilie und
positive Menge fail-closed. Er wählt in D44 des finalen zweiten Replays die
gebundene Credit-Subversion-Action; Rootplan `runner.pressure_central`,
Executor und Action-ID bleiben erhalten.

### SP-049 – materialisierte Defense-Route erhielt eine Gegenklassifikation

Nach dem ersten Fix erreichte `match_7288cb47af7f15c9` D56 und deckte einen
zweiten, unabhängigen Schedulerkonflikt auf. `corp.defend_servers` hatte die
Olivia-Salazar-Installation auf Remote 1 materialisiert, während die
HQ-Overflow-Logik dieselbe Action als Installation auf einem reservierten
Score-Server verwarf.

Die gemeinsame Disposition-Arbitration schützt nun zuerst jede exakt vom
Defenseowner materialisierte Action und wendet erst danach die generische
Overflow-Ablehnung auf verbleibende Kandidaten an. Im finalen Replay wählt
D56 dieselbe Installation unter `corp.defend_servers`; 15 LegalActions sind
vollständig und konfliktfrei klassifiziert. Es entsteht kein neuer Plan und
keine zweite Entscheidungsautorität.

## Gewinneranalyse

**Seed 1:** Der Runner gewinnt in 181 Entscheidungen über vier Agenda-Steals
mit 9:0. 15 Runstarts und 14 belegte erfolgreiche Access-Runs erzeugen
kontinuierlichen Zentraldruck; die Corp scoret keine Agenda und kann das
schnelle Zugriffstempo nicht in eine eigene Scorelinie umwandeln.

**Seed 2:** Der Runner stiehlt zwei Agenden und gewinnt nach 388
Entscheidungen durch Corp-Deckout. D44 belegt den reparierten
Credit-Subversion-Pfad, D46 trasht eine auf HQ zugegriffene Olivia Salazar,
und D56 belegt die konfliktfrei materialisierte Defense-Installation. Danach
bleiben 13 Runs und 58 Runner-Creditaktionen ein langer, legaler
Ausdauerpfad statt eines Laufzeitabbruchs.

**Seed 3:** Der Runner stiehlt zwei Agenden und gewinnt nach 594
Entscheidungen ebenfalls durch Deckout. 24 Runstarts halten den Druck über
die volle Partie aufrecht. Die Corp verteidigt und wirtschaftet, findet aber
keine abgeschlossene Scorelinie; die vollständige Klassifikation weist keine
einzelne ignorierte dominante LegalAction aus.

## Verliereranalyse und Metaebene

1. Salazar Toll Road scoret in keinem Seed. Seed 1 ist ein schnelles
   Zugriffsresultat, Seed 2 und 3 sind lange Deckouts. Die unterschiedlichen
   Horizonte sprechen gegen einen pauschalen karten- oder
   liquiditätsspezifischen Sonderfix.
2. SP-048 lag schichtübergreifend vor: Die Engine verlor die kanonische
   Identität, das DTO entfernte den verbleibenden semantischen Vertrag, und
   der bestehende Runfensterowner kannte die Primitive nicht. Der Fix schließt
   alle drei Ursachen, statt einen Resolver- oder Kartennamen-Shortcut zu
   ergänzen.
3. SP-049 ist ein Owner-Arbitrationsfehler. Eine exakt materialisierte
   Defense-Route darf nicht durch eine nachgelagerte generische
   Handmanagementklassifikation neutralisiert werden. Die neue Reihenfolge
   bewahrt diese Schichtgrenze für alle Corp-Defense-Actions.
4. SP-047 bleibt davon unabhängig. Die erneute 9/4/0-gegen-14/11/8-Abweichung
   erhöht die Evidenz, rechtfertigt aber ohne geklärte Persistenzursache
   weiterhin keinen stillen Berichtsfallback.

## Verifikation

- drei finale Realpfad-Partien mit 1.163/1.163 auditierten Entscheidungen;
- Engine: zwei fokussierte Dateien, 32 Tests grün, Paket-Typecheck grün;
- AI-Disposition: 11 fokussierte Tests grün;
- AI-Runtime: drei fokussierte Tests grün, 254 angrenzende Tests bewusst
  nicht selektiert;
- der AI-Paket-Typecheck erreicht nach Beseitigung der lokalen Typabweichung
  nur die bereits unabhängig vorhandenen fünf Baselinefehler: eine optionale
  `appliesToRunner`-Property und vier nicht vorhandene
  CardSpec-Migrationsreports;
- Tests sichern kanonische Metadaten, DTO-Projektion, Root-/Leaf-Ownership,
  unveränderte Action-ID, 100-Prozent-Coverage, fail-closed fehlende
  AbilityRefs und konfliktfreie Defense-Disposition.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
