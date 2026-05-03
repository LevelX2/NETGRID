# AI rules

- MVP 0.1 AI controls only Corp.
- AI may consume only Corp PlayerView, side-filtered PublicEvents, LegalActions, and explicit allowed metadata.
- AI must never receive full GameState.
- AI must never infer from hidden Runner grip or stack data.
- AI must pick only LegalActions.
- Add fallback behavior for timeout or invalid AI choice.
- AI tests must check no illegal action and no hidden-info input leak.
