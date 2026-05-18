# Post V1.1.2 Mechanik-, Karten- und KI-Roadmap

Status: historische Anschlussplanung; in `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md` konsolidiert
Stand: 2026-05-07
Startpunkt: nach Umsetzung und Final Gate von V1.1.2

## Verbindlichkeit

Dieses Dokument war die maßgebliche Anschlussroadmap für die Releaseplanung nach V1.1.2. Seit 2026-05-08 ist es in `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md` aufgegangen. Die fachliche Grundlinie bleibt erhalten, aber die konsolidierte Roadmap ist ab V1.1.3 die führende Planung.

Es ersetzt nicht die eingefrorene V1.1.2-Planung. V1.1.2 wird unverändert umgesetzt.

Ältere Langfristplanungen, die eine isolierte späte `V1.7 AI v2`-Umsetzung nahelegen, sind ab diesem Stand nur noch historisch zu lesen. Die KI-Weiterentwicklung ist ab V1.1.3 als laufende Spur in Mechanik- und Kartenreleases zu führen.

Diese Roadmap begründet keine halböffentlichen oder öffentlichen Plattformfunktionen.

## Kurzentscheidung

V1.1.2 bleibt unverändert der nächste Release: Full Archives Access als primärer Mechanik-/Visibility-Gate plus Matchstart Entry UX als unabhängiger Web-UI-Slice.

Nach V1.1.2 wird die weitere Planung neu geschnitten. Der Schwerpunkt liegt nicht auf halböffentlichem oder öffentlichem Spielbetrieb, sondern auf mehr spielbaren Karten durch fehlende Spielmechaniken und auf einer KI, die mit diesen Mechaniken kontrolliert mitwächst.

Die neue Linie verbindet drei Spuren:

1. Mechanik-Gates schließen Regel- und Timinglücken.
2. Karten-Gates machen nur solche Karten spielbar und decklegal, deren Mechaniken und Tests abgedeckt sind.
3. KI-Gates machen neue Mechaniken und Karten erst dann für KI-Decks verfügbar, wenn AI-Hints, Szenarien, DecisionDebug und Soaks bestehen.

## Ausgangslage

Bereits vorhanden:

- V0.3 AI Foundation: Runner-KI, Corp-KI, AI-vs-AI-Simulation und side-sichere AI-Inputs.
- V0.9 stärkere KI: rollenbewusste Scorer, Difficulty-Profile, Evidence, Reason-Codes, ObservedFacts und Soak-Helfer.
- V1.0.2 KI-Pacing und `advance_ai` für private Human-vs-KI-Flows.
- V1.0.9 privater Internetbetrieb ohne öffentliche Plattformfunktionen.
- V1.1.0 Setup, Mulligan, Game-End-Vertrag und Archives-facedown-Grundlage.
- V1.1.1 Discard, Handlimit und Core Damage.
- V1.1.2 ist requirements-gefroren und bleibt vor dieser Roadmap.

Aktuelle KI-Einordnung:

| Bereich | Stand | Einordnung |
|---|---|---|
| LegalAction-only und PlayerView-only | umgesetzt und getestet | AI-Level 0 erfüllt |
| Corp-KI und Runner-KI | heuristisch, side-sicher, spielbar | AI-Level 1 erfüllt |
| Bewertungs-/Rollenlogik | Rollenmanifest, Difficulty-Profile, Action-Scoring | AI-Level 2 weitgehend erfüllt |
| Planbasierte KI | noch keine echte Plansequenz-/Zugplanung | AI-Level 3 offen |
| Belief State und Gegner-Modell | ObservedFacts vorhanden, aber kein echtes Memory-/Belief-System | AI-Level 4 offen |
| Simulation für Entscheidungen | AI-vs-AI-Harness vorhanden, keine faire Live-Hypothesen-Simulation | AI-Level 5 offen |
| Selfplay/Tuning | Soak-Helfer vorhanden, kein systematisches League-/Exploit-Tuning | AI-Level 6 offen |

