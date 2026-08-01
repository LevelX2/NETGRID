# Match 978DA70C: Vollständiger Entscheidungs-Audit der Corp-KI

Stand: 2026-08-01

Match: `match_978da70c2bd72e61`

Modus: `human_runner_vs_corp_ai`

Ergebnis: Runner-Sieg durch Agendapunkte, StateVersion 248

## Analyseabdeckung

Die Analyse umfasst alle 104 gespeicherten Entscheidungen der Corp-KI. Jede
Entscheidung wurde gegen die damaligen LegalActions, die private
Corp-PlayerView, den Plan-first-Debugtrace und die Folgeereignisse geprüft.
Die verdeckten Karten des menschlichen Runners wurden dafür nicht benötigt.

- Erstellt: `2026-08-01T11:54:34Z`
- Beendet: `2026-08-01T12:10:37Z`
- Seed: `match-msa3uy2x-v4gi78:series-game-2`
- StateHash: `fnv1a:d0fff9ba`
- Events/Snapshots: 249/249
- Erwartete Entscheidungen: 104
- Gefundene und eindeutig zugeordnete Traces: 104
- Fehlende, verwaiste, doppelte oder typfalsch zugeordnete Traces: 0
- AI-Trace-Modus: detailliert
- Ergebnis: vollständige und konsistente Match-Evidence

Die Live-SQLite wurde nur kurzlebig und schreibgeschützt gelesen. Der
vollständige Audit danach lief aus einem redigierten lokalen Extrakt im
isolierten Worktree `codex/ai-match-978d-analysis`.

## Deck und tatsächliche Spielanlage

Das Corp-Deck `Vom Tablet` enthält 45 Karten:

- 8 Agendas: AI Chief Financial Officer, Artificial Security Directors,
  Bioweapons Engineering, drei Hostile Takeover und zwei Tycho Extension;
- 24 ICE, davon 18 klassische End-the-run-ICE und 6 Trace-/Tag-ICE;
- 10 Economy-/Draw-Operations;
- 3 BBS Whispering Campaign als installierte Economy.

Es ist kein echtes Fast-Advance-Paket vorhanden. Artificial Security
Directors legt selbst keine Advancement Counter und gibt keine zusätzlichen
Aktionen; nach dem Scoren reduziert sie nur die Schwierigkeit von Black-Ops-
Agendas. Das Deck enthält jedoch keine Black-Ops-Agenda. Auch die einmalige
Deck-Recycling-Fähigkeit von AI Chief Financial Officer wird erst nach dem
Scoren dieser 5-Advance-Agenda verfügbar. Die belastbare Grundanlage dieses
Decks ist deshalb eine finanzierte Remote-Score-/Rush-Mischung mit viel ICE,
nicht Fast Advance und nicht primär ein Recycling-Engine-Deck.

## Gesamturteil

Die Corp verteidigte die Zentralserver wesentlich besser als in den älteren
passiven Spielen, konvertierte diese Verbesserung aber nicht in eine
Scoring-Linie. Das Ergebnis ist extrem eindeutig:

- Sie installierte fünf Agendas.
- Sie führte im gesamten Match keine einzige `advance_card`- und keine
  `score_agenda`-Aktion aus.
- Jede der fünf installierten Agendas wurde im unmittelbar folgenden
  Runnerzug gestohlen.
- Die Corp erzielte 0 Agendapunkte.
- Keine Agenda wurde abgeworfen. Die vier erzwungenen Abwürfe waren BBS
  Whispering Campaign, Data Wall, Keeper und Fire Wall.

Die Hauptursache ist nicht bloß „zu zaghaft“ oder „zu mutig“. Zwei
gegenläufige Fehler greifen ineinander:

1. Vorhandene, mehrfach geschützte Remotes werden wegen
   `subset_assessment_unknown` nicht als belastbar bewertbar akzeptiert.
2. Gleichzeitig darf ein qualitativer `bounded_deterrence`-Pfad neue
   Ein-ICE-Remotes als Rush-Vorbereitung zulassen, obwohl der sichtbare Runner
   das ICE konkret oder mit deutlich erreichbarer nächster Zugliquidität
   überwinden kann.

Dadurch verwirft die KI die bessere vorhandene Stellung, baut einen neuen
schwachen Remote, installiert dort eine Agenda und zieht mit dem letzten
Klick nach weiterem Schutz, obwohl diese unsichere Aktion vor dem Runnerzug
keinen Schutz mehr materialisieren kann.

## Zentrale Befunde und Ursachen

