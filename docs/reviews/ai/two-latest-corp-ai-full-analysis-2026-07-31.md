# Vollanalyse der zwei neuesten abgeschlossenen Corp-KI-Spiele

Stand: 2026-07-31  
Analysebranch: `codex/ai-analysis-latest-two-20260731`  
Analysemethode: vollständige Entscheidungskette aus `ai_decision_traces`, den zugehörigen `LegalActions`, Zuständen und PublicEvents; zusätzlich Deck-Doctrine- und Hint-Consumer-Prüfung.

## Kurzurteil

Die Corp spielt die Zentralverteidigung und ihre sichtbare Wirtschaft inzwischen deutlich besser. In beiden Spielen blieben jedoch alle Corp-Agendapunkte bei null. Das kurze Spiel gewann die Corp nur durch einen Flatline-Fehler des Runners; das lange Spiel verlor sie, nachdem eine Tycho Extension aus HQ und die später abgeworfene zweite Tycho Extension aus den Archives gestohlen wurden.

Der Hauptfehler liegt nicht in einer fehlenden Deckdoktrin. Beide Corp-Decks werden strategisch plausibel erkannt. Die abgeleitete Strategie erreicht die Ausführung aber nicht zuverlässig:

1. `corp.defend_servers` kann frühe legale ICE-Installationen ohne vollständige Kosten-/Zugriffsquote als unbekannt oder unproduktiv verwerfen.
2. Der Scheduler kann einen bereits als ausführbar erkannten Same-Turn-Score-Pfad durch einen allgemeinen Defense-Funding-Pfad verdrängen lassen.
3. Ein für `new_remote` angelegter Score-Server wird nach seiner Erzeugung nicht stabil an die konkrete Remote-ID gebunden.
4. Score-Projekte bleiben auf belegten oder praktisch ungeeigneten Remotes resident und fordern wiederholt Schutz oder Kartenziehen, ohne die Agenda zu installieren.
5. Aktive Rez-Fenster werden bei vollständig deterministischen Runnerkosten teilweise als `resource_exchange_unknown` abgelehnt.
6. Die Handüberlaufbehandlung berücksichtigt Kosten, Score-Reserve, Regionersetzung und Agenda-Risiko noch nicht zuverlässig.

Das sind generische Plan-, Bewertungs- und Ownership-Probleme. Für die festgestellten Spielfehler ist keine kartenspezifische Verhaltenssonderregel erforderlich.

## Spiele und Datenabdeckung

| Spiel | Deck der Corp-KI | Ausgang | Entscheidungen | Trace-Abdeckung |
| --- | --- | --- | ---: | --- |
| `match_723d40ac5a001d37` | Rent to Own War Engine | Corp gewinnt durch Flatline in Zug 12 | 39 | 39/39 vollständig |
| `match_daed3ad3bead20fb` | Siren Fortress | Runner gewinnt über Agendapunkte in Zug 32 | 106 | 106/106 vollständig |

Es fehlen keine AI-Entscheidungen; es gibt keine verwaisten, doppelten oder dem angewandten Action-Ergebnis widersprechenden Traces.

## Befunde und vorgeschlagene generische Korrekturrichtung

### F1 – Frühe Defense wird fälschlich hinter Grundkredite gestellt

In beiden Spielen nimmt die Corp in Zug 1 dreimal einen Grundkredit und wirft anschließend eine Karte ab, obwohl HQ und R&D ungeschützt und mehrere ICE-Installationen legal sind. Im kurzen Spiel wiederholt sie das auch in den Corp-Zügen 3 und 5: neun Grundkreditaktionen, drei Abwürfe und bis Zug 7 kein ICE.

Die Ursache steht direkt im Trace: Günstige ICE-Routen werden als `corp_ice_install_assessment_unknown` oder `corp_ice_install_has_no_engine_certified_access_probability_reduction` behandelt. Der P6-Liquiditätsplan gewinnt dadurch konkurrenzlos. Erst bei 14 Credits wird derselbe Defense-Bedarf als P2 zugelassen.

