# KI-Selbstspielzyklus 005 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; drei generische Fehler behoben und im letzten
identischen Replay bis zum regulären Matchende verifiziert

## Reproduktionsvertrag

- Auswahlseed: `fb0f32492012bf9d4cec7495cf187ec7`
- Spielseed: `selfplay-005-d0e715c051817d8f50363e8ccb5afafd`
- Auswahlmenge: 24 kuratierte Runner- und 23 kuratierte Corp-Standarddecks
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, normale KI,
  Detailtrace
- Runner: **Rent-I-Con: Das Shellspiel**, 45 Karten,
  `standard_standard_runner_rent_i_con_shellspiel_2026_07_17_1.0.0`,
  `fnv1a:518ccd75`
- Corp: **Fast Advance, Baby**, 45 Karten und 16 Agendapunkte,
  `standard_standard_corp_mr96xg94_1.0.0`, `fnv1a:24e3bcd4`

Alle Läufe verwendeten den normalen Multiplayer-/KI-Pfad mit manueller
Einzelschrittsteuerung, eine isolierte SQLite-Datenbank und die lokale
read-only Maintenance-Analyse-API. Standardports und Main-Datenbank blieben
unberührt.

| Stand                                      | Ergebnis wie im Programm                          | Grund                               |               Entscheidungen | finaler StateHash |
| ------------------------------------------ | ------------------------------------------------- | ----------------------------------- | ---------------------------: | ----------------- |
| Ausgangslauf `match_b920d5897a7fa766`      | kein Endergebnis; Zwischenstand Runner 3 – Corp 0 | KI stoppt fail-closed vor D99       |  98 angewandt, 1 Fehlversuch | `fnv1a:b7a06bef`  |
| Replay nach Fix 1 `match_f96e7445261cab1a` | kein Endergebnis; Zwischenstand Runner 3 – Corp 2 | KI stoppt fail-closed vor D155      | 154 angewandt, 1 Fehlversuch | `fnv1a:641fa1b7`  |
| Replay nach Fix 2 `match_a989710008cbc543` | Runner 10 – Corp 2; Agendapunkte 8:2              | Runner erreicht sieben Agendapunkte |                          245 | `fnv1a:7af071f0`  |
| finaler Replay `match_a827f500dc378815`    | Runner 10 – Corp 0; Agendapunkte 8:0              | Runner erreicht sieben Agendapunkte |                          440 | `fnv1a:3d25fa19`  |

Die veränderten Ergebnisse sind kein Vergleich verschiedener Zufallsfolgen.
Decks und Seed blieben identisch; die Abzweigungen entstehen ausschließlich
aus den behobenen Entscheidungs- und Quote-Verträgen.

## Vollständiger Decision-Denominator

Alle 939 persistierten Entscheidungsdatensätze der vier analytischen Läufe
wurden genau einmal klassifiziert:

- `plausibel`: 520;
- `Finding`: 9 – der Abbruch D99, der Abbruch D155 und sieben durch die
  fehlende variantscharfe Rez-Quote erzwungene Decline-Rez-Entscheidungen;
- `trace-limitiert`: 410 reguläre Entscheidungen ohne normalisierten
  TurnPlanner-Abschnitt; Plan-First-Detailtrace, LegalAction-Audit und
  Engine-Evidence sind vorhanden;
- `prüfbedürftig`: 0 einzelne Entscheidungen. Der im letzten Replay sichtbare
  Score-Stau ist ein Meta-Muster über viele Züge und wird deshalb getrennt in
  der Indizienmatrix geführt;
- keine Fallbacks, Timeouts, Seiten-, LegalAction-, Debug-/Apply- oder
  Engine-Apply-Abweichungen.

Der finale Replay enthält 440 Entscheidungen und 441 Events. Davon sind 257
als plausibel und 183 als trace-limitiert klassifiziert. Alle historischen
LegalAction- und Engine-Audits sind vorhanden; der terminale StateHash stimmt.

## Bestätigtes Finding 1 – gleichwertige Installationsvarianten bleiben ownerlos

Bei D99 liegt Vienna 22 im Grip. Für dieselbe Karteninstanz veröffentlicht die
Engine mehrere legale Installationsvarianten: normale Zahlung, ein oder zwei
Bits von Zetatech Software Installer sowie Varianten mit vorherigem
Programm-Trash. Der Zentraldruck-Plan dispositioniert nur die kanonische
Null-Bit-Variante, weil die Zugriffsausbaukarte noch keine aktuelle oder
gebundene HQ-Zugriffsroute besitzt. Die semantisch identischen Zahlungs- und
Trash-Geschwister bleiben unklassifiziert; der Abdeckungsgate stoppt korrekt
mit `missing_plan_module_coverage`.

