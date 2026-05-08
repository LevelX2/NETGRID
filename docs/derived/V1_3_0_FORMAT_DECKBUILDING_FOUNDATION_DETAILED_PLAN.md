# V1.3.0 Format und Deckbuilding Foundation - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.3.0 macht groessere Kartenmengen praktisch nutzbar, ohne ungedeckte oder illegale Decks in Matches zu lassen. Der Release haertet lokale Formatprofile, Deckvalidierung, Decksnapshots, Deckeditor-Feedback und Matchstart-Revalidierung.

V1.3.0 ist kein Public-Format-, Ranked- oder Turnierrelease. Formatprofile sind private lokale Validierungsprofile, keine offizielle Turnierlegalitaetszusage.

## Quellenbasis

- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/MVP_0.6_DETAILED_PLAN.md`
- `docs/derived/DECK_VALIDATION_0.6_SPEC.md`
- `docs/derived/MATCH_SETUP_0.6_SPEC.md`
- `docs/derived/LOCAL_FILE_DECK_LIBRARY_2026_05_07.md`
- `docs/derived/V1_2_3_REQUIREMENTS_REVIEW.md`
- bestehende Deck-, Catalog-, Matchstart-, Storage-, Visibility-, Replay- und E2E-Artefakte

## Scope

- Versionierte lokale Formatprofile.
- Deckvalidierung mit Faction, Influence, Mindestdeckgroesse, Agenda-Dichte/Agenda-Punktanforderungen, Kopienlimit und Kopienlimit-Ausnahmen.
- Identity-Deckregeln als lokale Profil- und Identity-Daten.
- Trennung von Katalogstatus, Spielbarkeit, Decklegalitaet und Formatlegalitaet.
- Matchstart-Revalidierung gegen Formatprofil und Cardpool-Version.
- Deck-Snapshots mit Formatprofil-Version.
- Import/Export mit Formatprofil-Metadaten.
- Migration/Validierungsreport fuer alte lokale Decks.
- KI-Deckbau nur aus AI-supported Karten und validierten Formatprofilen.

## Nicht-Ziele

- Keine Public Decklists.
- Keine Accounts, Cloud Decks, Sync, Matchmaking, Rankings oder Turnierfunktionen.
- Keine vollstaendige offizielle Formatlegalitaet, Rotation oder Banlist-Distribution.
- Keine neuen Karten.
- Keine neue Engine-Mechanik.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhaengigkeiten.
- Keine automatische Kartentextauslegung.
- Keine Offenlegung gegnerischer Decklisten oder Deckhashes ueber side-unsichere Payloads.

## Leitentscheidung

V1.3.0 fuehrt lokale Formatprofile als validierte Produktdaten ein. Ein Formatprofil kann Karten einschranken, aber keine Karte spielbar machen. Spielbarkeit bleibt durch CardSupport und MechanicSupport bestimmt.

Kernregel:

`format_legal` setzt `deck_legal` voraus, und `deck_legal` setzt `human_playable` voraus.

## Umsetzungspakete

1. **Profilmodell**
   - FormatProfile-ID, Version, Name, Side-Regeln, Cardpool-Version und ValidationPolicy definieren.
   - Regeln fuer Mindestdeckgroesse, Kopienlimit, Influence, Agenda-Punkte und Agenda-Dichte modellieren.
   - Explizite Ausnahmen fuer Kopienlimit und Identity-Regeln vorbereiten.

2. **Identity- und Kartendaten**
   - Faction, Influence-Kosten, Identity-Deckminima und Influence-Limits als reviewpflichtige Daten fuehren.
   - Datenfehler duerfen Matchstart nicht passieren.
   - Fehlende Werte blockieren nur betroffene Decks, nicht den gesamten Katalog.

3. **Deckvalidierung**
   - Validierung in reine Paketlogik legen oder bestehendes Deckpaket erweitern.
   - Fehlercodes stabilisieren.
   - Deckeditor bekommt klare, lokale Validierungsfehler.
   - Server validiert beim Matchstart erneut.

4. **Snapshots, Import/Export, Migration**
   - Decksnapshot schreibt FormatProfile-ID und Version.
   - Import/Export erhaelt Formatprofil-Metadaten.
   - Alte lokale Decks werden nicht automatisch umgeschrieben; sie bekommen Validierungsreport und koennen neu gespeichert werden.
   - Persoenliche Datei-Deckbibliothek bleibt von Match-Snapshots getrennt.

5. **KI**
   - KI-Deckbau nutzt nur AI-supported Karten.
   - Deckrollenprofil aus eigenem Decksnapshot und AI-Hints berechnen.
   - KI lehnt nicht formatvalide oder nicht AI-supported Decks ab oder nutzt Ersatzdeck.
   - DecisionDebug nennt nur eigenes Deckrollenprofil und oeffentliche Gegnerdaten.

6. **E2E und No-Scope**
   - Browser-Smokes fuer legale und illegale Decks.
   - Matchstart mit validierten Formatprofilen.
   - Leak-Scan fuer Decklisten, Deckhashes und Validation Errors.
   - No-Scope bestaetigt keine Public-/Turnier-/Asset-/Kartenfreigabe.

## Formatprofil-Schnitt

V1.3.0 soll mindestens ein privates lokales Standardprofil liefern:

- ID: `netgrid_private_local_v1`
- Zweck: privates lokales Spielen mit freigegebenen NETGRID-Karten
- Kartenstatus: nur `human_playable` und `deck_legal`
- Formatlegalitaet: zusaetzliche lokale Deckregeln, keine Public-Legalitaetszusage
- KI-Deckbau: nur `ai_supported`

Weitere Profile duerfen nur als Testfixtures existieren, nicht als public produktives Formatversprechen.

## Daten- und Persistenzfolgen

- Deck-Snapshots erhalten `formatProfileId`, `formatProfileVersion`, `cardPoolVersion` und `validationSummary`.
- Match-Snapshots speichern diese Werte unveraenderlich.
- Alte Decks ohne Formatprofil werden beim Laden als `needs_revalidation` markiert.
- Backups transportieren Deck- und Matchdaten unveraendert; sie erzeugen keine neue Legalitaet.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Formatprofil wird als offizielle Turnierlegalitaet missverstanden. | Hoch | Klare UI-/Doku-Grenze: privat lokal. |
| Formatprofil aktiviert unspielbare Karten. | Sehr hoch | `format_legal` setzt `deck_legal` voraus. |
| Influence-/Agenda-Daten sind unvollstaendig. | Hoch | Datenfehler blockieren Deck, nicht Matchsystem. |
| Gegnerische Decklisten leaken durch Validierungsfehler. | Sehr hoch | Side-sichere Fehler und Payload-Leaktests. |
| KI nutzt nicht AI-supported Karten. | Hoch | KI-Deckpool-Validierung und Fallbackdeck. |

## Offene Fragen

Keine blockierende offene Frage.

Nicht blockierend:

- Die genaue Agenda-Dichteformel darf als private lokale Naeherung dokumentiert werden, solange sie nicht als offizielle Turnierlegalitaet verkauft wird.
- Die konkrete Datenform fuer Faction/Influence darf an bestehende CardDefinition- und Deckpaketstrukturen angepasst werden.

## Gate

`V1_3_0_requirements_freeze_done: true`

`ready_for_implementation_after_V1_2_3: true`
