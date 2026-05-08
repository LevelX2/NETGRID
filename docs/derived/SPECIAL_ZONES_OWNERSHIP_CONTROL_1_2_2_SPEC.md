# Special Zones, Ownership und Control 1.2.2 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.2.2-Vertrag fuer Sonderzonen, Owner/Controller und Control-Wechsel. Sie ist die fachliche Grundlage fuer die Umsetzung, nicht fuer Kartenfreigaben.

## Begriffe

| Begriff | Bedeutung |
| --- | --- |
| Owner | Die urspruengliche Besitzerseite einer Karte. In V1.2.2 unveraenderlich. |
| Controller | Die Seite, die eine Karte aktuell kontrolliert. Kann in V1.2.2 test-only oder eng freigegeben wechseln. |
| ZoneRef | Kanonischer Ort einer CardInstance. Jede CardInstance hat genau eine ZoneRef. |
| Set Aside | Spezialzone fuer Karten, die temporaer aus normalen Spielzonen herausgenommen sind. |
| Removed from Game | Spezialzone fuer Karten, die aus dem Spiel entfernt sind und in V1.2.2 nicht normal zurueckkehren. |

## Datenmodell-Vertrag

Konzeptionelles Sollschema:

```ts
type SpecialZoneKind = "set_aside" | "removed_from_game"

type CardInstanceControl = {
  owner: "corp" | "runner"
  controller: "corp" | "runner"
}

type SpecialZoneRef = {
  kind: "special"
  zone: SpecialZoneKind
  visibility: "public" | "side_private" | "hidden" | "replay_only"
  owner?: "corp" | "runner"
}
```

Das konkrete TypeScript-Modell darf abweichen, wenn es dieselbe Semantik pruefbar erfuellt.

## ZoneRef-Invarianten

- Jede CardInstance existiert genau einmal.
- Jede CardInstance hat genau eine ZoneRef.
- Ein Move ist atomar: Entfernen aus alter Zone und Einfuegen in neue Zone sind eine Transition.
- Hosted Cards behalten eine kanonische Host-Referenz oder werden durch eine definierte Kaskade bewegt.
- Set Aside und Removed from Game sind keine Heap-/Archives-/R&D-/HQ-/Grip-/Stack-Ersatznamen.
- Spezialzonen muessen in kanonischer Serialisierung stabil sortiert werden.

## Owner/Controller-Regeln

- Owner wird beim Erzeugen der CardInstance gesetzt.
- Owner wird durch Control-Wechsel nicht veraendert.
- Controller bestimmt, welche Seite die Karte kontrolliert und welche Seite controllerbasierte Effekte ausloesen darf.
- Sichtbarkeit wird nicht automatisch durch Controller bestimmt; sie folgt dem Zone-/Effektvertrag.
- Control-Wechsel ohne sichtbaren Grund darf keine PublicInfo erzeugen, die Hidden Info leakt.

## Transitionen

### Move to Set Aside

Pflichten:

- Ursprungszone wird entfernt.
- Zielzone ist `set_aside`.
- Sichtbarkeitsklasse wird durch Quelle oder Harness definiert.
- EventLog enthaelt redigierten Ursprung, Ziel und Bewegungsgrund.
- Undo-Barriere haengt davon ab, ob neue Hidden Info sichtbar wurde.

### Move to Removed from Game

Pflichten:

- Ursprungszone wird entfernt.
- Zielzone ist `removed_from_game`.
- Karte bleibt im Replay nachvollziehbar.
- Rueckkehr in normale Zonen ist in V1.2.2 nicht als Runtime-Regel freigegeben.

### Control Change

Pflichten:

- CardInstance bleibt in derselben Zone oder bewegt sich nach explizitem Move-Vertrag.
- Owner bleibt unveraendert.
- Controller wechselt deterministisch.
- EventLog nennt alten und neuen Controller nur, soweit sichtbar.
- StateHash aendert sich bei Controller-Wechsel.

