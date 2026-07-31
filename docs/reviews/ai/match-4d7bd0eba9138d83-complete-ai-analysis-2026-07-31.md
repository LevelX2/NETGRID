# KI-Spielanalyse `match_4d7bd0eba9138d83`

Stand: 2026-07-31 · Modus: Mensch als Runner gegen Corp-KI · Ergebnis: Runner gewinnt durch leeres Corp-Deck.

## Vollständigkeit und Methode

- 204 erwartete KI-Entscheidungen, 204 Trace-Zeilen, 204 korrekt verknüpfte Events.
- Bewertet wurden jeweils LegalActions, Plan-/Step-Bindung, unmittelbarer Vorzustand und Zustandsänderung.
- Die private Corp-Hand wurde nur für die KI-Analyse verwendet. Runner-Handkarten werden nicht ausgegeben.
- `Fehlerfolge` bezeichnet einen in diesem Fenster unvermeidbaren Schritt, dessen Ursache in früherer Planung liegt.

## Gesamturteil

Die Zentralverteidigung ist deutlich besser: Am Ende liegen fünf gerezzte ICE vor HQ und fünf gerezzte von sieben ICE vor R&D. Die Corp scheitert dennoch strukturell, weil Score-Plan und Defense-Support nach der ersten Remote-Schicht nicht weiterkommen. Dadurch nimmt die KI über viele Züge Basic Credits, hält fünf bis sechs Agendas auf HQ, wirft zwei davon ab und verliert schließlich durch leeres R&D. Twenty-Four-Hour Surveillance besitzt eine legale, bezahlbare Rez-Action und korrekte Semantik, wird auf dem entscheidenden HQ-Run aber zehnmal als nicht produktiv aussortiert.

## Hauptbefunde

1. **Twenty-Four-Hour Surveillance:** Nach dem Rez von Ball and Chain standen 13 Corp-Credits zur Verfügung. Der Runner hatte sichtbar sechs verwendbare Stealth-Bits (2× Invisibility, Vewy Vewy Quiet, Cortical Cybermodem). Trotzdem wurde die 1-Credit-Rez-Action mit `corp_root_rez_has_no_exact_engine_certified_economy_or_defense_route` verworfen. Der aktuelle Code reproduziert Entscheidung 177 ohne Warmup-Drift.
2. **Remote-Härtungsdeadlock:** `score_protection_staging_install` wird derzeit verworfen, sobald das Zielremote bereits irgendein ICE besitzt. Genau deshalb bleibt jedes Remote einschichtig, obwohl der Schutzvertrag noch nicht erfüllt ist. Zentral-ICE wird weiter aufgebaut.
3. **Agenda-/Handdeadlock:** In den Zügen 42 und 44 wird ein vorbereiteter, aber blockierter Score-Parent gegenüber der New-Remote-Variante bevorzugt. Es existiert dann kein ausführbarer Score-Step; Economy nimmt je dreimal einen Credit. Die Sechserhand besteht anschließend ausschließlich aus Agendas, sodass der konkrete Agenda-Abwurf unvermeidbar wird.
4. **Späte Passivität:** Ab Zugserial 42 bestehen vier Corp-Züge ausschließlich aus Basic Credits beziehungsweise lokalem Zentral-ICE-Aufbau. Nach Zugserial 14 wird keine weitere Agenda advanced oder gescort.
5. **Deckdoktrin:** Der Deck-Audit erkennt korrekt `corp.ice_tax_glacier`, `corp.fast_advance` und `corp.remote_scoring`. Der Fehler liegt daher nicht in der groben Doctrine, sondern in der konkreten Score-/Defense-Ausführung und der fehlenden Rez-Wirkungsroute.

## Jede KI-Entscheidung