### F1: `unknown` blockiert gute Remotes, wird aber zugleich als Draw-Anlass verwendet

Ab D47 existierte Remote 1 mit zwei bereits gerezzten ETR-ICE. D82 ergänzte
ihn sogar um eine dritte Schicht. Agenda-Installationen in diesen Remote
wurden trotzdem wiederholt mit
`corp_score_protection_assessment_unknown:remote_1:subset_assessment_unknown`
ausgeschlossen. Die Corp begann stattdessen Remote 2, 3 und 4 mit jeweils nur
einem ICE.

Im Schutzmodell bricht die Enumeration aller möglichen Rez-Teilmengen sofort
mit `subset_assessment_unknown` ab, sobald eine einzelne Teilbewertung einen
nicht vollständig unterstützten Breaker-, ICE- oder Ressourceneffekt trifft.
Die gesamte Serverbewertung verliert dadurch auch ihre bereits bekannten
Teilergebnisse. Nachgelagert erlaubt `corpMissingConcreteScoreDefenseDrawNeed`
gerade dieses spezielle Unknown-Ergebnis als Anlass für gezieltes Nachziehen.

Das widerspricht dem festgelegten Zielvertrag: Unvollständige Schutz-Evidence
darf nicht als belegte Effektlücke umgedeutet werden. Der Score-Parent müsste
resident und sichtbar blockiert bleiben oder einen exakt bekannten
Defense-/Funding-Step erhalten.

### F2: Der qualitative Rush-Bypass überschreibt die exakte Schutzfrage

`corpRemoteHasBoundedStagedIce` lässt einen mehrzügigen Agenda-Install zu,
wenn mindestens ein installiertes ICE als begrenzte Abschreckung gilt. Der
Bypass berücksichtigt grob ICE-Art, Agenda-Punkte und Matchpoint, aber nicht
die vollständige konkrete Zugriffslinie mit sichtbaren Breakern, aktuell und
bis zum nächsten Runnerzug erreichbaren Credits sowie öffentlichen
Economy-Werkzeugen.

Das führte zu vier klar unvertretbaren Sequenzen:

- D52/D53: Hunter plus Bioweapons Engineering;
- D60/D61: Hunter plus Hostile Takeover unmittelbar nach dem identischen
  Fehlschlag;
- D76/D77: Wall of Static plus Hostile Takeover bei Runner-Matchpoint;
- D100/D101: Hunter und Quandary plus AI Chief Financial Officer bei sechs
  Runnerpunkten.

Ein bewusster Rush bleibt grundsätzlich erlaubt. D40 bis D42 mit zwei ICE und
der kleinen Artificial Security Directors war ein riskanter, aber noch
vertretbarer Versuch. Die späteren Linien waren dagegen keine ausgewogene
Rush-Wette mehr: Sie wiederholten sichtbar gescheiterte oder terminal
unzureichende Schutzmuster.

### F3: Defense-Draw verdrängt Advance ohne Schutzwirkung vor dem Runnerzug

D54, D78 und D102 hatten jeweils nur noch einen Klick, eine installierte
Agenda und eine legale Advance-Action. Der Defense-Support zog stattdessen
eine Karte. Die gezogene Karte konnte vor dem folgenden Runnerzug weder als
ICE installiert noch gerezzt werden. Alle drei Agendas wurden danach sofort
gestohlen.

Die Draw-Zulassung betrachtet einen abstrakten Mehrzugfortschritt, bindet
aber den unmittelbaren Expositionshorizont des bereits installierten
Agenda-Parents nicht hart genug. Ein Draw darf hier nur dann vor einem
Advance liegen, wenn er selbst sofort Schutz verändert oder eine noch im
selben Zug ausführbare, gebundene Schutzfortsetzung besitzt. Andernfalls ist
er keine Defense-Aktion für die aktuelle Agenda.

D70 und D83 zeigen eine zweite Variante: Es wurde bei voller Hand gezogen,
obwohl bereits ICE vorhanden war beziehungsweise der neue Draw keine
gebundene Fortsetzung hervorbrachte. D70 endete mit dem Abwurf von Data Wall,
D83 später mit dem Abwurf von Keeper. Das ist kein sinnvoller
Schutzkartendurchsatz.

### F4: Agenda-, Remote- und Parentwahl verlieren die Konversionsqualität

D52 wählte Bioweapons Engineering mit 4 Advancement für 3 Punkte, obwohl
Tycho Extension mit demselben Advancement-Bedarf 4 Punkte brachte. Die
Bioweapons-Fähigkeit hatte in diesem Deck keinen Meat-Damage-Partner. Später
wählte D100/D101 die 5-Advance-AI-CFO statt der schnelleren Hostile Takeover,
obwohl der Runner bereits bei sechs Punkten stand und jede gestohlene Agenda
das Match beenden konnte.

