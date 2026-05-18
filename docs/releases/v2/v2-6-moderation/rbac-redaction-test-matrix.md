# V2.6 Moderation RBAC- und Redaction-Testmatrix

Stand: 2026-05-17
Status: Test-Harness vorbereitet
Zielrelease: V2.6 Moderation Console

## Umgesetzt

- `apps/server/src/moderation-rbac.ts`
  - definiert Rollen `system`, `admin`, `moderator`, `support_readonly`, `reporter_self`.
  - definiert Datenklassen `D0_public_lobby_metadata` bis `D7_ops_audit_data`.
  - legt `MODERATION_RBAC_MATRIX` mit Zugriffsstufen `allow`, `redacted`, `own_only`, `break_glass`, `deny` fest.
  - nutzt `findObservabilityRedactionViolations` als Baseline für Moderation-Evidence-Redaction.
- `apps/server/src/moderation-rbac.test.ts`
  - prüft vollständige Matrixabdeckung für alle Rollen und Datenklassen.
  - prüft, dass Hidden-Match-Daten und AI-Debug nicht über Standard-Moderatorzugriff laufen.
  - prüft, dass Admin-Zugriff auf `D5_hidden_match_data` Break-Glass bleibt und nicht Standardzugriff wird.
  - prüft public-safe Evidence-Metadaten als erlaubtes Beispiel.
  - prüft verbotene Evidence-Muster für Roh-Tokens, Token-Hashes, FullState-/Hidden-Info, private Deckdaten, `AIInput`, `DecisionDebug` und lokale Pfade.

## Testmatrix

| Datenklasse | Admin | Moderator | Support | Reporter | Pflichtprüfung |
| --- | --- | --- | --- | --- | --- |
| `D0_public_lobby_metadata` | allow | allow | allow | own_only | keine Tokens, keine Decklisten |
| `D1_account_pii` | allow | redacted | redacted | own_only | PII nur minimal/redigiert |
| `D2_user_generated_content` | allow | allow | redacted | own_only | Chat/Reporttext bleibt UGC, nicht Engine/KI |
| `D3_public_replay_projection` | allow | allow | allow | own_only | public-safe Replay, StateHash, Hidden-Info-Barriere |
| `D4_side_private_projection` | break_glass | break_glass | deny | own_only | Standardzugriff verboten |
| `D5_hidden_match_data` | break_glass | deny | deny | deny | FullState/Hidden-Daten default-deny |
| `D6_ai_debug_data` | redacted | deny | deny | deny | `AIInput`/`DecisionDebug` nicht Standard-Evidence |
| `D7_ops_audit_data` | allow | redacted | redacted | deny | Tokens/PII/Metriklabels redigiert |

## Nicht-Freigaben

- Keine Moderationskonsole.
- Keine Report-, Sanktions- oder Evidence-Export-API.
- Keine Hidden-Info-Freigabe.
- Keine Engine-, Replay-, StateHash-, LegalAction- oder KI-Änderung.
- Kein LLM-Moderationspfad.

## Verifikation

- `corepack pnpm --filter @netgrid/server test -- moderation-rbac.test.ts`
- `corepack pnpm --filter @netgrid/server typecheck`
- `git diff --check`
