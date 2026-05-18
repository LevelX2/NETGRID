# Card Unlock 1.2.3 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.2.3-Vertrag fuer kontrollierte Kartenfreigaben nach Mechanik-Coverage. Sie verhindert, dass Katalogdaten, lokale Dateien, Bilder oder Textimport eine Karte automatisch spielbar machen.

## Pipeline

1. Kandidaten aus lokalen CardDefinition-/Katalog-/Roadmap-Daten sammeln.
2. Jede Karte mit `requiredMechanics` versehen.
3. Mechanik-Coverage gegen aktuellen MechanicSupport pruefen.
4. Resolver/Ability-Verweis pruefen oder eng ergaenzen.
5. Statusziel festlegen: listed, engine_supported, human_playable, ai_supported.
6. Manifest schreiben.
7. Tests und Szenarien ergaenzen.
8. Runtime-Gate exakt fuer freigegebene Karten erweitern.
9. Deckvalidierung und Matchstart-Revalidierung pruefen.
10. KI-Hints nur fuer `ai_supported` Karten ergaenzen.
11. Final Review mit Freigaben und Rueckstellungen schreiben.

## Manifest-Vertrag

Konzeptionelles Sollschema:

```ts
type CardReleaseManifestEntry = {
  cardCode: string
  title: string
  side: "corp" | "runner"
  status: "listed" | "engine_supported" | "human_playable" | "ai_supported" | "deferred"
  deckLegal: boolean
  source: string
  requiredMechanics: string[]
  resolverRefs: string[]
  aiHintRef?: string
  tests: string[]
  scenarioRefs: string[]
  deferralReason?: string
}
```

Das konkrete JSON darf vorhandenen Manifestmustern folgen, muss aber dieselben Informationen enthalten.

## Freigaberegeln

### `engine_supported`

Eine Karte darf `engine_supported` werden, wenn:

- alle `requiredMechanics` abgedeckt sind,
- Resolver/Ability-Verweis existiert,
- Kosten, Ziele, Choices und Timingpunkte engine-seitig revalidiert werden,
- Unit- oder Integrationstest existiert,
- Replay/StateHash-Pfad klar ist.

### `human_playable`

Eine Karte darf `human_playable` werden, wenn zusaetzlich:

- Deckvalidierung sie erlaubt,
- Visibility-Vertrag gruen ist,
- Multiplayer/Server/Matchstart sie akzeptiert,
- Reconnect und Undo fuer relevante Pfade definiert sind,
- Batch-Szenario und Browser-Smoke gruen sind.

### `ai_supported`

Eine Karte darf `ai_supported` werden, wenn zusaetzlich:

- AI-Hints vorhanden sind,
- KI-SzenarioRefs vorhanden sind,
- KI-Smoke oder Soak keine illegalen Actions oder Hänger zeigt,
- DecisionDebug side-sicher ist,
- KI-Deckpool explizit aktualisiert wurde.

## Runtime-Gate

- Runtime-Gate ist allowlist-basiert.
- V1.2.3-Gate darf keine "alle Karten mit Mechanik X"-Freigabe verwenden.
- Alte V1.0.5K, V1.0.6K und V1.1.2K-Karten bleiben unveraendert.
- Zurueckgestellte Karten muessen im Katalog weiter nicht spielbar bleiben.

## Deckvalidierung

- Deckvalidierung nutzt `deck_legal`, nicht nur `listed`.
- Matchstart validiert serverseitig erneut.
- Unbekannte Karten und nicht human_playable Karten blockieren Matchstart.
- Decksnapshots speichern die Cardpool-/Release-Version.
- Gegnerische Decklisten und Deckhashes bleiben side-sicher.

## KI-Vertrag

- KI-Deckbau nutzt nur `ai_supported`.
- KI darf human_playable-only Karten als nicht verfuegbar behandeln.
- AI-Hints enthalten Rollen, Mechanikbedarf, Zielhinweise, Risiko- und Fallback-Daten.
- DecisionDebug nennt keine Hidden Cards, keine gegnerischen Decklisten und keine privaten Kandidaten.

## Visibility-Vertrag

- Neue sichtbare Karteneffekte duerfen nur erlaubte Kartendaten nennen.
- Verdeckte Installationen bleiben anonym.
- Access-, Reveal-, Replacement-, Special-Zone- und Control-Effekte folgen ihren jeweiligen Basisspezifikationen.
- DOM, Storage, WebSocket, Reconnect und PublicEvents duerfen keine Definition-ID verdeckter Karten leaken.

## No-Scope-Pruefung

Ein V1.2.3-Implementation Review muss bestaetigen:

- keine neue Mechanikfamilie,
- keine automatische Spielbarkeit durch Import/Katalog/Bild/Text,
- keine offiziellen Assets oder externen Laufzeitdaten,
- keine Public-Format-, Ranked-, Turnier- oder Matchmaking-Funktion,
- keine KI-Deckkarte ohne AI-Hints.
