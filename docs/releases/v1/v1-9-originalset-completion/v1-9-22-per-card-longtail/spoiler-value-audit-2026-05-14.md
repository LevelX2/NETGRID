# V1.9.22 Spoiler Value Audit 2026-05-14

Status: Quelle ausgewertet, klare Werte korrigiert, keine Promotion

## Quellen

- `docs/source/Runnerspoiler 1.0.txt`
- `docs/source/Corpspoiler 1.0.txt`

Die beiden UTF-8-Spoilertexte wurden gegen die 47 Karten des V1.9.22-WIP-Scopes geprüft. Ziel war nur die belastbare Wertgrundlage: Play-/Install-/Rez-/Agenda-Kosten, Stärke, MU, Action-Kosten und eindeutige Gain-/Recurring-Werte.

## Korrigierte Werte

| Karte | Korrektur |
| --- | --- |
| `Scatter Shot` | Install 0, MU 1, 2 recurring restricted Credits für Trashen von Upgrades. |
| `misc.for-sale` | Play 0, trash any number eigener installierter Karten, Gain 3 pro getrashter Karte. |
| `Organ Donor` | Play 0, bis zu 5 Grip-Karten trashen, Gain 2 pro getrashter Karte. |
| `Corporate Retreat` | Advancement 4, Agenda 3, `[A]: Gain 2`; Fähigkeit endet nach Corp-Rez oder Corp-Install. |
| `Data Fort Reclamation` | Advancement 4, Agenda 2, Gain 10 temporäre Credits, bis zu 4 HQ-Karten. |
| `Marine Arcology` | Advancement 3, Agenda 2, `[A], [A]: Gain 3`. |

Diese Korrekturen sind in `data/rules/v1922-local-card-facts.json`, `data/rules/v1922-resolver-contracts.json`, Runtime-WIP-Code, Manifest/Coverage/Szenario und den V1.9.22-Nachweisen nachgezogen.

## Bestätigte Werte Ohne Korrektur

| Karte | Bestätigter Wert |
| --- | --- |
| `False Echo` | Install 0, MU 1. |
| `Flak` | Install 4, MU 1, Stärke 2, `1: Break AP`, `1: +1 Strength`. |
| `Hammer` | Install 2, MU 1, Stärke 2, `1: Break Wall`, `1: +1 Strength`, Noisy-Stealthverlust insgesamt bis 2. |
| `Japanese Water Torture` | Install 7, MU 1, Stärke 2, `0: Break Wall`, `X: +X Strength` plus nächste X Aktionen verlieren. |
| `Netspace Inverter` | Install 0, MU 1. |
| `Newsgroup Filter` | Install 5, MU 2, `[A]: Gain 2`. |
| `Poltergeist` | Install 0, MU 1, 2 recurring restricted Credits für Node-Trash-Kosten. |
| `Rabbit` | Install 0, MU 1. |
| `Reflector` | Install 2, MU 1, Stärke 4, `0: Break stun, hellbolt or knockout`. |
| `Shield` | Install 0, MU 1, prevent up to 2 Net damage each turn. |
| `Speed Trap` | Install 0, MU 1. |
| `Startup Immolator` | Install 0, MU 1. |
| `Zetatech Software Installer` | Install 0, MU 1, 2 recurring restricted Credits für Programminstallationen. |
| `Anonymous Tip` | Play 3. |
| `Core Command: Jettison Ice` | Play 0. |
| `Forged Activation Orders` | Play 1. |
| `If You Want It Done Right...` | Play 0. |
| `Open-Ended Mileage Program` | Play 0, optionale Rücknahme kostet 1. |
| `Security Code WORM Chip` | Play 0. |
| `Synchronized Attack on HQ` | Play 4, Corp zahlt 2 pro behaltener HQ-Karte. |
| `Valu-Pak Software Bundle` | Play 0, bis zu 5 Programminstall-Aktionen, 1 temporärer Credit. |
| `Corporate War` | Advancement 3, Agenda 3, 12-Credit-Schwelle, Gain 12 sonst alle Credits verlieren. |
| `Political Overthrow` | Advancement 9, Agenda 6, `[A]: Gain 3`. |
| `Security Purge` | Advancement 3, Agenda 2, top 3 R&D reveal/install/rez ICE no cost/trash rest. |
| `Haunting Inquisition` | Rez 8, Stärke 6. |
| `Tutor` | Rez 4, Stärke 5. |
| `Viral 15` | Rez 5, Stärke 3. |
| `Virizz` | Rez 2, Stärke 4, +1 Break-Kosten pro ICE-Subroutine für Rest des Runs. |
| `Zombie` | Rez 9, Stärke 4. |
| `Edgerunner, Inc., Temps` | Play 1, drei install-only Actions. |
| `Off-Site Backups` | Play 0. |
| `Planning Consultants` | Play 0. |

## Offene Punkte

Keine offenen Attributkonflikte aus den beiden Spoilertexten für den V1.9.22-Scope.

Offen bleiben technische Runtime-Verträge für noch nicht vollständig umgesetzte Karten: LegalAction-Projektion, `applyAction`-Revalidierung, Sichtbarkeit, Replay/StateHash und AI-Fallback.
