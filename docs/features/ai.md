# Mosaic AI — Frontend Feature Specification

**Status:** Planned / Last feature phase

## Purpose

Read-only natural-language querying over structured PropNest data.

Examples from the roadmap include:

- late-paying tenants
- leases expiring in a period
- highest maintenance costs
- property income summaries

The backend roadmap explicitly scopes this to read-only queries with no automated writes or decisions. fileciteturn5file17

## UX

```text
Question input
   ↓
Submit
   ↓
Processing state
   ↓
Answer
   ↓
Supporting data / references where available
```

## Safety boundary

The frontend must not present AI output as permission to perform an action.

No:

- write buttons generated from AI
- automatic workflow mutations
- autonomous decisions

## Acceptance criteria

- Query is submitted to an authenticated read-only API.
- User can distinguish generated explanation from underlying data.
- Errors are recoverable.
- Loading/cancel state is clear.
- No write endpoint is called from the AI surface.