| D | Zugserial | Plan / Aktion | Auswahl | Urteil | Begründung |
|---:|---:|---|---|---|---|
| 1 | -1 | engine_window / resolve_choice | Korp-Starthand | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 2 | -1 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 3 | -1 | corp.defend_servers / install_card | ICE vor R&D installieren | Gut | R&D wird im Eröffnungszug geschützt. |
| 4 | -1 | corp.economy / play_operation | Accounts Receivable spielen | Stimmig | Operation liefert unmittelbaren Economy-, Draw- oder Score-Fortschritt. |
| 5 | -1 | corp.defend_servers / install_card | ICE vor HQ installieren | Gut | HQ wird im Eröffnungszug geschützt. |
| 6 | -1 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 7 | 2 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 8 | 2 | corp.economy / play_operation | Efficiency Experts spielen | Stimmig | Operation liefert unmittelbaren Economy-, Draw- oder Score-Fortschritt. |
| 9 | 2 | corp.defend_servers / install_card | ICE vor neuem Remote installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 10 | 2 | corp.score_agenda / install_card | Karte in Remote 1 installieren | Fragwürdig | Früher Agenda-Rush hinter nur einem Banpei; die Agenda ging anschließend verloren. |
| 11 | 2 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 12 | 3 | corp.defend_servers / rez_ice | Banpei rezzen | Gut | Banpei wird beim Angriff auf das Agenda-Remote korrekt gerezzt. |
| 13 | 4 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 14 | 4 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 15 | 4 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 16 | 4 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 17 | 4 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 18 | 6 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 19 | 6 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 20 | 6 | corp.economy / play_operation | Accounts Receivable spielen | Stimmig | Operation liefert unmittelbaren Economy-, Draw- oder Score-Fortschritt. |
| 21 | 6 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 22 | 6 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 23 | 8 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 24 | 8 | corp.hand_and_agenda_management / play_operation | Night Shift spielen | Stimmig | Operation liefert unmittelbaren Economy-, Draw- oder Score-Fortschritt. |
| 25 | 8 | corp.defend_servers / install_card | ICE vor R&D installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 26 | 8 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 27 | 8 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 28 | 10 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 29 | 10 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 30 | 10 | corp.economy / play_operation | Accounts Receivable spielen | Stimmig | Operation liefert unmittelbaren Economy-, Draw- oder Score-Fortschritt. |
| 31 | 10 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 32 | 10 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 33 | 11 | corp.defend_servers / rez_ice | Scramble rezzen | Stimmig | Legales ICE wird im angegriffenen Fort mit erhaltener Planbindung gerezzt. |
| 34 | 11 | corp.defend_servers / rez_ice | Filter rezzen | Stimmig | Legales ICE wird im angegriffenen Fort mit erhaltener Planbindung gerezzt. |
| 35 | 12 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 36 | 12 | corp.defend_servers / install_card | ICE vor R&D installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 37 | 12 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 38 | 12 | corp.hand_and_agenda_management / install_card | Karte in Remote 1 installieren | Fragwürdig | Department of Truth Enhancement belegt das Scoring-Remote, wird nicht genutzt und beim nächsten Agenda-Install ersetzt. |
| 39 | 12 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 40 | 13 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 41 | 13 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 42 | 14 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 43 | 14 | corp.score_agenda / install_card | Karte in Remote 1 installieren | Gut | Fast-Advance-Sequenz wird mit Agenda-Install begonnen. |
| 44 | 14 | corp.score_agenda / play_operation | Management Shake-Up spielen | Gut | Management Shake-Up liefert die benötigten Advancement-Counter. |
| 45 | 14 | engine_window / resolve_choice | Advancement-Counter legen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 46 | 14 | corp.score_agenda / advance_card | Political Coup in Remote 1 advancen | Gut | Der letzte Advancement-Schritt bleibt an derselben Score-Instanz gebunden. |
| 47 | 14 | corp.score_agenda / score_agenda | Agenda in Remote 1 scoren | Gut | Political Coup wird regelkonform gescort. |
| 48 | 14 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 49 | 16 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 50 | 16 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 51 | 16 | corp.defend_servers / install_card | ICE vor R&D installieren | Fragwürdig | Vierte R&D-Schicht wird bei leerer Corp-Kasse gelegt, während das Scoring-Remote einschichtig bleibt. |
| 52 | 16 | corp.ambush_and_bluff / install_card | Karte in Remote 1 installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 53 | 16 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 54 | 18 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 55 | 18 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 56 | 18 | corp.hand_and_agenda_management / install_card | Karte in Remote 1 installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 57 | 18 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 58 | 18 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 59 | 20 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 60 | 20 | corp.economy / activated_card_ability | Political Coup: 3 Credits nehmen | Gut | Political-Coup-Bank liefert drei Credits statt eines Basic Credits. |
| 61 | 20 | corp.hand_and_agenda_management / install_card | Karte in HQ installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 62 | 20 | corp.economy / activated_card_ability | Political Coup: 3 Credits nehmen | Gut | Political-Coup-Bank wird erneut korrekt vor Basic Credit genutzt. |
| 63 | 20 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 64 | 22 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 65 | 22 | corp.defend_servers / install_card | ICE vor R&D installieren | Fragwürdig | Fünfte R&D-Schicht vor Ausbau eines dauerhaft nutzbaren Scoring-Remotes. |
| 66 | 22 | corp.economy / play_operation | Efficiency Experts spielen | Stimmig | Operation liefert unmittelbaren Economy-, Draw- oder Score-Fortschritt. |
| 67 | 22 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 68 | 22 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 69 | 24 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 70 | 24 | corp.economy / install_card | Karte in neuem Remote installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 71 | 24 | corp.economy / rez_card | Karte in Remote 2 rezzen | Stimmig | Legal, plan-first gebunden und ohne konkreten Gegenbeweis im Entscheidungszustand. |
| 72 | 24 | corp.economy / activated_card_ability | Political Coup: 3 Credits nehmen | Gut | Political-Coup-Bank liefert drei Credits. |
| 73 | 24 | corp.economy / activated_card_ability | Political Coup: 3 Credits nehmen | Gut | Political-Coup-Bank liefert erneut drei Credits. |
| 74 | 24 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 75 | 26 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 76 | 26 | corp.defend_servers / install_card | ICE vor HQ installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 77 | 26 | corp.hand_and_agenda_management / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 78 | 26 | corp.defend_servers / install_card | ICE vor R&D installieren | Fragwürdig | Sechste R&D-Schicht trotz Agenda in HQ und nur einschichtigem Scoring-Remote. |
| 79 | 26 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 80 | 28 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 81 | 28 | corp.defend_servers / install_card | ICE vor Remote 2 installieren | Gut | Erste Score-Support-Schicht wird korrekt durch corp.defend_servers auf Remote 2 gelegt. |
| 82 | 28 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 83 | 28 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 84 | 28 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 85 | 29 | corp.defend_servers / rez_ice | Fire Wall rezzen | Stimmig | Legales ICE wird im angegriffenen Fort mit erhaltener Planbindung gerezzt. |
| 86 | 29 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 87 | 29 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 88 | 29 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 89 | 29 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 90 | 29 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 91 | 29 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 92 | 29 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 93 | 29 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 94 | 29 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 95 | 29 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 96 | 29 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 97 | 29 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 98 | 29 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 99 | 30 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 100 | 30 | corp.defend_servers / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 101 | 30 | corp.economy / install_card | Karte in neuem Remote installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 102 | 30 | corp.economy / rez_card | Karte in Remote 3 rezzen | Stimmig | Legal, plan-first gebunden und ohne konkreten Gegenbeweis im Entscheidungszustand. |
| 103 | 30 | corp.economy / activated_card_ability | BBS Whispering Campaign: 2 Credits nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 104 | 30 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 105 | 31 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 106 | 31 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 107 | 32 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 108 | 32 | corp.economy / activated_card_ability | 1 Credit nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 109 | 32 | corp.hand_and_agenda_management / install_card | Karte in HQ installieren | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 110 | 32 | corp.economy / activated_card_ability | 1 Credit nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 111 | 32 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 112 | 34 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 113 | 34 | corp.economy / activated_card_ability | 1 Credit nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 114 | 34 | corp.hand_and_agenda_management / install_card | Karte in HQ installieren | Gut | Twenty-Four-Hour Surveillance wird passend in HQ installiert. |
| 115 | 34 | corp.economy / activated_card_ability | 1 Credit nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 116 | 34 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 117 | 36 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 118 | 36 | corp.defend_servers / install_card | 1 Credit nehmen | Vertretbar | Legaler planbesessener Aufbau-Schritt; aus diesem Einzelzustand kein klar besserer harter Gegenbeweis. |
| 119 | 36 | corp.economy / activated_card_ability | 1 Credit nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 120 | 36 | corp.defend_servers / install_card | ICE vor R&D installieren | Fragwürdig | Siebte R&D-Schicht; lokale Zentralverteidigung steigt, Remote-Fortschritt bleibt aus. |
| 121 | 36 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 122 | 38 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 123 | 38 | corp.economy / activated_card_ability | BBS Whispering Campaign: 2 Credits nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 124 | 38 | corp.economy / activated_card_ability | BBS Whispering Campaign: 2 Credits nehmen | Stimmig | Sichtbarer Karten-Payout ist dem Basic Credit überlegen und wird planmäßig genutzt. |
| 125 | 38 | corp.economy / gain_credit | 1 Credit nehmen | Fragwürdig | Basic Credit trotz sichtbarer Score- und Remote-Härtungslücke. |
| 126 | 38 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 127 | 40 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 128 | 40 | corp.defend_servers / install_card | ICE vor Remote 3 installieren | Gut | Erste Score-Support-Schicht wird korrekt auf Remote 3 gelegt. |
| 129 | 40 | corp.defend_servers / draw_card | Karte ziehen | Fehler | Nach der ersten Remote-Schicht wird keine weitere Score-Support-Schicht materialisiert; Draw/Basic Credit übernimmt. |
| 130 | 40 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Nach der ersten Remote-Schicht wird keine weitere Score-Support-Schicht materialisiert; Draw/Basic Credit übernimmt. |
| 131 | 40 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 132 | 40 | engine_window / resolve_choice | Korp-Discard wählen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 133 | 41 | corp.defend_servers / rez_ice | Bolter Cluster rezzen | Gut | Bolter Cluster wird auf dem R&D-Run produktiv gerezzt. |
| 134 | 41 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 135 | 41 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 136 | 41 | corp.defend_servers / rez_ice | Ball and Chain rezzen | Gut | Ball and Chain wird auf dem R&D-Run produktiv gerezzt. |
| 137 | 41 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 138 | 41 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 139 | 41 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 140 | 41 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 141 | 41 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 142 | 41 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 143 | 41 | corp.defend_servers / rez_ice | Ball and Chain rezzen | Gut | Zweites Ball and Chain wird auf dem R&D-Run produktiv gerezzt. |
| 144 | 41 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 145 | 41 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 146 | 41 | corp.defend_servers / decline_rez | Nicht rezzen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 147 | 42 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 148 | 42 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 149 | 42 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 150 | 42 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 151 | 42 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 152 | 42 | engine_window / resolve_choice | Korp-Discard wählen | Fehlerfolge | Die Hand besteht nur aus Agendas. Der einzelne Abwurf ist jetzt unvermeidbar; verursacht wurde er durch die vorangehende Planblockade. |
| 153 | 44 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 154 | 44 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 155 | 44 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 156 | 44 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 157 | 44 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 158 | 44 | engine_window / resolve_choice | Korp-Discard wählen | Fehlerfolge | Die Hand besteht nur aus Agendas. Der einzelne Abwurf ist jetzt unvermeidbar; verursacht wurde er durch die vorangehende Planblockade. |
| 159 | 46 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 160 | 46 | corp.defend_servers / install_card | ICE vor HQ installieren | Fragwürdig | Vierte HQ-Schicht schützt die Agendahand, löst aber das fehlende Scoring-Remote nicht. |
| 161 | 46 | corp.defend_servers / draw_card | Karte ziehen | Vertretbar | Planbesessener Draw mit offenem Karten-/Schutzbedarf; Ergebnis wird anschließend neu bewertet. |
| 162 | 46 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 163 | 46 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 164 | 46 | engine_window / resolve_choice | Korp-Discard wählen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 165 | 48 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 166 | 48 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 167 | 48 | corp.defend_servers / install_card | ICE vor HQ installieren | Fragwürdig | Fünfte HQ-Schicht schützt die Agendahand, während kein Remote mehr als ein ICE erhält. |
| 168 | 48 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 169 | 48 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 170 | 50 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 171 | 50 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 172 | 50 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 173 | 50 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 174 | 50 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 175 | 50 | engine_window / resolve_choice | Korp-Discard wählen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 176 | 51 | corp.defend_servers / rez_ice | Ball and Chain rezzen | Gut | Äußerstes HQ-ICE wird zuerst gerezzt; anschließend bleibt ein weiteres Rez-Fenster offen. |
| 177 | 51 | corp.defend_servers / decline_rez | Keine weitere Karte rezzen / Begegnung beginnen | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 178 | 51 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 179 | 51 | corp.defend_servers / rez_ice | Data Wall rezzen | Gut | Data Wall wird auf dem HQ-Run produktiv gerezzt. |
| 180 | 51 | corp.defend_servers / decline_rez | Keine weitere Karte rezzen / Begegnung beginnen | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 181 | 51 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 182 | 51 | corp.defend_servers / rez_ice | Laser Wire rezzen | Gut | Laser Wire wird auf dem HQ-Run produktiv gerezzt. |
| 183 | 51 | corp.defend_servers / decline_rez | Keine weitere Karte rezzen / Begegnung beginnen | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 184 | 51 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 185 | 51 | corp.defend_servers / decline_rez | Keine weitere Karte rezzen / Begegnung beginnen | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 186 | 51 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 187 | 51 | corp.defend_servers / rez_ice | Scramble rezzen | Gut | Scramble wird auf dem HQ-Run produktiv gerezzt. |
| 188 | 51 | corp.defend_servers / decline_rez | Keine weitere Karte rezzen / Begegnung beginnen | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 189 | 51 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Fehler | 24 Hour Surveillance ist auf dem angegriffenen HQ bezahlbar und sperrt sichtbare Stealth-Bits, wird aber ohne Defense-Route ausgeschlossen. |
| 190 | 52 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 191 | 52 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 192 | 52 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 193 | 52 | corp.economy / gain_credit | 1 Credit nehmen | Fehler | Basic Credit ersetzt einen blockierten Score-/Remote-Fortschritt; die Aktion führt direkt in Agenda-Overflow beziehungsweise Deckverlust. |
| 194 | 52 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 195 | 54 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |
| 196 | 54 | corp.defend_servers / install_card | ICE vor Archives installieren | Gut | Archives wird nach den Agenda-Abwürfen wenigstens mit legalem ICE abgesichert. |
| 197 | 54 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 198 | 54 | corp.economy / gain_credit | 1 Credit nehmen | Vertretbar | Kein in diesem Einzelzustand belegter höherwertiger ausführbarer Step; Credit verbessert die Rez-/Score-Finanzierung. |
| 199 | 54 | corp.complete_turn / end_turn | Zug beenden | Stimmig | Alle drei normalen Corp-Klicks sind verbraucht; EndTurn ist nicht vorzeitig. |
| 200 | 55 | corp.defend_servers / rez_ice | Filter rezzen | Gut | Das Archives-ICE wird beim Angriff korrekt gerezzt. |
| 201 | 55 | corp.defend_servers / decline_rez | Keine weitere Karte rezzen / Begegnung beginnen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 202 | 55 | corp.defend_servers / decline_rez | Keine weitere Karte rezzen / Begegnung beginnen | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 203 | 55 | corp.defend_servers / decline_rez | Nichts rezzen / Weiter | Stimmig | Die angebotenen Root-Rez-Alternativen wirken nicht auf das aktuell angegriffene Fort oder besitzen in diesem Fenster keinen belegten Nutzen. |
| 204 | 56 | engine_window / mandatory_draw | Korp Pflichtkarte ziehen | Regelbedingt | Engine-Fenster wird legal und deterministisch aufgelöst; keine eigenständige strategische Planwahl in diesem Schritt. |

