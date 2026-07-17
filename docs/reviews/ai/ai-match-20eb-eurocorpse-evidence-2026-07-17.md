# KI-Spielanalyse: Match 20EB mit Eurocorpse-Fokus (2026-07-17)

Status: vollständige Analyse, Umsetzung freigegeben

## Match und Reproduktionsquelle

- Match-ID: `match_20eb121f1a2b3b1b`
- Status: `finished`
- Abschluss: 2026-07-17 09:16:05 UTC / 11:16:05 Europe/Berlin
- Seed: `match-mrohyltl-179rkat`
- Endstand: Corporation gewinnt nach Agenda-Punkten 7:0
- End-StateVersion: 278
- End-StateHash: `fnv1a:3b77fe10`
- Runtime: 279 Events, 279 Snapshots, ein Game-State und 146 detaillierte
  AI-Decision-Traces
- Datenbank: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only untersucht

Die Corporation erzielte zweimal `Hostile Takeover`, zweimal `Corporate
Coup` und `Netwatch Operations Office`. Runner war die Hard-AI.

## Vollständigkeit und Klassifikation

Der Audit verglich die aus Replay-/AI-Events erwarteten Entscheidungen mit
den detaillierten AI-Traces:

- erwartet: 146
- eindeutig zugeordnet: 146
- fehlend: 0
- verwaist: 0
- Duplikate: 0
- Action-Type-Abweichungen: 0
- fachlich plausibel: 116
- Finding oder unmittelbare Folgeentscheidung: 28
- prüfbedürftige, aber nicht isoliert beweiskräftige Discard-Choices: 2

Damit ist jede KI-Entscheidung berücksichtigt. Die 28 Findings/Folgen
konzentrieren sich auf die lange Run-Sperre, die Eurocorpse-/Hosting- und
Draw-Kette sowie die späte Streetware-Bankkette. Die zwei Discard-Choices
sind nur stützende Evidenz; ohne choice-spezifische isolierte Reproduktion
begründen sie keinen eigenen Produktionsfix.

## Deck- und Hint-Audit

Runner verwendete den Snapshot
`local_runner_krashkurs_clown_kreditmaschine_2026_07_11_snapshot_v0_6` mit
Hash `fnv1a:776713cf`, 45 Karten und 20 eindeutigen Karten-IDs. Der
reproduzierbare Deck-Audit meldete:

- 20 von 20 eindeutigen Karten geprüft
- 45 von 45 Kartenexemplaren abgedeckt
- keine Ausschlüsse
- 0 blockierende Fehler
- 0 Warnungen
- Suchwerkzeuge: `Temple Microcode Outlet` und `The Short Circuit`
- keine Remote-Contest-Tools im Deck
- stärkste Strategiewerte: `runner.search.breaker` 100,
  `runner.run_event_tempo` 74 und `runner.rig_first` 62

Der aktive und kompilierte Eurocorpse-Hint enthält Hardware-/Memory-Rollen,
`program_host` für genau einen Icebreaker und zwei wiederkehrende Credits für
den gehosteten Icebreaker. Inspector-Signale sind
`economy.recurring`, `economy.recurring_breaker_credit` und
`setup.program_host`; es bestehen keine Hint-Audit-Warnungen. Die
mechanische Semantik ist damit vorhanden. Das beobachtete Problem liegt im
Consumer- und Timingverhalten, nicht in einem fehlenden Basishint.

## Finding F1 – Run-Sperre wird ohne Terminalsignal nicht gelöst

Asp erzeugte nach dem nicht gewinnbaren Trace an D36 die korrekte Sperre:
Runner darf erst wieder laufen, nachdem er eine Aktion zum Bezahlen von einem
Credit verwendet hat. Die legale Aktion `Run-Sperre für 1 Credits entfernen`
war von D38 bis D91 in 38 AI-Fenstern verfügbar.

Nach der normalen Krash-Installation an D53 ignorierte Runner die Freigabe
in 24 Fenstern über die Runner-Züge 20 bis 32. D54 / StateVersion 110 ist der
engste Anker: 20 Credits, drei Clicks, Krash installiert; die Freigabe erhielt
Score 197, Basic Draw 1193. Nach Zahlung wären zwei Clicks und 19 Credits für
einen sichtbaren Folgepfad verblieben. Erst D91 / StateVersion 184 hob die
unmittelbare Terminalbedrohung den Score auf 4297 und ließ die KI freigeben.

Die aktuelle Bewertung in `runner-run-lock-release-score.ts` kennt damit die
sichtbare Terminalbedrohung, aber keinen allgemeinen glaubwürdigen,
bezahlbaren Folgepfad. Das ist ein generischer Timingfehler; die
LegalAction-/Engine-Seite funktioniert.

## Finding F2 – Eurocorpse wird leer installiert und nie genutzt

Eurocorpse™ Spin Chip (`onr_proteus_139_eurocorpse-tm-spin-chip`) darf genau
einen Icebreaker hosten, beginnt mit zwei Bits und finanziert mit ihnen nur
den gehosteten Icebreaker während Runs.

- D53 / SV109: Krash wird normal in das Rig installiert.
- D55 / SV111: Eurocorpse wird für sechs Credits leer installiert. Runner
  fällt von 20 auf 14 Credits und von zwei auf einen Click. Der rohe
  Eurocorpse-Score beträgt nur 11, doch die Planabbildung erzwingt ihn mit
  Priorität 870 als `economy_engine`; `Stakeout` hatte roh 1252.
- Die Action-Projektion ist `partial_projected:low`; Ability-Binding und
  Zielkontext fehlen.