Die Support-Projektauswahl sortiert zunächst Terminalstatus, installierten
Zustand und Schutzwahrscheinlichkeit. Bei sonst gleichen oder unbekannten
Bewertungen fällt sie auf technische Projekt-IDs zurück. Advancement-Bedarf,
vollständige Konversionsdauer, Corp-Punktgewinn, gegnerischer Steal-Wert und
realisierte Decksynergie sind in diesem Vergleich nicht ausreichend
führend. So kann der Defense-Support den falschen Agenda-Parent vorbereiten,
bevor `corp.score_agenda` seine höhere fachliche Bewertung ausspielen kann.

Auch die Remote-Kontinuität bricht: D82 stärkte Remote 1 ausdrücklich für den
Hostile-Takeover-Parent. Bereits D83 arbeitete der Defense-Draw stattdessen
für AI Chief Financial Officer in demselben Remote. Der Dirigent erhält den
residenten Score-Parent somit nicht stabil bis zu einer echten
Invalidierung.

### F5: Globale ICE-Allokation erkennt Zentralnutzen, aber nicht immer dessen Opportunitätskosten

Die frühen R&D-Installationen D3, D15, D18 und D23 waren nachvollziehbar. Der
Runner zeigte zwei R&D Interfaces und frühe R&D-Orientierung. Auch die fünfte
Schicht auf D28 ist als Handentlastung, Staging und Bluff noch vertretbar.

D36 installierte dagegen für 5 Credits die sechste R&D-Schicht, nachdem HQ
bereits eine zweite Schicht erhalten hatte und zwei Agendas auf HQ lagen.
Legale Alternativen waren ICE vor einem neuen Remote. Genau dieser Remote
wurde anschließend als fehlende Score-Voraussetzung beklagt und D37 zog
erfolglos nach Schutz. Hier bewertet der Defense-Plan die isolierte
R&D-Zugriffsreduktion höher als den Grenznutzen einer vollständigen
Zielallokation, die noch im selben Zug ICE plus Agenda ermöglicht hätte.

Es braucht keine feste Obergrenze für ICE-Schichten. Der Fehler ist die
fehlende Opportunity-Cost-Bewertung gegenüber dem gebundenen Score-Remote,
nicht die bloße Zahl sechs.

### F6: Rez-Logik behandelt unbekannten Ressourcenaustausch wie fehlende Bedrohung

D80 ist der eindeutigste Einzelfehler des Matches. Der Runner stand bei fünf
Punkten und griff Hostile Takeover in Remote 4 an. Die Corp besaß 3 Credits,
Wall of Static kostete exakt 3 Credits zum Rezzen. Trotzdem wurde das Rezzen
mit
`corp_ice_rez_resource_exchange_unknown`
verworfen und als
`visible_rez_window_decline_without_defense_threat`
bezeichnet. Der Runner stahl die Agenda.

Das Sicherheitsprinzip „Unknown nicht durch erfundene Zahlen ersetzen“ ist
richtig. Falsch ist die nachgelagerte Bedeutung „keine Defense-Gefahr“. Bei
einem angegriffenen Agenda-Remote, insbesondere bei Matchpoint, muss die
unvollständige Ressourcenschätzung als sichtbarer Blocker erhalten bleiben.
Die generische Lösung ist eine vollständige aktionsgebundene
Run-/Resource-Exchange-Projektion, nicht ein Karten-ID-Sonderfall und nicht
ein blindes Immer-Rezzen.

D93 bis D96 sind davon zu unterscheiden. Die Corp ließ auf einem späten
R&D-Run Wall of Static, Fire Wall, Data Raven und Quandary ungerrezzt und
rezzte danach beide kostenlosen Filter (D97/D98). Das Ergebnis war sinnvoll:
Alle vier noch ungestohlenen Agendas lagen der Corp bekannt auf HQ, R&D war
dadurch agendafrei, und die kostenlosen Filter belasteten den Runner ohne
Corp-Kosten. Der Trace begründet diese gute Aktion allerdings nur mit
`resource_exchange_unknown`, nicht mit der entscheidenden exakten
Agenda-Dichte. Die Handlung ist gut, die Begründung und damit ihre
Robustheit sind unvollständig.

### F7: Die abgeleitete Deckdoktrin ist strukturell vollständig, aber qualitativ falsch gewichtet

