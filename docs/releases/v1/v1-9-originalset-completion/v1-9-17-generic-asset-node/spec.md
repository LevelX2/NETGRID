# V1.9.17 Generic Asset/Node Spec

Status: draft frozen for WIP implementation
Stand: 2026-05-13

## Vertrag

Generische Asset-/Node-Karten sind installierte Corp-Root-Karten in Remote-Servern. Sie werden über bestehende `install_card`, `rez_ice` für Root-Rez und Runner-Access-/Trash-Pfade bedient. Aktive oder ausgelöste Fähigkeiten dürfen nur über typisierte LegalActions, PendingChoices oder bestehende Resolverfamilien ausgeführt werden.

## Display-Text

Die V1.9.17-Texte sind aus lokal bestätigten Regelkern-Aussagen der Matrix abgeleitet. Sie sind Anzeige- und Kataloginformation, keine Engine-, KI-, Parser-, Replay- oder StateHash-Autorität.

## WIP-Vertrag

Der erste WIP-Schnitt darf:

- `CardDefinition`s für alle Zielkarten anlegen,
- Mechanikmarker für die späteren Resolverfamilien setzen,
- Tests für Zielmenge, finalen Text und No-Promotion ergänzen.

Der erste WIP-Schnitt darf nicht:

- die Karten in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` aufnehmen,
- AI-Approval-IDs setzen,
- Final Review oder Webclient-Version auf `V1.9.17` setzen,
- behaupten, dass Ambush-, Hidden-Zone-, Damage- oder Trace-Pfade vollständig abgeschlossen sind.

## Spätere Resolverpfade

- Campaign/Economy: rezzed Asset-Status, Credits oder Counter als explizite Stateänderung.
- Recurring: Counter-Refresh ohne Akkumulation am korrekten Turnstart.
- Hidden-Zone: redigierte Choices und PublicEvents ohne verdeckte Kartenleaks.
- Trace: bestehendes side-sicheres Trace-Bid-Fenster.
- Ambush/Access: nur aus legalen Access-Fenstern, mit optionalen Kosten und klarer PublicPayload.
- Damage/Tag: bestehende Damage-/Tag-Resolver, inklusive Prevention/Avoid-Fenster wo erforderlich.
- Hosting: explizite `hostedOn`-Referenzen und Host-Trash-Kaskaden ohne zyklische Hosts.

## Validierung

Jeder konkrete Effektpfad braucht mindestens einen Engine-Test mit LegalAction/applyAction-Revalidierung, PlayerView-Redaction, Replay und StateHash. KI-Smokes dürfen nur auf Karten zeigen, deren Enginepfade grün sind.
