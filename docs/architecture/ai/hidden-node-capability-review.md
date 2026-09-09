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

## Vier-Karten-Nachprüfung aus Paarung 407

Die ursprünglichen Nullen zählten gewählte Kartenaktionen, nicht automatische
Auslösungen oder Kartenwahlen beim Abwerfen. Vollständig nachgezählt wurden
11 Bel-Digmo-Auslösungen in 10 Spielen mit 11 Net-Schaden und 22
Stereogram-Auslösungen in 12 Spielen mit 16 Net-Schaden und 22 Rückmischungen.
Sechs verhinderte Treffer verhinderten die Rückmischung nicht.

**Bel-Digmo:** Die 461 eindeutigen Installationsangebote wurden als fehlende
Punish-Kampagne abgelehnt. Das verwarf einen davon unabhängigen Nutzen:
HQ entlasten, Deckrest um eine Karte erhöhen, Agenda-Dichte im R&D senken und
Zugriffe dort belasten. Installation kostet einen Klick, Rez weder Klick
noch Credits. Ein Remote-Zugriff macht keinen Net-Schaden. Die verdeckte
Installation kann trotzdem einen Run oder ICE-Kosten provozieren, besonders
wenn echte Agendas in vergleichbaren Remotes liegen. Expose, ein freier Run,
fehlende Glaubwürdigkeit und Opportunitätskosten begrenzen den Bluff.

Der bestehende Ambush-Owner erhält deshalb eine mechanisch erkannte,
instanzgebundene Install-/Halte-/Rez-Folge. Keine Karten-ID-Ausnahme, keine
zusätzliche ICE-Installation allein für den Köder, keine Verdrängung eines
reservierten Score-Servers. Zwei Köder dürfen neben einer finanzierbaren
Drei-Advance-Agenda vorbereitet werden. Der Score-Owner entscheidet weiterhin
über Installation und Scoring der Agenda; eine komplette gelernte Mischstrategie
ist damit nicht abgenommen. Der begrenzte Haltehorizont umfasst bis zu zwei
Gegnerzüge und wird resident nicht verlängert.

**Stereogram:** Ihr natürlicher Vorbereitungsweg ist Abwerfen ins Archives.
In allen 40 Spielen gab es 98 echte Corp-Cleanup-Entscheidungen mit Stereogram
in HQ: 54-mal wurde mindestens eine ausgewählt, 44-mal keine. Historische
Engine-Zustände G1 D291, G4 D65 und G4 D137 belegen den falschen Tausch:
Die KI behielt Stereogram und warf Bel-Digmo ab. Die zielgebietsbezogene
Handbewertung berücksichtigt nun den kostenlosen Archives-Zugriffseffekt
und die Rückmischung. Bestehende konkrete Planbindungen und Agenda-Sicherheit
bleiben vorrangig. Installation ist kein Selbstzweck: Sie kostet einen Klick
und aktiviert den Archives-Effekt nicht. Auch dieser Schaden bleibt vom
gegnerischen Zugriff und möglicher Prävention abhängig.

**Manhunt:** 45 Angebote, davon 14 ohne benötigte Engine-Quote. Der Producer
forderte alleinstehende Trace-Tag-Operationen ohne weitere Payoff-Karte gar
nicht an. Er stellt diese Anfrage jetzt innerhalb des vorhandenen begrenzten
Quote-Vertrags. Die Engine kann Kosten, Tags und Antworten damit sichtbar
machen. Eine Quote allein erzwingt keine Ausführung. Tags können anschließende
Bestrafung ermöglichen oder freiwillige Cleanup-Kosten auslösen; sie sind
kein garantierter Kreditverlust. Vier Operations-Credits, ein Klick,
Trace-Gebot, Runner-Link, Antworten und ein verfallendes Run-Fenster gehören
in die Bewertung. Ein ungeprüfter Bonus für jedes Tag-Angebot wäre falsch.

