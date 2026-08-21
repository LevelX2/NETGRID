# AI Controller Spec

Status: **Current State**
Stand: 2026-08-14

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

## Debug-Ausnahme des lokalen Betreibers

Die private Betreiber-Buganzeige ist kein normaler Controller- oder
Spielerkanal. Sie darf die vollständige Hand der jeweils aktiven KI und deren
vollständige Zugplanung zeigen, niemals jedoch die Hand des menschlichen
Spielers. Diese Ausnahme erweitert weder AI-Input noch PlayerViews,
PublicEvents, öffentliche Replays, normale Netzwerkpayloads oder Logs.
