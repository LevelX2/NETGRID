# Matchserie 70BE: KI-Evidence und freigegebene Befunde

## Serien-Evidence

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only analysiert.
- Serie: `series_70be007e45d843a0`, Format `two_game_side_swap`.
- Decks: `Manhunt Pressure Bureau` gegen
  `Mit Ansage: Der perfekte Coup`.
- Spiel 1: `match_a199d04c94d5a906`, Seed
  `match-mrgsg0px-vvhjh5`, Korp-KI, 96 Decision-Traces, StateVersion 221,
  StateHash `fnv1a:9c7384cb`, Runner-Sieg nach Agenda-Punkten.
- Spiel 2: `match_3bb2232dccc0a1da`, Seed
  `match-mrgsg0px-vvhjh5:series-game-2`, Runner-KI, 93 Decision-Traces,
  StateVersion 162, StateHash `fnv1a:3ff1fd71`, Korp-Sieg durch Flatline.
- Alle 189 gewählten Aktionen waren legal. Es gab keine AI-Timeouts,
  Fallbacks oder verbotenen Trace-Felder.

## Befund 1: Unsichere Korp-Scoreline

- Decision 88 / StateVersion 200: 6 Credits, 3 Klicks, ungeschützter neuer
  Remote; `Corporate War` wird trotz `contestable`-Bewertung installiert.
- Decisions 89 und 90: Credits statt Advancement; die Agenda wird gestohlen.
- Decision 93 / StateVersion 212: dasselbe Muster bei 8 Credits und bereits
  3 Runner-Punkten; der Trace erkennt die Near-Win-Gefahr.
- Decisions 94 und 95: erneut Credits; die zweite Agenda beendet das Spiel.
- Vertiefte Ursache: Vor der Installation erkennt der Konversionsplan den
  legalen Same-Turn-Pfad `Corporate War → Systematic Layoffs (2 Counter) →
  Advance → Score`. Der spezialisierte Engine-Resolver für
  `Systematic Layoffs` verliert danach jedoch die generische
  `scoreConversionCapability`; dadurch bricht der Plan ab und sichere
  Nicht-Plan-Aktionen werden bevorzugt.
- Akzeptanz: Der vollständige Same-Turn-Closeout bleibt über jede tatsächliche
  Engine-/AI-Transition ausführbar. Fehlt die Semantik oder eine benötigte
  Ressource, darf die contestbare Agenda-Installation nicht beginnen.

## Befund 2: Broker verliert seine Live-Semantik

- Decision 15 / StateVersion 33 installiert Broker korrekt als Bank-Plan.
- Danach ist die Ladefähigkeit in 33 Fenstern legal und wird kein einziges
  Mal gewählt.
- Engine-LegalAction: `cardImplementationAddsHostedCredits: true` und
  `hostedCreditAddAmount: 3` sind vorhanden.
- `buildAiDecisionInput` projiziert für die AI nur die Karten-ID; der
  Bank-Consumer kann die konkrete Ladeaktion nicht mehr erkennen.
- Die Fähigkeit erhält nur den generischen Score 62.
- Akzeptanz: Engine-erzeugter Input erkennt Laden und Auszahlung samt
  Schwellenwerten; sichtbare dringende Payoffs dürfen überschreiben.

## Befund 3: Draw-Tax bewertet Tags nicht als Folgekosten

- Decision 9 / StateVersion 22 und Decision 19 / StateVersion 42 wählen den
  City-Surveillance-Draw mit Tag statt der bezahlbaren 1-Credit-Variante.
- Die Payloads enthalten bereits side-sicher
  `drawTaxProjectedCreditsPaid` und `drawTaxProjectedTagsAdded`.
- Der Tag-Draw gewinnt allein durch die Credit-Kostenstrafe; anschließend
  bezahlt die KI zusätzliche Aktionen und Credits für Tag-Cleanup.
- Akzeptanz: bezahlbarer Draw vermeidet den Tag, sofern kein konkreter
  sichtbarer Grund für die Tagaufnahme besteht.

## Befund 4: Event-Run ohne post-cost Pfadquote

- Decision 44 / StateVersion 84 und Decision 63 / StateVersion 114 spielen
  `Rush Hour` mit genau 3 Credits.
- Nach den Eventkosten bleiben 0 Credits; der bekannte R&D-Pfad benötigt
  mindestens 2 Credits und der Run endet am ersten ICE.
- Basic `start_run` erhält `runner_visible_ice_path_cost`; der Event-Run nicht.
- Die jeweilige Aktion hat roh Score -18 und gewinnt nur durch Planbindung.
- Akzeptanz: alle projizierten Run-Aktionen verwenden Credits nach
  Aktionskosten; finanzierbare Multiaccess-Gegenprobe bleibt attraktiv.

## Befund 5: Handpuffer wird vom Run-Plan verdrängt

- In 16 Runner-Hauptentscheidungen bei höchstens zwei Handkarten war ein Draw
  legal; gewählt wurde kein Draw.
- Decision 68 / StateVersion 124 und Decision 77 / StateVersion 140 zeigen
  jeweils eine Handkarte. Der rohe Draw-Score liegt über dem Run-Score, wird
  aber als Plan-Mismatch abgesenkt.
- Die spätere verdeckte Flatline-Kombination ist keine zulässige damalige
  Information; der sichtbare Ein-Karten-Handpuffer ist die Evidence.
- Akzeptanz: akuter Handpuffer kann spekulative Runs überstimmen; bekannte
  unmittelbare Agenda- oder Endgame-Payoffs bleiben Overrides.

## Befund 6: Realitätsgate deckt Producer-/Consumer-Grenzen nicht ab

- Fokussierte synthetische Broker-Tests sind grün, weil sie das später
  entfernte Payload-Signal direkt in den AI-Input einsetzen.
- Das aktuelle Real-Engine-Gate hat zwei grüne Fälle, aber keine Broker-,
  Draw-Tax-, Event-Run-, negative Scoreline- oder Plansequenz-Evidence.
- Akzeptanz: jeder Live-Befund erhält eine Engine-erzeugte oder sequenznahe
  Regression, die vor der Korrektur rot und danach grün ist.

## Nicht als Fehler freigegeben

- keine Vorhersage verdeckter `Chance Observation`-/`Scorched Earth`-Karten;
- keine pauschale Bestrafung früher Probeläufe gegen ungerezztes ICE;
- kein Schluss von anderer Deckauswahl der vorherigen Serie auf einen
  kontrollierten Commit-Regressionsnachweis;
- kein KI-Fix für bloße Agenda-Verteilung oder erfolglose zufällige Accesses.
