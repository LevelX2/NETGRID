# AI Corp Remote Scoring Hardening 2026-05-15

Status: umgesetzt und lokal verifiziert

## Anlass

Bei Corp-KI-Partien wurde beobachtet, dass die KI einfache Agenden zu oft ungeschützt in einen neuen Außenserver installiert, obwohl Schutz- oder bessere Remote-Optionen sichtbar legal verfügbar sind.

## Umsetzung

- Die planbasierte Corp- und Runner-KI lädt nun die AI-Hints der Deck-Legal-Approval-Releases V1.9.11 bis V1.9.22 zusätzlich zu den älteren Hint-Dateien.
- Die Corp-Planbewertung erkennt Agenda-Rollen breiter, darunter `agenda`, `corp_score_agenda`, `score_agenda` und historische `agenda_*`-Rollen.
- `score_next_turn` und `build_scoring_remote` erhalten einen Remote-Root-Sicherheitswert für Agenda-Installationen:
  - Agenda in neuem Remote: deutlich negativ.
  - Agenda in bestehendem ungeschütztem Remote: negativ.
  - Agenda in bestehendem Remote mit ICE: positiv, mit Bonus für gerezztes ICE.
- Wenn eine nackte Agenda-Installation vermeidbar ist, weil ICE-Installation oder ein geschützter Agenda-Remote legal verfügbar ist, wird der Plan zusätzlich abgestraft.
- Innerhalb eines ausgewählten Remote-Plans wählt die KI einen geschützten bestehenden Remote vor einem neuen nackten Remote.
- Die Corp-Planbewertung schätzt nun side-sicher die sichtbare Runner-Contest-Kapazität für geschützte Remotes:
  - sichtbare Runner-Credits,
  - sichtbare installierte Icebreaker,
  - bekannte/rezzed Remote-ICE und berechenbare End-the-run-Break-Kosten,
  - öffentliche Remote-Pressure-Signale aus dem Opponent Model.
- `score_next_turn` und `build_scoring_remote` erhalten dadurch Bonus, wenn der Runner sichtbar wenig Credits oder keine passenden Breaker hat, und Malus, wenn der Runner ein geschütztes Remote wahrscheinlich contesten kann.
- Ein zusätzlicher Score-Horizon-Baustein bewertet, wie viele Advances nach der aktuellen Install-/Advance-/Score-Aktion bis zum Scoring fehlen. Nahe Score-Fenster, besonders bei niedriger Runner-Contest-Kapazität, werden höher gewichtet als lange, riskante Score-Pläne.

## Tests

Neue AI-Regressionsabdeckung:

- Corp-KI bevorzugt ICE-Schutz gegenüber nackter Agenda-Installation in einen neuen Remote.
- Corp-KI installiert eine Agenda in einen bestehenden geschützten Remote statt in einen neuen nackten Remote.
- V1.9.22-AI-Hints erreichen die Corp-Planrollen.
- Corp-KI unterscheidet bei geschützten Remotes zwischen niedrigem und hohem sichtbarem Runner-Contest-Potential.
- Corp-KI priorisiert ein Advance, das ein nahes Score-Fenster öffnet, vor generischer Economy.

## Verifikation

- `corepack pnpm --filter @netgrid/ai test`: grün, 121 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm typecheck`: grün.
- `corepack pnpm test`: grün.
- `corepack pnpm lint`: grün.

## Grenze

Dieser Schnitt verbessert die taktische Remote-Auswahl und nahe Scoring-Fenster. Er bleibt absichtlich side-sicher und nutzt keine verdeckten Runner-Hand- oder Stackinformationen. Ein späterer KI-Schnitt sollte Runner-Out-Wahrscheinlichkeiten über mehrere Züge aus Deck-/Board-Kontext robuster schätzen und die vorhandene Deck-Doktrin weiter mit konkreten Remote-Scoring-Linien verbinden.
