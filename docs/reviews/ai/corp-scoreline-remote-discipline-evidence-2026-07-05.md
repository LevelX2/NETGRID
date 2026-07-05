# Corp Scoreline Remote Discipline Evidence 2026-07-05

## Datenbasis

SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

Analysiertes Spiel:

| Match | Mode | Corp-KI | Seed | Ende | Sieger | Events | Snapshots | AI-Traces |
| --- | --- | --- | --- | ---: | --- | ---: | ---: | ---: |
| `match_a7da2e5a06516b81` | `human_runner_vs_corp_ai` | `corp-ai-v0.9-hard` | `match-mr6imm5q-09noiz` | SV 287 | Runner | 288 | 288 | 0 |

Hinweis: Die Tabelle `ai_decision_traces` enthält für dieses Match keine Rows. Die Evidence nutzt gespeicherte State-Snapshots, PublicEvents und die in Events enthaltenen `aiDecisionDebug`-Payloads. Die Analyse nutzt keine verdeckten Runner-Zonen.

## Endzustand

- Runner gewinnt durch zwei gestohlene `Tycho Extension`.
- Corp-Scorearea ist leer.
- R&D endet mit 6 ICE.
- HQ endet mit 5 ICE.
- Remote 1 endet mit 3 ICE und leerem Root.
- Remote 2 endet mit 2 ICE und leerem Root.
- Die Corp hatte damit viel Board-Material, aber keinen abgeschlossenen Agenda-Pfad.

## Befund 1: Aktive Agenda bekommt keinen Scoreline-Lock

Relevante Entscheidungen:

- SV 101 -> 102: Corp installiert `Tycho Extension` in Remote 1.
- SV 110 -> 111: Corp installiert stattdessen `ACME Savings and Loan` in Remote 2. `advance_card` auf Tycho ist im Debug sichtbar, aber nur Rang 6 mit starker `corp_board_triage_mismatch`- und Remote-Kontextstrafe.
- SV 111 -> 112: Corp zieht statt zu advancen.
- SV 112 -> 113: Corp installiert `Crystal Wall` auf R&D als fünftes R&D-ICE. `advance_card` bleibt niedriger gerankt.
- SV 142 -> 143: Runner stiehlt die nicht vorangebrachte `Tycho Extension` aus Remote 1.

Erwartung:

Eine eigene Agenda im Remote muss einen mehrzügigen Scoreline-Lock auslösen. Solange Scoring nicht sofort möglich ist, müssen Advance, Funding und gezielter Remote-Schutz gegenüber Neben-Root-Installationen und Central-Overicing gewinnen.

## Befund 2: Remote-Sprawl statt Score-Remote-Pipeline

Relevante Entscheidungen:

- SV 5 -> 6: Corp eröffnet Remote 1 mit `Wall of Static`, aber ohne Root.
- SV 57 -> 58: Corp eröffnet Remote 2 mit `Data Wall 2.0`, obwohl Remote 1 leer bleibt.
- Später werden beide Remotes weiter mit ICE oder Assets bespielt, ohne dass eine klare Agenda-Pipeline entsteht.
- Endzustand: Remote 1 und Remote 2 sind leer, aber zusammen mit 5 ICE belegt.

Erwartung:

Ein vorhandenes geschütztes leeres Remote muss als bevorzugte Score-Remote-Pipeline gelten. Neue leere Remotes oder Non-Agenda-Roots in anderen Remotes brauchen einen konkreten, side-safe erkennbaren Payoff.

## Befund 3: Negative Install-Aktionen werden trotzdem gewählt

Relevante Muster:

- SV 77 -> 78: weiteres HQ-ICE wird trotz fehlender Scoreline-Entwicklung gewählt.
- SV 88 -> 89: weiteres Remote-ICE wird auf eine noch leere Remote-Struktur gelegt.
- Spätere Züge legen zusätzliche ICE vor leere Remotes, obwohl keine konkrete Agenda- oder Asset-Linie daraus entsteht.

Erwartung:

Wenn die beste Install-Aktion negativ bewertet ist und keine kritische Triage oder aktive Scoreline exakt diese Aktion verlangt, sollen Economy, Draw oder ein anderer echter Setup-Schritt gewinnen.

