# V1.9.18 Generic Upgrade/Root/Server Spec

Status: draft frozen for WIP implementation
Stand: 2026-05-13

## Vertrag

Generische Upgrade-/Root-/Grid-Karten sind installierte Corp-Root-Karten in Remote- oder Zentralservern. Sie werden über bestehende `install_card`, Root-Rez und Runner-Access-/Trash-Pfade bedient. Aktive, passive oder ausgelöste Fähigkeiten dürfen nur über typisierte LegalActions, PendingChoices oder bestehende Resolverfamilien ausgeführt werden.

## Display-Text

Die V1.9.18-Texte sind aus lokal bestätigten Regelkern-Aussagen der Matrix abgeleitet. Sie sind Anzeige- und Kataloginformation, keine Engine-, KI-, Parser-, Replay- oder StateHash-Autorität.

## WIP-Vertrag

Der erste WIP-Schnitt darf:

- `CardDefinition`s für alle Zielkarten anlegen,
- Mechanikmarker für die späteren Resolverfamilien setzen,
- Tests für Zielmenge, finalen Text und No-Promotion ergänzen.

Der erste WIP-Schnitt darf nicht:

- die Karten in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` aufnehmen,
- AI-Approval-IDs setzen,
- Final Review oder Webclient-Version auf `V1.9.18` setzen,
- behaupten, dass Trace-, Access-, Ambush-, Damage-, Tag- oder Grid-Pfade vollständig abgeschlossen sind.

## Spätere Resolverpfade

- Root/Server: Serverbindung, Root-Zonen und Trash-on-access.
- Grid: city-grid-spezifische Servermodifier und Region-Grenzen.
- Access/Breach: Zusatzkosten, Ersatzaccess, Zusatzaccess und Trash-/Steal-Interaktion.
- Trace/Tags/Damage: bestehende side-sichere Fenster und Event-Modification-Pfade.
- Counter/Run: typisierte Counter und Run-Flow-Locks.

## Validierung

Jeder konkrete Effektpfad braucht mindestens einen Engine-Test mit LegalAction/applyAction-Revalidierung, PlayerView-Redaction, Replay und StateHash. KI-Smokes dürfen nur auf Karten zeigen, deren Enginepfade grün sind.