## EventLog-Vertrag

| Kategorie | Inhalt | Sichtbarkeit |
| --- | --- | --- |
| `special_zone_move` | CardRef, Ursprungszone, Zielzone, Grund | redigiert nach Zone |
| `card_removed_from_game` | CardRef, Zone, Grund | redigiert nach Karten- und Zone-Sichtbarkeit |
| `card_set_aside` | CardRef, Zone, Grund | side-sicher |
| `control_changed` | CardRef, alter Controller, neuer Controller, Grund | public oder side-private |
| `special_zone_conflict_blocked` | Blockergrund ohne Hidden Payload | public oder side-private |

PublicEvents duerfen verdeckte Kartenidentitaeten, Definition-IDs, private Quellen und nicht sichtbare Controllergruende nicht leaken.

## Visibility-Vertrag

| Zone/Fall | RunnerView | CorpView | PublicEvent |
| --- | --- | --- | --- |
| Public Set Aside | sichtbare Kartenidentitaet | sichtbare Kartenidentitaet | redigierte sichtbare Identitaet |
| Side-private Set Aside | nur berechtigte Seite sieht Identitaet | nur berechtigte Seite sieht Identitaet | keine verdeckte Identitaet |
| Hidden Set Aside | anonyme Karte oder Count nach Vertrag | anonyme Karte oder Count nach Vertrag | keine Identitaet |
| Removed public | sichtbare Identitaet, falls vorher legal sichtbar | sichtbare Identitaet, falls vorher legal sichtbar | redigiert |
| Removed hidden | anonym oder count-only | anonym oder count-only | anonym |
| Control Change public | sichtbarer Controllerwechsel | sichtbarer Controllerwechsel | public |
| Control Change hidden | nur berechtigte Projektion | nur berechtigte Projektion | anonymisiert |

## Undo-Vertrag

| Situation | Verhalten |
| --- | --- |
| Vor Spezialzonen-Move | Bestehende Undo-Regeln. |
| Move ohne neue Information | Undo kann nach bestehendem Vertrag moeglich bleiben. |
| Move mit Reveal, Hidden-Zone-Einsicht oder Randomness | Undo-Barriere. |
| Control-Wechsel ohne neue Hidden Info | Undo nach bestehendem Vertrag pruefbar. |
| Control-Wechsel mit privater Quelle oder neu sichtbarer Karte | Undo-Barriere. |

## Replay- und StateHash-Vertrag

- Replay muss Set Aside, Removed from Game und Control-Wechsel deterministisch rekonstruieren.
- StateHash muss ZoneKind, ZoneOwner/Side, Controller und Hostbeziehungen einbeziehen.
- Redigierte PublicEvents duerfen fuer StateHash nicht als Datenquelle dienen.
- Alte Baselines bleiben versioniert; neue Felder brauchen Defaultwerte oder Migrationsregeln.

## KI-Vertrag

KI darf:

- nur PlayerView, LegalActions und side-sichere Events nutzen,
- Spezialzonen-LegalActions passen oder fallbacken,
- sichtbare Zone- und Controllerdaten fuer einfache Risikoerkennung nutzen, wenn sie in PlayerView stehen.

KI darf nicht:

- FullState, gegnerische Hidden-Zone-Daten oder Reconnect-Debugdaten nutzen,
- Control-Wechsel strategisch bewerten, solange keine konkrete Karte `ai_supported` ist,
- DecisionDebug mit verborgenen Kartenidentitaeten oder Quellen schreiben.

## No-Scope-Pruefung

Ein V1.2.2-Implementation Review muss ausdruecklich bestaetigen:

- keine neue Runtime-Karte,
- keine KI-Deckfreigabe,
- keine Format-/Deckbuilding-Regeln,
- keine Public-Plattformfunktionen,
- kein Ownership-Wechsel,
- keine offiziellen Assets oder externen Kartendatenbank-Abhaengigkeiten.
