# Executive Summary: Langfristige Produktvision und Roadmap

Status: planning_summary
Stand: 2026-05-05
Hauptdokument: `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`

Nachtrag 2026-05-06: V1.0.4, V1.0.5K und V1.0.6 sind inzwischen umgesetzt bzw. verifiziert. V1.0.7 Browser-E2E und Visual QA ist requirements-frozen und der nächste umsetzungsbereite Scope.

## Ideales Endprodukt

Das ideale Produkt ist eine regelgeführte Netrunner-Plattform mit vollständiger Rules Engine, vollständigem rechtlich sauberem Karten-/Formatdatenpfad, privatem und später optional öffentlichem Internet-Multiplayer, Deckbuilder, Replays, Tutorials, Regelhilfe, KI-Gegnern, Accessibility, Betriebssicherheit, Moderation und langfristiger Wartbarkeit.

Nicht verhandelbar bleiben:

- Engine ist einzige Regelautorität.
- UI, Server, KI und Menschen handeln nur über `LegalActions`.
- `applyAction` validiert erneut.
- Hidden Info darf nie in PlayerViews, PublicEvents, KI-Inputs, WebSocket, Reconnect, Undo, Logs, Fehler, Replays oder Assets leaken.
- Replay und StateHash bleiben deterministisch.
- Bilder und Assets sind Anzeige-Artefakte, nie Regel-, KI-, Replay- oder StateHash-Input.

## Heutiger Stand

Belegt grün am 2026-05-05 nach V1.0.3-Finale:

- V1.0.1 ist umgesetzt.
- V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz ist umgesetzt.
- V1.0.3 Matchstart-UX ist umgesetzt und nach `main` integriert.
- V1.0.4 ist umgesetzt und final geprüft.
- V1.0.5 hat Requirements/Specs und eine passende Workspace-Basis, aber keine eigenen formalen Finalartefakte.
- V1.0.5K und V1.0.6 sind umgesetzt und lokal verifiziert.
- V1.0.7 Browser-E2E und Visual QA ist requirements-frozen und bereit für die Umsetzung.
- V0.94 bis V0.99 decken mehrere Kernmechaniken in engen Gates ab.
- Private lokale O:NR-Daten sind nur privater lokaler Testpool, kein öffentlicher Kartenpool.
- `corepack pnpm test`, `typecheck`, `lint` und `build` bestehen.

## Haupt-Releases

Empfohlene nächste Linie:

1. V1.0.7 Browser-E2E und Visual QA.
2. V1.0.8 Storage/Backup-Härtung.
3. V1.0.9 Private Internet Hardening.
4. V1.1 bis V1.7: Regelkern, Formate, Datenpipeline, Replays, Tutorials, AI v2.
5. V2.x: geschlossene Community und öffentliche Multiplayer-Basis nur nach Auth-/Security-/Moderationsgates.
6. V3.x/V4.x: Ranked, Turniere, vollständige Karten-/Formatabdeckung, Public-Replays, Mobile/Accessibility, langfristige Wartung.

## Harte Gates

- Lizenz-/Rechtefreigabe.
- vollständige Kartendatenquelle.
- offizieller oder privater Assetpfad.
- Accountsystem.
- Hostingmodell.
- öffentliche Plattformfunktionen.
- Turnier-/Ranking-Anspruch.
- Moderationsmodell.
- Datenschutzmodell.
- Regelvollständigkeit und Errata-Modell.
- Public Replay/Spectator.
- KI-/LLM-Grenze.

## Wichtigste Risiken

- Hidden-Info-Leaks durch UI, Reconnect, Undo, Cues, Replays oder Zuschauer.
- StateHash-/Replay-Brüche durch Match-Lifecycle, Timings oder neue Mechaniken.
- Rechts-/IP-Risiken durch Kartentexte, Bilder, Frames, Logos oder Card Backs.
- Öffentliche Plattformfunktionen ohne Moderation, Rate Limits und Datenschutz.
- Kartenimport, der unbeabsichtigt Spielbarkeit erzeugt.
- KI- oder Coaching-Systeme, die verdeckte Informationen oder Regelautorität erhalten.

## Nicht zu früh planen

- öffentliche Lobbys,
- Matchmaking,
- Chat,
- Ranked,
- Turniere/Ligen,
- Public Spectator,
- Public Replays,
- Accounts/Profile/Freunde,
- vollständige offizielle Assets,
- LLM-Coaching,
- automatische Kartentextparser.

Diese Features sind nicht "nie", aber sie brauchen jeweils eigene harte Gates.
