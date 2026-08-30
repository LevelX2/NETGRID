# KI-Selbstspielzyklus 011 – Drei-Seed-Folgezyklus Superserum Control Grid

Stand: 2026-08-20
Status: fünf generische Findings behoben und in drei vollständigen
Realpfad-Partien verifiziert; zwei strategische Restverdachte sind mit Seed
und Matchzustand in der Indizienmatrix fortgeschrieben

## Reproduktionsvertrag

- Auswahlseed: `9f688881a9274eca976b29b5ef1ac778`
- Runner: **Skivviss Mill Pressure**, 45 Karten,
  `standard_standard_runner_skivviss_mill_pressure_1.0.0`,
  `fnv1a:4ff6aee1`
- Corp: **Classic Corp – Superserum Control Grid**, 45 Karten und
  17 Agendapunkte,
  `standard_standard_classic_corp_superserum_control_grid_2026_07_01_1.0.0`,
  `fnv1a:b6bad181`
- Spielseeds:
  - `selfplay-011-6247c6ae39bf5df675cfd0217ab502c3`
  - `selfplay-011-9f0ed9d3099945e719b04bb85b669466`
  - `selfplay-011-02010b49d52dbfc7863b9d93430405d4`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen über den normalen Multiplayer-/KI-Pfad auf dem isolierten
Worktree-Port 8911. Sämtliche Original-, Zwischen- und Abschlussläufe liegen
weiterhin in der zyklusübergreifend verwendeten isolierten SQLite-Datenbank;
es wurde nichts geleert. Die vollständige Detailanalyse erfolgte über die
lokale read-only Maintenance-Analyse-API.

## Ergebnis wie im Programm

| Partie | Standarddecks                                                               |            Endergebnis | Agendapunkte | Ende           | Entscheidungen |
| ------ | --------------------------------------------------------------------------- | ---------------------: | -----------: | -------------- | -------------: |
| Seed 1 | **Skivviss Mill Pressure** gegen **Classic Corp – Superserum Control Grid** | Runner **10 – 3** Corp |      **5:3** | Corp-Deck leer |            339 |
| Seed 2 | **Skivviss Mill Pressure** gegen **Classic Corp – Superserum Control Grid** | Runner **10 – 2** Corp |      **7:2** | Agendapunkte   |            362 |
| Seed 3 | **Skivviss Mill Pressure** gegen **Classic Corp – Superserum Control Grid** | Corp **10 – 3** Runner |      **7:3** | Agendapunkte   |            281 |

Vor den Änderungen endete Seed 1 Runner 10 – Corp 0 bei 5:0
Agendapunkten durch Corp-Deckout, Seed 2 Runner 10 – Corp 2 bei 7:2 und Seed 3
Corp 10 – Runner 0 durch Flatline bei 0:0. Nach den ersten Fixes endete Seed 3
noch nach 218 Entscheidungen durch Cleanup-Flatline. Der ergänzte
Cleanup-Vertrag verschob ihn auf 281 Entscheidungen und ein reguläres
7:3-Agendaende. Der abschließende Engine-Quote-Fix veränderte nur Seed 1 ab
D278: Die Corp rezzt Glacier, verhindert den Agendadiebstahl und erreicht
drei statt zwei Agendapunkte; Seed 2 und 3 bleiben fachlich vollständig
identisch.

## Vollständiger Decision-Denominator

Alle 982 Entscheidungen der drei finalen Partien wurden seitenweise und genau
einmal geladen und klassifiziert:

- Seed 1: Indizes 1 bis 339, keine Lücke und kein Duplikat;
- Seed 2: Indizes 1 bis 362, keine Lücke und kein Duplikat;
- Seed 3: Indizes 1 bis 281, keine Lücke und kein Duplikat;
- ausschließlich `ai-decision-trace-v2`;
- 982-mal vollständige historische LegalActions, Engine-Evidence und
  actor-private Analysesnapshots;
- keine Fallbacks, Timeouts, Auswahlmismatches oder fehlenden Auditsektionen;
- insgesamt 43 Runs, acht erfolgreiche Runs, sechs gestohlene und sieben von
  der Corp gescorte Agenden.

Die API meldet bei jedem Spiel lediglich, dass das zurückgegebene
Eventfenster den terminalen Zustand nicht mehr enthält. Der terminale
Result-Snapshot ist jeweils vorhanden und vollständig; die Warnung betrifft
nicht den Decision-Denominator.

## Behobene Findings

### 1. Der Scoreplan erkannte eine reife Remote nicht

Eine bereits zweischichtig geschützte Remote besaß zwei aktuelle,
Engine-gequotete und bezahlbare Tax-/Damage-Layer. Trotzdem wiederholte ein
nachgelagerter Defense-Scan die Schutzentscheidung und verdrängte die
Agenda-Installation. Der Scoreowner stellt nun selbst ein enges,
`stateVersion`- und servergebundenes Zertifikat über genau zwei finanzierbare
Layer aus. Der Defense-Support bewahrt dieses Ergebnis, statt eine zweite
Entscheidungsautorität zu bilden.