Offen bleibt die vollständige strategische Abnahme von alleinstehendem
Tag-Druck: Die aktuelle Quote zertifiziert gewöhnlich das gedruckte
Limit-Gebot, während die spätere Bid-Policy einen günstigeren anderen Zweig
wählen kann. Kosten und Tag-Mindestwert dürfen nicht zwischen diesen Zweigen
vermischt werden. Es wird deshalb keine neue Druckroute mit garantiertem
Tag-Mindestwert zugelassen. Die vorhandenen vollständigen Punish-Routen bleiben
erhalten; zusätzliche Gebotsvarianten benötigen einen durchgehend gebundenen
Quote-/Plan-/Choice-Vertrag. SP-076 zur frühen Punish-Liquidität ist davon
abzugrenzen.

**Government Contract:** SP-303 bleibt offen. Die bereits unterstützte
vorbereitete Bank ist nicht die vollständige Erstinvestition. Bei n vollständig
verbrauchten Drei-Credit-Auszahlungen ergeben sich nach Rez und Advancement
2n−2 zusätzliche Credits für 1+n Klicks. Gegen dieselbe Zahl einfacher
Kreditklicks ist der Unterschied n−3: drei Auszahlungen gleichen die Kosten
aus, die vierte erzielt erstmals einen Vorteil. Das setzt zusammen zwölf
Credits tatsächlichen Install-/Rez-Verbrauch voraus. Quelle und Counter müssen
überleben; nicht verbrauchte Auszahlungen verfallen zum Zugende. Advancement,
Operations und Traces sind keine zulässigen Verbraucher. Ein früher Aufbau
kann langfristig sinnvoll sein, ein später Aufbau bei Geldüberfluss oder ohne
Verbraucher dagegen nicht. Der fehlende mehrzügige Investitionshorizont wird
nicht durch einen pauschalen Kartenbonus ersetzt.

Die historischen Vergleichsproben rekonstruieren alle Engine-Präfixe bis zum
Checkpoint und prüfen jeden StateHash. Die neue Entscheidung startet mit
frischem residentem KI-Portfolio; sie ist keine Rekonstruktion des alten
KI-Gedächtnisses. G10 D324 wählt jetzt Bel-Digmo-Installation statt Kredit;
G1 D291 und G4 D65/D137 wählen Stereogram zum Abwerfen. G1 D231 bleibt eine
korrekte Stereogram-Auswahl. Die geprüften Manhunt- und Contract-Kontrollfälle
behaupten keinen nachgewiesenen Alternativsieg. Neue Serienmetriken müssen von
den unveränderten historischen 40 Spielen getrennt bleiben.

Die breite Regression fand eine Wechselwirkung mit SP-082: Der
Economy-Producer entfernte sämtliche Score-Funding-Provider, sobald irgendeine
bezahlbare Ambush-Installation existierte. Die neu zugelassene Recyclingkarte
verdrängte dadurch eine bereits gebundene Agenda-Finanzierung. Der Ausschluss
gilt jetzt nur für dieselbe konkurrierend gebundene Agenda-Instanz. Die
historische Finanzierung über den Gegnerzug und ihre Freigabe am Zielwert
sind erneut geprüft. Nach geschlossenem Gap ist Bel-Digmo als unabhängige
Vorbereitung zulässig; der alte Test auf ausschließlich residuale Creditnahme
wurde entsprechend auf die konkret gebundene neue Route aktualisiert.

Die erste neue 40er-Runde auf `ac8cf7d34` erfasst 10.631 Entscheidungen ohne
technische Flags, ist wegen dieser anschließenden Verhaltenskorrektur aber
vollständig aus der finalen Kontrollpopulation ausgeschlossen. Vier weitere
breite Testfehler sind auf dem unveränderten Ausgangsstand `57cffe5da`
reproduziert: Crybaby-Trash-Erwartung, Runtime-Import in
`decision/known-remote-access-commitment`, MRGSG-Remote-Contest und
5285-Run-Target-Erwartung. Sie gehören nicht zum hier reparierten Kartenpfad;
der vollständige KI-Gate-Stand darf deshalb nicht als grün ausgewiesen werden.