Korrekturrichtung: Der Defense-Plan muss eine legale Installationsroute auch dann qualitativ bewerten können, wenn das ICE nicht sofort gerezzt werden soll oder die exakte spätere Zugriffsreduktion noch unbekannt ist. Bluff, Handentlastung, spätere Rez-Fähigkeit und Schichtaufbau sind positive, aber dosierte Faktoren. Es darf kein harter Installationszwang und kein separater ICE-Bypass außerhalb des Defense-Plans entstehen.

### F2 – Garantierter Same-Turn-Score verliert gegen aufgeblähte Defense-Priorität

Im kurzen Spiel liegen in Corp-Zug 11 Hostile Takeover, Project Consultants, drei Aktionen und zwölf Credits vor. Das Score-Modul führt einen residenten, `ready` bewerteten Pfad mit Evidenz `corp_same_turn_score_conversion:install_score_target`. Installieren plus Project Consultants hätte die Agenda mit vier Advancement-Countern noch in demselben Zug scorebar gemacht.

Stattdessen gewinnt ein Defense-Reserve-Pfad für weiteres ICE mit P2: Grundkredit, BBS-Rez/Payout und ICE-Installation. Die Corp gewinnt danach zwar durch Flatline, hat aber den sicheren Score nicht aufgrund einer schlechten Deckanalyse, sondern durch eine Prioritätsinversion ausgelassen.

Korrekturrichtung: Ein vom Score-Modul vollständig gebundener und bezahlbarer Same-Turn-Score-Pfad muss als zusammenhängende Zugvariante gegen den gesamten konkurrierenden Defense-Zug bewertet werden. Defense darf ihn nur bei einer tatsächlich konkreten P1-/P2-Pflicht verdrängen, nicht durch pauschal hochgestuftes Funding.

### F3 – `new_remote` verliert nach der ersten Aktion seine konkrete Bindung

Im langen Spiel installiert Entscheidung 19 Cinderella vor einem neuen Remote als Support für `Ice Transmutation:new_remote`. Entscheidung 20 eröffnet mit BBS Whispering Campaign einen zweiten Remote. Entscheidung 22 entwickelt Schutz nicht mehr für den eben gebauten Remote 1, sondern für `remote_2`, also den Wirtschaftsserver.

Korrekturrichtung: Sobald eine Aktion einen neuen Server erzeugt, muss das Ergebnisobjekt die symbolische Zielbindung `new_remote` atomar auf die konkrete Server-ID umschreiben. Root-Plan, Parent-Need, Defense-Support, Folgeaktionen und Turn-Commitment müssen dieselbe Bindung übernehmen. Ein anderer Plan darf die Nummerierung nicht nachträglich umdeuten.

### F4 – Score-Projekte werden trotz ungeeigneter Zielroute resident gehalten

Später enthalten Remote 1 und Remote 2 Wirtschaftskarten beziehungsweise Upgrades. Trotzdem bleiben zahlreiche Agenda-Projekte für beide Remotes resident. Die KI installiert weiteres ICE, zieht wiederholt „für Score-Schutz“ und verwirft die Agenda-Installation wegen `subset_assessment_unknown` oder `corp_last_click_score_install_deferred_without_protection_horizon`. In Zug 27 installiert sie sogar das zweite Cinderella für Tycho auf Remote 1, nimmt mit der letzten Aktion aber einen Kredit. In Zug 29 zieht sie erneut für Schutz, nimmt wieder den letzten Grundkredit und wirft danach Tycho Extension ab.

Korrekturrichtung: Das Score-Modul muss vor Support-Delegation die komplette aktuelle Route prüfen: konkrete Agenda-Card-ID, legaler Zielserver, Inhalts-/Root-Kompatibilität, erforderliche Aktionen, Credits, Advancement-/Score-Schritte und Schutzquote. Wird die Route unzulässig oder praktisch blockiert, wird sie neu gebunden oder freigegeben; sie darf nicht unbegrenzt Defense- und Draw-Support verbrauchen.

### F5 – Aktive ICE-Rez-Kosten werden trotz bekannter Lage als unbekannt behandelt

