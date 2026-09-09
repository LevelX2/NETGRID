# Hidden Node: Fähigkeitsgrenzen und Änderungsentscheidung

Stand: 2026-09-05. Auftrag: charaktererhaltende Verbesserung von
`standard_proteus_corp_hidden_node_control_2026_05_25`.
Die Variantenprüfung HN-A–E ist abgeschlossen; die Fähigkeitenabnahme wird
in HN-F–H fortgesetzt. Führende Vergleichsergebnisse liegen
in der lokalen [Evidenzregistrierung](../../runbooks/ai-selfplay-evidence-registry.md),
Paarungen 388–394, Report `hidden-node-character-20260905`.

## Aktuelle Entscheidung

**Originaldeck beibehalten; generische Finanzierungs-, Zahlungs- und
Fortsetzungsfehler sind korrigiert.** Die produktive Fähigkeit ist unten
abgegrenzt; ein allgemeiner Spielstärkengewinn ist nicht belegt.

### Unverändertes Deck: alter und neuer Systemstand

Die abgeschlossene 70er-Abnahme vergleicht Baseline `d12ee55789dfd063bc29aa3c1b892b9c354a6fcc`
mit Capability-Stand `e9562364c67580e674b01056ec9a6bcaf8dee624`, vor der
abschließenden Zusammenführung mit dem inzwischen weitergelaufenen `main`.
Corp- und jeweilige Runner-Snapshots sind identisch, Corp-Deckhash `fnv1a:78faa278`.

| Kohorte | Corp-Siege alt → neu | Corp-Punkte alt → neu | Nullscore-Niederlagen alt → neu |
| --- | ---: | ---: | ---: |
| Krashkurs, bekannte 40 Seeds | 0 → 0 | 25 → 25 | 33 → 33 |
| Krashkurs, wiederverwendete 10 Holdouts | 0 → 0 | 2 → 3 | 9 → 8 |
| R&D Express, wiederverwendete 10 Holdouts | 0 → 0 | 5 → 5 | 8 → 8 |
| Redline Riot, wiederverwendete 10 Holdouts | 0 → 1 | 10 → 12 | 7 → 7 |
| Gesamt, 70 | 0 → 1 | 42 → 45 | 57 → 56 |

Alle 70 Spiele sind terminal/replaykorrekt ohne Runtimefehler, Fallback oder
Timeout. 50 End-StateHashes sind identisch zur Baseline; alle acht Pilot-
Wiederholungen stimmen mit diesem neuen Kontrollarm überein und werden
nicht zusätzlich gezählt. Score-Actions steigen insgesamt von 17 auf 18.
Die 30 Holdouts waren bereits Teil der früheren Variantenprüfung und sind
kein neuer unberührter Testsatz.

Der neue Sieg in `hidden-node-holdout-20260905-3-03` endet per Flatline bei
Runner 6 / Corp 6 statt zuvor Runner-Sieg 7 / 0. Das ist decktypischer
Schadensdruck, aber kein isolierter Nachweis eines Contract-Effekts. Die
vollständig erfassten Economy-Meilensteine enthalten keine neuen Counter-
Advancement-Heads und keine Defense-Restricted-Funding-Heads. Die neue
vorbereitete Fähigkeit wurde im natürlichen Satz damit nicht ausgewählt.
Die Erstinvestitionsgrenze bleibt praktisch relevant.

Auch Rückschritte bleiben sichtbar: Krashkurs-Holdout 05 erzielt nur einen
statt zwei Corp-Punkten und scored später; Redline-Holdouts 04 und 09 erzielen
weniger Punkte. Dem stehen unter anderem erstmals zwei Punkte in Krashkurs-
Holdout 08 und der neue Flatline-Sieg gegenüber. Ein Sieg aus 70 genügt
nicht als allgemeiner Spielstärkennachweis. Übernommen werden die durch
Regressionen belegten generischen Vertrags-/Regelkorrekturen, keine Deck-
oder Prioritätsanpassung allein wegen dieser Ergebniszahlen. Die Engine-
Korrekturen machen dies zu einem Systemvergleich, nicht einem isolierten
KI-Bewertungsexperiment. Registry-Paarungen 397–400 und Report
`hidden-node-capability-20260905` sichern diesen getrennten Vergleich.

### Integrationsprüfung und verbleibende Testgrenzen

