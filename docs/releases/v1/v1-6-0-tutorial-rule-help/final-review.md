# V1.6.0 Final Review - Tutorial und Regelhilfe

Stand: 2026-05-08
Status: passed

## Gate-Ergebnis

V1.6.0 ist implementiert, lokal verifiziert und final reviewt. Der getrennte Tutorialmodus liefert LegalAction-basierte Lernhinweise, replaybare Kernlektionen und side-sicheres KI-Sparring ohne Scope-Ausweitung.

Gate: `V1_6_0_implemented: true`; `V1_6_0_verified: true`; `V1_6_0_done: true`; `ready_for_next_scope_decision: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| V1.5.0-Abhängigkeitsgate | pass |
| Tutorialmodus getrennt von Normalmatches | pass |
| Szenarioformat und Kernlektionen | pass |
| LegalAction-basierte Hinweise | pass |
| Replay-/StateHash-Prüfung | pass |
| Hidden-Info-Sicherheit | pass |
| Glossar und Scope-Hinweis | pass |
| KI-Sparring ohne Hidden-Info-Vorteil | pass |
| No-Scope-Regression | pass |

## Pflichtchecks

- `git diff --check`: pass (nur bekannte CRLF-Warnung in bestehender Datei).
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- `corepack pnpm e2e`: pass.

Zusatz zur Tutorial-Browser-Pflichtspur:

- `docs/releases/v1/v1-6-0-tutorial-rule-help/artifacts/tutorial-smoke.json`
- `docs/releases/v1/v1-6-0-tutorial-rule-help/artifacts/tutorial-smoke.png`

## Bekannte Grenzen

- Tutorial bleibt bewusst lokal/privat und getrennt von Accounts oder Cloud-Fortschritt.
- Regelhilfe ist absichtlich scope-begrenzt und keine vollständige Regelschule.
- Kein LLM-/Coach-Live-Actionpfad in V1.6.0.

## Freigabe

V1.6.0 ist grün. Die Sequenz V1.4.2 bis V1.6.0 ist vollständig abgeschlossen.