Der verpflichtende Deck-Hint-/Consumer-Audit erfasste alle 18 eindeutigen
Kartendefinitionen beziehungsweise alle 45 Karten:

- Hint vorhanden und geprüft: 18/18;
- ausgeschlossene Karten: 0;
- technische Consumer-Blocker: 0;
- technische Warnungen: 0;
- Checkpoint-Verhalten: grün.

Trotzdem leitete das Profil als drei Primärstrategien ab:

1. `corp.fast_advance`,
2. `corp.rush_score`,
3. `corp.deck_recycle_engine`.

Nur Rush ist für dieses konkrete Deck unmittelbar tragfähig. Fast Advance
wird durch Artificial Security Directors als einzelnen Enabler verankert,
obwohl das Deck kein Black-Ops-Ziel enthält. Recycling wird durch eine
einzelne AI-CFO verankert, obwohl diese Fähigkeit erst nach dem erfolgreichen
Scoren der 5-Advance-Agenda existiert. Dagegen wird die offensichtliche
Zusammensetzung aus 24 ICE, 13 Economy-/Draw-Karten und 8 Agendas nicht stark
genug als finanzierte Remote-Scoring-Doctrine erkannt.

Der Consumer ist also verdrahtet; die kompositionsabhängige
Doktrinbewertung ist die Lücke. Enabler ohne Ziel und Engine-Anker ohne
realistische Aktivierungsroute dürfen keine Primärstrategie erzeugen.

### F8: Abwurfentscheidungen waren in diesem Match nicht das Problem

Die vier Discard-Choices behielten sämtliche Agendas:

- D32: BBS Whispering Campaign;
- D74: Data Wall;
- D86: Keeper;
- D92: Fire Wall.

Die Zuordnung ergibt sich eindeutig aus der jeweiligen privaten HQ-Sicht vor
dem Choice und dem konsistenten Folgezustand. Über einzelne Nicht-Agenda-
Prioritäten kann man diskutieren; ein Agenda-Abwurffehler liegt hier nicht
vor.

### F9: Zwei Diagnose-Nebenbefunde bleiben offen

1. Die `steal_agenda`-PublicEvents tragen im Feld `totalAgendaPoints` jeweils
   nur den Punktwert der gerade gestohlenen Agenda. Vor dem letzten Zugriff
   hatte der Runner laut Zustand 6 Punkte; AI Chief Financial Officer brachte
   2 weitere, das Event meldet dennoch `totalAgendaPoints: 2`. Der
   Matchgewinner wurde korrekt bestimmt, aber Chronik/Observability können
   dadurch einen falschen Gesamtstand anzeigen.
2. Der strikte Capture von D80 brach im Warmup bei D4 ab, weil die aktuelle
   Runtime die andere, deckgleiche Instanz von Efficiency Experts auswählte
   (`..._2` statt historisch `..._3`). Der frühe D3-Capture desselben Decks
   war mit `warmupDriftCount: 0` reproduzierbar und reichte für den
   Consumer-Audit. Offen bleibt, ob der spätere Drift von einer noch laufenden
   älteren Server-Runtime oder von einem nicht stabilen Tie-Break zwischen
   identischen Karteninstanzen stammt. Er ändert die Matchbewertung nicht,
   ist aber für instanzexakte Checkpoints relevant.

## Vollständige Einzelbewertung aller 104 KI-Entscheidungen

Legende:

- **Korrekt**: regelgebunden oder fachlich klar richtig;
- **Plausibel**: vertretbare strategische Wahl;
- **Riskant**: bewusster Rush/Bluff, noch nicht eindeutig fehlerhaft;
- **Fehler**: konkrete bessere legale Linie oder fehlerhafte Begründung mit
  nachweisbarer negativer Folge;
- **Ergebnis gut, Evidence schwach**: Aktion war richtig, Trace begründet sie
  nicht belastbar.

