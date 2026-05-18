# V1.9.16 Program Subtype/Hosting/Stealth Spec

Stand: 2026-05-13
Status: draft-implementing

## Program Subtypes und MU

- Runner-Programme installieren ueber bestehende `install_card`-LegalActions.
- MU-Kosten, Typen und Subtypes bleiben Runtime-/Katalogdaten; keine Parser-Autoritaet aus Kartentext.
- Daemon-, Stealth-, Icebreaker- und Link-Rollen werden nur ueber explizite Runtime-Definitionen aktiviert.

## Hosting und Hosted Lifecycle

- Hosting-Choices bleiben side-sicher und zielgebunden.
- Host-Trash-Kaskaden duerfen nur bekannte installierte Karten referenzieren.
- Hosted-Karten duerfen nicht in PlayerViews oder PublicEvents verdeckte Zonen leaken.

## Stealth, Recurring und Link

- Stealth- und Link-Karten nutzen bestehende Recurring-/Trace-Vertraege.
- Link-Beitraege werden aus installierten, oeffentlichen Runner-Karten abgeleitet.
- Recurring-Pools refreshen deterministisch am Turnstart ohne Akkumulation.

## Installed-card Destroy

- Destroy/Trash installierter Runner-Karten bleibt zielgebunden und LegalAction-basiert.
- ICE-Folgen nutzen bestehende Encounter-, Trace-, Damage- und Trash-Pfade.
- Replay und StateHash muessen nach Destroy-/Damage-Aufloesung stabil bleiben.