## Leitregeln

- Kein Post-V1.1.2-Release startet öffentliche Plattformfunktionen.
- Neue Karten folgen Mechanik-Coverage, nicht umgekehrt.
- Keine Karte wird allein durch Import, Katalog, Bild, Deckeditor oder lokale Verfügbarkeit spielbar.
- Jede neue spielbare Karte braucht Resolver/Ability, Manifest, Unit-/Szenariotest, Visibility, Replay/StateHash, Multiplayer-Smoke und KI-Smoke.
- Eine Karte darf erst in KI-Decks, wenn sie `AI-supported` ist.
- KI-Stärke gilt nur für definierte Rules-/Mechanics-Baselines und AI-supported Kartenpools.
- Hard/Advanced/Competitive-KI erhält nie mehr Hidden Info als Easy.
- API-/LLM-KI darf später Analyse, Testfallgenerierung oder Coaching unterstützen, aber nie Live-Regelakteur oder Action-Erzeuger sein.

## Angepasste Releasefolge nach V1.1.2

### V1.1.3 Mechanics-AI-Card Baseline

Ziel:

Nach V1.1.2 den aktuellen Stand als Startlinie für die nächsten Karten- und KI-Releases normalisieren.

Umfang:

- `MECHANICS_COVERAGE_MATRIX` auf V1.1.2 aktualisieren.
- AI-Level-Audit als aktuelles Projektartefakt dokumentieren.
- Card-Freigabestatus erweitern: `listed`, `engine_supported`, `human_playable`, `ai_supported`.
- AI-Hints-Schema als verbindlichen Planungs- und Datenvertrag festlegen.
- Mechanik-Backlog gegen Kartenbedarf priorisieren, nicht nur gegen abstrakte Regelvollständigkeit.
- O:NR-v1/private lokale Kartenkandidaten nach blockierenden Mechaniken clustern.

Akzeptanz:

- V1.1.2 bleibt unverändert abgeschlossen.
- Es gibt eine eindeutige Liste, welche Mechaniken die meisten Karten blockieren.
- Es gibt eine eindeutige Liste, welche bereits spielbaren Karten nicht `AI-supported` sind und warum.

### V1.2.0 Event Modification Foundation

Ziel:

Prevention, Avoid und Interrupts als enges, testbares Fundament vorbereiten, weil diese Mechanikfamilie viele echte Karten blockiert und später Replacement sauber tragen muss.

Umfang:

- `would`/`prevent`/`avoid`/`interrupt`-Pipeline als Engine-Vertrag.
- Zuerst enger Pilot: Damage Prevention oder Avoid für klar definierte Damage-/Tag-/Run-Fälle.
- PendingChoice-/Priority-Vertrag für genau freigegebene Fenster.
- Side-private Decisions, Hidden-Info-Barrieren und Replay/StateHash-Pflicht.
- KI behandelt nicht unterstützte Event-Modification-Karten als nicht AI-supported.

KI-Spur:

- `AiDecisionDebug` als strukturierteres Debugschema planen oder implementieren: AI-Level, gewählte Action, Confidence, Action-Scores, Risk Summary, Fallback, Seed.
- Harte Zeitbudget-/Fallback-Regel für Server-KI festziehen.
- KI darf Prevention/Avoid nur wählen, wenn die Engine eine LegalAction anbietet.

Akzeptanz:

- Kein Event wird still verändert.
- Jede Prevention/Avoid/Interrupt-Entscheidung ist im EventLog rekonstruierbar.
- Keine KI-Entscheidung nutzt FullState oder private gegnerische Daten.

### V1.2.1 Replacement Effects

Ziel:

Replacement Effects als eigenes Hochrisiko-Gate nach der Event-Modification-Grundlage.

Umfang:

- Replacement-Pipeline mit eindeutiger Reihenfolge und einmal-pro-Fenster-Regeln.
- Kleine Pilotfälle für Access, Trash, Steal oder Damage, aber keine breite Kartenmatrix.
- Konflikte werden blockierend dokumentiert statt über Fallback geraten.