| D | Zug | Auswahl | Urteil | Einzelbewertung |
|---:|---:|---|---|---|
| 1 | 1 | Starthand behalten | Korrekt | Keine Agenda, mehrere ICE und sofortige Economy; kein belastbarer Mulligan-Grund. |
| 2 | 1 | Pflichtkarte ziehen | Korrekt | Engine-Fenster, einzige Fortsetzung. |
| 3 | 1 | Filter vor R&D | Plausibel | Früher R&D-Schutz gegen das später sichtbare Multiaccess-Deck; Filter ist kostenlos rezbar. |
| 4 | 1 | Efficiency Experts | Plausibel | Drei Credits und genug verbleibende Aktionen für HQ-Schutz. |
| 5 | 1 | Data Wall vor HQ | Plausibel | Beide Zentralserver erhalten im ersten Zug eine Basisschicht. |
| 6 | 1 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 7 | 3 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 8 | 3 | Efficiency Experts | Plausibel | Gute Economy-Konversion. |
| 9 | 3 | Karte für Score-Material ziehen | Plausibel | Keine Agenda auf HQ, genügend Handkapazität. |
| 10 | 3 | 1 Credit | Plausibel | Keine aktuelle Agenda-Linie; Liquidität bleibt für ICE-Rez relevant. |
| 11 | 3 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 12 | 5 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 13 | 5 | Karte für Score-Material ziehen | Plausibel | Weiterhin keine Agenda; Draw löst die Informationsgrenze bewusst aus. |
| 14 | 5 | Night Shift | Plausibel | Kombiniert 2 Credits mit zwei Karten und erneuter Planung. |
| 15 | 5 | zweites Filter vor R&D | Plausibel | Multiaccess-Gegner, nur 2 Runner-Credits und sofort kostenlos rezbare zweite Schicht. |
| 16 | 5 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 17 | 7 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 18 | 7 | Quandary als drittes R&D-ICE | Plausibel | Noch kein Score-Material, R&D-Multiaccess und bezahlbare ETR-Schicht. |
| 19 | 7 | Karte für Score-Material ziehen | Plausibel | Agenda weiterhin nicht gefunden. |
| 20 | 7 | Accounts Receivable | Plausibel | Vier Credits und keine bessere sofortige Score-Konversion. |
| 21 | 7 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 22 | 9 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 23 | 9 | Data Raven als viertes R&D-ICE | Plausibel | Starker R&D-Fokus des Runners; zugleich Handkapazität freigemacht. |
| 24 | 9 | Accounts Receivable | Plausibel | Solide Economy. |
| 25 | 9 | Karte für Score-Material ziehen | Plausibel | Keine Agenda, freie Handkapazität. |
| 26 | 9 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 27 | 11 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 28 | 11 | Fire Wall als fünftes R&D-ICE | Riskant | Teures fünftes Staging-ICE; wegen R&D-Interfaces, 1 Runner-Credit und Handdruck noch vertretbar, aber Remote-Aufbau wird aufgeschoben. |
| 29 | 11 | Karte für Score-Material ziehen | Plausibel | Agenda weiterhin nicht vorhanden; zielgerichteter Draw. |
| 30 | 11 | Night Shift | Plausibel | Liefert Economy und findet AI CFO erst mit der letzten Aktion. |
| 31 | 11 | Zug beenden | Korrekt | Keine Aktion verblieben; die gerade gezogene Agenda konnte nicht mehr sinnvoll installiert werden. |
| 32 | 11 | BBS Whispering Campaign abwerfen | Plausibel | Agenda bleibt geschützt; bei 14 Credits ist die Economy-Asset-Kopie gegenüber ICE entbehrlich. |
| 33 | 12 | Data Wall auf HQ rezzen | Korrekt | Aktueller HQ-Run, geringe Kosten, ETR. |
| 34 | 13 | Pflichtkarte ziehen | Korrekt | Engine-Fenster; zweite Agenda kommt auf HQ. |
| 35 | 13 | Fire Wall als zweites HQ-ICE | Plausibel | Zwei Agendas auf HQ und höhere HQ-Exposition rechtfertigen die Schicht. |
| 36 | 13 | Wall of Static als sechstes R&D-ICE | Fehler | Verbraucht 5 Credits und eine Aktion, obwohl ICE vor neuem Remote legal war und dadurch noch im selben Zug ICE plus Agenda möglich geworden wäre. |
| 37 | 13 | Karte für Remote-Schutz ziehen | Fehler | Selbst erzeugte Schutzlücke; vorhandene Hunter/Keeper werden wegen unvollständiger Effektbewertung nicht als Route genutzt. Der letzte Klick kann keinen Schutz mehr materialisieren. |
| 38 | 13 | Zug beenden | Korrekt | Keine Aktion verblieben; Resultat der fehlerhaften D36/D37-Sequenz. |
| 39 | 15 | Pflichtkarte ziehen | Korrekt | Engine-Fenster; Artificial Security Directors wird sichtbar. |
| 40 | 15 | Quandary vor neuem Remote | Riskant | Start eines Rush-Remotes; als bewusste Wette grundsätzlich zulässig. |
| 41 | 15 | Keeper als zweite Remote-Schicht | Riskant | Kohärente Fortsetzung, aber beide ICE sind gegen Cyfermaster günstig zu brechen. |
| 42 | 15 | Artificial Security Directors installieren | Riskant | Kleine 1-Punkte-Agenda hinter zwei ICE; Runner hatte genug Geld, dennoch ein zulässiger früher Rush-Versuch. |
| 43 | 15 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 44 | 16 | Keeper rezzen | Korrekt | Agenda-Remote wird angegriffen; Rezzen ist zwingend sinnvoll. |
| 45 | 16 | Quandary rezzen | Korrekt | Zweite Schutzschicht ebenfalls korrekt aktiviert. |
| 46 | 17 | Pflichtkarte ziehen | Korrekt | Engine-Fenster nach dem Diebstahl. |
| 47 | 17 | Karte für Score-Schutz ziehen | Plausibel | Bei 0 Credits und sichtbar gebrochenem Remote ist eine neue Agenda-Installation zu riskant; der Draw findet Night Shift. |
| 48 | 17 | Night Shift | Plausibel | Richtige Reaktion auf 0 Credits, plus Neuinformation. |
| 49 | 17 | 1 Credit | Plausibel | Stellt minimale Rez-/Entwicklungsliquidität her. |
| 50 | 17 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 51 | 19 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 52 | 19 | Hunter vor neuem Remote für Bioweapons | Fehler | Ein schwaches Ein-ICE-Projekt trotz wiederverwendbarem Remote 1; zugleich fachlich schlechtere Agenda als Tycho Extension bei gleichem Advancement-Bedarf. |
| 53 | 19 | Bioweapons Engineering installieren | Fehler | Der Trace nennt Schutz ausdrücklich `subset_assessment_unknown`; der qualitative Rush-Bypass lässt die 3-Punkte-Agenda dennoch zu. |
| 54 | 19 | Karte für Schutz ziehen statt advancen | Fehler | Letzter Klick, keine Schutzfortsetzung vor dem Runnerzug; Draw kann die exponierte Agenda nicht retten. |
| 55 | 19 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 56 | 20 | Hunter rezzen | Korrekt | Richtige Reaktion im angegriffenen Agenda-Remote; das vorgelagerte Projekt war zu schwach. |
| 57 | 20 | Trace-Bid 0 | Plausibel | Corp hat nur 1 Credit, Runner 15; ein Bid von 1 hätte die Erfolgswahrscheinlichkeit praktisch nicht verbessert. |
| 58 | 21 | Pflichtkarte ziehen | Korrekt | Engine-Fenster nach dem zweiten Agenda-Verlust. |
| 59 | 21 | 1 Credit | Plausibel | Finanzierung an sich sinnvoll. |
| 60 | 21 | Hunter vor neuem Remote | Fehler | Wiederholt unmittelbar das gerade gescheiterte Ein-Hunter-Muster gegen 15 Runner-Credits. |
| 61 | 21 | Hostile Takeover installieren | Fehler | Keine neue Schutzinformation rechtfertigt die Wiederholung; Remote 1 mit zwei gerezzten ICE wird ignoriert. |
| 62 | 21 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 63 | 22 | Hunter rezzen | Korrekt | Agenda-Remote wird angegriffen; Aktivierung ist richtig, aber nicht ausreichend. |
| 64 | 23 | Pflichtkarte ziehen | Korrekt | Engine-Fenster; Runner nun bei 5 Punkten. |
| 65 | 23 | Karte für Schutz/Economy ziehen | Plausibel | Corp hat 0 Credits; Draw findet Efficiency Experts. |
| 66 | 23 | Efficiency Experts | Plausibel | Sofortige Finanzierung. |
| 67 | 23 | Keeper als drittes HQ-ICE | Plausibel | Runner-Matchpoint und mehrere Agendas auf HQ machen HQ-Schutz prioritär. |
| 68 | 23 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 69 | 25 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 70 | 25 | bei voller Hand nach Schutz ziehen | Fehler | Bereits vorhandenes ICE plus reine Finanzierungslücke; Draw erzeugt Überlauf und Data Wall wird später abgeworfen. |
| 71 | 25 | 1 Credit | Plausibel | Nach dem Fehl-Draw notwendige Finanzierung. |
| 72 | 25 | 1 Credit | Plausibel | Finanzierung fortgesetzt. |
| 73 | 25 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 74 | 25 | Data Wall abwerfen | Plausibel | Keine Agenda verworfen; allerdings Folge des unnötigen D70-Draws. |
| 75 | 27 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 76 | 27 | Wall of Static vor neuem Remote | Fehler | Runner bei 5 Punkten, vorhandener Remote 1 mit zwei gerezzten ICE wird wegen Unknown verworfen. |
| 77 | 27 | Hostile Takeover installieren | Fehler | Matchpunkt-Agenda hinter nur einer Wall; Schutzbewertung bleibt ausdrücklich unbekannt. |
| 78 | 27 | Karte für Schutz ziehen statt advancen | Fehler | Letzter Klick; keine installierbare Schutzfortsetzung vor dem Runnerzug. |
| 79 | 27 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 80 | 28 | Wall of Static nicht rezzen | Fehler | Exakt bezahlbare einzige Schicht vor einer Matchpunkt-Agenda wird fälschlich als „keine Defense-Gefahr“ behandelt. |
| 81 | 29 | Pflichtkarte ziehen | Korrekt | Engine-Fenster nach dem vierten Agenda-Verlust. |
| 82 | 29 | Data Wall als drittes ICE vor Remote 1 | Plausibel | Endlich sinnvolle Härtung des wiederverwendbaren Remotes für Hostile Takeover. |
| 83 | 29 | bei voller Hand für AI-CFO-Schutz ziehen | Fehler | Der Hostile-Takeover-Parent aus D82 wird ohne echte Invalidierung verlassen; Draw führt nicht zur gebundenen Installation und später zum Keeper-Abwurf. |
| 84 | 29 | 1 Credit | Plausibel | Nach dem fehlgeschlagenen Draw ist Finanzierung sinnvoll. |
| 85 | 29 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 86 | 29 | Keeper abwerfen | Plausibel | Agenda bleibt auf HQ; Abwurf ist Folge des D83-Überlaufs. |
| 87 | 31 | Pflichtkarte ziehen | Korrekt | Engine-Fenster. |
| 88 | 31 | 1 Credit | Plausibel | Terminale Lage verlangt Rezreserve vor einem neuen mehrzügigen Scoreversuch. |
| 89 | 31 | 1 Credit | Plausibel | Finanzierung fortgesetzt. |
| 90 | 31 | 1 Credit | Plausibel | Corp erreicht 5 Credits; keine sichere Same-Turn-Scorelinie vorhanden. |
| 91 | 31 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 92 | 31 | Fire Wall abwerfen | Plausibel | Vier Agendas bleiben auf HQ; teures ICE wird gegenüber Agenda-Sicherheit geopfert. |
| 93 | 32 | Wall of Static auf R&D nicht rezzen | Ergebnis gut, Evidence schwach | R&D ist durch vollständige Agenda-Zählung agendafrei; Schonung der Credits ist richtig, Trace nennt aber nur Unknown. |
| 94 | 32 | Fire Wall auf R&D nicht rezzen | Ergebnis gut, Evidence schwach | Gleiche Lage; 5 Credits für ein agendafreies R&D wären unnötig. |
| 95 | 32 | Data Raven auf R&D nicht rezzen | Ergebnis gut, Evidence schwach | Gleiche Lage; kein terminales Agenda-Risiko in R&D. |
| 96 | 32 | Quandary auf R&D nicht rezzen | Ergebnis gut, Evidence schwach | Gleiche Lage; Corp bewahrt Credits für HQ/Remote, aber ohne passende Trace-Evidence. |
| 97 | 32 | erstes Filter auf R&D rezzen | Korrekt | 0 Rez-Kosten und positiver Runner-Tax. |
| 98 | 32 | zweites Filter auf R&D rezzen | Korrekt | Ebenfalls kostenlos und belastet den Zugriff. |
| 99 | 33 | Pflichtkarte ziehen | Korrekt | Engine-Fenster; Runner weiterhin bei 6 Punkten. |
| 100 | 33 | Quandary als zweites ICE vor Remote 2 | Fehler | Wieder wird der schlechtere Remote statt des dreifach geschützten Remote 1 gewählt; falscher AI-CFO-Parent. |
| 101 | 33 | AI Chief Financial Officer installieren | Fehler | 5-Advance-Agenda bei gegnerischem Matchpoint statt schnellerer Agenda; bekannte Schutzbewertung bleibt Unknown. |
| 102 | 33 | Karte für Schutz ziehen statt advancen | Fehler | Letzter Klick und keine Schutzwirkung vor dem Runnerzug; dieselbe gescheiterte Sequenz wie D54/D78. |
| 103 | 33 | Zug beenden | Korrekt | Keine Aktion verblieben. |
| 104 | 34 | Quandary rezzen | Korrekt | Richtige unmittelbare Defense-Aktion, aber die vorher gewählte Scoring-Linie ist gegen 16 Runner-Credits unhaltbar. |