Der generische Fix propagiert die Zweckdisposition auf alle aktuellen
LegalActions derselben Quellinstanz, desselben Actiontyps und derselben
semantischen Aktion. Bereits durch Coverage-, Development- oder Spezialpläne
beanspruchte Varianten werden nicht überschrieben. Owner, Plan und
LegalAction-IDs bleiben unverändert.

Regressionstest:
`defers every payment and program-trash variant of a central payoff install until a bound access route exists`.

## Bestätigtes Finding 2 – Suchfenster verliert die Herkunft seiner Planaktion

Nach dem ersten Fix wählt `runner.rig_and_coverage` D154 Test Spin als exakt
gebundene Suche nach Code-Gate-Abdeckung. Das anschließende Engine-Choice D155
enthält zwar eine textuelle Source, aber nicht die strukturierten Felder für
Quellinstanz und Definition. Der Choice-Resolver kann das Fenster deshalb
nicht exakt zur ausgewählten Suchaktion zurückbinden und stoppt mit
`invalid_support_graph`.

Die Ursache liegt in der Engine-Erzeugung des Auswahlfensters. Der Fix ergänzt
die bereits im gemeinsamen Choice-Vertrag vorgesehenen strukturierten
Herkunftsfelder. Die KI parst keinen Source-String und erhält keinen
kartenbezogenen Shortcut. Der bestehende Coverage-Owner wählt danach den
Codecracker und führt seine Continuation fort.

Regressionstest: Der reale Test-Spin-Enginepfad verlangt Quellinstanz und
Quelldefinition im actor-privaten Choice.

## Bestätigtes Finding 3 – variable Rez-Aktionen besitzen nur eine Kartenquote

Im regulären Zwischenreplay installiert die Corp mehrere variable ICE. Die
LegalActions für Gatekeeper nennen für jede Variante exakt Credits und die
danach vorhandene Zahl von End-the-run-Subroutinen. Die
Ressourcenaustausch-Quote liegt jedoch nur einmal auf Kartenebene vor. Vor dem
Rez besitzt Gatekeeper noch keine gedruckte End-the-run-Subroutine; die Quote
meldet daher `no_hard_end_the_run_subroutine`. Zusätzlich entfernt die
positive AI-Eingabe-Allowlist die variantenbezogenen LegalAction-Felder.

Dadurch lehnt die Corp unter anderem D11 und D16 Gatekeeper trotz acht Credits
und fehlendem passenden Runner-Breaker ab. Direkt danach wird Project Venice
aus HQ gestohlen. Dasselbe Muster erscheint bei Sandstorm, Riddler und
Caryatid.

Der Fix ist capability- und actionbezogen:

- die Engine veröffentlicht für jede aktuelle bezahlte
  End-the-run-Subroutinen-Variante eine eigene, an deren Action-ID gebundene
  Ressourcenaustausch-Quote;
- die AI-DTO-Allowlist erhält die Engine-zertifizierten Variantenfelder;
- `corp.defend_servers` liest ausschließlich die Quote der ausgewählten
  aktuellen LegalAction und validiert deren Kosten gegen die allgemeine
  variable Rez-Kostenquote;
- eine fehlende oder mehrdeutige Quote bleibt fail-closed; Kartentext,
  Kartenname und alternative Recommendation-Logik werden nicht eingeführt.

Der fokussierte Test belegt für eine bezahlbare Ein-ETR-Variante Kosten 5,
einen nicht verfügbaren sichtbaren Breaker, `access_reduction`, denselben
Defense-Owner und keinen Fallback. Alle 39 angrenzenden Corp-Rez-Routentests
sind grün.

Im finalen Replay rezzt die Corp D11 Gatekeeper mit einer End-the-run-
Subroutine. Der Matchverlauf zweigt damit nachweislich vom Zwischenreplay ab
und endet ohne Entscheidungsfehler.

## Großstrategische Analyse des finalen Gewinners

Der Runner gewinnt nicht durch einen einzelnen glücklichen Zugriff, sondern
durch eine über 45 Züge gehaltene R&D-Kampagne:

- 17 Runs, davon 15 auf R&D, einer auf HQ und einer auf Remote 1;
- frühe Installation von Wrecking Ball und Big Frackin' Gun, später eine
  exakt gebundene Test-Spin-Suche nach Codecracker;
- 69 Runfortsetzungen, 30 Pump- und 22 Break-Aktionen zeigen, dass die
  Verteidigung tatsächlich bezahlt und überwunden wird;
- vier gestohlene Agenden – Project Venice, AI Board Member, Charity Takeover
  und Project Zurich – ergeben acht Punkte;
- Garbage In konvertiert wiederholte R&D-Zugriffe zusätzlich in zehn
  Trash-Entscheidungen und erhöht den langfristigen Wert derselben Kampagne.

Die großstrategische Stärke ist die Konsequenz: Der Runner wechselt nicht
nach jedem gestoppten Run das Ziel, sondern baut fehlende Abdeckung auf und
kehrt zum ertragreichen zentralen Server zurück.

