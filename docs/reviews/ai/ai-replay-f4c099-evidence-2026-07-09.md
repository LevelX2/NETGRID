# AI-Replay F4C099 Evidence 2026-07-09

## Match

- Match-ID: `match_f4c099f8b5edb26d`
- Modus: `human_corp_vs_runner_ai`
- Runner-KI: `hard`
- Ergebnis: Korp 7, Runner 2; Ende durch Agendapunkte
- Lokale Evidence: 198 Events, 198 State-Snapshots, 119 detaillierte AI-Decision-Traces
- Analysegrenze: ausschließlich Runner-PlayerView, LegalActions, side-gefilterte öffentliche Events und redigierte Decision-Traces; keine spätere verdeckte Kartenidentität wurde als frühere Entscheidungsgrundlage verwendet.

## Fehlergruppe 1: Remote-Finanzierung verbraucht das letzte Run-Fenster

In Decision 87 / StateVersion 138 hatte die Runner-KI nach Installation von `Pile Driver` noch 2 Klicks und 6 Credits. Remote 1 enthielt eine verdeckte Karte mit 5 Advancement-Countern hinter einer bekannten gerezzten `Data Wall` und einem unbekannten ICE. Die side-safe RunTarget-Evidence klassifizierte den Remote als `score_threat`, `urgency:high`, den bekannten Pfad als erreichbar und den Remote-Run mit Rohscore 1521.

Decision 87 nahm einen Credit. In Decision 88 / StateVersion 139 verblieben 1 Klick und 7 Credits. Der Remote-Run blieb legal, erreichbar und mit Rohscore 1521 deutlich über `gain_credit` mit 79. Der fortgeschriebene `runner.contest_remote`-Plan blieb dennoch auf `tactical_step:gain_credits` und verbrauchte den letzten Klick. Im folgenden Korp-Zug wurde die Agenda gescort.

Akzeptanzkriterium: Bei einem akuten erreichbaren Remote-Score-Threat darf `gain_credits_first` den letzten Klick nicht verbrauchen. Mit mehr als einem Klick darf Finanzierung weiterhin legal und sinnvoll bleiben.

## Fehlergruppe 2: Mehrfach-ICE-Quote verliert Breaker-Nebeneffekte

Decisions 108, 110, 114 und 117 starteten R&D-Runs mit 4, 4, 5 und 6 Cash. Der sichtbare Pfad bestand aus `Fire Wall` außen und `Keeper` innen. Installiert waren `Pile Driver`, `Codecracker` und `Cloak` mit 3 non-noisy Breaker-Credits.

Die Vorabquote meldete jeweils `can_reach_access:true`, `break_cost:7` und `credits_after:0|0|1|2`. Dabei wurde korrekt verhindert, dass `Cloak` direkt den noisy `Pile Driver` bezahlt. Nicht fortgeschrieben wurde jedoch `Pile Driver`-`postBreakStealthLoss:3`: Nach dem Wall-Break sind die `Cloak`-Credits nicht mehr für die vier `Codecracker`-Pumps gegen `Keeper` verfügbar.

Der aktive RunnerRunPlan erkannte im Encounter jeweils, dass keine zugriffserhaltende Sequenz bezahlbar war, und ließ die End-the-run-Subroutine auslösen. Das war im Encounter selbst wirtschaftlich korrekt; der Fehler lag in der Vorabquote und Run-Auswahl.

Der vorhandene Fix `16febfa69` ist abgegrenzt: Er verhindert das erneute Quotieren bereits passierter äußerer ICE in einem früheren HQ-Fall desselben Matches. Er war vor den Decisions 108 bis 118 bereits durch den Dev-Watch-Server geladen und betrifft nicht den noch nicht passierten äußeren `Fire Wall`-Fall.

Akzeptanzkriterium: Breaker-Nebeneffekte auf eingeschränkte Creditpools werden in Reihenfolge über den bekannten ICE-Pfad projiziert. Mit 4 bis 6 Cash ist der Pfad unbezahlt; mit 7 Cash ist er erreichbar und lässt 0 Cash übrig.

## Fehlergruppe 2b: Repeat-Run-Evidence fehlt im tatsächlichen PublicEvent

Die vorhandene Repeat-Run-Logik verlangt strukturierte Server-IDs und verwendet absichtlich keine UI-Labels als produktive Identität. Die gespeicherten `start_run`-Events 173, 175, 186 und 189 enthielten jedoch nur `targets.serverLabel: "R&D"`, kein `serverId`. Deshalb konnte der vorhandene `repeated_run_mapping_yield` den unmittelbar identischen zweiten Run nicht erkennen.

Akzeptanzkriterium: Ein `start_run`-PublicEvent enthält den bereits öffentlichen strukturierten Server-Identifier. Keine Kartenidentität oder private Zielinformation wird ergänzt. Der bestehende AI-Guard kann dadurch ohne Label-Fallback arbeiten.

## Fehlergruppe 3: Eigene Karten als Gegner-Facts

Ab Decision 18 erschien `Codecracker` in 88 Traces als `revealed_opponent_card`; ab Decision 86 erschien `Pile Driver` in 34 Traces so. Beide Karten gehörten der Runner-KI. Ursache ist, dass ereignisbasierte Reveal-Facts ein vorhandenes `cardDefinitionId` vor einer Actor-/Ownership-Prüfung übernehmen.

Akzeptanzkriterium: Eigene Search-/Reveal-/Install-Ereignisse erzeugen keine `revealed_opponent_fact`-Einträge. Tatsächlich zugängliche beziehungsweise bekannte Korp-Karten bleiben als Gegner-Facts erhalten.

## Nicht-Ziele

- Kein Befund, dass die KI die konkrete verdeckte Archives-Karte als Agenda hätte kennen dürfen.
- Kein eigener Fehler am wirtschaftlichen Encounter-Abbruch nach einem bereits gestarteten, unbezahlt gewordenen Run.
- Keine Karten-ID-Sonderregel; alle Änderungen müssen über generische Ability-, Creditpool-, Event- und Planverträge laufen.
