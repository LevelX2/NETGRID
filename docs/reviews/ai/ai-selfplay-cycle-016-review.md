# KI-Selbstspielzyklus 016 – Drei-Seed-Folgezyklus Cybernetics Risk Rig

Stand: 2026-08-20
Status: fünf generische Findings behoben und in drei vollständigen
Realpfad-Partien verifiziert; keine weitere Änderung ohne belastbaren
dominierenden Vergleichspfad

## Reproduktionsvertrag

- Auswahlseed: `30af65d458e8448d969ec2c75d818509`
- Runner: **Classic Runner - Cybernetics Risk Rig**, 45 Karten,
  `standard_standard_classic_runner_cybernetics_risk_rig_2026_07_01_1.0.0`,
  `fnv1a:1e4afea4`
- Corp: **The Korp Master**, 45 Karten,
  `standard_standard_corp_mp1ddh7c_1.0.0`, `fnv1a:0240cc26`
- Spielseeds:
  - `selfplay-016-54a3d1e334d84dbe9da0a1fe0d598cc1`
  - `selfplay-016-30432ef7f68144d18d945dc6ca1aa134`
  - `selfplay-016-7a09ffbf610047918431e3e65af8ec29`
- Ausgangsstand: `1364e0aef75268f87fff76ccf236ceda96cb78eb`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen über den normalen Multiplayer-/KI-Pfad auf dem isolierten
Worktree-Port 8912. Alle Original-, Reproduktions-, Zwischen- und
Abschlussläufe liegen weiterhin in der eigenen persistenten SQLite-Datenbank;
es wurde nichts geleert oder überschrieben. Die vollständige Analyse erfolgte
über die lokale read-only Maintenance-Analyse-API.

## Ergebnis wie im Programm

| Partie | Standarddecks                                      |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | -------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Cybernetics Risk Rig** gegen **The Korp Master** | Runner **10 – 6** Corp |      **7:6** | Agendapunkte |            237 |
| Seed 2 | **Cybernetics Risk Rig** gegen **The Korp Master** | Runner **10 – 0** Corp |      **7:0** | Agendapunkte |            162 |
| Seed 3 | **Cybernetics Risk Rig** gegen **The Korp Master** | Runner **10 – 1** Corp |      **9:1** | Agendapunkte |            105 |

Die finalen Match-IDs lauten `match_d3b1a5e4c78ebe91`,
`match_8c5abc8e2ad53b08` und `match_577792f575c50a93`. Seed 1 ist nach dem
Score- und Continuation-Fix erstmals ein knappes 7:6 statt eines passiven
Corp-Deckouts. Seed 2 und 3 bleiben deutliche Runner-Siege, enthalten aber
keinen weiteren belegten Plan- oder Regelbruch.

## Vollständiger Decision-Denominator

Alle 504 Entscheidungen der drei finalen Partien wurden seitenweise und genau
einmal geladen und klassifiziert:

- Seed 1: Indizes 1 bis 237, zwei API-Seiten, keine Lücke und kein Duplikat;
- Seed 2: Indizes 1 bis 162, keine Lücke und kein Duplikat;
- Seed 3: Indizes 1 bis 105, keine Lücke und kein Duplikat;
- ausschließlich `ai-decision-trace-v2`;
- 504-mal historische LegalActions, Engine-Evidence, actor-private
  Analysesnapshots und Checkpoint-Capture vollständig persistiert;
- keine Fallbacks, Timeouts, Auswahlmismatches, Engine-Rejections,
  unbekannten Assessments oder fehlenden Auditsektionen;
- insgesamt 26 Runs, 18 erfolgreiche Runs, zehn gestohlene und vier von der
  Corp gescorte Agenden.

Der lokale Runner wurde bei der ersten Voraggregation korrigiert: Die API
liefert für `fromDecision=0&toDecision=199` die Indizes 1 bis 199. Die
Pagination endet deshalb anhand des letzten gelieferten Decision-Index statt
an einer angenommenen Seitengröße. Das ist eine lokale Laufzeitkorrektur;
der globale Skill wurde nicht verändert.