## Warum die Corp verlor

Die unmittelbare Niederlagenursache lautet acht gestohlene gegen null
gescorte Agendapunkte. Der variable-Rez-Fix verbessert die Verteidigung
sichtbar – Gatekeeper stoppt den frühen HQ-Zugriff und der Lauf wächst von 245
auf 440 Entscheidungen –, behebt aber nicht das Scoretempo.

Die entscheidende strategische Kette:

1. Bereits nach der ersten Pflichtziehung liegen World Domination und Project
   Venice in HQ. Ab dem zweiten Corp-Zug kommt Charity Takeover hinzu.
2. Über 22 Corp-Züge bleibt HQ mit drei bis fünf Agenden gesättigt. Die Corp
   erreicht zwischenzeitlich 9, 11, 12 und schließlich 16 Credits.
3. Trotzdem erzeugt `corp.score_agenda` erst D411 eine Agenda-Installation und
   D412 einen Advance. Davor dominieren Economy (39 Entscheidungen), Defense
   (37) und Handmanagement (15).
4. Die Corp installiert neun zentrale beziehungsweise Remote-ICE und rezzt
   vier davon. Diese Investitionen verlängern das Spiel, schaffen aber keinen
   eigenen Punktedruck.
5. Der Runner kann deshalb immer wieder auf R&D zurückkehren. D440 stiehlt er
   Project Zurich und beendet die Partie 8:0.

Matchup und Varianz tragen bei: Das Runner-Deck besitzt langfristig passende
Breaker, Suchzugriff und R&D-Payoff; die gestohlenen Agenden liegen auf den
angegriffenen Pfaden. Das erklärt aber nicht den vollständigen Verzicht auf
Scorefortschritt trotz dauerhaft sichtbarer Agenda-Sättigung und zeitweise
hoher Liquidität.

## Neue strategische Idee

Der neue Verdacht lautet nicht „Agenda immer früher installieren“. Eine
ungeschützte Agenda gegen ein aufgebautes Rig wäre ebenfalls falsch. Benötigt
wird eine generische **Score-Stau- und Agenda-Sättigungssteuerung**:

- Agendaanteil in HQ, Dauer ohne Scorefortschritt und verbleibende Siegzeit
  müssen den Nutzen weiterer Economy-/Defense-Vorbereitung begrenzen;
- der Scoreplan sollte einen stufenweisen Schutz- und Installationspfad
  zulassen, statt bis zu einer statischen Vollfinanzierungsschwelle inaktiv zu
  bleiben;
- das Risiko eines Remote-Verlusts ist gegen das ebenfalls steigende Risiko
  von HQ-/R&D-Agendaexposition und gegnerischer Kampagnenreife abzuwägen;
- eine spätere Änderung braucht einen belegten konkreten Alternativpfad und
  darf SP-006, den Verdacht zu unzureichend finanzierten Score-Remotes, nicht
  pauschal umkehren.

Die Evidence ist stark, reicht aber noch nicht für eine sichere Schwelle oder
einen generischen Fix. Der Fall wird deshalb als Verdacht SP-017 gespeichert.

## Zyklusübergreifende Einordnung

- SP-013 konserviert aus Zyklus 004 die offene Frage, ob endliche
  Universal-Breaker zu früh für niedrigere Payoffs verbraucht werden.
- SP-014 bis SP-016 dokumentieren die drei in diesem Zyklus behobenen
  Vertragsfehler.
- SP-017 verdichtet den Score-Konversionscluster um das Gegenstück zu SP-006:
  Nicht nur eine zu schwach geschützte Installation, sondern auch dauerhaftes
  Warten auf vollständigen Schutz kann eine Corp-Partie verlieren.
- Der finale Lauf bestätigt SP-011 nicht als einfachen ICE-Schichtenfehler.
  Die rezzten Schichten erzeugen reale Kosten und Laufzeit; offen bleibt ihre
  Balance gegen eigenes Scoretempo.

## Verifikation und Dokumentationsprüfung

- fokussierter Installationsvarianten-Test und vier angrenzende
  Zugriffsausbau-Tests grün;
- Runner-Planabdeckung 2 von 2 grün;
- Test-Spin-Engine-Provenienztest grün;
- Corp-Rez-Routen 39 von 39 grün;
- Shared- und Engine-Typecheck grün;
- AI-Typecheck erreicht ausschließlich die sechs bereits dokumentierten
  Baselinefehler außerhalb der Änderung;
- die AI-Architekturdokumentation ergänzt den Vertrag für variantscharfe
  aktuelle Rez-Quotes;
- der finale identische Replay endet regulär nach 440 Entscheidungen ohne
  Fallback, Timeout, Apply- oder LegalAction-Abweichung.

Die zyklusübergreifende Verdichtung liegt in
[der KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
