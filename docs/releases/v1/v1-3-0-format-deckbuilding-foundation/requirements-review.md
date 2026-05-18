# V1.3.0 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprueft wurden:

- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/plan.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/requirements.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/spec.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/test-matrix.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/deck-validation-spec.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/match-setup-spec.md`
- `docs/architecture/deck-library/local-file-deck-library-2026-05-07.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`

## Ergebnis

`V1_3_0_requirements_freeze_done: true`

`ready_for_implementation_after_V1_2_3: true`

V1.3.0 ist ausreichend geplant, um nach V1.2.3 umgesetzt zu werden. Die Planung haertet private lokale Formatprofile und Deckvalidierung, ohne Public-Legalitaet, Ranked, Turniere, Accounts, neue Karten oder Assets zu versprechen.

## Geklaerte Entscheidungen

- Formatprofile koennen Karten nur zusaetzlich sperren, nicht freigeben.
- `format_legal` setzt `deck_legal` voraus.
- Server-Revalidierung beim Matchstart bleibt Pflicht.
- Alte lokale Decks werden revalidation-pflichtig, nicht still migriert.
- KI-Deckbau bleibt AI-supported-only.
- Gegnerische Decklisten bleiben privat.

## Staerken

- Der V0.6-Decksnapshot-Vertrag wird nicht ersetzt, sondern erweitert.
- Die lokale Datei-Deckbibliothek bleibt sauber von Match-Snapshots getrennt.
- Influence, Agenda-Dichte und Kopienlimit werden datengetrieben und testbar.
- Hidden-Info-Schutz fuer Deckdaten ist explizit in Tests abgebildet.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Private Formatprofile werden als offizielle Legalitaet gelesen. | Hoch | Scope-, UI- und Doku-Grenzen. |
| Missing Data erzeugt falsche Legalitaet. | Hoch | MissingDataPolicy blockiert betroffene Decks. |
| Deckhashes oder Decklisten leaken. | Sehr hoch | Visibility- und E2E-Leaktests. |
| KI nutzt human-only Karten. | Hoch | AI-supported-only Deckpool und Ersatzdecktest. |
| Alte lokale Decks starten ungeprueft. | Hoch | `needs_revalidation` und serverseitige Revalidierung. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Die exakte Agenda-Dichteformel wird im Umsetzungsthread als private lokale Profilregel festgelegt.
- Datenfelder fuer Faction/Influence koennen an bestehende CardDefinition-Strukturen angepasst werden.

## Gate

V1.3.0 ist nach V1.2.3 bereit fuer Umsetzung.
