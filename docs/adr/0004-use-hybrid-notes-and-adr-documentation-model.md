# ADR-0004: Use a hybrid Notes + ADR documentation model

- Status: Accepted
- Date: 2026-04-17
- Deciders: Project maintainers
- Related: `NOTES.md` Documentation Decision Log (2026-04-17)

## Context

The project needs both fast operational traceability and durable architectural decision records.

Using only `NOTES.md` makes long-lived decisions hard to find over time. Using only ADRs creates overhead for day-to-day execution logs, temporary diagnostics, and validation notes.

## Decision

Adopt a hybrid documentation model:

- `NOTES.md` remains the operational timeline (implementation steps, validations, incidents, temporary context).
- `docs/adr/` stores long-lived architecture decisions with rationale and consequences.
- Relevant `NOTES.md` entries should reference the ADR once a decision stabilizes.

## Consequences

### Positive

- Preserves delivery velocity for operational logging.
- Improves long-term discoverability of architectural rationale.
- Reduces review ambiguity by separating strategy from execution logs.

### Negative / Trade-offs

- Requires editorial discipline to promote mature decisions from `NOTES.md` to ADRs.
- Introduces dual maintenance points if links are not kept aligned.
- Adds small overhead during documentation updates.

### Follow-ups

- Keep an ADR index updated in `docs/adr/README.md`.
- Add explicit Notes-to-ADR references for promoted decisions.
- Review ADR set periodically and mark superseded records when needed.
