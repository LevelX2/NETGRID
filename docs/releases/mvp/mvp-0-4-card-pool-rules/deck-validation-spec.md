# Deck Validation 0.4 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Ziel

V0.4 validiert ausschließlich kuratierte interne Demo-Decks. Es entsteht kein freier Deckbuilder.

## Prüfungen

- Deck-ID ist kuratiert oder explizit erlaubt.
- Side des Decks passt zur erwarteten Side.
- Identity existiert, gehört zur Side und hat Type `identity`.
- Jede Karten-ID existiert.
- Jede Karten-Side passt zum Deck.
- Jede Menge ist eine positive Ganzzahl.
- Keine Karte mit nicht spielbarem Manifeststatus ist erlaubt.
- Corp-Decks erfüllen den geforderten Agenda-Point-Mindestwert.

## Nicht geprüft

- Turnierlegalität.
- Einfluss.
- Rotation.
- Banlisten.
- externe Formatregeln.
