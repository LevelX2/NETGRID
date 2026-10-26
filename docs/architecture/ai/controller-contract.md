# AI Controller Spec

Status: **Current State**
Stand: 2026-10-18

## Ziel

Controller sind Eingabequellen. Die Engine bleibt die einzige
Regelautorität. Human, AI und Replay dürfen nur eine `PlayerAction` aus einer
aktuellen `LegalAction` ableiten. `applyAction` validiert Seite, Action-ID,
`stateVersion`, Timing, Kosten, Ziele und Choices erneut.

Der AI-Controller verwendet ausschließlich den produktiven Plan-first-Weg.
Er wählt zuerst Planinstanz, Step und Route und bindet erst danach die
konkrete LegalAction. Eine Action besitzt außerhalb dieses Vertrags keine
eigene Handlungsautorität.

## Controller-Typen

Human-, AI- und Replay-Controller bleiben für die Engine gleichartige
Quellen von PlayerActions. Der Controller-Typ verändert keine Spielregel und
gewährt keinen zusätzlichen Zugriff auf den vollständigen `GameState`.

## AI-Input

Erlaubt sind insbesondere:

- `side`;
- side-sichere `playerView`;
- aktuelle `legalActions`;
- side-gefilterte öffentliche Event-Taildaten;
- Difficulty-, Seed-, Decision-, Action- und Profilidentität;
- die eigene, serverseitig gebundene DeckDoctrine und daraus erlaubte
  eigene Deckinformationen;
- actor-private Matchbindung ausschließlich für Engine-zertifizierte
  Commands.

Verboten sind insbesondere:

- vollständiger `GameState`;
- gegnerische Hand- oder Deckreihenfolge;
- für die Seite unbekannte Kartenidentitäten;
- private Events und Choices der Gegenseite;
- Session-, Token-, Storage- oder WebSocket-Interna als Strategieinput.

## AI-Decision

Eine direkte Entscheidung bindet genau eine aktuelle `actionId` und
gegebenenfalls `selectedChoices`. Eng zertifizierte Nahgleichstände dürfen
stattdessen einen Engine-Command für eine atomare, seed- und replaygebundene
Auswahl liefern. Reason, Evidence und `AiDecisionDebug.planFirstDecision`
erklären die Plan-, Step-, Routen- und Zugplanbindung, erzeugen aber keine
zweite Auswahlautorität.

Choice-Resolver dürfen nur die Payload einer bereits gewählten und exakt
gebundenen Action vervollständigen. Sie dürfen weder Action-ID noch Quelle,
Server, Ziel, Ressourcenstrategie, Executor oder Planpriorität neu wählen.

Bei einer kartenquellengebundenen Hidden-Zone-Choice projiziert die Engine die
kanonische Herkunft zusätzlich strukturiert als `sourceCardInstanceId` und
`sourceCardDefinitionId`. Die AI bindet diese Werte zusammen mit der bereits
gewählten Action-ID und StateVersion; den opaken `source`-String darf sie nicht
als Ersatzquelle parsen. So bleibt der auswählende Plan auch über die Choice
hinweg alleiniger Owner.

## Fail-closed und Coverage

Es gibt keinen beliebigen Fallback auf die erste stabile LegalAction. Jede
freiwillige Action benötigt eine produktive Planroute oder eine eindeutige
Disposition. Der enge Coverage-Restpfad darf nur vorher definierte sichere,
nebenwirkungsarme Engine-Fortsetzungen behandeln. Fehlende Planabdeckung,
mehrdeutige Bindung, veraltete StateVersion oder unvollständige Quotes bleiben
sichtbare Fehler und werden nicht durch plausibel wirkende Ersatzaktionen
kaschiert.

`fallbackUsed` und `timeoutUsed` bleiben Observability-Felder; sie sind keine
Erlaubnis für eine zweite Verhaltensheuristik.

## Server-Orchestrierung

Der Server darf AI-Actions automatisch ausführen, wenn die aktive Seite als
AI konfiguriert ist. Dabei gilt:

