# Vollanalyse zweier nachfolgender Corp-KI-Spiele

Stand: 2026-08-01  
Analysebranch: `codex/ai-post-analysis-d249-9475`  
SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite` (kurzlebig, read-only)  
Analysemethode: vollständige Klassifikation aller Corp-KI-Entscheidungen aus `ai_decision_traces`, den zugehörigen LegalAction-Alternativen, side-sicherer Corp-Sicht, sichtbarem Runner-Board und PublicEvents; deckweiter Hint-/Consumer-Audit auf dem aktuellen Code.

## Zeitliche Einordnung

Die Spiele wurden nach der vorherigen Vollanalyse von `match_723d40ac5a001d37` und `match_daed3ad3bead20fb` abgeschlossen, aber **vor** der daraus abgeleiteten Main-Integration `9d47f650b` vom 2026-08-01 00:21 Uhr MESZ:

| Spiel | Abschluss UTC | Abschluss MESZ | Relation zu `9d47f650b` |
| --- | --- | --- | --- |
| `match_d249f7fb9f8c1150` | 2026-07-31 20:17 | 2026-07-31 22:17 | vorher |
| `match_94753a9d0503e91d` | 2026-07-31 20:43 | 2026-07-31 22:43 | vorher |

Die Spiele sind deshalb neue Playtest-Evidence gegenüber der vorigen Analyse, aber keine Nachtests der danach integrierten F1-bis-F8-Korrekturen. Vor jedem weiteren Fix muss ein historischer Checkpoint auf aktuellem Code zeigen, ob der betreffende Fehler noch als `behavior_regression` reproduzierbar ist.

## Ergebnis und Coverage

| Spiel | Corp-Deck | Ergebnis | Endzustand | KI-Entscheidungen | Coverage |
| --- | --- | --- | ---: | ---: | ---: |
| `match_d249f7fb9f8c1150` | Neon Guillotine | Corp gewinnt durch Flatline in Zug 5 | SV 39 | 17 | 17/17 |
| `match_94753a9d0503e91d` | Chrome Rush Bureau | Runner gewinnt durch Agendapunkte in Zug 16 | SV 107 | 53 | 53/53 |

Es fehlen keine erwarteten Corp-KI-Traces. Es gibt keine verwaisten oder doppelten Traces und keine Abweichung zwischen Event-ActionType und Trace-ActionType. Alle Action-, Choice-, Discard- und Rezfenster sind klassifiziert.

## Gesamturteil

Die Entwicklung ist klar positiv:

- Neon Guillotine erkennt und vollendet die konkrete Folge `Chance Observation -> Trace-Bid -> Scorched Earth` und bestraft den getaggten Runner sofort.
- Chrome Rush Bureau baut mit Sleeper einen Scoring-Remote, rezzt das ICE im richtigen Angriffsfenster und scored Executive Extraction sowie zwei Hostile Takeovers. Die Corp bleibt also nicht mehr grundsätzlich bei null Agendapunkten stehen.
- Der mehrzügige Scoreplan bleibt von Installation über Advancement bis Score in den Entscheidungen 15 bis 23 stabil gebunden.
- Die deckweiten Hints und Doctrine-Consumer sind für beide exakten Decks ohne Blocker oder Warnung konsistent.

Die verbleibenden Schwächen sind nicht durch falsche Deckdoktrin verursacht. Sie liegen in Planfortsetzung, Defense-Projektion und fehlender planseitiger Nutzung eines bereits semantisch erkannten Asset-Payoffs.

## Deck-Hint- und Consumer-Audit

Es wurden keine Karten ausgeschlossen.

| Deck | Eindeutige Karten | Audit | Capability-Consumer | Strategy-Consumer |
| --- | ---: | --- | --- | --- |
| Neon Guillotine (`fnv1a:4231f37d`) | 26/26 | `ok`, 0 Blocker, 0 Warnungen | Banktool: Pocket Virtual Reality; keine Suchtools | primär `corp.tag_trace_punish`, `corp.damage_kill`, `corp.rush_score` |
| Chrome Rush Bureau (`fnv1a:2ebf0f5c`) | 29/29 | `ok`, 0 Blocker, 0 Warnungen | keine Such- oder Banktools | primär `corp.fast_advance`, `corp.ice_tax_glacier`, `corp.remote_scoring`; sekundär unter anderem `corp.economy_rez_reserve`, `corp.central_stabilize`, `corp.rush_score`, `corp.asset_economy` |

Die Doktrinen passen zu den Decklisten und zum beobachteten Verhalten. Insbesondere Chrome Rush Bureau erkennt Fast Advance und Remote Scoring korrekt. Der Fehler ist, dass diese Strategien nicht in jeder konkreten Restzuglinie bis zum Ende ausgeführt werden.

## Findings und generische Korrekturrichtung

### F1 – Sichtbar bedrohte Agenda wird hinter Asp nicht verteidigt

In Neon Guillotine installiert die Corp Bioweapons Engineering hinter Asp. Der Runner exposed die Agenda, startet den Run auf `remote_1` und hat sechs Credits. In D7/SV13 lehnt die Corp das Rezzen von Asp für vier Credits ab. Der Trace nennt `visible_rez_window_decline_without_defense_threat`, obwohl eine sichtbare Drei-Punkte-Agenda angegriffen wird. Asp bietet Trace 5, End-the-run und zusätzliche Run-Beschränkung. Selbst wenn der Runner den Trace finanzieren kann, erzwingt die Route einen erheblichen Ressourceneinsatz und verteidigt einen konkreten Payoff.

Generische Richtung: `corp.defend_servers` muss im aktiven Rezfenster den sichtbaren Root-Wert, Agenda-Exposition, ICE-Effektsemantik, Corp-Rezkosten, erwartbare Trace-/Break-Kosten und Runnerliquidität gemeinsam bewerten. Keine Asp- oder Karten-ID-Regel; die konkrete Rez-LegalAction und ihr Server sind Eigentum des Defense-Plans.

### F2 – Gebundener Overtime-Scorezug wird nach dem ersten Schritt verlassen

Chrome Rush Bureau D8/SV16 spielt Overtime Incentives unter `corp.score_agenda` mit `corp_same_turn_score_conversion:gain_action_capacity`. Danach besitzt die Corp vier Aktionen, fünf Credits und Executive Extraction in HQ. Die vollständige deterministische Folge `Agenda installieren -> dreimal advancen -> scoren` ist möglich. D9 zieht stattdessen für R&D-Verteidigung; D10 bis D12 spielen zweimal Night Shift und installieren Data Wall. Diese Aktionen sind einzeln nützlich, widersprechen aber dem ausdrücklich gewählten Same-Turn-Scoreplan.

Generische Richtung: Ein Action-Capacity-Schritt darf nur gewählt werden, wenn der Restzugplan die zusätzlich erzeugten Aktionen samt Agenda-, Zielserver-, Kosten- und Scorebindung enthält. Nach deterministischer Ausführung bleibt die Continuation resident. Replanning darf sie nur bei echter Zustandsänderung oder konkret belegter P1-/P2-Pflicht verdrängen. Das ist die gleiche Plan-/TurnPlanner-Familie wie die inzwischen integrierte Same-Turn-Score-Korrektur und muss zuerst gegen den aktuellen Stand reproduziert werden.

### F3 – Zusätzliche R&D-Verteidigung wird trotz konkreter Terminalgefahr ausgeschlossen

In Chrome Rush Bureau besitzt der Runner früh R&D Interface und greift R&D wiederholt für zwei Zugriffe an. Die Corp hält später Keeper und Filter, hat 12 bis 16 Credits und vor R&D nur eine ungerezzte Data Wall. Dennoch werden in D43/SV87 sowie D47 bis D49/SV96–98 alle legalen Keeper-/Filter-Installationen vor R&D mit `corp_additional_central_ice_deferred_without_exact_route:rd` ausgeschlossen. Stattdessen nimmt die Corp vier Grundkredite und muss zweimal abwerfen. Beim letzten Run hat der Runner drei Agendapunkte und 15 Credits; der anschließende Doppelzugriff findet Tycho Extension und beendet das Spiel.

Generische Richtung: Die zentrale Defense-Allokation muss sichtbaren Multiaccess, aktuelle Agendapunkte, Zugriffsfrequenz, vorhandene ICE-Schichten, konkrete ICE-Wirkung, Installations-/Rezkosten und Runner-Rig in einer endlichen Schutzquote zusammenführen. Eine zweite oder dritte Schicht darf als produktive, finanzierbare Terminalverteidigung gegen Basic Credit gewinnen. Es entsteht kein allgemeiner ICE-Zwang und keine Defense-Sonderlogik außerhalb `corp.defend_servers`; wirkungslose oder unfinanzierbare Tiefenstapel bleiben abzuwerten.

### F4 – Aktive Data-Wall-Rezfenster bleiben als unbekannt beziehungsweise immateriell liegen

Chrome Rush Bureau lehnt Data Wall vor R&D in D26/SV51, D39/SV76 und D52/SV102 ab. Der sichtbare Bartmoss Memorial Icebreaker kann die Subroutine für einen Credit brechen; die Corp könnte für einen Credit rezzen. Der historische Trace verwirft die Action als `corp_ice_rez_resource_exchange_unknown`. D52 ist besonders kritisch: R&D Interface, drei Runner-Agendapunkte und zwei Zugriffe erzeugen Terminalgefahr, während die Corp 16 Credits besitzt.

Das Rezzen garantiert gegen 15 Runner-Credits keinen Stopp. Es erzeugt aber den exakten Credit-Tax, die Bartmoss-Risikofolge und nutzt das letzte relevante Fenster vor einem potenziell spielentscheidenden Doppelzugriff. Der inzwischen integrierte Exact-Quote-Fix akzeptiert bei Kostengleichstand derzeit nur den Fall, dass der Runner dadurch alle Credits verliert. Daher ist für diesen reich finanzierten Matchpoint-Fall ein eigener aktueller Checkpoint nötig.

Generische Richtung: `corp.defend_servers` soll eine vollständige aktive Encounter-Quote nicht allein als isolierten Credit-Tausch bewerten. Bei akutem oder terminalem Serverwert müssen exakter Tax, Accessmenge, Runnerpunkte, ICE-Effekt, Breaker-Nebenfolgen und verbleibende Corp-Reserve gemeinsam in die konkrete Rezroute eingehen. Ein schwacher Tax außerhalb eines relevanten Zugriffs darf weiterhin abgelehnt werden.

### F5 – Installiertes advancebares Economy-Asset erhält keinen Folgeplan

D41/SV85 installiert Information Laundering als exakte Handüberlauf-Konversion in den bereits durch Sleeper geschützten Remote. Danach sind Advance- und Rez-Actions legal. D42, D43 sowie D47 bis D49 schließen das Advancen jedoch ausnahmslos mit `corp_visible_asset_advance_has_no_assigned_project` aus; das Rezzen wird als `corp_root_rez_has_no_exact_engine_certified_economy_or_defense_route` verworfen. Die Corp nimmt stattdessen Grundkredite. Das Asset wird nie advanced, gerezzt oder ausgezahlt.

Der Hint ist korrekt und der deckweite Strategy-Consumer erkennt `corp.asset_economy`. Die Semantik geht erst beim Planbesitz verloren: Handmanagement darf die Karte installieren, erzeugt aber keine anschließende Economy-Continuation; der Disposition-Guard blockiert zu Recht ungebundene Advances.

Generische Richtung: `corp.economy` benötigt eine eng gebundene Planroute für installierte advancebare Counter-Cashout-Assets, qualifiziert über strukturierte Effekt-/Hintsemantik und aktuelle LegalActions. Der Plan vergleicht vollständige Linien wie `n-mal advancen -> rezzen -> exakte Auszahlung` gegen Basic Credits, Defense und Scorebedarf, bindet konkrete Instanz und Remote und revalidiert nach jedem Schritt. Handmanagement darf eine solche Route anfordern, aber weder Payoff noch Ziel selbst neu entscheiden. Bluff-/Köderwert bleibt möglich; nicht jedes installierte advancebare Asset muss automatisch geladen werden.

## Vollständige Einzelprüfung – Neon Guillotine (17/17)

Legende: **G** plausibel/korrekt, **Y** vertretbar oder nur im Sequenzzusammenhang schwach, **R** Finding.

| D | SV | Zug | Aktion | Urteil | Begründung / beste sichtbare Alternative |
| ---: | ---: | ---: | --- | :---: | --- |
| 1 | 1 | 1 | Starthand behalten | G | Regel-/Setupfenster; konkrete Punish- und Defense-Komponenten vorhanden. |
| 2 | 2 | 1 | Mandatory Draw | G | Erzwungen. |
| 3 | 3 | 1 | Hunter vor HQ | G | Plausibler erster Zentralschutz; R&D wäre ebenfalls vertretbar, aber nicht eindeutig besser. |
| 4 | 4 | 1 | Asp vor neuem Remote | G | Gebundener Schutzschritt für die sichtbare Scorekampagne. |
| 5 | 5 | 1 | Bioweapons Engineering in Remote 1 | G | Konkrete Agenda hinter einer ICE-Schicht; konsistenter Rushversuch. |
| 6 | 6 | 1 | Zug beenden | G | Keine Aktionen verbleiben. |
| 7 | 13 | 2 | Asp nicht rezzen | R | Sichtbar exposed Drei-Punkte-Agenda wird angegriffen; Asp-Rez ist die produktive Alternative. |
| 8 | 18 | 3 | Mandatory Draw | G | Erzwungen. |
| 9 | 19 | 3 | Für R&D-Verteidigung ziehen | G | Kein weiteres ICE in HQ; konkreter Defense-Bedarf nach offenen R&D-Runs. |
| 10 | 20 | 3 | Grundkredit | G | Kein ICE gezogen; finanziert Punish-/Rezoptionen. Hostile Takeover wäre riskanter mehrzügiger Remote-Commit. |
| 11 | 21 | 3 | Grundkredit | G | Gleiche finanzielle Vorbereitung; keine neue produktive ICE-Action. |
| 12 | 22 | 3 | Zug beenden | G | Aktionen verbraucht. |
| 13 | 33 | 5 | Mandatory Draw | G | Erzwungen. |
| 14 | 34 | 5 | Für R&D-Verteidigung ziehen | G | Wiederum konkreter ICE-Suchbedarf; zugleich findet der Zug die Kill-Operation. |
| 15 | 35 | 5 | Chance Observation | G | Exakt gebundener P1-Punish-Pfad bei nur drei Runner-Handkarten. |
| 16 | 36 | 5 | Trace-Bid auflösen | G | Engine-Choice des bereits gewählten Punish-Schritts; Runner erhält den Tag. |
| 17 | 38 | 5 | Scorched Earth | G | Vollendet den legalen Flatline-Pfad unmittelbar. |

## Vollständige Einzelprüfung – Chrome Rush Bureau (53/53)

| D | SV | Zug | Aktion | Urteil | Begründung / beste sichtbare Alternative |
| ---: | ---: | ---: | --- | :---: | --- |
| 1 | 1 | 1 | Starthand behalten | G | Economy, Agenda, Action-Burst und Keeper ergeben eine spielbare Hand. |
| 2 | 2 | 1 | Mandatory Draw | G | Erzwungen. |
| 3 | 3 | 1 | Keeper vor HQ | G | Plausibler erster Zentralschutz; der spätere R&D-Interface-Zug war nicht vorwegzunehmen. |
| 4 | 4 | 1 | Efficiency Experts | G | Null Kosten, drei Credits; Basic Credit klar dominiert. |
| 5 | 5 | 1 | Day Shift | G | Zieht zwei Karten, gewinnt einen Credit und entwickelt Score-/Defense-Material. |
| 6 | 6 | 1 | Zug beenden | G | Keine Aktionen verbleiben. |
| 7 | 15 | 3 | Mandatory Draw | G | Erzwungen. |
| 8 | 16 | 3 | Overtime Incentives | Y | Als erster Schritt des vollständig möglichen Same-Turn-Scores richtig; wird nur durch die folgende Planaufgabe schlecht. |
| 9 | 17 | 3 | Für R&D-Verteidigung ziehen | R | Bricht ohne neue Information die gebundene Same-Turn-Scorelinie; Executive Extraction installieren ist die produktive Fortsetzung. |
| 10 | 18 | 3 | Night Shift | Y | Einzeln besser als Basic Credit, aber Folge der abgebrochenen Scorelinie. |
| 11 | 19 | 3 | Data Wall vor R&D | Y | Fachlich gute Zentralverteidigung, aber innerhalb dieses bereits bezahlten Overtime-Zugs hinter dem garantierten Score. |
| 12 | 20 | 3 | Night Shift | Y | Nützliche Economy, vollendet jedoch die falsche Restzugvariante. |
| 13 | 21 | 3 | Zug beenden | G | Aktionen verbraucht. |
| 14 | 27 | 5 | Mandatory Draw | G | Erzwungen. |
| 15 | 28 | 5 | Sleeper vor neuem Remote | G | Exakte Supportaktion für die Executive-Extraction-Kampagne. |
| 16 | 29 | 5 | Executive Extraction in Remote 1 | G | Zielbindung bleibt auf dem soeben erzeugten Remote stabil. |
| 17 | 30 | 5 | Executive Extraction advancen | G | Erster mehrzügiger Fortschritt hinter Sleeper. |
| 18 | 31 | 5 | Zug beenden | G | Keine Aktionen verbleiben. |
| 19 | 35 | 6 | Sleeper rezzen | G | Stoppt den konkreten Remote-Run; Runner kommt trotz Breaker-Suche nicht zur Agenda. |
| 20 | 41 | 7 | Mandatory Draw | G | Erzwungen. |
| 21 | 42 | 7 | Executive Extraction advancen | G | Residenter Scoreplan wird korrekt fortgesetzt. |
| 22 | 43 | 7 | Executive Extraction advancen | G | Erreicht Scorebereitschaft. |
| 23 | 44 | 7 | Executive Extraction scoren | G | Unmittelbare Konversion; kein unnötiger Zwischenzug. |
| 24 | 45 | 7 | Grundkredit | G | Verbleibender Klick; kein zwingend besserer kurzfristiger Schritt. |
| 25 | 46 | 7 | Zug beenden | G | Aktionen verbraucht. |
| 26 | 51 | 8 | Data Wall nicht rezzen | R | Doppelzugriff auf R&D; exakter Rez-/Break-Tax und Bartmoss-Risiko sind die produktive Alternative. |
| 27 | 58 | 9 | Mandatory Draw | G | Erzwungen. |
| 28 | 59 | 9 | Hostile Takeover in Remote 1 | G | Rezzed Sleeper und vollständiger Same-Turn-Scorepfad. |
| 29 | 60 | 9 | Hostile Takeover advancen | G | Planfortsetzung. |
| 30 | 61 | 9 | Hostile Takeover advancen | G | Durch Executive Extraction reduzierte Schwierigkeit wird korrekt genutzt. |
| 31 | 62 | 9 | Hostile Takeover scoren | G | Unmittelbarer Score und fünf Credits. |
| 32 | 63 | 9 | Zug beenden | G | Aktionen verbraucht. |
| 33 | 69 | 11 | Mandatory Draw | G | Erzwungen. |
| 34 | 70 | 11 | Zweites Hostile Takeover in Remote 1 | G | Erneut vollständiger Same-Turn-Pfad. |
| 35 | 71 | 11 | Hostile Takeover advancen | G | Planfortsetzung. |
| 36 | 72 | 11 | Hostile Takeover advancen | G | Scorebereitschaft erreicht. |
| 37 | 73 | 11 | Hostile Takeover scoren | G | Zweiter korrekter Schnellscore. |
| 38 | 74 | 11 | Zug beenden | G | Aktionen verbraucht. |
| 39 | 76 | 12 | Data Wall nicht rezzen | R | Wiederholter Doppelzugriff bei drei Runnerpunkten; gleiche unbekannte Rezquote. |
| 40 | 84 | 13 | Mandatory Draw | G | Erzwungen. |
| 41 | 85 | 13 | Information Laundering in Remote 1 | G | Als Handentlastung, Bluff und potenzielle Economy in bereits geschütztem Remote vertretbar. |
| 42 | 86 | 13 | Karte für Scorematerial ziehen | G | Keine Agenda in HQ; zwei Klicks erlauben nach dem Draw noch eine konkrete Reaktion. |
| 43 | 87 | 13 | Grundkredit | R | Der Draw findet Filter; Installation vor bedrohtem R&D vermeidet zugleich den Discard. Alternativ wäre ein gebundener Asset-Advance-Pfad besser als ein Grundkredit. |
| 44 | 88 | 13 | Zug beenden | G | Keine Aktionen verbleiben. |
| 45 | 89 | 13 | Falsified-Transactions Expert abwerfen | G | Lokal vertretbare Nicht-Agenda-Wahl; der Überlauf wurde durch D43 vermeidbar erzeugt. |
| 46 | 95 | 15 | Mandatory Draw | G | Erzwungen. |
| 47 | 96 | 15 | Grundkredit | R | Keeper/Filter vor R&D oder eine exakt gebundene Asset-Economy-Linie sind produktiver. |
| 48 | 97 | 15 | Grundkredit | R | Unveränderte Wiederholung trotz Terminaldruck und vollem HQ. |
| 49 | 98 | 15 | Grundkredit | R | Dritte Wiederholung; erzwingt erneut einen Discard und lässt R&D einschichtig. |
| 50 | 99 | 15 | Zug beenden | G | Aktionen verbraucht. |
| 51 | 100 | 15 | Management Shake-Up abwerfen | G | Bei erzwungenem Nicht-Agenda-Discard gegenüber Project Consultants vertretbar; der Zwang ist Folge von D47–D49. |
| 52 | 102 | 16 | Data Wall nicht rezzen | R | Letztes relevantes Fenster vor terminalem R&D-Doppelzugriff; Rezzen ist die produktive Gegenaktion, auch wenn es den Zugriff nicht garantiert stoppt. |
| 53 | 104 | 16 | Keine Root-Karte rezzen | G | Information Laundering liegt in anderem Remote und hat im R&D-Movement-Fenster keinen unmittelbaren Payoff; Decline ist korrekt. |

## Nicht freigabereif aus diesen Spielen

- Keeper vor HQ statt vor R&D in D3 ist kein belegter Fehler. Die Corp kannte den unmittelbar folgenden R&D-Interface-Draw nicht; beide ungeschützten Zentralen waren plausible Ziele.
- Das Rezzen von Data Wall hätte den finalen Zugriff gegen 15 Credits nicht garantiert verhindert. Belegt ist die fehlerhafte beziehungsweise unvollständige Bewertung des letzten Rezfensters, nicht ein sicher anderer Spielausgang.
- Die konkrete optimale Anzahl von Advances auf Information Laundering ist aus dem historischen Trace allein nicht festzulegen. Ein generischer Economy-Plan muss vollständige Restzuglinien, Liquidität, Remote-Risiko und Auszahlung vergleichen; ein pauschaler Advance-Zwang wäre falsch.
- Weil `9d47f650b` erst nach diesen Spielen integriert wurde, ist noch nicht belegt, welche historischen Findings auf aktuellem Code rot bleiben. Historische Checkpoints mit vollständigem Warm-up sind das nächste Gate; bereits grüne Fälle erhalten keinen zusätzlichen Fix.

## Vorgeschlagene Umsetzungspunkte nach Freigabe

1. Asp-/sichtbarer-Payoff-Rezfenster als exakten aktuellen Defense-Checkpoint sichern und nur bei aktueller Reproduktion die generische Rez-/Serverwertquote erweitern.
2. Overtime-Folgeentscheidung D9 als Same-Turn-Score-Continuation capturen und gegen die bereits integrierte TurnPlanner-Korrektur prüfen.
3. R&D-Schichtentscheidungen D43 und D47 als Terminal-/Multiaccess-Defense-Checkpoints capturen und gegen den aktuellen Staging-Vertrag prüfen.
4. Data-Wall-Rez D52 als Kostengleichstand-bei-Terminalzugriff capturen; Serverwert und Effektsemantik ausschließlich im bestehenden Defense-Plan ergänzen, falls der Checkpoint rot bleibt.
5. Information-Laundering-Folge D43/D47 als generische advancebare Counter-Cashout-Economy-Route modellieren, sofern der aktuelle Chooser weiterhin keine Planinstanz erzeugt. Keine Karten-ID-Sonderregel und kein Resolver-Shortcut.

