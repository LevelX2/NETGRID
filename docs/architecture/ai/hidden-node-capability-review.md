# Hidden Node: Fähigkeitsgrenzen und Änderungsentscheidung

Stand: 2026-09-05. Auftrag: charaktererhaltende Verbesserung von
`standard_proteus_corp_hidden_node_control_2026_05_25`.
Die Paketfolge HN-A–E ist fachlich abgeschlossen. Führende Ergebnisse liegen
in der lokalen [Evidenzregistrierung](../../runbooks/ai-selfplay-evidence-registry.md),
Paarungen 388–394, Report `hidden-node-character-20260905`.

## Aktuelle Entscheidung

**Originaldeck beibehalten; keine produktive KI-Policy geändert.** Zwei kleine
Varianten wurden geprüft. Zusätzliche freie Economy kann konkrete Partien
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
KI mit Originaldeck derselbe Kontrollarm, keine zusätzliche Stichprobe.

Behalten werden die Messwerkzeuge, drei zusätzliche Ambush-Zonenregressionen
und vier Prüfungen der Ergebnisaggregation. Die folgenden Fähigkeitslücken
sind offen; dieses Ergebnis behauptet weder ihre Implementierung noch eine
gelöste Deckschwäche.

## Finanzierung und Schutz: kein pauschaler KI-Bonus

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
garantierte allgemeine Liquiditätsprojektion. Der fehlende Consumer für den
Contract-Typ ist damit eine konkrete Fähigkeitslücke, aber kein Beweis,
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

HN-B verändert daher weder Economy-Prioritäten noch Schutzgrenzen. Der
gezielte Engine-Test zu Zweckbindung/Verfall und vier bestehende
SP-082-Chooser-/Ownership-Regressionen sind grün. Das ist ein überprüftes
No-change-Ergebnis, **kein implementierter Government-Contract-Controller**.

## Vertrag für eine spätere Contract-Fähigkeit

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
garantierte zukünftige Ersparnis. Zu beweisen sind außerdem ein günstiger
wiederholter Zyklus, Verfall ohne Verbraucher, gegnerische Entfernung,
Unterbrechung und unveränderte Hidden-Info-Grenzen. Das wäre eine neue
vertikale Fähigkeit, kein kleiner Bewertungsfix auf Basis dieser Partie.

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

Sinnvoller nächster Implementierungsgegenstand ist die vertikale,
zweckgebundene Economy-Fähigkeit am bestehenden Owner, zunächst an einem
günstigen wiederholten Contract-Zyklus mit exakt gebundenem Verbraucher.
Daneben benötigt Remote-Maturity einen nachgewiesenen besseren Supportpfad;
das bloße Bestehen blockierter Score-Parents reicht nicht. Zusätzliche
Counter-Punish-Vorbereitung muss den Mehrwert gegenüber bereits wirksamen
HQ-/R&D-Fallen belegen. Keine dieser Erweiterungen wird durch weitere
Kartenkopien oder einen globalen Bewertungsaufschlag ersetzt.