Das ist keine feste „Core Remote“ und keine allgemeine Deckregel. Bei jeder
Zustandsänderung werden Agenda, Asset, Schutz, Rezbudget und Serverbindung neu
bewertet; eine zweite Remote bleibt zulässig, sobald ein konkreter Plan sie
benötigt.

### 2. Sichtbarer ICE-Schaden fehlte in Runstart und Jack-out

Der öffentliche effektive Subroutinenvertrag enthielt die Schadensmenge, aber
nicht den Damage-Typ. Deshalb konnte die KI öffentlich sichtbaren, nicht
bezahlbar brechbaren Schaden weder gegen ihre typisierte Prävention rechnen
noch als Flatlinegefahr behandeln. Die Engine projiziert den Typ nun
side-sicher; Runziel und bestehender Runfensterplan teilen sich dieselbe
Lethalitätsbewertung. Verdeckte ICE wird weiterhin nicht bewertet.

### 3. Cleanup-Flatline wurde mit unmittelbarer Flatline verwechselt

Drei Core Damage bei drei Handkarten sind nicht sofort tödlich. Sie können
aber die effektive maximale Handgröße unter null senken und damit in der
Cleanup-Phase deterministisch flatlinen. Die Bewertung weist beide Fälle nun
getrennt aus. Das gleiche Seed-Spiel endet anschließend nicht mehr durch
Flatline, sondern 243 Entscheidungen später durch reguläre Agendapunkte.

### 4. Exakt bewertete Encounter-Aktionen fielen aus dem Plan

Runfensteraktionen ohne Server-ID konnten trotz exakter planlokaler
Admissibility aus der Kandidatenabdeckung fallen. Bei Deflection genügte
außerdem eine formal vorhandene, aber planintern ausgeschlossene Breakroute,
um Continue abzulehnen. Die Korrektur erweitert nur die Abdeckung des
zuständigen `runner.convert_run_window`-Leafs und wendet dessen bestehende
Exklusion auch auf die Vergleichsroute an. Root, Step, Action-ID und Executor
bleiben unverändert.

### 5. Eine unbekannte Folgewirkung verdeckte sichere Unbezahlbarkeit

Bei Glacier setzte eine nach dem Brechen eintretende Stealth-Verschlechterung
die gesamte Ressourcenaustauschquote auf unbekannt. Der Runner konnte aber
bereits die direkten Pump-/Breakkosten nicht bezahlen. Die Engine darf diese
monotone untere Schranke jetzt exakt als unbezahlbar zertifizieren; ist die
direkte Route bezahlbar, bleibt der noch unvollständige Fall weiterhin
fail-closed. Im finalen Seed 1 rezzt die Corp Glacier im bestehenden
Defense-Plan und verhindert den Zugriff.

## Gewinneranalyse

**Seed 1:** Der Runner gewinnt durch Deckout bei nur 5:3 Agendapunkten. Er
startet 18 Runs, davon neun auf R&D, und kommt dreimal erfolgreich durch. Der
entscheidende Schlussmechanismus ist nicht ein einzelner Glückszug: Der
Runner hält über viele Züge R&D-Druck aufrecht und erzeugt unmittelbar vor
dem letzten Corp-Draw einen neuen Skivviss-Counter. Der Glacier-Fix zeigt
zugleich eine reale Corp-Gegenwehr: Ein vorheriger Agendadiebstahl wird
gestoppt und die Corp scoret noch eine zweite Agenda.

**Seed 2:** Der Runner gewinnt über drei gestohlene Agenden mit 7:2. Er greift
16-mal an und nutzt die sichtbare Schwäche des HQ-Portfolios. Die Corp besitzt
zwar sechs HQ-ICE, kann im Schlussfenster aber nur die günstige aktive
Brain-Drain-Schicht finanzieren. Evil Twin trägt genau diese Route; die letzte
Agenda wird aus HQ gestohlen.

**Seed 3:** Die Corp gewinnt 7:3 über vier gescorte Agenden. Frühe zufällige
Core Damage trifft den Runner schwer, aber der korrigierte Runner opfert sich
nicht mehr in eine determinierte Flatline. Die Corp konvertiert ihre
Remote-Projekte regelmäßig, hält den Runner mit Vortex und Glacier unter
Ressourcendruck und schließt über Agendapunkte. Dieser Seed belegt, dass das
Deck nicht grundsätzlich am Scoren scheitert.

## Verliereranalyse und Metaebene

Die beiden Corp-Niederlagen und die Runner-Niederlage haben unterschiedliche
Ursachen:

1. In Seed 1 verliert die Corp an der Kombination aus knappem Deckhorizont und
   dauerhaftem R&D-Druck. Zu Beginn von Corp-Zug 39 liegt nur noch eine Karte
   in R&D und noch kein Skivviss-Counter. Nach dem Score erzeugt der nächste
   erfolgreiche R&D-Run den Counter; das folgende Drawfenster leert das Deck.
   Ein späterer Glacier-Transfer nach R&D wäre denkbar, beweist bei einem
   Rückstand von 1:5 aber noch keinen Gewinnpfad.