Die entfernte globale Ambush-Sperre macht im historischen 3bb14-Checkpoint
auch den bereits vorhandenen Funding-Need von Private Cybernet Police
wieder ausführbar. Der Scheduler wählt dessen exakt delegierten P4-Credit
vor dem alternativen Kali-Schutz-Draw. Der aktualisierte Checkpoint bindet
diese konkrete Finanzierung, prüft den tatsächlichen Credit-Zuwachs und
unveränderte HQ-/Serverbelegung. Kalis Schutz-Need gegen den öffentlich
bereitstehenden Breaker und die unabhängige Experimental-AI-Vorbereitung
bleiben im Portfolio nachgewiesen. Das ist keine Freigabe, Kali ungeschützt
zu exponieren, und kein Nachweis einer optimalen mehrzügigen Agenda-Auswahl.

### Kontrollpopulation 412 und verbleibender Strategievertrag

Die frischen 40 Seeds `meta-412-r2-001` bis `meta-412-r2-040` auf
`4e8ad4064` enthalten 11.471 Entscheidungen ohne technische Flags, Fallbacks,
Timeouts oder Auswahlabweichungen. 39 Runner-Agendasiege und ein
Fetal-Flatline sind kein kausaler Gewinnratennachweis gegenüber den anderen
Seeds von 407. Alle Entscheidungen sind individuell projiziert; 8.114 bleiben
ohne vollständigen Alternativenvergleich trace-limitiert.

- Bel-Digmo: 74 Installationen und 74 Rez-Rückmischungen, je 39/35 pro
  Hälfte. 34 Vorbereitungen bleiben über den Installationszug hinaus verdeckt; 20
  Rückmischungen erfolgen bei einem Run auf genau diesen Remote. Diese Runs
  verbrauchen Runner-Klicks. In den vier Fällen mit ICE wird dieses nicht
  gerezzt; zusätzliche Breakkosten sind daher nicht belegt. 12 automatische
  R&D-Schadensauflösungen in neun Spielen ergeben zehn erlittene Net-Schäden.
- Stereogram: 54 von 55 Cleanup-Fenstern mit Handkontakt wählen die Karte;
  einmal wird stattdessen eine doppelte Pattel abgeworfen. 15
  Archives-Auslösungen in acht Spielen verursachen zehn erlittene Net-Schäden
  und 15 Rückmischungen. Eigene Quellaktionen bleiben null. Abwurf und
  automatische Wirkung müssen deshalb separat zur Install-/Rez-Metrik stehen.
- Manhunt: 83 eindeutige Angebote, davon 66 ohne sichtbaren Payoff und 17
  ohne machbare Campaign; keine Missing-Quote-Ausschlüsse mehr. Ausspielungen
  bleiben null. SP-320 verifiziert nur die eigenständige Quote-Anfrage.
- Government Contract: 363 eindeutige Angebote und zwei Installationen,
  je eine pro Hälfte; kein Rez, Advancement oder Auszahlung. SP-303 bleibt
  offen. Die Bank-Erstinvestition ist nicht durch ihre Installation bewiesen.

128 fokussierte Tests, AI-Typecheck und `check:ai` bestehen. Der breite
Zweitlauf erfasst 5.321 Tests mit fünf Fehlern; nach der beschriebenen
3bb14-Vertragsaktualisierung bestehen dessen fünf fokussierte Proben. Die
vier unabhängig reproduzierten Ausgangsfehler bleiben offen.

Ein vollständiger Bluffplan muss zwei verdeckte Köder mit einer wirklich
finanzierbaren Agenda-Folge verbinden, den Scoring-Ort freihalten und den
konkurrierenden HQ-/R&D-Druck berücksichtigen. Ein einzelner gezeigter
Agenda-Erfolg garantiert keine künftigen Runs auf jeden Köder. Die aktuelle
Anbindung unterstützt die Vorbereitung und begrenztes Halten; eine gelernte
Mischstrategie, optimal wiederholtes Recycling oder sichere ICE-Ausgaben des
Runners werden nicht behauptet. G24 D380–396 zeigt Bel neben tatsächlicher
Headhunters-Entwicklung und anschließendem Köder-Run; G34 D458 zeigt zugleich,
dass Rückmischung den späteren HQ-Verlust nicht verhindert.

