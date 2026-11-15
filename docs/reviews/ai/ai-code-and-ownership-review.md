# NETGRID-KI – Architektur-, Owner- und Code-Review

Stand 2026-11-15 · Erstreview auf `ec34803a5`, Folgereview auf `3723f9531`

Dieses Review hält die offenen Entscheidungen zur Vereinfachung der KI und die
Abnahmekriterien dafür fest. Nach Klärung der Befunde gehören gültige Verträge
in die [KI-Architektur](../../architecture/ai/README.md).

Auf `main` liegen die strukturierten Punish-Quote-Fehler, die einmalige
Portfolioübergabe und der erste Schnitt zwischen Runtime, Diagnose und
Runner-Owner. Die Befunde F1 und F2 unten beschreiben den Ausgangszustand
und sind umgesetzt. Bei F3 und F5 sind die ersten Schnitte umgesetzt.
F4 und F6 haben weiterhin offene Entscheidungen. Die zweite Stichprobe
und ihre Prioritäten stehen am Ende dieses Dokuments. Die drei dort
empfohlenen Corp-Vertragshärtungen sind umgesetzt. Die beschriebenen
Gegenproben halten ihren Ausgangszustand fest. Die kleinen Folgeänderungen
am Benchmark, am Rollenabgleich und an den taktischen Typen sind umgesetzt.

## Gesamturteil

Plan-first ist für NETGRID die passende Grundarchitektur. Die Engine entscheidet
über Regeln und Legalität. Fachliche Planmodule bewerten Ziele und Möglichkeiten,
der TurnPlanner vergleicht ausführbare Zuglinien und die Choice-Auflösung bindet
die konkrete Engine-Aktion. Need-/Support-Beziehungen, Beobachtungsgrenzen und
Commitments lösen unterschiedliche Probleme. Den Kern beibehalten. Die größte
Vereinfachung liegt heute an den Übergaben zwischen diesen Schichten und in der
Verkleinerung der öffentlich erreichbaren historischen Oberflächen.