KI-Spur:

- KI bewertet Replacement-Karten erst strategisch, wenn das konkrete Replacement in der MechanicSupport-Matrix `AI-supported` ist.
- Scorer sehen nur abstrakte erlaubte Rollen, keine versteckten Replacement-Interna.

Akzeptanz:

- Replacement bricht Replay und StateHash nicht.
- Mehrdeutige Replacement-Fenster erzeugen keinen stillen illegalen Zustand.

### V1.2.2 Special Zones, Ownership und Control

Ziel:

Sonderzonen und Kartenkontrolle als Basis für weitere Kartenfamilien.

Umfang:

- Set Aside.
- Remove from Game.
- Ownership-/Control-Wechsel.
- Host-/Trash-/Move-Invarianten nachziehen, wo sie mit Control kollidieren.

KI-Spur:

- KI erhält keine zusätzlichen Hidden-Zone-Daten.
- AI-Hints müssen `requiredMechanics` für Special-Zone-Karten explizit nennen.

Akzeptanz:

- ZoneRef-, Owner- und Controller-Invarianten bleiben grün.
- PlayerViews und Reconnect zeigen nur erlaubte Sonderzoneninformationen.

### V1.2.3 Mechanic Unlock Card Release 1

Ziel:

Erste größere Kartenfreigabe nach V1.1.2 und V1.2.0 bis V1.2.2, aber nur für Karten, deren Mechaniken jetzt wirklich abgedeckt sind.

Umfang:

- Kandidatenliste aus privaten lokalen Karten nach neu entsperrten Mechaniken.
- Maximaler, reviewbarer Batch statt breiter Kartenpool.
- Jede Karte erhält `requiredMechanics`, Resolver-/Ability-Verweis, Szenario und AI-Hints.
- Karten können `human_playable` werden, ohne sofort `ai_supported` zu sein.

KI-Spur:

- AI-supported nur für Karten mit Szenario-Gates und sinnvollen Rollen/Hints.
- KI-Deckpool wird nicht automatisch erweitert.
- KI-vs-KI-Smokes laufen mit einem AI-supported Teildeck, nicht mit allen neuen Karten.

Akzeptanz:

- Mehr Karten sind menschlich spielbar.
- KI bleibt stabil und nutzt nur freigegebene AI-supported Karten.

### V1.3.0 Format und Deckbuilding Foundation

Ziel:

Mehr Karten praktisch nutzbar machen, ohne ungedeckte oder illegale Decks in Matches zu lassen.

Umfang:

- Faction.
- Influence.
- Agenda-Dichte.
- Mindestdeckgröße.
- Kopienlimit und explizite Ausnahmen.
- Lokale Formatprofile mit Version.
- Server-Revalidierung beim Matchstart.

KI-Spur:

- KI-Deckbau nutzt nur AI-supported Karten und validierte Formatprofile.
- Deckrollenprofile werden aus AI-Hints und Decksnapshot berechnet.

Akzeptanz:

- Decks sind formatversioniert.
- Gegnerische Decklisten und Deckhashes bleiben side-sicher.
- Formatprofil aktiviert keine Karte ohne Mechanik- und Karten-Gate.

### V1.3.1 Card Data Pipeline v2

Ziel:

Kartenpflege skalierbarer machen, ohne Kartentextparser oder automatische Spielbarkeit einzuführen.

Umfang:

- Source Registry, Provenienz, Diff, Review und Rollback.
- Kartentext-/Errata-Versionen als Anzeige- und Prüfmaterial.
- Importstatus bleibt getrennt von Engine-/Decklegalitätsstatus.
- AI-Hints und requiredMechanics als reviewpflichtige Daten.

KI-Spur:

- AI-Hints-Validierung prüft Rollen, Mechaniken, Side und Deckpool-Kompatibilität.
- Fehlende AI-Hints verhindern nur KI-Freigabe, nicht zwingend menschliche Spielbarkeit.

