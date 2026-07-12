# Matchserie 2781: KI-Evidence

## Datengrundlage

- SQLite: `data/runtime/multiplayer/netgrid.sqlite`, ausschliesslich read-only
  ausgewertet;
- Serie: `series_2781b26755923764`;
- Spiel 1: `match_0919a905d2772f18`, Corp-KI, 159 Events,
  72 Decision-Traces, Niederlage 1:7;
- Spiel 2: `match_95a8416194bb9ac4`, Runner-KI, 253 Events,
  139 Decision-Traces, Niederlage 5:7;
- keine abgelehnte KI-Aktion; ein menschlicher `ERR_UNKNOWN_ACTION` ist nicht
  Teil dieser Reparatur.

## Belegte Fehleranker

### Corp: effektive ICE-Subtypen

Spiel 1, Turn 26, Decision 71 und 72: Vor HQ liegt Credit Blocks, die Corp hat
8 Credits und fuenf Agendas im HQ. Der Runner zeigt nur Pile Driver und Shield.
Die Sentry-Rezaction erhaelt trotzdem
`effective_defense_visible_breaker_coverage:true` und
`effective_defense_zero_effect:true`. Ursache ist die Vermischung des
effektiven Subtyps mit dem Wort `wall` im alternativen Regeltext.

### Corp: exponiertes Upgrade

Spiel 1, Turn 1, Decision 5: Rasmin Bridger wird ohne HQ-ICE installiert. Nach
dem R&D-Rez fehlen Rezcredits; der Runner greift HQ sofort an und trasht das
Upgrade. Der Score besteht fast nur aus generischem Tactical-Goal-Fit.

### Corp: Region-Selbstersetzung

Spiel 1, Turn 21, Decision 56 und 57: Networked Center und danach Research
Bunker werden fuer jeweils 4 Credits in HQ installiert. Die zweite Region
ersetzt die erste noch im selben Zug.

### Corp: Suche ohne Folgeaktionsbudget

Spiel 1, Turn 25, Decision 66 bis 68: Der Plan
`find_remote_protection` zieht dreimal. Hunting Pack wird mit der zweiten
Ziehaktion gefunden; die letzte Aktion wird dennoch erneut zum Ziehen benutzt.
Anschliessend muss die Corp vier Karten abwerfen.

### Runner: Broker-Projektion

Spiel 2, Turn 20 bis 24, unter anderem Decision 72, 73, 78, 84 und 85: Broker
liegt bei 9 bis 12 Credits und mehreren Aktionen auf der Hand. Die Installation
erhaelt `runner_bank_install_commitment:-1600` mit
`why_bank_install_deferred:no_plausible_followup_load`, obwohl nach Installation
Credits und Aktionen fuer eine Ladung verbleiben. Broker geht spaeter durch
Lucidrine-Core-Damage verloren.

### Runner: redundante Breaker-Varianten

Spiel 2, Turn 28, Decision 96: Dwarf wird ueber Shell Traders vorbereitet,
obwohl Pile Driver bereits Wall-Abdeckung liefert. Turn 34, Decision 132:
Ein zweiter Cyfermaster wird ueber die Programmtrash-Installationsvariante
gewaehlt. Diese Variante erhaelt pauschal `runner_install_breaker:750`, aber
keine Duplikat- oder Grenznutzenkomponente.

## Positive Gegenbeobachtungen

- Die Corp setzt Manhunt und Resource-Trash sinnvoll ein und scort Charity
  Takeover ueber ein vorbereitetes Remote.
- Der Runner nutzt anfangs offenes R&D, spielt Score! vor Basiscredits und baut
  Pile Driver, Cyfermaster und R&D Interface planbezogen auf.
- Die nach dem separaten AI-Boon-Fix ausgefuehrten R&D-Runs in Turn 30 und 32
  brechen und passieren das sichtbare ICE korrekt. Dieser Pfad ist kein offener
  Punkt dieses Prozesses.