## Klassifikation

- 16 Entscheidungen sind klar fehlerhaft. Sie sind Symptome weniger
  zusammenhängender Ursachen, nicht 16 unabhängige Sonderbugs.
- 4 Entscheidungen bilden einen riskanten, aber grundsätzlich zulässigen
  frühen Rush.
- 4 späte R&D-Declines haben ein gutes Ergebnis, aber eine unvollständige
  Begründung.
- Die übrigen 80 Entscheidungen sind regelgebunden, gut oder zumindest
  fachlich plausibel.

## Generische Maßnahmen zur Freigabe

Keine der folgenden Maßnahmen benötigt eine Karten-ID-Sonderregel.

1. **Exakte Schutzbewertung vervollständigen** — Owner:
   `corp.defend_servers` plus aktionsgebundene Engine-/Run-Projektion.
   Bekannte Teilbewertungen dürfen nicht wegen eines unbekannten Subsets
   verloren gehen; unbekannte Breaker-/ICE-Effekte bleiben explizite Blocker.
2. **Unknown nicht als Draw-Effektlücke behandeln** — Owner:
   `corp.defend_servers` innerhalb des gebundenen Score-Supports. Nur eine
   belegte Effektlücke darf `draw_for_ice` erzeugen; Funding-only delegiert an
   Economy, Unknown bleibt fail-closed resident.