Im langen Spiel lehnt die Corp in Entscheidung 78 das Rezzen von Haunting Inquisition vor Remote 2 ab. Corp 17 Credits, Runner 16 Credits; der sichtbare Code-Gate-Breaker müsste für Stärke und zwei Subroutinen ungefähr zwölf Credits ausgeben, während das Rezzen acht kostet. Das ist mindestens eine erhebliche, berechenbare Belastung. In Entscheidung 84 lehnt die Corp Data Wall vor R&D für einen Credit ab, obwohl der Runner nur noch einen Credit hat und beim sichtbaren Wall-Breaker genau diesen Credit zum Brechen benötigt. Der Trace nennt jeweils `corp_ice_rez_resource_exchange_unknown`.

Korrekturrichtung: Im Defense-Plan muss die aktive Encounter-Quote für genau die LegalAction aus bekannten ICE-Daten, sichtbaren Breakern, Stärke, Subroutinen, Runnercredits, Rez-Kosten, Serverwert und ICE-Effektsemantik entstehen. Unsicherheit darf als Bandbreite einfließen, aber deterministische Kosten nicht in „unbekannt“ verschwinden lassen.

### F6 – Teure Handentlastung zerstört Score-Reserve und sich selbst

In Entscheidung 52 bezahlt die Corp sieben Credits für Washington, D.C., City Grid in R&D, ausschließlich um einen Kartenüberlauf abzubauen, während zwei Tycho Extensions in HQ liegen. Zwei Corp-Züge später installiert sie Rio de Janeiro City Grid in dieselbe Region und trasht Washington durch die Regiongrenze. Der erste Einsatz von sieben Credits erzeugt damit kaum nachhaltigen Wert und schwächt die Score-Reserve.

Korrekturrichtung: `corp.hand_and_agenda_management` muss bei einer Handkonversion Installations-/Rez-Kosten, verbleibende Score- und Defense-Reserve, vorhandene Region, absehbare Ersetzung, tatsächlichen Boardwert und sichere Abwurfalternativen gemeinsam vergleichen. Das ist eine generische Handmanagementbewertung, keine Karten-ID-Regel.

### F7 – Agenda-Abwurf ist teils erzwungen, die Zielwahl aber trotzdem schlecht

Vor Entscheidung 97 besteht HQ aus sechs Agendas. Ein Agenda-Abwurf ist deshalb nach den vorherigen Fehlentscheidungen unvermeidbar. Die Choice wählt jedoch Tycho Extension: vier Agendapunkte bei nur vier Advancement. Alternativen sind drei Ice Transmutations mit drei Punkten bei fünf Advancement und zwei AI Chief Financial Officers mit zwei Punkten bei fünf Advancement. Tycho ist sowohl besonders wertvoll zum Scoren als auch besonders gefährlich in den Archives. Sie wird später aus den Archives gestohlen und beendet das Spiel.

Korrekturrichtung: Der eigentliche Fehler beginnt vor dem Discard-Fenster: Score-Plan und Handmanagement dürfen eine ausschließlich aus Agendas bestehende Überlaufhand möglichst nicht erzeugen. Muss dennoch eine Agenda abgeworfen werden, muss der zuständige Handmanagementplan die konkrete Card-ID anhand Agendapunkte, Advancement, Score-Nutzen, On-access-/Archives-Risiko und Wiedergewinnbarkeit binden. Der generische Choice-Resolver darf diese strategische Zielentscheidung nicht selbst neu treffen.

### F8 – Deck-Hint-Consumer-Lücke im Rent-to-Own-Deck

Die vollständige Hint-Consumer-Prüfung des Rent-to-Own-Decks findet zwei blockierende Metadatenabweichungen bei Department of Truth Enhancement: `hosted_credit_add_hint_mismatch` und `hosted_credit_take_hint_mismatch`. Die Engine kennt +3 gehostete Credits und „alle nehmen“, die aktiven Hints bilden diese Beträge/Modi nicht vollständig ab.

Die Karte wurde in diesem kurzen Spiel nicht gezogen oder benutzt und erklärt daher keinen der beobachteten Züge. Die Abweichung ist trotzdem eine reale Consumer-Lücke im exakten Decksnapshot.