Akzeptanz:

- Neue Kartenkandidaten sind nachvollziehbar importiert und reviewbar.
- Keine importierte Karte wird automatisch spielbar.

### V1.4.0 Planbasierte Corp-KI

Ziel:

Corp-KI von reiner Action-Bewertung auf Planbewertung für den unterstützten Kartenpool heben.

Umfang:

- Corp-Planmodell: `score_now`, `score_next_turn`, `build_scoring_remote`, `protect_hq`, `protect_rnd`, `recover_economy`, `bait_runner`.
- AgendaRiskEvaluator, ServerThreatEvaluator, EconomyReserveEvaluator, IceRezEvaluator, ScoringWindowEvaluator.
- RemoteIntentMemory aus erlaubten Informationen.

Mechanik-Abhängigkeiten:

- V1.1.2 Archives Access.
- V1.2.x Event-/Replacement-Gates für Karten, die bewertet werden sollen.
- V1.3.x Deck- und AI-Hints-Verträge.

Akzeptanz:

- Corp-Szenario-Gates aus dem NETGRID-KI-Briefing bestehen.
- Corp-KI schlägt definierte schwächere Baseline oder verbessert definierte Szenario-Metriken.
- Keine zusätzliche Hidden Info.

### V1.4.1 Planbasierte Runner-KI

Ziel:

Runner-KI auf planbasierte Run-, Rig- und Remote-Contest-Entscheidungen heben.

Umfang:

- Runner-Planmodell: `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset`, `safe_probe_run`.
- RunnerRigEvaluator, RunCostEstimator, ServerAccessValueEvaluator, RemoteThreatEvaluator, CorpScoringThreatEvaluator.

Akzeptanz:

- Runner-Szenario-Gates aus dem NETGRID-KI-Briefing bestehen.
- Runner-KI trifft bessere Run-/Setup-/Contest-Entscheidungen ohne Hidden-Info-Vorteil.

### V1.4.2 Belief State und Gegner-Modell

Ziel:

Fairer Belief State aus PlayerView, side-gefilterten Events und Replay-Historie.

Umfang:

- Memory-System pro KI-Seite.
- Öffentliche und eigene Fakten mit Sichtbarkeitsklasse.
- Remote-/HQ-/R&D-/Runner-Rig-Schätzungen ohne echte Hidden-State-Nutzung.
- Undo/Reconnect invalidieren oder rekonstruieren Memory korrekt.

Akzeptanz:

- Belief State ist aus side-sicherer Replay-/Event-Historie rekonstruierbar.
- Hidden-State-Varianten mit gleicher sichtbarer Projektion führen zu gleichen Entscheidungen oder nur zu erlaubter deterministischer Unsicherheit.

### V1.4.3 Simulation, Selfplay und Exploit-Regression

Ziel:

Stärkere KI messbar verbessern, ohne Simulation mit echtem Hidden State zu erlauben.

Umfang:

- KI-vs-KI-League/Soak mit Tuning- und Holdout-Seeds.
- Benchmark-Gegner und Baseline-Vergleich.
- Exploit-Szenarien als dauerhafte Regression.
- Optional lokale Replay-/DecisionDebug-Analyse.

Akzeptanz:

- 0 illegale KI-Aktionen.
- 0 Hidden-Info-Leaks.
- Replay/StateHash stabil.
- Tuning verbessert definierte Metriken oder dokumentiert bewusste Tradeoffs.

### V1.5.x Private Replay, Analyse und Lernhilfe

Ziel:

Erst nach stabilen Mechanik-, Karten- und KI-Gates einen privaten Analysepfad schaffen.

Umfang:

- Private Replay Browser.
- DecisionDebug-Ansicht nur side-sicher oder lokal privat.
- API-/LLM-Analyse höchstens als Post-Game-Analyzer, Testfallgenerator oder Coach aus erlaubten Projektionen.

