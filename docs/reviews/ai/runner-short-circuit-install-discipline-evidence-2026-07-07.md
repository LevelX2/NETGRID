# Runner Short Circuit Install Discipline Evidence 2026-07-07

## Match

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Match: `match_23e71df59051a4ed`
- Modus: `human_corp_vs_runner_ai`
- Gewinner: Korp
- Endgrund: Agenda-Punkte
- Seed: `match-mr9mzocm-o59b6c`
- End-StateVersion: `245`
- StateHash: `fnv1a:26c6d8bf`
- Abschluss: `2026-07-06T21:55:39.847Z`

## Fehlergruppe 1: Coverage-Suche bleibt Loop statt Planfortschritt

Die Runner-KI installiert `The Short Circuit` bei StateVersion 65/66 und nutzt danach wiederholt die Suchfähigkeit:

- Event 68, StateVersion 67 -> 68: `The Short Circuit: Stack nach Programm durchsuchen`.
- Event 77, StateVersion 76 -> 77: erneut `The Short Circuit`.
- Events 79/81, StateVersions 78/80: weitere Suchaktionen im selben Runner-Zug.
- Weitere Wiederholungen bei StateVersions 93, 102, 104, 106, 119, 129, 131, 133, 155, 157, 166, 168, 185 und 195.

Die AI-Traces ordnen diese Aktionen jeweils `runner.obtain_breaker_coverage` zu. Beispiel StateVersion 67:

- Plan: `runner.obtain_breaker_coverage:rd`
- Step: `search_for_answer`
- VisibleReasons: `activeRequiredCapabilityRaw:breaker_ap`, `coverageAnswerFit:direct_card_search`, `why_coverage_answer_selected:searches_for_required_breaker_coverage`
- ScoreBreakdown: `runner_goal_fit_coverage_search = +1400` wegen `source_role:search`

## Fehlergruppe 2: Gesuchte Programme werden nicht zeitnah installiert

Aus den Runner-Zonen nach den Short-Circuit-Choices:

- StateVersion 69: `Raptor` wird gesucht und liegt in der Hand.
- StateVersion 78: `Codecracker` kommt dazu.
- StateVersion 80: `Cyfermaster` kommt dazu.
- StateVersion 82: `Loony Goon` kommt dazu.
- StateVersion 104/106/108: `Dwarf` und zweimal `Force Shield` kommen dazu.
- StateVersion 121: `Cloak` kommt dazu.
- StateVersion 157/159: `SeeYa` und `Clown` kommen dazu.
- StateVersion 187/197: `Vewy Vewy Quiet` und `Newsgroup Filter` kommen dazu.

Trotz sichtbarer Handprogramme bleibt die KI auf Suche. Erst StateVersion 147 installiert sie `Codecracker`; viele andere gesuchte Programme landen in Discards, zum Beispiel `Dwarf`, `Force Shield`, `Cloak`, `Clown`, `SeeYa`, `Loony Goon`, `Vewy Vewy Quiet` und `Newsgroup Filter`.

## Fehlergruppe 3: Suchzielauswahl kennt den Coverage-Bedarf nicht

`selectedSearchChoiceOptionIds` bewertet Suchoptionen bisher generisch:

- Programm: hoher Basisbonus.
- Icebreaker: Zusatzbonus.
- Memory/Economy: kontextuelle Boni.

Der konkrete aktive Bedarf wie `breaker_ap` wird der Suchauswahl nicht übergeben. Dadurch kann eine Suchkarte zwar als Antwort auf `runner.obtain_breaker_coverage` gewertet werden, aber die Choice selbst wählt nur ein generell gutes Programm statt gezielt die passende Coverage-Antwort.

## Fehlergruppe 4: Plan-Fit akzeptiert erneute Suche trotz sichtbarer Handantwort

`coverageSearchActionFit` wertet jede sichtbare Suchquelle mit Search-Rolle als `supportsActiveCapabilityNeed: true`. Es gibt keine Sperre nach dem Muster:

> Wenn bereits ein sichtbarer Hand-Breaker die aktive Coverage-Anforderung erfüllt, ist weitere Suche keine Coverage-Antwort mehr.

Das erklärt die Wiederholung über mehrere Runner-Züge: Der Plan bleibt auf `search_for_answer`, obwohl der praktische nächste Schritt Credits/Installation/Run sein müsste.

## Geplante Anpassungen

1. Einen side-safe Coverage-Search-Need-Adapter für Runtime-Entscheidungen ergänzen.
2. Search-Choice-Scoring um `requiredCoverage` erweitern und passende Optionen stark bevorzugen.
3. Coverage-Search-Fit so härten, dass weitere Search-Aktionen bei sichtbarer passender Handantwort nicht mehr als aktive Coverage-Antwort zählen.
4. Goal-Fit-Score für `coverage_search` abwerten, wenn die Suche durch eine passende Handantwort saturiert ist.
5. Fokussierte Regressionstests für Choice-Zielwahl, Plan-Fit-Sättigung und +1400-Score-Sättigung ergänzen.