Korrekturrichtung: Hintdaten an den bereits implementierten Enginevertrag angleichen und den Deck-Hint-Audit grün machen. Das ist eine semantische Datenkorrektur, keine kartenspezifische Laufzeitsonderregel.

## Deckdoktrinen

### Rent to Own War Engine

Abgeleitete Primärstrategien:

- `corp.tag_trace_punish`
- `corp.fast_advance`
- `corp.economy_rez_reserve`

Sekundär:

- `corp.damage_kill`
- `corp.rush_score`

Das passt zur Deckstruktur: End-the-run-/Tag-/Trace-ICE, Schadenskomponenten, Project Consultants als Advancement-Burst und mehrere Wirtschaftswerkzeuge. Der Matchfehler liegt nicht in dieser Ableitung. Der ausführbare Fast-Advance-Pfad wird im Portfolio sogar erkannt, aber vom Scheduler verdrängt.

### Siren Fortress

Abgeleitete Primärstrategien:

- `corp.remote_scoring`
- `corp.asset_economy`
- `corp.damage_kill`

Sekundär:

- `corp.deck_recycle_engine`
- `corp.rush_score`

Auch diese Ableitung ist fachlich plausibel: fünf Signale für Remote-Scoring-Schutz, Asset-Economy, starkes ICE und mehrere Scoring-/ICE-Modifikatoren. Dass die Corp null Punkte erzielt, ist deshalb ein Consumer- und Ausführungsfehler. `corp.remote_scoring` wird nicht als konsistente Server- und Zugfolge durchgehalten.

Der globale Doctrine-Aggregationstest ist grün (`5 deck profiles`). Der Siren-Hint-Audit findet keine fehlenden oder widersprüchlichen Kartenhints. Sein einmaliger Diagnose-Checkpoint weicht im aktuellen Code ohne historischen Plan-Warm-up von der damaligen Entscheidung ab; daraus wird ausdrücklich keine Hint-Abweichung abgeleitet.

## Positive Entwicklung

- Die Zentralverteidigung im langen Spiel ist substanziell besser: am Ende drei ICE vor HQ, drei vor R&D sowie zentrale Upgrades.
- BBS Whispering Campaign wird installiert, gerezzt und mehrfach korrekt für zwei Credits pro Aktion genutzt; auch zwei getrennte Kopien werden innerhalb eines Zugs verarbeitet.
- Night Shift wird im kurzen Spiel dem Grundkredit vorgezogen.
- Produktive Rez-Fenster werden teilweise richtig erkannt: Wall of Static, Quandary, Neural Blade, Ball and Chain, Liche und die abschließende Wall of Ice werden sinnvoll gerezzt.
- Die Corp legt inzwischen zweite ICE-Schichten an Remotes. Das frühere völlige Fehlen von Remote-Entwicklung ist verbessert, aber noch nicht zu einer Scoreline verbunden.
- Der Flatline im kurzen Spiel zeigt, dass die KI einen Runnerfehler mit Liche korrekt ausnutzt.

## Einzelprüfung – kurzes Spiel (39/39)

Legende: **G** korrekt/erzwungen, **Y** vertretbar oder nur im Zusammenhang schwach, **R** klarer Fehler beziehungsweise Teil einer klar fehlerhaften Sequenz.