3. **Rush-Risikobudget statt bloßem Bounded-ICE-Prädikat** — Owner:
   `corp.score_agenda`, Defense liefert nur Schutzfacts. Ein Rush berücksichtigt
   Agenda-/Matchpointwert, sichtbare Breaker, aktuell und bis zum nächsten Zug
   erreichbare Runner-Liquidität, öffentliche Banktools, erwartete Run-Kosten
   und verbleibende Score-Dauer. Zufall darf nur nahezu gleichwertige erlaubte
   Rush-/Nicht-Rush-Linien entscheiden.
4. **Draw-Horizont eines exponierten Agenda-Parents härten** — Owner:
   `corp.score_agenda` mit Defense-Child. Ein letzter Klick darf nur dann für
   Defense-Draw verwendet werden, wenn die konkrete Linie noch vor dem
   Runnerzug Schutz materialisiert; sonst Advance, Finanzierung oder bewusste
   Projektaufgabe anhand der vollständigen Zuglinie.
5. **Agenda- und Remote-Konversionsvergleich erweitern** — Owner:
   `corp.score_agenda`. Verglichen werden vollständige Klick-/Creditdauer,
   Corp-Punkte, gegnerischer Steal-Wert, Matchpoint, realisierte Decksynergie,
   vorhandener Remote und gebundene Fortsetzung; technische IDs bleiben nur
   letzter deterministischer Tie-Break.
