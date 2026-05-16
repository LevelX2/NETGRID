# Originalset-Spotcheck 2026-05-16 Asset/Upgrade/Trace Modifiers

Job: `spotcheck-2026-05-16-asset-upgrade-trace-modifiers`

## Ergebnis

Der Job wurde fachlich umgesetzt. Bestehende Asset-, Upgrade-, Trace-, Link-, Handlimit- und Recurring-Pfade wurden geprüft; Priority Requisition wurde von automatischem Free-Rez auf eine private, source- und target-revalidierte Korp-Choice umgestellt.

Commit-Status: `commit_pending`. Staging und lokaler Commit sind durch `Permission denied` beim Erstellen von `.git/index.lock` blockiert; Ursache ist weiterhin die fremde direkte DENY-ACL `S-1-5-21-2893003870-2010802999-161870138-128397290` auf `.git`.

## Umgesetzte Härtungen

- `Priority Requisition` öffnet beim Scoren eine private Korp-Choice für ein installiertes unrezzed ICE; Target-Drift und already-rezzed-Ziele werden bei `applyAction` abgelehnt.
- `Omni Kismet, Ph.D.` revalidiert den öffentlichen Runner-Tagstatus beim Resolve.
- `Disinfectant, Inc.` revalidiert sichtbare Virus-Counter-Ziele und lehnt verbrauchte oder bewegte Ziele ab.
- `Access to Kiribati` wurde im Trace-Fenster als aktuelle Base-Link-Quelle geprüft.
- Bestehende ACME-, Investment-Firm-, Fortress-Architects-, Cloak-, Main-Office- und Tesseract-Pfade bleiben durch vorhandene Regressionen und die volle Engine-Suite grün.

## Kartenstatus

| Karte | Card ID | Status | Notiz |
|---|---|---|---|
| ACME Savings and Loan | `onr_v1_308_acme-savings-and-loan` | completed | Agenda-Punkt-Rezkosten, Self-Trash, Verpflichtung, Payment und Loss-Pfad bleiben grün. |
| Investment Firm | `onr_v1_329_investment-firm` | completed | Recurring-Corp-Startcredit bleibt in der V1.9.17-Regression abgedeckt. |
| Fortress Architects | `onr_v1_324_fortress-architects` | completed | Rezzed ICE-Rez-Kostenmodifier bleibt public-source-bound. |
| Disinfectant, Inc. | `onr_v1_319_disinfectant-inc` | completed | Virus-Counter-Ziel-Drift zusätzlich geprüft. |
| Omni Kismet, Ph.D. | `onr_v1_364_omni-kismet-ph-d` | completed | Tag-Condition-Drift zusätzlich geprüft. |
| Tesseract Fort Construction | `onr_v1_370_tesseract-fort-construction` | completed | Servergebundene Upgrade-Runtime bleibt im V1.9.18-Gate grün. |
| Cloak | `onr_v1_011_cloak` | completed | Stealth-/Noisy-Payment-Filter und Refresh bleiben grün. |
| Main-Office Relocation | `onr_v1_205_main-office-relocation` | completed | ScoreArea-Handlimit-Projektion bleibt grün. |
| Access to Kiribati | `onr_v1_150_access-to-kiribati` | completed | Base-Link-Recompute im Trace-Bid-Fenster geprüft. |
| Priority Requisition | `onr_v1_212_priority-requisition` | completed | Private Free-Rez-Choice und Target-Revalidation umgesetzt. |

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün. Staging und lokaler Commit bleiben bis zur `.git`-ACL-Reparatur blockiert.
