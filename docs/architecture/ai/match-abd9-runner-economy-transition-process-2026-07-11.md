# Match ABD9 Runner-Economy-Transition Prozess 2026-07-11

Status: in Arbeit

## Quelle und Evidence

Quelle ist das abgeschlossene Match `match_abd9fc8312854db1` mit dem
Runner-Deck `Krashkurs: Clown-Kreditmaschine` gegen `Fast Advance, Baby`.
Die Runner-KI spielte auf `hard`; die Korp gewann 7:1. Führende Evidence sind
237 Events, 237 Snapshots und 147 detaillierte AI-Decision-Traces.

Der Runner nahm 21 einzelne Basis-Credits, zog zehnmal regulär und installierte
mit Cloak eine funktionierende wiederkehrende Run-Credit-Quelle. Beide
Streetware-Distributor-Kopien blieben ungezogen im Stack. Cortical Cybermodem
war ab StateVersion 36 auf der Hand, bei StateVersion 44 mit 14 Credits legal
bezahlbar und zugleich als `legal_now`, `useful_now`, `strong` sowie im
TacticalPlan als `abandoned`, `target_unreachable` bewertet. Später finanzierte
die KI dieselbe Karte wiederholt mit Basis-Credits, unterbrach den Aufbau durch
Runs und verlor sie bei StateVersion 161 durch Setup-Schaden.

## Gesamtziel

Die Runner-KI erhält einen generischen, boardabhängigen
Economy-Transition-Controller. Frühe billige Zugriffe bleiben erlaubt. Mit
steigender Korp-Economy, ICE-Tiefe und Run-Kosten wechselt der Runner jedoch in
ein verbindliches Economy-Aufbaufenster, führt eine konkrete Quelle bis zur
Nutzbarkeit oder Auszahlung und nimmt regelmäßigen Druck erst danach wieder
auf. Akute Score- und Survivalfenster dürfen kontrolliert unterbrechen.

## /Goal

`/Goal Arbeite die Match-ABD9-Runner-Economy-Transition vollständig und
sequenziell von Paket 1 bis Paket 5 ab, führe danach den reproduzierbaren
Krash-Clown-Benchmark gegen Fast Advance Baby aus und merge den verifizierten
Arbeitsbranch lokal nach main.`

## Generischer Controllervertrag

### Spielphasen

- `opening_access`: Ungeschützte oder billige hochwertige Zugriffe dürfen
  Economy-Aufbau überstimmen.
- `economy_transition`: Sichtbare Korp-Entwicklung, steigende Run-Kosten,
  wiederholte Basis-Credits und fehlende nachhaltige Economy erzeugen ein
  bewusstes Aufbauzeitfenster.
- `sustainable_pressure`: Eine nutzbare Economy-Quelle oder belastbare Reserve
  finanziert regelmäßigen Druck.
- `endgame_contest`: Matchpoint, akute Score-Remotes und bekannte hochwertige
  Payoffs dürfen den Aufbau unterbrechen.

Die Phase wird aus PlayerView, side-gefilterten Events, LegalActions, eigener
Deckanalyse und vorhandenen RunTarget-/Economy-Assessments abgeleitet, nicht
aus einer festen Zugnummer.

### Economy-Quellenprofil

Karten werden ohne Namenssonderregeln beschrieben durch:

- einmalig, wiederholbar oder persistent;
- allgemeine oder zweckgebundene Credits;
- Installations-, Aktivierungs- und Aufladekosten;
- erwarteten Ertrag, Wiederaufladung und Break-even-Horizont;
- Zusatznutzen wie MU, Handgröße oder Run-Unterstützung;
- aktuellen Ort, Legalität und Konversionsfähigkeit.

### Verbindlicher Aufbaupfad

`beschaffen -> finanzieren -> installieren -> aufladen/aktivieren -> erste
Nutzung/Auszahlung -> nachhaltiger Druck`

Ein Aufbauplan wird nur begonnen, wenn die Konversion realistisch ist. Eine
kurze Finanzierungslücke schützt die benötigte Reserve. Eine lange Lücke mit
ausschließlich Basis-Credits wechselt auf eine deckgestützte
`draw_for_economy`-Route. Mehrzugfortschritt muss die Lücke tatsächlich
verkleinern; wiederholtes Zurücksetzen invalidiert den Plan.

### Erlaubte Unterbrechungen