Main `9b38d1365` wurde ohne Textkonflikte eingebunden. Die eigenen
Contract-Regressionen bleiben grün; AI-/Engine-Typechecks, Struktur/
Reachability und Paketgrenzen bestehen. Der bewusst breitere AI-Lauf auf
dem Merge-Stand `5cbcbd530` bestand jedoch nicht vollständig: 4989 von 5008
Tests grün, 19 rot. 18 dieser Tests sind bereits auf Main rot und wurden
gegengeprüft, nicht durch gelockerte Erwartungen kaschiert. Dazu gehören
alte Score-/Checkpoint-Erwartungen, zwei Hijack-Simulationsindizes, ein
veralteter Deckzähler und der festgeschriebene alte SP-082-Spielverlauf.
Letzterer endet auf beiden Ständen inzwischen mit Corp 9 / Runner 5 und
gültigem Replay statt dem historisch erwarteten Runner-Sieg.

Die einzige neue Abweichung war die absolute Zustandsnummer im R&D-Interface-
Test. Der aktuelle Run beginnt bei 21 statt 20; seine echte Choice folgt bei
22. Der korrigierte, grüne Test bindet Quelle, eindeutiges aktuelles Angebot
und unmittelbar folgende Choice und prüft den identischen Root/Executor.
Es wurde kein Runner-Verhalten geändert. Nach dieser reinen Testkorrektur
erfolgte kein weiterer vollständiger Shardlauf; die 18 Main-Baseline-Fehler
bleiben offen. Die 70er-Ergebnisse oben werden nicht nachträglich als
Spielstärkemessung des um fremde Main-Änderungen ergänzten Stands ausgegeben.

### Abgelehnte Deckvarianten vor dem Capability-Fix

Zwei kleine Varianten wurden geprüft. Zusätzliche freie Economy kann konkrete Partien
verbessern, ist im geprüften Satz aber keine konsistente Verbesserung des
Decks. Ein höherer Scorebonus oder lockerere Schutzgrenzen sind aus den
geprüften Zuständen ebenfalls nicht begründet.

Economy tauscht je einen Bel-Digmo und Stereogram gegen insgesamt zwei
zusätzliche Accounts Receivable: 45 Karten, 21 Agendapunkte, 41 Proteus-Karten,
sämtliche thematischen Funktionen und alle fünf benannten Kernkarten bleiben.
Die Balanced-Variante tauscht zusätzlich je einen Credit Blocks und Sumo 2008
gegen zwei Data Wall; sie scheitert bereits im achtteiligen Pilot.

| Vorab festgelegte Kohorte | Siege Original / Economy | Corp-Punkte Original / Economy | Verluste ohne Score Original / Economy |
| --- | ---: | ---: | ---: |
| Krashkurs, bekannte 40 Seeds | 0/40 / 1/40 | 25 / 21 | 33 / 34 |
| Krashkurs, 10 frische Seeds | 0/10 / 0/10 | 2 / 2 | 9 / 9 |
| R&D Express, 10 frische Seeds | 0/10 / 1/10 | 5 / 8 | 8 / 6 |
| Redline Riot, 10 frische Seeds | 0/10 / 0/10 | 10 / 3 | 7 / 9 |
| Gesamt | 0/70 / 2/70 | 42 / 34 | 57 / 58 |

Der Economy-Sieg gegen Krashkurs in Seed 025 erreicht acht Scorepunkte;
erster Score in Zug 23 statt 47 im Original. Drei Economy-Operations werden
ausgeführt statt einer, darunter eine Defense-gebundene Finanzierung. Das
ist echte Konversion in dieser Partie, aber kein isolierter kausaler
Credit-Effekt: Die andere Liste verändert auch Ziehfolge und Entscheidungen.
Der zweite Sieg, R&D-Holdout 01, ist eine Flatline ohne Score. Er zählt
ausdrücklich nicht als Nullscore-Verlust. Gegen Redline bleiben weniger
Scorefortschritt und mehr Nullscore-Verluste; nur zwei Siege insgesamt tragen
keinen allgemeinen Spielstärkenachweis.

