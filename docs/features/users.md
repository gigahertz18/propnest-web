# User Management — Frontend Feature Specification

**Status:** Implemented

## Actor

Admin.

Managers and regular users should not receive the administrative user-management UI.

## Routes

Current frontend route:

```text
/admin/users
```

Current API surface:

```text
GET    /api/users
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
```

The frontend API helper maps to those same-origin route handlers. fileciteturn6file15

## List behavior

The page:

- loads users after admin authentication is established
- displays the current user context
- supports create/edit/delete actions
- displays role and active-state badges
- uses modal/dialog states for create, edit, and delete

The current page redirects non-admin users back to `/dashboard`. fileciteturn6file13

## Create form

Required:

- full name
- username
- email
- password

Defaults:

- role = `user`
- active = `true`

## Edit form

The current `UserForm` sends only changed fields.

Password is optional during edit and is sent only when supplied. fileciteturn6file2

## Delete behavior

Delete is destructive and must require confirmation.

The frontend already expects backend errors such as:

- user not found
- cannot delete own account
- forbidden

These are surfaced as `ApiError`. fileciteturn6file1

## Acceptance criteria

- Non-admin users cannot use the page.
- Admin can create a valid user.
- Admin can edit only changed fields.
- Admin can update role and active state.
- Password is optional during edit.
- Admin must confirm deletion.
- Own-account deletion errors are shown clearly.
- List refreshes correctly after mutation.
- Loading/error/empty states are explicit.

## Tests

Cover:

- access restriction
- initial list
- create
- edit changed fields
- optional edit password
- validation/disabled submit
- backend errors
- delete confirmation
- successful delete
- self-delete failure