- AI-Actions laufen durch denselben `applyAction`-Pfad wie Human-Actions.
- Nach jeder Action werden Events, StateHash, Matchversion und Payloads
  aktualisiert.
- Der Loop stoppt bei Human-Entscheidung, Spielende, fehlender legaler
  Fortsetzung oder dem vorgesehenen Sicherheitslimit.
- Runtime-Neustart verwirft ein altes Zugcommitment und plant aus dem
  wiederhergestellten residenten Portfolio neu.
- Standardpayloads bleiben side-gefiltert.

### Idempotente Aktionsantworten

Nach erfolgreicher Sessionprüfung liefert eine bekannte Idempotenz-ID ihr
gespeichertes Annahme- oder Ablehnungsergebnis. Eine abgelehnte Quittung bleibt
abgelehnt und behält ihren Fehlercode; eine angenommene terminale Aktion bleibt
auch nach Spielende angenommen. Es wird keine zweite Transition ausgeführt.
Neue Actions werden weiterhin gegen Matchstatus, Spielerzeit und Enginezustand
geprüft. Fehlt einer gespeicherten Ablehnung ihr Pflichtfehlercode, scheitert
der Pfad mit `invalid_action_receipt` statt einer Erfolgsantwort.

### Kooperative Serverausführung

`chooseAiAction` und die einzelne Engineaktion laufen weiterhin synchron.
`runAiUntilNextHuman` führt höchstens 40 Schritte aus und gibt zwischen
abgeschlossenen Schritten mit einem Timerquantum von fünf Millisekunden an den
Ereignisloop ab. Dasselbe gilt für automatische Setupfortsetzungen. Die kurze
Schedulerpause gibt Socketarbeit Zeit zum Abschluss und ist unabhängig von
der Präsentation der KI-Aktionen.

Match-Lock und Update-Admission bleiben über den gesamten Batch gehalten;
Persistenz und Erfolgsantwort folgen nach dem bestehenden Commitvertrag.
Andere Matches und HTTP-Anfragen dürfen in den Zwischenräumen weiterlaufen.
Manuelle Matchlöschung nimmt die betroffenen Match-Locks in stabiler
Sortierreihenfolge und revalidiert ihre Storage-Vorschau darunter. Eine
inzwischen veraltete Vorschau scheitert sichtbar; eine Löschung kann einen
laufenden Batch nicht unterbrechen und später durch dessen Save rückgängig
gemacht werden.

### Lebensdauer des Prozessgedächtnisses

`releaseAiMatchRuntime(matchId)` gibt residente Portfolios, Portfolio-
Snapshots, Strategic Intent und Runner-Runpläne aller Seiten und Profile des
benannten Matches frei. Die Speicher halten ihre Matchzuständigkeit als
eigene Metadaten; die Freigabe interpretiert keine opaken Cachekeys.

Der Server gibt dieses Gedächtnis und vorbereitete KI-Debugentscheidungen
nach erfolgreicher terminaler Persistenz, nach Matchlöschung, nach akzeptiertem
Undo sowie beim Schließen seiner Runtime frei. Ein fehlgeschlagener Commit
löscht kein noch gültiges Liveportfolio. Andere aktive Matches einschließlich
ihrer Commitments bleiben unverändert. Persistierte Portfolios und benötigte
Trace-/Replay-Evidence werden dadurch nicht gelöscht.

Die Regressionen liegen in `action-idempotency.test.ts`,
`ai-batch-runtime.test.ts`, `ai-runtime-lifecycle.test.ts` und
`match-join-contract.test.ts` unter `apps/server/src/`.

## Debug-Ausnahme des lokalen Betreibers

Die private Betreiber-Buganzeige ist kein normaler Controller- oder
Spielerkanal. Sie darf die vollständige Hand der jeweils aktiven KI und deren
vollständige Zugplanung zeigen, niemals jedoch die Hand des menschlichen
Spielers. Diese Ausnahme erweitert weder AI-Input noch PlayerViews,
PublicEvents, öffentliche Replays, normale Netzwerkpayloads oder Logs.