Die anschließende Prüfung der geschützten Köder präzisiert diesen offenen
Punkt: 69 der 74 Installationen erfolgen zunächst ohne ICE, fünf hinter
vorhandenem ICE. Der Discovery-Code verbietet geschützte Remotes nicht,
sondern sortiert freie, nicht für Score reservierte Remotes nach ICE-Anzahl.
Diese Anzahl belegt weder eine finanzierbare Verteidigung noch Runner-Kosten.
Die fünf Installationen sind G6 D102, G34 D306/D336 und G37 D167/D242.
Nur die beiden G37-Fälle nutzen bereits gerezzte Mobile Barricade; die
übrigen drei legen Bel hinter unrezzte Dog Pile ohne ausreichende Rez-Credits.

Die vier tatsächlich angelaufenen ICE-Köder sind getrennt zu beurteilen:
G6 D106 sowie G34 D320/D342 haben jeweils vier Corp-Credits bei fünf
benötigten Dog-Pile-Rez-Credits. Die Engine bietet das ICE-Rez deshalb gar
nicht legal an. Ein bloßer Rez-Bewertungsbonus könnte diese Finanzierungslücke
nicht beheben. In G24 D394 ist Riddler dagegen für zwei Credits bei 25
Corp-Credits legal rezbar. Die exakte Defense-Routenprüfung verwirft es mit
`corp_ice_rez_resource_exchange_unknown`: Der Engine-Quote enthält noch
keine feste ETR-Subroutine, sondern den bedingten Encounter-Effekt, für zwei
weitere Credits eine hinzuzufügen. Eine sichere Creditsteuer folgt aus diesem
unvollständigen Routenvergleich nicht. G24 D391 installiert das ICE erst nach
dem zunächst ungeschützten Bel, weshalb dieser Fall nicht zu den fünf bereits
bei Installation geschützten Ködern gehört.

Der verbleibende Implementierungsbedarf ist damit die zusammenhängende
Bluff-/Defense-Folge, nicht eine feste Quote ungeschützter Installationen:
Ambush bindet Köder und begrenzten Haltehorizont; Defense bewertet geeignete
ICE, tatsächliche Passierbarkeit, Rez-/Encounter-Kosten und eine finanzierbare
Runner-Creditbelastung. Ein nötiger Funding-Need muss vor dem Gegnerzug mit
dieser Folge verbunden werden. Score behält echte Agenda-Folgen und seine
Finanzierung; freie ehemalige Scoring-Remotes können später Köder aufnehmen.
Beide Remote-Arten müssen glaubwürdige Inhalte erlauben, ohne festes
abwechselndes Muster oder behauptete Lernreaktion des Gegners. Diese Diagnose ist der Ausgangsbefund der folgenden Korrektur.


### Finanzierbare geschützte Köder und gültige Rez-Fenster

Der bestehende Defense-Owner bewertet nun eine konkrete verfügbare ICE-Schicht
mit aktuellen Engine-Quotes, sichtbarem Runner-Rig, Rez- und Encounter-Kosten.
Ambush bindet diesen typisierten Bedarf an seine Quelle; Economy darf einen
begrenzten Gap von höchstens drei Credits schließen. Vor ausreichender
Finanzierung wird keine vermeintlich geschützte Köder-Installation ausgeführt.
Unabhängige Score-Reserven und reservierte Agenda-Orte bleiben geschützt.
Ein Run auf eine Zentrale beendet den verdeckten Haltehorizont nicht.

Der Engine-Quote unterscheidet eine öffentlich gewählte Breaker-Unterart von
einer noch offenen Choice. Die zusätzliche kostenpflichtige ETR-Subroutine
bei einem entsprechend bedingten ICE besitzt eine separate Encounter-Quote:
Sie zählt weder als kostenlose Rez-Wirkung noch als garantierter Runnerverlust.
Im historischen G24 D394 kann die Corp damit Riddler rezzen und seine
bezahlte ETR im nächsten Fenster tatsächlich aktivieren. Der sichtbar auf
Sentry eingestellte Fubar kann diesen Code-Gate-Zweig nicht brechen.

