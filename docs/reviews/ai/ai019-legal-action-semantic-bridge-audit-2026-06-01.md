# AI019 - LegalAction Semantic Bridge Audit

Datum: 2026-06-01
Aktiver Agent: `architecture-review-agent`
Scope: reiner Audit, keine Planner-, Runtime-, Engine- oder DTO-Änderung

## Kurzfazit

Der heutige `LegalAction`-Vertrag ist als Legalitäts- und
Revalidierungsoberfläche stabil, aber noch keine verlässliche semantische
Brücke für die neue KI-Semantik. Für viele kartengebundene Actions kann die KI
den Quellkartenbezug über `action.source -> PlayerView -> definitionId ->
compiled AI hints` herstellen. Diese Verbindung reicht für grobe Rollen,
Legacy-Planrollen und einige Ontologie-Consumer.

Für eine zukünftige `ActionSemanticCandidate`-Schicht fehlt aber eine
normalisierte, side-safe Projektion von Ability, Intent und Target. Die
kritische Lücke liegt nicht in der Engine-Legalität, sondern zwischen
`LegalAction`-Erzeugung, AI-DTO-Sanitizing und Planner-Verbrauch: mehrere
zielentscheidende Payload-Felder existieren in Engine-LegalActions, werden aber
im AI-Input nicht weitergereicht; Ability-Identität ist je nach Action-Familie
uneinheitlich.

## Findings

### F1 - Target-Disambiguatoren gehen im AI-DTO verloren

`packages/engine/src/game/turn/action-builders.ts` nimmt viele
zielentscheidende Payload-Felder in die `actionId` auf, darunter
`selectedCardId`, `selectedSubtype`, `breakerId`, `iceId`, `subroutineIndex`,
`subroutineId`, `subroutineIndexes`, `variableRez*`,
`accessTrashTotalCost`, `sourceCardIds`, `passedIceId` und weitere
spezialisierte Felder. Die AI-DTO-Allowlist in
`packages/ai/src/input-dto.ts` lässt dagegen nur einen engen Teil durch:
unter anderem `serverId`, `placement`, `abilityFamily`, `abilityId`,
`effectKind`, `sourceDefinitionId`, `cardDefinitionId`,
`targetCardDefinitionId`, `targetCardId`, einige Kosten-/Trace-/Counter-Felder
und Legacy-Ability-Felder.

Konkrete Folgen:

- Black-Widow-Installaktionen führen `selectedCardId` als gewähltes ICE im
  Engine-Payload, aber dieses Feld fehlt im AI-DTO.
- Morphing-Tool-Install- und Umkonfigurationsaktionen führen
  `selectedSubtype`, aber dieses Feld fehlt im AI-DTO.
- Breaker-Actions führen `breakerId`, `iceId`, `subroutineIndex`,
  `subroutineId` und teils `targetIceDefinitionId`, aber die AI-DTO-Schicht
  behält davon nur indirekte Teile wie `abilityRef`, `targetRequirements` und
  allgemeine Kosten.
- Run-Followups führen `sourceCardIds`, `passedIceId` und `paymentAmount`,
  während die DTO-Allowlist nur Teile wie `sourceDefinitionId`, `serverId` oder
  `payOrEndRunSubroutinePayment` durchlässt.

Damit kann ein Planner aus dem heutigen `AiDecisionInput.legalActions` nicht
zuverlässig zwischen mehreren Zielvarianten derselben semantischen Aktion
unterscheiden. Für `targetProfiles` ist das der zentrale Blocker.

### F2 - Ability-Identität ist nicht einheitlich genug

Breaker-Actions setzen `abilityRef` mit `sourceCardInstanceId` und
`abilityId`; das ist die beste vorhandene Form. Generische
CardImplementation-Actions nutzen dagegen `activated_card_ability` mit
Payload-Feldern wie `cardImplementationAbility`,
`cardImplementationAbilityIndex` und `cardImplementationAbilityTiming`. Eine
normierte `abilityRef` wird dort nicht gesetzt. Zusätzlich gibt es ältere oder
kartenspezifische `trigger_ability`-Pfade mit Legacy-Payload-Keys.

