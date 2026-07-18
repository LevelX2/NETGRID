# PublicEvent- und Payload-Architektur

Status: Current State nach Engine Architecture Refresh E10  
Stand: 18.07.2026

## Ergebnis

NETGRID unterscheidet jetzt ausdrücklich zwischen internen
Ausführungsdiscriminatoren und dem öffentlichen Ereignisvertrag:

1. `LegalAction.payload` darf einen aktuell benötigten
   Ability-Discriminator tragen, wenn der Runtime-Dispatch ihn benötigt.
2. `buildPublicAbilitySchemaContext` leitet daraus die gemeinsamen Felder
   `abilityId`, `abilityFamily`, `effectKind`, `amounts`, `targets` und
   `visibility` ab.
3. `buildEventWithHost` entfernt die internen Discriminator-Schlüssel vor der
   Veröffentlichung.
4. Chronicle, Replay-Projektion, Server, Webclient und KI lesen den gemeinsamen
   `PublicEventPayload`-Vertrag.

Die private Replay-Aktion bleibt unverändert im `privatePayload`. Sie wird beim
Replay strukturell validiert und darf deshalb nicht mit dem side-sicheren
öffentlichen Payload verwechselt werden.

## Verträge

Die Shared-Schicht definiert die gemeinsamen Typen:

- `LegalActionPayload`: primitiver Aktionspayload plus aktuelle interne
  Ability-Discriminatoren und normalisierte Ability-Metadaten.
- `PublicEventPayload`: erweiterbarer öffentlicher Payload mit typisierten
  gemeinsamen Feldern.
- `PublicAbilityFamily` und `PublicAbilityVisibility`: gemeinsame Semantik für
  Engine, KI und UI.
- `ResolvedGameEffect`: typisierter, side-sicherer Effektvertrag für Chronicle,
  Replay und automatische Effekte.

`PublicEventPayload` bleibt für fachlich spezifische Eventfelder erweiterbar.
Neue querschnittliche Semantik darf aber nicht als paralleler, anders benannter
Vertrag ergänzt werden. Für Ability-Identität, Mengen, Ziele, Sichtbarkeit und
aufgelöste Effekte sind die gemeinsamen Felder verbindlich.

## Aktuelle Discriminatoren

`ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS` ist keine historische
Kompatibilitätsliste. Sie enthält nur Schlüssel, die aktuelle
`LegalAction`-Producer erzeugen und deren Runtime-Pfade noch auf diesen
Discriminator angewiesen sind. Neue generische Mechaniken sollen bevorzugt
`abilityId` verwenden.

Im Zuge von E10 wurden entfernt:

- `v1919AssetAbility`: kein aktueller Producer.
- `v1919UpgradeAbility`: kein aktueller Producer.
- `v181RunnerProgramAbility`: seine aktuellen Run-End-Pfade verwenden direkt
  `abilityId`.
- `v1922CorpAgendaAbility`: die aktuelle Install-/Rez-Sequenz verwendet direkt
  `abilityId`.
- `questForCattekinOutcome`: nur noch ein Test-/UI-Fallback ohne aktuellen
  Producer; `randomEffectOutcome` ist der aktuelle Vertrag.

Die für Action-IDs relevante Teilmenge heißt
`ACTION_ID_ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS`. Ihre Reihenfolge bleibt
deterministisch, enthält aber ebenfalls nur aktuelle Producer.

## ResolvedGameEffect

Die Start-of-Turn-Resolver hatten sieben Effektobjekte über
`as ResolvedGameEffect` am Typvertrag vorbeigeführt. Die tatsächlich
publizierten Felder für Zufall, Schaden, Tags, Bad Publicity und eingeschränkte
Aktionen sind nun Teil des Shared-Vertrags; die sieben Casts wurden entfernt.

Der Engine-Strukturguard verbietet neue Type Assertions auf
`ResolvedGameEffect`. Ein Effekt muss damit beim Producer vollständig gegen den
gemeinsamen Vertrag typgeprüft werden.

## Sichtbarkeit und Determinismus

- Nur der normalisierte öffentliche Payload wird in PlayerViews, Chronicle,
  PublicEvents, Serverprojektionen und KI-Inputs übernommen.
- Hidden-Info-Felder werden weiterhin durch die bestehenden positiven
  Allowlist-, Redaction- und Event-Visibility-Pfade begrenzt.
- `stateHashAfter`, Eventreihenfolge, `RandomCounter`, `RandomDrawRecords` und
  private Replay-Aktionen werden durch die Normalisierung nicht verändert.
- Interne Discriminator-Schlüssel bleiben im privaten Replay-Input erhalten,
  damit die aktuelle Aktion deterministisch erneut angewendet werden kann.

## Wartungsregeln

1. Einen neuen Ability-Discriminator nur ergänzen, wenn aktueller
   Runtime-Dispatch nicht mit `abilityId` auskommt.
2. Jeden Discriminator gleichzeitig in Producer, Registry und gegebenenfalls
   Action-ID-Teilmengen prüfen.
3. PublicEvent-Consumer verwenden `abilityId` und niemals einen versionierten
   Discriminator.
4. Neue gemeinsame Effektfelder werden in `ResolvedGameEffect` typisiert; ein
   Cast ist kein zulässiger Migrationsweg.
5. Event-spezifische Felder dürfen den allgemeinen Payload erweitern, aber
   keine versteckten Karteninstanzdaten oder private Choices veröffentlichen.
6. Entfernte Version-0-Felder erhalten ohne aktuellen Consumer keinen
   Kompatibilitätsalias.

## Verifikation

E10 wird mindestens über folgende Nachweise abgesichert:

- Shared-, Engine-, KI- und Web-Typecheck.
- vollständige Engine-Suite einschließlich Hidden Info, Replay, StateHash und
  deterministischem Zufall.
- Chronicle-, Action-Cue- und AI-Input-Tests.
- Event-Builder-Test: `abilityId` ist öffentlich, der interne Discriminator
  nicht; die private Replay-Aktion bleibt vollständig.
- Engine-Strukturguard und Selftest ohne `ResolvedGameEffect`-Assertion und
  ohne unregistrierte versionierte Ability-Payloadfelder.
