# V1.9.18 Requirements

Status: frozen
Stand: 2026-05-13

## Must

- Der Release umfasst genau die 15 Karten aus `docs/releases/v1/v1-9-originalset-completion/v1-9-18-generic-upgrade-root-server/plan.md`.
- V1.9.18 darf keine V1.9.19+-Karten freigeben.
- Alle Karten benötigen lokale Runtime-Definitionen mit finalem display-only Text ohne `WIP`-Präfix.
- WIP-Definitionen dürfen nicht automatisch `human_playable`, `deck_legal` oder `ai_supported` im Katalog werden.
- Jede spätere Upgrade-/Root-/Grid-Fähigkeit muss über LegalActions, PendingChoices oder bestehende Resolver laufen.
- Root-/Upgrade-Zonen, Serverbindung, Access, Ambush, Damage, Tag, Trace, Counter und Hidden-Zone-Flächen müssen side-sicher projiziert werden.
- Replay und StateHash müssen für jeden konkreten Effektpfad deterministisch bleiben.
- AI-Support darf erst mit AI-Hints, AI-Smokes, legalem Fallback und side-sicherem DecisionDebug gesetzt werden.

## Should

- Upgrade-Install, Root-Rez und Trash-on-access sollen vorhandene Corp-Root-Pfade wiederverwenden.
- Displaytexte sollen knapp, lokal abgeleitet und im Review als display-only dokumentiert sein.
- WIP-Smokes sollen zuerst Zielmenge und No-Promotion schützen, bevor konkrete Resolverfamilien finalisiert werden.

## Won't

- Kein Kartentextparser.
- Keine offizielle Artwork- oder externe Kartendatenbank-Abhängigkeit.
- Kein V2.x-Produktfeature.
- Keine Release-Promotion ohne vollständiges Completion-Gate.