`stableLegalActionPayload` ergänzt zwar bei passenden Payloads
`abilityFamily`, `abilityId` und `effectKind` aus dem öffentlichen
Ability-Schema, aber diese Felder sind nicht flächendeckend die gleiche
Identität wie `abilityRef`. Für eine robuste Bridge müsste die KI nicht raten,
ob `abilityRef`, `payload.abilityId`, `cardImplementationAbilityIndex` oder ein
Legacy-Key gerade die maßgebliche Fähigkeit beschreibt.

### F3 - `action.source` ist nützlich, aber nicht semantisch vollständig

Die Runner- und Corp-Planer lösen Rollen im Kern über
`rolesForAction(input, action)` auf: `basic_action` und `game_rule` liefern
keine Rollen; sonst wird `action.source` im sichtbaren PlayerView gesucht und
über `rolesForCardId` gegen `CARD_ROLES_BY_CARD` und compiled AI-Hints
aufgelöst. Dieser Pfad ist side-safe und funktioniert für sichtbare oder
eigene Quellkarten. Er ersetzt aber keine semantische Action-Projektion.

Grenzen:

- `start_run`, `continue_run`, `jack_out`, `access_card`, `decline_rez`,
  `decline_trash`, `mandatory_draw`, `end_turn` und mehrere Systemaktionen
  sind meist `game_rule` oder `basic_action` und bekommen keine Kartenrollen.
- Access-Actions verwenden teils das accessed card id als `source`, obwohl das
  fachlich eher das Ziel als die auslösende Karte ist.
- Hidden-Resource-Helfer können im Engine-Payload eigene
  `hiddenResourceSourceCardId`-Felder führen, die AI-DTO-Schicht verliert aber
  den spezifischen Helferbezug.

### F4 - `targetRequirements` beschreiben Form, nicht Kandidatenwert

`targetRequirements` wird vom AI-DTO side-safe erhalten und enthält `id`,
`kind`, `zoneScope`, `side`, `visibility`, `allowedServers`, `sourceIceRef`
und `allowedSides`. Das ist gut für Shape und Safety. Es ist aber keine
vollständige Liste der konkreten Zielkandidaten. Viele Actions kodieren den
gewählten Zielwert im Payload oder in der `actionId`; andere öffnen erst später
eine `pendingChoice`. Für Zielbewertung reicht `targetRequirements` deshalb nur
als Schema, nicht als `TargetProfile`-Candidate.

### F5 - Basic-/System-Actions brauchen explizite Semantik statt Kartenrolle

Basic- und Systemaktionen sind legitim kartenlos: `mandatory_draw`,
`draw_card`, `gain_credit`, `remove_tag`, `purge_virus_counters`,
`purge_runner_virus_counters`, `forgo_action`, `end_turn`, `decline_*`,
`access_card`, einfache `continue_run`- und `jack_out`-Actions. Heute werden
sie vom Planner über spezielle Heuristiken und Action-Type-Checks behandelt.
Für die neue Semantik sollten sie ein kleines eigenes Intent-Vokabular
bekommen, statt künstlich Kartenrollen zu imitieren.

## Geprüfter Pfad

### Engine LegalAction

Die gemeinsam geteilte Form liegt in `packages/shared/src/index.ts`.
`LegalAction` enthält:

- `actionId`, `side`, `type`, `label`
- `source: CardInstanceId | "basic_action" | "game_rule"`
- `timingPoint`
- `costs`
- `targetRequirements`
- optionale `choiceRequirements`, `abilityRef`, `effectRef`,
  `resolvedEffects`
- `visibility`
- `expiresAtStateVersion`
- optionales primitives `payload`

