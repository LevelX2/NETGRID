# MVP 0.4 Requirements Review

Status: passed  
Stand: 2026-05-03

## Review-Ergebnis

`ready_for_implementation: true`

## Scope-Anpassungen

- Damage wird nicht in MVP 0.4 umgesetzt, sondern als V0.4.x-Teilgate zurückgestellt.
- Resources werden nicht eingeführt.
- Upgrades bleiben bewusst einfach: install, rez, access, trash; keine Servermodifier.
- Tags werden als erste neue Regelgruppe umgesetzt.

## Risiken und Gegenmaßnahmen

| Risiko | Bewertung | Gegenmaßnahme |
|---|---|---|
| Kartenpool wächst zu breit | mittel | Nur neun interne Karten und zwei kuratierte Decks. |
| Tags erzeugen AI-Endlosschleifen | mittel | Runner-KI priorisiert `remove_tag`; Simulation hat Action-Limit. |
| Upgrades leaken verdeckte Titel | hoch | PlayerView-Hidden-Cards verwenden side-sichere verdeckte IDs. |
| Deckvalidierung wird Deckbuilder | mittel | Nur kuratierte Deck-IDs und interne Karten. |