Der TurnPlanner beendet seine Vorausplanung beim Schließen des aktuellen
Corp-Rez-Fensters. Die vorher erzeugte Folge „Fenster schließen, dann dieselbe
Quelle rezzen“ war regelwidrig projiziert und konnte die rechtzeitige
Bel-Rückmischung verdrängen. Ein Real-Engine-Test führt nun die ganze Folge
aus: Defense-Rez, tatsächlich vom Runner bezahlter Break, anschließend
Ambush-Rez im letzten gültigen Serverfenster. Ein zweiter Ablauf belegt
Rez plus bezahltes ETR und den erhaltenen verdeckten Köder nach Run-Ende.

Das ist eine begrenzte, zustandsabhängige Koordination vorhandener Owner.
Eine optimale gelernte Mischstrategie, ein garantierter Alternativsieg oder
eine Pflicht, jeden Köder-Run mit ICE-Ausgaben zu verteidigen, folgen daraus
nicht. Die getrennte frische Kontrollpopulation 413 bestätigt die Ausführung,
aber weiterhin seltene geschützte Köder.


Die erste Kontrolle 413 findet zusätzlich eine Engine-Timinglücke (SP-324):
G18 D689 installiert Bel beim leeren R&D mit dem letzten Klick. D690 enthält
nur `end_turn`; der Runner kann seinen Zug beenden und die Corp zum leeren
Pflichtziehen zwingen. Die führende `docs/source/Netrunner Errata 1.70.md`
erlaubt im Abschnitt „Gaining Actions“ und bei Remote Facility ausdrücklich
Rez nach der letzten Aktion. Die normale Asset-/Upgrade-Rez-Quote wird daher
auch vor dem tatsächlichen Zugende bei null Klicks angeboten. Kostenprüfung,
Replay und Side-Grenzen bleiben Teil desselben vorhandenen Engine-Pfads.
Die Null-Klick-Probe führt Bel-Rez, beiderseitiges Zugende und erfolgreiches
Pflichtziehen aus; Remote Facility wird mit null und drei Klicks einschließlich
unzureichender Credits und deterministischem Replay geprüft.
Die gesamte erste 40er-Runde auf `a48d0290f` ist wegen dieser folgenden
Regelkorrektur diagnostisch und von der finalen Population ausgeschlossen.

Die zweite 40er-Kontrolle auf `52e1df950` belegt erstmals einen tatsächlich
bezahlten geschützten Bel-Run: G14 D101 installiert hinter Mobile Barricade,
D104 rezzt das ICE, D106–110 bezahlt der Runner insgesamt drei Credits,
D113 mischt Ambush Bel im Serverfenster zurück. Sie zeigt aber zusätzlich
SP-325 in G27 D706/D708: R&D ist bereits leer, Bel liegt in HQ, doch normale
Score-Finanzierung verdrängt die legale Rettung. Der Ambush-Plan erhält für
diesen aktuellen, exakt gebundenen Zustand den bestehenden P2-Vertrag für
irreversible Bedrohungen. Beide vollständig hashgeprüften Originalzustände
wählen nun Installation; die Real-Engine-Probe führt die Folge bis zum
überlebten Pflichtziehen aus. Auch Runde zwei bleibt deshalb diagnostisch.
Kompass und allgemeines Zielbild gelten unverändert; es entsteht weder ein
zweiter Chooser noch eine neue Planprioritätsklasse.

### Verifizierter Umfang und verbleibende Grenzen

Die abschließende Kontrolle auf `68dbb8f7c` enthält 40 neue vollständige
Partien ohne technische Flags. Der geschützte Mobile-Barricade-Köder wird
erneut tatsächlich bezahlt; bei leerem R&D verhindert die aktuelle
Recycling-Priorität den früheren Pflichtzieh-Verlust. Der genaue betroffene
Seed endet nach 921 Entscheidungen regulär über Agendapunkte. Eine verlängerte
Partie ist kein Nachweis eines Alternativsiegs. Geschützte Köder bleiben selten;
eine ausgewogene Agenda-/Köder-Mischstrategie ist nicht abgenommen.