Die 25 registrierten Module verteilen sich auf 23 Fachowner sowie zwei Instanzen
des gemeinsamen Zugabschlussmoduls. Alle Registrierungen haben einen fachlichen
Aufrufpfad mit Discovery, Assessment und Materialisierung. Der Strukturcheck hat
unter 984 TypeScript-Quelldateien weder Laufzeit- noch Typimportzyklen gefunden.
Die untersuchten Owner-Dateien importieren weder die Live-Runtime noch ihre
Core-/Tactical-Registries zurück. Aufrufe an Hilfen unter `runtime/` sind verbreitet.
Einige sind neutrale Fakten oder Verträge. Damit ist die Ordnergrenze allein
kein Beleg für fachliche Eigenständigkeit. [Ownerkarte](../../architecture/ai/README.md#planowner-und-implementierungen) · [Strukturcheck](../../../scripts/check-ai-source-structure.mjs#L24)

## Priorisierte Befunde

**P1 · F1 · Technische Fehler der Punish-Quote werden als fehlendes Angebot behandelt.**
Reproduziert durch den vorhandenen Test für geworfene, veraltete, fehlerhafte
und abgelehnte Quotes. Der Adapter verwirft sie ohne ursächliche Diagnose. Wenn
kein gültiges Ergebnis bleibt, liefert er die ursprüngliche Eingabe. Der Owner
sieht anschließend je nach Portfolio gar kein neues Signal oder nur
`route_quote_unavailable`. Damit bleibt die Ausführung ohne gültige Quote
gesperrt. Für die Diagnose sind ein echter Engine-Ausnahmefehler und ein
aus fachlichen Gründen nicht verfügbares Angebot jedoch nicht unterscheidbar.
Eine fachlich unvollständige Quote soll weiterhin neben gültigen Geschwisterrouten
bestehen können. Maßnahme im Quote-Adapter und beim konsumierenden Owner. Eine
strukturierte technische Diagnose an den aktuellen Quote-Pfad binden und mit
regulären Ablehnungen und kanonisch unvollständigen Ergebnissen abgleichen.
Abnahme über geworfene Ausnahme, fremdes Echo, fachlich blockierte Route und
gültige Geschwisterroute. Aufwandschätzung 0,5–1,5 Tage.
[Adapter](../../../packages/ai/src/corp/punish/punish-route-quote-input.ts#L62) · [Test](../../../packages/ai/src/corp/punish/punish-route-quote-input.test.ts#L487) · [Owner](../../../packages/ai/src/corp/punish/punish-signals.ts#L152)

**P1 · F2 · Das residente Planportfolio hat innerhalb einer Entscheidung zwei Schreibzeitpunkte.**
Statischer Codebefund. Die Live-Runtime schreibt einen geklonten Zwischenstand
vor `decisionFromScheduler` und erneut nach weiterer Choice- und Lease-Bindung.
Bei einem Fehler dazwischen hat die Routine bereits ein Portfolio für den
aktuellen Zustand abgelegt. Zugleich übergibt der Hauptpfad dem Choice-Dispatcher
das aktuelle Portfolio schon explizit, während einzelne Domain-Resolver den
Matchspeicher selbst abfragen. Die Auswirkung auf einen späteren Versuch über
den Server hängt von dessen Wiederherstellung ab und wurde hier nicht
reproduziert. Maßnahme zuerst anhand eines fehlgeschlagenen Choice-Pfads und
einer erfolgreichen Runner-/Corp-Fortsetzung absichern. Den betroffenen
Resolvern den Entscheidungsstand explizit geben. Danach den erfolgreichen
In-Memory-Schreibzeitpunkt bündeln. Abnahme über einen unveränderten vorherigen
Snapshot bei einem Bindungsfehler und eine identische vollständige
Choice-/Lease-Bindung bei Erfolg. Aufwand 2–4 Tage.
[Schreibstellen](../../../packages/ai/src/runtime/plan-first-live-runtime.ts#L851) · [Expliziter Dispatcher-Eingang](../../../packages/ai/src/runtime/plan-first-live-runtime.ts#L4786) · [Beispiel eines Speicherlesers](../../../packages/ai/src/runner/run-window/runner-targeted-ice-trash-choice.ts#L29) · [Matchspeicher](../../../packages/ai/src/plans/resident-plan-portfolio-memory.ts#L45)

**P2 · F3 · Fachliche Entscheidungen und Querschnitt liegen im selben Live-Modul.**
Statischer Struktur- und Aufrufbefund. `plan-first-live-runtime.ts` hat 5.703
Zeilen und 172 statische relative Importziele einschließlich Typimporten. Die
Datei enthält Choice-Einstiege, Side-Komposition, rund 1.100 Zeilen Runner-
Dispositionslogik, die Bindung der gewählten Ausführung und die Darstellung
der Diagnose. Die Dispositionsfunktion entscheidet anhand konkreter fachlicher
Gründe über die Zulässigkeit von Kandidaten. Damit reicht ein vertikales
Owner-Verzeichnis allein für Änderungen an diesen Gründen oft nicht aus. Die
Datei taucht zwölfmal in der Pfadliste der letzten 100 KI-Quellcommits auf.
Zuerst reine Trace-Aufbereitung aus dem Entscheidungspfad lösen. Danach je
eine belegte Fachgruppe aus der Disposition zu ihrem Owner verschieben. Die
Zusammenführung konkurrierender Dispositionen bleibt eine Runtime-Aufgabe.
Abnahme je Schnitt über gleiche Entscheidung, Root-/Leaf-Owner, Step, Route,
Choices und relevante Evidence auf vorher aufgezeichneten Fixtures. Aufwand
1–2 Tage für die Diagnose, 1–3 Tage je fachlicher Schnitt.
[Runtime-Einstieg](../../../packages/ai/src/runtime/plan-first-live-runtime.ts#L539) · [Dispositionen](../../../packages/ai/src/runtime/plan-first-live-runtime.ts#L1443) · [Diagnose](../../../packages/ai/src/runtime/plan-first-live-runtime.ts#L4108)

**P2 · F4 · Planvorbereitung und Vergleichsmodus halten Teile des Cutovers im Live-Pfad.**
Statischer Befund. Der Scheduler reconciliert das Portfolio einmal. Er bewertet
die Instanzen und materialisiert seinen Sieger. Danach ruft die produktive
TurnPlanner-Vorbereitung dieselbe Assessment-Funktion mit dem inzwischen
gebundenen Portfolio erneut auf und materialisiert die für die Suche nötigen
Instanzen. Wegen Executor- und Supportbindung darf das erste Ergebnis nicht
ungeprüft wiederverwendet werden. Erhebbare Mehrarbeit an einem repräsentativen
Runner-/Corp-Frame zählen und die gemeinsame Übergabe explizit machen, sobald
die Gleichheit der wiederverwendbaren Fakten und Bindungen belegt ist. Auch im
Detail besteht Driftpotenzial. Die höchste Dringlichkeitsklasse wird identisch
ermittelt, während Corp den Nutzen rundet und Runner Bruchteile ausdrücklich
wegen des Tie-Breaks erhält. Kleine gemeinsame Regeln gezielt konsolidieren
und solche Unterschiede als fachliche Regeln prüfen. Der Greedy-Vergleich ist
ein ausdrücklich gewählter Modus. In der untersuchten Anwendung und den
Scripts wurde kein TypeScript-Aufrufer dafür gefunden. Unter `packages/ai/src`
enthalten 22 Testdateien den Begriff. Viele sichern dort noch fachliche
Erwartungen. Zuerst pro Test entscheiden, ob er einen Owner, den Standardpfad
oder den historischen Vergleich belegt. Anschließend die gewünschte
Vergleichsoberfläche und API-Grenze entscheiden. Aufwand 1–2 Tage für Messung
und Testinventar, Implementierung nach Befund.
[Scheduler-Sieger](../../../packages/ai/src/plans/plan-scheduler.ts#L265) · [Erneute Bewertung](../../../packages/ai/src/plans/plan-scheduler.ts#L375) · [Runtime-Modi](../../../packages/ai/src/runtime/plan-first-live-runtime.ts#L680) · [Corp-Nutzenbegrenzung](../../../packages/ai/src/plans/corp-turn-planner-shadow.ts#L1342) · [Runner-Nutzenbegrenzung](../../../packages/ai/src/plans/runner-turn-planner-shadow.ts#L1366)

**P2 · F5 · Mehrere große Owner benötigen engere innere Grenzen.**
Statischer Befund. Defense entscheidet über globale ICE-Allokation und muss
deshalb ein Owner für beide Seiten des Allokationsvergleichs bleiben. Seine
Moduldatei enthält auf 2.742 Zeilen auch aktuelle Rez-/Installationsbindung,
Routenvergleich und Dispositionen. Score, Remote und Economy sollten den
bereits typisierten Schutzbedarf und das Resultat beziehen. Innerhalb von
Defense lohnt es sich, zuerst Quote-Prüfung und Routenvergleich als getrennte
Funktionen mit einem gemeinsamen Ergebnisobjekt anzuschauen. Auf Runner-Seite
zuerst Coverage und Handentwicklung entlang des echten gemeinsamen
Installations-/Suchbedarfs prüfen. Hierher gehört auch die in der Stichprobe
gefundene Mehrfachauswertung der aktiven Installationssequenz. Abnahme über
gleiches Allokationsergebnis und gleiche Owner-Bindung bei umkämpftem Remote,
ungeschütztem Zentralserver und knapper Reserve. Aufwand 2–4 Tage für einen
ersten Defense-Schnitt.
[Defense-Modul](../../../packages/ai/src/corp/defense/defense-plan-module.ts#L812) · [Zweckgebundener Schutzbedarf](../../architecture/ai/corp-plan-contracts.md#ownership-zwischen-score-remote-und-defense) · [Coverage-Phasen](../../../packages/ai/src/runner/rig-coverage/coverage-plan-module.ts#L330)

**P3 · F6 · Erreichbarkeit und Live-Bedarf fallen bei älteren Exporten auseinander.**
Der Reachability-Check verwendet Paketexporte als Wurzeln. Das taktische
Portfolio besitzt ein eigenes Typmodell und einen zweiten Speicher neben dem
residenten Portfolio. Der produktive Entscheidungsablauf schreibt in das
residente Portfolio. Die ältere Oberfläche wird im Portfoliotest sowie bei
Export und Restore von Entscheidungs-Checkpoints verwendet. 243 eingecheckte
JSON-Artefakte enthalten die Schema-ID `plan-portfolio-v1`, darunter weiterhin
genutzte Regressionsevidenz. Die drei gemeinsamen Typen tragen jetzt einen
taktischen Namen. Eine weitergehende Ablösung erfordert die Einzelprüfung
der Nachweise und gegebenenfalls native Regressionstests für dieselben Fälle.
[Wurzelbildung](../../../scripts/audit-ai-source-reachability.mjs#L53) · [Portfoliotests](../../../packages/ai/src/plans/plan-portfolio.test.ts) · [Checkpoint-Consumer](../../../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint.ts#L37)

## Verantwortungsbereiche

| Registrierter Owner | Urteil zur Abgrenzung und nächster Prüfschwerpunkt |
| --- | --- |
| [Runner Shell Traders](../../../packages/ai/src/runner/shell-traders/shell-traders-plan-module.ts) | Eigenständiger Pipeline-Lifecycle mit Quellen- und Hostbindung. Coverage und Economy liefern Bedarf und Funding. Hostwechsel und letzter Counter sind die relevanten Grenzfälle. |
| [Runner Ressourcenlebenszyklus](../../../packages/ai/src/runner/resource-lifecycle/resource-lifecycle-plan-module.ts) | Sinnvoll für Halten, Bezahlen und Verlassen einer vorhandenen Quelle. Kreditbedarf bleibt signalisiert. Beim Ausbau die Grenze zur wiederkehrenden Economy an derselben Quelle testen. |
| [Runner installierte Agenda](../../../packages/ai/src/runner/installed-agenda/installed-agenda-plan-module.ts) | Kleine fachlich geschlossene Route für Konversion. Schnittstelle zum Sofortsieg gezielt über dieselbe LegalAction mit und ohne terminalen Wert absichern. |
| [Runner wiederkehrende Economy](../../../packages/ai/src/runner/recurring-economy/recurring-economy-plan-module.ts) | Amortisation und planbezogene Runzurückstellung sind ein eigener Lebenszyklus. Den Grenzfall einer sofortigen besseren Run-Route gegen eine spätere Auszahlung erhalten. |
| [Runner Kreditbank](../../../packages/ai/src/runner/credit-bank/credit-bank-plan-module.ts) | Einzahlen, Halten und Auszahlung verdienen denselben Owner. Versorgung konkreter Ziele über gemeinsam typisierte Fundingverträge. Prüfschwerpunkt ist die doppelte Anrechnung derselben Bankliquidität als Reserve und Finanzierung. |
| [Runner Economy](../../../packages/ai/src/runner/economy/economy-plan-module.ts) | Allgemeine Liquidität und Funding-Support gehören zusammen. Ein konkreter fremder Bedarf muss mit Root und Zweck erhalten bleiben, auch wenn dieselbe Geldaktion für mehrere Pläne infrage kommt. |
| [Runner Rig/Coverage](../../../packages/ai/src/runner/rig-coverage/coverage-plan-module.ts) | Fachlich richtige Zuständigkeit für Breaker-Lücke, Erwerb, MU und Phase. Der Nachfrageaufbau verzweigt sich über Runtime-Adapter und projizierte Frames. Einen gebundenen Bedarf als durchgängiges Ergebnis verfolgen. |
| [Runner Defense/Recovery](../../../packages/ai/src/runner/defense-recovery/defense-plan-module.ts) | Sicherheits- und Wiederherstellungsphase sind kohärent. Andere Owner sollen konkrete Handpuffer-, Tag- und Risikoangaben beziehen. Gerade bei Draw, Run und Bank den gemeinsamen Tatsachenstand gegenprüfen. |
| [Runner Sofortsieg](../../../packages/ai/src/runner/terminal-win/terminal-win-plan-module.ts) | Enger eigener Owner mit hoher Priorität für einen nachgewiesenen Gewinn. Gute Vorlage für kleine spezifische Module mit klaren Gegenfällen. |
| [Runner Information](../../../packages/ai/src/runner/expose-information/expose-information-plan-module.ts) | Informationsgewinn und Erinnern gehören fachlich zusammen. Die Bindung an den konkreten Remote-Parent bzw. tatsächlichen Erkenntnisgewinn ist die weiter zu schützende Grenze. |
| [Runner Central Pressure](../../../packages/ai/src/runner/central-pressure/central-pressure-plan-module.ts) | Eigenständige Druck-, Ziel- und Wiederholungslogik für zentrale Server. Kosten- und Passierbarkeitsfakten mit Remote Contest teilen und die Zweckbewertung im Owner behalten. |
| [Runner Remote Contest](../../../packages/ai/src/runner/remote-contest/remote-contest-plan-module.ts) | Sichtbares Scoring-Risiko und zielgebundene Vorbereitung rechtfertigen einen eigenen Owner. Entscheidend ist die Parent-Bindung vom Scouten oder Funding bis zum konkreten Zugriff. |
| [Runner Hand-/Boardentwicklung](../../../packages/ai/src/runner/hand-development/development-plan-module.ts) | Eigenständig gegenüber akutem Coverage-Bedarf. Die Dateistichprobe zeigt vermischte Vorprüfung, Fortsetzung und Disposition bei eingeschränkter Aktionskapazität. |
| [Runner Run-Window](../../../packages/ai/src/runner/run-window/run-window-plan-module.ts) | Ein aktiver Run mit wechselnden rechtlichen Fenstern braucht einen gemeinsamen fachlichen Owner. Die Laufzeitabhängigkeiten vor allem auf Choice-Auflösung aus aktuellem versus gespeichertem Portfolio prüfen. |
| [Runner Zugabschluss](../../../packages/ai/src/plans/turn-completion-plan-module.ts) | Dasselbe Modul wie bei Corp mit eigenem Side-Profil. Zulassung und Schutz aktiver Handlungsverpflichtungen sind ein gemeinsamer Vertrag. |
| [Corp Score](../../../packages/ai/src/corp/score/score-plan-module.ts) | Agenda-Projekt, Ziel und Konversion bilden einen Owner. Geplante ICE-Abdeckung bleibt Bedarf an Defense. Score-Projektion und Dispositionszeugen im TurnPlanner sind die wichtigste Übergabe. |
| [Corp Scoring-Remote](../../../packages/ai/src/corp/scoring-remote/scoring-remote-plan-module.ts) | Kleines Modul mit nachvollziehbarem Unterschied zum Agenda-Projekt. Der eigene Lebenszyklus ist der Aufbau eines wieder nutzbaren Servers. Schutz gegen Runner-Zugriff bleibt bei Defense. |
| [Corp Defense](../../../packages/ai/src/corp/defense/defense-plan-module.ts) | Global als ein Owner richtig. Hier liegt der größte fachinterne Vereinfachungshebel. Quotenprüfung, Routenvergleich und Ausschlussgründe gemeinsam prüfen, bevor weitere Dateien extrahiert werden. |
| [Corp Economy](../../../packages/ai/src/corp/economy/economy-plan-module.ts) | Liquidität, Anlage und zweckgebundene Finanzierung bilden einen plausiblen Owner. ICE-Verwertung muss materialgebunden und von Defense freigegeben bleiben. |
| [Corp Virusdruck](../../../packages/ai/src/corp/virus-pressure/virus-pressure-plan-module.ts) | Kleine spezifische Aufgabe. Den Grenzfall akuter Virusgefahr bei gleichzeitigem bindendem Score- oder Rez-Bedarf erhalten. |
| [Corp Punish-Kampagne](../../../packages/ai/src/corp/punish/punish-campaign-plan-module.ts) | Mehrzügiges Ziel mit Nutzen, Blockern und Ressourcenbedarf unterscheidet sich von der exakten Ausführung. Quote-Verfügbarkeit muss offen und diagnostizierbar bleiben. |
| [Corp Punish-Ausführung](../../../packages/ai/src/corp/punish/punish-sequence-plan-module.ts) | Kleiner ausführender Plan am gebundenen Kampagnenziel. Kampagne und Ausführung teilen sinnvoll das Verzeichnis. Die Ausführung darf bei unterbrochener Route keine andere Payoff-Linie still übernehmen. |
| [Corp Ambush/Bluff](../../../packages/ai/src/corp/ambush/ambush-plan-module.ts) | Täuschung und exakte Access-Choice haben einen eigenen Zweck. Die knappe Grenze ist die Vorrangentscheidung gegenüber tatsächlicher Score-Agenda und berechneter Defense-Reserve. |
| [Corp Hand-/Agenda-Management](../../../packages/ai/src/corp/hand-management/hand-management-plan-module.ts) | Handplatz, Cleanup und kontrolliertes Ziehen sind kohärent. HQ-Risiko und Fortschritt eines Score-Projekts als Information einbinden; für dieselbe Agenda darf die Platzentscheidung den Score-Parent nicht loslösen. |
| [Corp Zugabschluss](../../../packages/ai/src/plans/turn-completion-plan-module.ts) | Kleines gemeinsames Modul. Corp-spezifischer Gegenfall ist das noch offene produktive Rez-Fenster nach dem letzten Klick. |

Diese Matrix bewertet die fachliche Abgrenzung und die belegten Übergaben.
Jede mögliche Kartenfolge, die Taktikqualität und die Laufzeit aller Owner
waren nicht Gegenstand einzelner Vollprüfungen.

## Fünf zufällig gezogene Quelldateien

Gleichverteilte Ziehung ohne Zurücklegen aus der sortierten Git-Dateiliste
unter `packages/ai/src`. Seed `1692744855` und `.NET System.Random`. Der
Ziehungspool aus 1.003 TypeScript-Pfaden schloss Tests aus. Die 19
`*.test-support.ts` waren im ursprünglichen Pool und bei der Auswertung
ausgeschlossen. Keine der fünf Ziehungen traf eine Testhilfe. So sind es die
ersten fünf zulässigen Treffer einer zufälligen Reihenfolge der 984 Dateien.

1. [development-restricted-sequence.ts](../../../packages/ai/src/runner/hand-development/development-restricted-sequence.ts)
   · **Nacharbeit mit konkretem Nutzen.** Die laufende Sequenz verlangt eine
   frühere Bindung, prüft Karten und Reihenfolge und erlaubt nur die passende
   Installations- oder Stoppaktion. Die Vorprüfung verbindet dagegen mehrere
   Aufgaben. Sie scannt bei 20 Optionen alle 1.048.575 nichtleeren Teilmengen,
   obwohl die Kapazitätsprüfung erst danach erfolgt. Bei 21 Optionen verwirft
   sie das Angebot pauschal. Valu-Pak bietet fünf Installationen. Schon die
   direkte Enumeration von Kombinationen bis zu fünf Elementen würde bei
   20 Optionen nur 21.679 Kombinationen der Größe zwei bis fünf betrachten.
   Der Extremfall wurde im Spiel nicht gemessen. Erst vorhandene Bindung und
   deterministische Reihenfolge sichern. Dann eine Suche mit klarer Grenze aus
   Kapazität und Kosten verwenden und das Verhalten oberhalb der bisherigen
   Grenze gezielt prüfen. Nebenbei die LegalAction und Projektion derselben
   Kreditquote prüfen. Aktuell validiert der Code den Rohwert, konsumiert aber
   die Projektion mit `?? 0`. Der `_candidates`-Parameter ist ungenutzt. Die
   Prüfung und der Signalpfad rufen dieselbe Fortschrittsfunktion getrennt auf.
   [Vorprüfung](../../../packages/ai/src/runner/hand-development/development-restricted-sequence.ts#L52) · [Suchschleife](../../../packages/ai/src/runner/hand-development/development-restricted-sequence.ts#L151) · [Fortsetzung](../../../packages/ai/src/runner/hand-development/development-restricted-sequence.ts#L407) · [Engine-Kartenspezifikation](../../../packages/cards/src/specs/originalset-v1/onr_v1_117_valu-pak-software-bundle.card-spec.ts#L48)
2. [program-trash-signal.ts](../../../packages/ai/src/corp/defense/program-trash-signal.ts)
   · **Kohärent mit engem Diagnosepunkt.** Der Owner wählt das Ziel einmal und
   bindet es an Choice, StateVersion, Quelle und Encounter oder Trace. Der
   Resolver prüft die Bindung erneut und liefert nur die Option. Der frühe
   Rücksprung bei passender PendingChoice ohne passende LegalAction liegt im
   selben Rückgabepfad wie eine fachlich unpassende Choice. Bevor eine Sonder-
   diagnose ergänzt wird, den passenden Gegenfall über den vorhandenen
   Schedulerfehler prüfen und die aussagekräftigste Stelle wählen. Der
   bestehende isolierte Ranglistentest belegt vor allem die Zielbewertung.
   [Signal](../../../packages/ai/src/corp/defense/program-trash-signal.ts#L15) · [Resolver](../../../packages/ai/src/runtime/corp-program-trash-choice.ts#L12) · [Ranking-Test](../../../packages/ai/src/runtime/corp-program-trash-choice.test.ts)
3. [role-match.ts](../../../packages/ai/src/role-match.ts)
   · **Kleine, weitgehend gute Utility.** Exakte Tokens, Präfixe und mehrteilige
   Rollen sind mit Gegenfällen getestet. Beide Token-Caches sind begrenzt.
   Alle Aufrufer verwenden jetzt die gemeinsame private Quelldatei. Der
   Exportvertrag schützt diesen Pfad und der reine Runtime-Re-Export ist
   entfernt. Der mögliche Wechsel von `Set` zu `includes` bleibt eine
   Messfrage. [Matcher](../../../packages/ai/src/role-match.ts) · [Tests](../../../packages/ai/src/role-match.test.ts)
4. [punish-route-quote-input.ts](../../../packages/ai/src/corp/punish/punish-route-quote-input.ts)
   · **Sinnvolle Quote-Grenze mit Fehlerbehandlungsbedarf.** Sichtbare Quellen
   werden fachlich klassifiziert und als begrenzte Anfrage an die Engine gegeben.
   Die Antwort wird gegen Request-Echo, StateVersion und aktuelle Aktion
   gebunden. Die Auswahl von höchstens acht Anfragen zu je höchstens sechs Steps
   begrenzt die Engine-Arbeit. Wie viel Vorarbeit die variierende Zahl sichtbarer
   Quellen tatsächlich kostet, bleibt eine Messfrage. F1 zuerst beheben. Bei
   weiteren Fähigkeiten prüfen, ob Komponentenerkennung, Begrenzung der
   Anfragen und Antwortverarbeitung eigene Funktionsgrenzen brauchen. Die
   begrenzte Kandidatensuche ist eine Vorschau, deren Ergebnisse allein keine
   Ausführung autorisieren. [Anfragen](../../../packages/ai/src/corp/punish/punish-route-quote-input.ts#L100) · [Begrenzte Kombinationen](../../../packages/ai/src/corp/punish/punish-route-quote-input.ts#L481) · [Antwortbindung](../../../packages/ai/src/corp/punish/punish-route-quote-input.ts#L623)
5. [tactical-plan-contract-types.ts](../../../packages/ai/src/plans/tactical-plan-contract-types.ts)
   · **Die Bezeichnung präzisiert die Zuständigkeit.** Die gemeinsame
   Typdatei beschreibt taktische Kategorien, Steps und Ziele. Sie wird vom
   taktischen Plan und von der taktischen Portfolioprojektion importiert.
   Gespeicherte Typkennungen bleiben an die jeweiligen Checkpoints gebunden.
   [Taktisches Portfolio](../../../packages/ai/src/plans/plan-portfolio-types.ts#L34) · [Live-Planmodulvertrag](../../../packages/ai/src/plans/plan-scheduler.ts#L97)

## Abnahme der ersten Prüfung

Im Erstreview liefen Struktur- und Reachability-Check sowie 58 fokussierte Tests
in fünf Testdateien. Darunter Quote-Fehlerfälle, Rollenabgleich, Valu-Pak,
Programm-Trash-Ranking und Corp-Schadensquotes mit der echten Engine. Die
15 Valu-Pak-Treffer wurden per Namensfilter ausgeführt. Zwei Fälle verwenden
den expliziten Vergleichsmodus. Die Integration der beiden anschließenden
Änderungscommits wurde auf `main` mit 165 fokussierten Tests überprüft.

## Corp Defense und erneute Planner-Bewertung

Die aktuelle [Quotenbindung](../../../packages/ai/src/corp/defense/defense-current-route-quotes.ts)
prüft Installations- und Rez-Routen gegen den tatsächlichen Frame. Die
Funktionen für Schutzvergleich, Allokation und Disposition verbleiben im
[Defense-Modul](../../../packages/ai/src/corp/defense/defense-plan-module.ts).
Zwei deterministische Läufe mit den Seeds `maintainability-1` und
`maintainability-2` über je 160 Aktionen lieferten vor und nach der Extraktion
dieselben Action-IDs, Zielserver, Owner-Bindungen und StateHashes. Enthalten
waren 15 Installationen und 9 Rez-Aktionen von `corp.defend_servers`.
162 fokussierte Defense-Tests liefen grün. Der anschließende Lauf mit
26 Tests sicherte Live-Autorität, Power Grid und die bestehenden
Verträge der geprüften Funktionen ab. KI-Strukturgates und AI-Typecheck
liefen grün. Der frühere Gesamtlauf mit zehn bestätigten Baseline-Fehlern
ist als Ergebnis des ersten Umsetzungsschritts zu lesen.

Im Seed `maintainability-1` wurde `currentPlanAssessmentState` für zwei
native Hauptfenster vor der Supportbindung instrumentiert. Verglichen
wurde der serialisierte validierte Assessmentwert je Planinstanz. Der
35-Aktionen-Lauf blieb replayfähig und fehlerfrei. Die Instrumentierung
war lokal und wurde nach dem Lauf entfernt.

| Frame | Aktionskandidaten | Assessments vorher und nachher | Inhaltlich gleich | Veränderung zwischen beiden Phasen |
| --- | ---: | ---: | ---: | --- |
| Corp, StateVersion 3 | 14 | 3 / 3 | 2 | Defense wird Executor. Das Feld `continuity` einer Instanz ändert sich. |
| Runner, StateVersion 7 | 9 | 7 / 7 | 6 | Central Pressure wird Executor. Das Feld `continuity` einer Instanz ändert sich. |

Damit ist wiederholte Arbeit in beiden Frames messbar. Die Gleichheit
einzelner Ergebnisse belegt keine allgemeine Unabhängigkeit vom Portfolio.
Eine gemeinsame Vorberechnung braucht einen expliziten Vertrag darüber,
welche Fakten von Executorrolle, offenen Needs und Support abhängen.
Die produktive Assessment-Reihenfolge bleibt bestehen.
[Scheduler](../../../packages/ai/src/plans/plan-scheduler.ts#L265) ·
[TurnPlanner-Enumeration](../../../packages/ai/src/plans/plan-scheduler.ts#L375)

Vor dem Folgeschritt wählten 22 KI-Testdateien `legacy_compare` explizit.
Die Anwendungs- und Script-Suche fand keinen produktiven Aufrufer. Der
[Live-Autoritätstest](../../../packages/ai/src/evaluation/real-engine-default-runtime.test.ts)
benötigt den Modus als bewussten Gegenfall für sonst legale Aktionen.
[Historische Shadow-Baselines](../../../packages/ai/src/simulation/turn-planner-shadow-baseline-regressions.test.ts)
brauchen eine Entscheidung, welche ihrer Aussagen als aktueller Replayvertrag
gelten sollen. Fachtests zu Punish, Rez, Runrisiko und Choice-Bindungen sollten
das produktive Verhalten prüfen. Die [Power-Grid-Fälle](../../../packages/ai/src/runtime/corp-punish-route-power-grid-real-engine.test.ts)
laufen jetzt im Standardpfad. Exakte Finanzierung, Action-ID und Auswahl
blieben in allen sechs Tests erhalten. 21 KI-Testdateien wählen den
Vergleichsmodus weiterhin. Einige verwenden DTOs ohne aktuellen
`PlanningRulesContext`, etwa die [Encounter-Defense-Tests](../../../packages/ai/src/runtime/corp-paid-encounter-defense.test.ts#L84).
Solche Tests brauchen zuerst einen aktuellen Engine-Eingang. Ältere
Portfolio-Exporte haben weiterhin Checkpoint-Aufrufer. Der Re-Export des
Rollenmatchers ist noch im Exportvertrag aufgeführt.
[Checkpoint-Speicher](../../../packages/ai/src/evaluation/decision-checkpoints/runtime-checkpoint.ts#L37) ·
[Importvertrag](../../../packages/ai/src/public-export-contract.test.ts#L184)

## Zweite Zufallsstichprobe

Gezogen ohne Zurücklegen aus 979 sortierten Git-Pfaden unter `packages/ai/src`,
mit `.NET System.Random` und Seed `365401174`. Tests, Testhilfen und die
Dateinamen der ersten Stichprobe waren ausgeschlossen. Dadurch blieben auch
beide gleichnamigen `role-match.ts`-Pfade außerhalb des Ziehungspools.

### `benchmark-deck-reference-label.ts`

**Kohärent, geringe Pflegepriorität.** Alle fünf Referenzvarianten liefern
eine lesbare Anzeige. Gleiche IDs ergeben für gespeicherte und eingefrorene
Snapshots bewusst denselben Text. Der Slot-Runner übernimmt das Label auch
bei ausstehenden oder abgewiesenen Decks und verwendet den Resolver mit der
vollen Referenz für den tatsächlichen Benchmark. `slotId` bleibt ein eigenes
Feld. Der Formatter verwendet jetzt die kanonische Referenzunion. Der
Typecheck prüft bei Erweiterungen unmittelbar die Vollständigkeit der
Variantenzweige. [Formatter](../../../packages/ai/src/simulation/benchmark-deck-reference-label.ts) ·
[Kanonische Typen](../../../packages/ai/src/simulation/benchmark-deck-types.ts#L38) ·
[Verbraucher](../../../packages/ai/src/simulation/benchmark-deck-slot-runner.ts#L17)

### `score-counter-bank-funding.ts`

**Fachlich sinnvoll, an der Eingabegrenze zu großzügig.** Score schützt
Counter-Investitionen und gibt sie bei einem belegten höherwertigen
Abschluss frei. Der eigene Abschluss kann die dafür gebundenen Counter
auch im Prioritätsfall nicht ein zweites Mal verbrauchen. Die Matrix der
vorhandenen Tests deckt geschützte und freigegebene Banken, liquide Credits
und den Doppelverbrauch ab. Reproduzierte Gegenprobe auf dem Checkpoint
`cp-meta-461-r6-g40-d98`: Die projizierten Kosten `NaN`, `-1`, `0.5` und
`"1"` passieren mangels bindendem Claim. Fehlt bei positivem Preis die
Quelle und einem verglichenen Projekt zugleich die Bank, wird im ersten
Vergleich `undefined === undefined` wahr. Der anschließende Zugriff wirft
einen `TypeError`. Eine gewöhnliche aktive Engine-Aktion mit solchen Daten
wurde nicht beobachtet. P2 für den Eingangsvertrag. Bei vorhandener
Kostenangabe nur eine gebundene Quelle und nichtnegative sichere Ganzzahl
akzeptieren. Positive Cases für Basic Credits, fremde freigegebene Bank
und geschützte Bank erhalten. [Filter](../../../packages/ai/src/corp/score/score-counter-bank-funding.ts#L13) ·
[Funding-Aufrufer](../../../packages/ai/src/corp/economy/economy-signals.ts#L1276) ·
[Fachtests](../../../packages/ai/src/corp/score/score-counter-bank-funding.test.ts)

### `defense-validation.ts`

**Relevante Grenze mit belegten Lücken.** Die Datei prüft numerische
Grenzen bei Credits und Agenda-Punkten, die Familien variabler Rez-Kosten
und die Struktur der Defense-Signale. In Gegenproben akzeptiert
`validExactIceRezRoute` eine unbekannte `routeKind`, wenn die allgemeine
Schutzbewertung gültig aussieht. `resourceExchange: null` im passenden
Routentyp wirft einen `TypeError`. Ein Signal `resolve_program_trash`
passiert ohne `choiceResolution`. Beim Kuvertvergleich gelten verschiedene
`variableRezChoice`-Werte bei sonst gleich aufgebauten Kosten als gleich.
Die nachgelagerte Bindung vergleicht aktuelle Engine-Quotes und hindert die
Gegenproben daran, eine neue Ausführungsberechtigung zu belegen. Die
Strukturprüfung sollte ihren eigenen Anspruch dennoch erfüllen. P1 für
die Validatoren. Pro `routeKind` nur die zugehörige Form zulassen, fehlende
Pflichtbindungen explizit ablehnen und die exakte Rez-Variante mitprüfen.
Abnahme mit ungültigen Formen und Varianten sowie unverändertem realem
Installations-, Rez- und Choice-Pfad. Die Extraktion der aktuellen
Quotenbindung enthält keine Korrektur dieser separaten Befunde.
[Kostenvergleich](../../../packages/ai/src/corp/defense/defense-validation.ts#L26) ·
[Routenvalidator](../../../packages/ai/src/corp/defense/defense-validation.ts#L707) ·
[Signalprüfung](../../../packages/ai/src/corp/defense/defense-validation.ts#L1028)

### `simulation-profile-run.ts`

**Konkreter Berichtsbefund, P2.** Pro Seed werden Controller und
Simulationszufall reproduzierbar gebunden, die Rohresultate bleiben im
Profil erhalten. Die Summe der Aktionen wird jedoch per `|| 1` auch für
die spätere Durchschnittsberechnung geändert. Ein echter Lauf mit
`maxActions: 0` meldet daher 1,0 statt 0,0 Durchschnittsaktionen. Derselbe
Seed bei `maxActions: 1` hat dieselbe `simulationId`, obwohl die beiden
Läufe unterschiedliche Grenzen und Rohresultate besitzen. Zudem fließen
`runtime_failure`-Ergebnisse in den Nenner, erscheinen jedoch in keinem
eigenen Ergebnisanteil. Replayfehler und Rohsummaries bleiben sichtbar.
Die Korrektur hält die Aktionssumme unverändert und berechnet Raten mit
eigenen Nennern. Die Kennung verwendet die geordnete Seedliste und die
effektive Spiel- und Regressionseinstellung. Technische Ausgänge erhalten
einen eigenen Ergebnisanteil. Das Quality Gate erkennt eine Zunahme auch
bei intaktem Replay.
[Berechnung und Kennung](../../../packages/ai/src/simulation/simulation-profile-run.ts) ·
[Quality Gate](../../../packages/ai/src/simulation/simulation-quality-gate.ts) ·
[Regressionstests](../../../packages/ai/src/simulation/simulation-quality-gate.test.ts)

### `corp-advancement-counter-choice.ts`

**Die planlose Bewertung ist historisch, die Parsergrenze braucht Arbeit.**
Der einzige produktive Aufrufer verlangt zuerst `residentCorpScoreChoiceBinding`.
Die Bindung liefert entweder eine exakte Move- oder eine exakte
Placement-Fortsetzung. Der generische Punktevergleich in der Datei lebt
in direkten Tests weiter. Für Placements parsen Score-Bindung und Resolver
denselben Engine-Optionswert getrennt. Beide akzeptieren bei einem Wert wie
`agenda-1:1:extra` das geplante Placement `agenda-1:1`. Die direkte
Gegenprobe liefert die betreffende Option-ID. Die Engine erzeugt aktuell
kanonische Optionen. Ein im Spiel fehlerhaft platzierter Counter wurde
nicht beobachtet. P2 für einen einzigen exakten Parser an der
Score-Fortsetzung und für das Entfernen der planlosen Rangfolge nach
Prüfung ihrer restlichen Testfunktion. Abnahme über gültige Mehrfachziele,
Move-Bindung, fehlerhafte Segmente und richtige StateVersion.
Die alte Optionsauflösung ist entfernt. Der Score-Owner bestimmt heute
die exakte Engine-Option in einer gemeinsamen Bindung.
[Score-Bindung](../../../packages/ai/src/corp/score/score-choice-binding.ts#L270) ·
[Choice-Tests](../../../packages/ai/src/runtime/selected-choices-for-decision.test.ts)

Die Corp-Vertragshärtungen bestanden 502 fokussierte Tests in 17 Dateien.
Die beiden Vergleichsläufe mit `maintainability-1` und `maintainability-2`
lieferten über je 160 Aktionen identische Aktions-, Zielserver-, Owner-
und StateHash-Folgen. Die neuen Gegenproben prüfen Routenart,
Programm-Trash-Bindung, konkrete Rez-Variante, Advancement-Optionswert
und Counter-Funding-Eingaben.

Die kanonischen Corp-Verträge enthalten die abgesicherten Regeln für
Defense, Advancement und Counter-Funding. Die
[Simulationstestmatrix](../../architecture/ai/simulation-test-matrix.md#benchmarkprofile)
enthält den Vertrag für Benchmark-Kennung und Ergebnisanteile.

Die Folgeänderungen bestanden 85 fokussierte Tests in zehn Dateien.
Darunter sind Grenzfälle für Laufkennungen und technische Abbrüche, die
fünf Deckreferenzarten, Rollenabgleich, Portfolios und das Live-Engine-Gate
des Standardmodus.

## Dritte Zufallsstichprobe mit zehn Dateien

Quellstand `a7893afaf`. Ziehung ohne Zurücklegen aus 975 ordinal sortierten
Git-Pfaden unter `packages/ai/src` mit `.NET System.Random`, Seed `1171637022`.
Für die Positionen 0 bis 9 wurde jeweils `Next(i, pool.Count)` gezogen und
getauscht. Tests, Testhilfen und die Dateinamen der beiden bisherigen
Stichproben einschließlich des umbenannten taktischen Typvertrags waren
ausgeschlossen.

Die Datei mit dem Purge-Typvertrag führte zu einem reproduzierten Owner-
Problem. Im Trace-Pfad liegen widersprüchliche Bewertungen desselben
Schadensfalls vor. Die übrigen konkreten Gegenproben betreffen Vertragsgrenzen
und Berichtsqualität. Kleine Typdateien können als gemeinsame Grenze sinnvoll
sein. Bei den großen Dateien lohnt ein Schnitt entlang der belegten
Verantwortungen. P1 bezeichnet den nächsten fachlichen Fix, P2 einen
Vertrags- oder Befundfix und P3 eine Wartbarkeitsmaßnahme. Aufwände sind grobe
Schätzungen inklusive fokussierter Regression.

### 1. `corp-access-payment-choice.ts`

**P2, Gegenprobe auf nativem Checkpoint.** Die vorhandene Bindung schützt
Choice, Kosten, aktuelle LegalAction und StateVersion. Die nativen Beispiele
prüfen sowohl die berechtigte Ablehnung beim letzten Zugriff als auch den
sinnvollen Pay-Fall. Im Checkpoint `meta-530-g3d108` erzeugt der künstlich von
0 auf 97 geänderte Effektindex denselben `decline`-Witness. Die Engine
erzeugt den Index für den konkreten Zugriffseffekt. Die KI prüft nur, ob
er eine nichtnegative Ganzzahl ergibt. Die Ablaufprüfung wählt den Effekt
anschließend nach Zone und Eindeutigkeit. Ein heutiger normaler Engine-Lauf
mit falschem Index ist hier unbelegt. Eine gemeinsame Bindung des exakten Zugriffseffekts für Signal und
Payload-Resolver kostet geschätzt einen halben bis ganzen Tag. Abnahme über die bestehenden nativen Pay- und
Decline-Fälle sowie die Gegenprobe mit falschem Index.
[Signal](../../../packages/ai/src/corp/ambush/corp-access-payment-choice.ts#L35) · [Ablaufprüfung](../../../packages/ai/src/corp/ambush/access-target-expiry.ts#L16) · [Engine-Quelle](../../../packages/engine/src/game/access/access-effect-execution.ts#L407) · [Native Tests](../../../packages/ai/src/runtime/meta-530-access-target-expiry.test.ts)

### 2. `hand-draw-horizon.ts`

**P2, Gegenprobe auf gespeichertem Engine-Input.** Zweck und feste
Schwelle von drei R&D-Karten sind im Owner-Vertrag beschrieben. Die
Guard-Kette deckt insbesondere Netto-Handgröße, unbekannte Quote und
unauflösbare Ziele ab. In `cp-meta-434-r4-g34-d436` liefert die Funktion
weiterhin genau ein `exactActionRoute`-Signal, wenn nur der Timingpunkt der
Replenishment-LegalAction von `corp_action.main` auf `game.checkpoint`
verändert wird. Der normale Engine-Input lieferte die korrekte Bindung.
Timing und Version lassen sich im selben Guard binden. Einmal gelesene
Netto-Deltas direkt verengen und die berechnete R&D-Restgröße wiederverwenden.
Geschätzt zwei bis vier Stunden. Abnahme mit verändertem Timing, unveränderter
Engine-Route und den vorhandenen Handkapazitätsfällen.
[Signal](../../../packages/ai/src/corp/hand-management/hand-draw-horizon.ts#L14) · [Vertrag](../../architecture/ai/corp-plan-contracts.md#10-corphand_and_agenda_management) · [Replenishment-Tests](../../../packages/ai/src/evaluation/decision-checkpoints/meta-434-round4-causes.test.ts#L110)

### 3. `selfplay-promotion-activity-formatters.ts`

**P2, mit zwei synthetischen Queue-Einträgen reproduziert.** Zwei
verschiedene IDs mit demselben langen Szenariohinweis erzeugen denselben
Dateinamen. Die Trunkierung auf 120 Zeichen schneidet die abschließende
Snapshot-ID ab. Der Formatter liefert einen Vorschlag mit
`writeAllowed: false`. Der gefundene Aufrufer ist ein Test und es
wurde keine Datei überschrieben. Bei Nutzung für manuelle Triage
einen festen Teil des Dateinamens für einen stabilen Fingerprint aus der
rohen Snapshot-ID reservieren. Aufwand zwei bis vier Stunden. Abnahme mit
beiden langen Einträgen, normalisierten Satzzeichen und stabiler Zuordnung
auch bei umgekehrter Queue-Reihenfolge.
[Dateiname](../../../packages/ai/src/reports/selfplay-promotion-activity-formatters.ts#L29) · [Trunkierung](../../../packages/ai/src/reports/selfplay-promotion-activity-formatters.ts#L95) · [Queue](../../../packages/ai/src/evaluation/selfplay-decision-snapshot-mining.ts#L232)

### 4. `corp/economy/economy-types.ts`

**P3, statischer Vertragsbefund.** Die diskriminierte Union für Economy-
Needs kennzeichnet die einzelnen Pfade gut. Nur der Parent-Funding-Vertrag
speichert Hosted-Bank-Quote und Free-Rez-Payout sowohl oben am Signal als
auch innerhalb von `fundingRouteAssessment`. Discovery kopiert dieselben
Werte in beide Felder. Der Owner hält die beiden Kopien in mehreren Phasen
mit `JSON.stringify` paarweise gleich. Das Typsystem lässt widersprüchliche
Kopien zu und zusätzliche Felder müssen in mehreren Prüfungen gepflegt
werden. Je aktiver Funding-Route einen kanonischen Beleg verwenden und die
vorhandene Revalidierung gegen die aktuelle Engine-Quote erhalten.
Aufwand ein bis zwei Tage. Abnahme über Hosted-Bank-Funding für Score und
Defense, Free-Rez und einen veralteten Routenbeleg.
[Doppelter Vertrag](../../../packages/ai/src/corp/economy/economy-types.ts#L28) · [Discovery](../../../packages/ai/src/corp/economy/economy-discovery.ts#L210) · [Revalidierung](../../../packages/ai/src/corp/economy/economy-plan-module.ts#L192)

### 5. `runtime/trace-bid-assessment.ts`

**P1, Engine-Resolver und synthetische Gegenproben.** Bei zwei Punkten
unvermeidbarem Homewrecker-Schaden bewertet die KI zwei Handkarten als
`terminal`, der Engine-Schadensresolver entfernt beide Karten, der Runner
lebt. Mit leerer Hand bewertet die KI den Effekt als `high`, derselbe
Resolver liefert einen Flatline. Der Unterschied wirkt auf Reserve, Varianz
und die Auswahl sicherer Gebote. Eine mutierte klassische Choice behält
zudem ein gesperrtes `bid_5` als gewählten Kandidaten. Eine künstlich
hinzugefügte Encounter-Quote von Hunter überstimmt den laufenden
Homewrecker-Trace mit einem Tag-Effekt. Aktuell angebotene Engine-Trace-
Gebote mit gesperrten Optionen wurden nicht beobachtet. Die beiden
Mutationen belegen die jeweiligen Vertragslücken.

Die Flatline-Grenze in Einstufung und Mindest-Link einheitlich an der
Engine-Regel ausrichten. Geschätzt ein bis zwei Tage für die fachlichen
Korrekturen. Den Effekt einmal
am aktiven Trace und, soweit erforderlich, an seiner genauen Quelle und
Subroutine binden. Die zugelassenen Gebote gegen das aktuelle Choice-Angebot
filtern. Getrennt davon lassen sich die wiederholte Effektauflösung und der
zweifache Aufbau von Schadensprofilen konsolidieren. Abnahme für leere,
genau ausreichende und größere Hand, konkurrierende Trace-Quellen, gesperrte
Gebote und deterministisches Replay.
[Gebotsfilter](../../../packages/ai/src/runtime/trace-bid-assessment.ts#L55) · [Effektauflösung](../../../packages/ai/src/runtime/trace-bid-assessment.ts#L666) · [Stakes und Mindest-Link](../../../packages/ai/src/runtime/trace-bid-assessment.ts#L688) · [Engine-Schadensgrenze](../../../packages/engine/src/game/damage/damage-event-resolution.ts#L53)

### 6. `runner-run-origin-contract.ts`

**Tragfähige Schichtgrenze, kein eigener Umbau.** Ein kleiner Typvertrag
bewahrt Parent, Run-Zweck, Zugriffsbudget, Risk- und Information-Witness
zwischen Central Pressure, Remote Contest und dem Run-Window.
Der diskriminierte Parent schützt die Zuordnung von Signal und Modul-ID.
Der wirksame Prüfpunkt liegt beim Producer. Er liest heterogenen residenten
`moduleState`, kopiert Teilobjekte und validiert sie mit unterschiedlichen
Guards. Falls eine weitere Run-Herkunft nötig wird, dort einen gemeinsamen
typisierten Producer mit Gegenprobe für widersprüchliche Parent-/Server-
Bindung verwenden. Bestehende Post-Pass- und Multiaccess-Evidence schützt
die aktuelle Übergabe.
[Typgrenze](../../../packages/ai/src/plans/runner-run-origin-contract.ts#L9) · [Producer](../../../packages/ai/src/runner/run-window/run-window-origin.ts#L44) · [Nativer Multiaccess-Test](../../../packages/ai/src/runner/run-window/deep704-bound-multiaccess-post-pass.native.test.ts)

### 7. `runner-viral15-jack-out-score.ts`

**P3, statischer Aufrufbefund.** Die Funktion und ihr Context-Wrapper
werden über die Runner-Support-Composition verdrahtet. Die Rückgabeeigenschaft
`runnerViral15JackOutScoreComponent` hat außerhalb der Verdrahtung
keinen lesenden Consumer im Workspace, in der Simulations-Composition
steht ein alter Typname. Die aktive Run-Window-Bewertung nutzt ihre
eigenen gebundenen Encounter-Fakten. Die alte Datei ist damit über Imports
erreichbar, ihr Score hat keinen belegten Entscheidungs- oder Diagnose-
Consumer. Nach einem direkten Vorher-nachher-Lauf mit der bestehenden
Viral-15-Evidence den Score, seinen Adapter und tote Schlüssel zusammen
entfernen. Geschätzt ein halber Tag. Abnahme über dieselbe gebundene
Mitigation, LegalAction und StateHash-Folge im Vergleichsfall.
[Viral-15-Checkpoint](../../../packages/ai/src/evaluation/decision-checkpoints/match-23d6-runner-remediation-decision-checkpoints.test.ts)

### 8. `corp/punish/punish-signals.ts`

**P3, statischer Pflege- und Arbeitsaufwand.** Das Modul hält unbekannte
Quotes als Beobachtungszustand ohne ausführbare Action. Für gültige Quotes
bewertet es jede Route bei der Signalerzeugung und erneut im Sortiervergleich.
Der ältere Pfad ist weiterhin produktiv für Vorbereitung und Basic Resource
Trash. Er bildet für viele einzelne Kandidaten dieselben sichtbaren
Definitionsdaten und berechnet Nicht-Prepare-Phasen, die er am Ende
verwirft. Die fachliche Quote-Bewertung je Route wiederverwenden. Die produktive
Preparation/Trash-Projektion mit entscheidungslokalen Fakten präzise
benennen und abgrenzen. Geschätzt ein bis zwei Tage. Die
bestehenden Tie-Breaker, die Behandlung unbekannter Quotes und die
Score-Remote-Grenze mit nativen Linien für Credit Trash und Trace prüfen.
Eine messbare Laufzeitersparnis ist noch offen.
[Route-Auswahl](../../../packages/ai/src/corp/punish/punish-signals.ts#L254) · [Erneute Bewertung](../../../packages/ai/src/corp/punish/punish-signals.ts#L521) · [Vorbereitung](../../../packages/ai/src/corp/punish/punish-signals.ts#L709) · [Closed-Accounts-Fachtest](../../../packages/ai/src/runtime/corp-punish-route-closed-accounts-real-engine.test.ts)

### 9. `runner/hand-development/development-choice-bindings.ts`

**P2, Gegenprobe an der Fortsetzungsgrenze.** Die Datei bindet Delayed
Program Search, Recovery, Event Install und MU-Trash an ihre jeweiligen
Owner und vorherigen Aktionen. Eine mutierte `nonsearch`-Quellkennung
mit `%ZZ` wirft beim Decode einen rohen `URIError`, noch bevor die
strukturierte Fortsetzungsdiagnose greift. Dieselbe Quellkennung wird in
der Payload-Auflösung separat dekodiert. Die Engine erzeugt gültige Teile
mit `encodeURIComponent`. Ein gemeinsamer Parser für dieses Quellformat kann beide Grenzen bedienen
und die strukturierten Choice-Diagnosen erhalten. Geschätzt ein halber bis
ganzer Tag. Danach bei Bedarf
nach fachlicher Choice-Familie schneiden. Für Delayed Search und MU keine
allgemeine Auswahlroutine einführen. Abnahme über native Suche und
Memory-Fortsetzung sowie falsche Quelle, Version und Optionsmenge.
[Window-Auflösung](../../../packages/ai/src/runner/hand-development/development-choice-bindings.ts#L402) · [Payload-Auflösung](../../../packages/ai/src/runtime/selected-choices-for-decision.ts#L2299) · [Engine-Erzeugung](../../../packages/engine/src/game/install/runner-program-install-memory.ts#L92)

### 10. `corp/virus-pressure/virus-pressure-types.ts`

**P1, mit Engine-LegalActions und `applyAction` reproduziert.** In einem
kontrollierten Corp-Hauptfenster mit zwei Virus-Countern auf rezzter Data
Wall in R&D bewertet der Purge-Scorer `purge_virus_counters` mit +1350.
Der Signal-Producer meldet `virusCounters: 0` und `purgeUseful: true`.
Der Owner findet keinen Plan. Die Engine lässt die Aktion zu und entfernt
beide ICE-Counter. Mit zusätzlich zwei Tax-Countern liefert die Engine
gleichzeitig zwei Purge-Aktionen. Der Basis-Purge entfernt ausschließlich
die beiden ICE-Counter dieses Aufbaus, der Runner-Virus-Purge ausschließlich
die beiden Tax-Counter. Das aktuelle Signal stammt von der ersten
Purge-Aktion und der Owner materialisiert generisch beide Typen. Sogar der
Impact-Scorer rechnet Karten-Counter in den Runner-Virus-Purge ein.

Im bestehenden Owner pro aktueller Purge-Action Wirkungsbereich,
LegalAction, Kosten und Nutzen einmal binden. Geschätzt ein bis zwei Tage. Signal, Disposition und Materialisierung
auf denselben Beleg beziehen. Den kleinen Typvertrag dafür erweitern.
Abnahme mit ausschließlich ICE-Druck, ausschließlich Runner-Identitätspool,
beiden verschiedenen Purges und einem unterhalb der Wirkschwelle
liegenden Gegenfall. Beide tatsächlich entfernten Mengen mit der Engine
gegenprüfen.
[Signaltyp](../../../packages/ai/src/corp/virus-pressure/virus-pressure-types.ts) · [Producer](../../../packages/ai/src/corp/virus-pressure/virus-pressure-signals.ts#L8) · [Owner](../../../packages/ai/src/corp/virus-pressure/virus-pressure-plan-module.ts#L19) · [Impact](../../../packages/ai/src/corp/virus-pressure/corp-purge-impact.ts#L31) · [Engine-Ausführung](../../../packages/engine/src/game/turn/turn-basic-execution.ts#L145)

### Abnahme und Reihenfolge

Zuerst die beiden P1-Befunde separat beheben und an nativen Engine-
Aktionen beziehungsweise einem laufenden Trace nachweisen. Danach die
engen Vertragskorrekturen zu Paid Access, Draw-Horizont und Memory-
Fortsetzung sowie den Berichtsnamen. Die drei Wartbarkeitsarbeiten
brauchen jeweils einen eigenen Vorher-nachher-Beleg.

240 bestehende fokussierte Tests in 15 Dateien waren grün. Die separat
beschriebenen Gegenproben liefen im Arbeitsspeicher auf dem geprüften
Quellstand. Für die stärksten Befunde stammen Sicht und LegalActions von
der Engine. Die Schadens- und Purge-Wirkung wurden zusätzlich direkt mit
der Engine geprüft. Aussageumfang sind die dokumentierten Situationen.


### Umsetzung der dritten Stichprobe

Der Virus-Owner bindet seine Bewertung an die jeweils betroffene aktuelle
Purge-Aktion. Die Trace-Bewertung prüft den aktiven Effekt und die
auswählbaren Gebote und verwendet die Flatline-Grenze der Engine. Die
Vertragskorrekturen für Zugriff, Draw-Horizont, MU-Fortsetzung und
Report-Dateinamen sind umgesetzt. Parent-Funding verwendet einen
kanonischen Routenbeleg. Punish bewertet jede Quote beim Aufbau einmal
und hält die Vorbereitung und den Basic Resource Trash als eigene
Signalwege. Der alte Viral-15-Score und sein Adapter sind entfernt. Im
Checkpoint `cp-23d6-01` lieferten beide Stände dieselbe LegalAction,
dieselbe Run-Window-Planinstanz und nach Engine-Ausführung den StateHash
`fnv1a:d911db11`.

Die Abnahme umfasst 298 fokussierte KI-Tests in 23 Dateien und
15 Engine-Tests in drei Dateien. Sie enthält native Fälle für beide
Purge-Aktionen, den Blind-Trace mit sichtbarer Auslösequelle, den
R&D-Timing-Gegenfall und die Free-Rez- und Bankfinanzierung.

## Vierte Zufallsstichprobe mit zehn Dateien

Geprüfter Quellstand `848bc7ffe`. Ziehung ohne Zurücklegen aus 963 ordinal
sortierten Git-Pfaden unter `packages/ai/src` mit `.NET System.Random` und
Seed `1178214394`. Für Positionen 0 bis 9 jeweils `Next(i, pool.Count)`
ziehen und tauschen. Tests, Testhilfen und die Dateinamen der drei
bisherigen Stichproben einschließlich umbenannter Verträge waren
ausgeschlossen. Geprüft wurden Verantwortung, Datenfluss, aktuelle
Nutzung, Fehlergrenzen, Determinismus und Testabdeckung. P1 steht für
den nächsten fachlichen Fix, P2 für begrenzte Vertragskorrekturen und P3
für Wartbarkeit. Aufwand jeweils grob einschließlich fokussierter Tests.

### 1. `runtime/runner-hq-repeat-run-score.ts`

**P3, statisch.** Die kleine Funktion verwendet reines Runner-Wissen und
besitzt Tests für bekannte beziehungsweise veränderte HQ-Handinformation.
Der Funktionswert wird in der Runtime-Komposition weitergereicht. Eine
Suche nach dem Symbol im Workspace findet außerhalb seiner Definition
nur Import und Übergabe, keinen lesenden Consumer. Die aktuelle
Central-Pressure-Strecke wertet den konkreten Access-Payoff und dessen
Aktualität separat am Run aus. Den alten Score samt Verdrahtung nach einem
Vorher-nachher-Vergleich entfernen. Abnahme mit bekannt wertlosem HQ,
geänderter Hand und identischer aktueller Route beziehungsweise Disposition.
Geschätzt ein halber Tag.
[Komposition](../../../packages/ai/src/ai-runtime-public-entrypoints.ts#L235) ·
[Aktueller Routenpfad](../../../packages/ai/src/run-analysis/runner-plan-run-route-facts.ts)

### 2. `runner/shell-traders/shell-traders-dispositions.ts`

**P3, synthetisch reproduziert.** Der Producer kennzeichnet sowohl verdrängte
Coverage-Installationen als auch fachlich abgelehnte Shell-Traders-Aktionen.
Zwei absichtlich überlappende Signale liefern zweimal dieselbe Action-ID
mit unterschiedlichen Gründen. Die aktuelle Runtime dedupliziert gleiche
Action, Owner und Disposition und behält den zuerst gelieferten Grund.
Der Scheduler bekommt im geprüften aktuellen Pfad somit einen Eintrag.
Die Diagnose hängt jedoch von der Signalreihenfolge ab. Bei der nächsten
Änderung an diesem Vertrag die Ablehnung pro Action explizit benennen und
bei Überlappung die Begründung deterministisch auswählen oder bewahren.
Der aktuelle Coverage-Substitutionstest ist eine gute positive Kontrolle.
Geschätzt zwei bis vier Stunden.
[Producer](../../../packages/ai/src/runner/shell-traders/shell-traders-dispositions.ts#L18) ·
[Runtime-Deduplizierung](../../../packages/ai/src/runtime/plan-first-live-runtime.ts#L1437) ·
[Substitutionstest](../../../packages/ai/src/runner/shell-traders/shell-traders-coverage-substitution.test.ts)

### 3. `runner/central-pressure/central-pressure-plan-module.ts`

**P2, reproduziert mit echter LegalAction und mutiertem Plan-Signal.**
Mit der HQ-LegalAction aus `cp-678d-d50-post-break-trash` liefert der
Kandidatendienst dieselbe Route bei fehlendem `runActionIds`, bei explizitem
`runActionIds: []` und bei der Liste mit genau dieser ID. Eine leere Liste
öffnet die breite Serversuche. Der reguläre Signal-Producer setzt bei
gesperrter Cadence zusätzlich `reachable: false`. Die Gegenprobe belegt
eine Vertragslücke, keine Umgehung der Cadence im Originalspiel. Fehlend
und ausdrücklich leer unterscheiden. Eine leere exakte Liste muss null
Routen ergeben. Derselbe Routenwert sollte außerdem den Differential-Payoff
eines Run-Events einmal ermitteln. Die beiden heutigen Aufrufe dienen
Filter und Routenbewertung. Geschätzt ein halber bis ganzer Tag. Abnahme
mit HQ-Kontrollfall und dem nativen Post-Break-Trash-Checkpoint.
[Routenkandidaten](../../../packages/ai/src/runner/central-pressure/central-pressure-plan-module.ts#L297) ·
[Cadence-Producer](../../../packages/ai/src/runner/central-pressure/central-pressure-signals.ts#L1338) ·
[Nativer Test](../../../packages/ai/src/evaluation/decision-checkpoints/match-678d-post-break-trash.test.ts)

### 4. `runtime/runner-development-cashout-admission.ts`

**P2, synthetisch reproduziert.** Die Aufnahmebedingung schützt das
Handpolster und lässt Ausnahmen nur mit passendem Acute-Witness zu.
Bei 2 Credits, 3 Auszahlung und einem widersprüchlichen Need mit Ziel 5,
Lücke 3 und Installationskosten 8 lässt sie die Auszahlung zu und
projiziert nach Installation −3 Credits. Der normale Producer verwendet
mindestens die Installationskosten als Ziel und leitet die Lücke vom
aktuellen Guthaben ab. Daher ist dies eine Lücke an der geprüften
Datenvertragsgrenze. Das Tupel aus Kosten, Ziel und Lücke gemeinsam
validieren. Als separaten Wartbarkeitsschritt Priorität mit dem Kandidaten
führen. Heute schlägt der Sortiervergleich sie je Vergleich erneut in der
gesamten Evaluationsliste nach. Geschätzt ein halber Tag. Die Regression
soll auch den nativen Bank-Floor-Cashout erhalten.
[Aufnahmeprüfung](../../../packages/ai/src/runtime/runner-development-cashout-admission.ts#L106) ·
[Route und Sortierung](../../../packages/ai/src/runtime/runner-development-cashout-admission.ts#L149) ·
[Need-Producer](../../../packages/ai/src/runner/hand-development/hand-development-evaluation.ts#L1631) ·
[Nativer Banktest](../../../packages/ai/src/runner/credit-bank/meta-581-floor-cashout.native.test.ts)

### 5. `runner/rig-coverage/coverage-signals.ts`

**P2 für die Cadence-Grenze, P3 für die Struktur.** Ein künstlich
um eine StateVersion vorausliegender Draw mit derselben `turnSerial`
verbraucht die Draw-Cadence bereits im früheren Frame. Die gemeinsame
History vereinigt View und EventTail. Der Cadence-Vertrag verlangt
zusätzlich die Zeitgrenze des aktuellen Frames. Die Probe zeigt keinen
solchen gemischten Zeitstand im normalen Engine-Lauf. Ein aktueller
Basic Draw oder beobachteter Draw-Effekt muss zählen, das zukünftige
Ereignis nicht. Der terminale Remote-Gegenfall bleibt separat abgedeckt.
Die großen Schleifen für Subtype-Vorbereitung und allgemeine
Breaker-Lücken prüfen denselben Differential-Payoff und dieselben
Remote-Bedingungen wiederholt. Gemeinsame pro Route berechnete Fakten
reduzieren die Gefahr, dass die beiden Pfade künftig auseinanderlaufen.
Geschätzt zwei bis vier Stunden für die Cadence, ein bis zwei Tage für
das gemeinsame Routing mit unveränderten Parent- und Need-Bindungen.
[Cadence](../../../packages/ai/src/runner/rig-coverage/coverage-signals.ts#L54) ·
[Vorbereitungs- und Lückenpfade](../../../packages/ai/src/runner/rig-coverage/coverage-signals.ts#L158) ·
[History](../../../packages/ai/src/runtime/public-event-history.ts#L18) ·
[Nativer Coverage-Test](../../../packages/ai/src/runner/rig-coverage/coverage-credit-draw-real-engine.test.ts)

### 6. `plans/corp-tactical-plan-modules.ts`

**P3, statisch.** Die Factory registriert die taktischen Corp-Module und
hält die Owner übersichtlich. Der separate `corpTacticalActionFamilyOwner`
hat nur Testaufrufer. Sein Choice-Zweig ordnet jede `choice.resolve` dem
Hand-Owner zu, sobald ein erlaubter Handplan existiert, auch ohne
passende Action-ID. Dieser vereinfachte Diagnosepfad sollte keine
eigenständige Aussage über tatsächliche Ownership liefern. Wo die Tests
produktive Ownership behaupten, die heutige Disposition oder die
Materialisierung mit exakter Action-ID prüfen. Den testexklusiven
Klassifizierer anschließend entfernen oder zum Test verschieben. Eine
kleine Änderung, geschätzt ein halber Tag.
[Factory](../../../packages/ai/src/plans/corp-tactical-plan-modules.ts) ·
[Verwendung im Test](../../../packages/ai/src/plans/corp-tactical-plan-modules.test.ts) ·
[Produktive Dispositionen](../../../packages/ai/src/plans/corp-action-disposition-contributors.ts)

### 7. `plans/turn-projection.ts`

**P1, direkt mit der Engine reproduziert.** Accounts Receivable kostet
5 Credits und bringt 9. Die Engine-LegalAction liefert eine Semantik
mit Nettozuwachs 4. `certifiedTurnProjectionDeltaFromCandidate` zieht
von den 4 erneut die 5 Kosten ab. Bei Startguthaben 5 weist der
projizierte Frame 4 aus, die Engine nach `applyAction` dagegen 9.
Die Restzugsuche hat eine eigene Transferfunktion, die hier den
Nettozuwachs direkt verwendet. Der fehlerhafte Helper ist an aktueller
Diagnose und beim Runner an der Cleanup-Projektion beteiligt. Eine
geänderte endgültige Spielaktion ist durch den Corp-Fall nicht belegt.
Empfehlung ist eine gemeinsame, eng gebundene Credit-Transferregel für
beide Ableitungen. Abnahme gegen die native Aktion, einen reinen
Kostenpfad und einen Pfad mit zweckgebundenen Credits. Geschätzt ein
bis zwei Tage inklusive Regression.

**P2, synthetische Kapazitätsprobe.** Zwei Additionen mit derselben
Token-ID, aber den abweichenden Typen `install_card` und `start_run`
sowie verschiedenen Ablaufpunkten ergeben einen Token mit Kapazität 2,
beiden Typen und dem neueren Ablaufpunkt. Der aktuelle Restzugsuche-
Producer kodiert die erlaubten Typen in der ID, den Ablaufpunkt aber
nicht. Eine künstlich gleiche ID mit widersprüchlichen Feldern muss
abgewiesen werden oder die Grants müssen getrennt identifiziert sein.
Gleiche kompatible Grants bleiben als Gegenprobe addierbar.
Geschätzt ein halber bis ganzer Tag.
[Credit-Projection](../../../packages/ai/src/plans/turn-projection.ts#L528) ·
[Netto-Producer](../../../packages/ai/src/actions/action-economy-projection.ts#L316) ·
[Restzugsuche](../../../packages/ai/src/plans/turn-remainder-search.ts) ·
[Grant-Validierung](../../../packages/ai/src/plans/turn-projection.ts#L864) ·
[Grant-Producer](../../../packages/ai/src/plans/turn-remainder-search.ts#L827)

### 8. `corp/defense/defense-choice-continuation.ts`

**P2, Gegenprobe auf gespeichertem Engine-Checkpoint.** Der Origin-Guard
prüft Quelle, angegriffenen Server, Owner und lückenlose Versionen. Mit
`cp-meta-403-dreff-future-only` erzeugt er dennoch `corp.resolve_choice`,
wenn der LegalAction-Timingpunkt künstlich durch `game.checkpoint`
ersetzt wurde. Mit beibehaltenem Timing, aber künstlich gesperrtem
`decline` bindet er weiterhin diese Option. Die nachgelagerte
Payload-Funktion weist beide Fälle mit `window_origin_missing` zurück.
Der gültige Ausgangsfall liefert durch beide Stufen `decline`. Die
exakten LegalAction- und auswählbaren Optionsregeln früh im Defense-Owner
prüfen. Für gemeinsame Choice-Fakten einen gemeinsamen Beleg verwenden.
Die Liste fehlgeschlagener Checks aus denselben Guards bilden, um die
derzeit doppelte Fehlerdiagnose zu vermeiden. Geschätzt ein halber bis
ganzer Tag. Abnahme mit funktionierendem Bezahl-, Decline- und
abgewiesenem Timing-/Optionsfall.
[Origin und Option](../../../packages/ai/src/corp/defense/defense-choice-continuation.ts#L197) ·
[Payload-Prüfung](../../../packages/ai/src/corp/score/score-choice-binding.ts#L230) ·
[Checkpoint-Tests](../../../packages/ai/src/evaluation/decision-checkpoints/meta-403-dreff-future-only.test.ts)

### 9. `decision/pilot/corp-score-window-pilot.ts`

**Tragfähige Diagnosegrenze.** Der isolierte Scope prüft Corp-Seite,
`score_agenda` und die passende Goal-Fit-Familie. Die Shadow-Auswertung
verwendet seine Klassifikation. Die nachgewiesenen Aufrufer liegen bei
Shadow-Auswertung, Registry und Tests. Der Vertrag ist durch
Scope- und Schichttests belegt. Beim nächsten Eingriff genügt es,
`hasUtilityFamily` einmal zu berechnen und für Entscheidung sowie
Begründung zu verwenden. Das ist eine optionale Kleinigkeit.
[Scope](../../../packages/ai/src/decision/pilot/corp-score-window-pilot.ts#L13) ·
[Shadow-Auswertung](../../../packages/ai/src/evaluation/semantic-shadow-league.ts) ·
[Scope-Tests](../../../packages/ai/src/decision/pilot/pilot-scope-registry.test.ts)

### 10. `plans/tactical-plan-builders.ts`

**P3, synthetisch reproduziert.** Der Builder kopiert Credit- und
Action-Demands tief, behält aber den übergebenen `currentStep` per
Referenz. Nach Erzeugung eines Plans fügt ein Push auf die ursprünglichen
Step-Kandidaten dem Plan denselben Kandidaten hinzu. `createTacticalPlan`
ist gegenwärtig testseitig genutzt. `createPlanStep` wird noch in der
taktischen Portfolioprojektion für Funding und Action Capacity verwendet.
Zuerst festlegen, wo die mutierbaren Eingaben in den alten
Portfolio-Snapshot übergehen. Dort einen konsistenten Snapshot-Vertrag
mit Mutationstest wählen. Für den reinen Test-Builder lohnt kein
breiter Umbau. Aufwand zwei bis vier Stunden bei einer Änderung.
[Builder](../../../packages/ai/src/plans/tactical-plan-builders.ts#L65) ·
[Funding-Consumer](../../../packages/ai/src/plans/plan-portfolio-funding.ts#L179) ·
[Action-Capacity-Consumer](../../../packages/ai/src/plans/plan-portfolio-action-capacity.ts#L240)

### Empfohlene Reihenfolge

Zuerst den mit der Engine belegten Credit-Transfer korrigieren und die
beiden Ableitungen absichern. Danach die eng begrenzten Verträge für
Kapazität, Central Pressure, Cashout, Coverage-Cadence und Dr. Dreff.
Verdrahtungs- und Diagnosepflege können separat mit Vorher-nachher-
Belegen folgen.


### Prüfstand

691 Tests in 23 Dateien sind grün, darunter die Projektions-, Central-
Pressure-, Coverage-, Dr.-Dreff-, Cashout-, Pilot- und Portfoliotests.
Ein zusätzlicher Smarteye-Fall scheitert bereits auf dem unveränderten
Quellstand mit `window_origin_missing`. Die synthetische Fixture setzt
die bekannte ICE-Instanz auf `hidden_approached`, die angebotenen
Aktionen referenzieren `corp_private_ice_1`. Der Owner prüft die
Übereinstimmung sichtbarer Zielinstanzen. Die ergänzenden 32 Tests
für Approach-Expose und die zugehörigen Checkpoints sind grün.
[Smarteye-Fixture](../../../packages/ai/src/runtime/plan-first-live-runtime.test.ts#L29966) ·
[ICE-Bindung](../../../packages/ai/src/runner/expose-information/expose-information-signals.ts#L422) ·
[Approach-Expose-Regression](../../../packages/ai/src/evaluation/decision-checkpoints/meta736-approach-expose-decline.test.ts)

Die Gegenproben wurden direkt auf dem geprüften Quellstand im
Arbeitsspeicher ausgeführt. Der Commit enthält die Befunde und die
Abnahmekriterien.

### Umsetzung der vierten Stichprobe

- Einzelprojektion und Restzugsuche teilen die Liquidberechnung. Der native
  Accounts-Receivable-Test bestätigt 5 Credits vor der Aktion, 4 Nettoertrag
  und 9 Credits danach. Kapazitätsgrants mit widersprüchlichen Typen oder
  Ablaufpunkten werden abgewiesen.
- Central Pressure respektiert leere Run-Bindungen und wertet den
  Zusatznutzen eines Run-Events einmal pro Kandidat aus. Coverage verwendet
  eine gemeinsame Run-Zulassung und zählt Draws bis zur aktuellen
  StateVersion. Cashout prüft Kosten, Zielbestand und Lücke gemeinsam.
- Defense bindet Dr. Dreffs auswählbare Optionen und das LegalAction-Angebot
  vor der Planfortsetzung. Shell Traders meldet je Aktion eine eindeutige
  Disposition. Die Corp-Ownership-Tests prüfen die Materialisierung der
  tatsächlichen Module.
- Die Plan-Builder erzeugen eigenständige Snapshots. Der Score-Pilot
  verwendet den Utility-Fit einmal. Der ungenutzte HQ-Score samt Verdrahtung
  entfiel bei gleicher Aktion, Planroute und Fortsetzung in Match 678d D50.
  Die Smarteye-Fixture verwendet für bekanntes ICE dieselbe Instanz-ID wie
  das LegalAction-Angebot.

KI-Typecheck und `check:ai` sind grün. Im vollständigen KI-Testlauf
bestehen 9.575 von 9.584 Tests in 1.173 Dateien. Die neun roten Fälle
liefern auf dem unveränderten Ausgangsstand `0b9164443` dieselben Fehler.

- `meta-512-pairing-causes`,
  `baseline-seed02-effect-activation-decision-checkpoints`,
  `series-82b2-remediation-decision-checkpoints`,
  `terminal-defense-advance-binding` und `meta576-department-new-remote`
  betreffen Defense und Platzierung.
- `meta-590-placement-retention`,
  `match-manhunt-decision-checkpoints`,
  `match-e8047b3e-runner-remediation-decision-checkpoints` und
  `trace-profile-scenario-comparison` betreffen Hand und Trace.

## Fünfte Zufallsstichprobe mit zehn Dateien

Geprüfter Quellstand `8c39d15b1` im Worktree `codex/ai-maintainability`.
Zum Prüfzeitpunkt haben alle zehn gezogenen Dateien auf lokalem `main`
denselben Inhalt. Die Ziehung verwendete `.NET System.Random` mit Seed
`1074870289` und 954 ordinal sortierte Git-Pfade unter `packages/ai/src`.
Für die Positionen 0 bis 9 wurde jeweils `Next(i, pool.Count)` gezogen
und getauscht. Tests, Testhilfen und die 30 bisherigen Stichproben
blieben außerhalb des Pools.

Die Stichprobe umfasst produktive Plan- und Choice-Pfade, Diagnose,
Vertragsvalidierung und Baseline-Auswertung. Die bestätigten Schwächen
liegen vor allem an den Übergaben. Defense und Scoring Remote verlieren
denselben Regelkontext, und die Hint- sowie Choice-Verträge werden an
verschiedenen Stellen unterschiedlich streng geprüft. Die bestehenden
Owner-Grenzen bleiben dafür eine geeignete Grundlage. P1 bezeichnet den
nächsten fachlichen Fix, P2 eine konkrete Vertragshärtung und P3
Wartbarkeit. Aufwände sind grobe Schätzungen einschließlich Abnahme.

### 1. `corp/score/score-route-risk.ts`

**Tragfähig.** Die Risikoableitung prüft Projekt, Server und StateVersion
gegen das Protection Need. Sie verwendet die exakte Wahrscheinlichkeit
der Defense-Quote und behandelt unbekannte Werte konservativ. Beide
aktuellen Abnehmer, Score-Plan und Agenda-TurnPlanner, teilen den
Risikobegriff. Der schnelle Null-Risiko-Pfad stützt sich auf das vorgelagerte
`sameTurnCloseout`. Die fachliche Abnahme liegt daher am Nachweis dieses
Signals und an den nativen Fällen zur exponierten Installation.
[Risikoableitung](../../../packages/ai/src/corp/score/score-route-risk.ts#L8) ·
[TurnPlanner-Abnehmer](../../../packages/ai/src/corp/score/corp-agenda-turn-planning.ts#L479) ·
[Native Exposure-Tests](../../../packages/ai/src/corp/score/score-flood-multi-remote-exposure.real-engine.test.ts)

### 2. `corp/defense/program-trash-coverage.ts`

**P1, mit Engine-PlayerView reproduziert.** Die Coverage-Bewertung reicht
das sichtbare Trace-Profil nicht an die Pfadanalyse weiter. Dadurch wird
in diesem Consumer `modern_open` verwendet. In einer echten
`classic_blind`-Spielersicht mit rezztem Rex, fünf Runner-Credits und
einem Corp-Credit hält Raptor den Zugriff offen. Ohne Raptor bewertet
der korrekt profilgebundene Pfad den Zugriff als blockiert. Die vom
Trash-Owner verwendete Funktion meldet trotzdem null verlorene
erschwingliche ICE-Antworten und null Mehrkosten. Der Befund ist in der
Zielbewertung reproduziert. Die tatsächlich gewählte Trash-Option hängt
auch von den weiteren angebotenen Programmen ab.

Das Profil und die zulässigen öffentlichen Trace-Fakten am Eingang der
gemeinsamen Pfadanalyse binden. Den nativen Programm-Trash mit Rex und
mindestens zwei legalen Optionen in Classic prüfen. Modern dient als
Gegenprobe. Aufwand ungefähr ein bis zwei Tage gemeinsam mit Befund 10.
[Trash-Vergleich](../../../packages/ai/src/corp/defense/program-trash-coverage.ts#L42) ·
[Zielrangfolge](../../../packages/ai/src/corp/defense/program-trash-targets.ts#L168) ·
[Profil-Default](../../../packages/ai/src/run-analysis/trace-rules-profile-planning.ts#L17)

### 3. `corp/defense/forced-rez-variant-selection.ts`

**Tragfähig.** Die vorgelagerte Choice-Grenze prüft die Engine-Quoten
für ICE, Fort, Choice, aktuelle Version und Ressourcen. Das Modul beginnt
mit der günstigsten zertifizierten Variante. Eine Aufwertung erfordert
einen bekannten Mehrwert und schützt den veröffentlichten Score-Bedarf.
Native Fälle bestätigen die billigste wirksame ETR-Variante, den auf das
sichtbare Rig abgestimmten Subtyp, die Zurückhaltung bei nicht bewertbarer
Trace-Stärke und den Score-Boden. Die konservative Behandlung von
unbekanntem Nutzen ist eine sinnvolle Grenze.
[Variantenvergleich](../../../packages/ai/src/corp/defense/forced-rez-variant-selection.ts#L23) ·
[Choice-Eingang](../../../packages/ai/src/corp/defense/rez-or-trash-choice.ts#L139) ·
[Native Varianten](../../../packages/ai/src/corp/defense/rez-or-trash-variants-real-engine.test.ts#L214)

### 4. `ai-hint-contracts.ts`

**P2, mit aktivem Artefakt als Vorlage reproduziert.** Im Speicher wurde
im Hint von Data Fort Remapping der erste Effekt von
`spend_remap_counter_end_run` durch einen unbekannten Effekt ersetzt.
Der Artefakt-Loader akzeptiert die Kopie. Die kanonische Ontologie weist
denselben Wert mit `unknown_effect_kind` am exakten Feldpfad ab.
Der konsumierende Capability-Adapter übernimmt Effekte in sein
Semantikprofil. Der aktuelle generierte Bestand besteht seine
Identitätsprüfung. Die Gegenprobe belegt die Lücke beim Laden.

Die bereits vorhandene tiefe Capability-Validierung im Artefakt-Loader
wiederverwenden und dessen Feld-Whitelist erhalten. Abnahme mit dem
gültigen Artefakt und gezielt ungültigen Effekt-, Ziel- und Strategiefeldern.
Aufwand ein halber bis ein Tag.
[Flache Validierung](../../../packages/ai/src/ai-hint-contracts.ts#L143) ·
[Ontologie](../../../packages/ai/src/hint-ontology.ts#L1845) ·
[Loader](../../../packages/ai/src/generated-ai-hint-artifact-validation.ts#L79) ·
[Abnehmer](../../../packages/ai/src/actions/action-card-semantic-profiles.ts#L160)

### 5. `runtime/semantic-runtime-corp-score-context.ts`

**P3, statisch.** Die Context-Factory baut Scoring-Komponenten und eine
zusätzliche skalare Scorefunktion. Der einzige Produktionsanschluss der
Corp-Komposition entnimmt die Komponenten. Die skalare Funktion hat
keinen lesenden Aufrufer im Repository. Die beiden Fassaden reichen
zudem Teile derselben Abhängigkeiten weiter.

Den ungenutzten skalaren Corp-Pfad aus der Factory entfernen und die
Komposition auf den tatsächlich übergebenen Komponentenprovider
zusammenziehen. Abnahme mit gleichen Komponenten und gleicher Reihenfolge
für die bestehenden Corp-Diagnosefälle. Aufwand ungefähr zwei bis vier Stunden.
[Context](../../../packages/ai/src/runtime/semantic-runtime-corp-score-context.ts#L30) ·
[Einziger Anschluss](../../../packages/ai/src/runtime/semantic-runtime-corp-scoring-evidence-composition.ts#L128)

### 6. `runtime/corp-scoreline/semantic-runtime-corp-score-action-economy.ts`

**P3, statisch und synthetisch abgegrenzt.** Die Datei verbindet
Scoring-Diagnose, Kosten, Kartensuche und Economy-Profile. Der
Closeout-Helfer setzt die Kosten der bereits angebotenen Advance-Aktion
auf mindestens einen Credit und Klick. Eine synthetische freie letzte
Advance-Aktion meldet deshalb bei 0 Credits keinen Closeout. Der aktuelle
Engine-Producer bietet die normale `advance_card` mit exakt einem Credit
und einem Klick an. Der Gegenfall zeigt eine künftige Änderungsfalle.
`corpBurstEconomyOperationForAction` bekommt zudem eine generische
Abhängigkeit, die es gar nicht liest.

Als kleinen Schnitt die ungenutzte Abhängigkeit entfernen. Bei einer
Erweiterung des Advance-Vertrags den aktuellen LegalAction-Preis separat
vom Preis möglicher Folgeschritte prüfen. Abnahme zunächst mit unveränderten
Corp-Economy-Komponenten für die bekannten nativen Preise.
Aufwand für die Signaturpflege ungefähr zwei bis vier Stunden.
[Closeout](../../../packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-action-economy.ts#L92) ·
[Economy-Helfer](../../../packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-score-action-economy.ts#L412) ·
[Engine-Angebot](../../../packages/engine/src/game/turn/corp-main-actions.ts#L730)

### 7. `simulation/runner-action-valuation-baseline-metrics.ts`

**P2, synthetisch reproduziert.** Ein Runner-Zugende mit verbleibenden
Klicks und zwei Alternativen zählt allein durch den alten Evidence-String
`runner_inevitable_corp_deckout:true` als unvermeidlicher Deckout.
Die Zusammenfassung kann dennoch einen Corp-Sieg nach Agendapunkten
ausweisen. Dadurch fällt der Zähler für vorzeitige Zugenden von eins
auf null. Außer dem Leser und seinem Unit-Test wurde im aktuellen
TypeScript-Quellstand kein Producer für diesen String gefunden.

Die Ausnahme an den vorhandenen nachgewiesenen unmittelbaren Deckout
binden. Gegenprobe mit belegtem Deckout, widersprüchlichem Ergebnis,
fehlender Aktion und zertifiziertem Zugende nach erschöpften Routen.
Aufwand ungefähr ein halber Tag.
[Kennzahl](../../../packages/ai/src/simulation/runner-action-valuation-baseline-metrics.ts#L22) ·
[Auswirkung im Baseline-Gate](../../../packages/ai/src/simulation/ai-behavior-baseline.ts#L247)

### 8. `runner/rig-coverage/coverage-types.ts`

**P3, statisch.** Das kleine Modul definiert verständlich die Coverage-Phasen
und den Gap. Die Suchbindung besteht aus zwei unabhängig optionalen
Feldern. Multi-Search und mehrere Fortsetzungen definieren parallele
Formen dafür. Die aktuellen Entscheidungen prüfen die Paarung und die
StateVersion zur Laufzeit. Für einen konkreten Suchfall mit Teilbindung
wurde keine akzeptierte Aktion belegt.

Beim nächsten Eingriff in Coverage-Search die Paarung als gemeinsam
typisierten Bindungswert führen und den Eingangs-Guard wiederverwenden.
Abnahme mit regulärer Suche, Multi-Search und getrennt fehlender Action-ID
oder StateVersion. Aufwand ungefähr ein halber Tag für den gezielten Schnitt.
[Coverage-Zustand](../../../packages/ai/src/runner/rig-coverage/coverage-types.ts#L2) ·
[Lokale Multi-Search-Form](../../../packages/ai/src/runner/rig-coverage/coverage-multi-search-choice.ts#L22) ·
[Fortsetzungsbindung](../../../packages/ai/src/runner/rig-coverage/coverage-bindings.ts#L229)

### 9. `runner/run-window/run-window-selected-origin.ts`

**P2, mit mutiertem Engine-Angebot reproduziert.** Aus dem nativen
Vacuum-Link-Checkpoint D80 wurde `runner.start_run.hq` übernommen und
in ein synthetisches Scheduler-Ergebnis mit Root und Executor eingesetzt. Ersetzt man lediglich dessen
Timingpunkt durch `game.checkpoint`, speichert der Binder weiter einen
`resolve_runner_run_start_order`-Ursprung. Bei abgelaufener StateVersion
überspringt er denselben Run dagegen geräuschlos. Es wurde keine
Engine-Anwendung einer falschen Aktion beobachtet.

Timingpunkt und aktuelle Route vor dem Schreiben des Ursprungs abgleichen.
Die Behandlung explizit erlaubter Run-/Window-Sonderfälle anhand des
Aufrufpfads scharf abgrenzen. Abnahme mit den nativen D80–D85-Fortsetzungen
und den gezielt alten beziehungsweise falsch getimten Angeboten.
Aufwand ungefähr ein halber bis ein Tag.
[Origin-Guard](../../../packages/ai/src/runner/run-window/run-window-selected-origin.ts#L67) ·
[Native Fortsetzungen](../../../packages/ai/src/evaluation/decision-checkpoints/meta-536-run-start-vacuum.test.ts)

### 10. `corp/scoring-remote/scoring-remote-discovery.ts`

**P1 gemeinsam mit Befund 2, mit Engine-PlayerView reproduziert.** Auch
dieser Pfad verliert das Trace-Profil. Die Maturity-Funktion reicht nur
Corp-Bid-Capacity an die Pfadanalyse weiter. Auf derselben Classic-Sicht
weist die finanzierte Remote-Quote für Rex ohne Raptor einen erreichbaren
Zugriff mit vier Credits Zugriffskosten aus. Die mit `classic_blind` aufgerufene
Pfadanalyse weist den Zugriff als blockiert aus.

**P3, statisch.** Discovery berechnet alle Remote-Maturities vor den
Doctrine- und Opening-Guards des Signal-Builders. Danach liest dieser nur
die Maturity für den einen gewählten Zielserver. Jeder vorhandene Remote
kann bis zu 4.096 Rez-Teilmengen quotieren. Die Zahl ist ein Code-Maximum
pro Server, keine Laufzeitmessung. Die Quote nach der Zielbindung nur
für das ausgewählte Fort berechnen. Die Abnahme soll null Quotes bei
deaktivierter Doctrine und höchstens eine Bewertung bei gleichem Signal
zeigen. Aufwand für diesen separaten Schnitt ungefähr ein halber bis ein Tag.
[Eager Discovery](../../../packages/ai/src/corp/scoring-remote/scoring-remote-discovery.ts#L56) ·
[Zielbindung und einziger Zugriff](../../../packages/ai/src/corp/scoring-remote/scoring-remote-signals.ts#L37) ·
[Teilmenge und Pfadquote](../../../packages/ai/src/runtime/corp-remote-maturity-assessment.ts#L193)

### Prüfstand und Reihenfolge

137 fokussierte Tests in 17 Dateien sind grün. Dazu kommen die fünf
Gegenproben im Arbeitsspeicher für Trace, Hint-Validierung, Kennzahl,
Run-Ursprung und hypothetischen Free Advance. Die native Trace-Spielersicht
stammt aus `createGameAfterSetup` und `getPlayerView` mit Rex, Raptor
und `classic_blind`. Die Probe verglich die aktuellen Consumer mit
`assessKnownRezzedIcePath` unter explizitem Profil. Die Kosten- und
Timing-Gegenproben veränderten nur ihre lokalen Eingabekopien.

Zuerst den gemeinsamen Trace-Kontext für Defense und Scoring Remote
absichern. Danach sind die Hint-Grenze, der Run-Ursprung und die
Baseline-Kennzahl jeweils eigenständig testbar. Die kleineren
Wartbarkeitsänderungen können jeweils im zugehörigen Pfad folgen.