Alle 148 unterschiedlichen Konfigurations-/Seed-Ergebnisse (70 Original,
70 Economy, 8 Balanced) sind terminal und replaykorrekt, ohne Runtimefehler,
Fallbacks oder Timeouts. Acht Economy-Pilotwiederholungen stimmen exakt mit
den späteren Kontroll-StateHashes überein und werden nicht doppelt gezählt.
Die ursprüngliche 40er-Paarung und die gezielt ausgewählten Pilotseeds sind
keine zufällige Stichprobe der gesamten Meta. Die 30 neuen Seeds wurden vor
den Variantenläufen festgelegt. Ohne produktiven KI-Patch sind alte/neue
KI mit Originaldeck waren in dieser ersten Phase derselbe Kontrollarm, keine
zusätzliche Stichprobe. HN-G enthält inzwischen echte produktive Änderungen.

Behalten werden die Messwerkzeuge, drei zusätzliche Ambush-Zonenregressionen
und vier Prüfungen der Ergebnisaggregation. Diese Varianten-Evidence beweist
keine gelöste Deckschwäche; die nachfolgende Fähigkeitenabnahme ist davon getrennt.

## Finanzierung und Schutz: kein pauschaler KI-Bonus

### Reproduzierte und korrigierte Contract-Verlustpunkte

Ein bereits rezzter Contract mit einem Counter und null allgemeinen Credits
besitzt in `corp_action.main` eine legale Auszahlung. Diese ermöglicht
nachweislich eine zuvor unbezahlbare HQ-ICE-Installation für einen Credit;
ungenutzte Credits verfallen korrekt. Vor dem Fix fehlte der Auszahlung im
produktiven Chooser der Planowner (`productive_action_without_owner`,
Coverage 87,5 % im fokussierten Real-Engine-Fixture). Diese Lücke lag vor
Auswahl und Bewertung. Der ungünstige Aufbau-Checkpoint 96 unten widerlegt
sie nicht. Der Nachweis ist ein Fähigkeiten-Test, keine neue Matchup-Evidence.

Die Gegenprobe fand einen Engine-Zahlungsfehler: Advancement konnte aus dem
Installations-/Rez-Pool bezahlt werden und dadurch den reservierten Betrag
über den verbliebenen Gesamtpool erhöhen. Angebot und Ausführung von
`advance_card` verwenden jetzt dieselbe validierte allgemeine
Creditverfügbarkeit. Zweckgebundene Credits bleiben für Installation und Rez
erhalten; ein zusätzlicher allgemeiner Credit erlaubt weiterhin Advancement.
37 betroffene Engine-Tests und drei Real-Engine-KI-Proben sind grün.

Die Engine veröffentlicht für eine isolierte temporäre Install-/Rez-Auszahlung
jetzt Betrag, Zweck und Zugendverfall auf der vorhandenen LegalAction.
Der side-sichere Inputtransport und die Economy-Projektion erhalten diese
Fakten als `restricted_credit` mit separatem `restrictedCreditPayout`;
allgemeine Brutto-/Netto-Liquiditätsfelder bleiben leer. Unvollständige Angaben
bleiben unbekannt, die bestehende Source-/Ability-Bindung bleibt verbindlich.
Diese mechanischen Fakten allein sind noch keine Auswahl- oder Kampagnenfähigkeit.

Die unten abgegrenzten Verbraucher besitzen inzwischen exakte Owner-/Support-
Bindungen; andere Verbraucher und die langfristige Erstinvestition sind nicht
automatisch abgedeckt. Der ebenfalls belegte Run-Timingfehler
ist korrigiert: Die lokale `docs/source/Netrunner Errata 1.70.md`, Abschnitt
Card Effects, erlaubt aktionskostenfreie Effekte in Rez-Fenstern; CardSpec
und bestehende Ausführungsvalidierung ordnen Contract bereits `corp_paid`
zu. Der Run-Angebotsproduzent hatte ausschließlich `corp_during_run`
abgerufen. Er berücksichtigt nun beide Timings in seinen bestehenden
Rez-Fenstern, ohne Encounter-/Trace-Erzeugung zu erweitern. Die reale
Gegenprobe Auszahlung → Wall-of-Static-Rez besteht einschließlich
Counter-/Poolverbrauch und fehlender Encounter-Auszahlung. Die Fundingquote
bindet installierte Rez-Verbraucher über ihre Engine-Zone statt über ein bei
ICE nicht vorhandenes Installationsziel-Payload. Kein pauschales Payout-/Score-Gewicht und
keine Gleichsetzung mit freier Economy.

### Bisherige Aufbau- und Vergleichsevidence