Die neuen Real-Engine- und Signalregressionen sowie die angrenzenden
Engine-Prüfungen bestehen. Der breite AI-Gate enthält weiterhin vier auf dem
unveränderten Ausgangsstand reproduzierte Fehler (Crybaby-Sicherheit,
Decision-Modulgrenze, MRGSG-Remote-Contest und 5285-Run-Target-Metrik).
Er gilt deshalb nicht als vollständig grün. Einzelresultate und Rohbelege
liegen in der zentralen Evidence-Registry unter Kontrolle 413.

Stereograms produktive Vorbereitung im regulären Cleanup bleibt bestätigt.
Für die anschließende Druckfolge und Erstinvestition gelten die folgenden
aktuellen Fähigkeitsgrenzen. Der Hand-/Score-Konflikt wird als SP-323 geführt.

### Aktuelle Owner-Fortsetzungen: Score, Trace und Counterbank

Score darf eine vollständig mit Agendas überfüllte HQ mit einer bezahlbaren
verdeckten Installation entlasten. Der bounded Score-Horizont darf dabei um
genau eine Aktion über den nächsten Corp-Zug hinausreichen. Dies verhindert
den andernfalls erzwungenen offenen Archives-Abwurf; es behauptet weder
sicheren Schutz noch einen garantierten Score. Normale Hände erhalten diese
Ausnahme nicht. Der rekonstruierte Zustand 413 G5 D291 wählt diese Score-Linie.

Die Engine ermittelt für eine unterstützte Trace-Tag-Route das kleinste
ausreichende Gebot innerhalb des bisherigen begrenzten Trace-Budgets anhand
der tatsächlichen öffentlichen Antwortoptionen. Falls kein Gebot Erfolg
garantiert, bleibt das Angebot ausdrücklich reaktiv. Punish bindet das
ausgewählte Gebot an Quelle, unmittelbare StateVersion, Parent und Executor.
Die Choice löst ausschließlich dieses aktuelle Optionsangebot auf; eine
fehlende oder veraltete Bindung scheitert sichtbar. Mindestens zwei sicher
zusätzliche Tags können als eigenständiger Druck zugelassen werden, wenn
ihre Zahl die gesamten quotierten Corp-Credits erreicht. Eine Real-Engine-
Probe spielt Manhunt für vier Credits, bietet null und trasht anschließend
die sichtbare Ressource. Ein Ressourcentrasherfolg wird vorab nicht garantiert.

Economy kann eine installierte, noch ungerezzte Counterbank vorbereiten,
wenn ein echter Defense-Rez-Verbraucher gebunden ist und die Engine eine
vollständig bezahlbare Advance-/Rez-Folge im aktuellen Zug bestätigt. Der
Kapazitätsgewinn für genau diesen Verbraucher muss die gleiche Zahl einfacher
Credit-Aktionen übertreffen. Nach jedem Kopf wird erneut quotiert. Gespeicherte
Counter sind keine Liquidität. Die aktuelle Engine-Zahlungsquote kann mehrere
kostenlose Counterauszahlungen derselben Quelle bis zur legalen Verbrauchs-
Action nachweisen; nur der erste aktuelle Kopf wird zur Ausführung gebunden.
Der Test belegt Advance → Null-Klick-Rez → Zugwechsel → zwei Auszahlungen →
Mobile-Barricade-Rez mit Defense als Parent. Unwirtschaftliche Erstinvestitionen
und veraltete Quotes werden abgelehnt.

Eine optimale Agenda-/Bluff-Mischung, der vollständige mehrzügige Contract-
Aufbau aus HQ und eine allgemeine Spielstärkensteigerung sind damit weiterhin
nicht abgenommen. Die frische Kontrollserie 414 prüft die natürliche Nutzung
dieser engeren Fähigkeiten; ihre Ergebnisse werden getrennt von 413 geführt.
