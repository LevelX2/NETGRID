# Format und Deckbuilding Foundation 1.3.0 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.3.0-Vertrag fuer lokale Formatprofile, Deckvalidierung, Decksnapshots, Matchstart-Revalidierung und KI-Deckbau.

## Grundsatz

Ein Formatprofil ist ein lokales Validierungsprofil. Es darf Karten sperren, aber niemals Karten freigeben.

Statuskette:

```txt
listed -> engine_supported -> human_playable -> deck_legal -> format_legal
human_playable -> ai_supported -> ai_deck_legal
```

`format_legal` ist keine Public- oder Turnierlegalitaet.

## FormatProfile-Sollschema

```ts
type FormatProfile = {
  formatProfileId: string
  version: string
  displayName: string
  scope: "private_local" | "test_fixture"
  cardPoolVersion: string
  allowedCardStatuses: string[]
  runner: SideDeckRules
  corp: SideDeckRules
  copyLimit: {
    defaultLimit: number
    exceptions: CopyLimitException[]
  }
  influence: {
    enabled: boolean
    missingDataPolicy: "block" | "warn"
  }
  agenda: {
    policy: "points_minimum" | "density_range" | "local_profile"
    missingDataPolicy: "block"
  }
}

type SideDeckRules = {
  minDeckSize: number
  maxDeckSize?: number
  identityRequired: boolean
}
```

Das konkrete Modell darf vorhandene Deckstrukturen nutzen, muss aber diese Regeln pruefbar abbilden.

## DeckSnapshot-Vertrag

Ein Match nutzt unveraenderliche Snapshots:

- `deckSnapshotId`
- `deckHash`
- `side`
- `identityCardCode`
- `formatProfileId`
- `formatProfileVersion`
- `cardPoolVersion`
- normalisierte Kartenliste
- `validationSummary`
- optionales eigenes Deckrollenprofil fuer KI

Aenderungen am bearbeitbaren Deck nach Matchstart duerfen den Snapshot nicht veraendern.

## Validierungsregeln

### Allgemein

- Side ist Runner oder Korp.
- Identity existiert und passt zur Side.
- Jede Karte existiert im lokalen Katalog.
- Jede Karte passt zur Side oder hat eine explizite Ausnahme.
- Jede Karte ist `human_playable` und `deck_legal`.
- Mengen sind positive Ganzzahlen.
- Kopienlimit wird eingehalten.
- FormatProfile-Version ist bekannt.

### Faction und Influence

- Identity definiert Faction und Influence-Limit.
- Karten definieren Faction und Influence-Kosten.
- In-faction Karten kosten nach lokalem Vertrag 0 Influence, ausser explizit anders datengetrieben.
- Out-of-faction Karten addieren Influence-Kosten.
- Fehlende Faction-/Influence-Daten blockieren betroffene Decks.

### Korp-Agenda

- Korp-Decks muessen Agenda-Punkte oder Agenda-Dichte nach lokalem Profil erfuellen.
- Agenda-Punkte kommen aus CardDefinition-Daten.
- Fehlende Agenda-Daten auf Agenda-Karten blockieren das Deck.
- Runner-Decks duerfen keine Korp-Agenda-Dichtepruefung bekommen.

### Kopienlimit

- Default-Limit gilt pro kanonischem Kartenname oder cardCode-Gruppe.
- Ausnahmen sind datengetrieben.
- Fehlende Ausnahme bedeutet Default-Limit.
- Importierte Decks koennen Kopienlimit nicht selbst erweitern.

## Import/Export

- Export enthaelt FormatProfile-ID und Version.
- Import prueft FormatProfile-ID.
- Unbekanntes Formatprofil blockiert Matchstart und markiert Deck zur Revalidation.
- Importierte unbekannte Karten bleiben nicht spielbar.
- Dateipfade und lokale Speicherorte werden nicht aus Decknamen abgeleitet.

## Matchstart

Server prueft beim Matchstart:

- Snapshot-Hash stimmt.
- Formatprofil ist bekannt.
- Deck ist aktuell valide oder bewusst als alter Snapshot mit kompatibler Baseline markiert.
- Beide Seiten haben passende Decks.
- KI-Decks enthalten nur AI-supported Karten, falls KI sie spielt.

## Visibility-Vertrag

Gegner darf standardmaessig sehen:

- Side,
- Identity, sofern matchsichtbar,
- Deckname nach side-sicherem Vertrag,
- Formatprofil,
- Cardpool-/RulesBaseline,
- keine vollstaendige Deckliste,
- keine verdeckten Karten aus laufenden Zonen.

Fehler und Logs duerfen keine privaten Decklisten, lokalen Pfade, Tokens, FullState-Dumps oder gegnerischen Hidden Cards enthalten.

## KI-Vertrag

- KI-Deckbau nutzt nur `ai_supported`.
- KI darf kein gegnerisches Deckrollenprofil aus privater Deckliste berechnen.
- Eigenes Deckrollenprofil darf aus eigenem Snapshot und AI-Hints berechnet werden.
- DecisionDebug darf eigenes Profil nennen, aber keine gegnerischen versteckten Deckdaten.
- Difficulty-Profile unterscheiden Bewertungsqualitaet, nicht Informationszugang.

## No-Scope-Pruefung

Ein V1.3.0-Implementation Review muss bestaetigen:

- keine Public Decklists,
- keine Accounts oder Cloud Decks,
- kein Ranked, Matchmaking oder Turniermodus,
- keine neue Kartenfreigabe,
- keine offizielle Formatlegalitaetszusage,
- keine offiziellen Assets oder externen Laufzeitdaten.