## Behobene Findings

### 1. Freiwilliger Self-Trash hatte keinen Planowner

Nach der Installation von Crash Space brach der Reproduktionslauf
`match_195e8201e42429f7` in D150 fail-closed ab. Die Engine stellte die
strukturierte, freiwillige `trash_source_action`-LegalAction korrekt bereit,
aber keine bestehende Runner-Domäne klassifizierte den nicht bewerteten
Ressourcenabbau. `runner.resource_lifecycle` übernimmt nun ausschließlich den
generischen Engine-Vertrag für eine freiwillige, quelltrashende
`trash_source_action` und markiert ihn ohne belastbaren Nutzen als
`assessment_unknown`. Der Plan wählt die Aktion nicht und es entsteht kein
Kartennamen-Sonderfall.

### 2. Start-of-turn-Zufallseffekte hatten keine kanonische Reihenfolge

Omnitech erzeugt am Runner-Zuganfang eine öffentlich beschriebene Würfeltabelle.
Die Startfensterlogik konnte den Effekt weder als Zufallsauflösung erkennen
noch gegenüber deterministischen Credit-Verlusten und -Gewinnen einordnen.
Kanonische Runner-Facts validieren jetzt die vollständige öffentliche Tabelle
und ordnen `random_effect` vor `credit_loss` vor `credit_gain`. Die KI simuliert
keinen Würfelwurf und verbraucht keinen Zufall; die Engine bleibt alleinige
Zufallsautorität.

### 3. Grip-Suche verletzte vorübergehend das Memory-Invariant

Im Realpfad `match_fb43c71debcf0637` trashte Boostergang bei State 186 Karten
aus der Grip, während Wet Drive die verfügbare MU von der Gripgröße ableitete.
Vor der noch offenen, obligatorischen Stack-zu-Grip-Auswahl war der Runner
dadurch vorübergehend über seiner MU-Grenze. Die Engine erlaubt diesen Zustand
nur für den exakt gebundenen, obligatorischen Grip-Such-Choice-Vertrag und
prüft nach seiner Auflösung wieder das normale Invariant. Es gibt keinen
allgemeinen Memory-Bypass.

### 4. Eine reife geschützte Agenda wurde nicht weiter avanciert

Eine bereits installierte Polymer Breakthrough lag hinter zwei aktuellen,
bezahlbaren und Engine-gequoteten Damage-Layern. Trotzdem verlangte
`corp.score_agenda` erneut den allgemeinen Schutzvertrag und gab seine
Advance-LegalAction zugunsten von Economy auf. Der bestehende Scoreowner darf
für eine bereits installierte Agenda nun dasselbe enge, state- und
servergebundene Zwei-Layer-Zertifikat verwenden, das für den Installhorizont
bereits galt. Mit nur einem Layer bleibt die Route weiter blockiert. Owner,
Step, Action-ID und Executor bleiben `corp.score_agenda`.

### 5. Priority Requisition verlor die Free-Rez-Continuation

Nach korrektem Score von Priority Requisition scheiterte der Zwischenlauf
`match_c9e4247a322efa9a` in D103 mit `window_origin_missing`. Der Scoreplan
hatte seinen Folgetarget nicht vor dem zustandsändernden Score gebunden. Der
Scoreowner bindet nun anhand kanonischer Agenda-Facts exakt eine bekannte,
unrezzte ICE mit dem höchsten öffentlichen Rezpreis. Der Choice-Resolver
validiert anschließend nur Quelle, Capability, vorherigen Scoreexecutor,
Stateversion, sichtbares Ziel und aktuelle LegalAction und vervollständigt die
bereits getroffene Payload. Er wählt weder Server noch Strategie neu.

## Gewinneranalyse