| D | Zug | Aktion | Urteil | Begründung |
| ---: | ---: | --- | :---: | --- |
| 1 | 1 | Setup-Choice | G | Regel-/Setup-Fenster korrekt aufgelöst. |
| 2 | 1 | Mandatory Draw | G | Erzwungen. |
| 3 | 1 | Grundkredit | R | Offene Zentralen und mehrere legale ICE; Defense wird fälschlich als unbekannt abgewertet. |
| 4 | 1 | Grundkredit | R | Fehlerhafte Kreditsequenz wird ohne Neubewertung fortgesetzt. |
| 5 | 1 | Grundkredit | R | Dritte unproduktive Wiederholung; erzeugt Handüberlauf. |
| 6 | 1 | Zug beenden | R | Produktive ICE-Routen blieben liegen. |
| 7 | 1 | Off-Site Backups abwerfen | Y | Pflichtfenster; der Überlauf wurde durch D3–D6 selbst erzeugt. |
| 8 | 3 | Mandatory Draw | G | Erzwungen. |
| 9 | 3 | Grundkredit | R | HQ/R&D weiterhin offen, ICE vorhanden. |
| 10 | 3 | Grundkredit | R | Defense-Bedarf erneut ignoriert. |
| 11 | 3 | Grundkredit | R | Sechster Grundkredit ohne Boardentwicklung. |
| 12 | 3 | Zug beenden | R | Kein ICE installiert. |
| 13 | 3 | Chester Mix abwerfen | Y | Pflichtfolge des erneut erzeugten Überlaufs; Abwurf selbst vertretbar. |
| 14 | 5 | Mandatory Draw | G | Erzwungen. |
| 15 | 5 | Grundkredit | R | Gleiche Fehlklassifikation trotz 11 Credits. |
| 16 | 5 | Grundkredit | R | Keine neue Information rechtfertigt die Wiederholung. |
| 17 | 5 | Grundkredit | R | Neunter Grundkredit vor der ersten ICE-Installation. |
| 18 | 5 | Zug beenden | R | Beide Zentralen bleiben offen. |
| 19 | 5 | Liche abwerfen | Y | Zweite Kopie; lokal vertretbar, aber Folge der passiven Sequenz. |
| 20 | 7 | Mandatory Draw | G | Erzwungen. |
| 21 | 7 | Data Wall vor R&D | G | Erste notwendige Zentralverteidigung. |
| 22 | 7 | Wall of Static vor HQ | G | Schließt die zweite offene Zentrale. |
| 23 | 7 | Karte für Score-Material ziehen | G | Nach Verteidigung sinnvoll; kein Agenda-Material war vorher vorhanden. |
| 24 | 7 | Zug beenden | G | Aktionen verbraucht. |
| 25 | 9 | Mandatory Draw | G | Erzwungen. |
| 26 | 9 | Night Shift spielen | G | Zwei Credits sind besser als Grundkredit; exakte Operation verwendet. |
| 27 | 9 | Liche als zweite R&D-Schicht | G | Produktive qualitative Verteidigung. |
| 28 | 9 | BBS Campaign in neuen Remote | Y | Wirtschaftlich sinnvoll; zunächst ungeschützt, wird später aber entwickelt. |
| 29 | 9 | Zug beenden | G | Aktionen verbraucht. |
| 30 | 10 | Wall of Static rezzen | G | Aktiver HQ-Angriff, produktive Rez-Route. |
| 31 | 10 | Rez ablehnen | G | Keine weitere produktive exakte Rez-Route. |
| 32 | 10 | HQ-Root-Rez ablehnen | G | Kein nutzbarer Root-Pfad vorhanden. |
| 33 | 11 | Mandatory Draw | G | Erzwungen. |
| 34 | 11 | Grundkredit für Defense-Reserve | R | Vollständiger Same-Turn-Score-Pfad war bereits `ready`, wird aber von aufgeblähtem Defense-Funding verdrängt. |
| 35 | 11 | BBS Campaign rezzen | Y | Lokal sinnvoll, gehört aber zur verdrängenden Sequenz. |
| 36 | 11 | Zwei BBS-Credits nehmen | Y | Besser als Grundkredit, aber Same-Turn-Score bleibt liegen. |
| 37 | 11 | Wall of Ice vor Remote 1 | Y | Gute Remote-Schicht; der garantierte Hostile-Takeover-Score wurde dafür aufgegeben. |
| 38 | 11 | Zug beenden | G | Aktionen verbraucht. |
| 39 | 12 | Liche auf R&D rezzen | G | Korrekte P2-Reaktion; Runner läuft in den Flatline. |

## Einzelprüfung – langes Spiel (106/106)

