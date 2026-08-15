# Audit Logs — Frontend Feature Specification

**Status:** Planned

## Actor

Admin.

## Purpose

Provide a read-only administrative view of system mutations.

The backend roadmap calls for:

- actor_id
- action
- entity_type
- entity_id
- JSON diff
- created_at

and an admin-only route to query logs. fileciteturn3file0

## List view

Suggested columns:

- timestamp
- actor
- action
- entity
- entity ID
- summary

## Filters

Recommended:

- date range
- actor
- action
- entity type
- entity ID

Do not build filters until the API supports them; start with supported query parameters only.

## Detail view

Show:

- actor
- action
- entity
- timestamp
- before/after or diff JSON

Sensitive fields should remain masked according to backend policy.

## Acceptance criteria

- Only authorized admins can access the page.
- Logs are read-only.
- Large diff payloads are readable without overwhelming the table.
- Loading/error/empty states are explicit.
- Filters do not create client-side pseudo-query semantics.

## Tests

- admin access
- non-admin redirect
- list
- empty
- filter parameters
- detail
- backend authorization failure