Government Contract ist keine frei verfügbare Drei-Credit-Economy.
Der CardSpec definiert einen Advancement-Counter als Auszahlungskosten,
drei temporäre Installations-/Rez-Credits und Verfall am Zugende. Die
Auszahlung kann in zulässigen Corp-Paid-Windows auch im Runnerzug erfolgen.
Vorbereitete Counter müssen deshalb nicht bereits im eigenen Zug verfallen:
Sie sind noch keine ausgezahlten Credits.

Der Hintcompiler erhält diese Zweckbindung als `finite_economy_pool`,
`economy.corp_install_rez_credit`, `restricted_credit`. Dagegen behandelt
`corpEconomyDevelopmentCampaigns` derzeit nur bestimmte freie Cashouts,
endliche gehostete Guthaben und Start-of-Turn-Auszahlungen als
Entwicklungskampagnen. `corpVisibleCardEconomyWithdrawals` verlangt eine
garantierte allgemeine Liquiditätsprojektion. Der ursprünglich fehlende Consumer
für den Contract-Typ war damit eine konkrete Fähigkeitslücke, aber kein Beweis,
dass das Einbauen dieser Investition die beobachtete Entscheidung verbessert.

Der genaue HN-A-Checkpoint 96 hat zwei Credits, einen Klick und einen
unrezzten Contract ohne Counter. Advance kostet einen Credit, Rez zwei:
Keine Reihenfolge ermöglicht jetzt bereits die Auszahlung. Einen Credit zu
nehmen ist daher nicht durch den bloßen Hinweis auf die Karte widerlegt.
Der erste komplette Zyklus kostet drei allgemeine Credits plus den
Advance-Klick und vorherigen Installationsklick; er erzeugt nur drei
zweckgebundene Credits. Erst Wiederverwendung kann eine laufende Rendite
erzeugen. Ein isoliertes `+3` wäre sachlich falsch.

Auch der Schutzpfad ist nicht grundsätzlich ownershiplos: Checkpoint 84
bindet die konkrete ICE-Installation an Defense als Leaf des Remote-Parents.
Bei 267 fehlen tragfähige Score-Schutzrouten vor der Auswahl; bei 278
materialisiert derselbe reale Spielverlauf die Agenda-Installation. Eine
sichere, früher erreichbare Alternative ist mit diesen Befunden nicht belegt.

Der ursprüngliche HN-B-Schritt veränderte weder Economy-Prioritäten noch Schutzgrenzen. Der
gezielte Engine-Test zu Zweckbindung/Verfall und vier bestehende
SP-082-Chooser-/Ownership-Regressionen sind grün. Das ist ein überprüftes
No-change-Ergebnis dieser ersten Phase. HN-G erweitert inzwischen die
bestehenden Planowner; ein separater Government-Contract-Controller entsteht nicht.

## Aktuelle erste Contract-Fähigkeit und verbleibender Vertrag

Zusätzlich ist jetzt ein eng begrenzter Defense-Verbraucher produktiv:
Die Engine bindet eine aktuell legale Auszahlung an den konkreten folgenden
ICE-Rez und liefert aus ihrem bestehenden sichtbaren Break-Quote-Produzenten
eine optionale aktuelle Access-Blockierung. Das ist keine garantierte Wirkung
gegen unbekannte spätere Runner-Entscheidungen. Unvollständige Wirkung entfernt
nur diese Defense-Admission, nicht die unabhängig exakte Finanzierungsquote.

`corp.defend_servers` veröffentlicht dafür im vorhandenen residenten Portfolio
einen aktuellen zweckgebundenen Bedarf. `corp.economy` erhält Parent, Need,
Quelle, Ability und aktuelle Invocation; Defense übernimmt keine Auszahlung.
Nach der Auszahlung fällt der Bedarf weg und das echte neue `rez_ice` geht
an denselben Defense-Parent zurück. Kein erfundener zukünftiger Action-Kandidat
und keine zweite persistente Kampagne. Die genaue allgemeine Restliquidität
nach dem Verbraucher wird von der Engine geliefert und schützt separate
Score-Reserven; unverbrauchte temporäre Credits zählen dafür nicht als Reserve.

Der produktive Real-Engine-Test verwendet das unveränderte Hidden-Node-Corpdeck
mit vorbereitetem Contract und Mobile Barricade, aber einen kontrollierten
Test-Runner und gesetzten vorbereiteten Spielzustand. Er beweist Finanzierung
und Rückgabe, weder den eigenständigen Aufbau dieses Zustands noch Spielstärke.
Weitere Proben prüfen bezahlbare sichtbare Breaker, lokale Unknowns,
Score-Reserven, Hidden-Zonen-Invarianz und wiederholte Auswahl aus demselben
vollständigen Kontext. Die anschließend geprüfte Wiederholung ist unten
beschrieben; die Kartenliste bleibt unverändert.

