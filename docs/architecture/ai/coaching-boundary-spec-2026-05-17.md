# Side-sichere AI-Coaching-Boundary-Spezifikation

Stand: 2026-05-17
Status: Produkt- und Sicherheitsvertrag, keine Implementierungsfreigabe
Zielbereich: spätere Lern-, Review- und Coaching-Funktionen

## Entscheidung

AI-Coaching ist in NETGRID ausschließlich eine Erklärungsschicht. Ein Coach darf sichtbare Spielsituationen erklären, Lernhinweise geben, legale Optionen sprachlich einordnen und nach einem Match side-sichere Entscheidungen besprechen. Er ist nie Regelautorität, nie Quelle für `LegalActions`, nie Ausführer von `PlayerActions` und nie Kanal für Hidden Info.

Die Rules Engine bleibt die einzige Regelautorität. UI, Server, menschliche Spieler, reguläre KI und ein späterer Coach dürfen nur mit Daten arbeiten, die aus der jeweiligen erlaubten Perspektive stammen. Jede tatsächliche Aktion muss weiterhin aus aktuellen `LegalActions` abgeleitet und durch `applyAction` revalidiert werden.

Diese Spezifikation führt keine Coach-UI, keine LLM-Integration, keine Server-API, keine Engine-Änderung, keine Replay-Änderung und keine Public-Funktion ein.

## Quellenbasis

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitt `P2: Side-sicheres AI-Coaching`.
- `docs/activities/done/act-2026-05-17-ai-input-nested-payload-allowlist.md`: AI-Input-DTO rekonstruiert verschachtelte Payloads über positive Allowlists.
- `docs/activities/done/act-2026-05-17-decisiondebug-schema-redaction-snapshots.md`: `DecisionDebug` ist über `ai-decision-debug-v1` versioniert und side-sicher redigiert.
- Globale NETGRID-Prinzipien aus `AGENTS.md`: Engine-Korrektheit zuerst, Rules Engine als einzige Regelautorität, Hidden-Info-Schutz für PlayerViews, PublicEvents, KI-Inputs, WebSocket, Reconnect, Undo, öffentliche Replays, Logs und Fehler.

## Coach-Rollen

Erlaubte Rollen:

- Lerncoach: erklärt sichtbare Regeln, Timingpunkte und warum bestimmte sichtbare Optionen legal sind.
- Reviewcoach: fasst nach einem Spiel side-sichere Entscheidungen, verpasste sichtbare Optionen und öffentliche Wendepunkte zusammen.
- Testfallgenerator nach Gate: schlägt rote Hidden-Info- oder Redaction-Fixtures vor, ohne aus ihnen Live-Empfehlungen abzuleiten.

Verbotene Rollen:

- Live-Regelrichter oder Ersatz für die Rules Engine.
- LegalAction-Generator oder PlayerAction-Autorität.
- Gegneranalyse über verdeckte Karten, private Decklisten, FullState oder Replay-PrivatePayload.
- LLM-gestützte Entscheidungsausführung.
- Public-Moderation, Sanktion, Matchmaking, Betrugserkennung oder Accountprofiling.

## Erlaubte Datenquellen

Ein Coach darf nur eine explizit gebaute, versionierte Coach-Projektion erhalten. Diese Projektion darf je nach Perspektive aus folgenden Quellen bestehen:

| Quelle | Erlaubt | Grenze |
| --- | --- | --- |
| `PlayerView` der jeweiligen Seite | ja | nur die aktuelle Seite; keine gegnerische Privatsicht |
| `LegalActions` der jeweiligen Seite | ja | nur zur Erklärung vorhandener Optionen; Coach erzeugt keine neuen Actions |
| side-sichere `PublicEvents`/Event-Tail | ja | nur redigierte öffentliche oder für die Seite zulässige Eventdaten |
| eigene private Informationen der Seite | ja, soweit sie bereits in der eigenen `PlayerView` liegen | keine Weitergabe an die Gegenseite oder Public-Flächen |
| `DecisionDebug` | optional nach eigenem Schema | nur `ai-decision-debug-v1` oder spätere explizit erlaubte, side-sichere Auszüge; kein Debug als neue Wissensquelle |
| Replay | nur perspektivisch erlaubt | Runner-/Korp-Review nur in eigener Perspektive; Public Replay nur über eigene public-sanitized Projektion |
| technische Labels | optional | Release, Rules-Baseline, Formatprofil, AI-Profil ohne `AIInput`, Hidden Info oder Tokens |

Die Coach-Projektion muss positive Feldlisten verwenden. Generisches Deep-Copying aus Matchrecord, ReplayView, ServerEventRecord oder AI-Input ist nicht zulässig.

## Verbotene Datenquellen

Ein Coach darf niemals erhalten oder ableiten:

- `GameState`, FullState, `cardInstances`, interne Engine-Objekte.
- gegnerische Hidden-Zonen: Runner Grip/Stack, Korp HQ/R&D, facedown Archives, unrezzed Installationen, verdeckte Such-/Reorder-Ergebnisse.
- gegnerische private Decksnapshots, Decklisten, Deckhashes, Cloud-Deck-IDs oder stabile private Deckreferenzen.
- `GameEvent.privatePayload`, Replay-PrivatePayload, `privatePayloadLocalOnly`, `local_analysis`, `exploitSuggestions`.
- Roh-`AIInput`, unredigiertes `DecisionDebug`, Belief-Hypothesen als Beweis, Simulation-Interna oder Rollout-Welten.
- Session-, Join-, Reconnect-, Invite-, Recovery- oder Account-Session-Tokens und Token-Hashes.
- Accountdaten, Chatdaten, Reports, Moderations-Evidence, Observability-Rohlogs oder lokale Dateipfade.
- freie Regelentscheidung durch LLM, freie Aktionsvorschläge außerhalb aktueller `LegalActions` oder synthetische Action-IDs.

## Antwortvertrag

Coach-Antworten müssen diese Regeln einhalten:

1. Empfehlungen referenzieren nur sichtbare Fakten und aktuelle legale Optionen.
2. Wenn eine gute Antwort Hidden Info bräuchte, sagt der Coach das knapp und bleibt allgemein.
3. Der Coach darf Unsicherheit benennen, aber keine verdeckten Kartentitel, Decklisten oder Wahrscheinlichkeiten aus nicht sichtbaren Quellen behaupten.
4. Der Coach darf keine Aktion ausführen und keine Action-ID außerhalb der gelieferten `LegalActions` vorschlagen.
5. Der Coach darf Regeln erklären, muss aber bei Regelvollzug auf die Engine verweisen.
6. Public- oder Zuschauerflächen erhalten keinen Coach, solange kein eigenes Privacy-, Abuse-, Consent- und Redaction-Gate existiert.

## Runner-Beispiel

Situation: Runner ist am Zug. In der Runner-`PlayerView` sind Credits, Klicks, Rig, sichtbare Serverstruktur, bekannte/rezzed ICE und die aktuellen Runner-`LegalActions` sichtbar. Ein Remote-Server hat ein unrezzed ICE und eine unrezzed Root-Karte.

Erlaubte Coach-Antwort:

> Du kannst aktuell auf HQ, F&E, Archive oder Remote 1 laufen, weil diese Optionen in deinen LegalActions stehen. Remote 1 enthält verdeckte Korp-Karten; ich kann deren Identität nicht kennen. Sichtbar ist nur, dass du für einen Run gegen Remote 1 mit unbekanntem ICE-Risiko rechnen musst. Wenn du sicherer spielen willst, sind sichtbare Economy- oder Rig-Aufbau-Optionen ebenfalls legale Alternativen.

Verbotene Coach-Antwort:

> Remote 1 ist wahrscheinlich eine Agenda hinter `Wall of Ice`; lauf jetzt.

Grund: Der verdeckte ICE-Titel und Root-Inhalt sind nicht in der Runner-Perspektive sichtbar.

## Korp-Beispiel

Situation: Korp ist am Zug. In der Korp-`PlayerView` sind HQ-Karten als eigene private Informationen, Credits, Klicks, eigene Server, sichtbare Runner-Rig-Daten und Korp-`LegalActions` sichtbar.

Erlaubte Coach-Antwort:

> Du hast legale Optionen zum Installieren, Credits nehmen und Zug beenden. Wenn eine Agenda in deiner HQ-Hand liegt, darf ich sie in deiner Korp-Perspektive als Risiko erklären. Ich darf daraus aber keine Information an die Runner-Perspektive oder eine öffentliche Auswertung geben.

Verbotene Coach-Antwort:

> Der Runner hat keine passende Antwort im Grip; installiere und score sicher.

Grund: Runner-Grip und Stack sind für die Korp verdeckt. Der Coach darf nur sichtbares Rig, PublicEvents und LegalActions verwenden.

## Replay-Sicht-Beispiel

Situation: Nach dem Match möchte ein Spieler eine Review-Zusammenfassung. Es gibt Runner-/Korp-perspektivische Replay-Views und künftig eventuell eine public-sanitized Replay-Projektion.

Erlaubte Runner-Review:

> Aus deiner Runner-Perspektive war der R&D-Zug nach dem öffentlichen Reveal rechtmäßig bekannt. Nach der späteren Shuffle-Markierung war diese Information nicht mehr frisch. Die Review kann daher erklären, warum ein weiterer R&D-Run riskanter wurde.

Erlaubte Public-Review nach eigenem Public-Replay-Gate:

> Der öffentliche Verlauf zeigt einen Run, einen Zugriff und später eine Shuffle-Barriere. Details verdeckter Karten und private Entscheidungen bleiben ausgeblendet.

