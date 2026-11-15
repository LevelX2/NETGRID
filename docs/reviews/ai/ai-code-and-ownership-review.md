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
