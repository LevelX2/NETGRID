# V1.4.2 bis V1.6.0 Planning Review

Stand: 2026-05-08
Status: requirements-vorbereitend

## Zweck

Dieses Review prüft die vier nächsten Roadmap-Schritte nach V1.4.1:

1. V1.4.2 Belief State und Gegner-Modell.
2. V1.4.3 Simulation, Selfplay und Exploit-Regression.
3. V1.5.0 Private Replay, Analyse und Lernhilfe.
4. V1.6.0 Tutorial und Regelhilfe.

Die Roadmap nennt V1.5.x und V1.6.x als Releasefamilien. Für die nächste konkrete Umsetzung werden daraus bewusst schmale erste Releases V1.5.0 und V1.6.0 geschnitten.

## Geprüfte Quellen

- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/releases/v1/v1-4-1-plan-based-runner-ai/final-review.md`
- `docs/derived/DECK_LEGAL_AI_APPROVAL_BATCH_PLAN.md`
- `docs/derived/DECK_LEGAL_AI_APPROVAL_BATCH_A_IMPLEMENTATION_REVIEW.md`
- `docs/derived/KING_OF_THE_ROAD_AI_APPROVAL_IMPLEMENTATION_REVIEW.md`
- `docs/derived/RUNNER_AI_RND_REPEAT_ACCESS_OBSERVATION_2026_05_08.md`

## Ergebnis

Die vier Schritte sind fachlich sinnvoll, aber nicht als ein gemeinsames Umsetzungsbundle. Sie müssen strikt sequenziell umgesetzt werden:

- V1.4.2 liefert die faire Memory-/Belief-Grundlage.
- V1.4.3 darf Simulation erst darauf aufsetzen.
- V1.5.0 nutzt Replay/Debug-Daten erst nach stabiler KI-Auswertung.
- V1.6.0 nutzt Replay- und Szenario-Unterlagen für Lern- und Tutorialflüsse.

## Widerspruchsprüfung

| Frage | Befund | Entscheidung |
| --- | --- | --- |
| Roadmap sagt V1.5.x/V1.6.x, nicht V1.5.0/V1.6.0. | Kein echter Widerspruch, aber zu grob für Umsetzung. | Erster konkreter Slice heißt V1.5.0 bzw. V1.6.0; spätere V1.5.1/V1.6.1 bleiben möglich. |
| V1.4.2 Belief State klingt nach Hidden-Info-Gefahr. | Risiko hoch, aber Roadmap fordert fairen Belief State. | Belief State darf nur aus PlayerView, side-gefilterten Events und Replay-Historie rekonstruieren. Keine echte Hidden Info. |
| V1.4.3 Simulation könnte echten FullState nutzen. | Das wäre ein harter Verstoß. | Simulation erzeugt hypothetische Welten nur aus Belief State und sichtbaren Daten; echter Matchstate bleibt unberührt. |
| V1.5.0 Replay könnte private Daten offenlegen. | Risiko hoch. | Replay-Perspektiven sind side-sicher; private Analyse bleibt lokal und token-/pfadfrei. |
| V1.6.0 Lernhilfe könnte Regelautorität werden. | Risiko mittel bis hoch. | Lernhilfe erklärt LegalActions und freigegebene Szenarien, erzeugt aber keine illegalen oder versteckten Vorschläge. |
| Deck-Legal AI Approval B-G passen thematisch zur KI-Linie. | Ja, aber sie sind Kartenfreigabe-Gates. | Nicht in V1.4.2 bis V1.6.0 hineinziehen; parallel nur mit eigenem Batch-Gate. |
| R&D Repeat Access Observation passt zu V1.4.2. | Ja, weil es side-sicheres Memory aus gesehenen Access-Fakten ist. | Als kleiner Zusatz in V1.4.2 aufnehmen: `rnd_access_freshness`. |

## Scope-Entscheidung

Diese vier Releases werden nicht als Mammutpaket umgesetzt. Jeder Release bekommt eigenes Requirements-/Spec-/Test-/Review-Gate.

### V1.4.2

Aufnehmen:

- Belief State Memory.
- Gegner-Modell für beide Seiten.
- Hidden-State-Invariance.
- `R&D access freshness` als kleiner, passender Zusatz.

Nicht aufnehmen:

- Rollout-Simulation.
- Selfplay-Tuning.
- neue Kartenfreigaben.
- Kartenparser.

### V1.4.3

Aufnehmen:

- lokale KI-vs-KI-League.
- Benchmark-Gegner und Holdout-Seeds.
- faire Simulation aus Belief State.
- Exploit-Regressionsfixtures.

Nicht aufnehmen:

- echte Hidden-State-Simulation.
- stärkere KI ohne messbares Gate.
- Public Replay oder Spectator.
- Kartenfreigaben durch gute Simulation.

### V1.5.0

Aufnehmen:

- private Replay-Liste.
- Replay-Timeline mit StateHash-Prüfung.
- side-sichere Perspektiven.
- lokale DecisionDebug-/Analyseansicht.
- Export lokaler Replays ohne Tokens/private Sessions.

Nicht aufnehmen:

- Public Replay.
- Spectator.
- Cloud Sync.
- Live-Coaching oder LLM-Actionerzeugung.

### V1.6.0

Aufnehmen:

- erste geführte Tutorialszenarien für Kernabläufe.
- Regelhilfe auf Basis projektinterner Begriffe.
- Kontext-Hilfe für LegalActions.
- replaybare Tutorial-Szenarien.

Nicht aufnehmen:

- vollständige offizielle Regelschule.
- Public Onboarding.
- breite Accessibility-Vollabdeckung.
- LLM-Regelautorität.

## Menge und Umsetzbarkeit

Die Menge ist sinnvoll, wenn sie in vier Gates getrennt bleibt. Als gemeinsamer Implementierungsauftrag wäre sie zu groß, weil Memory, Simulation, Replay-UI und Tutorial jeweils eigene Hidden-Info- und Produktflächen öffnen.

Empfohlene Umsetzung:

1. V1.4.2 vollständig implementieren und final reviewen.
2. V1.4.3 erst starten, wenn V1.4.2 Memory-Rekonstruktion grün ist.
3. V1.5.0 erst starten, wenn V1.4.3 Replay-/Soak-Artefakte stabil erzeugt.
4. V1.6.0 erst starten, wenn V1.5.0 private Replay-/Analyseansichten side-sicher sind.

## Kleine sinnvolle Zusatzaufnahmen

| Zusatz | Release | Begründung |
| --- | --- | --- |
| `rnd_access_freshness` | V1.4.2 | Nutzt bereits sichtbare Runner-Access-Fakten und verhindert einen beobachteten KI-Fehler ohne Simulation. |
| Exploit-Export aus Replays als Testfallkandidat | V1.5.0 | Ist fast kostenlos, wenn Replay-Timeline und Analyse schon existieren; tatsächliche Testaufnahme bleibt Review-Schritt. |
| Tutorial-Szenarien als normale Replays speichern | V1.6.0 | Nutzt V1.5.0-Arbeit und hält Tutorials deterministisch prüfbar. |

Nicht aufgenommen:

- Deck-Legal AI Approval Batch B-G.
- neue Mechanikfamilien.
- öffentlicher Betrieb, Accounts, Matchmaking, Rankings, Turniere.
- offizielle Assets oder externe Kartendatenbank-Abhängigkeiten.

## Gate-Urteil

`V1_4_2_to_V1_6_0_planning_review_done: true`

`ready_for_V1_4_2_requirements_freeze: true`

Die Detailplanung darf als Grundlage für die spätere Umsetzung dienen, sofern vor jeder Implementierung der aktuelle Status erneut geprüft wird.