HN-G ergänzt einen bewusst engen produktiven Pfad: Eine vorbereitete,
aktuell Engine-gequotete Installations-/Rez-Auszahlung kann den echten
Finanzierungsbedarf eines bereits installierten, positiv amortisierten
Economy-Rez-Projekts erfüllen. Das Projekt bleibt resident; ein eigener
`corp.economy`-Provider bindet Parent, Need und aktuelle Source-/Ability-
Invocation. Mehrere Auszahlungsvarianten gehören zum selben Provider.
Die zweckgebundene Lückenverringerung verwendet keinen pauschalen
Readiness-Aufschlag und erzeugt keine allgemeine Liquidität.

Die neue `corp-restricted-credit-route-v1`-Engine-Quote prüft den aktuellen
Auszahlungsschritt auf einer isolierten Zustandskopie und ermittelt die
danach tatsächlich angebotenen Verbraucher-Kosten. Sie liefert keine
zukünftige Action-ID. Actor-private DTO-Prüfung bindet aktuelle Version,
Quelle, Ability, Server und Verbrauch; Unknown-Teilpfade bleiben lokal.
Bereits ohne weitere Auszahlung verfügbare Verbraucher erzeugen keinen
Pflichtbedarf. Nach Gap-Schluss endet dieser Support auch dann, wenn ein
weiterer Counter vorhanden ist. Der Verbraucher rematerialisiert seine
neue echte Action beim nächsten Aufruf.

Dabei wurde ein generischer Fortsetzungsfehler nachgewiesen: Der Corp-
Planner berechnete mehrere gültige Restzuglinien, gab an die vorhandene
Commitment-Fortsetzung aber ausschließlich die neue Siegerlinie zurück.
Ein weiterhin ausführbarer bisheriger Root erschien dadurch als verloren.
Der Rückgabevertrag enthält jetzt die bereits geprüften Suchlinien; der
bestehende Root-/Interrupt-Vertrag entscheidet unverändert über Fortsetzung.
Das ist keine neue Hysterese oder zweite Auswahlregel.

Die Real-Engine-Abnahme umfasst Auszahlung → Rückgabe an denselben Parent →
Rez, tatsächliche Zahlung/Verfall, keinen zweiten Fundingbedarf,
deterministische aktuelle Bindung und Hidden-Info-Gegenprobe. Noch nicht
abgenommen sind vollständige Erstinvestition, weitere Score-Verbraucher sowie
sämtliche anderen allgemeinen Zahlungswege. Zulässige höher priorisierte
Unterbrechung ist kein Nachweis eines Finite-Bank-Nutzungsdefekts. Ein globaler
Spielstärkennachweis steht aus; keine Deckliste wird geändert.

Die zusätzlich geprüften allgemeinen Corp-Main-Zahlungen (Resource-Trash,
Operations einschließlich X-Kostengrenzen, Spy-Counter, Verpflichtungen und
Data-Fort-Lock-Entfernung) nutzen bei Angebot und Ausführung dieselbe
validierte freie Creditverfügbarkeit. Diese Beträge dürfen den eingeschlossenen
Installations-/Rez-Pool nicht aufbrauchen. Das ersetzt keine pauschale
Abnahme sämtlicher anderer Zahlungsfenster.

Eine Erweiterung muss zuerst am Economy-Owner die Investitionsquote
bereitstellen: Installationsklick, Advance-Klick und -Credit, Rez-Kosten,
Counterbestand, erlaubtes Auszahlungsfenster und zeitlich gebundener
Verbrauch. Ein aktueller Leaf benötigt eine exakte Engine-Action; ein
späterer Verbraucher bleibt hinsichtlich Kosten/Choices/Wissen separat
bewertet. Defense besitzt weiterhin ICE/Server/Rez, Score die Agenda.