6. **Globale ICE-Opportunity-Costs nachschärfen** — Owner:
   `corp.defend_servers`. Zusätzliche Zentral- oder Remote-Schichten bleiben
   erlaubt, auch ungerezztes Staging und Bluff. Entscheidend ist ihr
   Grenznutzen gegenüber der besten vollständigen Allokation und dem
   residenten Score-Parent, nicht eine feste Schichtzahl.
7. **Kompositionsabhängige Deckdoktrin** — Owner: Deck-Doctrine. Ein Enabler
   ohne passende Ziele und ein erst nach schwerer Vorbedingung aktiver
   Einzelanker werden latent/sekundär statt primär. Die Gesamtkombination aus
   Agenda-Anforderungen, ICE, Economy und fehlender Beschleunigung muss eine
   generische Remote-Scoring-Doctrine ableiten.
8. **Observability und Reproduzierbarkeit getrennt korrigieren** — Owner:
   Event-/Checkpoint-Infrastruktur. `totalAgendaPoints` muss den tatsächlichen
   Gesamtstand abbilden; deckgleiche Karteninstanzen brauchen einen stabilen
   instanzexakten Tie-Break oder eine klar dokumentierte semantische
   Äquivalenzschicht für Warmups.

Vor einer Umsetzung sind diese acht Maßnahmen als ein zusammenhängendes
Paket zu schneiden. Resolver-Shortcuts, globale Action-Boni und
kartenspezifische Ausnahmen wären architektonisch falsch. Der Score-Plan
behält Agenda-/Remote-/Advance-/Score-Ownership, der Defense-Plan behält jede
ICE-Installations- und Rez-Entscheidung, und der Zugplaner arbitriert die
vollständigen gebundenen Linien.