Nicht-Ziel:

- Kein LLM als Live-Spielzug-Controller.
- Kein Public Replay.
- Kein Spectator/öffentliche Plattform.

## Mechanik-zu-KI-Support-Matrix

| Mechanikgruppe | Menschlich spielbar nach | KI darf legal fallbacken | KI darf strategisch bewerten ab |
|---|---|---:|---|
| Full Archives Access | V1.1.2 | V1.1.2 | V1.4.1 oder eigenes AI-Hint-Gate |
| Prevention/Avoid/Interrupt | V1.2.0 | V1.2.0 | nach AI-Hints und Szenario-Gates |
| Replacement | V1.2.1 | V1.2.1 | nach MechanicSupport `AI-supported` |
| Special Zones/Control | V1.2.2 | V1.2.2 | nur fuer freigegebene Kartenrollen |
| Neue Karten aus entsperrten Mechaniken | V1.2.3 | nur wenn LegalActions vorhanden | erst bei Status `ai_supported` |
| Format-/Deckregeln | V1.3.0 | nicht relevant | KI-Deckbau erst mit AI-supported Pool |
| Card Pipeline v2 | V1.3.1 | nicht relevant | AI-Hints werden Pflichtdaten |

## Standard-Artefakte je Folgegate

Vor Implementierung:

- `docs/derived/Vx_y_z_REQUIREMENTS.md`
- `docs/derived/Vx_y_z_SPEC.md`
- `docs/derived/Vx_y_z_TEST_MATRIX.md`
- `docs/derived/Vx_y_z_REQUIREMENTS_REVIEW.md`

Nach Implementierung:

- `docs/derived/Vx_y_z_IMPLEMENTATION_REVIEW.md`
- `docs/derived/Vx_y_z_FINAL_REVIEW.md`
- aktualisierte `MECHANICS_COVERAGE_MATRIX`
- aktualisierte KI-/Card-Support-Daten, falls betroffen
- Codex-Status und Wissensbasis nur für wiederverwendbare Entscheidungen

## Empfohlener nächster Schritt nach V1.1.2

Nach erfolgreichem V1.1.2-Final-Gate sollte zuerst V1.1.3 als Planungs- und Konsolidierungsrelease beauftragt werden, nicht direkt V1.2.0-Code.

Beauftragbarer Prompt:

```text
Erstelle V1.1.3 Mechanics-AI-Card Baseline nach abgeschlossenem V1.1.2.

Lies:
- AGENTS.md
- docs/codex/CODEX_STATUS.md
- docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/final-review.md
- docs/architecture/card-rules/mechanics-coverage-matrix.md
- docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/post-v1-1-2-roadmap.md
- docs/releases/roadmaps/ai-releaseplanning-codex-briefing-2026-05-07.md

Aufgabe:
Aktualisiere den Mechanik-, Karten- und KI-Planungsstand nach V1.1.2. Implementiere keinen Engine-, Server-, Web- oder AI-Code.

Erstelle:
- docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/plan.md
- docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/requirements.md
- docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/test-matrix.md
- docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/requirements-review.md

Ziel:
- Mechanik-Coverage nach V1.1.2 normalisieren.
- AI-Level-Audit dokumentieren.
- Card-Freigabestatus `listed`, `engine_supported`, `human_playable`, `ai_supported` verbindlich planen.
- Die nächsten Mechanik- und Karten-Gates nach Kartenwert und KI-Abhängigkeit priorisieren.
```

## Ergebnis

Diese Roadmap ersetzt nicht V1.1.2. Sie ersetzt die ältere, zu späte Idee eines isolierten `V1.7 AI v2` durch eine laufende KI-Spur in jedem Mechanik- und Kartenrelease. Die starke KI entsteht dadurch nicht als einzelnes spätes Feature, sondern aus sauberer Mechanikabdeckung, AI-supported Kartenfreigabe, planbarer Debuggability und wiederholbaren Soaks.