- akutes Agenda- oder Matchpoint-Remote;
- bekannter Steal-/Trash-Payoff;
- kostenloser oder nahezu kostenloser hochwertiger Zugriff;
- zwingende Survival-, Tag- oder Damage-Aktion.

Ein normaler kostenpflichtiger Probe-Run ist keine zulässige Unterbrechung
eines verbindlichen Economy-Aufbaus.

## Controller-Invarianten

- Nur PlayerView, side-gefilterte PublicEvents, LegalActions und erlaubte
  eigene Deckmetadaten werden verwendet.
- Engine, Kartenregeln, Replay, StateHash und Randomness bleiben unverändert.
- Eine legal bezahlbare starke Handkarte ist nicht zugleich
  `target_unreachable`.
- Zweckgebundene Run-Credits werden nicht als allgemeine Credits behandelt.
- Kartenhints liefern Eigenschaften; Runtime-Code kennt keine Kartennamen.
- Search-Engine-Setup benötigt ein konkretes Ziel und eine realistische
  Such-/Installationskonversion.

## Paketfolge

### Paket 1: Prozess und Match-Evidence

- Controllervertrag, Matchanker, Grenzen und Paketfolge dokumentieren.
- Done-Gate: Prozessartefakt und `git diff --check` grün.
- Commit: `docs(ai): define abd9 economy transition process`.

### Paket 2: Economy-Quellenprofil und Handkartenkonsistenz

- Persistente, wiederholbare, allgemeine und zweckgebundene Economy generisch
  klassifizieren.
- Hybridnutzen wie wiederkehrende Credits plus MU/Handgröße abbilden.
- LegalAction, Handentwicklung, Planstatus und Installationsfit konsistent
  machen.
- Done-Gate: Quellenprofil-, Cybermodem- und Gegenbeispieltests grün.
- Commit: `fix(ai): unify runner economy source evaluation`.

### Paket 3: Phasen- und Commitment-Controller

- Boardabhängige Economy-Phase und Aufbaupfad erzeugen.
- Kurze Finanzierung reservieren, lange Basic-Credit-Lücken auf Draw/Economy-
  Acquisition umstellen und Mehrzugfortschritt prüfen.
- Nur definierte akute Unterbrechungen zulassen.
- Done-Gate: ABD9-nahe Funding-/Run-Unterbrechungsregressionen und frühe
  Cheap-Run-Gegenprobe grün.
- Commit: `fix(ai): commit runner economy transition plans`.

### Paket 4: Search-Engine-Konversion

- Installation einer Suchmaschine an konkretes Ziel, Klicks, Credits, MU und
  Folgeinstallation binden.
- Vollständige Grundabdeckung allein verbietet keine echte Multi-Breaker- oder
  Supportstrategie; isoliertes Setup ohne Konversion wird vertagt.
- Done-Gate: Short-Circuit- und generische Suchmaschinenregressionen grün.
- Commit: `fix(ai): require concrete search engine conversion`.

### Paket 5: Benchmark, Review und Integration

- Fokussierte Tests, vollständige AI-Suite, Typecheck und Diff-Hygiene.
- Reproduzierbaren Krash-Clown-Benchmark gegen `Fast Advance, Baby` ausführen
  und Economy-, Run-, Limit-, IllegalAction- und Replaymetriken berichten.
- Final-Review und Wissenslog pflegen, aktuelles `main` integrieren, erneut
  prüfen und lokal nach `main` mergen. Kein Push oder Pull Request.
- Commit: `docs(ai): close abd9 economy transition`.

## Sicherheitsblocker

Der Prozess stoppt ohne Workaround, wenn Hidden-Info benötigt wird,
LegalActions umgangen werden müssten, eine Kartenregel statt KI-Verhalten
geändert würde oder Side-Safety-/Replay-Regressionen auftreten.

## Abschlusskriterien

- Das ABD9-Cybermodem-Szenario erzeugt keinen widersprüchlichen Planstatus und
  keine stagnierende Basic-Credit-/Run-Schleife.
- Frühe billige Zugriffe bleiben erhalten.
- Nachhaltige Economy wird in entwickeltem Boardzustand über ein verbindliches
  Aufbauzeitfenster verfolgt.
- Suchmaschinen werden nur mit konkreter Konversionsroute aufgebaut.
- Tests und Benchmark sind dokumentiert; der Branch ist lokal nach `main`
  integriert und die fremde Änderung an `apps/web/next-env.d.ts` bleibt
  unangetastet.