`PlayerAction` übermittelt anschließend nur `matchId`, `side`, `actionId`,
`clientKnownStateVersion` sowie optionale `selectedTargets` und
`selectedChoices`.

### LegalAction-Erzeugung

`packages/engine/src/game/turn/action-builders.ts` ist der zentrale Builder.
`buildLegalAction` setzt Visibility, State-Version, Kosten, Target-/Choice-
Metadaten, optionale Ability-/Effect-Referenzen und ein stabiles Payload. Die
Action-ID wird über Type, Side, Source und viele Payload-Disambiguatoren
gebildet.

Die eigentliche Generierung läuft über `packages/engine/src/game/legal-actions.ts`:

- `pendingChoice` erzeugt primär `resolve_choice`.
- `corp_draw.mandatory_draw` erzeugt `mandatory_draw`.
- `corp_action.main` und `runner_action.main` delegieren an die Main-Action-
  Builder.
- Run-Fenster erzeugen Rez-, Encounter-, Movement-, Access- und Paid-Window-
  Actions.
- Access-Fenster erzeugen Access-, Steal-, Trash- und Decline-Actions.

### Revalidierung und Ausführung

`packages/engine/src/game/apply-action.ts` ist der maßgebliche Gatekeeper. Vor
Mutation werden `matchId`, `clientKnownStateVersion`, aktuelle
`getLegalActions(state, side)` und `actionId` geprüft; `resolve_choice` wird
zusätzlich gegen die offene Choice validiert. Danach mutiert nur
`performAction`, anschließend folgen Win-Checks, State-Version, State-
Validation, Event-Building und StateHash.

`packages/engine/src/game/apply/perform-action.ts` dispatcht auf Engine-
Hosts. Turn-/Basic-Actions werden vorab von `handleTurnBasicExecution`
abgefangen. Kartengebundene und Fensteraktionen gehen an CardImplementation,
Economy, Play, Install, Board, Corp-Score, Run, Rez, Access, Choice und
TriggerAbility-Hosts.

### AI-Input und Planner-Verbrauch

`buildAiDecisionInput` in `packages/ai/src/index.ts` ruft
`getPlayerView(state, side)`, `getLegalActions(state, side)` und danach
`buildAiDecisionInputDto`. Das DTO sanitisiert PlayerView, PublicEvents,
LegalActions und optional die DeckDoctrine.

`packages/ai/src/input-dto.ts` behält LegalAction-Kerne, Kosten,
TargetRequirements, ChoiceRequirements, AbilityRef und eine allowlistbasierte
Payload-Kopie. Das ist hidden-info-sicher, aber nicht semantisch vollständig.

Die aktiven Planpfade verwenden nur Action-Subsets:

- Runner-Plan: `start_run`, `jack_out`, `continue_run`, `install_card`,
  `play_event`, `trigger_ability`, `activated_card_ability`, `gain_credit`,
  `draw_card`, `trash_accessed_card`.
- Corp-Plan: `score_agenda`, `advance_card`, `install_card`,
  `play_operation`, `gain_credit`, `draw_card`, `trigger_ability`,
  `activated_card_ability`, `end_turn`.

Beide Seiten greifen für Rollen auf `action.source` plus sichtbare
Kartendefinition zurück. Corp-Tag/Punish-Consumer nutzen zusätzlich
`classifyTagPunishLegalActionFromOntology`, bekommen aber ebenfalls nur die
aus Source oder Payload ableitbare Semantik.

## Action-Type-Katalog