Zweckgebundene Auszahlung zählt nur bis zum belegten nutzbaren Verbrauch,
nicht als allgemeine Finanzierung von Advancement, Operations oder Traces.
Nach geschlossener Need endet Support. Ein unbekannter späterer Pfad sperrt
nicht unabhängig belegte heutige Vorbereitung, rechtfertigt aber keine
garantierte zukünftige Ersparnis. Die folgende Wiederholungsabnahme prüft
einen günstigen belegten Zyklus, Quellenverlust, Unterbrechung und unveränderte
Hidden-Info-Grenzen. Sie ist eine vertikale Fähigkeit, kein kleiner
Bewertungsfix auf Basis der ursprünglichen Partie.

## Wiederholte Contract-Vorbereitung für einen endlichen Rez-Bedarf

Ein bereits rezzed, erschöpfter Government Contract kann jetzt einen
terminalen zentralen Defense-Bedarf vorbereiten. Die Engine-Quote beschreibt
Counter, freie Credits, Kosten/Zweck und Verfall einer bedingten Auszahlung;
sie ist actor-privat und behauptet weder Liquidität noch eine zukünftige
LegalAction. Die aktuelle Advancement-Action kommt aus dem echten Angebot.
Defense besitzt das konkrete installierte ICE und seinen Kostenbedarf;
Economy besitzt den exakt gebundenen Vorbereitungsschritt.

Für Mobile Barricade bei 4 Credits/1 Klick ergibt Aufladen 3 freie Credits
und einen Counter für 3 Rez-Credits. Bei 3 Credits/2 Klicks verbessert
Aufladen die nutzbare Kapazität zunächst von 3 auf 5; danach beschafft eine
neu ausgewählte Basic-Credit-Action den fehlenden Credit. Beide produktiven
Chooser-Proben führen über den Gegnerzug zu Auszahlung und tatsächlichem
Rez unter demselben residenten Defense-Parent. Quelle und späteres Fenster
müssen fortbestehen; neue gegnerische Möglichkeiten bleiben ungewiss.

Der zweistufige rote Test belegte eine zusätzliche Producer-Lücke: Die
Draw-Suche leitete aus fehlender direkt installierbarer Handkarte einen
Defense-Draw ab, obwohl bereits installiertes ICE durch die belegte
Vorbereitung finanzierbar war. Dieser Need verdrängte die Funding-Provider
vor dem Linienvergleich. Die Zulassung unterscheidet jetzt diesen Fall von
wirklich fehlendem wirksamen ICE. Unbekannte oder sichtbar brechbare
Schutzpfade löschen den Draw nicht. Der Fix ist kein globaler Fundingbonus.

Gezielte Gegenproben sichern den Stopp nach geschlossenem Gap, idempotentes
Assessment, Quellenverlust, knappe Klicks und privaten DTO-Transport. Die
Erstinvestition ist nicht freigegeben: Installationsklick, Advance-Klick,
Advance-Credit und zwei Rez-Credits stehen einer einzelnen Auszahlung von
drei zweckgebundenen Credits gegenüber. Erst wiederholte nutzbare Auszahlung
kann diese Investition rechtfertigen. Dafür fehlt weiterhin ein belastbar
gebundener langfristiger Verbraucherhorizont; kein Kartenlistenwechsel oder
pauschaler Zukunftsbonus ersetzt ihn.

Zusätzliche Diagnosegrenze: Die aktuelle zentrale Allokation behandelt ein
bekannt leeres HQ (`populationCardCount < 1`) als unvollständigen Kontext.
Dadurch kann auch die unabhängige R&D-Bewertung unbekannt bleiben. Die
vorstehenden Fixtures enthalten eine echte Originalkarte in HQ, um diese
separate Lücke nicht mit der Finanzierung zu vermischen. Dies ist noch kein
Nachweis einer Ursache in Spiel 34 und wurde hier nicht nebenbei geändert.

Der natürliche Checkpoint `meta-357-final-034` auf `2ce041525` blieb
unverändert: Runner 8, Corp 5, 380 Actions, Replay gültig, keine Runtimefehler.
Das Ergebnis liegt vor der hier beschriebenen Wiederholungs-Erweiterung;
vorbereitete Capability-Proben allein belegen keine höhere Spielstärke.

Die anschließende Finite-Bank-Gegenprobe erzwingt keine Economy-Fortsetzung:
Nach finanziertem Rockerboy-Rez wählt der produktive Chooser bei drei
verbleibenden Klicks einen höher priorisierten Score-Defense-Draw. Die echte
Bank-Auszahlung bleibt verfügbar. Dieses Ergebnis rechtfertigt keinen
Override; es beweist auch keinen allgemeinen Fehler des Nutzungsplans.
Rockerboy ist eine Mechanik-Gegenprobe außerhalb des Originaldecks.