2. In Seed 2 ist nicht die nominelle Menge der HQ-ICE das Problem, sondern
   ihre fehlende Rezliquidität. Die Corp wandelt den letzten Zug vollständig
   in Credits um und erreicht sechs, während fünf der sechs Schichten zwei bis
   zehn Credits beziehungsweise zusätzliche Anforderungen kosten. Ein
   klarerer früherer Economy-, Platzierungs- oder Scorepfad ist in den
   gespeicherten Vergleichszuständen noch nicht bewiesen.
3. Seed 3 ist überwiegend ein plausibles Matchup- und Ressourcenresultat. Der
   Runner verliert früh drei Core Damage durch eine zufällige Auswahl, baut
   später einen Breaker auf und contestet die Remote, kann Vortex und Glacier
   im entscheidenden Fenster aber nicht gemeinsam finanzieren. Nach Entfernung
   der beiden klaren Survival-Fehler bleibt keine konkret dominierende
   Runner-LegalAction übrig.
4. Die Dreierfolge verhindert eine falsche Generalisierung: Superserum
   Control Grid verliert zweimal gegen langfristigen Zentraldruck, zeigt im
   dritten Seed aber eine funktionierende Score- und Remote-Strategie. Das
   spricht gegen einen pauschalen Deck- oder Remote-Sonderfix.

## Neue Ideen und Restverdachte

- SP-040 verdichtet `corp-central-defense-allocation`: Zukünftige
  Defensebewertung sollte nicht nur Layerzahl und aktuelle Einzelquote,
  sondern den zeitlichen Aufbau bezahlbarer Rezbreite gegen Scoretempo
  vergleichen. Vor einer Änderung ist ein exakter dominierender
  Vergleichspfad erforderlich.
- SP-041 verbindet `corp-deck-exhaustion-horizon` erstmals mit einem
  verschiebbaren mobilen Defense-Layer. Nötig wäre eine Engine-gequotete
  Mehrzugbewertung aus Scorewert, verbleibenden Pflichtdraws und konkret
  erreichbarer Deckout-Verteidigung; der Einzelzustand reicht noch nicht.
- Der neue Cleanup-Vertrag kann künftig auch andere öffentliche
  Max-Hand-Änderungen aufnehmen. Er bleibt derzeit bewusst auf exakt sichtbare
  Core-Damage-Folgen begrenzt.

## Architektur- und Dokumentationswirkung

Der gemeinsame Plan-Kernel und die Owner-Grenzen ändern sich nicht.
Dokumentationsrelevant sind zwei verfeinerte bestehende Verträge:

- Engine-gequotete, aktuelle Schutz-Facts dürfen innerhalb desselben
  Scoreparents als endliches Zertifikat weitergereicht werden, aber keinen
  zweiten Protection-Entscheider erzeugen;
- eine unvollständige Folgeauswirkung darf eine logisch monotone, bereits
  sichere Unbezahlbarkeits-Untergrenze nicht verdecken. Bei potenziell
  ausführbarer Route bleibt der Pfad fail-closed.

Diese Präzisierungen sind im Planebenen-Konzept ergänzt. `change-compass.md`
und `README.md` wurden auf Auswirkungen geprüft; ihre bestehenden Owner-,
Engine-Quote- und Fail-closed-Regeln decken die Änderung bereits ab.

## Ablauf- und Laufzeitoptimierung

Die komplette Dreierserie wurde einmal in begrenzten Batches voraggregiert.
Tiefe Detailabfragen erfolgten nur für abweichende Entscheidungsbereiche,
Loss-Driver und Risikofenster. Unveränderte Seeds und unveränderte fokussierte
Tests wurden nicht erneut ausgeführt. Der Selbstspiel-Skill schreibt diesen
Pfad jetzt verbindlich vor; Vollständigkeit und der 982/982-Denominator
bleiben erhalten.

## Verifikation

- fokussierte Engine-Projektions-, Ressourcenaustausch-, DTO-, Damage-,
  Runziel-, Score- und Plan-Ownership-Regressionen;
- drei finale Realpfad-Partien mit 982/982 vollständig auditierten
  Entscheidungen ohne Fallback, Timeout, Lücke oder fehlende Auditsektion;
- deterministischer Vergleich aller drei Seeds: Seed 2 und 3 bleiben nach dem
  letzten Fix vollständig identisch, Seed 1 ändert sich erstmals am
  beabsichtigten Glacier-Rezfenster D278;
- Shared- und Engine-Typecheck grün; der AI-Typecheck enthält nach Behebung
  der beiden zykluseigenen Typfehler ausschließlich die bereits auf `main`
  vorhandenen Fehler im Card-Hint-Compiler, in vier fehlenden
  Card-Migrationsreports und in der Choice-Option-Narrowing;
- der zusätzlich sichtbar gewordene Vapor-Ops-Projektionstest ist identisch
  auf `main` rot und wird als unabhängige Baseline getrennt, nicht durch einen
  KI-Fallback in diesen Zyklus gezogen.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