| ActionType                    | Hauptquelle                        | Heute semantisch verwertbar                                       | Lücke für Bridge                                                         |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `mandatory_draw`              | `game_rule`                        | Side, Timing, Draw-Intent                                         | Basic-Intent explizit modellieren                                        |
| `gain_credit`                 | `basic_action` oder Karte          | Kostenloser Basic-Credit oder kartengebundene Economy über Source | Ein Intent muss Basic- und Card-Economy trennen                          |
| `draw_card`                   | `basic_action` oder Spezialpayload | Draw-Intent, Kosten, City-Surveillance-Projektionen               | Quelle externer Steuern/Modifier nicht vollständig normalisiert          |
| `activated_card_ability`      | Karte                              | Source-Karte, Kosten, Timing, teils `abilityId`/`effectKind`      | keine einheitliche `abilityRef`, Target-Payload teils nicht im DTO       |
| `install_card`                | Hand-/Zone-Karte                   | Source-Karte, Kosten, Server/Placement teilweise                  | `selectedCardId`, `selectedSubtype`, Install-Zielvarianten fehlen im DTO |
| `play_event`                  | Handkarte Runner                   | Source-Karte, Kosten, teils Server/Run-Payload                    | Ability/Target-Intent nur payload- oder kartenspezifisch                 |
| `play_operation`              | HQ-Karte Corp                      | Source-Karte, Kosten, Operation-Rollen                            | Tag-/Trace-/Damage-Intent muss aus Hints/Effects abgeleitet werden       |
| `advance_card`                | installierte Karte                 | Source-Karte, Kosten                                              | Scoring-Intent nur über Board-Kontext und Kartentyp                      |
| `score_agenda`                | installierte Agenda                | Source-Karte, Punkte-/Agenda-Rollen                               | Fast-Advance-/Payoff-Kontext nicht auf Action normiert                   |
| `start_run`                   | meist `basic_action`               | `serverId`, Kosten, Run-Start-Timing                              | Zielserver ja, strategischer Run-Intent nur heuristisch                  |
| `jack_out`                    | `game_rule`                        | Timing, Kosten, teils SourceDefinition für Tax                    | Basic-Decision-Intent fehlt                                              |
| `rez_ice`                     | ICE oder Root-Karte                | Source-Karte, Kosten, `rootRez`, Server teils                     | Rez-Modifikatoren und Variable-Rez-Details nicht vollständig im DTO      |
| `decline_rez`                 | `game_rule`                        | Pass-Intent, Timing, teils Server                                 | No-op/Pass-Semantik explizit machen                                      |
| `pump_breaker`                | Icebreaker-Karte                   | Source-Karte, `abilityRef`, Kosten                                | Ziel-ICE aus DTO nur indirekt über Run-Kontext                           |
| `break_subroutine`            | Icebreaker-Karte                   | Source-Karte, `abilityRef`, Kosten                                | Subroutine- und ICE-Identität gehen im DTO teilweise verloren            |
| `continue_run`                | `game_rule` oder Spezialsource     | Run-Fortsetzung, teils ETR-/Payment-Payload                       | mehrere fachlich verschiedene Intents unter einem Type                   |
| `access_card`                 | `game_rule`                        | Access-Fortsetzung                                                | accessed target nicht als Candidate auf LegalAction                      |
| `steal_agenda`                | accessed Agenda                    | Source/Target-Agenda, Kosten                                      | Source ist fachlich Ziel; Targetprofil muss das wissen                   |
| `trash_accessed_card`         | accessed Karte                     | Source/Target-Karte, Kosten                                       | Helper-Quelle und Trash-Modifikatoren nicht vollständig im DTO           |
| `trash_resource`              | meist `basic_action`               | Target über Payload/Redaction, Kosten                             | sichtbare vs. redaktierte Ziele getrennt modellieren                     |
| `decline_trash`               | `game_rule`                        | Pass-Intent                                                       | Relevanz des abgelehnten Ziels aus Access-Kontext nötig                  |
| `remove_tag`                  | `basic_action` oder Karte          | Kosten, Tag-Removal-Intent                                        | Basic-Tag-Clear vs. Kartenfähigkeit trennen                              |
| `purge_virus_counters`        | `basic_action`                     | Kosten und Counter-Intent                                         | Basic-Intent explizit                                                    |
| `purge_runner_virus_counters` | `game_rule`                        | Future-action-debt Payload                                        | Future-Debt-Intent explizit                                              |
| `forgo_action`                | `game_rule`                        | Action-Debt-Abtrag                                                | Basic/System-Intent explizit                                             |
| `move_to_set_aside`           | System/Karte                       | Board-State-Move                                                  | Spezialzone-Intent nur payload-/host-spezifisch                          |
| `move_to_removed_from_game`   | System/Karte                       | Board-State-Move                                                  | Spezialzone-Intent nur payload-/host-spezifisch                          |
| `return_from_set_aside`       | System/Karte                       | Board-State-Move                                                  | Spezialzone-Intent nur payload-/host-spezifisch                          |
| `change_card_control`         | System/Karte                       | Board-Control-Wechsel                                             | Ziel-/Quellkarte normieren                                               |
| `resolve_choice`              | `game_rule`                        | ChoiceId, Min/Max, optionale ChoiceRequirements                   | konkrete Optionen liegen im PlayerView, nicht in der Action              |
| `trigger_ability`             | Karte oder `game_rule`             | Source, Legacy-Ability-Payload                                    | Legacy-Keys statt einheitlicher Ability-Identität                        |
| `end_turn`                    | `game_rule`                        | Turn-End-Intent                                                   | Basic/System-Intent explizit                                             |