## Bedingte Vorbereitung: Zonenwirkung vor Installationszahlen

HN-C prüft den bestehenden Ambush-Owner, nicht einen neuen Kartenresolver.
Die frische Discovery über 110 Corp-Main-Entscheidungen der Detailpartie
findet in vier Zuständen konkrete Fetal-AI-Installationssignale; der
produktive Chooser installiert bei StateVersion 5 tatsächlich eine Fetal AI.
Bei 13 und 32 entstehen jeweils zwei Net Damage auf Zugriff, ohne Flatline.
Ungewisser späterer Schaden verhindert Vorbereitung also nicht grundsätzlich.

100 Zustände enthalten eine Karte mit Ambush-Subtyp in HQ. Diese Zahl ist
kein Nenner für verpasste Remote-Installationen: Bel-Digmo schädigt aus R&D,
Stereogram ausschließlich aus Archives. Beide nur wegen ihres Subtyps in
Remotes zu installieren würde ihre Wirkung nicht aktivieren. Pattel und
Doppelganger können bereits uninstalled aus HQ/R&D wirken. Ihre aktuelle
Fresh-Discovery-Abdeckung ist begrenzt; daraus folgt ohne Vergleich von
Zugriffswahrscheinlichkeit, Zahlung und Opportunitätskosten kein Vorteil
einer zusätzlichen Installation. Die Discovery-Diagnose rekonstruiert
ausdrücklich keine residente Fortsetzung und ist keine Chooser-Evidence.

Cybertech benötigt einen konkreten Meat-Damage-Verbraucher; ein allgemeiner
Schadensbonus beweist diese Verbindung nicht. Department of Misinformation
hilft gegen Expose, nicht gegen gewöhnlichen Zugriff. Fehlende Aktivierung
beweist daher weder defekte Regeln noch generell nutzlose Karten.

HN-C ergänzt drei fokussierte Zonen-/Owner-Regressionen und erhält die
bestehenden Ambush-Tests für Installation, Fortsetzung, Zugriff, Ignorieren
beziehungsweise Hold, Recycling und Hidden-Info-Äquivalenz. Keine gelockerte
Expositionsregel und keine behauptete sichere Killsequenz. Eine umfassende
Bluff- oder Counter-Punish-Verbesserung ist damit nicht implementiert.

## Reproduktion und nächste belastbare Erweiterung

`scripts/create-hidden-node-evaluation-config.ts` erzeugt Original, beide
Varianten, Pilot und fünf Checkpoints. `scripts/evaluate-hidden-node.ts`
validiert Snapshots und erfasst jedes Spiel einzeln; `--config` und `--out`
binden den Lauf. `compare-hidden-node-evaluations.mjs` prüft Vollständigkeit,
Quellstand, Deckhash, Seedgleichheit und Runtimeintegrität, bevor Zahlen
zusammengeführt werden. Snapshot-ID **und** Deckhash gehören zusammen: Die
isolierten Experimentlisten verwenden den Originalnamen/-ID, sind aber über
ihre unterschiedlichen Hashes und Labels eindeutig; sie wurden nie als
veränderte Standard-Snapshots veröffentlicht.

Die Registry erhält kompakte Ergebnisse, Manifeste, Meilensteine und den
vollständigen Bericht. Große temporäre Audits/Captures werden nach Sicherung
entfernt und können am dokumentierten Quellstand erneut erzeugt werden.
Der Registry-Job wurde erst vor der Speicherung registriert; die Auswahl war
vom Nutzer fest vorgegeben, nicht zufällig. Alle sieben IDs wurden vor dem
ersten Upsert atomar reserviert.

Die eng gebundene zweckgebundene Economy-Fähigkeit und ein günstiger
wiederholter Contract-Zyklus sind inzwischen umgesetzt. Eine weitergehende
Erstinvestition benötigt ihren eigenen Verbraucher-/Amortisationsnachweis.
Remote-Maturity benötigt weiterhin einen nachgewiesenen besseren Supportpfad;
das bloße Bestehen blockierter Score-Parents reicht nicht. Zusätzliche
Counter-Punish-Vorbereitung muss den Mehrwert gegenüber bereits wirksamen
HQ-/R&D-Fallen belegen. Keine dieser Erweiterungen wird durch weitere
Kartenkopien oder einen globalen Bewertungsaufschlag ersetzt.