| D | Zug | Aktion | Urteil | Begründung |
| ---: | ---: | --- | :---: | --- |
| 1 | 1 | Setup-Choice | G | Regel-/Setup-Fenster korrekt. |
| 2 | 1 | Mandatory Draw | G | Erzwungen. |
| 3 | 1 | Grundkredit | R | Offene Zentralen, sechs ICE in HQ; Defense fälschlich unbekannt. |
| 4 | 1 | Grundkredit | R | Fehlerhafte P6-Sequenz bleibt sticky. |
| 5 | 1 | Grundkredit | R | Erzeugt vermeidbaren Überlauf. |
| 6 | 1 | Zug beenden | R | Keine Zentralverteidigung trotz legaler Routen. |
| 7 | 1 | Wall of Ice abwerfen | R | Wertvolle Defense wird als Folge der passiven Sequenz verloren. |
| 8 | 3 | Mandatory Draw | G | Erzwungen. |
| 9 | 3 | Data Wall vor R&D | G | Sinnvolle erste Zentralverteidigung. |
| 10 | 3 | Quandary vor HQ | G | Schließt die zweite Zentrale. |
| 11 | 3 | Karte ziehen | G | Nach Grundschutz sinnvoll. |
| 12 | 3 | Zug beenden | G | Aktionen verbraucht. |
| 13 | 5 | Mandatory Draw | G | Erzwungen. |
| 14 | 5 | Ball and Chain als zweite R&D-Schicht | G | Verstärkt den stärker bedrohten Zentralserver. |
| 15 | 5 | Karte ziehen | G | Sucht Score-/Entwicklungsmaterial. |
| 16 | 5 | Neural Blade als dritte R&D-Schicht | Y | Vertretbar, aber deutliche Zentralüberkonzentration vor Remote-Aufbau. |
| 17 | 5 | Zug beenden | G | Aktionen verbraucht. |
| 18 | 7 | Mandatory Draw | G | Erzwungen. |
| 19 | 7 | Cinderella vor neuem Score-Remote | G | Korrekte Support-Aktion für Ice Transmutation. |
| 20 | 7 | BBS in einen weiteren neuen Remote | R | Bricht das Turn-Commitment und verschiebt die symbolische Remote-Zuordnung. |
| 21 | 7 | BBS rezzen | Y | Lokal richtig; Teil der konkurrierenden Economy-Sequenz. |
| 22 | 7 | Für Schutz von Remote 2 ziehen | R | Score-Parent ist auf den Wirtschaftsserver umgebunden; falsches konkretes Ziel. |
| 23 | 7 | Zug beenden | Y | Aktionen verbraucht, aber Score-Folge ist verloren. |
| 24 | 9 | Mandatory Draw | G | Erzwungen. |
| 25 | 9 | BBS-Payout | G | Produktive Wirtschaft. |
| 26 | 9 | Zweite BBS in Remote 1 | G | Vorhandenen Schutz für ein Wirtschaftswerkzeug genutzt. |
| 27 | 9 | Zweite BBS rezzen | G | Korrekte Kampagnenfortsetzung. |
| 28 | 9 | BBS-Payout | G | Produktive Wirtschaft. |
| 29 | 9 | Zug beenden | G | Aktionen verbraucht. |
| 30 | 10 | Quandary auf HQ rezzen | G | Aktiver Angriff; passende Rez-Reaktion. |
| 31 | 11 | Mandatory Draw | G | Erzwungen. |
| 32 | 11 | BBS-Payout | G | Produktiv. |
| 33 | 11 | Rio Grid in HQ | Y | Günstige Überlaufkonversion mit Boardwert. |
| 34 | 11 | BBS-Payout | G | Produktiv. |
| 35 | 11 | Zug beenden | G | Aktionen verbraucht. |
| 36 | 12 | Neural Blade rezzen | G | R&D-Run wird verteuert. |
| 37 | 12 | Ball and Chain rezzen | G | Weitere produktive Encounter-Verteidigung. |
| 38 | 12 | Weiteres Rez ablehnen | G | Keine ausgewiesene produktive Alternative. |
| 39 | 13 | Mandatory Draw | G | Erzwungen. |
| 40 | 13 | BBS-Payout | G | Produktiv. |
| 41 | 13 | Roving Submarine in Remote 1 | G | Überlaufabbau und Remote-Steuer. |
| 42 | 13 | BBS-Payout | G | Produktiv. |
| 43 | 13 | Zug beenden | G | Aktionen verbraucht. |
| 44 | 13 | Washington Grid abwerfen | G | Nicht-Agenda und als Overflow-Ziel vertretbar. |
| 45 | 15 | Mandatory Draw | G | Erzwungen. |
| 46 | 15 | Haunting Inquisition vor Remote 2 | G | Qualitative Remote-Verteidigung. |
| 47 | 15 | BBS-Payout | G | Erste Kopie korrekt genutzt. |
| 48 | 15 | BBS-Payout | G | Zweite Quelle korrekt verarbeitet. |
| 49 | 15 | Zug beenden | G | Aktionen verbraucht. |
| 50 | 17 | Mandatory Draw | G | Erzwungen. |
| 51 | 17 | BBS-Payout | G | Produktiv. |
| 52 | 17 | Washington Grid für 7 in R&D | R | Teure reine Überlaufkonversion; schwächt Score-Reserve und wird kurz darauf ersetzt. |
| 53 | 17 | BBS-Payout | G | Produktiv. |
| 54 | 17 | Zug beenden | G | Aktionen verbraucht. |
| 55 | 19 | Mandatory Draw | G | Erzwungen. |
| 56 | 19 | BBS-Payout | G | Produktiv. |
| 57 | 19 | Corporate Negotiating Center in Remote 1 | Y | Vertretbarer Upgrade-/Überlaufwert, aber Score-Remote wird weiter wirtschaftlich belegt. |
| 58 | 19 | BBS-Payout | G | Produktiv. |
| 59 | 19 | Zug beenden | G | Aktionen verbraucht. |
| 60 | 21 | Mandatory Draw | G | Erzwungen. |
| 61 | 21 | BBS-Payout | G | Produktiv. |
| 62 | 21 | Rio Grid ersetzt Washington Grid in R&D | Y | Lokale Verbesserung möglich, dokumentiert aber die wertvernichtende D52-Sequenz. |
| 63 | 21 | BBS-Payout | G | Produktiv. |
| 64 | 21 | Zug beenden | G | Aktionen verbraucht. |
| 65 | 22 | Rez ablehnen | G | Am HQ-Approach keine weitere ICE-Rez-Alternative. |
| 66 | 22 | Rez ablehnen | G | Wiederholtes Fenster ohne produktive Alternative. |
| 67 | 22 | HQ-Root-Rez ablehnen | G | Keine Engine-zertifizierte Root-Route. |
| 68 | 23 | Mandatory Draw | G | Erzwungen. |
| 69 | 23 | BBS-Payout | G | Produktiv. |
| 70 | 23 | Für Score-Schutz ziehen | R | Residenter Score-Plan kann Ziel/Schutz nicht abschließend quoten und macht keinen Installationsfortschritt. |
| 71 | 23 | Zweites HQ-ICE installieren | G | Nach HQ-Agenda-Verlust nachvollziehbare Zentralverteidigung. |
| 72 | 23 | Zug beenden | G | Aktionen verbraucht. |
| 73 | 25 | Mandatory Draw | G | Erzwungen. |
| 74 | 25 | BBS-Payout | G | Produktiv. |
| 75 | 25 | Corporate Negotiating Center in Remote 2 | Y | Nutzbare Überlaufkonversion, aber keine Scoreline. |
| 76 | 25 | Grundkredit | Y | Kein klarer Fehler isoliert; Score-Projekte bleiben jedoch liegen. |
| 77 | 25 | Zug beenden | G | Aktionen verbraucht. |
| 78 | 26 | Haunting Inquisition nicht rezzen | R | Berechenbare hohe Runnerbelastung wird als unbekannt verworfen. |
| 79 | 26 | Remote-Root-Rez ablehnen | G | Nach passiertem ICE keine ausgewiesene produktive Root-Reaktion. |
| 80 | 26 | Rez ablehnen | G | Neural Blade war bereits rezzed; keine ICE-Rez-Alternative. |
| 81 | 26 | R&D-Root-Rez ablehnen | G | Kein produktiver Root-Pfad. |
| 82 | 26 | Rez ablehnen | G | Ball and Chain bereits rezzed. |
| 83 | 26 | R&D-Root-Rez ablehnen | G | Kein produktiver Root-Pfad. |
| 84 | 26 | Data Wall nicht rezzen | R | Rez 1 gegen sicher berechenbaren Runneraufwand 1 bei kritischem R&D-Spezialzugriff. |
| 85 | 26 | R&D-Root-Rez ablehnen | G | Kein produktiver Root-Pfad. |
| 86 | 27 | Mandatory Draw | G | Erzwungen. |
| 87 | 27 | Grundkredit | Y | Hohe Liquidität; Score-Priorität bleibt zu schwach. |
| 88 | 27 | Zweites Cinderella vor Remote 1 | G | Als Support für Tycho fachlich sinnvoll. |
| 89 | 27 | Grundkredit | R | Alle Agenda-Installationen werden durch pauschalen Last-Click-Horizont ausgeschlossen; vorbereiteter Plan stoppt. |
| 90 | 27 | Zug beenden | G | Aktionen verbraucht. |
| 91 | 27 | Haunting Inquisition abwerfen | Y | Nicht-Agenda; Overflow-Folge der fehlenden Score-Konversion. |
| 92 | 29 | Mandatory Draw | G | Erzwungen. |
| 93 | 29 | Drittes HQ-ICE installieren | Y | HQ-Schutz ist nachvollziehbar, verdrängt aber erneut das residente Score-Projekt. |
| 94 | 29 | Für Remote-1-Schutz ziehen | R | Remote hat bereits zwei ICE; Bewertung bleibt unbekannt und Draw erzeugt reine Agenda-Überlaufhand. |
| 95 | 29 | Grundkredit | R | Letzte Aktion wird erneut pauschal statt als Teil eines Zugplans bewertet. |
| 96 | 29 | Zug beenden | R | Führt wissentlich in erzwungenen Agenda-Abwurf. |
| 97 | 29 | Tycho Extension abwerfen | R | Agenda-Abwurf erzwungen, aber vier Punkte/Advancement vier ist die schlechteste Risikowahl. |
| 98 | 31 | Mandatory Draw | G | Erzwungen. |
| 99 | 31 | Wall of Ice vor Archives | G | Richtige lokale Notverteidigung für die sichtbare Tycho. |
| 100 | 31 | Erneut für Remote-1-Schutz ziehen | R | Staler Score-Support wiederholt sich ohne Fortschritt. |
| 101 | 31 | Grundkredit | R | Kein Beitrag zur akuten Agenda-Konversion. |
| 102 | 31 | Zug beenden | R | Noch ein ausschließlich aus Agendas bestehender Überlauf. |
| 103 | 31 | AI Chief Financial Officer abwerfen | Y | Agenda-Abwurf erneut erzwungen; zwei Punkte bei Advancement fünf ist diesmal die vernünftigere Zielwahl. |
| 104 | 32 | Wall of Ice auf Archives rezzen | G | Richtige akute Verteidigung, wenn auch sehr teuer und zu spät. |
| 105 | 32 | Weiteres Rez ablehnen | G | Keine weitere ICE-Rez-Alternative. |
| 106 | 32 | Archives-Root-Rez ablehnen | G | Kein produktiver Root-Pfad; Runner bricht Wall of Ice und stiehlt Tycho. |

## Freigabevorschlag für eine spätere Umsetzung

Vor jeder Verhaltensänderung müssen die historischen Stellen mit aktuellem Code und vollständigem Plan-Warm-up als enge Decision-Checkpoints reproduziert werden. Empfohlene Reihenfolge:

1. F2: Same-Turn-Score gegen Defense-Prioritätsinflation.
2. F3/F4: atomare Remote-Bindung und Score-Route-Revalidierung.
3. F1: frühe Defense-Installationsbewertung innerhalb des Defense-Plans.
4. F5: deterministische aktive Rez-Quote.
5. F6/F7: Handüberlauf, Reserve und plan-gebundene Discard-Zielwahl.
6. F8: isolierte Hintdatenkorrektur.

Nur ein auf aktuellem Code roter Checkpoint ist Implementierungsfreigabe. Ist ein historischer Fehler bereits grün, wird dafür kein weiterer Algorithmus ergänzt.