Verbotene Public-Review:

> Vor dem Zugriff lag Karte X oben auf R&D, und die Korp-Hand enthielt zwei Agendas.

Grund: Public Replay darf keine side-private ReplayView, keine `privatePayload` und keine verdeckten Zonen veröffentlichen.

## Rote Hidden-Info-Fixtures

Diese Fixtures sind als künftige rote Tests oder Review-Checklisten zu behandeln. Sie müssen scheitern, redigieren oder zu allgemeiner Coach-Antwort führen:

| Fixture | Eingeschleuste Gefahr | Erwartung |
| --- | --- | --- |
| `coach_runner_unrezzed_ice_title_leak` | Runner-Coach-Input enthält verdeckten Korp-ICE-Titel in `publicPayload` oder `DecisionDebug` | Feld wird blockiert/redigiert; Coach nennt nur unbekanntes ICE |
| `coach_runner_remote_root_identity_leak` | Remote-Root-Identität wird vor Reveal in Coach-Kontext kopiert | Coach erhält keinen Titel und gibt keine Agenda-/Asset-Vermutung aus |
| `coach_corp_runner_grip_leak` | Korp-Coach-Input enthält Runner-Grip-Karten oder Stack-Reihenfolge | Payload scheitert oder redigiert; Coach verweist auf unbekannte Runner-Hand |
| `coach_public_replay_private_payload_leak` | Public-Review enthält `privatePayload`, `local_analysis` oder side-private Replaydaten | Public-Coach-Projektion wird verworfen |
| `coach_token_decklist_contamination` | Promptkontext enthält Tokens, Token-Hashes, Deckliste oder Cloud-Deck-ID | Redaction-Verstoß; keine Coach-Antwort mit Rohwerten |
| `coach_free_action_generation` | LLM schlägt Action-ID vor, die nicht in aktuellen `LegalActions` steht | Antwort wird blockiert oder in Regelhinweis ohne Aktion umformuliert |
| `coach_debug_as_evidence` | `DecisionDebug`-Hypothese wird als sicherer Fakt dargestellt | Coach muss Hypothese als Debug-/Scoringhinweis einordnen oder ausblenden |

## Minimaler späterer Implementierungsschnitt

Ein späterer erster Implementierungsschnitt muss vor Codefreigabe separat geplant werden und mindestens enthalten:

1. `CoachInputV1` als eigenes DTO, nicht `AiDecisionInputDto`, nicht `ReplayView`, nicht `PlayerView` direkt.
2. Positive Allowlist für Coach-Felder je Perspektive `runner`, `corp`, `own_replay_review` und optional `public_replay`.
3. Payloadscan gegen verbotene Schlüssel und Werte aus dieser Spezifikation.
4. Antwort-Sanitizer oder Response-Gate gegen Hidden-Info-Behauptungen, Tokens, Decklisten und freie Action-IDs.
5. Tests mit Runner-, Korp- und Replay-Fixtures inklusive der roten Hidden-Info-Fälle.
6. Kein Schreibzugriff auf Match, Engine, LegalActions, Replay, StateHash oder Accountdaten.

## Deferred Scope

Nicht freigegeben durch diese Spezifikation:

- Coach-UI, Coach-Chat oder In-Game-Overlay.
- LLM-Provider, Prompting, Toolaufrufe, RAG oder Streaming-Antworten.
- Live-Aktionsausführung, Autoplay, Regelentscheidung oder LegalAction-Erzeugung.
- Public Coaching, Spectator Coaching, Public Replay Coaching oder Content-Sharing.
- Moderation, Sanktion, Betrugserkennung, Rankings oder Account-Personalisierung.
- Nutzung offizieller Assets oder externer Kartendatenbanken.

## Folgepakete

Empfohlen, aber nicht durch dieses Paket freigegeben:

| Paket | Gate |
| --- | --- |
| `ai-coach-input-redaction-harness` | `CoachInputV1`-Builder, Payloadscan und rote Fixtures ohne UI/LLM |
| `ai-coach-response-contract` | Antwortregeln, Action-ID-Gate, Hidden-Info-Behauptungsfilter und Beispiel-Snapshots |
| `ai-coach-ui-privacy-gate` | erst nach Input-/Response-Gate; lokale UI, Opt-in, kein Public-Feature |
| `ai-coach-replay-review-policy` | getrennte Runner-/Korp-/Public-Replay-Grenzen, Consent und Export-/Delete-Abgleich |

## Gate-Ergebnis

`ready_for_implementation: false`

Diese Spezifikation ist ein Boundary-Artefakt. Sie macht einen späteren Implementierungsschnitt planbar, ersetzt aber keine Privacy-, Abuse-, Redaction-, UI-, Server-, LLM- oder Public-Produktfreigabe.
