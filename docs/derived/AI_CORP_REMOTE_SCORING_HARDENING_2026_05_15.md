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

## Tests

Neue AI-Regressionsabdeckung:

- Corp-KI bevorzugt ICE-Schutz gegenüber nackter Agenda-Installation in einen neuen Remote.
- Corp-KI installiert eine Agenda in einen bestehenden geschützten Remote statt in einen neuen nackten Remote.
- V1.9.22-AI-Hints erreichen die Corp-Planrollen.

## Verifikation

- `corepack pnpm --filter @netgrid/ai test`: grün, 97 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm typecheck`: grün.
- `corepack pnpm test`: grün.
- `corepack pnpm lint`: grün.

## Grenze

Dieser Schnitt verbessert die taktische Remote-Auswahl. Er führt noch keine vollwertige Deck-Doktrin ein. Ein späterer KI-Schnitt sollte aus dem eigenen Decksnapshot und AI-Hints ein explizites Strategieprofil ableiten, z. B. Rush, Glacier, Tag-Punish oder Asset-Remote.