**Seed 1:** Der Runner gewinnt knapp 7:6. Er startet zehn Runs, neun davon
sind erfolgreich, und stiehlt drei Agenden. Die Corp konvertiert nach dem Fix
ebenfalls drei Projekte und nutzt die Priority-Requisition-Continuation, wird
aber im letzten Zugriff um einen Punkt überholt. Das belegt sowohl die
Runner-Konsistenz als auch die reparierte Corp-Scorelinie.

**Seed 2:** Der Runner gewinnt 7:0 trotz nur zwei erfolgreichen von neun Runs.
Die wenigen Zugriffe sind durch Mehrfachzugriff hoch wirksam und liefern drei
Agenden. Die Corp hat nur 22 eigene Zugfenster, investiert früh in Verteidigung
und erreicht vor dem Runner-Closeout kein reifes Scoreprojekt. Es ist kein
konkret besserer aktueller LegalAction-Pfad belegt.

**Seed 3:** Der Runner gewinnt 9:1 mit sieben erfolgreichen von sieben Runs
und vier gestohlenen Agenden. Die vollständige Breakerabdeckung trifft auf
eine zu langsam finanzierte Zentralverteidigung. Die Corp scoret ein Projekt,
hat aber im gespeicherten Schlussfenster keine dominierende Alternative gegen
den bereits aufgebauten Zentraldruck.

## Verliereranalyse und Metaebene

1. Seed 1 zeigt, dass die Corp-Scorearchitektur nach den Fixes grundsätzlich
   funktioniert: drei gescorte Agenden und 6 Punkte widersprechen einem
   pauschalen Deck- oder Scoreplan-Sonderfix.
2. Seed 2 verdichtet SP-005, SP-011, SP-029 und SP-040: nominelle
   Verteidigung bindet früh Liquidität, während wenige hochwertige Zugriffe
   genügen. Ohne gespeicherten dominierenden Economy-, Placement- oder
   Scorevergleich bleibt dies ein strategisches Indiz, kein neuer Fix.
3. Seed 3 verdichtet dieselbe langfristige Rezbreitenfrage stärker, belegt
   aber ebenfalls keine einzelne fehlerhafte Auswahl. Sieben erfolgreiche
   Runs sind Matchup- und Entwicklungsresultat, nicht automatisch ein
   Planowner-Defekt.
4. Das 3:0 für den Runner rechtfertigt keine deckgebundene Kompensation. Die
   drei Seeds unterscheiden sich deutlich in Run-Erfolg und Corp-Scoretempo;
   nur die fünf exakt reproduzierten Vertragslücken wurden geändert.

## Architektur- und Dokumentationswirkung

Der gemeinsame Plan-Kernel und die Owner-Grenzen ändern sich nicht. Der
Scoreplan behält die Agendaentscheidung und bindet eine engineerforderliche
Folge-Choice vor; der Resolver prüft und vervollständigt nur die Payload. Der
temporäre Memory-Zustand ist ein enges Engine-Continuation-Invariant. Der
Startfenster-Fix ordnet öffentlich bekannte Effektfamilien, ohne Zufall zu
simulieren. `change-compass.md`, `README.md` und das Planebenen-Konzept wurden
gegen diese Grenzen geprüft; ihre bestehenden Regeln decken die Änderungen.

## Verifikation

- drei neue fokussierte Plan-Ownership-Regressionen grün;
- Choice-Resolver und kanonische Card-Facts: 88/88 Tests grün;
- geänderte Engine-Mechanikdatei: 11/11 Tests grün;
- Engine-Typecheck grün;
- drei finale Realpfad-Partien mit 504/504 vollständig auditierten
  Entscheidungen ohne Fallback, Timeout, Lücke oder fehlende Auditsektion;
- der breite `plan-first-live-runtime`-Lauf enthält 233 grüne Tests und 22
  bereits vorhandene, themenfremde Baselinefehler; alle drei neuen Tests sind
  darin grün;
- der AI-Typecheck enthält nach Behebung der beiden zykluseigenen Typfehler
  ausschließlich fünf bereits auf `main` vorhandene Baselines: eine
  optionale Card-Hint-Compiler-Eigenschaft und vier fehlende
  Card-Migrationsreports.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
