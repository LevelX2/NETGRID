# Hidden Node: Fähigkeitsgrenzen und Änderungsentscheidung

Stand: 2026-09-05. Auftrag: charaktererhaltende Verbesserung von
`standard_proteus_corp_hidden_node_control_2026_05_25`.
Prozess: [HN-A–E](../../activities/in-progress/act-2026-09-05-hidden-node-character-improvement.md).

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