## Quellen-, Ability- und Target-Daten

### Source-Card-Daten

Heute gut ableitbar:

- Wenn `action.source` eine CardInstanceId ist und die Karte in der jeweiligen
  PlayerView sichtbar ist, kann die KI die `definitionId` finden.
- Eigene Handkarten sind für die jeweilige KI sichtbar, also funktionieren
  `install_card`, `play_event`, `play_operation` und viele
  CardImplementation-Actions.
- Installierte, gerezzte oder sonst sichtbare Boardkarten funktionieren über
  denselben Pfad.
- Compiled Hints werden über `createAiHintsByCard` geladen; Rollen, Planrollen,
  Effekte, `remoteRole`, `breakerProfile`, `targetProfiles`, `lineSupport` und
  `strategicRole` sind über `definitionId` erreichbar. Taktiksignale und
  abgeleitete Strategy Anchors liegen zusätzlich im AI-Hint-Inspector-Index und
  werden heute primär von DeckDoctrine-Strategy genutzt.

Nicht ausreichend:

- `basic_action` und `game_rule` haben keine Quellkarte und brauchen eigene
  Semantik.
- Bei Access-Actions ist `source` häufig die accessed Karte und damit eher
  Ziel als Ursache.
- Einige Hilfsquellen sind nur im Payload kodiert und nicht im DTO.

### Ability-Daten

Heute gut:

- Breaker-Pump und Breaker-Break setzen `abilityRef`.
- `stableLegalActionPayload` kann `abilityFamily`, `abilityId` und
  `effectKind` aus dem öffentlichen Payload-Schema ergänzen.
- CardImplementation-Actions tragen Index, Timing und Kosten im Payload.

Nicht ausreichend:

- CardImplementation-Actions haben keine einheitliche `abilityRef`.
- Legacy-`trigger_ability`-Pfade nutzen unterschiedliche Ability-Keys.
- `abilityId` im Payload, `abilityRef.abilityId` und
  `cardImplementationAbilityIndex` sind aktuell keine einheitliche
  Identitätsachse.

### Target-Daten

Heute gut:

- Serverziele sind häufig als `serverId` oder `targetServerId` im AI-DTO.
- `targetRequirements` bleiben erhalten und sind gut für Safety und Shape.
- Manche Actions führen `targetCardId` oder `targetCardDefinitionId`, die im
  DTO erlaubt sind.
- Choices liefern `choiceRequirements` und PlayerView-`pendingChoice.options`.

Nicht ausreichend:

- Black Widows gewähltes ICE (`selectedCardId`) fehlt im AI-DTO.
- Morphing Tools gewählter Subtype (`selectedSubtype`) fehlt im AI-DTO.
- Breaker-Ziel-ICE und Subroutine-Auswahl sind im DTO nicht vollständig
  erhalten.
- Access-/Trash-Helferquellen, Fort-Pass-Quellen und Rez-Modifikatorquellen
  sind nur teilweise erhalten.
- Choice-Optionen sind kein Teil der `LegalAction`, sondern ein separates
  PlayerView-Feld.

## Beispiele

### Black Widow

`packages/engine/src/card-implementations/proteus/runner/programs/black-widow.ts`
definiert `installTargetBinding.kind = "choose_installed_ice_on_install"` und
speichert das Ziel als `selectedCardId`. Der Runner-Main-Action-Builder baut
dafür `install_card` mit Source = Handkarte und Payload
`{ cardId, selectedCardId }`. Engine-seitig ist das eindeutig; AI-seitig fehlt
`selectedCardId` im LegalAction-Payload. Die KI kann erkennen, dass Black Widow
installiert wird, aber nicht zuverlässig, welches ICE diese konkrete
LegalAction bindet.

### Morphing Tool

Morphing Tool nutzt `selectedSubtype` beim Install und beim späteren
Subtype-Wechsel. Engine-Action-ID und Payload unterscheiden die Varianten.
Das AI-DTO lässt `selectedSubtype` nicht durch. Die KI kann die Karte und
allgemeine Rollen erkennen, aber nicht die konkrete konfigurierte Coverage der
einzelnen Action.

### Airport Locker

Airport Locker ist eine `activated_card_ability` während eines Runs mit
Stack-Search-Install-Effekt und Hidden-Info-Barriere. Source, Kosten und Timing
sind gut ableitbar; compiled Hints und Inspector-Signale können an die Karte
gehängt werden. Die konkrete Programmwahl entsteht aber erst in einem späteren
Hidden-Zone-/Choice-Pfad. Eine ActionSemanticCandidate darf hier nur den
side-safe Such-/Install-Intent modellieren, nicht private Stackinhalte.

### On-Call Solo Team

On-Call Solo Team ist eine scored-agenda-nahe Corp-Ability mit
`runner_is_tagged`-Bedingung und Meat-Damage-Effekt. Die Quellkarte ist über
`action.source` auflösbar, und der Inspector weist `damage.payoff`,
`tag.payoff` und `score.agenda_action` als Signale aus. Die heutige
LegalAction selbst trägt aber keine einheitliche semantische Damage-/Tag-Payoff-
Ability-Projektion; die Consumer müssen aus Source-Hints und Kontext
rekonstruieren.

### BBS Whispering Campaign

BBS nutzt eine CardImplementation-Economy-Ability mit Hosted-Credit-Pool.
Die Source-Karte ist im Board sichtbar, `remoteRole.kind = "asset_economy"`
liegt in compiled Hints, und aktuelle Counter/Pool-Daten kommen aus dem
PlayerView-Boardstate. Die Action-Semantik ist daher rekonstruierbar, aber aus
mehreren Quellen zusammengesetzt: LegalAction für Wahl und Kosten, PlayerView
für Poolzustand, Hints für strategische Rolle.

### Access-, Trash- und Steal-Actions

`steal_agenda` und `trash_accessed_card` verwenden die accessed Karte häufig als
Source. Für eine semantische Bridge muss das als `target` modelliert werden,
nicht als kausale Quellfähigkeit. Relevant ist außerdem der Access-Kontext:
Server, aktueller Breach, sichtbare Trash-Kosten, bezahlbare Kosten nach Break,
Decline-Historie und etwaige Free-Trash-Helfer. Davon ist im LegalAction-Payload
nur ein Teil normalisiert.

## Basic-Action-Semantik

Für Basic- und Systemactions reicht eine kleine, explizite Semantikschicht:

| Basic/System-Familie | Betroffene ActionTypes                                | Vorgeschlagener Intent                                          |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Turn-Flow            | `mandatory_draw`, `end_turn`, `forgo_action`          | `turn_flow` mit `draw_mandatory`, `end_turn`, `pay_action_debt` |
| Economy              | `gain_credit`, cardlose Teile von `draw_card`         | `basic_economy` oder `basic_draw`                               |
| Tag-Clear            | `remove_tag` mit `basic_action`                       | `basic_tag_clear`                                               |
| Purge                | `purge_virus_counters`, `purge_runner_virus_counters` | `purge_counters` mit Debt-/Click-Modell                         |
| Run-Decision         | `start_run`, `continue_run`, `jack_out`               | `run_start`, `run_continue`, `run_exit`                         |
| Access-Decision      | `access_card`, `decline_trash`, `decline_rez`         | `access_continue`, `decline_optional_cost`, `pass_window`       |
| Choice               | `resolve_choice`                                      | `choice_resolution` plus PlayerView-Optionen                    |

Diese Semantik sollte nicht über AI-Hints laufen. Sie ist engine-/rules-nah,
stabil und unabhängig von Kartendefinitionen.

## ActionSemanticCandidate-Skizze

Ein sinnvoller erster Candidate wäre kein neuer Legalitätsvertrag, sondern eine
read-only Projektion aus bereits legalen Actions:

```ts
type ActionSemanticCandidate = {
  actionId: string;
  side: Side;
  actionType: ActionType;
  timingPoint: TimingPointId;
  source: {
    kind: "card" | "basic_action" | "game_rule";
    cardInstanceId?: string;
    cardDefinitionId?: string;
    visibleToActor: boolean;
  };
  ability?: {
    abilityRefId?: string;
    abilityFamily?: string;
    abilityId?: string;
    effectKind?: string;
    implementationIndex?: number;
    implementationTiming?: string;
  };
  intent: {
    family: string;
    detail?: string;
  };
  targets: Array<{
    id: string;
    kind: "card" | "server" | "subroutine" | "side" | "choice";
    cardInstanceId?: string;
    cardDefinitionId?: string;
    serverId?: string;
    subroutineId?: string;
    visibility: "public" | "known_to_actor" | "hidden_or_unresolved";
  }>;
  costs: Cost[];
  hintSemantics?: {
    roles: string[];
    planRoles: string[];
    functionSignals: string[];
    strategyAnchors: string[];
    strategicRoles: string[];
    targetProfiles: unknown[];
  };
  warnings: string[];
};
```

### Heute direkt füllbar

- `actionId`, `side`, `actionType`, `timingPoint`, `costs`
- Source-Kind aus `action.source`
- Source-Card-Definition, wenn im PlayerView sichtbar
- Rollen/Planrollen/compiled Hint-Semantik für sichtbare Source-Karten
- `abilityRef` für Breaker-Actions
- `payload.abilityFamily`, `payload.abilityId`, `payload.effectKind`, wo im DTO
  vorhanden
- Serverziele aus `serverId`/`targetServerId`
- Choice-Shape aus `choiceRequirements` und PlayerView-`pendingChoice`
- Basic-/System-Intent aus ActionType und TimingPoint

### Nur vor DTO-Sanitizing oder mit Allowlist-Erweiterung füllbar

- `selectedCardId`, `selectedSubtype`
- `breakerId`, `iceId`, `subroutineIndex`, `subroutineId`,
  `subroutineIndexes`
- `targetIceDefinitionId`
- `hiddenResourceSourceCardId`
- `cardImplementationExposeTargetId`,
  `cardImplementationTopTrashTargetId`
- `sourceCardIds`, `passedIceId`, `paymentAmount`
- detaillierte Rez-, Install-, AccessTrash- und Steal-Kostenmodifikatorquellen

### Nicht aus LegalAction allein füllbar

