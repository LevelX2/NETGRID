# Effect-Event-/Chronik-Visibility-Audit 2026-05-17

## Ergebnis

Der gemeinsame Event-/Chronik-/Cue-Vertrag ist grundsätzlich vorhanden:

- Engine erzeugt `PublicGameEvent` mit `visibilityClass`, `publicPayload`, `resolvedEffects` und Hidden-Info-Markern.
- Server übernimmt Engine-Events als `ServerEventRecord` und nutzt `redactPublicEventForSide` für Replay-Perspektiven.
- Web-Client formatiert dieselben Events über `formatChronicleEvent` für die Spielchronik und `deriveOpponentActionCues` für Gegner-Cues.

Der Audit-Fund lag in der Chronikschicht für automatische `resolvedEffects`: Bei `hidden_info_barrier` oder fremden `private_to_side`-Effekten wurden zwar Card-Felder am Ende entfernt, der zuvor gebaute Titel konnte aber bereits `cardTitle` oder `sourceTitle` enthalten. Das ist eine gemeinsame Lücke, weil automatische Kosten-, Trash-, Damage- und Modifier-Folgen zunehmend über `resolvedEffects` laufen.

## Umgesetzter gemeinsamer Fix

`apps/web/app/chronicle.ts` entscheidet die Sichtbarkeit automatischer Effekte jetzt side-bewusst:

- `public` bleibt öffentlich.
- `private_to_side` bleibt nur für die betroffene Seite als `side` sichtbar.
- alle anderen Fälle werden als `redacted` behandelt.

Redigierte automatische Effekte erhalten generische Titel, bevor Kartennamen oder Definition-IDs in Titel oder Kartenfelder gelangen können. Der Regressionstest in `apps/web/app/chronicle.test.ts` deckt `hidden_info_barrier` und fremde `private_to_side`-Trash-Effekte ab.

## Gemeinsame Lücken

- Eventprojektion ist stark payload-getrieben; viele Spezialkarten liefern eigene Kontextfelder statt eines kleinen normalisierten Event-Vokabulars für Quelle, Ziel, Kosten, Ergebnis und Zonenbewegung.
- Chronik und Cue nutzen dieselbe Formatter-Basis für Hauptevents, aber automatische `resolvedEffects` erscheinen nur in der Chronik. Wichtige automatische Effekte brauchen bei Bedarf ein bewusstes Cue-Gate statt zufälliger Übernahme.
- Redaction darf nicht erst beim Anhängen von Card-Feldern passieren. Titel, Beschreibung, Chips, Highlight und Related-Card-Ableitung müssen denselben Sichtbarkeitsentscheid verwenden.

## Hidden-Info-Textmuster

Verdeckte Kartenbewegungen werden ohne Kartenname, Definition-ID, Bildpfad oder unterscheidbare interne IDs beschrieben:

- `Eine verdeckte Karte wurde ins Archiv gelegt.`
- `Eine verdeckte Karte wurde in den Heap gelegt.`
- `Eine verdeckte Karte wurde abgelegt.`
- `Ein verdecktes Region Upgrade wurde ersetzt.`
- `Eine verdeckte Karte wurde installiert.`
- `Eine verdeckte Karte wurde ausgebaut.`
- `Eine Karte wurde verdeckt aus dem Stack in den Grip genommen.`
- `Der erfolgreiche Run wurde ohne Zugriff auf verdeckte Korp-Karten ersetzt.`

Öffentliche Reveals, Exposes, Accesses und Rezzes dürfen Kartennamen nennen, wenn die Engine sie ausdrücklich als public Payload liefert.

## Folgeempfehlung

Kein sofortiges Folgepaket nötig. Bei der nächsten größeren Event-Härtung sollte ein kleiner normalisierter `effectKind`/`zoneMovement`-Vertrag aus `public-payload-schema.ts` bis Chronik/Cue gezogen werden, damit neue Karten weniger Spezialformatter brauchen.