## Befund 4: Central-Overicing verdrängt Scoring

Relevante Entscheidungen:

- Bis SV 113 liegt R&D bereits bei 5 ICE, während `Tycho Extension` in Remote 1 nicht advanced wird.
- Bis SV 207 wächst R&D auf 6 ICE.
- HQ wächst bis zum Endzustand auf 5 ICE.
- Die Corp scored keine Agenda; Runner stiehlt die zweite `Tycho Extension` später aus R&D.

Erwartung:

Central-Schutz bleibt wichtig, darf aber eine aktive Remote-Agenda nur bei sichtbarer unmittelbarer Central-Niederlage oder nicht ausreichend beantworteter zentraler Gefahr überstimmen. Nach mehreren ICE-Layern braucht weiteres Central-ICE eine deutlich höhere Begründung.

## Befund 5: Scoreline-Kredite werden nicht reserviert

Relevante Entscheidungen:

- Nach der Tycho-Installation nutzt die Corp Credits für andere Server und nicht für den aktiven Score-Remote-Pfad.
- Beim Remote-1-Run des Runners kann die Corp nur einen Teil des Remote-Schutzes rezzen und fällt auf 0 Credits.
- Die Agenda wird gestohlen, obwohl vorher Zeit bestand, Advance-/Rez-Reserve aufzubauen.

Erwartung:

Bei aktiver Agenda im Remote braucht die Runtime eine side-safe Score-Remote-Reserve für Advance-/Score-Kosten und relevante Rez-Kosten. Andere Installs/Rezzes, die diese Reserve ohne zwingenden Grund brechen, müssen verlieren.

## Befund 6: Agenda-Ausgang wird zu spät gesucht

Relevante Entscheidungen:

- SV 57 -> 58: `Tycho Extension`-Installationen in vorhandene oder neue Remotes sind im Debug sichtbar, verlieren aber gegen neues Remote-ICE.
- SV 67 -> 68 und SV 77 -> 78: Agenda-Install-Linien bleiben tief gerankt.
- Erst SV 101 -> 102 installiert die Corp `Tycho Extension`, ohne danach konsequent zu konvertieren.

Erwartung:

Wenn eine Agenda im HQ und eine vorhandene Score-Remote-Pipeline sichtbar sind, muss die KI früher zwischen Agenda-Install, Funding und Remote-Schutz wählen. Wenn die Agenda noch nicht sicher installierbar ist, soll sie den Score-Remote-Pfad vorbereiten statt weitere generische Server zu bauen.

## Nicht freigabereif aus diesem Spiel

- Decklisten-Balance als Primärfix: Das Deck `Tycho Ice Stack` kann viele ICE-Linien begünstigen, aber der belegte Fehler liegt in der Runtime-Priorisierung.
- Konkrete Runner-Hand- oder Stack-Annahmen: Für die damalige Corp-Entscheidung nicht side-safe.
- Exakte `ai_decision_traces`-Input-Rekonstruktion: Für dieses Match fehlen Trace-Rows; die Event-Debugs reichen für die Fehlergruppen, ersetzen aber keine vollständige Trace-Fixture.

## Regressionserwartungen

- Aktive Remote-Agenda plus legaler Advance: `advance_card` oder nötiges Funding schlägt Neben-Root und Central-ICE, wenn keine unmittelbare Central-Niederlage droht.
- Aktive Remote-Agenda plus unzureichende Credits: Economy/Funding schlägt nicht notwendige Install-/Rez-Linien.
- Vorhandenes leeres geschütztes Remote plus Agenda im HQ: Agenda-Install oder Vorbereitung dieser Remote schlägt neue leere Remote.
- Bereits stark geicetes R&D/HQ: weiteres Central-ICE verliert gegen Scoreline-Setup, wenn die zentrale Gefahr nicht game-ending ist.
- Negative Install-Kandidaten ohne Scoreline-/Triage-Fit verlieren gegen Economy/Draw.
- Gegenprobe: sichtbare unmittelbare HQ/R&D-Niederlage darf Central-Schutz weiterhin priorisieren.