- private Hidden-Zone-Kandidaten
- Choice-Optionen ohne PlayerView-`pendingChoice`
- Board- und Run-Bewertungen wie aktueller BBS-Pool, bekannte ICE-Kosten,
  Remote-Relevanz oder Decline-Historie
- strategischer Wert eines Targets ohne Hints, PlayerView und Plan-Kontext

## Empfehlung für den nächsten technischen Schnitt

Die Brücke sollte zwischen LegalAction-Erzeugung und Planner-Bewertung sitzen,
nicht als nachträglicher String-/Label-Parser im Planner. Der kleinste robuste
Schnitt wäre:

1. Eine read-only `buildActionSemanticCandidates(input)`-Funktion im AI-Paket,
   die nur `AiDecisionInput` und side-safe PlayerView-Daten nutzt.
2. Eine explizite Basic-/System-Intent-Tabelle für `basic_action` und
   `game_rule`.
3. Eine kleine, geprüfte Erweiterung der LegalAction-AI-Payload-Allowlist für
   bereits heute öffentliche oder actor-known Ziel-Disambiguatoren.
4. Eine spätere Engine-nahe Ergänzung von einheitlicher `abilityRef` oder
   `semanticRef` für CardImplementation-Actions.
5. Tests, die Hidden-Info-Grenzen absichern: keine Stackinhalte, keine
   verdeckten Corp-Root-Definitionen, keine fremden Handkarten, keine privaten
   Choice-Details.

Wichtig: Die Rules Engine bleibt alleinige Regelautorität. Der Candidate darf
keine Legalität erzeugen, nur bereits legale Actions annotieren.

## Blocker

Ein vollständiger, zielprofilfähiger `ActionSemanticCandidate` ist aus dem
heutigen `AiDecisionInput.legalActions` nicht sicher vollständig ableitbar. Der
Blocker ist die Kombination aus uneinheitlicher Ability-Identität und
DTO-Verlust zielentscheidender Payload-Felder. Ohne einen kleinen
normalisierten Projection-/Allowlist-Schnitt würde die KI wieder auf Labels,
Action-ID-Fragmente oder parallele Board-Heuristiken ausweichen.

## Nicht geändert

- Kein Engine-Code.
- Keine LegalAction-Form.
- Keine AI-DTO-Allowlist.
- Keine Planner-Scoring- oder Profiländerung.
- Keine Hint-, Inspector-, DeckDoctrine- oder Catalog-Daten.
- Keine Tests angepasst.

## Geprüfte Dateien

- `packages/shared/src/index.ts`
- `packages/engine/src/game/turn/action-builders.ts`
- `packages/engine/src/game/legal-actions.ts`
- `packages/engine/src/game/legal-action-hosts.ts`
- `packages/engine/src/game/apply-action.ts`
- `packages/engine/src/game/apply/perform-action.ts`
- `packages/engine/src/game/turn/runner-main-actions.ts`
- `packages/engine/src/game/turn/corp-main-actions.ts`
- `packages/engine/src/game/run/encounter-actions.ts`
- `packages/engine/src/game/run/run-movement.ts`
- `packages/engine/src/game/run/run-rez-window.ts`
- `packages/engine/src/game/access/access-actions.ts`
- `packages/engine/src/ability-engine/card-implementation-runtime.ts`
- `packages/engine/src/card-implementations/proteus/runner/programs/black-widow.ts`
- `packages/engine/src/card-implementations/proteus/runner/programs/morphing-tool.ts`
- `packages/engine/src/card-implementations/proteus/runner/resources/airport-locker.ts`
- `packages/engine/src/card-implementations/onr-v1/corp/agendas/on-call-solo-team.ts`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/bbs-whispering-campaign.ts`
- `packages/ai/src/input-dto.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/deck-doctrine-strategy.ts`
- `packages/ai/src/hint-ontology.ts`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer-payload.ts`