## Deckweiter Hint-/Consumer-Audit

Auditmenge: 34 eindeutige Corp-Karten, 45 Karten insgesamt, keine Ausschlüsse. Twenty-Four-Hour Surveillance besitzt aktiven und kompilierten `run_tax`-/Fort-/During-Run-Kontext; der semantische Kandidat trägt `effect:run_tax`, `effect_scope:fort`, `effect_timing:during_run` und `rez.reserve_spend`. Die finale Defense-Route fehlt dennoch. Der Audit meldet zusätzlich vier bereits vorhandene, für diesen Spielbefund nicht ursächliche Hint-Gate-Findings bei Political Coup, Department of Truth Enhancement und Omni Kismet, Ph.D.; diese werden nicht in dieses Paket hineingezogen.

## Vorgeschlagener Umsetzungszuschnitt

- Im bestehenden `corp.defend_servers` eine generische exakte Root-Rez-Wirkungsbewertung für fortgebundene Stealth-Zahlquellensperren ergänzen: nur aktueller Run auf demselben Fort, sichtbarer positiver Stealth-Pool, exakte aktuelle LegalAction, bezahlbare Engine-Kosten und bestehender Score-Reservevertrag.
- Keine Karten-ID-Abzweigung, kein neuer Plan, kein Choice-Resolver und kein pauschales Rezzen günstiger Upgrades.
- Separat den vorhandenen Score-Protection-Staging-Vertrag so erweitern, dass auch eine zweite oder dritte ICE-Schicht zulässig ist, solange der exakte Schutzbedarf noch offen ist und die konkrete Schicht den Schutz nachweisbar verbessert. Keine feste Layerzahl und kein automatisches vierte/fünfte-ICE-Verhalten.
- Den vorbereiteten Score-Parent nur dann die New-Remote-Geschwisterroute verdrängen lassen, wenn er selbst einen ausführbaren nächsten Score- oder Defense-Support-Step besitzt; dadurch wird der Agenda-/Credit-Loop generisch aufgelöst.