- Ab SV112 liegt Eurocorpse mit `{bit: 2}` im Rig, ohne `hostedOn`.
- D59 bis D61 / SV120 bis SV122: Ein zweiter Krash ist im Grip; die legale
  Aktion `Krash in Eurocorpse hosten` erhält Score 639. Basic Draw erhält
  jeweils 1043 und wird dreimal gewählt. D63 wirft Krash ab.
- D90 verwirft später den zweiten Krash und die zweite Eurocorpse-Kopie;
  diese Choice ist nur Stützevidenz.
- In der langen Remote-Run-Kette D93 bis D112 pumpt und bricht der normal
  installierte Krash ausschließlich mit normalen Credits. Eurocorpse bleibt
  bei zwei Bits.

Eurocorpse trug im gesamten Spiel null Credits und null Hostingnutzen bei.
Die Kombination aus Handentwicklungsrolle `economy_engine`, fehlender
Zielviabilität beim Installieren und zu niedriger Priorität des konkreten
Hosting-Schritts ist der zu reproduzierende Consumer-Vertrag.

## Finding F3 – Basic Draw erzeugt vermeidbaren Grip-Überlauf

Runner wählte 23-mal Basic Draw. Vierzehn dieser Aktionen erfolgten bei
vollem oder bereits überfülltem effektivem Grip:

`59, 60, 61, 64, 65, 66, 67, 70, 72, 76, 80, 86, 87, 88`

Cortical Cybermodem erhöhte das effektive Handlimit auf sieben. Trotzdem
entstanden Sequenzen 7→10 mit anschließend drei Discards und 7→11 mit
anschließend vier Discards. Der Draw-Score blieb ab vollem Grip bei 1043
(Action-Type 53, Setup-Ziel 820, strategischer Bonus 145, privater Bonus 25)
und enthielt keinen erwarteten End-of-turn-Überlauf, keine erzwungene
Discard-Kostenbetrachtung und keine Revalidierung nach jedem Draw.

D59 / SV120 ist der historische Anker. D58 mit sechs Karten bei Limit sieben
ist eine enge positive Kontrolle. Der Vertrag muss echte Defense-, Search-
und Handqualitätsgründe für Draw erhalten.

## Finding F4 – Hintergrundbank überschreitet ihre Zugkadenz

Streetware Distributor ist eine legale Action-Bank: Eine Aktion speichert
drei Bits; zu Beginn jedes Runner-Zugs zahlt sie, solange vorhanden, ein Bit
aus. Der PlanPortfolio-Vertrag klassifiziert `recurring_cycle` als
`background` mit `maxActionsPerTurn: 1`.

Im Match wird dieselbe Streetware dennoch mehrfach pro Zug beladen:

- D38 bis D40: drei Aktivierungen in der frühen Phase; die Trace-Komponente
  `bankPortfolioActionsThisTurn` bleibt trotz Turnwechsel-/Memory-Daten bei 0.
- D129 bis D131 / SV242 bis SV244: drei Aktivierungen im selben späten Zug,
  Bits steigen von 1 auf 10, Credits bleiben 6, Clicks fallen von 3 auf 0.
- D133 / SV251: im nächsten Zug erneut laden, Bits 9→12; danach R&D-Run,
  Spielende im folgenden Corp-Zug mit zwölf ungenutzten Bits.

Die Bankwerte zeigen `bankPortfolioRole: background`,
`bankPortfolioActionsThisTurn: 0`, keinen konkreten Finanzierungsbedarf,
keinen terminalen Finanzierungsbedarf und keine kritische Reserve. Der
vorhandene PlanMemory-/Portfolio-Vertrag wird somit nicht zuverlässig bis in
den Folgezustand fortgeschrieben.

## Finding F5 – Späte Bankinvestition ignoriert Amortisationshorizont

Bei Corp 5:0 und sichtbarer Matchpointlage priorisiert die KI ab D129 die
verzögerte Streetware-Bank gegenüber sofortigen Credits oder Druck. Der
Bank-Score enthält 940 Economy-Zielpunkte und bis zu 1550 Commitment-Punkte,
obwohl `bankConcreteFundingNeed`, `bankTerminalContestFundingNeed` und
`bankCriticalReserve` sämtlich `false` sind.

Der generische Vertrag muss die verbleibende sichtbare Spiel- und
Auszahlungshorizont berücksichtigen. Er darf eine späte Bankladung nicht
pauschal verbieten: Ein konkreter kurzfristiger oder terminaler
Finanzierungsbedarf kann sie rechtfertigen.

## Bewusst keine Findings

- D92 wählt trotz negativem Rohwert korrekt die mögliche Zwei-Punkte-
  Terminal-Remote über `opponent_matchpoint_contest`. Die später offenbarte
  Karte darf nicht rückwirkend als Entscheidungsinput gelesen werden.
- Die Remote-Run-Kette D93 bis D112 bezahlt Pumpen und Breaken konsistent aus
  normalen Credits. Ohne gehosteten Breaker dürfen Eurocorpse-Bits nicht
  verwendet werden; es liegt kein Shared-Budget- oder Enginefehler vor.
- Trace-Bids an D115, D136 und D140 sind mit sichtbaren Credits und Link
  plausibel.
- Access-/Trash-Entscheidungen sind aus den damaligen PlayerViews plausibel.

## Freigegebene Remediation-Grenze

Vor Produktionsänderungen werden D54, D55, D59, D39 und D129 mit Strict
Warmup gegen den aktuellen Code reproduziert. Nur `behavior_regression` führt
zu einem Fix. Engine-/Runtime-/Warmup-Drift wird separat klassifiziert.
Historische Erwartungen bleiben nach dem Red-Nachweis unverändert; jede
Regel erhält positive und negative Gegenproben.
